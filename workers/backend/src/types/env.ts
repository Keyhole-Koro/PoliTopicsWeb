/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  APP_ENV?: "local" | "localstack" | "stage" | "prod";
  
  // Frontend URL
  STAGE_FRONTEND_URL?: string;

  // AWS credentials (secrets)
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // AWS resources (vars)
  AWS_REGION: string;
  DYNAMODB_TABLE_NAME: string;
  S3_ASSET_BUCKET: string;

  // Optional endpoints (LocalStack / custom)
  AWS_ENDPOINT_URL?: string;
  LOCALSTACK_URL?: string;
  LOCALSTACK_ENDPOINT_URL?: string;
  DYNAMODB_ENDPOINT_URL?: string;
  S3_ENDPOINT_URL?: string;
  S3_FORCE_PATH_STYLE?: string;

  // Discord webhooks (secrets)
  DISCORD_WEBHOOK_ERROR?: string;
  DISCORD_WEBHOOK_WARN?: string;
  DISCORD_WEBHOOK_ACCESS?: string;
}
