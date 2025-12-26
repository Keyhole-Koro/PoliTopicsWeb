region      = "ap-northeast-3"
environment = "prod"

frontend_bucket          = "politopics-frontend-prod"
articles_table           = "politopics-prod"
article_asset_url_bucket = "politopics-articles-prod"
frontend_public_enabled  = true
frontend_deploy_enabled  = true

lambda_name                       = "politopics-backend-prod"
api_name                          = "politopics-api-prod"
lambda_description                = "PoliTopics backend API (production)"
api_custom_domain_name            = "api.politopics.net"
api_custom_domain_certificate_arn = "arn:aws:acm:ap-northeast-3:789222445929:certificate/cea6d345-86bd-48f7-8102-5ef394a4c68f"

backend_lambda_package = "../backend/dist/backend.zip"
create_dynamodb_table  = false
is_localstack          = false
