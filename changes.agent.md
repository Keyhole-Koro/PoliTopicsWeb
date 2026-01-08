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
