variable "environment" {
  description = "Deployment environment identifier"
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

variable "article_asset_url_bucket" {
  description = "Existing S3 bucket with article assets"
  type        = string
}

variable "is_localstack" {
  description = "Flag indicating whether resources are targeting LocalStack"
  type        = bool
  default     = false
}
