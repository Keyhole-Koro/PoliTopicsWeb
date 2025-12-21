import Fastify from "fastify"
import cors from "@fastify/cors"
import repositoryPlugin from "../plugins/repository"
import articlesRoutes from "./routes/articles"

export async function createApp() {
  const app = Fastify({ logger: true })

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

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)
    reply.status(500).send({ message: "Internal error" })
  })

  return app
}
