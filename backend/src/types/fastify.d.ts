import "fastify"
import type { ArticleRepository } from "../repositories/articleRepository"

declare module "fastify" {
  interface FastifyInstance {
    articleRepository: ArticleRepository
  }
}
