import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.join(__dirname, "..")
const DIST_DIR = path.join(ROOT_DIR, "dist")
const DIST_NODE_MODULES = path.join(DIST_DIR, "node_modules")

if (!fs.existsSync(DIST_DIR)) {
  console.error("Dist directory not found. Run TypeScript build before preparing local bundle.")
  process.exit(1)
}

const pkgJsonPath = path.join(ROOT_DIR, "package.json")
const pkgLockPath = path.join(ROOT_DIR, "package-lock.json")
const distPkgJsonPath = path.join(DIST_DIR, "package.json")
const distPkgLockPath = path.join(DIST_DIR, "package-lock.json")

const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"))
delete pkgJson.type
fs.writeFileSync(distPkgJsonPath, JSON.stringify(pkgJson, null, 2))
if (fs.existsSync(pkgLockPath)) {
  fs.copyFileSync(pkgLockPath, distPkgLockPath)
}

if (fs.existsSync(DIST_NODE_MODULES)) {
  fs.rmSync(DIST_NODE_MODULES, { recursive: true, force: true })
}

console.log("Installing production dependencies into backend/dist...")
execSync("npm install --omit=dev --ignore-scripts --no-audit --no-fund", {
  cwd: DIST_DIR,
  stdio: "inherit",
})
