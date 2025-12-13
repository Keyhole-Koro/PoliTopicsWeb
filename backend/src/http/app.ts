import Fastify from "fastify"
import cors from "@fastify/cors"
import repositoryPlugin from "../plugins/repository"
import articlesRoutes from "./routes/articles"

export async function createApp() {
  const app = Fastify({ logger: false })

  await app.register(cors, {
    origin: true,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })

  await app.register(repositoryPlugin)
  await app.register(articlesRoutes)

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ message: "Not Found" })
  })

  app.setErrorHandler((error, _request, reply) => {
    // eslint-disable-next-line no-console
    console.error(error)
    reply.status(500).send({ message: "Unexpected error" })
  })

  return app
}
