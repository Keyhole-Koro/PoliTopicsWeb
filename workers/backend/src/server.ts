import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { resolveArticleRepositoryMode } from "./config";
import { createApp } from "./index";
import { createDynamoArticleRepository } from "./repositories/articleRepository";
import { createMockArticleRepository } from "./repositories/mockArticleRepository";

config();

const port = Number(process.env.PORT || 4500);

const env = {
  APP_ENV: (process.env.APP_ENV as any) || "local",
  ARTICLE_REPOSITORY: process.env.ARTICLE_REPOSITORY as any,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "test",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "test",
  AWS_REGION: process.env.AWS_REGION || "ap-northeast-3",
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || "politopics-local",
  S3_ASSET_BUCKET: process.env.S3_ASSET_BUCKET || "politopics-articles-local",
  ASSET_BASE_URL: process.env.ASSET_BASE_URL,
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL || "http://localhost:4566",
  LOCALSTACK_ENDPOINT_URL: process.env.LOCALSTACK_ENDPOINT_URL || "http://localhost:4566",
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE || "true",
  STAGE_FRONTEND_URL: process.env.STAGE_FRONTEND_URL,
};

const repositoryMode = resolveArticleRepositoryMode(env);
const repositoryFactory = repositoryMode === "mock" ? createMockArticleRepository : createDynamoArticleRepository;
const app = createApp(repositoryFactory);

console.log(`Starting server on port ${port}...`);
console.log(`[WorkerBackend] Repository mode: ${repositoryMode}`);

serve({
  fetch: (request) => {
    return app.fetch(request, env);
  },
  port,
});
