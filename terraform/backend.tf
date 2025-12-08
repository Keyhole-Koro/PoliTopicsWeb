locals {
  backend_configs = {
    stage = {
      lambda_name = "politopics-backend-stage"
      api_name    = "politopics-api-stage"
      table_name  = data.aws_dynamodb_table.articles_stage.name
      table_arn   = data.aws_dynamodb_table.articles_stage.arn
      bucket_name = data.aws_s3_bucket.article_payloads_stage.bucket
      bucket_arn  = data.aws_s3_bucket.article_payloads_stage.arn
      description = "PoliTopics backend API (stage)"
    }
    prod = {
      lambda_name = "politopics-backend-prod"
      api_name    = "politopics-api-prod"
      table_name  = data.aws_dynamodb_table.articles_prod.name
      table_arn   = data.aws_dynamodb_table.articles_prod.arn
      bucket_name = data.aws_s3_bucket.article_payloads_prod.bucket
      bucket_arn  = data.aws_s3_bucket.article_payloads_prod.arn
      description = "PoliTopics backend API (production)"
    }
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "backend_data_access" {
  for_each = local.backend_configs

  statement {
    sid = "AllowDynamoRead"

    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]

    resources = [each.value.table_arn]
  }

  statement {
    sid = "AllowArticlePayloadRead"

    actions = [
      "s3:GetObject"
    ]

    resources = ["${each.value.bucket_arn}/*"]
  }
}

resource "aws_iam_role" "backend_lambda" {
  for_each = local.backend_configs

  name               = "${each.value.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_policy" "backend_data_access" {
  for_each = local.backend_configs

  name   = "${each.value.lambda_name}-data-access"
  policy = data.aws_iam_policy_document.backend_data_access[each.key].json
}

resource "aws_iam_role_policy_attachment" "backend_data_access" {
  for_each = local.backend_configs

  role       = aws_iam_role.backend_lambda[each.key].name
  policy_arn = aws_iam_policy.backend_data_access[each.key].arn
}

resource "aws_iam_role_policy_attachment" "backend_basic_execution" {
  for_each = local.backend_configs

  role       = aws_iam_role.backend_lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "backend" {
  for_each = local.backend_configs

  function_name = each.value.lambda_name
  role          = aws_iam_role.backend_lambda[each.key].arn
  filename      = pathexpand(var.backend_lambda_package)
  source_code_hash = filebase64sha256(pathexpand(var.backend_lambda_package))
  handler       = "dist/lambda.handler"
  runtime       = "nodejs22.x"
  memory_size   = 512
  timeout       = 10
  description   = each.value.description

  environment {
    variables = {
      DATA_MODE        = "dynamo"
      AWS_REGION       = var.region
      POLITOPICS_TABLE = each.value.table_name
    }
  }
}

resource "aws_apigatewayv2_api" "backend" {
  for_each = local.backend_configs

  name          = each.value.api_name
  protocol_type = "HTTP"
  description   = each.value.description

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "backend" {
  for_each = local.backend_configs

  api_id                 = aws_apigatewayv2_api.backend[each.key].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend[each.key].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "backend" {
  for_each = local.backend_configs

  api_id    = aws_apigatewayv2_api.backend[each.key].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.backend[each.key].id}"
}

resource "aws_apigatewayv2_stage" "backend" {
  for_each = local.backend_configs

  api_id      = aws_apigatewayv2_api.backend[each.key].id
  name        = each.key
  auto_deploy = true
}

resource "aws_lambda_permission" "backend_invoke" {
  for_each = local.backend_configs

  statement_id  = "AllowExecutionFromHttpApi-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend[each.key].execution_arn}/*/*"
}
