locals {
  frontend_bucket        = coalesce(var.frontend_bucket, "politopics-frontend-${var.environment}")
  articles_table         = coalesce(var.articles_table, "politopics-${var.environment}")
  article_payload_bucket = coalesce(var.article_payload_bucket, "politopics-articles-${var.environment}")

  lambda_name        = coalesce(var.lambda_name, "politopics-backend-${var.environment}")
  api_name           = coalesce(var.api_name, "politopics-api-${var.environment}")
  lambda_description = coalesce(var.lambda_description, "PoliTopics backend API (${var.environment})")
}

module "service" {
  source = "./service"

  region                 = var.region
  environment            = var.environment
  backend_lambda_package = var.backend_lambda_package

  frontend_bucket        = local.frontend_bucket
  articles_table         = local.articles_table
  article_payload_bucket = local.article_payload_bucket

  lambda_name        = local.lambda_name
  api_name           = local.api_name
  lambda_description = local.lambda_description
}
