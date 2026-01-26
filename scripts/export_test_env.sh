#!/usr/bin/env bash

# Source this script to export test-friendly environment variables for PoliTopicsWeb.
# Defaults target LocalStack; can be overridden by environment variables.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  echo "Please source this script instead of executing it: source ${script_path}"
  exit 1
fi

# LocalStack endpoint (default to docker-compose service name, override for CI/act)
export LOCALSTACK_URL="${LOCALSTACK_URL:-http://localstack:4566}"
export LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-$LOCALSTACK_URL}"
export LOCALSTACK_ENDPOINT_URL="${LOCALSTACK_ENDPOINT_URL:-$LOCALSTACK_URL}"
export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-$LOCALSTACK_URL}"
export DYNAMODB_ENDPOINT_URL="${DYNAMODB_ENDPOINT_URL:-$LOCALSTACK_URL}"
export S3_ENDPOINT_URL="${S3_ENDPOINT_URL:-$LOCALSTACK_URL}"

# AWS credentials for LocalStack
export AWS_REGION="${AWS_REGION:-ap-northeast-3}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"

# Web backend
export APP_ENV="${APP_ENV:-local}"
export DYNAMODB_TABLE_NAME="${DYNAMODB_TABLE_NAME:-politopics-local}"
export S3_ASSET_BUCKET="${S3_ASSET_BUCKET:-politopics-articles-local}"
export S3_FORCE_PATH_STYLE="${S3_FORCE_PATH_STYLE:-true}"

# Web frontend
export NEXT_PUBLIC_APP_ENV="${NEXT_PUBLIC_APP_ENV:-local}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:4500}"

echo "[export_test_env] Exported Web test env -> LocalStack: ${LOCALSTACK_URL}"
