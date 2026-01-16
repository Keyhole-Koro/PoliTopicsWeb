variable "environment" {
  description = "The deployment environment (e.g., dev, stage, prod)."
  type        = string
}

variable "region" {
  description = "The AWS region."
  type        = string
}

variable "headlines_job_enabled" {
  description = "Whether the headlines job (cache cron) should be enabled."
  type        = bool
  default     = false
}

variable "headlines_job_name" {
  description = "The name of the headlines job Lambda function."
  type        = string
  default     = null
}

variable "headlines_job_package" {
  description = "The file path to the headlines job Lambda deployment package."
  type        = string
}

variable "headlines_job_bucket" {
  description = "The S3 bucket where headlines are stored."
  type        = string
  default     = null
}

variable "frontend_bucket" {
  description = "The S3 bucket for the frontend. Used as fallback for headlines_job_bucket."
  type        = string
}

variable "headlines_job_key" {
  description = "The S3 key for the headlines object."
  type        = string
}

variable "headlines_job_limit" {
  description = "The limit for headlines fetched by the job."
  type        = number
  default     = 3
}

variable "headlines_job_path" {
  description = "The API path to fetch headlines from."
  type        = string
  default     = "/headlines"
}

variable "headlines_job_schedule_expression" {
  description = "The CloudWatch schedule expression for the headlines job."
  type        = string
  default     = "cron(0 18 * * ? *)" # 03:00 JST (18:00 UTC)
}

variable "headlines_job_cache_control" {
  description = "Cache-Control header for the S3 object."
  type        = string
  default     = "max-age=300, public"
}

variable "headlines_job_timeout" {
  description = "Timeout for the headlines job Lambda function in seconds."
  type        = number
  default     = 30
}

variable "headlines_job_memory_size" {
  description = "Memory size for the headlines job Lambda function in MB."
  type        = number
  default     = 128
}

variable "headlines_job_api_url" {
  description = "The API URL to fetch headlines from."
  type        = string
  default     = null
}

variable "api_url_from_lambda_module" {
  description = "The API URL output from the lambda module, used as fallback for headlines_job_api_url."
  type        = string
}

variable "headlines_job_request_timeout_ms" {
  description = "Request timeout for fetching headlines in milliseconds."
  type        = number
  default     = 2000
}

variable "headlines_job_s3_endpoint" {
  description = "S3 endpoint for the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_s3_region" {
  description = "S3 region for the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_s3_force_path_style" {
  description = "Force path style for S3 access."
  type        = bool
  default     = false
}

variable "headlines_job_s3_access_key_id" {
  description = "S3 access key ID for the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_s3_secret_access_key" {
  description = "S3 secret access key for the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_s3_session_token" {
  description = "S3 session token for the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_batch_webhook" {
  description = "Discord webhook URL for batch notifications from the headlines job."
  type        = string
  default     = null
}

variable "headlines_job_error_webhook" {
  description = "Discord webhook URL for error notifications from the headlines job."
  type        = string
  default     = null
}

variable "is_localstack" {
  description = "Whether the deployment is to LocalStack."
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to all resources."
  type        = map(string)
  default     = {}
}
