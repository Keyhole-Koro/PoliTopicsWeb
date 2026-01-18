# PoliTopics Cache Cron
[Japanese Version](./jp/README.md)

Scheduled Lambda that fetches `/headlines` and writes a JSON snapshot to S3/R2.

## Build

```bash
npm install
npm run build   # outputs dist/headlines-cron.zip
```

## Behavior

- Runtime: Node.js 22 (`index.handler` inside the zip)
- Configuration is fixed in `APP_CONFIG` (local/stage/prod API, bucket, S3 endpoint). Environment is picked from the Lambda function name (`prod`/`stage` substring, otherwise local).
- Secrets via env only:
  - Backend (stage): `STAGE_BACKEND_API_URL` (required; set via Terraform from the deployed API URL)
  - S3/R2 auth: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (required in stage/prod)
  - S3-compatible endpoint: `S3_COMPATIBLE_API_STAGE` / `S3_COMPATIBLE_API_PROD` (required; injected by deploy-backend)
  - Discord: `DISCORD_WEBHOOK_BATCH` (success), `DISCORD_WEBHOOK_ERROR` (failure; falls back to batch when missing)

## Packaging notes

- Bundles with esbuild (single `index.js`) and zips via `scripts/zip.mjs` (no runtime `node_modules` required).
