# PoliTopics Web モノレポ
[English Version](../README.md)

このリポジトリには、統合開発のために要求された4つの柱が含まれています:

- **frontend/** – Next.js SPA。S3 に直接デプロイできる静的アセットにエクスポートされます (CloudFront/CDN は現在意図的に省略されています)。トップ記事は共有データからビルド時に埋め込まれますが、動的な検索/詳細はバックエンド API に依存します。
- **backend/** – Fastify + TypeScript Lambda (API Gateway 経由)。DynamoDB への検索をプロキシし、`/headlines`, `/search`, `/search/suggest`, `/article/:id` を公開します。ローカル開発では同じ Fastify アプリを直接実行しますが、`src/handler.ts` は AWS Lambda ハンドラをエクスポートし (`src/lambda.ts` 経由でも再エクスポートされ互換性を維持)、Terraform は Lambda + HTTP API の配線をプロビジョニングします。
- **infra/** – Docker Compose セットアップ。ローカル開発用に LocalStack とバックエンドサービスを実行します。ローカルモックデータを DynamoDB にシードしてエンドツーエンドテストを行うことができます。
- **terraform/** – インフラストラクチャ定義 (モジュールベースのレイアウト)。フロントエンド SPA バケットをプロビジョニングし、既存の DynamoDB テーブル + 記事ペイロードバケットを参照し、単一の環境 (stage/prod/localstack) 用にバックエンド Lambda + HTTP API をデプロイします。

```bash
node shared/mock/upload_articles.js --endpoint http://localstack:4566 --bucket politopics-articles-local
```

シードスクリプトは現在、大きな記事ペイロードフィールド (`summary`, `soft_language_summary`, `middle_summary`, `dialogs`) を JSON ブロブとして `POLITOPICS_ARTICLE_BUCKET` (LocalStack を使用する場合はデフォルトで `politopics-articles-local`) に保存し、`asset_url` を介して DynamoDB に参照のみを保持します。

フロントエンドは http://127.0.0.1:3333 で提供され、バックエンドは http://127.0.0.1:4500 を想定しています。他の環境は `NEXT_PUBLIC_API_BASE_URL` で設定してください。

## バックエンド Lambda

`backend/src/handler.ts` は AWS Lambda ハンドラをエクスポートし (`src/lambda.ts` を通じて再エクスポートされ、Terraform ハンドラ名を安定させます)、`npm run build:backend` を介して `backend/dist/lambda.js` にビルドされます。`dist/lambda.handler` を実行するように Lambda ランタイムを設定し、API Gateway に配線して、SPA が同じルートを呼び出し続けるようにします。Fastify サーバー (`src/server.ts`) は、ローカル開発および Docker Compose フローのために引き続き利用可能です。

バックエンドの `ENV` 変数を `local` (デフォルト), `localstack`, `stage`, または `prod` に設定して、一致するテーブル/バケットのデフォルトを取得します。Stage/Prod デプロイは Terraform を介してこれを自動的に受け取ります。ローカル Docker Compose は、別の環境を模倣する必要がある場合にこれをオーバーライドできます。

### 署名付き記事アセット

- 記事エンドポイントは、要約と完全な記事の両方に対して `assetUrl` (文字列、null にはならない) を返すようになりました。URL は、短い TTL (デフォルト: 900秒) を持つ署名付き `GET` リンクです。
- TTL はバックエンド環境の `ASSET_URL_TTL_SECONDS` を介して設定します。未設定の場合、デフォルトの 900秒が使用されます。
- 署名は環境ごとに設定された記事アセットバケットを使用し、ローカル実行の場合は LocalStack エンドポイントを尊重します。

Terraform は環境 (stage/prod/localstack) ごとに Lambda + HTTP API をプロビジョニングします。コンパイルされた `backend/dist` フォルダを zip 圧縮してバックエンドをパッケージ化し (デフォルトパス: `backend/dist/backend.zip`)、Terraform が `backend_lambda_package` 変数を介してそれを読み取れるようにしてから、`terraform/` ディレクトリから `terraform init -backend-config backends/<env>.hcl`、続いて `terraform apply -var-file tfvars/<env>.tfvars` を実行します。

適用する前に既存の SPA バケット (およびそのパブリックアクセスヘルパー) をステートにインポートする必要がある場合は、`terraform/import_all.sh <env>` を使用してください。

## Terraform レイアウト

```
terraform/
├── backends/        # localstack, stage, prod 用のバックエンド設定
├── service/         # S3, DynamoDB データソース, Lambda/API をオーケストレーションするモジュール
│   ├── s3/          # SPA バケット + 記事ペイロード参照
│   ├── dynamodb/    # 既存のテーブルデータソース
│   └── lambda/      # Lambda + API Gateway HTTP API
├── tfvars/          # 環境ごとの変数ファイル
├── import_all.sh    # 既存のフロントエンドバケットをインポートするヘルパー
├── main.tf          # サービスモジュールを呼び出す
├── provider.tf
├── variables.tf
├── versions.tf
└── outputs.tf
```

## SPA の S3 へのデプロイ

1. 静的バンドルをビルド: `npm run build:frontend`.
2. `frontend/out` を目的の S3 バケット (`politopics-frontend-stage` または `...-prod`) にアップロード。
3. SPA ルーティング (記事、検索など) をサポートするために、バケットのウェブサイトエラードキュメントを `index.html` に設定します。

## Wrangler + R2 (Miniflare) 経由のローカル SPA

ローカルで Worker + R2 パスを使用することで、SPA が本番環境と同じルーティングレイヤーを通じて実行されるようにします。

1. ローカル使用のために SPA をビルド: `npm run build:frontend:local`
2. 静的アセットをローカル R2 に同期: `npm run r2:local:sync`
3. モックバックエンドを起動 (LocalStack 不要): `npm run dev:backend:mock`
4. Miniflare で Worker を起動: `npm run worker:dev:local`
5. (オプション) Playwright E2E を実行: `npx playwright test`

ノート:
- モックバックエンドは `DATA_MODE=mock` と `DISABLE_NOTIFICATIONS=true` で有効になります。
- Worker は http://127.0.0.1:8787 でリッスンし、バックエンドは http://127.0.0.1:4500 でリッスンします。
- R2 への直接 S3 互換アクセスの場合、エンドポイントは `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` です。

## E2E テスト

プロジェクトは End-to-End テストに Playwright を使用しています。

| コマンド | 説明 | ユースケース |
| :--- | :--- | :--- |
| `npm run setup:e2e` | Playwright ブラウザと依存関係をインストールします。 | 初回セットアップ。 |
| `npm run test:e2e` | **標準実行。** フロントエンドをビルドし、アセットを同期し、テストを実行します。 | コミット前にこれを実行してください。 |
| `npm run test:e2e:quick` | **クイック実行。** ビルド*なし*で Playwright を実行します。 | テストファイルのみを編集する場合の高速イテレーション。 |
| `npm run test:e2e:backend`| **バックエンドのみ。** `backend.spec.ts` のみを実行します。 | API の変更を独立して検証する場合。 |
| `npm run test:e2e:localstack` | **完全統合。** バックエンドを LocalStack にデプロイ + 完全な E2E。 | AWS シミュレーションを使用した深いシステムテスト。 |

## LocalStack E2E (完全統合)

このフローを使用して、LocalStack 上にデプロイされた Lambda/API にアクセスします (すでに devcontainer 内で実行中; `http://localstack:4566` で到達可能)。

```
cd PoliTopicsWeb
npm install --workspaces --include-workspace-root   # 初回のみ
npm run test:e2e:localstack
```

実行内容:
- バックエンド Lambda をビルドし、`tfvars/localstack.tfvars` で Terraform を実行し、API Gateway 呼び出し URL を LocalStack `_user_request_` 形式に変換します。
- `terraform/mock-article/upload_articles.js` (Playwright スペックがアサートするのと同じデータセット) を介して DynamoDB テーブル + S3 ペイロードバケットをシードします。
- LocalStack `_user_request_` URL に設定された `NEXT_PUBLIC_API_BASE_URL` でフロントエンドをビルドし、ローカル R2 に同期し、Wrangler (Miniflare) を起動してから、`E2E_MODE=localstack` (モック Fastify サーバーをスキップ) で Playwright を実行します。

## API サーフェス

| ルート | 説明 |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /headlines?limit=6` | 日付順にソートされた最新の記事 |
| `GET /search?words=給食,子ども政策&sort=date_desc` | Dynamo バックエンドのキーワード検索 (カンマ区切りの単語) |
| `GET /search/suggest?input=給食` | SPA 検索ボックスでの入力中の提案 |
| `GET /article/:issueId` | 詳細ページで使用される完全な記事ペイロード (DynamoDB + S3 からマージされたペイロード) |

バックエンドは DynamoDB (ローカル開発用には LocalStack) を使用します。ローカルで実行する前に、AWS/LocalStack 接続変数が設定されていることを確認してください。
