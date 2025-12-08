output "frontend_bucket" {
  value = {
    name    = aws_s3_bucket.frontend.bucket
    website = aws_s3_bucket_website_configuration.frontend.website_endpoint
  }
}

output "article_payload_bucket" {
  value = {
    name = data.aws_s3_bucket.article_payload.bucket
    arn  = data.aws_s3_bucket.article_payload.arn
    id   = data.aws_s3_bucket.article_payload.id
  }
}
