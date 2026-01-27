module "s3" {
  source = "./s3"

  environment                   = var.environment
  frontend_bucket               = var.frontend_bucket
  frontend_public_enabled       = var.frontend_public_enabled
  frontend_deploy_enabled       = var.frontend_deploy_enabled
  frontend_r2_endpoint_url      = var.frontend_r2_endpoint_url
  frontend_r2_region            = var.frontend_r2_region
  frontend_r2_access_key_id     = var.frontend_r2_access_key_id
  frontend_r2_secret_access_key = var.frontend_r2_secret_access_key
  article_asset_url_bucket      = var.article_asset_url_bucket
  is_localstack                 = var.is_localstack
}

module "dynamodb" {
  source = "./dynamodb"

  table_name            = var.articles_table
  create_dynamodb_table = var.create_dynamodb_table
  tags                  = var.tags
}

# Lambda module removed - backend now runs on Cloudflare Workers
