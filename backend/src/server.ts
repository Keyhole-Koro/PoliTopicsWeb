import { appConfig } from "./config"
import { createApp } from "./http/app"

async function start() {
  try {
    console.log("Creating application...")
    const app = await createApp()
    console.log("Application created. Starting server...")

    await app.listen({ port: appConfig.port, host: "0.0.0.0" })
    // eslint-disable-next-line no-console
    console.log(`✅ Backend API ready on port ${appConfig.port}`)
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

void start()
