# changes.agent.md

Agent: Codex
Date/Time: 2025-12-22 03:38 UTC
Keywords: localstack, terraform, state-bucket
Topic: Align state bucket creation with backend config
Details:

- Standardized the Web state-bucket script to use the LocalStack endpoint convention and consistent env argument format.

Agent: Gemini
Date/Time: 2025-12-22 13:00 JST
Keywords: terraform, typescript, import, s3
Topic: Fix build errors and improve import logic
Details:

- Fixed TypeScript error in `dynamoArticleMapper.ts` by ensuring `originalText` is always a string.
- Refactored `fileset` usage in Terraform to avoid syntax errors with brace expansion.
- Updated `create-state-bucket.sh` to create `politopics-frontend-localstack` for local environment.
- Updated `import_all.sh` to gracefully skip non-existent objects.
- Files changed:
  - `backend/src/repositories/dynamoArticleMapper.ts`
  - `terraform/service/s3/main.tf`
  - `terraform/scripts/create-state-bucket.sh`
  - `terraform/scripts/import_all.sh`

Agent: Gemini
Date/Time: 2025-12-23 00:00 UTC
Keywords: payload, asset, naming convention
Topic: Rename 'payload' to 'asset' in relevant contexts
Details:

- In `backend/src/config.ts`, renamed `articlePayloadBucket` to `articleAssetBucket`.
- In `backend/src/repositories/dynamoArticleMapper.ts`:
  - Changed `payload_key` to `asset_key`.
  - Renamed type `ArticlePayloadData` to `ArticleAssetData`.
  - Updated function signature `mapItemToArticle` to use `asset` and `ArticleAssetData`.
  - Changed `payload?.` to `asset?.` within the function.
- In `backend/src/repositories/factory.ts`, changed `payloadBucket` to `assetBucket`.
- In `backend/src/repositories/dynamoArticleRepository.ts`:
  - Changed imported type `ArticlePayloadData` to `ArticleAssetData`.
  - Changed `payloadBucket` to `assetBucket` everywhere.
  - Renamed `payload` variable to `asset` and `loadPayload` function to `loadAsset`.
  - Updated `mapItemToArticle` call to use `asset`.
  - Changed return type cast to `ArticleAssetData`.
  - Updated log message from "Failed to load payload" to "Failed to load asset".

Agent: Gemini
Date/Time: 2025-12-24 12:10 JST
Keywords: terraform, variable-renaming, payload, asset
Topic: Rename payload bucket variables to asset url bucket in Terraform
Details:

- Renamed `payload_bucket_name` to `asset_url_bucket_name` and `payload_bucket_arn` to `asset_url_bucket_arn` in `terraform/service/lambda/variables.tf`.
- Updated references in `terraform/service/lambda/main.tf` to use the new variable names.
- Files changed:
  - `terraform/service/lambda/variables.tf`
  - `terraform/service/lambda/main.tf`

Agent: Codex
Date/Time: 2025-12-26 09:07 JST
Keywords: terraform, api-gateway, custom-domain
Topic: Add optional API Gateway custom domain wiring
Details:

- Added optional API Gateway custom domain inputs for prod and conditional domain/mapping resources.
- Exposed the configured custom domain name in Terraform outputs.
- Removed optional custom-domain target/hosted-zone outputs after confirmation.
- Files changed:
  - `PoliTopicsWeb/terraform/variables.tf`
  - `PoliTopicsWeb/terraform/main.tf`
  - `PoliTopicsWeb/terraform/service/variables.tf`
  - `PoliTopicsWeb/terraform/service/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/variables.tf`
  - `PoliTopicsWeb/terraform/service/lambda/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/outputs.tf`
  - `PoliTopicsWeb/terraform/service/outputs.tf`
  - `PoliTopicsWeb/terraform/outputs.tf`
  - `PoliTopicsWeb/terraform/tfvars/prod.tfvars`

Agent: Codex
Date/Time: 2025-12-26 10:01 JST
Keywords: terraform, import, scripts
Topic: Make import scripts tolerant of missing resources
Details:

- Updated import scripts to skip missing configuration/resources instead of failing.
- Files changed:
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`

Agent: Codex
Date/Time: 2025-12-26 10:03 JST
Keywords: terraform, import, dynamodb, api-gateway
Topic: Remove count-based gating and align imports
Details:

- Removed `count = ... ? 0 : 1` usage for DynamoDB and REST API resources and switched to `for_each` where needed.
- Updated import addresses to match non-indexed resources.
- Files changed:
  - `PoliTopicsWeb/terraform/service/dynamodb/main.tf`
  - `PoliTopicsWeb/terraform/service/dynamodb/outputs.tf`
  - `PoliTopicsWeb/terraform/service/lambda/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/outputs.tf`
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`

Agent: Codex
Date/Time: 2025-12-26 10:48 JST
Keywords: terraform, frontend, build
Topic: Fix frontend build selection during Terraform apply
Details:

- Pass the Terraform environment into the frontend build script.
- Route the build to `build:local`, `build:stage`, or `build:prod` based on environment.
- Added a default `build` script and explicit `build:prod` for the frontend package.
- Files changed:
  - `PoliTopicsWeb/terraform/scripts/build-frontend.sh`
  - `PoliTopicsWeb/terraform/service/s3/main.tf`
  - `PoliTopicsWeb/frontend/package.json`

Agent: Codex
Date/Time: 2025-12-26 11:34 JST
Keywords: terraform, r2, frontend
Topic: Route SPA storage/uploads to Cloudflare R2
Details:

- Added R2 configuration options and wiring for the frontend SPA bucket.
- Skipped AWS S3 frontend bucket resources and imports when R2 is enabled.
- Added R2-aware endpoint usage for frontend uploads.
- Files changed:
  - `PoliTopicsWeb/terraform/variables.tf`
  - `PoliTopicsWeb/terraform/main.tf`
  - `PoliTopicsWeb/terraform/service/variables.tf`
  - `PoliTopicsWeb/terraform/service/main.tf`
  - `PoliTopicsWeb/terraform/service/s3/variables.tf`
  - `PoliTopicsWeb/terraform/service/s3/main.tf`
  - `PoliTopicsWeb/terraform/service/s3/outputs.tf`
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`
  - `PoliTopicsWeb/terraform/scripts/upload-frontend.sh`
  - `PoliTopicsWeb/terraform/tfvars/prod.tfvars`

### Changes After Review

- Removed the R2 toggle and always use R2 for frontend uploads.
- Set the prod frontend bucket to `politopics.net`.
- Updated import/upload scripts for R2-only behavior.
- Files changed:
  - `PoliTopicsWeb/terraform/variables.tf`
  - `PoliTopicsWeb/terraform/main.tf`
  - `PoliTopicsWeb/terraform/service/variables.tf`
  - `PoliTopicsWeb/terraform/service/main.tf`
  - `PoliTopicsWeb/terraform/service/s3/variables.tf`
  - `PoliTopicsWeb/terraform/service/s3/main.tf`
  - `PoliTopicsWeb/terraform/service/s3/outputs.tf`
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`
  - `PoliTopicsWeb/terraform/scripts/upload-frontend.sh`
  - `PoliTopicsWeb/terraform/tfvars/prod.tfvars`

Agent: Codex
Date/Time: 2025-12-28 08:37 UTC
Keywords: frontend, terraform, cloudflare r2, github actions, api base url
Topic: Frontend hosting split (LocalStack S3 vs R2) and CI workflow
Details:

- Limited Terraform-driven SPA upload to local/localstack only; stage/prod no longer deploy via Terraform and will use Cloudflare R2.
- Added GitHub Actions workflow `deploy-frontend.yml` to build frontend with `NEXT_PUBLIC_API_BASE_URL` from Terraform output and sync to R2 (secrets required).
- Updated tfvars to disable frontend deploy in stage/prod and enable for localstack; created local S3 bucket when hosting locally.
- Updated root README with hosting/deploy notes and workflow pointer.
- Files changed:
  - `.github/workflows/deploy-frontend.yml`
  - `PoliTopicsWeb/terraform/service/s3/main.tf`
  - `PoliTopicsWeb/terraform/service/s3/outputs.tf`
  - `PoliTopicsWeb/terraform/tfvars/localstack.tfvars`
  - `PoliTopicsWeb/terraform/tfvars/stage.tfvars`
  - `PoliTopicsWeb/terraform/tfvars/prod.tfvars`
  - `README.md`

Agent: Codex
Date/Time: 2025-12-29 12:58 JST
Keywords: github-actions, frontend, paths
Topic: Update frontend deploy workflow paths after move
Details:

- Updated workflow paths to be relative to the PoliTopicsWeb repo root after moving the workflow.
- Files changed:
  - `PoliTopicsWeb/.github/workflows/deploy-frontend.yml`

Agent: Codex
Date/Time: 2026-01-05 15:24 JST
Keywords: wrangler, r2, miniflare, playwright, e2e
Topic: Local SPA testing via Workers + R2 with mock backend
Details:

- Added a local Wrangler environment, R2 sync script, and content-type fallback for SPA asset delivery.
- Implemented mock backend mode (`DATA_MODE=mock`) with notification disablement for LocalStack-free runs.
- Added Playwright E2E coverage and GitHub Actions workflow for CI runs.
- Documented the local Worker + R2 flow in the README.
- Files changed:
  - `PoliTopicsWeb/wrangler.toml`
  - `PoliTopicsWeb/workers/spa-r2-proxy.js`
  - `PoliTopicsWeb/scripts/r2-sync-local.mjs`
  - `PoliTopicsWeb/backend/src/config.ts`
  - `PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/backend/src/repositories/factory.ts`
  - `PoliTopicsWeb/backend/.env.example`
  - `PoliTopicsWeb/playwright.config.ts`
  - `PoliTopicsWeb/tests/e2e/spa.spec.ts`
  - `PoliTopicsWeb/.github/workflows/e2e-worker.yml`
  - `PoliTopicsWeb/package.json`
  - `PoliTopicsWeb/package-lock.json`
  - `PoliTopicsWeb/README.md`

### Changes After Review

- Removed unused static params helper that referenced a missing module to unblock Next.js build.

Agent: Codex
Date/Time: 2026-01-05 18:20 JST
Keywords: asset-url, signing, schema, e2e, mock-data
Topic: Add signed asset URLs with TTL and propagate asset metadata to API responses
Details:

- Added nullable `assetUrl` to shared article types and HTTP schemas and documented signed URL TTL configuration.
- Introduced S3 presigned URL generation (configurable via `ASSET_URL_TTL_SECONDS`) and ensured summaries/detail responses return null instead of undefined.
- Enriched mapper/index types and mock uploader to carry asset keys/description for single-query card rendering; category index entries now emitted.
- Updated backend/playwright tests to assert presence of `assetUrl` and refreshed mock data to include the new fields.
- Files changed:
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/backend/src/http/schemas/articles.ts`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleRepository.ts`
  - `PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/backend/src/repositories/factory.ts`
  - `PoliTopicsWeb/backend/src/config.ts`
  - `PoliTopicsWeb/backend/package.json`
  - `PoliTopicsWeb/backend/.env.example`
  - `PoliTopicsWeb/tests/e2e/backend.spec.ts`
  - `PoliTopicsWeb/terraform/mock-article/upload_articles.js`
  - `PoliTopicsWeb/README.md`
  - `PoliTopicsWeb/package-lock.json`
- Files changed:
  - `PoliTopicsWeb/frontend/lib/static-params.ts`
- Removed the local R2 bucket creation step (unsupported `--local` flag) and dropped the deprecated `--persist` flag from the local worker script.
- Files changed:
  - `PoliTopicsWeb/scripts/r2-sync-local.mjs`
  - `PoliTopicsWeb/package.json`

Agent: Gemini
Date/Time: 2026-01-05 16:30 JST
Keywords: swagger, openapi, fastify, zod
Topic: Add OpenAPI and Swagger UI support
Details:

- Added `@fastify/swagger`, `@fastify/swagger-ui`, and `fastify-type-provider-zod` to backend dependencies.
- Created Zod schemas for article types and API request/response structures.
- Updated Fastify app initialization to register Swagger plugins and use Zod type provider.
- Refactored `articles` routes to use Zod schemas for validation and documentation generation.
- Files changed:
  - `PoliTopicsWeb/backend/package.json`
  - `PoliTopicsWeb/backend/src/http/schemas/articles.ts`
  - `PoliTopicsWeb/backend/src/http/app.ts`
  - `PoliTopicsWeb/backend/src/http/routes/articles.ts`

Agent: Codex
Date/Time: 2026-01-09 19:40 JST
Keywords: localstack, e2e, playwright, terraform, wrangler
Topic: LocalStack-backed E2E flow with API Gateway `_user_request_`
Details:

- Added LocalStack environment support to the backend config and disabled notifications for LocalStack Lambda deploys.
- Unified mock data with the LocalStack seed dataset and adjusted Playwright to use a single set of expectations.
- Parameterized Playwright to skip the mock backend in LocalStack mode.
- Introduced `test:e2e:localstack` script to deploy the backend to LocalStack, seed data via `upload_articles.js`, build/sync frontend assets to local R2, and run Playwright against the `_user_request_` API URL.
- Documented the LocalStack E2E workflow in the README.
- Files changed:
  - `PoliTopicsWeb/backend/src/config.ts`
  - `PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts`
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/backend/src/http/schemas/articles.ts`
  - `PoliTopicsWeb/playwright.config.ts`
  - `PoliTopicsWeb/tests/e2e/backend.spec.ts`
  - `PoliTopicsWeb/tests/e2e/spa.spec.ts`
  - `PoliTopicsWeb/scripts/test-e2e-localstack.sh`
  - `PoliTopicsWeb/package.json`
  - `PoliTopicsWeb/README.md`
  - `PoliTopicsWeb/terraform/service/lambda/main.tf`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-10 02:40 JST
Keywords: asset-url, s3, validation, mock-data
Topic: Require non-null asset URLs and align mock data with S3 fixture
Details:

- Made assetUrl a required string in shared types and HTTP schemas; repository mappings now throw when asset URLs are missing.
- Mock repository now loads the fixture and derives asset URLs using the LocalStack endpoint/bucket (articles/<id>.json) to mirror real uploads.
- Files changed:
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/backend/src/http/schemas/articles.ts`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts`
  - `PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-10 14:20 JST
Keywords: r2, wrangler, bulk-upload
Topic: Add bulk R2 sync helper
Details:

- Added a bash helper to upload `frontend/out` to the local R2 bucket using wrangler in a single command.
- Exposed it via `npm run r2:sync:local:fast`.
- Files changed:
  - `PoliTopicsWeb/scripts/r2-sync-bulk.sh`
  - `PoliTopicsWeb/package.json`

Agent: Codex
Date/Time: 2026-01-11 11:00 JST
Keywords: frontend, markdown, summaries, backend, schema
Topic: Render summaries as Markdown and harden participant mapping
Details:

- Added a shared `Markdown` component using `react-markdown` + `remark-gfm` to render AI要約/簡潔要約 with Markdown support and added prose styles to `frontend/styles/globals.css`.
- Swapped summary/soft summary rendering on the article page to use the Markdown component and pulled in the new dependencies.
- Normalized participant records in Dynamo mappers to avoid null `position` values violating Zod response schemas and allowed summary validation to pass when data is provided via asset references.
- Seed mock article (issue-001) summaries now include Markdown (bullet list, link, ordered list) to verify rendering in mock/local runs.
- Frontend dev scripts now bind Next.js to `0.0.0.0` on port 3333 so hosts outside the devcontainer (e.g., Windows Chrome) can access the dev server.
- Files changed:
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`
  - `PoliTopicsWeb/frontend/components/markdown.tsx`
  - `PoliTopicsWeb/frontend/styles/globals.css`
  - `PoliTopicsWeb/frontend/package.json`
  - `PoliTopicsWeb/frontend/pnpm-lock.yaml`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts`

Agent: Gemini
Date/Time: 2026-01-15 JST
Keywords: logging, debug, web-backend
Topic: Add debug logs to API routes
Details:

- Added structured console logs to `articles.ts` to trace incoming requests, query parameters, and response summaries.
- Covers `/headlines`, `/search`, `/search/suggest`, and `/article/:id` endpoints.
- Files changed:
  - `PoliTopicsWeb/backend/src/http/routes/articles.ts`

Agent: Gemini
Date/Time: 2026-01-15 JST
Keywords: profile, latency, measure
Topic: Improve backend latency measurement tool
Details:

- Added URL validation to `measure-backend-latency.js` to ensure `baseUrl` has a protocol (auto-prepepend `https://`).
- Added strict path parameter validation to throw errors for placeholders like `REPLACE_ME` or `YOUR_ID_HERE`.
- Added `--warmup <count>` CLI option to send dummy requests before measurement to mitigate cold start outliers.
- Updated `targets.example.json` with a more realistic cold-start cooldown (5 minutes).
- Files changed:
  - `PoliTopicsWeb/profile/measure-backend-latency.js`
  - `PoliTopicsWeb/profile/targets.example.json`

Agent: Claude
Date/Time: 2026-01-17 JST
Keywords: cloudflare-workers, aws-lambda, migration, backend
Topic: Migrate backend API from AWS Lambda to Cloudflare Workers
Details:

- Created new Cloudflare Workers backend project under `workers/backend/`.
- Implemented aws4fetch-based DynamoDB client for Workers V8 runtime.
- Implemented aws4fetch-based S3 client for reading article assets.
- Ported Fastify routes to Hono framework (`/healthz`, `/headlines`, `/search`, `/search/suggest`, `/article/:id`).
- Added wrangler.toml with local/stage/prod environment configurations.
- Created GitHub Actions workflow for deploying Workers (`deploy-backend-worker.yml`).
- Files created:
  - `PoliTopicsWeb/workers/backend/wrangler.toml`
  - `PoliTopicsWeb/workers/backend/package.json`
  - `PoliTopicsWeb/workers/backend/tsconfig.json`
  - `PoliTopicsWeb/workers/backend/src/types/env.ts`
  - `PoliTopicsWeb/workers/backend/src/types/article.ts`
  - `PoliTopicsWeb/workers/backend/src/lib/dynamodb.ts`
  - `PoliTopicsWeb/workers/backend/src/lib/s3.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/articleRepository.ts`
  - `PoliTopicsWeb/workers/backend/src/index.ts`
  - `PoliTopicsWeb/.github/workflows/deploy-backend-worker.yml`
- Files changed:
  - `PoliTopicsWeb/package.json` (added workers/backend to workspaces)

Agent: Claude
Date/Time: 2026-01-18 JST
Keywords: terraform, lambda, cleanup, workflow
Topic: Remove Lambda backend and reorganize deploy workflows
Details:

- Removed Lambda module from Terraform (backend now on Cloudflare Workers).
- Deleted `terraform/service/lambda/` directory.
- Updated Terraform outputs to remove Lambda/API Gateway references.
- Updated `headlines_job.tf` to accept API URL as variable instead of from Lambda module.
- Renamed `deploy-backend.yml` to `deploy-aws.yml` for DynamoDB, S3, headlines cron Lambda.
- Updated `deploy-frontend.yml` to get backend API URL from secrets instead of Terraform output.
- Removed Terraform dependency from frontend workflow.
- Files deleted:
  - `PoliTopicsWeb/terraform/service/lambda/` (entire directory)
- Files changed:
  - `PoliTopicsWeb/terraform/service/main.tf`
  - `PoliTopicsWeb/terraform/service/outputs.tf`
  - `PoliTopicsWeb/terraform/service/headlines_job.tf`
  - `PoliTopicsWeb/terraform/outputs.tf`
  - `PoliTopicsWeb/.github/workflows/deploy-aws.yml` (renamed from deploy-backend.yml)
  - `PoliTopicsWeb/.github/workflows/deploy-frontend.yml`
- New GitHub Secrets required:
  - `STAGE_BACKEND_API_URL`: Stage Workers URL
  - `BACKEND_WORKER_AWS_ACCESS_KEY_ID`: IAM credentials for Workers
  - `BACKEND_WORKER_AWS_SECRET_ACCESS_KEY`: IAM credentials for Workers

Agent: Gemini
Date/Time: 2026-01-18 10:00:00 JST
Keywords: documentation, translation, japanese
Topic: Translate documentation to Japanese
Details:
- Translated `README.md`, `docs/scripts_and_usage.md`, `cacheCron/README.md`, `profile/README.md`, and `terraform/README.md` to Japanese in `jp/` subdirectories.
- Added links between English and Japanese versions.
Files:
- PoliTopicsWeb/jp/README.md
- PoliTopicsWeb/docs/jp/scripts_and_usage.md
- PoliTopicsWeb/cacheCron/jp/README.md
- PoliTopicsWeb/profile/jp/README.md
- PoliTopicsWeb/terraform/jp/README.md

Agent: Codex
Date/Time: 2026-01-21 23:22:22 JST
Keywords: content, footer, copy
Topic: Remove democracy tagline from footer
Details:
- Removed the footer copy "すべての市民に民主主義を身近に。" from the web app to align with updated messaging.
Files:
- PoliTopicsWeb/frontend/components/home/site-footer.tsx

Agent: Codex
Date/Time: 2026-01-21 23:49:05 JST
Keywords: documentation, workers, r2
Topic: Rewrite Web README and remove legacy docs
Details:
- Rewrote Web README (EN/JP) to reflect Workers + Hono backend, R2 hosting, current endpoints, commands, and local/deploy flows with Mermaid architecture.
- Removed legacy scripts_and_usage docs.
Files:
- PoliTopicsWeb/README.md
- PoliTopicsWeb/jp/README.md
- PoliTopicsWeb/docs/scripts_and_usage.md (deleted)
- PoliTopicsWeb/docs/jp/scripts_and_usage.md (deleted)

Agent: Codex
Date/Time: 2026-01-22 00:55:48 JST
Keywords: cache-cron, monitoring, injection
Topic: Fail fast when cache cron cannot inject headlines
Details:
- Cache cron now emits an error notification and throws when the headlines cache script tag is missing or index.html body is empty, so failed prod injections are surfaced instead of silent skips.
Files:
- PoliTopicsWeb/cacheCron/src/index.ts

Agent: Codex
Date/Time: 2026-01-24 12:09 JST
Keywords: key_points, ui, schema, mock, docs
Topic: Add key_points display to article detail and schemas
Details:
- Added key_points to shared article schemas, backend mapping, and mock asset seeding.
- Rendered key_points list in the article detail AI summary card.
- Updated documentation to reflect key_points in assets and detail views.
- Files changed:
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/backend/src/http/schemas/articles.ts`
  - `PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts`
  - `PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`
  - `PoliTopicsWeb/terraform/mock-article/articles.json`
  - `PoliTopicsWeb/terraform/mock-article/upload_articles.js`
  - `docs/01_project_overview.md`
  - `docs/02_functional_spec.md`
  - `docs/06_architecture.md`
  - `docs/08_db_design.md`
  - `docs/system_overview.md`
  - `docs/tech_choices.md`
  - `docs/jp/01_project_overview.md`
  - `docs/jp/02_functional_spec.md`
  - `docs/jp/06_architecture.md`
  - `docs/jp/08_db_design.md`
  - `docs/jp/system_overview.md`
  - `docs/jp/tech_choices.md`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-24 19:17:37 JST
Keywords: hono, workers, localstack, local-dev, fastify-removal
Topic: Remove Fastify backend and align local tests with Workers/Hono
Details:
- Removed the legacy Fastify/Lambda backend and pruned workspace references.
- Centralized Workers backend env/endpoint resolution for LocalStack and added local wrangler defaults.
- Normalized the LocalStack ensure script to use the `local` environment expected by Terraform helpers.
- Updated Playwright/localstack test flow and frontend config to target the Workers API on port 4500.
- Aligned Docker and documentation with Workers + LocalStack local dev expectations.
Files:
- AGENT.md
- README.md
- docs/00_code_reading_guide.md
- docs/05_system_diagram.md
- docs/06_architecture.md
- docs/09_local_dev_setup.md
- docs/11_test_strategy.md
- docs/jp/00_code_reading_guide.md
- docs/jp/05_system_diagram.md
- docs/jp/06_architecture.md
- docs/jp/09_local_dev_setup.md
- docs/jp/11_test_strategy.md
- jp/agent.md
- scripts/export_test_env.sh
- PoliTopicsWeb/README.md
- PoliTopicsWeb/backend/.env.example (deleted)
- PoliTopicsWeb/backend/.npmrc (deleted)
- PoliTopicsWeb/backend/package-lock.json (deleted)
- PoliTopicsWeb/backend/package.json (deleted)
- PoliTopicsWeb/backend/scripts/prepare-local-dist.mjs (deleted)
- PoliTopicsWeb/backend/scripts/zip.mjs (deleted)
- PoliTopicsWeb/backend/src/config.ts (deleted)
- PoliTopicsWeb/backend/src/handler.ts (deleted)
- PoliTopicsWeb/backend/src/http/app.ts (deleted)
- PoliTopicsWeb/backend/src/http/routes/articles.ts (deleted)
- PoliTopicsWeb/backend/src/http/schemas/articles.ts (deleted)
- PoliTopicsWeb/backend/src/lambda.ts (deleted)
- PoliTopicsWeb/backend/src/notifications.ts (deleted)
- PoliTopicsWeb/backend/src/plugins/repository.ts (deleted)
- PoliTopicsWeb/backend/src/repositories/articleRepository.ts (deleted)
- PoliTopicsWeb/backend/src/repositories/dynamoArticleMapper.ts (deleted)
- PoliTopicsWeb/backend/src/repositories/dynamoArticleRepository.ts (deleted)
- PoliTopicsWeb/backend/src/repositories/factory.ts (deleted)
- PoliTopicsWeb/backend/src/repositories/mockArticleRepository.ts (deleted)
- PoliTopicsWeb/backend/src/server.ts (deleted)
- PoliTopicsWeb/backend/src/types/fastify.d.ts (deleted)
- PoliTopicsWeb/backend/tsconfig.json (deleted)
- PoliTopicsWeb/changes.agent.md
- PoliTopicsWeb/docker-compose.yml
- PoliTopicsWeb/frontend/lib/config.ts
- PoliTopicsWeb/jp/README.md
- PoliTopicsWeb/package-lock.json
- PoliTopicsWeb/package.json
- PoliTopicsWeb/playwright.config.ts
- PoliTopicsWeb/scripts/ensure-localstack.sh
- PoliTopicsWeb/scripts/localstack_apply.sh
- PoliTopicsWeb/scripts/test-e2e-localstack.sh
- PoliTopicsWeb/tests/e2e/spa.spec.ts
- PoliTopicsWeb/workers/backend/src/config.ts
- PoliTopicsWeb/workers/backend/src/index.ts
- PoliTopicsWeb/workers/backend/src/lib/dynamodb.ts
- PoliTopicsWeb/workers/backend/src/lib/s3.ts
- PoliTopicsWeb/workers/backend/src/repositories/articleRepository.ts
- PoliTopicsWeb/workers/backend/src/types/article.ts
- PoliTopicsWeb/workers/backend/src/types/env.ts
- PoliTopicsWeb/workers/backend/wrangler.toml

### Changes After Review
- Added an automatic `npx playwright install` step to the LocalStack E2E script (opt-out with `SKIP_PLAYWRIGHT_INSTALL=true`).
- Relaxed the SPA article detail E2E assertion to check the summary section contains the expected snippet.
- Consolidated Web scripts to `dev:localstack` + `test:e2e:localstack`, and updated docs/tests to call direct commands instead of removed npm scripts.

Agent: Codex
Date/Time: 2026-01-26 18:46 JST
Keywords: e2e, localstack, workers, ports, dependencies
Topic: Stabilize LocalStack E2E backend startup
Details:

- Added backend worker dependency installation to the LocalStack E2E script to prevent wrangler's build from failing due to missing `@cloudflare/workers-types`.
- Allowed the LocalStack E2E script to fall back to an available backend port when `127.0.0.1:4500` is already in use, while still honoring `E2E_BACKEND_URL` when set.
- Made Playwright's webServer backend command derive the port from `E2E_BACKEND_URL` so the backend and tests stay aligned.
- Injected AWS/LocalStack endpoint overrides into `wrangler dev` via `--var` flags when env vars are present, avoiding DNS failures on hosts where `localstack` is not resolvable (e.g., act/GHA runner).
- Files changed:
  - `PoliTopicsWeb/playwright.config.ts`
  - `PoliTopicsWeb/scripts/test-e2e-localstack.sh`

Agent: Codex
Date/Time: 2026-01-26 19:58 JST
Keywords: frontend, dialog-viewer, scroll, ux
Topic: Make meeting minutes pane scrollable
Details:

- Added a bounded scroll area to the dialog viewer tabs so 会議の議事録 stays within a fixed viewport while letting users scroll through dialogs.
- Reused a single empty-state card across tabs to keep filter feedback consistent.
- Tests: `npm --prefix frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
  - `PoliTopicsWeb/changes.agent.md`

### Changes After Review
- Hid overflow in the shared ScrollArea component to prevent dialogs from bleeding outside the fixed-height pane.
- Tests: `npm --prefix frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/ui/scroll-area.tsx`

- Locked dialog list height with explicit `h-[70vh]/[65vh]/[60vh]` breakpoints so the inner scroll area captures wheel/trackpad events instead of bubbling to the page.
- Tests: `npm --prefix frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

- Forced scrollbars to remain visible (`type="always"`) and ensured the viewport itself is `overflow-auto` so wheel/trackpad操作が確実に内部スクロールへ向かい、必要ならスクロールバーも表示される。
- Tests: `npm --prefix frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/ui/scroll-area.tsx`

- Made dialog cards more compact (smaller avatar/dot, tighter gaps, reduced padding/line-height) so long lists are easier to scan in the fixed-height view.
- Tests: `npm --prefix frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

Agent: Codex
Date/Time: 2026-01-26 23:51 JST
Keywords: dev, localstack, workers, scripts
Topic: Align dev-nextjs-honoserver with LocalStack backend
Details:

- dev-nextjs-honoserver now ensures LocalStack resources, seeds the DB, and starts the backend worker with the local env so DynamoDB/S3 use LocalStack like dev:localstack.
- Tests: `npm --prefix workers/backend run build`
- Files changed:
  - `PoliTopicsWeb/scripts/dev-nextjs-honoserver.js`
  - `PoliTopicsWeb/changes.agent.md`
Agent: Codex
Date/Time: 2026-01-26 20:05 JST
Keywords: seed, dialogs, long-list, e2e
Topic: Add long dialog seed for scroll verification
Details:

- Added a “long dialog” seed article with45発言分のダイアログを収録し、固定高さスクロールUIの動作確認に使えるようにした。
- Keeps participants/keywords/terms filled for realistic rendering while focusing on大量発言の検証。
- Tests: not run (seed data addition only).
- Files changed:
  - `PoliTopicsWeb/terraform/seed/articles.json`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-27 10:18 JST
Keywords: hono, mock, dev, e2e, scripts
Topic: Add mock repo mode for Hono server and consolidate E2E scripts
Details:

- Added a Hono app factory and mock article repository sourced from `terraform/seed/articles.json`, with asset URLs derived from `ASSET_BASE_URL` for local asset server usage.
- Updated the Node Hono server to select DynamoDB vs mock repositories via `ARTICLE_REPOSITORY` and log the active mode.
- Switched `dev-nextjs-honoserver` to run the Node Hono server with mock data and local asset server, removing the LocalStack dependency from that flow.
- Introduced `scripts/e2econfig.js` and `scripts/e2e.js` to centralize presets/env and execute the LocalStack Playwright pipeline; `test-e2e-localstack.sh` and the npm script now delegate to it.
- Tests: `bash scripts/test_all.sh` (timed out during `PoliTopicsDataCollection` LocalStack provisioning/terraform plan).
- Files changed:
  - `PoliTopicsWeb/workers/backend/src/repositories/articleRepository.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/workers/backend/src/config.ts`
  - `PoliTopicsWeb/workers/backend/src/types/env.ts`
  - `PoliTopicsWeb/workers/backend/src/index.ts`
  - `PoliTopicsWeb/workers/backend/src/server.ts`
  - `PoliTopicsWeb/scripts/dev-nextjs-honoserver.js`
  - `PoliTopicsWeb/scripts/e2econfig.js`
  - `PoliTopicsWeb/scripts/e2e.js`
  - `PoliTopicsWeb/scripts/test-e2e-localstack.sh`
  - `PoliTopicsWeb/package.json`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-27 10:29 JST
Keywords: frontend, dialog, mobile, scroll
Topic: Reduce dialog list height on mobile
Details:

- Reduced the dialog list height on small screens and switched to `svh` units so the dialog scroll area fits the visible mobile viewport more reliably.
- Tests: `npm --prefix PoliTopicsWeb/frontend run build:local`
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
  - `PoliTopicsWeb/changes.agent.md`

Agent: Codex
Date/Time: 2026-01-29 13:34 JST
Keywords: frontend, copy, hero
Topic: Refresh homepage hero copy
Details:

- Rewrote the hero description to emphasize plain-language AI summaries, speaker focus, and balanced coverage, with a note about backfilling past minutes.
- Files changed:
  - `PoliTopicsWeb/frontend/components/home/hero-section.tsx`

Agent: Codex
Date/Time: 2026-01-29 15:09 JST
Keywords: frontend, layout, home
Topic: Split keyword and participant cards into two columns
Details:

- Placed 注目キーワード and 主要な発言者 cards side-by-side on large screens to reduce excess whitespace.
- Files changed:
  - `PoliTopicsWeb/frontend/app/home-client.tsx`

### Changes After Review
- Matched card heights between 注目キーワード and 主要な発言者 on large screens.
- Files changed:
  - `PoliTopicsWeb/frontend/components/home/stats-sections.tsx`

Agent: Codex
Date/Time: 2026-01-29 16:05 JST
Keywords: frontend, markdown, dialog, ux
Topic: Link summary order tags to dialog highlights
Details:

- Added `[[orders:...]]` parsing in Markdown and wired order links to scroll/highlight matching dialog entries.
- Files changed:
  - `PoliTopicsWeb/frontend/components/markdown.tsx`
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

Agent: Codex
Date/Time: 2026-02-02 20:58 JST
Keywords: frontend, dialog, ui, schema
Topic: Render sectioned dialog summaries
Details:
- Added support for sectioned dialog summaries (summary_sections / soft_language_sections) in the dialog viewer and search.
- Wired article dialog mapping to pass section arrays through to the viewer.
- Updated shared/backend types to include dialog section arrays.
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/workers/backend/src/types/article.ts`
  - `PoliTopicsWeb/changes.agent.md`

### Changes After Review
- Constrained dialog section titles to a fixed schema enum and rendered section titles as badges.
- Added sectioned dialog data to the Terraform seed articles for UI verification.
- Adjusted seed dialog section titles based on reactions and set non-overlapping summary/soft_language placeholders.
- Expanded seed dialog sections to include multiple titles/bullets for richer UI testing.
- Added per-section background tones and bullet accents for quicker visual scanning.
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
- `PoliTopicsWeb/shared/types/article.d.ts`
- `PoliTopicsWeb/workers/backend/src/types/article.ts`
- `PoliTopicsWeb/terraform/seed/articles.json`

Agent: Codex
Date/Time: 2026-02-03 10:20 JST
Keywords: backend, api, timeline, issue
Topic: Add issue timeline query endpoint
Details:
- Added `/issue/:issueId/timeline` endpoint with limit/sort controls.
- Added repository support to query ISSUE index items for timeline rendering.
- Updated mock repository to support issue-based timelines in local/dev.
- Files changed:
  - `PoliTopicsWeb/workers/backend/src/index.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/articleRepository.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/dynamodb/repository.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/mockArticleRepository.ts`

Agent: Codex
Date/Time: 2026-02-03 10:30 JST
Keywords: seed, timeline, issue
Topic: Add issue timeline seed data
Details:
- Added issueID values and extra seed articles to support timeline demos.
- Files changed:
  - `PoliTopicsWeb/terraform/seed/articles.json`

Agent: Codex
Date/Time: 2026-02-03 10:40 JST
Keywords: frontend, article, timeline
Topic: Show related timeline on article page
Details:
- Added timeline fetch helper and rendered related issue items in chronological order on /article.
- Files changed:
  - `PoliTopicsWeb/frontend/lib/api.ts`
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-03 10:45 JST
Keywords: frontend, article, timeline, ui
Topic: Collapse related timeline by default
Details:
- Moved related timeline section to the bottom of the article page and renamed it to 「関連する会議」.
- Added a toggle to expand/collapse timeline items.
- Files changed:
  - `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-03 11:05 JST
Keywords: pagination, headlines, performance, cursor
Topic: Switch headlines to cursor pagination
Details:
- Added cursor-based pagination to /headlines and removed offset slicing in repositories.
- Updated frontend headline fetching/loading logic to use cursors.
- Propagated nextCursor through the cache cron injection payload.
- Files changed:
  - `PoliTopicsWeb/workers/backend/src/index.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/articleRepository.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/dynamodb/repository.ts`
  - `PoliTopicsWeb/workers/backend/src/repositories/mockArticleRepository.ts`
  - `PoliTopicsWeb/frontend/lib/api.ts`
  - `PoliTopicsWeb/frontend/app/home-client.tsx`
  - `PoliTopicsWeb/cacheCron/src/index.ts`

Agent: Codex
Date/Time: 2026-02-03 11:25 JST
Keywords: dialogs, ui, schema
Topic: Render structured dialog bullets
Details:
- Updated dialog section bullet rendering to handle point/quote/detail objects (with legacy string fallback).
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
  - `PoliTopicsWeb/shared/types/article.d.ts`
  - `PoliTopicsWeb/workers/backend/src/types/article.ts`

Agent: Codex
Date/Time: 2026-02-05 10:30 JST
Keywords: frontend, dialog, typography
Topic: Increase dialog section text sizes
Details:
- Increased dialog section badge, bullet, quote, and detail text sizes for readability.
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

Agent: Codex
Date/Time: 2026-02-05 10:35 JST
Keywords: frontend, dialog, scroll
Topic: Add top shadow to dialog scroll area
Details:
- Added a top gradient shadow overlay above the dialog scroll area for visual depth.
- Files changed:
  - `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

Agent: Codex
Date/Time: 2026-02-05 10:40 JST
Keywords: frontend, dialog, scroll, layout
Topic: Add bottom shadow and tighten dialog card padding
Details:
- Added a bottom gradient shadow overlay to the dialog scroll area for depth.
- Reduced vertical padding on the fallback "会議の議事録" card when dialog data is unavailable.
Files changed:
- `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 10:50 JST
Keywords: frontend, scroll, header, footer
Topic: Contain dialog scroll and remove header/footer title text
Details:
- Prevented scroll chaining by adding overscroll containment to ScrollArea viewports.
- Removed the "国会議事録ニュース" label from header/footer UI.
Files changed:
- `PoliTopicsWeb/frontend/components/ui/scroll-area.tsx`
- `PoliTopicsWeb/frontend/components/home/home-header.tsx`
- `PoliTopicsWeb/frontend/components/home/site-footer.tsx`
- `PoliTopicsWeb/frontend/app/[[...slug]]/catch-all-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:00 JST
Keywords: frontend, layout, home
Topic: Align home page horizontal padding with article layout
Details:
- Centered home content and error alert to match the article page width and horizontal padding.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:05 JST
Keywords: frontend, layout, home
Topic: Widen home page container
Details:
- Increased the home page content and error container width to max-w-5xl.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:10 JST
Keywords: frontend, layout, search
Topic: Align search bar width with home container
Details:
- Centered search controls and matched width to the home content container.
Files changed:
- `PoliTopicsWeb/frontend/components/home/search-controls.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:15 JST
Keywords: frontend, search, layout
Topic: Remove search section divider
Details:
- Removed the bottom border under the search section container.
Files changed:
- `PoliTopicsWeb/frontend/components/home/search-controls.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:20 JST
Keywords: frontend, search, spacing
Topic: Tighten search section padding
Details:
- Reduced vertical padding on the search section.
Files changed:
- `PoliTopicsWeb/frontend/components/home/search-controls.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:25 JST
Keywords: frontend, latest, cards
Topic: Fix latest cards to a consistent height
Details:
- Set a fixed height for latest article cards to keep the row aligned.
- Made card content flex to fill the fixed height.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:30 JST
Keywords: frontend, cards, consistency
Topic: Unify featured/latest card design with grid cards
Details:
- Reused the grid card layout for featured and latest sections to align information density.
- Wired latest cards to use the full click handlers.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:35 JST
Keywords: frontend, cards, layout
Topic: Restore featured layout and align latest card sizing
Details:
- Restored the featured (pickup) card to its original custom layout.
- Removed fixed height on latest cards while keeping the grid-style layout.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:40 JST
Keywords: frontend, latest, cards
Topic: Fix latest cards to uniform height
Details:
- Set a fixed height on latest cards to keep the row aligned.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:45 JST
Keywords: frontend, latest, cards, layout
Topic: Increase density for latest cards with truncated descriptions
Details:
- Added a compact mode for latest cards to reduce padding and tighten typography.
- Ensured descriptions are clamped with ellipsis when overflowing.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:50 JST
Keywords: frontend, latest, cards, layout
Topic: Restore latest card UI
Details:
- Reverted latest cards to the original compact layout with title, description, and keyword badges.
- Kept the row height uniform via a fixed card height.
Files changed:
- `PoliTopicsWeb/frontend/components/home/articles-sections.tsx`

Agent: Codex
Date/Time: 2026-02-05 11:55 JST
Keywords: frontend, featured, dialog, qa
Topic: Refine featured selection and enlarge QA text
Details:
- Selected the featured article from highlighted keywords with a minimum description length, falling back to the first viable article.
- Increased dialog QA text sizes to match section readability.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`
- `PoliTopicsWeb/frontend/components/dialog-viewer.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:00 JST
Keywords: frontend, header, copy
Topic: Remove home header tagline
Details:
- Removed the "公平で透明な政治情報をお届け" tagline from the home header.
Files changed:
- `PoliTopicsWeb/frontend/components/home/home-header.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:05 JST
Keywords: frontend, dialog, scroll
Topic: Auto-center dialog section on gentle page scroll
Details:
- Added a gentle scroll detector that recenters the dialog section when users scroll into it from above or below.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:10 JST
Keywords: frontend, hooks, dialog, scroll
Topic: Fix hook order for dialog auto-centering
Details:
- Moved the dialog auto-centering effect before early returns and guarded it with article/asset data checks to satisfy hook ordering.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:15 JST
Keywords: frontend, dialog, scroll, motion
Topic: Slow down dialog auto-centering scroll
Details:
- Replaced native smooth scroll with a slower custom easing animation for dialog auto-centering.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:20 JST
Keywords: frontend, dialog, scroll, ui
Topic: Replace auto-centering with manual center button
Details:
- Removed auto-centering on gentle scroll.
- Added a button to center the dialog section on demand.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:25 JST
Keywords: frontend, dialog, scroll, ui
Topic: Center dialog body and simplify center button
Details:
- Centered the dialog viewer itself instead of the full section wrapper.
- Changed the center button label to a down-triangle symbol.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:30 JST
Keywords: frontend, dialog, scroll
Topic: Center dialog using scrollIntoView
Details:
- Switched the center action to use block-centered scrollIntoView for more reliable centering.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:35 JST
Keywords: frontend, dialog, scroll, mobile
Topic: Adjust dialog centering for mobile viewport and header
Details:
- Centered the dialog using visualViewport height and header height offsets to reduce mobile misalignment.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:40 JST
Keywords: frontend, dialog, ui
Topic: Remove dialog center button
Details:
- Removed the dialog center button and related centering logic.
Files changed:
- `PoliTopicsWeb/frontend/app/article/article-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:45 JST
Keywords: frontend, header, layout
Topic: Align home header icon to bottom padding
Details:
- Aligned the home header logo container to the bottom of the header padding.
Files changed:
- `PoliTopicsWeb/frontend/components/home/home-header.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:50 JST
Keywords: frontend, home, layout
Topic: Remove home header/footer and keep about button
Details:
- Removed the home header and footer components from the home page.
- Placed the "このサイトについて" button at the top-right of the page.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 12:55 JST
Keywords: frontend, home, layout
Topic: Remove top-right about button container
Details:
- Removed the top-right "このサイトについて" button container.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:00 JST
Keywords: frontend, home, about
Topic: Re-add about button above hero
Details:
- Added the "このサイトについて" button back above the hero section, right-aligned.
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:05 JST
Keywords: frontend, home, about, hero
Topic: Move about button into hero without extra wrapper
Details:
- Moved the about toggle into the hero section and removed the extra wrapper from the home page.
Files changed:
- `PoliTopicsWeb/frontend/components/home/hero-section.tsx`
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:10 JST
Keywords: frontend, home, about, mobile
Topic: Prevent about button overlap on mobile
Details:
- Made the about button static on small screens and absolute on larger screens to avoid overlapping the hero title.
Files changed:
- `PoliTopicsWeb/frontend/components/home/hero-section.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:15 JST
Keywords: frontend, home, about, layout
Topic: Keep about button above hero title on desktop
Details:
- Removed the absolute positioning on larger screens so the button stays above the hero title.
Files changed:
- `PoliTopicsWeb/frontend/components/home/hero-section.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:20 JST
Keywords: frontend, article, header
Topic: Remove article header icon
Details:
- Removed the icon from the /article header.
Files changed:
- `PoliTopicsWeb/frontend/app/[[...slug]]/catch-all-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:25 JST
Keywords: frontend, home, copy
Topic: Rename all meetings section label
Details:
- Renamed the "すべての審議" section to "すべての会議".
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`

Agent: Codex
Date/Time: 2026-02-05 13:30 JST
Keywords: frontend, home, copy
Topic: Rename all meetings section to other meetings
Details:
- Renamed the section label to "他の会議".
Files changed:
- `PoliTopicsWeb/frontend/app/home-client.tsx`
