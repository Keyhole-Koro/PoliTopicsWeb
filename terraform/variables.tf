variable "region" {
  description = "AWS region used for all resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Deployment environment identifier (e.g. stage, prod, localstack)"
  type        = string
  default     = "stage"
}

variable "backend_lambda_package" {
  description = "Path to the zipped backend Lambda artifact (relative to terraform/)."
  type        = string
  default     = "../backend/dist/backend.zip"
}

variable "frontend_bucket" {
  description = "S3 bucket name hosting the SPA for this environment"
  type        = string
  default     = null
}

variable "articles_table" {
  description = "Existing DynamoDB table backing this environment"
  type        = string
  default     = null
}

variable "article_payload_bucket" {
  description = "Existing S3 bucket with article payloads for this environment"
  type        = string
  default     = null
}

variable "lambda_name" {
  description = "Name of the backend Lambda function"
  type        = string
  default     = null
}

variable "api_name" {
  description = "Name of the API Gateway HTTP API"
  type        = string
  default     = null
}

variable "lambda_description" {
  description = "Description shared by Lambda and API resources"
  type        = string
  default     = null
}
