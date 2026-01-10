# PoliTopics Web Monorepo

This repository now contains the four pillars requested for integrated development:

- **frontend/** – Next.js SPA exported to static assets that can be deployed directly to S3 (CloudFront/CDN is intentionally omitted for now). Top articles are embedded at build time from shared data while dynamic search/details rely on the backend API.
- **backend/** – Fastify + TypeScript Lambda (via API Gateway) that proxies searches to DynamoDB and exposes `/headlines`, `/search`, `/search/suggest`, and `/article/:id`. Local development still runs the same Fastify app directly, while `src/handler.ts` exports the AWS Lambda handler (also re-exported via `src/lambda.ts` for compatibility) and Terraform provisions the Lambda + HTTP API wiring.
- **infra/** – Docker Compose setup that runs LocalStack plus the backend service for local development. Local mock data can be seeded into DynamoDB for end-to-end testing.
- **terraform/** – Infrastructure definitions (module-based layout) that provision the frontend SPA bucket, reference the existing DynamoDB table + article payload bucket, and deploy the backend Lambda + HTTP API for a single environment (stage/prod/localstack).

```bash
node shared/mock/upload_articles.js --endpoint http://localstack:4566 --bucket politopics-articles-local
```

The seed script now stores the large article payload fields (`summary`, `soft_language_summary`, `middle_summary`,
`dialogs`) as JSON blobs in the `POLITOPICS_ARTICLE_BUCKET` (defaults to
`politopics-articles-local` when using LocalStack) and only keeps references in DynamoDB via `asset_url`.

The frontend is served on http://127.0.0.1:3333 and expects the backend on http://127.0.0.1:4500. Configure other environments with `NEXT_PUBLIC_API_BASE_URL`.

## Backend Lambda

`backend/src/handler.ts` exports the AWS Lambda handler (re-exported through `src/lambda.ts` to keep the Terraform handler name stable) and is built to `backend/dist/lambda.js` via `npm run build:backend`. Configure the Lambda runtime to execute `dist/lambda.handler` and wire it to API Gateway so the SPA continues to call the same routes. The Fastify server (`src/server.ts`) remains available for local development and Docker Compose flows.

Set the backend `ENV` variable to `local` (default), `localstack`, `stage`, or `prod` to pull the matching table/bucket defaults. Stage/Prod deploys receive this automatically via Terraform; local Docker Compose can override it if you need to mimic another environment.

### Signed article assets

- Article endpoints now return `assetUrl` (string, never null) for both summaries and full articles. The URL is a signed `GET` link with a short TTL (default: 900 seconds).
- Configure TTL via `ASSET_URL_TTL_SECONDS` in the backend environment. When unset, the default 900 seconds is used.
- Signing uses the article asset bucket configured per environment and honors the LocalStack endpoint for local runs.

Terraform provisions the Lambda + HTTP API per environment (stage/prod/localstack). Package the backend by zipping the compiled `backend/dist` folder (default path: `backend/dist/backend.zip`) so Terraform can read it through the `backend_lambda_package` variable, then run `terraform init -backend-config backends/<env>.hcl` followed by `terraform apply -var-file tfvars/<env>.tfvars` from the `terraform/` directory.

Use `terraform/import_all.sh <env>` if you need to import an existing SPA bucket (and its public-access helpers) into state before applying.

## Terraform layout

```
terraform/
├── backends/        # Backend configs for localstack, stage, prod
├── service/         # Module orchestrating S3, DynamoDB data sources, Lambda/API
│   ├── s3/          # SPA bucket + article payload references
│   ├── dynamodb/    # Existing table data sources
│   └── lambda/      # Lambda + API Gateway HTTP API
├── tfvars/          # Per-environment variable files
├── import_all.sh    # Helper to import existing frontend buckets
├── main.tf          # Calls the service module
├── provider.tf
├── variables.tf
├── versions.tf
└── outputs.tf
```

## Deploying the SPA to S3

1. Build the static bundle: `npm run build:frontend`.
2. Upload `frontend/out` to the desired S3 bucket (`politopics-frontend-stage` or `...-prod`).
3. Configure the bucket website error document to `index.html` to support SPA routing (article, search, etc.).

## Local SPA via Wrangler + R2 (Miniflare)

Use the Worker + R2 path locally so the SPA runs through the same routing layer as production.

1. Build the SPA for local use: `npm run build:frontend:local`
2. Sync static assets into local R2: `npm run r2:local:sync`
3. Start the mock backend (no LocalStack required): `npm run dev:backend:mock`
4. Start the Worker with Miniflare: `npm run worker:dev:local`
5. (Optional) Run Playwright E2E: `npx playwright test`

Notes:
- The mock backend is enabled via `DATA_MODE=mock` and `DISABLE_NOTIFICATIONS=true`.
- The Worker listens on http://127.0.0.1:8787; the backend listens on http://127.0.0.1:4500.

## E2E Testing

The project uses Playwright for End-to-End testing.

| Command | Description | Use Case |
| :--- | :--- | :--- |
| `npm run setup:e2e` | Installs Playwright browsers & dependencies. | First time setup. |
| `npm run test:e2e` | **Standard Run.** Builds frontend, syncs assets, runs tests. | Run this before committing. |
| `npm run test:e2e:quick` | **Quick Run.** Runs Playwright *without* building. | Fast iteration when only editing test files. |
| `npm run test:e2e:backend`| **Backend Only.** Runs only `backend.spec.ts`. | Verifying API changes independently. |
| `npm run test:e2e:localstack` | **Full Integration.** Deploys backend to LocalStack + full E2E. | Deep system testing with AWS simulation. |

## LocalStack E2E (Full Integration)

Use this flow to hit the deployed Lambda/API on LocalStack (already running inside the devcontainer; reachable at `http://localstack:4566`).

```
cd PoliTopicsWeb
npm install --workspaces --include-workspace-root   # first time only
npm run test:e2e:localstack
```

What it does:
- Builds the backend Lambda, runs Terraform with `tfvars/localstack.tfvars`, and converts the API Gateway invoke URL to the LocalStack `_user_request_` form.
- Seeds the DynamoDB table + S3 payload bucket via `terraform/mock-article/upload_articles.js` (same dataset the Playwright specs assert).
- Builds the frontend with `NEXT_PUBLIC_API_BASE_URL` set to the LocalStack `_user_request_` URL, syncs to local R2, starts Wrangler (Miniflare), then runs Playwright with `E2E_MODE=localstack` (skips the mock Fastify server).

## API surface

| Route                                              | Description                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /headlines?limit=6`                           | Latest articles sorted by date                                                   |
| `GET /search?words=給食,子ども政策&sort=date_desc` | Dynamo-backed keyword search (comma-delimited words)                             |
| `GET /search/suggest?input=給食`                   | Suggestions while typing in the SPA search box                                   |
| `GET /article/:issueId`                            | Full article payload used on the detail page (payload merged from DynamoDB + S3) |

The backend uses DynamoDB (LocalStack for local development). Ensure the AWS/LocalStack connection variables are set before running locally.
