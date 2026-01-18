# スクリプトと使用法 (PoliTopicsWeb)
[English Version](../../docs/scripts_and_usage.md)

このドキュメントでは、Web ワークスペースの実行可能なスクリプトと一般的なワークフローをリストします。
パスは `PoliTopicsWeb` からの相対パスです。

## ワークスペース npm スクリプト (`PoliTopicsWeb/package.json`)
- `npm run dev`: バックエンド + フロントエンドを並行して実行します。
- `npm run dev:frontend`: Next.js 開発サーバー (ポート 3333)。
- `npm run dev:backend`: バックエンド開発サーバー (Fastify, ポート 4500)。
- `npm run dev:backend:mock`: モックデータ付きバックエンド (`DATA_MODE=mock`)。
- `npm run dev:backend:worker`: Cloudflare worker 開発 (ローカル環境)。
- `npm run build`: フロントエンド + バックエンド + cacheCron をビルドします。
- `npm run build:frontend`: 本番用 Next.js エクスポート。
- `npm run build:frontend:local`: ローカル用 Next.js エクスポート。
- `npm run build:backend`: バックエンド Lambda バンドル + zip。
- `npm run build:backend:local`: ローカル使用のためのバックエンド Lambda バンドル。
- `npm run build:cacheCron`: CacheCron バンドル + zip。
- `npm run lint`: フロントエンドリント。
- `npm run r2:sync:local`: `frontend/out` をローカル R2 (Miniflare) にアップロードします。
- `npm run r2:sync:local:fast`: ローカル R2 への一括アップロード (シェルスクリプト)。
- `npm run worker:dev:local`: Wrangler Miniflare を実行します (ポート 8787)。
- `npm run setup:e2e`: Playwright ブラウザ + OS 依存関係をインストールします。
- `npm run e2e:prepare`: フロントエンドローカルをビルド + R2 に同期します。
- `npm run test:e2e`: ビルド + 同期 + Playwright。
- `npm run test:e2e:quick`: Playwright のみ。
- `npm run test:e2e:backend`: Playwright バックエンドスペックのみ。
- `npm run test:e2e:localstack`: 完全な LocalStack E2E フロー (バックエンドビルド, terraform apply, シード, フロントエンドビルド, 同期, Playwright 実行)。
- `npm run deploy:localstack`: バックエンドビルド + `tfvars/localstack.tfvars` で Terraform apply。
- `npm run ensure:localstack`: LocalStack リソースを検証し、不足している場合は作成します。
- `npm run pretest`: `ensure:localstack` と同じです。

## サブモジュール npm スクリプト

### `frontend/`
- `npm --prefix frontend run dev:local`: Next.js 開発サーバー (ローカル環境)。
- `npm --prefix frontend run dev:stage`: Next.js 開発サーバー (ステージ環境 via `.env.stage`)。
- `npm --prefix frontend run build`: 本番ビルド。
- `npm --prefix frontend run build:local`: ローカルビルド。
- `npm --prefix frontend run build:stage`: ステージビルド。
- `npm --prefix frontend run start`: ビルドされたアセットをポート 3333 で提供します。
- `npm --prefix frontend run lint`: ESLint。

### `backend/`
- `npm --prefix backend run dev:local`: Fastify 開発サーバー (モックデータ)。
- `npm --prefix backend run build`: コンパイル + Lambda zip パッケージング。
- `npm --prefix backend run build:local`: ローカルパッケージング用の `build` と同じ。
- `npm --prefix backend run start`: `dist/` からコンパイルされたサーバーを実行します。
- `npm --prefix backend run seed`: LocalStack データをシードします (DynamoDB + S3)。
- `npm --prefix backend run bootstrap:localstack`: ビルド + シード (`../../shared/mock` が存在することを想定)。

### `cacheCron/`
- `npm --prefix cacheCron run build`: キャッシュ cron Lambda をバンドル + zip します。
- `npm --prefix cacheCron run bundle`: `src/index.ts` を `dist/index.js` にバンドルします。
- `npm --prefix cacheCron run zip`: `dist/headlines-cron.zip` を作成します。

### `workers/backend/`
- `npm --prefix workers/backend run dev`: Wrangler dev (デフォルト環境)。
- `npm --prefix workers/backend run dev:local`: `local` 環境で Wrangler dev。
- `npm --prefix workers/backend run build`: TypeScript ビルド。
- `npm --prefix workers/backend run deploy:stage`: ステージにデプロイ。
- `npm --prefix workers/backend run deploy:prod`: 本番にデプロイ。
- `npm --prefix workers/backend run types`: Worker 型定義を生成。

## ヘルパースクリプト
- `scripts/ensure-localstack.sh`: LocalStack バケット/テーブル/Lambda/API Gateway を確認します。`--check-only` と `WEB_LOCALSTACK_ENV` (デフォルト `localstack`) をサポートします。
- `scripts/localstack_apply.sh`: LocalStack 用のバックエンドビルド + Terraform plan/apply。
- `scripts/r2-sync-local.mjs`: `frontend/out` をローカル R2 にアップロードします (必要に応じて `R2_BUCKET`, `WORKER_ENV` を設定)。
- `scripts/r2-sync-bulk.sh`: ローカル R2 への一括アップロード (`BUILD_DIR`, `R2_BUCKET`, `WRANGLER_ENV` を設定)。
- `scripts/test-e2e-localstack.sh`: End-to-end LocalStack フロー (ビルド, terraform, シード, フロントエンドビルド, 同期, Playwright 実行)。
- `terraform/sync-env.sh`: Terraform 出力からバックエンド `.env` とフロントエンド `.env.local` を書き込みます。
- `terraform/scripts/build-frontend.sh`: `FRONTEND_BUILD_ENV` (local|stage|prod) 用にフロントエンドをクリーンアップ + ビルドします。
- `terraform/scripts/upload-frontend.sh <bucket>`: `frontend/out` を S3/R2 に同期します (`FRONTEND_S3_ENDPOINT_URL` が必要)。
- `terraform/scripts/create-state-bucket.sh <local|stage|prod>`: Terraform ステートバケットを作成/検証します。
- `terraform/scripts/import_all.sh <env>`: 既存のインフラを Terraform ステートにインポートします (`tfvars` を読み取ります)。
- `terraform/mock-article/upload_articles.js`: モック記事で DynamoDB + S3 をシードします (LocalStack)。
- `backend/scripts/prepare-local-dist.mjs`: メタデータを `backend/dist` にコピー + 本番依存関係をインストールします。
- `backend/scripts/zip.mjs`: `backend/dist` を `backend/dist/backend.zip` に zip 圧縮します。
- `cacheCron/scripts/zip.mjs`: `cacheCron/dist/index.js` を `cacheCron/dist/headlines-cron.zip` に zip 圧縮します。
- `profile/measure-backend-latency.js`: ウォームレイテンシプローブ (JSON lines 出力)。
- `profile/measure-backend-coldstart.js`: クールダウン付きコールドスタートプローブ (デフォルト 6分)。

## ユースケース

### フロントエンド + バックエンドをローカルで実行
```bash
npm run dev
```

ポート: frontend `http://127.0.0.1:3333`, backend `http://127.0.0.1:4500`。

### Worker + ローカル R2 経由で SPA を提供
```bash
npm run build:frontend:local
npm run r2:sync:local
npm run worker:dev:local
```

オプションのバックエンド:

```bash
npm run dev:backend:mock
```

### 完全な LocalStack E2E 実行
```bash
npm run test:e2e:localstack
```

### Terraform 出力から環境ファイルを更新
```bash
./terraform/sync-env.sh
```

### コールドスタートレイテンシの測定 (6分クールダウン)
```bash
node profile/measure-backend-coldstart.js --config profile/targets.aws_lambda.json --cooldown-ms 360000
```

### ウォームレイテンシの測定
```bash
node profile/measure-backend-latency.js --config profile/targets.example.json
```
