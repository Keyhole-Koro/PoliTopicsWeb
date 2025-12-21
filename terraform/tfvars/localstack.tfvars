region      = "ap-northeast-3"
environment = "localstack"

frontend_bucket         = "politopics-frontend-localstack"
articles_table          = "politopics-local"
article_payload_bucket  = "politopics-articles-local"
frontend_deploy_enabled = false

lambda_name        = "politopics-backend-localstack"
api_name           = "politopics-api-localstack"
lambda_description = "PoliTopics backend API (LocalStack)"

backend_lambda_package = "../backend/dist/backend.zip"
create_dynamodb_table  = true
use_http_api           = false
is_localstack          = true
localstack_url         = "http://localstack:4566"
