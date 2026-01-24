/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  APP_ENV: "stage" | "prod";
  
  // Frontend URL
  STAGE_FRONTEND_URL: string;

  // AWS credentials (secrets)
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // AWS resources (vars)
  AWS_REGION: string;
  DYNAMODB_TABLE_NAME: string;
  S3_ASSET_BUCKET: string;

  // Discord webhooks (secrets)
  DISCORD_WEBHOOK_ERROR?: string;
  DISCORD_WEBHOOK_WARN?: string;
  DISCORD_WEBHOOK_ACCESS?: string;
}
