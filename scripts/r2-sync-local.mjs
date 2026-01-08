import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const buildDir = path.join(repoRoot, "frontend", "out");
const wranglerConfig = path.join(repoRoot, "wrangler.toml");

const workerEnv = process.env.WORKER_ENV ?? "local";
const bucketName = process.env.R2_BUCKET ?? "politopics-frontend-local";

async function main() {
  await assertDirExists(buildDir);

  ensureWranglerConfig();

  const files = await collectFiles(buildDir);
  if (files.length === 0) {
    console.warn(`[r2-sync] No files found under ${buildDir}`);
    return;
  }

  console.log(`[r2-sync] Uploading ${files.length} files to R2 bucket "${bucketName}" (env=${workerEnv})...`);
  for (const filePath of files) {
    const key = toObjectKey(buildDir, filePath);
    const result = runWrangler([
      "r2",
      "object",
      "put",
      `${bucketName}/${key}`,
      "--file",
      filePath,
      "--local",
      "--config",
      wranglerConfig,
      "--env",
      workerEnv,
    ]);
    if (result.status !== 0) {
      console.error(`[r2-sync] Failed to upload ${key}`);
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exit(result.status ?? 1);
    }
  }

  console.log("[r2-sync] Done.");
}

function ensureWranglerConfig() {
  if (!path.isAbsolute(wranglerConfig)) {
    throw new Error("wrangler config path must be absolute");
  }
}

function runWrangler(args) {
  return spawnSync("npx", ["--yes", "wrangler", ...args], {
    cwd: repoRoot,
    stdio: "pipe",
    env: process.env,
    encoding: "utf-8",
  });
}

async function assertDirExists(target) {
  try {
    const stat = await fs.stat(target);
    if (!stat.isDirectory()) {
      throw new Error(`${target} is not a directory`);
    }
  } catch (error) {
    console.error(`[r2-sync] Missing build output: ${target}`);
    throw error;
  }
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function toObjectKey(rootDir, filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative.split(path.sep).join("/");
}

main().catch((error) => {
  console.error("[r2-sync] Failed:", error);
  process.exit(1);
});
