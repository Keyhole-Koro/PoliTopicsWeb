# Scripts and Usage (PoliTopicsWeb)
[Japanese Version](./jp/scripts_and_usage.md)

This document lists runnable scripts and common workflows for the Web workspace.
Paths are relative to `PoliTopicsWeb`.

## Workspace npm scripts (`PoliTopicsWeb/package.json`)
- `npm run dev`: Run backend + frontend in parallel.
- `npm run dev:frontend`: Next.js dev server (port 3333).
- `npm run dev:backend`: Backend dev server (Fastify, port 4500).
- `npm run dev:backend:mock`: Backend with mock data (`DATA_MODE=mock`).
- `npm run dev:backend:worker`: Cloudflare worker dev (local env).
- `npm run build`: Build frontend + backend + cacheCron.
- `npm run build:frontend`: Next.js export for prod.
- `npm run build:frontend:local`: Next.js export for local.
- `npm run build:backend`: Backend Lambda bundle + zip.
- `npm run build:backend:local`: Backend Lambda bundle for local use.
- `npm run build:cacheCron`: CacheCron bundle + zip.
- `npm run lint`: Frontend lint.
- `npm run r2:sync:local`: Upload `frontend/out` to local R2 (Miniflare).
- `npm run r2:sync:local:fast`: Bulk upload to local R2 (shell script).
- `npm run worker:dev:local`: Run Wrangler Miniflare (port 8787).
- `npm run setup:e2e`: Install Playwright browsers + OS deps.
- `npm run e2e:prepare`: Build frontend local + sync to R2.
- `npm run test:e2e`: Build + sync + Playwright.
- `npm run test:e2e:quick`: Playwright only.
- `npm run test:e2e:backend`: Playwright backend spec only.
- `npm run test:e2e:localstack`: Full LocalStack E2E flow (build backend, terraform apply, seed, build frontend, sync, run Playwright).
- `npm run deploy:localstack`: Build backend + Terraform apply with `tfvars/localstack.tfvars`.
- `npm run ensure:localstack`: Verify LocalStack resources and create them if missing.
- `npm run pretest`: Same as `ensure:localstack`.

## Submodule npm scripts

### `frontend/`
- `npm --prefix frontend run dev:local`: Next.js dev server (local env).
- `npm --prefix frontend run dev:stage`: Next.js dev server (stage env via `.env.stage`).
- `npm --prefix frontend run build`: Prod build.
- `npm --prefix frontend run build:local`: Local build.
- `npm --prefix frontend run build:stage`: Stage build.
- `npm --prefix frontend run start`: Serve built assets on port 3333.
- `npm --prefix frontend run lint`: ESLint.

### `backend/`
- `npm --prefix backend run dev:local`: Fastify dev server (mock data).
- `npm --prefix backend run build`: Compile + package Lambda zip.
- `npm --prefix backend run build:local`: Same as `build` for local packaging.
- `npm --prefix backend run start`: Run compiled server from `dist/`.
- `npm --prefix backend run seed`: Seed LocalStack data (DynamoDB + S3).
- `npm --prefix backend run bootstrap:localstack`: Build + seed (expects `../../shared/mock` to exist).

### `cacheCron/`
- `npm --prefix cacheCron run build`: Bundle + zip the cache cron Lambda.
- `npm --prefix cacheCron run bundle`: Bundle `src/index.ts` into `dist/index.js`.
- `npm --prefix cacheCron run zip`: Create `dist/headlines-cron.zip`.

### `workers/backend/`
- `npm --prefix workers/backend run dev`: Wrangler dev (default env).
- `npm --prefix workers/backend run dev:local`: Wrangler dev with `local` env.
- `npm --prefix workers/backend run build`: TypeScript build.
- `npm --prefix workers/backend run deploy:stage`: Deploy to stage.
- `npm --prefix workers/backend run deploy:prod`: Deploy to prod.
- `npm --prefix workers/backend run types`: Generate Worker types.

## Helper scripts
- `scripts/ensure-localstack.sh`: Check LocalStack buckets/tables/lambda/API Gateway. Supports `--check-only` and `WEB_LOCALSTACK_ENV` (default `localstack`).
- `scripts/localstack_apply.sh`: Build backend + Terraform plan/apply for LocalStack.
- `scripts/r2-sync-local.mjs`: Upload `frontend/out` to local R2 (set `R2_BUCKET`, `WORKER_ENV` if needed).
- `scripts/r2-sync-bulk.sh`: Bulk upload to local R2 (set `BUILD_DIR`, `R2_BUCKET`, `WRANGLER_ENV`).
- `scripts/test-e2e-localstack.sh`: End-to-end LocalStack flow (build, terraform, seed, build frontend, sync, run Playwright).
- `terraform/sync-env.sh`: Write backend `.env` and frontend `.env.local` from Terraform outputs.
- `terraform/scripts/build-frontend.sh`: Clean + build frontend for `FRONTEND_BUILD_ENV` (local|stage|prod).
- `terraform/scripts/upload-frontend.sh <bucket>`: Sync `frontend/out` to S3/R2 (`FRONTEND_S3_ENDPOINT_URL` required).
- `terraform/scripts/create-state-bucket.sh <local|stage|prod>`: Create/verify Terraform state bucket.
- `terraform/scripts/import_all.sh <env>`: Import existing infra into Terraform state (reads `tfvars`).
- `terraform/mock-article/upload_articles.js`: Seed DynamoDB + S3 with mock articles (LocalStack).
- `backend/scripts/prepare-local-dist.mjs`: Copy metadata into `backend/dist` + install prod deps.
- `backend/scripts/zip.mjs`: Zip `backend/dist` into `backend/dist/backend.zip`.
- `cacheCron/scripts/zip.mjs`: Zip `cacheCron/dist/index.js` into `cacheCron/dist/headlines-cron.zip`.
- `profile/measure-backend-latency.js`: Warm latency probe (JSON lines output).
- `profile/measure-backend-coldstart.js`: Cold-start probe with cooldown (default 6 minutes).

## Use cases

### Run frontend + backend locally
```bash
npm run dev
```

Ports: frontend `http://127.0.0.1:3333`, backend `http://127.0.0.1:4500`.

### Serve the SPA via Worker + local R2
```bash
npm run build:frontend:local
npm run r2:sync:local
npm run worker:dev:local
```

Optional backend:

```bash
npm run dev:backend:mock
```

### Full LocalStack E2E run
```bash
npm run test:e2e:localstack
```

### Refresh env files from Terraform outputs
```bash
./terraform/sync-env.sh
```

### Measure cold-start latency (6 minute cooldown)
```bash
node profile/measure-backend-coldstart.js --config profile/targets.aws_lambda.json --cooldown-ms 360000
```

### Measure warm latency
```bash
node profile/measure-backend-latency.js --config profile/targets.example.json
```
