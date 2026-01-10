#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_ROOT/.." && pwd)"

LOCALSTACK_ENDPOINT="${LOCALSTACK_URL:-http://localstack:4566}"
E2E_BASE_DEFAULT="http://127.0.0.1:8787"

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

log "Loading test environment defaults (LocalStack endpoints, AWS creds)..."
set +u
# shellcheck source=/dev/null
source "$REPO_ROOT/scripts/export_test_env.sh"
set -u

cd "$WEB_ROOT"

log "Building backend Lambda package for LocalStack..."
npm run build:backend:local

log "Deploying backend/API to LocalStack with Terraform..."
pushd "$WEB_ROOT/terraform" >/dev/null
terraform init -backend-config=backends/local.hcl -input=false
terraform apply -auto-approve -var-file=tfvars/localstack.tfvars
TF_OUTPUT_JSON="$(terraform output -json)"
popd >/dev/null

BACKEND_URL="$(TF_OUTPUT_JSON="$TF_OUTPUT_JSON" python3 - <<'PY'
import json
import os
import re
import sys

raw = os.environ.get("TF_OUTPUT_JSON", "")
if not raw:
    sys.exit("TF_OUTPUT_JSON not provided.")

try:
    data = json.loads(raw)
except Exception as exc:
    sys.exit(f"Failed to parse Terraform output JSON: {exc}")

block = data.get("backend_api_url")
value = None
if isinstance(block, dict):
    value = block.get("value")
if not value:
    value = block if isinstance(block, str) else None
if not value:
    print("")
    sys.exit(0)

api_id = stage = None
match_rest = re.search(r"/restapis/([^/]+)/([^/]+)/_user_request_", value)
if match_rest:
    api_id, stage = match_rest.group(1), match_rest.group(2)
else:
    match_execute = re.search(r"//([^.]+)\.execute-api\.[^/]+/([^/?#]+)", value)
    if match_execute:
        api_id, stage = match_execute.group(1), match_execute.group(2)

if api_id and stage:
    base = f"http://localstack:4566/restapis/{api_id}/{stage}/_user_request_"
else:
    base = value

print(base.rstrip("/"))
PY
)"

if [[ -z "$BACKEND_URL" ]]; then
  echo "[e2e-localstack] Failed to derive backend API URL from Terraform outputs." >&2
  exit 1
fi

log "Resolved backend API URL: ${BACKEND_URL}"

log "Syncing Terraform outputs into backend/.env and frontend/.env.local..."
"$WEB_ROOT/terraform/sync-env.sh"

log "Installing mock article seed dependencies..."
npm --prefix "$WEB_ROOT/terraform/mock-article" ci

log "Seeding mock dataset into LocalStack (DynamoDB + S3)..."
node "$WEB_ROOT/terraform/mock-article/upload_articles.js" --endpoint "$LOCALSTACK_ENDPOINT" --s3-endpoint "$LOCALSTACK_ENDPOINT"

log "Building frontend for local env against LocalStack API..."
NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" npm run build:frontend:local

log "Syncing built assets to local R2 (Miniflare)..."
npm run r2:sync:local

log "Running Playwright E2E against LocalStack..."
E2E_MODE=localstack \
E2E_BASE_URL="${E2E_BASE_URL:-$E2E_BASE_DEFAULT}" \
E2E_BACKEND_URL="$BACKEND_URL" \
npx playwright test

log "Done."
