output "frontend_bucket" {
  value = {
    name    = aws_s3_bucket.frontend.bucket
    website = aws_s3_bucket_website_configuration.frontend.website_endpoint
  }
}

output "article_payload_bucket" {
  value = local.article_payload_bucket
}
