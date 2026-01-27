# 設定ファイル・リファレンス

`PoliTopicsWeb` プロジェクト内の主要な設定（Config）ファイルについて、その役割とアーキテクチャ・開発フローとの関係を解説します。

## ルート・デプロイ設定

| ファイル名 | 役割・解説 |
| :--- | :--- |
| **`wrangler.toml`** | **Cloudflare Workers / Pages 設定**<br>Webフロントエンド（SPA）を配信するWorkerの設定です。<br>- `[env.*]`: 環境ごとの定義（`local`, `stage`, `prod`）。<br>- `r2_buckets`: 静的アセット（ビルド成果物）を保存するR2バケットのバインディング。<br>- `routes`: カスタムドメイン（`politopics.net`）の設定。 |
| **`playwright.config.ts`** | **E2Eテスト設定 (Playwright)**<br>ブラウザベースのテスト設定です。<br>- `webServer`: テスト実行時にバックエンド（Hono）とフロントエンド（Wrangler）を自動起動するコマンド定義。<br>- テストプロセスに渡す環境変数（`AWS_ENDPOINT_URL` 等）を設定します。 |
| **`tsconfig.json`**<br>**`tsconfig.base.json`** | **TypeScript設定**<br>`tsconfig.base.json` でベース設定やパスエイリアス（`@shared/*`）を定義し、サブプロジェクト（`frontend`, `workers/backend`）で継承・拡張しています。 |

## Frontend (`frontend/`)

| ファイル名 | 役割・解説 |
| :--- | :--- |
| **`next.config.mjs`** | **Next.js 設定**<br>- `output: "export"`: Cloudflare R2でのホスティング向けに静的ファイル書き出しを設定。<br>- `images: { unoptimized: true }`: 静的エクスポート時はNext.jsの画像最適化サーバーが利用できないため無効化しています。 |
| **`postcss.config.mjs`** | **CSSツール設定**<br>Tailwind CSS v4 (`@tailwindcss/postcss`) を利用するためのプラグイン設定です。 |
| **`components.json`** | **UIコンポーネント設定 (shadcn/ui)**<br>`shadcn/ui` ライブラリの設定ファイル。<br>- `style`: "new-york"<br>- `aliases`: コンポーネントやUtilsのインポートパス（`@/components` 等）を定義。 |

## Backend Logic (`workers/backend/`)

| ファイル名 | 役割・解説 |
| :--- | :--- |
| **`src/config.ts`** | **アプリケーションロジック設定**<br>環境変数に基づいてアプリの挙動を決定する重要なコードです。<br>- `resolveAppEnvironment`: `local`, `stage`, `prod` の判定。<br>- `resolveAwsEndpoints`: LocalStack（ローカル）かAWS（本番）かの接続先切り替え。<br>- **`resolveArticleRepositoryMode`**: 環境変数 `ARTICLE_REPOSITORY` に基づき、DynamoDBとMockリポジトリを切り替えるロジック。 |

## Scripts & Custom Config (`scripts/`)

| ファイル名 | 役割・解説 |
| :--- | :--- |
| **`e2econfig.js`** | **共通テスト・開発設定**<br>シェルスクリプトやNodeスクリプトから共通して参照され、一貫した環境を提供します。<br>- プリセット（例: `localstack`）、ポート番号、AWS/LocalStack用の環境変数セットを一元管理。<br>- ローカル実行パラメータの「信頼できる唯一の情報源（SSOT）」として機能します。 |
| **`dev-nextjs-honoserver.js`** | **ローカル開発ランナー**<br>Next.js（フロントエンド）とHono（バックエンド）を同時に立ち上げるスクリプト。<br>- 設定ファイルを利用してポートやアセットサーバーを構成し、ホットリロード可能なローカル環境を提供します。 |
