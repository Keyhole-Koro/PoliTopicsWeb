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
require_cmd npm
require_cmd aws

echo "==> Web: install dependencies"
npm --prefix "$MODULE_DIR" ci

echo "==> Web: build backend (local)"
npm --prefix "$MODULE_DIR" run build:backend:local

echo "==> Web: create state bucket"
"$STATE_SCRIPT" "$ENVIRONMENT"

echo "==> Web: terraform init"
terraform -chdir="$TF_DIR" init -input=false -reconfigure -backend-config="backends/local.hcl"

echo "==> Web: terraform import"
"$IMPORT_SCRIPT" "$ENVIRONMENT"

echo "==> Web: terraform plan"
set +e
terraform -chdir="$TF_DIR" plan -detailed-exitcode -var-file="tfvars/localstack.tfvars" -out=tfplan
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
