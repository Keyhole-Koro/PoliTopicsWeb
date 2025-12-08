import { appConfig } from "./config"
import { createApp } from "./app"

const app = createApp()

app.listen(appConfig.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API ready on port ${appConfig.port}`)
})
