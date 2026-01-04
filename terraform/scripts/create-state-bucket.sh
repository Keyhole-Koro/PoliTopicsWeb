#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <local|stage|prod>"
  exit 1
fi

ENVIRONMENT="$1"
REGION="ap-northeast-3"
LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
AWS_ARGS=()

case "$ENVIRONMENT" in
  local)
    BUCKET="politopics-web-local-state-bucket"
    AWS_ARGS+=(--endpoint-url "$LOCALSTACK_ENDPOINT")
    ;;
  stage)
    BUCKET="politopics-web-stage-state-bucket"
    ;;
  prod)
    BUCKET="politopics-web-prod-state-bucket"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 <local|stage|prod>"
    exit 1
    ;;
esac

echo "✅ S3 bucket setup completed."
