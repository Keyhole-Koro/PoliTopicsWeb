# Configuration Files Reference

This document provides an overview of the key configuration files within the `PoliTopicsWeb` project, explaining their roles in the architecture and development workflow.

## Root & Deployment

| File | Description |
| :--- | :--- |
| **`wrangler.toml`** | **Cloudflare Workers / Pages Configuration**<br>Configures the Worker that serves the Web Frontend (SPA).<br>- `[env.*]`: Environment-specific definitions (`local`, `stage`, `prod`).<br>- `r2_buckets`: Bindings for R2 buckets storing static build assets.<br>- `routes`: Custom domain settings (e.g., `politopics.net`). |
| **`playwright.config.ts`** | **E2E Test Configuration (Playwright)**<br>Settings for browser-based testing.<br>- `webServer`: Commands to auto-start Backend (Hono) and Frontend (Wrangler) during tests.<br>- Configures environment variables (e.g., `AWS_ENDPOINT_URL`) passed to the test process. |
| **`tsconfig.json`**<br>**`tsconfig.base.json`** | **TypeScript Configuration**<br>`tsconfig.base.json` defines base settings and path aliases (e.g., `@shared/*`), which are inherited and extended by sub-projects (`frontend`, `workers/backend`). |

## Frontend (`frontend/`)

| File | Description |
| :--- | :--- |
| **`next.config.mjs`** | **Next.js Configuration**<br>- `output: "export"`: Configures static export for hosting on Cloudflare R2.<br>- `images: { unoptimized: true }`: Disables Next.js image optimization server as it's not available in static export. |
| **`postcss.config.mjs`** | **CSS Tool Configuration**<br>Plugin settings for using Tailwind CSS v4 (`@tailwindcss/postcss`). |
| **`components.json`** | **UI Component Configuration (shadcn/ui)**<br>Settings for the `shadcn/ui` library.<br>- `style`: "new-york"<br>- `aliases`: Defines import paths for components and utils (e.g., `@/components`). |

## Backend Logic (`workers/backend/`)

| File | Description |
| :--- | :--- |
| **`src/config.ts`** | **Application Logic Configuration**<br>Key logic determining app behavior based on environment variables.<br>- `resolveAppEnvironment`: Determines `local`, `stage`, or `prod`.<br>- `resolveAwsEndpoints`: Switches between LocalStack (local) and AWS (production).<br>- **`resolveArticleRepositoryMode`**: Switches between DynamoDB and Mock repository based on `ARTICLE_REPOSITORY` environment variable. |

## Scripts & Custom Config (`scripts/`)

| File | Description |
| :--- | :--- |
| **`e2econfig.js`** | **Centralized Test & Dev Configuration**<br>Referenced by shell and Node scripts to ensure consistent environments.<br>- Defines presets (e.g., `localstack`), port numbers, and environment variable sets for AWS/LocalStack.<br>- Serves as the source of truth for local execution parameters. |
| **`dev-nextjs-honoserver.js`** | **Local Development Runner**<br>Script to launch Next.js (Frontend) and Hono (Backend) simultaneously.<br>- Utilizes configurations for ports and asset servers to provide a hot-reload capable local environment. |
