# スクリプト利用フロー

`PoliTopicsWeb` における主要な開発・テスト用スクリプトの実行フローとコンポーネント間の連携を図解します。

## 1. モック開発モード
**コマンド:** `npm run dev:nextjs:honoserver`
**ユースケース:** 外部依存（Docker/LocalStack）なしでの高速なUI/ロジック開発。インメモリのモックデータを使用します。

```mermaid
flowchart TD
    User[開発者] -->|実行| Command["npm run dev:nextjs:honoserver"]
    Command --> Script["scripts/dev-nextjs-honoserver.js"]
    
    subgraph Config
        Script -->|読み込み| E2EConfig["scripts/e2econfig.js<br/>(preset: mock)"]
    end

    subgraph Parallel Execution [並行実行]
        Script -->|起動| NextJS["Frontend (Next.js)<br/>Port: 3000<br/>(ホットリロード対応)"]
        Script -->|起動| Hono["Backend (Hono)<br/>Port: 4500<br/>Env: ARTICLE_REPOSITORY=mock"]
        Script -->|起動| Asset["Asset Server (Node.js)<br/>Port: 4570<br/>(.local-assets を配信)"]
    end

    NextJS <-->|APIコール| Hono
    NextJS <-->|アセット取得| Asset
    Hono -->|内部利用| MockRepo[Mock Article Repository]
```

## 2. LocalStack 開発モード
**コマンド:** `npm run dev:localstack`
**ユースケース:** ローカル環境での「リアルな」AWSサービスとの統合テスト。DynamoDBとS3にLocalStackを使用し、本番に近い構成（Wrangler）で動作させます。

```mermaid
flowchart TD
    User[開発者] -->|実行| Command["npm run dev:localstack"]
    Command --> Script["scripts/dev-localstack.sh"]

    subgraph Pre-flight [事前チェック]
        Script -->|確認/作成| Ensure["scripts/ensure-localstack.sh"]
        Ensure -->|AWS CLI| LocalStack[(LocalStack<br/>DynamoDB / S3)]
    end

    subgraph Preparation [準備]
        Script -->|ビルド| Build["npm run build:frontend:local"]
        Script -->|アセット同期| Sync["npm run r2:local:sync"]
        Sync -->|アップロード| LocalStack
        Script -->|DBシード| Seed["npm run db:seed:local"]
        Seed -->|書き込み| LocalStack
    end

    subgraph Runtime [実行時]
        Script -->|バックグラウンド| Hono["Backend (Hono)<br/>Port: 4500<br/>Env: ARTICLE_REPOSITORY=dynamo"]
        Script -->|フォアグラウンド| Wrangler["Frontend (Wrangler)<br/>Port: 8787<br/>(Cloudflare Workerを模倣)"]
    end

    Hono <-->|AWS SDK| LocalStack
    Wrangler <-->|R2 Binding| LocalStack
    Wrangler <-->|API Proxy| Hono
```

## 3. E2E テストモード
**コマンド:** `npm run test:e2e:localstack`
**ユースケース:** Playwright を使用した、LocalStack 環境全体に対する自動 E2E テスト。

```mermaid
flowchart TD
    User[開発者 / CI] -->|実行| Command["npm run test:e2e:localstack"]
    Command --> Shell["scripts/test-e2e-localstack.sh"]
    Shell --> Runner["scripts/e2e.js"]

    subgraph Setup [セットアップ]
        Runner -->|読み込み| Config["scripts/e2econfig.js<br/>(preset: localstack)"]
        Runner -->|実行| Ensure["ensure-localstack.sh"]
        Runner -->|実行| Seed["terraform/seed/upload_articles.js"]
        Runner -->|実行| Build["npm run build:frontend:local"]
        Runner -->|実行| Sync["npm run r2:local:sync"]
    end

    subgraph Testing [テスト実行]
        Runner -->|起動| Playwright["npx playwright test"]
        
        subgraph Playwright WebServer
            Playwright -->|起動| Hono["Backend (Hono)"]
            Playwright -->|起動| Wrangler["Frontend (Wrangler)"]
        end
        
        Playwright -->|ブラウザ操作| Wrangler
    end

    Hono <--> LocalStack[(LocalStack)]
    Wrangler <--> LocalStack
```
