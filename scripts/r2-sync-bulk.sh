#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$REPO_ROOT/frontend/out}"
BUCKET="${R2_BUCKET:-politopics-frontend-local}"
WRANGLER_ENV="${WRANGLER_ENV:-local}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-$REPO_ROOT/wrangler.toml}"

if [ ! -d "$BUILD_DIR" ]; then
  echo "[r2-sync-bulk] Build output not found: $BUILD_DIR" >&2
  exit 1
fi

find "$BUILD_DIR" -type f -print0 | while IFS= read -r -d '' file; do
  key="${file#$BUILD_DIR/}"
  echo "[r2-sync-bulk] Uploading ${key}"
  npx wrangler r2 object put "${BUCKET}/${key}" \
    --file "$file" \
    --local \
    --env "$WRANGLER_ENV" \
    --config "$WRANGLER_CONFIG"
done

echo "[r2-sync-bulk] Done."
