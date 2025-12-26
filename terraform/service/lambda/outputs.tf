output "api_url" {
  value = var.use_http_api ? aws_apigatewayv2_stage.backend[0].invoke_url : aws_api_gateway_stage.backend["current"].invoke_url
}

output "api_custom_domain_name" {
  value = local.enable_custom_domain ? var.api_custom_domain_name : null
}
