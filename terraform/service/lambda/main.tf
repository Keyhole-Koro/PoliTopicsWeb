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

    resources = [var.table_arn]
  }

  statement {
    sid = "AllowArticlePayloadRead"

    actions = [
      "s3:GetObject"
    ]

    resources = ["${var.payload_bucket_arn}/*"]
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
  handler          = "dist/lambda.handler"
  runtime          = "nodejs22.x"
  memory_size      = 512
  timeout          = 10
  description      = var.lambda_description

  environment {
    variables = {
      DATA_MODE        = "dynamo"
      AWS_REGION       = var.region
      POLITOPICS_TABLE = var.table_name
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_api" "backend" {
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
  api_id                 = aws_apigatewayv2_api.backend.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "backend" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = var.environment
  auto_deploy = true

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_permission" "backend_invoke" {
  statement_id  = "AllowExecutionFromHttpApi-${var.environment}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*"
}
