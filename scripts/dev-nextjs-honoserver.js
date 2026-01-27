const { spawn } = require("child_process");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolveConfig } = require("./e2econfig");

const WEB_ROOT = path.join(__dirname, "..");

// Parse arguments to allow preset override, though we default to 'mock' for this script.
const args = process.argv.slice(2);
const presetArg = args.find(arg => arg.startsWith('--preset='))?.split('=')[1] || 'mock';

const config = resolveConfig({ preset: presetArg, env: process.env });
const PORT = config.backendDefaultPort;

function killPort(port) {
  try {
    execSync(`npx --yes kill-port ${port}`, { stdio: "inherit" });
  } catch (e) {
    // Port might not be in use.
  }
}

function cleanUp() {
  console.log("\nCleaning up...");
  killPort(PORT);
  // Also kill frontend port if possible/needed, but usually kill-others handles it.
  process.exit(0);
}

killPort(PORT);

const nextDir = path.join(__dirname, "../frontend/.next");
if (fs.existsSync(nextDir)) {
  console.log("Cleaning .next directory...");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

process.on("SIGINT", cleanUp);
process.on("SIGTERM", cleanUp);

console.log(`[dev-nextjs-honoserver] Starting with preset: ${config.preset}`);
console.log(`[dev-nextjs-honoserver] Asset base URL: ${config.env.ASSET_BASE_URL}`);
console.log(`[dev-nextjs-honoserver] Repository Mode: ${config.env.ARTICLE_REPOSITORY}`);

// Construct environment variables string for the backend command
const backendEnvVars = Object.entries(config.env)
  .map(([key, value]) => `${key}=${value}`)
  .join(" ");

setTimeout(() => {
  const backendCommand = `PORT=${PORT} ${backendEnvVars} npx --yes tsx workers/backend/src/server.ts`;
  
  // Use config values for asset server if needed, but dev:assets script handles it simply now.
  // Ideally, we should pass the port to dev:assets or local-asset-server.js too if it differs.
  // For now, we assume standard local asset setup.
  
  const child = spawn(
    `npx concurrently "npm run dev --prefix frontend" "${backendCommand}" "npm run dev:assets" --kill-others --prefix-colors auto`,
    {
      stdio: "inherit",
      shell: true,
      cwd: WEB_ROOT,
    }
  );

  child.on("close", (code) => {
    killPort(PORT);
    process.exit(code);
  });
}, 1000);