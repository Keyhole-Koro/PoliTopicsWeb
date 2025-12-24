output "frontend_bucket" {
  value = {
    name    = aws_s3_bucket.frontend.bucket
    website = aws_s3_bucket_website_configuration.frontend.website_endpoint
  }
}

output "article_asset_url_bucket" {
  value = local.article_asset_url_bucket
}
