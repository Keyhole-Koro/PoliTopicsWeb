region      = "ap-northeast-3"
environment = "prod"

frontend_bucket         = "politopics-frontend-prod"
articles_table          = "politopics-prod"
article_payload_bucket  = "politopics-articles-prod"
frontend_public_enabled = true
frontend_deploy_enabled = true

lambda_name        = "politopics-backend-prod"
api_name           = "politopics-api-prod"
lambda_description = "PoliTopics backend API (production)"

backend_lambda_package = "../backend/dist/backend.zip"
create_dynamodb_table  = false
is_localstack          = false
