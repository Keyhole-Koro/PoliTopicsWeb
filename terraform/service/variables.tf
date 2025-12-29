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

variable "frontend_public_enabled" {
  description = "Allow the frontend bucket to be publicly accessible via a bucket policy"
  type        = bool
  default     = true
}

variable "frontend_deploy_enabled" {
  description = "Whether Terraform should build and upload the frontend assets during apply"
  type        = bool
  default     = false
}

variable "frontend_r2_endpoint_url" {
  description = "Cloudflare R2 S3-compatible endpoint"
  type        = string
  default     = null
}

variable "frontend_r2_region" {
  description = "Region for R2 S3-compatible API"
  type        = string
  default     = "auto"
}

variable "frontend_r2_access_key_id" {
  description = "R2 access key ID used for uploads"
  type        = string
  default     = null
  sensitive   = true
}

variable "frontend_r2_secret_access_key" {
  description = "R2 secret access key used for uploads"
  type        = string
  default     = null
  sensitive   = true
}

variable "articles_table" {
  description = "Existing DynamoDB table backing this environment"
  type        = string
}

variable "article_asset_url_bucket" {
  description = "Existing S3 bucket with article assets"
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
  description = "Toggle between API Gateway HTTP API and REST API resources"
  type        = bool
  default     = true
}

variable "create_dynamodb_table" {
  description = "Whether to create the DynamoDB table or use an existing one"
  type        = bool
  default     = false
}

variable "is_localstack" {
  description = "Flag indicating whether resources are targeting LocalStack"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to created resources"
  type        = map(string)
  default     = {}
}
