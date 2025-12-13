import fp from "fastify-plugin"
import type { FastifyInstance } from "fastify"
import { createArticleRepository } from "../repositories/factory"

async function repositoryPlugin(fastify: FastifyInstance) {
  fastify.decorate("articleRepository", createArticleRepository())
}

export default fp(repositoryPlugin)
