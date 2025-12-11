bucket                      = "politopics-web-local-state-bucket"
key                         = "politopics-web/local.tfstate"
region                      = "ap-northeast-3"
endpoints = {
  s3 = "http://localstack:4566"
}
use_path_style              = true
skip_credentials_validation = true
skip_region_validation      = true
skip_metadata_api_check     = true
skip_requesting_account_id  = true
access_key                  = "test"
secret_key                  = "test"
