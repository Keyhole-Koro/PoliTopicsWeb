#!/usr/bin/env node

const { execSync, spawnSync } = require("child_process");
const net = require("net");
const path = require("path");
const { resolveConfig } = require("./e2econfig");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--preset") {
      args.preset = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--preset=")) {
      args.preset = arg.split("=")[1];
      continue;
    }
    if (arg === "--skip-playwright-install") {
      args.skipPlaywrightInstall = true;
      continue;
    }
  }
  return args;
}

function log(message) {
  console.log(`[e2e] ${message}`);
}

function requireCommand(command) {
  const result = spawnSync("bash", ["-lc", `command -v ${command}`], { stdio: "ignore" });
  if (result.status !== 0) {
    console.error(`[e2e] Missing required command: ${command}`);
    process.exit(1);
  }
}

function run(command, options = {}) {
  execSync(command, {
    stdio: "inherit",
    cwd: options.cwd,
    env: options.env || process.env,
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

function findOpenPort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = resolveConfig({ preset: args.preset, env: process.env });
  const webRoot = path.resolve(__dirname, "..");

  requireCommand("npm");
  requireCommand("node");
  requireCommand("npx");
  requireCommand("terraform");

  let backendUrl = process.env.E2E_BACKEND_URL;
  if (!backendUrl) {
    if (await isPortFree(config.backendDefaultPort)) {
      backendUrl = `http://127.0.0.1:${config.backendDefaultPort}`;
    } else {
      const openPort = await findOpenPort();
      backendUrl = `http://127.0.0.1:${openPort}`;
      log(`Port ${config.backendDefaultPort} is in use; selected ${openPort} instead.`);
    }
  }

  log(`Preset: ${config.preset}`);
  log(`Using backend API URL: ${backendUrl}`);

  if (!(process.env.SKIP_PLAYWRIGHT_INSTALL === "true" || args.skipPlaywrightInstall)) {
    log("Ensuring Playwright browsers are installed...");
    run("npx playwright install", { cwd: webRoot });
  }

  log("Ensuring LocalStack resources...");
  run("bash scripts/ensure-localstack.sh", { cwd: webRoot });

  log("Installing mock article seed dependencies...");
  run("npm --prefix terraform/seed ci", { cwd: webRoot });

  log("Installing backend worker dependencies...");
  run("npm --prefix workers/backend ci", { cwd: webRoot });

  log("Seeding mock dataset into LocalStack (DynamoDB + S3)...");
  run(
    `node terraform/seed/upload_articles.js --endpoint ${config.localstackEndpoint} --s3-endpoint ${config.localstackEndpoint}`,
    { cwd: webRoot }
  );

  log("Building frontend for local env against LocalStack API...");
  run("npm --prefix frontend run build:local", {
    cwd: webRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: backendUrl,
      NEXT_PUBLIC_ASSET_BASE_URL: config.localstackEndpoint,
    },
  });

  log("Syncing built assets to local R2 (Miniflare)...");
  run("node scripts/sync-frontend-to-r2-local.mjs", { cwd: webRoot });

  log("Running Playwright E2E...");
  run("npx playwright test", {
    cwd: webRoot,
    env: {
      ...process.env,
      ...config.env,
      E2E_BASE_URL: config.e2eBaseUrl,
      E2E_BACKEND_URL: backendUrl,
      LOCALSTACK_URL: config.localstackUrl,
      LOCALSTACK_ENDPOINT: config.localstackEndpoint,
    },
  });

  log("Done.");
}

main().catch((error) => {
  console.error("[e2e] Failed:", error);
  process.exit(1);
});
