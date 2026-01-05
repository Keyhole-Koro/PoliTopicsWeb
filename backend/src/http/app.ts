import Fastify from "fastify"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
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

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(swagger, {
    openapi: {
      info: {
        title: "PoliTopics API",
        description: "API for PoliTopics",
        version: "0.1.0",
      },
      servers: [],
    },
    transform: jsonSchemaTransform,
  })

  await app.register(swaggerUi, {
    routePrefix: "/docs",
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
