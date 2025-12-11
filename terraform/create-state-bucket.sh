#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <stage|prod>"
  exit 1
fi

ENVIRONMENT="$1"
REGION="ap-northeast-3"

case "$ENVIRONMENT" in
  stage)
    BUCKET="politopics-web-stage-state-bucket"
    ;;
  prod)
    BUCKET="politopics-web-prod-state-bucket"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 <stage|prod>"
    exit 1
    ;;
esac

echo "Environment : $ENVIRONMENT"
echo "Bucket      : $BUCKET"
echo "Region      : $REGION"
echo

echo "==> Checking S3 bucket exists..."

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "S3 bucket already exists: $BUCKET"
else
  echo "Creating S3 bucket: $BUCKET"
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

  echo "Enabling default encryption (AES256)..."
  aws s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }]
    }'

  echo "Enabling versioning..."
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled
fi

echo
echo "✅ S3 bucket setup completed."
