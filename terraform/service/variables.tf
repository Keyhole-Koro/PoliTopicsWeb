variable "region" {
  description = "AWS region used for resources in this service stack"
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

variable "frontend_bucket" {
  description = "S3 bucket name hosting the SPA"
  type        = string
}

variable "articles_table" {
  description = "Existing DynamoDB table backing this environment"
  type        = string
}

variable "article_payload_bucket" {
  description = "Existing S3 bucket with article payloads"
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
  description = "Description shared by Lambda and API resources"
  type        = string
}
