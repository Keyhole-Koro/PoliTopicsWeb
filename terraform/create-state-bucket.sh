#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <localstack|stage|prod>"
  exit 1
fi

ENVIRONMENT="$1"
REGION="ap-northeast-3"
AWS_GLOBAL_OPTS=()

case "$ENVIRONMENT" in
  localstack)
    BUCKET="politopics-web-local-state-bucket"
    LOCALSTACK_URL="${LOCALSTACK_URL:-http://localhost:4569}"
    AWS_GLOBAL_OPTS=(--endpoint-url "$LOCALSTACK_URL")
    ;;
  stage)
    BUCKET="politopics-web-stage-state-bucket"
    ;;
  prod)
    BUCKET="politopics-web-prod-state-bucket"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 <localstack|stage|prod>"
    exit 1
    ;;
esac

echo "Environment : $ENVIRONMENT"
echo "Bucket      : $BUCKET"
echo "Region      : $REGION"
if [ "$ENVIRONMENT" = "localstack" ]; then
  echo "Endpoint    : $LOCALSTACK_URL"
fi
echo

echo "==> Checking S3 bucket exists..."

if aws "${AWS_GLOBAL_OPTS[@]}" s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "S3 bucket already exists: $BUCKET"
else
  echo "Creating S3 bucket: $BUCKET"
  aws "${AWS_GLOBAL_OPTS[@]}" s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

  echo "Enabling default encryption (AES256)..."
  aws "${AWS_GLOBAL_OPTS[@]}" s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }]
    }'

  echo "Enabling versioning..."
  aws "${AWS_GLOBAL_OPTS[@]}" s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled
fi

echo
echo "✅ S3 bucket setup completed."
