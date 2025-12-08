import { appConfig } from "./config"
import { createApp } from "./app"

try {
  console.log("Creating application...")
  const app = createApp()
  console.log("Application created. Starting server...")

  app.listen(appConfig.port, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Backend API ready on port ${appConfig.port}`)
  })
} catch (error) {
  console.error("❌ Failed to start server:", error)
  process.exit(1)
}
