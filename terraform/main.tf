locals {
  frontend_bucket          = coalesce(var.frontend_bucket, "politopics-frontend-${var.environment}")
  articles_table           = coalesce(var.articles_table, "politopics-${var.environment}")
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
  discord_webhook_error  = var.discord_webhook_error
  discord_webhook_warn   = var.discord_webhook_warn
  discord_webhook_access = var.discord_webhook_access
  headlines_job_enabled  = var.headlines_job_enabled
  headlines_job_name     = var.headlines_job_name
  headlines_job_package  = var.headlines_job_package
  headlines_job_bucket   = var.headlines_job_bucket
  headlines_job_key      = var.headlines_job_key

  frontend_bucket               = local.frontend_bucket
  frontend_public_enabled       = var.frontend_public_enabled
  frontend_deploy_enabled       = var.frontend_deploy_enabled
  frontend_r2_endpoint_url      = var.frontend_r2_endpoint_url
  frontend_r2_region            = var.frontend_r2_region
  frontend_r2_access_key_id     = var.frontend_r2_access_key_id
  frontend_r2_secret_access_key = var.frontend_r2_secret_access_key
  articles_table                = local.articles_table
  article_asset_url_bucket      = local.article_asset_url_bucket

  lambda_name                       = local.lambda_name
  api_name                          = local.api_name
  lambda_description                = local.lambda_description
  api_custom_domain_name            = var.api_custom_domain_name
  api_custom_domain_certificate_arn = var.api_custom_domain_certificate_arn

  use_http_api = var.use_http_api

  headlines_job_limit                = var.headlines_job_limit
  headlines_job_path                 = var.headlines_job_path
  headlines_job_schedule_expression  = var.headlines_job_schedule_expression
  headlines_job_cache_control        = var.headlines_job_cache_control
  headlines_job_timeout              = var.headlines_job_timeout
  headlines_job_memory_size          = var.headlines_job_memory_size
  headlines_job_api_url              = var.headlines_job_api_url
  headlines_job_request_timeout_ms   = var.headlines_job_request_timeout_ms
  headlines_job_s3_endpoint          = var.headlines_job_s3_endpoint
  headlines_job_s3_region            = var.headlines_job_s3_region
  headlines_job_s3_force_path_style  = var.headlines_job_s3_force_path_style
  headlines_job_s3_access_key_id     = var.headlines_job_s3_access_key_id
  headlines_job_s3_secret_access_key = var.headlines_job_s3_secret_access_key
  headlines_job_s3_session_token     = var.headlines_job_s3_session_token
  headlines_job_batch_webhook        = var.headlines_job_batch_webhook
  headlines_job_error_webhook        = var.headlines_job_error_webhook

  create_dynamodb_table = var.create_dynamodb_table
  tags                  = local.tags
  is_localstack         = var.is_localstack
}
