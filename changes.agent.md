# changes.agent.md

Agent: Codex
Date/Time: 2025-12-22 03:38 UTC
Keywords: localstack, terraform, state-bucket
Topic: Align state bucket creation with backend config
Details:
- Standardized the Web state-bucket script to use the LocalStack endpoint convention and consistent env argument format.

Agent: Gemini
Date/Time: 2025-12-22 13:00 JST
Keywords: terraform, typescript, import, s3
Topic: Fix build errors and improve import logic
Details:
- Fixed TypeScript error in `dynamoArticleMapper.ts` by ensuring `originalText` is always a string.
- Refactored `fileset` usage in Terraform to avoid syntax errors with brace expansion.
- Updated `create-state-bucket.sh` to create `politopics-frontend-localstack` for local environment.
- Updated `import_all.sh` to gracefully skip non-existent objects.
- Files changed:
  - `backend/src/repositories/dynamoArticleMapper.ts`
  - `terraform/service/s3/main.tf`
  - `terraform/scripts/create-state-bucket.sh`
  - `terraform/scripts/import_all.sh`

Agent: Gemini
Date/Time: 2025-12-23 00:00 UTC
Keywords: payload, asset, naming convention
Topic: Rename 'payload' to 'asset' in relevant contexts
Details:
- In `backend/src/config.ts`, renamed `articlePayloadBucket` to `articleAssetBucket`.
- In `backend/src/repositories/dynamoArticleMapper.ts`:
    - Changed `payload_key` to `asset_key`.
    - Renamed type `ArticlePayloadData` to `ArticleAssetData`.
    - Updated function signature `mapItemToArticle` to use `asset` and `ArticleAssetData`.
    - Changed `payload?.` to `asset?.` within the function.
- In `backend/src/repositories/factory.ts`, changed `payloadBucket` to `assetBucket`.
- In `backend/src/repositories/dynamoArticleRepository.ts`:
    - Changed imported type `ArticlePayloadData` to `ArticleAssetData`.
    - Changed `payloadBucket` to `assetBucket` everywhere.
    - Renamed `payload` variable to `asset` and `loadPayload` function to `loadAsset`.
    - Updated `mapItemToArticle` call to use `asset`.
    - Changed return type cast to `ArticleAssetData`.
    - Updated log message from "Failed to load payload" to "Failed to load asset".

Agent: Gemini
Date/Time: 2025-12-24 12:10 JST
Keywords: terraform, variable-renaming, payload, asset
Topic: Rename payload bucket variables to asset url bucket in Terraform
Details:
- Renamed `payload_bucket_name` to `asset_url_bucket_name` and `payload_bucket_arn` to `asset_url_bucket_arn` in `terraform/service/lambda/variables.tf`.
- Updated references in `terraform/service/lambda/main.tf` to use the new variable names.
- Files changed:
  - `terraform/service/lambda/variables.tf`
  - `terraform/service/lambda/main.tf`

Agent: Codex
Date/Time: 2025-12-26 09:07 JST
Keywords: terraform, api-gateway, custom-domain
Topic: Add optional API Gateway custom domain wiring
Details:
- Added optional API Gateway custom domain inputs for prod and conditional domain/mapping resources.
- Exposed the configured custom domain name in Terraform outputs.
- Removed optional custom-domain target/hosted-zone outputs after confirmation.
- Files changed:
  - `PoliTopicsWeb/terraform/variables.tf`
  - `PoliTopicsWeb/terraform/main.tf`
  - `PoliTopicsWeb/terraform/service/variables.tf`
  - `PoliTopicsWeb/terraform/service/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/variables.tf`
  - `PoliTopicsWeb/terraform/service/lambda/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/outputs.tf`
  - `PoliTopicsWeb/terraform/service/outputs.tf`
  - `PoliTopicsWeb/terraform/outputs.tf`
  - `PoliTopicsWeb/terraform/tfvars/prod.tfvars`

Agent: Codex
Date/Time: 2025-12-26 10:01 JST
Keywords: terraform, import, scripts
Topic: Make import scripts tolerant of missing resources
Details:
- Updated import scripts to skip missing configuration/resources instead of failing.
- Files changed:
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`

Agent: Codex
Date/Time: 2025-12-26 10:03 JST
Keywords: terraform, import, dynamodb, api-gateway
Topic: Remove count-based gating and align imports
Details:
- Removed `count = ... ? 0 : 1` usage for DynamoDB and REST API resources and switched to `for_each` where needed.
- Updated import addresses to match non-indexed resources.
- Files changed:
  - `PoliTopicsWeb/terraform/service/dynamodb/main.tf`
  - `PoliTopicsWeb/terraform/service/dynamodb/outputs.tf`
  - `PoliTopicsWeb/terraform/service/lambda/main.tf`
  - `PoliTopicsWeb/terraform/service/lambda/outputs.tf`
  - `PoliTopicsWeb/terraform/scripts/import_all.sh`

Agent: Codex
Date/Time: 2025-12-26 10:48 JST
Keywords: terraform, frontend, build
Topic: Fix frontend build selection during Terraform apply
Details:
- Pass the Terraform environment into the frontend build script.
- Route the build to `build:local`, `build:stage`, or `build:prod` based on environment.
- Added a default `build` script and explicit `build:prod` for the frontend package.
- Files changed:
  - `PoliTopicsWeb/terraform/scripts/build-frontend.sh`
  - `PoliTopicsWeb/terraform/service/s3/main.tf`
  - `PoliTopicsWeb/frontend/package.json`
