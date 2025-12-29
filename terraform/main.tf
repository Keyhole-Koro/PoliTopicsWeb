locals {
  frontend_bucket        = coalesce(var.frontend_bucket, "politopics-frontend-${var.environment}")
  articles_table         = coalesce(var.articles_table, "politopics-${var.environment}")
  article_asset_url_bucket = coalesce(var.article_asset_url_bucket, "politopics-articles-${var.environment}")

  lambda_name        = coalesce(var.lambda_name, "politopics-backend-${var.environment}")
  api_name           = coalesce(var.api_name, "politopics-api-${var.environment}")
  lambda_description = coalesce(var.lambda_description, "PoliTopics backend API (${var.environment})")

  tags = {
    Environment = var.environment
    Project     = "PoliTopics"
  }
}

module "service" {
  source = "./service"

  region                 = var.region
  environment            = var.environment
  backend_lambda_package = var.backend_lambda_package

  frontend_bucket        = local.frontend_bucket
  frontend_public_enabled = var.frontend_public_enabled
  frontend_deploy_enabled = var.frontend_deploy_enabled
  frontend_r2_endpoint_url = var.frontend_r2_endpoint_url
  frontend_r2_region       = var.frontend_r2_region
  frontend_r2_access_key_id = var.frontend_r2_access_key_id
  frontend_r2_secret_access_key = var.frontend_r2_secret_access_key
  articles_table         = local.articles_table
  article_asset_url_bucket = local.article_asset_url_bucket

  lambda_name        = local.lambda_name
  api_name           = local.api_name
  lambda_description = local.lambda_description
  api_custom_domain_name = var.api_custom_domain_name
  api_custom_domain_certificate_arn = var.api_custom_domain_certificate_arn

  use_http_api = var.use_http_api

  create_dynamodb_table = var.create_dynamodb_table
  tags                  = local.tags
  is_localstack         = var.is_localstack
}
