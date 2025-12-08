module "s3" {
  source = "./s3"

  environment            = var.environment
  frontend_bucket        = var.frontend_bucket
  article_payload_bucket = var.article_payload_bucket
}

module "dynamodb" {
  source = "./dynamodb"

  articles_table = var.articles_table
}

module "lambda" {
  source = "./lambda"

  region                 = var.region
  environment            = var.environment
  backend_lambda_package = var.backend_lambda_package

  lambda_name        = var.lambda_name
  api_name           = var.api_name
  lambda_description = var.lambda_description

  table_name = module.dynamodb.table.name
  table_arn  = module.dynamodb.table.arn

  payload_bucket_name = module.s3.article_payload_bucket.name
  payload_bucket_arn  = module.s3.article_payload_bucket.arn
}
