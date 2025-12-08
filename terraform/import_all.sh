#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-}"

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Usage: $0 <localstack|stage|prod>" >&2
  exit 1
fi

TFVARS_FILE="tfvars/${ENVIRONMENT}.tfvars"
if [[ ! -f "$TFVARS_FILE" ]]; then
  echo "tfvars file not found: ${TFVARS_FILE}" >&2
  exit 1
fi

BACKEND_NAME="$ENVIRONMENT"
if [[ "$ENVIRONMENT" == "localstack" ]]; then
  BACKEND_NAME="local"
fi

BACKEND_FILE="backends/${BACKEND_NAME}.hcl"
if [[ ! -f "$BACKEND_FILE" ]]; then
  echo "backend config not found: ${BACKEND_FILE}" >&2
  exit 1
fi

read_tfvar() {
  local key="$1"
  awk -F'"' -v search="^${key}[[:space:]]*=" '$0 ~ search { print $2; exit }' "$TFVARS_FILE"
}

FRONTEND_BUCKET="$(read_tfvar "frontend_bucket")"
if [[ -z "$FRONTEND_BUCKET" ]]; then
  echo "Unable to read frontend_bucket from ${TFVARS_FILE}" >&2
  exit 1
fi

echo "Initializing backend (${BACKEND_FILE})..."
terraform init -backend-config="$BACKEND_FILE" -input=false >/dev/null

echo "Importing existing frontend bucket resources for ${ENVIRONMENT}..."
terraform import -var-file="$TFVARS_FILE" module.service.module.s3.aws_s3_bucket.frontend "$FRONTEND_BUCKET"
terraform import -var-file="$TFVARS_FILE" module.service.module.s3.aws_s3_bucket_public_access_block.frontend "$FRONTEND_BUCKET"
terraform import -var-file="$TFVARS_FILE" module.service.module.s3.aws_s3_bucket_website_configuration.frontend "$FRONTEND_BUCKET"
terraform import -var-file="$TFVARS_FILE" module.service.module.s3.aws_s3_bucket_policy.frontend_public "$FRONTEND_BUCKET"

echo "Imports complete."
