import Fastify from "fastify"
import cors from "@fastify/cors"
import repositoryPlugin from "../plugins/repository"
import articlesRoutes from "./routes/articles"
import { notifyAccessLog, notifyServerError } from "../notifications"

export async function createApp() {
  const app = Fastify({ logger: true })

  app.addHook("onRequest", (request, _reply, done) => {
    ;(request as any)._receivedAt = Date.now()
    done()
  })

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

  app.setErrorHandler(async (error, request, reply) => {
    request.log.error(error)
    await notifyServerError({
      requestId: String(request.id ?? "unknown"),
      method: request.method,
      path: request.raw.url ?? request.url ?? "/",
      statusCode: 500,
      error,
    })
    reply.status(500).send({ message: "Internal error" })
  })

  app.addHook("onResponse", async (request, reply) => {
    if (reply.statusCode < 400) return
    const started = (request as any)._receivedAt
    const durationMs = typeof started === "number" ? Math.max(0, Date.now() - started) : undefined

    await notifyAccessLog({
      requestId: String(request.id ?? "unknown"),
      method: request.method,
      path: request.raw.url ?? request.url ?? "/",
      statusCode: reply.statusCode,
      durationMs,
      userAgent: request.headers["user-agent"],
    })
  })

  return app
}
