variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Deployment environment identifier"
  type        = string
}

variable "backend_lambda_package" {
  description = "Path to the zipped backend Lambda artifact"
  type        = string
}

variable "lambda_name" {
  description = "Name of the backend Lambda function"
  type        = string
}

variable "api_name" {
  description = "Name of the API Gateway HTTP API"
  type        = string
}

variable "lambda_description" {
  description = "Description for Lambda / API resources"
  type        = string
}

variable "api_custom_domain_name" {
  description = "Custom domain name for the API Gateway (e.g. api.example.com)"
  type        = string
  default     = null
}

variable "api_custom_domain_certificate_arn" {
  description = "ACM certificate ARN for the API Gateway custom domain"
  type        = string
  default     = null
}

variable "use_http_api" {
  description = "Toggle to provision an API Gateway HTTP API (true) or REST API (false)"
  type        = bool
  default     = true
}

variable "table_name" {
  description = "DynamoDB table backing this environment"
  type        = string
}

variable "table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}

variable "asset_url_bucket_name" {
  description = "Article payload bucket name"
  type        = string
}

variable "asset_url_bucket_arn" {
  description = "Article payload bucket ARN"
  type        = string
}

variable "is_localstack" {
  description = "Indicates if the deployment targets LocalStack"
  type        = bool
  default     = false
}

variable "discord_webhook_error" {
  description = "Discord webhook URL for #error notifications"
  type        = string
  sensitive   = true
  default     = ""
}

variable "discord_webhook_warn" {
  description = "Discord webhook URL for #warn notifications"
  type        = string
  sensitive   = true
  default     = ""
}

variable "discord_webhook_access" {
  description = "Discord webhook URL for #access aggregated logs"
  type        = string
  sensitive   = true
  default     = ""
}
