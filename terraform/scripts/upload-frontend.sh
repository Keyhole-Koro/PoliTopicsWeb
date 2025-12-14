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

echo "[upload-frontend] Syncing $BUILD_DIR to s3://$BUCKET"
aws s3 sync "$BUILD_DIR" "s3://$BUCKET" --delete
