locals {
  headlines_job_enabled = var.headlines_job_enabled ? { current = true } : {}
  headlines_job_name = (
    var.headlines_job_name != null && var.headlines_job_name != ""
      ? var.headlines_job_name
      : "politopics-headlines-cron-${var.environment}"
  )
  headlines_job_bucket = (
    var.headlines_job_bucket != null && var.headlines_job_bucket != ""
      ? var.headlines_job_bucket
      : var.frontend_bucket
  )
  headlines_job_api_url = (
    var.headlines_job_api_url != null && var.headlines_job_api_url != ""
      ? var.headlines_job_api_url
      : module.lambda.api_url
  )
  headlines_job_s3_endpoint          = var.headlines_job_s3_endpoint != null ? var.headlines_job_s3_endpoint : ""
  headlines_job_s3_region            = var.headlines_job_s3_region != null ? var.headlines_job_s3_region : var.region
  headlines_job_s3_access_key_id     = var.headlines_job_s3_access_key_id != null ? var.headlines_job_s3_access_key_id : ""
  headlines_job_s3_secret_access_key = var.headlines_job_s3_secret_access_key != null ? var.headlines_job_s3_secret_access_key : ""
  headlines_job_s3_session_token     = var.headlines_job_s3_session_token != null ? var.headlines_job_s3_session_token : ""
  headlines_job_batch_webhook        = var.headlines_job_batch_webhook != null ? var.headlines_job_batch_webhook : ""
  headlines_job_error_webhook        = var.headlines_job_error_webhook != null ? var.headlines_job_error_webhook : local.headlines_job_batch_webhook
}

data "aws_iam_policy_document" "headlines_job_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "headlines_job_bucket_access" {
  for_each = local.headlines_job_enabled

  statement {
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:AbortMultipartUpload",
      "s3:ListBucket"
    ]

    resources = [
      "arn:aws:s3:::${local.headlines_job_bucket}",
      "arn:aws:s3:::${local.headlines_job_bucket}/*"
    ]
  }
}

resource "aws_iam_role" "headlines_job" {
  for_each           = local.headlines_job_enabled
  name               = "${local.headlines_job_name}-role"
  assume_role_policy = data.aws_iam_policy_document.headlines_job_assume_role.json
}

resource "aws_iam_policy" "headlines_job_bucket_access" {
  for_each = local.headlines_job_enabled
  name     = "${local.headlines_job_name}-bucket-access"
  policy   = data.aws_iam_policy_document.headlines_job_bucket_access[each.key].json
}

resource "aws_iam_role_policy_attachment" "headlines_job_bucket_access" {
  for_each   = local.headlines_job_enabled
  role       = aws_iam_role.headlines_job[each.key].name
  policy_arn = aws_iam_policy.headlines_job_bucket_access[each.key].arn
}

resource "aws_iam_role_policy_attachment" "headlines_job_basic_execution" {
  for_each   = local.headlines_job_enabled
  role       = aws_iam_role.headlines_job[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "headlines_job" {
  for_each = local.headlines_job_enabled

  function_name    = local.headlines_job_name
  role             = aws_iam_role.headlines_job[each.key].arn
  filename         = pathexpand(var.headlines_job_package)
  source_code_hash = filebase64sha256(pathexpand(var.headlines_job_package))
  handler          = "index.handler"
  runtime          = var.is_localstack ? "nodejs20.x" : "nodejs22.x"
  memory_size      = var.headlines_job_memory_size
  timeout          = var.headlines_job_timeout
  architectures    = var.is_localstack ? ["x86_64"] : ["arm64"]
  description      = "Fetch /headlines and inject into index.html in ${local.headlines_job_bucket}"

  environment {
    variables = {
      ACTIVE_ENVIRONMENT           = var.environment
      HEADLINES_API_URL            = local.headlines_job_api_url
      HEADLINES_PATH               = var.headlines_job_path
      HEADLINES_LIMIT              = tostring(var.headlines_job_limit)
      HEADLINES_BUCKET             = local.headlines_job_bucket


      HEADLINES_REQUEST_TIMEOUT_MS = tostring(var.headlines_job_request_timeout_ms)
      STAGE_BACKEND_API_URL        = var.environment == "stage" ? local.headlines_job_api_url : ""
      S3_ENDPOINT                  = local.headlines_job_s3_endpoint
      S3_COMPATIBLE_API_STAGE      = var.environment == "stage" ? local.headlines_job_s3_endpoint : ""
      S3_COMPATIBLE_API_PROD       = var.environment == "prod" ? local.headlines_job_s3_endpoint : ""
      S3_REGION                    = local.headlines_job_s3_region
      S3_FORCE_PATH_STYLE          = var.headlines_job_s3_force_path_style ? "true" : "false"
      S3_ACCESS_KEY_ID             = local.headlines_job_s3_access_key_id
      S3_SECRET_ACCESS_KEY         = local.headlines_job_s3_secret_access_key
      S3_SESSION_TOKEN             = local.headlines_job_s3_session_token
      DISCORD_WEBHOOK_BATCH        = local.headlines_job_batch_webhook
      DISCORD_WEBHOOK_ERROR        = local.headlines_job_error_webhook
    }
  }

  tags = var.tags
}

resource "aws_cloudwatch_event_rule" "headlines_job" {
  for_each = local.headlines_job_enabled

  name                = "${local.headlines_job_name}-schedule"
  description         = "Nightly headlines snapshot at 03:00 JST (18:00 UTC)"
  schedule_expression = var.headlines_job_schedule_expression
}

resource "aws_cloudwatch_event_target" "headlines_job" {
  for_each = local.headlines_job_enabled

  rule = aws_cloudwatch_event_rule.headlines_job[each.key].name
  arn  = aws_lambda_function.headlines_job[each.key].arn
  target_id = "headlines-cron"
}

resource "aws_lambda_permission" "allow_events_headlines_job" {
  for_each      = local.headlines_job_enabled
  statement_id  = "AllowExecutionFromEventsHeadlines-${var.environment}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.headlines_job[each.key].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.headlines_job[each.key].arn
}
