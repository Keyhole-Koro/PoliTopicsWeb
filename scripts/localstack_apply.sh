#!/usr/bin/env bash
set -euo pipefail

# Run LocalStack apply for the Web module (build backend + state bucket + import + plan/apply).

ENVIRONMENT="local"
skip_next_for_only=false
# Allow accidental flags like "-only Web" (meant for the top-level orchestrator) by
# ignoring them and falling back to the default local environment.
for arg in "$@"; do
  if $skip_next_for_only; then
    skip_next_for_only=false
    continue
  fi

  case "$arg" in
    -only)
      skip_next_for_only=true
      ;;
    -only=*)
      # No-op: -only is not meaningful for this single-module script.
      ;;
    -*)
      # Ignore other flags.
      ;;
    *)
      ENVIRONMENT="$arg"
      break
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$MODULE_DIR/terraform"
STATE_SCRIPT="$TF_DIR/scripts/create-state-bucket.sh"
IMPORT_SCRIPT="$TF_DIR/scripts/import_all.sh"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd terraform
require_cmd aws

require_cmd npm

echo "==> Web: install dependencies"
npm --prefix "$MODULE_DIR" ci

echo "==> Web: create state bucket"
"$STATE_SCRIPT" "$ENVIRONMENT"

# Use CI backend config if LOCALSTACK_BACKEND is set, otherwise default to local.hcl
BACKEND_CONFIG="${LOCALSTACK_BACKEND:-backends/local.hcl}"
echo "==> Web: terraform init (backend: $BACKEND_CONFIG)"
terraform -chdir="$TF_DIR" init -input=false -reconfigure -backend-config="$BACKEND_CONFIG"

echo "==> Web: terraform import"
"$IMPORT_SCRIPT" "$ENVIRONMENT"

# Use CI tfvars if LOCALSTACK_TFVARS is set, otherwise default to localstack.tfvars
TFVARS_FILE="${LOCALSTACK_TFVARS:-tfvars/localstack.tfvars}"
echo "==> Web: terraform plan (tfvars: $TFVARS_FILE)"
set +e
terraform -chdir="$TF_DIR" plan -detailed-exitcode -var-file="$TFVARS_FILE" -out=tfplan
PLAN_EXIT_CODE=$?
set -e

case "$PLAN_EXIT_CODE" in
  0)
    echo "No changes detected. Skipping apply."
    ;;
  2)
    echo "Changes detected. Applying tfplan..."
    terraform -chdir="$TF_DIR" apply -input=false tfplan
    ;;
  *)
    echo "Terraform plan failed with exit code $PLAN_EXIT_CODE"
    exit "$PLAN_EXIT_CODE"
    ;;
esac
