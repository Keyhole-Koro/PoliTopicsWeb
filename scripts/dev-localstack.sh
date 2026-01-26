#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WEB_ROOT"

# Check and prompt for NODE_AUTH_TOKEN if not set
if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "[dev-localstack] NODE_AUTH_TOKEN is not set. This is required for GitHub npm packages."
  read -rsp "Please enter your NODE_AUTH_TOKEN (GitHub Personal Access Token): " NODE_AUTH_TOKEN
  echo ""
  if [[ -z "$NODE_AUTH_TOKEN" ]]; then
    echo "[dev-localstack] NODE_AUTH_TOKEN is required to proceed." >&2
    exit 1
  fi
  export NODE_AUTH_TOKEN
fi

cleanup() {
  echo "[dev-localstack] Shutting down background processes..."
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT

echo "[dev-localstack] Cleaning up existing processes on ports 4500 and 8787..."
# kill
fuser -k 4500/tcp 8787/tcp 2>/dev/null || true

echo "[dev-localstack] Ensuring LocalStack resources..."
"$WEB_ROOT/scripts/ensure-localstack.sh"

echo "[dev-localstack] Starting backend worker in background..."
npm --prefix workers/backend run dev:local -- --port 4500 --ip 0.0.0.0 &

echo "[dev-localstack] Building frontend..."
npm run build:frontend:local

echo "[dev-localstack] Syncing assets to R2..."
npm run r2:local:sync

echo "[dev-localstack] Seeding database..."
npm run db:seed:local

echo "[dev-localstack] Starting wrangler dev (frontend)..."

npx --yes wrangler dev --local --env local --config wrangler.toml --port 8787 --ip 0.0.0.0