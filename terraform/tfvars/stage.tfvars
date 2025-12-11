region      = "ap-northeast-3"
environment = "stage"

frontend_bucket        = "politopics-frontend-stage"
articles_table         = "politopics-stage"
article_payload_bucket = "politopics-articles-stage"

lambda_name        = "politopics-backend-stage"
api_name           = "politopics-api-stage"
lambda_description = "PoliTopics backend API (stage)"

backend_lambda_package = "../backend/dist/backend.zip"
create_dynamodb_table  = false
is_localstack          = false
