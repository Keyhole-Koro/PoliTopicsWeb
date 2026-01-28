import type { Env } from "../types/env";
import type {
  Article,
  ArticleSummary,
  SearchFilters,
} from "../types/article";
import { DynamoArticleRepository } from "./dynamodb/repository";

export * from "./dynamodb/types";
export { DynamoArticleRepository } from "./dynamodb/repository";

export type HeadlinesResult = {
  items: ArticleSummary[];
  hasMore: boolean;
};

export interface ArticleRepository {
  getHeadlines(limit?: number, sort?: SearchFilters["sort"], offset?: number): Promise<HeadlinesResult>;
  searchArticles(filters: SearchFilters): Promise<ArticleSummary[]>;
  getArticle(id: string): Promise<Article | undefined>;
  getSuggestions(
    input: string,
    limit?: number,
    filters?: Pick<SearchFilters, "categories" | "houses" | "meetings" | "dateStart" | "dateEnd">
  ): Promise<string[]>;
}

/**
 * Create an article repository from the environment
 */
export function createArticleRepository(env: Env): ArticleRepository {
  return createDynamoArticleRepository(env);
}

export function createDynamoArticleRepository(env: Env): ArticleRepository {
  return new DynamoArticleRepository(env);
}
