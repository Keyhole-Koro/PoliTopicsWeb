# Script Usage Flows

This document illustrates the execution flow and component interaction for the primary development and testing scripts in `PoliTopicsWeb`.

## 1. Mock Development Mode

**Command:** `npm run dev:nextjs:honoserver`
**Use Case:** Rapid UI/Logic development without external dependencies (Docker/LocalStack). Uses in-memory mock data.

```mermaid
flowchart TD
    User[Developer] -->|Runs| Command["npm run dev:nextjs:honoserver"]
    Command --> Script["scripts/dev-nextjs-honoserver.js"]

    subgraph Config
        Script -->|Reads| E2EConfig["scripts/e2econfig.js<br/>(preset: mock)"]
    end

    subgraph Parallel Execution
        Script -->|Spawns| NextJS["Frontend (Next.js)<br/>Port: 3000<br/>(Hot Reload)"]
        Script -->|Spawns| Hono["Backend (Hono)<br/>Port: 4500<br/>Env: ARTICLE_REPOSITORY=mock"]
        Script -->|Spawns| Asset["Asset Server (Node.js)<br/>Port: 4570<br/>(Serves .local-assets)"]
    end

    NextJS <-->|API Calls| Hono
    NextJS <-->|Fetch Assets| Asset
    Hono -->|Internal Mock| MockRepo[Mock Article Repository]
```

## 2. LocalStack Development Mode

**Command:** `npm run dev:localstack`
**Use Case:** Integration testing with "real" AWS services locally. Uses LocalStack for DynamoDB and S3. Frontend is served via Cloudflare Wrangler to mimic production.

```mermaid
flowchart TD
    User[Developer] -->|Runs| Command["npm run dev:localstack"]
    Command --> Script["scripts/dev-localstack.sh"]

    subgraph Pre-flight
        Script -->|Check/Create| Ensure["scripts/ensure-localstack.sh"]
        Ensure -->|AWS CLI| LocalStack[(LocalStack<br/>DynamoDB / S3)]
    end

    subgraph Preparation
        Script -->|Builds| Build["npm run build:frontend:local"]
        Script -->|Syncs Assets| Sync["npm run r2:local:sync"]
        Sync -->|Uploads| LocalStack
        Script -->|Seeds DB| Seed["npm run db:seed:local"]
        Seed -->|Writes| LocalStack
    end

    subgraph Runtime
        Script -->|Background| Hono["Backend (Hono)<br/>Port: 4500<br/>Env: ARTICLE_REPOSITORY=dynamo"]
        Script -->|Foreground| Wrangler["Frontend (Wrangler)<br/>Port: 8787<br/>(Simulates Cloudflare Worker)"]
    end

    Hono <-->|AWS SDK| LocalStack
    Wrangler <-->|R2 Binding| LocalStack
    Wrangler <-->|API Proxy| Hono
```

## 3. E2E Test Mode

**Command:** `npm run test:e2e:localstack`
**Use Case:** Automated End-to-End testing using Playwright against a full LocalStack environment.

```mermaid
flowchart TD
    User[Developer / CI] -->|Runs| Command["npm run test:e2e:localstack"]
    Command --> Shell["scripts/test-e2e-localstack.sh"]
    Shell --> Runner["scripts/e2e.js"]

    subgraph Setup
        Runner -->|Reads| Config["scripts/e2econfig.js<br/>(preset: localstack)"]
        Runner -->|Executes| Ensure["ensure-localstack.sh"]
        Runner -->|Executes| Seed["terraform/seed/upload_articles.js"]
        Runner -->|Executes| Build["npm run build:frontend:local"]
        Runner -->|Executes| Sync["npm run r2:local:sync"]
    end

    subgraph Testing
        Runner -->|Spawns| Playwright["npx playwright test"]

        subgraph Playwright WebServer
            Playwright -->|Starts| Hono["Backend (Hono)"]
            Playwright -->|Starts| Wrangler["Frontend (Wrangler)"]
        end

        Playwright -->|Browser Actions| Wrangler
    end

    Hono <--> LocalStack[(LocalStack)]
    Wrangler <--> LocalStack
```
