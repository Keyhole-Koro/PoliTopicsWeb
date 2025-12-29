#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <bucket-name>"
  exit 1
fi

BUCKET="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$REPO_ROOT/frontend/out"

if [ ! -d "$BUILD_DIR" ]; then
  echo "[upload-frontend] Missing build directory: $BUILD_DIR" >&2
  exit 1
fi

if [[ -z "${FRONTEND_S3_ENDPOINT_URL:-}" ]]; then
  echo "[upload-frontend] FRONTEND_S3_ENDPOINT_URL is required for R2 uploads." >&2
  exit 1
fi

AWS_ARGS=()
if [[ -n "${FRONTEND_S3_ENDPOINT_URL:-}" ]]; then
  AWS_ARGS+=(--endpoint-url "$FRONTEND_S3_ENDPOINT_URL")
fi
if [[ -n "${FRONTEND_S3_REGION:-}" ]]; then
  AWS_ARGS+=(--region "$FRONTEND_S3_REGION")
fi

echo "[upload-frontend] Syncing $BUILD_DIR to s3://$BUCKET"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET" --delete "${AWS_ARGS[@]}"
