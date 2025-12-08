region      = "ap-northeast-1"
environment = "localstack"

frontend_bucket       = "politopics-frontend-localstack"
articles_table        = "politopics-stage"
article_payload_bucket = "politopics-articles-stage"

lambda_name        = "politopics-backend-localstack"
api_name           = "politopics-api-localstack"
lambda_description = "PoliTopics backend API (LocalStack)"

backend_lambda_package = "../backend/dist/backend.zip"
