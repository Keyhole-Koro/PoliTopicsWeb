variable "environment" {
  description = "Deployment environment identifier"
  type        = string
}

variable "frontend_bucket" {
  description = "S3 bucket name hosting the SPA"
  type        = string
}

variable "article_payload_bucket" {
  description = "Existing S3 bucket with article payloads"
  type        = string
}
