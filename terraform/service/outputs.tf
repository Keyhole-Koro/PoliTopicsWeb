output "frontend_bucket" {
  value = module.s3.frontend_bucket
}

output "article_asset_url_bucket" {
  value = module.s3.article_asset_url_bucket
}

output "article_table" {
  value = {
    name = module.dynamodb.table.name
    arn  = module.dynamodb.table.arn
  }
}

output "backend_api_url" {
  value = module.lambda.api_url
}
