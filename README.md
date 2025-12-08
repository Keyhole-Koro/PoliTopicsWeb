# PoliTopics Web Monorepo

This repository now contains the four pillars requested for integrated development:

- **frontend/** – Next.js SPA exported to static assets that can be deployed directly to S3 (CloudFront/CDN is intentionally omitted for now). Top articles are embedded at build time from shared data while dynamic search/details rely on the backend API.
- **backend/** – Express + TypeScript Lambda (via API Gateway) that proxies searches to DynamoDB (or uses mock data) and exposes `/headlines`, `/search`, `/search/suggest`, and `/article/:id`. Local development still runs the same Express app directly, while `src/lambda.ts` exports the handler used in AWS and Terraform provisions the Lambda + HTTP API wiring.
- **infra/** – Docker Compose setup that runs LocalStack plus the backend service for local development. Local mock data can be seeded into DynamoDB for end-to-end testing.
- **terraform/** – Infrastructure definitions (module-based layout) that provision the frontend SPA bucket, reference the existing DynamoDB table + article payload bucket, and deploy the backend Lambda + HTTP API for a single environment (stage/prod/localstack).

## Quick start

```bash
# Start LocalStack + backend API
docker compose up --build

# (Optional) load mock articles into LocalStack DynamoDB
docker compose exec app npm run seed

# Run the Next.js SPA locally in another terminal
npm run dev:frontend
```

The frontend is served on http://localhost:3333 and expects the backend on http://localhost:4000. Configure other environments with `NEXT_PUBLIC_API_BASE_URL`.

## Backend Lambda

`backend/src/lambda.ts` exports the AWS Lambda handler (built to `backend/dist/lambda.js` via `npm run build:backend`). Configure the Lambda runtime to execute `dist/lambda.handler` and wire it to API Gateway so the SPA continues to call the same routes. The Express server (`src/server.ts`) remains available for local development and Docker Compose flows.

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

## API surface

| Route | Description |
| --- | --- |
| `GET /headlines?limit=6` | Latest articles sorted by date |
| `GET /search?words=給食,子ども政策&sort=date_desc` | Dynamo-backed keyword search (comma-delimited words) |
| `GET /search/suggest?input=給食` | Suggestions while typing in the SPA search box |
| `GET /article/:issueId` | Full article payload used on the detail page |

The backend defaults to the mock repository but can be switched to DynamoDB by setting `DATA_MODE=dynamo` and providing the AWS/LocalStack connection variables.
