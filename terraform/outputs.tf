output "frontend_bucket" {
  description = "Frontend SPA bucket"
  value       = module.service.frontend_bucket
}

output "article_table" {
  description = "Referenced DynamoDB table"
  value       = module.service.article_table
}

output "article_asset_url_bucket" {
  description = "Referenced S3 asset URL bucket"
  value       = module.service.article_asset_url_bucket
}

# Lambda outputs removed - backend now runs on Cloudflare Workers
# Backend API URL is now managed via Cloudflare Workers custom domain
