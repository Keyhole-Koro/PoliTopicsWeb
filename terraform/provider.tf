terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region                      = var.region
  access_key                  = var.is_localstack ? "test" : null
  secret_key                  = var.is_localstack ? "test" : null
  skip_credentials_validation = var.is_localstack ? true : null
  skip_metadata_api_check     = var.is_localstack ? true : null
  skip_requesting_account_id  = var.is_localstack ? true : null
  s3_use_path_style           = var.is_localstack ? true : null

  dynamic "endpoints" {
    for_each = var.is_localstack ? [1] : []
    content {
      s3           = var.localstack_url
      dynamodb     = var.localstack_url
      lambda       = var.localstack_url
      apigateway   = var.localstack_url
      apigatewayv2 = var.localstack_url
      iam          = var.localstack_url
      sts          = var.localstack_url
    }
  }
}
