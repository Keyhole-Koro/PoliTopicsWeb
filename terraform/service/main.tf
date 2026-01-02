module "s3" {
  source = "./s3"

  environment            = var.environment
  frontend_bucket        = var.frontend_bucket
  frontend_public_enabled = var.frontend_public_enabled
  frontend_deploy_enabled = var.frontend_deploy_enabled
  frontend_r2_endpoint_url = var.frontend_r2_endpoint_url
  frontend_r2_region       = var.frontend_r2_region
  frontend_r2_access_key_id = var.frontend_r2_access_key_id
  frontend_r2_secret_access_key = var.frontend_r2_secret_access_key
  article_asset_url_bucket = var.article_asset_url_bucket
  is_localstack          = var.is_localstack
}

module "dynamodb" {
  source = "./dynamodb"

  table_name            = var.articles_table
  create_dynamodb_table = var.create_dynamodb_table
  tags                  = var.tags
}

module "lambda" {
  source = "./lambda"

  region                 = var.region
  environment            = var.environment
  backend_lambda_package = var.backend_lambda_package
  is_localstack          = var.is_localstack

  lambda_name        = var.lambda_name
  api_name           = var.api_name
  lambda_description = var.lambda_description
  api_custom_domain_name = var.api_custom_domain_name
  api_custom_domain_certificate_arn = var.api_custom_domain_certificate_arn
  use_http_api       = var.use_http_api

  table_name = module.dynamodb.table.name
  table_arn  = module.dynamodb.table.arn

  asset_url_bucket_name = module.s3.article_asset_url_bucket.name
  asset_url_bucket_arn  = module.s3.article_asset_url_bucket.arn
  discord_webhook_error  = var.discord_webhook_error
  discord_webhook_warn   = var.discord_webhook_warn
  discord_webhook_access = var.discord_webhook_access
}
