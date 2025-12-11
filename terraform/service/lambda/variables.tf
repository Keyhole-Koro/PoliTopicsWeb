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

variable "payload_bucket_name" {
  description = "Article payload bucket name"
  type        = string
}

variable "payload_bucket_arn" {
  description = "Article payload bucket ARN"
  type        = string
}

variable "is_localstack" {
  description = "Indicates if the deployment targets LocalStack"
  type        = bool
  default     = false
}
