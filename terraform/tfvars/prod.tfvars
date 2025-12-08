region      = "ap-northeast-1"
environment = "prod"

frontend_bucket        = "politopics-frontend-prod"
articles_table         = "politopics-prod"
article_payload_bucket = "politopics-articles-prod"

lambda_name        = "politopics-backend-prod"
api_name           = "politopics-api-prod"
lambda_description = "PoliTopics backend API (production)"

backend_lambda_package = "../backend/dist/backend.zip"
