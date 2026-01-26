#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_ROOT/.." && pwd)"

# Use 127.0.0.1 (localhost) for the endpoint so that seeded URLs in the DB 
# are accessible from the host browser via VS Code port forwarding.
LOCALSTACK_ENDPOINT="${LOCALSTACK_URL:-http://127.0.0.1:4566}"
E2E_BASE_DEFAULT="http://127.0.0.1:8787"
BACKEND_DEFAULT_PORT="4500"

log() {
  echo "[e2e-localstack] $*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[e2e-localstack] Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd terraform
require_cmd npm
require_cmd node
require_cmd npx

is_port_free() {
  local port="$1"
  node -e "const net=require('net');const srv=net.createServer();srv.once('error',()=>process.exit(1));srv.listen(${port},'127.0.0.1',()=>srv.close(()=>process.exit(0)));" >/dev/null 2>&1
}

find_open_port() {
  node -e "const net=require('net');const srv=net.createServer();srv.listen(0,'127.0.0.1',()=>{console.log(srv.address().port);srv.close();});"
}

log "Loading test environment defaults (LocalStack endpoints, AWS creds)..."
set +u
# shellcheck source=/dev/null
source "$SCRIPT_DIR/export_test_env.sh"
set -u

cd "$WEB_ROOT"

if [[ "${SKIP_PLAYWRIGHT_INSTALL:-false}" != "true" ]]; then
  log "Ensuring Playwright browsers are installed..."
  npx playwright install
fi

log "Ensuring LocalStack resources..."
"$WEB_ROOT/scripts/ensure-localstack.sh"

BACKEND_URL="${E2E_BACKEND_URL:-}"
if [[ -z "$BACKEND_URL" ]]; then
  if is_port_free "$BACKEND_DEFAULT_PORT"; then
    BACKEND_URL="http://127.0.0.1:${BACKEND_DEFAULT_PORT}"
  else
    log "Port ${BACKEND_DEFAULT_PORT} is in use; selecting a free port."
    BACKEND_PORT="$(find_open_port)"
    BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
  fi
fi

log "Using backend API URL: ${BACKEND_URL}"

log "Installing mock article seed dependencies..."
npm --prefix "$WEB_ROOT/terraform/seed" ci

log "Installing backend worker dependencies..."
npm --prefix "$WEB_ROOT/workers/backend" ci

log "Seeding mock dataset into LocalStack (DynamoDB + S3)..."
node "$WEB_ROOT/terraform/seed/upload_articles.js" --endpoint "$LOCALSTACK_ENDPOINT" --s3-endpoint "$LOCALSTACK_ENDPOINT"

log "Building frontend for local env against LocalStack API..."
NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" NEXT_PUBLIC_ASSET_BASE_URL="http://localhost:4566" npm --prefix "$WEB_ROOT/frontend" run build:local

log "Syncing built assets to local R2 (Miniflare)..."
node "$WEB_ROOT/scripts/sync-frontend-to-r2-local.mjs"

log "Running Playwright E2E against LocalStack..."
E2E_BASE_URL="${E2E_BASE_URL:-$E2E_BASE_DEFAULT}" \
E2E_BACKEND_URL="$BACKEND_URL" \
APP_ENV="${APP_ENV:-local}" \
AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-$LOCALSTACK_ENDPOINT}" \
DYNAMODB_ENDPOINT_URL="${DYNAMODB_ENDPOINT_URL:-$LOCALSTACK_ENDPOINT}" \
S3_ENDPOINT_URL="${S3_ENDPOINT_URL:-$LOCALSTACK_ENDPOINT}" \
S3_FORCE_PATH_STYLE="${S3_FORCE_PATH_STYLE:-true}" \
DYNAMODB_TABLE_NAME="${DYNAMODB_TABLE_NAME:-politopics-local}" \
S3_ASSET_BUCKET="${S3_ASSET_BUCKET:-politopics-articles-local}" \
AWS_REGION="${AWS_REGION:-ap-northeast-3}" \
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
npx playwright test

log "Done."
