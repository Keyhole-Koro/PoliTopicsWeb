variable "region" {
  description = "AWS region used for all resources"
  type        = string
  default     = "ap-northeast-3"
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
  description = "Cloudflare R2 S3-compatible endpoint (e.g. https://<accountid>.r2.cloudflarestorage.com)"
  type        = string
  default     = null

  validation {
    condition     = !var.frontend_deploy_enabled || (var.frontend_r2_endpoint_url != null && var.frontend_r2_endpoint_url != "")
    error_message = "frontend_r2_endpoint_url must be set when frontend_deploy_enabled is true."
  }
}

variable "frontend_r2_region" {
  description = "Region for R2 S3-compatible API (use \"auto\" unless you have a specific requirement)"
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
  default     = null
}

variable "article_asset_url_bucket" {
  description = "Existing S3 bucket with article assets for this environment"
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
  description = "Toggle to provision an API Gateway HTTP API (true) or a REST API fallback (false)"
  type        = bool
  default     = true
}

variable "create_dynamodb_table" {
  description = "Whether to create the DynamoDB table or use an existing one"
  type        = bool
  default     = false
}

variable "is_localstack" {
  description = "Flag to indicate if running against a LocalStack instance"
  type        = bool
  default     = true
}

variable "localstack_url" {
  description = "URL endpoint for LocalStack services"
  type        = string
  default     = "http://localstack:4566"
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
