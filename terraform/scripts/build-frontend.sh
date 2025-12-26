#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "[build-frontend] Cleaning previous Next.js output"
rm -rf frontend/.next frontend/out

TARGET_ENV="${FRONTEND_BUILD_ENV:-localstack}"
if [[ "$TARGET_ENV" == "localstack" ]]; then
  TARGET_ENV="local"
fi

case "$TARGET_ENV" in
  local|stage|prod)
    ;;
  *)
    echo "[build-frontend] Unknown FRONTEND_BUILD_ENV: $TARGET_ENV" >&2
    exit 1
    ;;
esac

echo "[build-frontend] Running npm --prefix frontend run build:${TARGET_ENV} from $REPO_ROOT"
npm --prefix frontend run "build:${TARGET_ENV}"
