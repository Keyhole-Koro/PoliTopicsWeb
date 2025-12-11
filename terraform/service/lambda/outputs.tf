output "api_url" {
  value = var.use_http_api ? aws_apigatewayv2_stage.backend[0].invoke_url : aws_api_gateway_stage.backend[0].invoke_url
}
