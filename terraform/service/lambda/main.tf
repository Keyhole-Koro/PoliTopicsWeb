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
  statement {
    sid = "AllowDynamoRead"

    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]

    resources = [
      var.table_arn,
      "${var.table_arn}/index/*"
    ]
  }

  statement {
    sid = "AllowArticlePayloadRead"

    actions = [
      "s3:GetObject"
    ]

    resources = ["${var.asset_url_bucket_arn}/*"]
  }
}

resource "aws_iam_role" "backend_lambda" {
  name               = "${var.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_policy" "backend_data_access" {
  name   = "${var.lambda_name}-data-access"
  policy = data.aws_iam_policy_document.backend_data_access.json
}

resource "aws_iam_role_policy_attachment" "backend_data_access" {
  role       = aws_iam_role.backend_lambda.name
  policy_arn = aws_iam_policy.backend_data_access.arn
}

resource "aws_iam_role_policy_attachment" "backend_basic_execution" {
  role       = aws_iam_role.backend_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "backend" {
  function_name    = var.lambda_name
  role             = aws_iam_role.backend_lambda.arn
  filename         = pathexpand(var.backend_lambda_package)
  source_code_hash = filebase64sha256(pathexpand(var.backend_lambda_package))
  handler          = "backend/src/lambda.handler"
  runtime          = var.is_localstack ? "nodejs20.x" : "nodejs22.x"
  memory_size      = 128
  timeout          = 10
  description      = var.lambda_description
  architectures    = ["arm64"]

  environment {
    variables = {
      POLITOPICS_TABLE          = var.table_name
      POLITOPICS_ARTICLE_BUCKET = var.asset_url_bucket_name
      ENV                       = var.environment
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_api" "backend" {
  count         = var.use_http_api ? 1 : 0
  name          = var.api_name
  protocol_type = "HTTP"
  description   = var.lambda_description

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_integration" "backend" {
  count                  = var.use_http_api ? 1 : 0
  api_id                 = aws_apigatewayv2_api.backend[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "backend" {
  # turn off because of free tier limitations
  count     = var.use_http_api ? 1 : 0
  api_id    = aws_apigatewayv2_api.backend[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.backend[0].id}"
}

resource "aws_apigatewayv2_stage" "backend" {
  count       = var.use_http_api ? 1 : 0
  api_id      = aws_apigatewayv2_api.backend[0].id
  name        = var.environment
  auto_deploy = true

  tags = {
    Environment = var.environment
  }
}

resource "aws_api_gateway_rest_api" "backend" {
  # use api gateway v1 instead of v2 because of free tier limitations
  count       = var.use_http_api ? 0 : 1
  name        = var.api_name
  description = var.lambda_description

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_api_gateway_method" "backend_root" {
  count         = var.use_http_api ? 0 : 1
  rest_api_id   = aws_api_gateway_rest_api.backend[0].id
  resource_id   = aws_api_gateway_rest_api.backend[0].root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "backend_root" {
  count                   = var.use_http_api ? 0 : 1
  rest_api_id             = aws_api_gateway_rest_api.backend[0].id
  resource_id             = aws_api_gateway_rest_api.backend[0].root_resource_id
  http_method             = aws_api_gateway_method.backend_root[0].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.backend.arn}/invocations"
}

resource "aws_api_gateway_resource" "backend_proxy" {
  count       = var.use_http_api ? 0 : 1
  rest_api_id = aws_api_gateway_rest_api.backend[0].id
  parent_id   = aws_api_gateway_rest_api.backend[0].root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "backend_proxy" {
  count         = var.use_http_api ? 0 : 1
  rest_api_id   = aws_api_gateway_rest_api.backend[0].id
  resource_id   = aws_api_gateway_resource.backend_proxy[0].id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "backend_proxy" {
  count                   = var.use_http_api ? 0 : 1
  rest_api_id             = aws_api_gateway_rest_api.backend[0].id
  resource_id             = aws_api_gateway_resource.backend_proxy[0].id
  http_method             = aws_api_gateway_method.backend_proxy[0].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.backend.arn}/invocations"
}

resource "aws_api_gateway_deployment" "backend" {
  count       = var.use_http_api ? 0 : 1
  rest_api_id = aws_api_gateway_rest_api.backend[0].id

  triggers = {
    redeployment = sha1(jsonencode({
      root_integration  = aws_api_gateway_integration.backend_root[0].id
      proxy_integration = aws_api_gateway_integration.backend_proxy[0].id
    }))
  }

  depends_on = [
    aws_api_gateway_integration.backend_root,
    aws_api_gateway_integration.backend_proxy
  ]
}

resource "aws_api_gateway_stage" "backend" {
  count         = var.use_http_api ? 0 : 1
  rest_api_id   = aws_api_gateway_rest_api.backend[0].id
  deployment_id = aws_api_gateway_deployment.backend[0].id
  stage_name    = var.environment

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "backend_invoke_http" {
  count         = var.use_http_api ? 1 : 0
  statement_id  = "AllowExecutionFromHttpApi-${var.environment}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend[0].execution_arn}/*/*"
}

resource "aws_lambda_permission" "backend_invoke_rest" {
  count         = var.use_http_api ? 0 : 1
  statement_id  = "AllowExecutionFromRestApi-${var.environment}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.backend[0].execution_arn}/*/*"
}
