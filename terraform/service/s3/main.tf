locals {
  article_asset_enabled  = var.is_localstack ? { current = true } : {}
  frontend_hosting_local = var.is_localstack || var.environment == "local" || var.environment == "localstack"
  frontend_upload_env = merge(
    (var.frontend_r2_endpoint_url != null && var.frontend_r2_endpoint_url != "") ? {
      FRONTEND_S3_ENDPOINT_URL = var.frontend_r2_endpoint_url
    } : {},
    (var.frontend_r2_region != null && var.frontend_r2_region != "") ? {
      FRONTEND_S3_REGION = var.frontend_r2_region
    } : {},
    (var.frontend_r2_access_key_id != null && var.frontend_r2_access_key_id != "") ? {
      AWS_ACCESS_KEY_ID = var.frontend_r2_access_key_id
    } : {},
    (var.frontend_r2_secret_access_key != null && var.frontend_r2_secret_access_key != "") ? {
      AWS_SECRET_ACCESS_KEY = var.frontend_r2_secret_access_key
    } : {}
  )
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
  for_each = (var.frontend_deploy_enabled && local.frontend_hosting_local) ? { current = var.frontend_bucket } : {}

  provisioner "local-exec" {
    command     = "${path.module}/../../scripts/build-frontend.sh"
    working_dir = "${path.module}/../.."
    interpreter = ["/bin/bash", "-c"]
    environment = {
      FRONTEND_BUILD_ENV = var.environment
    }
  }

  triggers = {
    bucket      = each.value
    environment = var.environment
    src_hash    = sha1(join("", [for f in local.frontend_files : filesha1("${path.module}/../../../frontend/${f}")]))
  }
}

resource "null_resource" "upload_frontend" {
  for_each   = (var.frontend_deploy_enabled && local.frontend_hosting_local) ? { current = var.frontend_bucket } : {}
  depends_on = [null_resource.build_frontend["current"]]

  provisioner "local-exec" {
    command     = "${path.module}/../../scripts/upload-frontend.sh ${each.value}"
    working_dir = "${path.module}/../.."
    interpreter = ["/bin/bash", "-c"]
    environment = local.frontend_upload_env
  }

  triggers = {
    bucket      = each.value
    environment = var.environment
    build_id    = null_resource.build_frontend["current"].id
  }
}

resource "aws_s3_bucket" "article_asset_url" {
  for_each = local.article_asset_enabled
  bucket   = var.article_asset_url_bucket

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_cors_configuration" "article_asset_url" {
  for_each = local.article_asset_enabled
  bucket   = aws_s3_bucket.article_asset_url[each.key].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket" "frontend" {
  count         = local.frontend_hosting_local ? 1 : 0
  bucket        = var.frontend_bucket
  force_destroy = true

  tags = {
    Environment = var.environment
  }
}

locals {
  frontend_bucket_output = local.frontend_hosting_local && length(aws_s3_bucket.frontend) > 0 ? {
    name    = aws_s3_bucket.frontend[0].bucket
    website = null
    } : {
    name    = var.frontend_bucket
    website = null
  }
}

locals {
  article_asset_url_bucket = var.is_localstack ? {
    name = aws_s3_bucket.article_asset_url["current"].bucket
    arn  = aws_s3_bucket.article_asset_url["current"].arn
    id   = aws_s3_bucket.article_asset_url["current"].id
    } : {
    name = var.article_asset_url_bucket
    arn  = "arn:aws:s3:::${var.article_asset_url_bucket}"
    id   = var.article_asset_url_bucket
  }
}