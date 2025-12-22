resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = var.frontend_public_enabled ? false : true
  block_public_policy     = var.frontend_public_enabled ? false : true
  ignore_public_acls      = var.frontend_public_enabled ? false : true
  restrict_public_buckets = var.frontend_public_enabled ? false : true
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
  count  = var.frontend_public_enabled ? 1 : 0
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

locals {
  frontend_patterns = [
    "app/**/*",
    "components/**/*",
    "hooks/**/*",
    "lib/**/*",
    "public/**/*",
    "styles/**/*",
    "*.json",
    "*.mjs",
    "*.ts",
    "*.d.ts"
  ]
  frontend_files = flatten([
    for pattern in local.frontend_patterns : fileset("${path.module}/../../../frontend", pattern)
  ])
}

resource "null_resource" "build_frontend" {
  for_each = var.frontend_deploy_enabled ? { current = var.frontend_bucket } : {}

  provisioner "local-exec" {
    command     = "${path.module}/../../scripts/build-frontend.sh"
    working_dir = "${path.module}/../.."
    interpreter = ["/bin/bash", "-c"]
  }

  triggers = {
    bucket      = each.value
    environment = var.environment
    src_hash    = sha1(join("", [for f in local.frontend_files : filesha1("${path.module}/../../../frontend/${f}")]))
  }
}

resource "null_resource" "upload_frontend" {
  for_each = var.frontend_deploy_enabled ? { current = var.frontend_bucket } : {}

  depends_on = [
    aws_s3_bucket.frontend,
    null_resource.build_frontend["current"]
  ]

  provisioner "local-exec" {
    command     = "${path.module}/../../scripts/upload-frontend.sh ${each.value}"
    working_dir = "${path.module}/../.."
    interpreter = ["/bin/bash", "-c"]
  }

  triggers = {
    bucket      = each.value
    environment = var.environment
    build_id    = null_resource.build_frontend["current"].id
  }
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
