const { spawn } = require("child_process");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 4500;
const WEB_ROOT = path.join(__dirname, "..");
const DEFAULT_ASSET_BASE_URL = "http://localhost:4570";

function killPort() {
  try {
    execSync(`npx --yes kill-port ${PORT}`, { stdio: "inherit" });
  } catch (e) {
    // Port might not be in use.
  }
}

function cleanUp() {
  console.log("\nCleaning up...");
  killPort();
  process.exit(0);
}

killPort();

const nextDir = path.join(__dirname, "../frontend/.next");
if (fs.existsSync(nextDir)) {
  console.log("Cleaning .next directory...");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

process.on("SIGINT", cleanUp);
process.on("SIGTERM", cleanUp);

const assetBaseUrl = process.env.ASSET_BASE_URL || DEFAULT_ASSET_BASE_URL;
const assetBucket = process.env.S3_ASSET_BUCKET || "politopics-articles-local";

console.log(`[dev-nextjs-honoserver] Starting with mock DynamoDB data.`);
console.log(`[dev-nextjs-honoserver] Asset base URL: ${assetBaseUrl}`);

setTimeout(() => {
  const backendCommand =
    `PORT=${PORT} APP_ENV=local ARTICLE_REPOSITORY=mock ` +
    `ASSET_BASE_URL=${assetBaseUrl} S3_ASSET_BUCKET=${assetBucket} ` +
    `npx --yes tsx workers/backend/src/server.ts`;

  const child = spawn(
    `npx concurrently "npm run dev --prefix frontend" "${backendCommand}" "npm run dev:assets" --kill-others --prefix-colors auto`,
    {
      stdio: "inherit",
      shell: true,
      cwd: WEB_ROOT,
    }
  );

  child.on("close", (code) => {
    killPort();
    process.exit(code);
  });
}, 1000);
