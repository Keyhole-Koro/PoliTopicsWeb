resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_policy" "frontend_public" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowPublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "article_payload" {
  count  = var.is_localstack ? 1 : 0
  bucket = var.article_payload_bucket

  tags = {
    Environment = var.environment
  }
}

locals {
  article_payload_bucket = var.is_localstack ? {
    name = aws_s3_bucket.article_payload[0].bucket
    arn  = aws_s3_bucket.article_payload[0].arn
    id   = aws_s3_bucket.article_payload[0].id
  } : {
    name = var.article_payload_bucket
    arn  = "arn:aws:s3:::${var.article_payload_bucket}"
    id   = var.article_payload_bucket
  }
}
