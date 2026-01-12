import fs from "fs"
import path from "path"
import archiver from "archiver"

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const DIST_DIR = path.join(__dirname, "..", "dist")
const INPUT_FILE = path.join(DIST_DIR, "index.js")
const OUTPUT_ZIP = path.join(DIST_DIR, "headlines-cron.zip")

if (!fs.existsSync(INPUT_FILE)) {
  throw new Error(`Bundle not found: ${INPUT_FILE}. Run npm run bundle first.`)
}

fs.mkdirSync(DIST_DIR, { recursive: true })

const output = fs.createWriteStream(OUTPUT_ZIP)
const archive = archiver("zip", { zlib: { level: 9 } })

output.on("close", () => {
  console.log(`[zip] wrote ${OUTPUT_ZIP} (${archive.pointer()} bytes)`)
})

archive.on("warning", (err) => {
  if (err.code === "ENOENT") {
    console.warn(err)
    return
  }
  throw err
})

archive.on("error", (err) => {
  throw err
})

archive.pipe(output)
archive.file(INPUT_FILE, { name: "index.js" })
await archive.finalize()
