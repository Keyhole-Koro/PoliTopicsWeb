#!/usr/bin/env bash
set -euo pipefail

TF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TFVARS_DIR="$TF_DIR/tfvars"

if [[ $# -lt 1 ]]; then
  echo "Usage: $(basename "$0") <environment>" >&2
  exit 1
fi

ENVIRONMENT_NAME="$1"

# Allow override via LOCALSTACK_TFVARS environment variable
if [[ -n "${LOCALSTACK_TFVARS:-}" ]]; then
  VAR_FILE_INPUT="$TF_DIR/$LOCALSTACK_TFVARS"
else
  case "$ENVIRONMENT_NAME" in
    local)
      VAR_FILE_INPUT="$TFVARS_DIR/localstack.tfvars"
      ;;
    stage)
      VAR_FILE_INPUT="$TFVARS_DIR/stage.tfvars"
      ;;
    prod)
      VAR_FILE_INPUT="$TFVARS_DIR/prod.tfvars"
      ;;
    *)
      VAR_FILE_INPUT="$TFVARS_DIR/${ENVIRONMENT_NAME}.tfvars"
      ;;
  esac
fi

if [[ ! -f "$VAR_FILE_INPUT" ]]; then
  echo "Variable file not found: $VAR_FILE_INPUT" >&2
  exit 1
fi

VAR_FILE="$(cd "$(dirname "$VAR_FILE_INPUT")" && pwd)/$(basename "$VAR_FILE_INPUT")"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd terraform
require_cmd python3

eval "$(
  python3 - "$VAR_FILE" <<'PY'
import pathlib
import re
import shlex
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text()

def extract_raw(key: str):
  pattern = re.compile(rf'(?m)^\s*{re.escape(key)}\s*=\s*(.+)$')
  match = pattern.search(text)
  if not match:
    return None
  raw = match.group(1).strip()
  if "#" in raw:
    raw = raw.split("#", 1)[0].strip()
  return raw if raw != "" else None

def parse_string(raw):
  if raw is None:
    return ""
  raw = raw.strip()
  if raw.startswith('"') and raw.endswith('"'):
    return raw[1:-1]
  if raw.startswith("'") and raw.endswith("'"):
    return raw[1:-1]
  return raw

environment_raw = extract_raw("environment")
frontend_bucket_raw = extract_raw("frontend_bucket")
article_asset_url_bucket_raw = extract_raw("article_asset_url_bucket")
articles_table_raw = extract_raw("articles_table")
lambda_name_raw = extract_raw("lambda_name")
create_dynamodb_table_raw = extract_raw("create_dynamodb_table")
is_localstack_raw = extract_raw("is_localstack")
frontend_public_enabled_raw = extract_raw("frontend_public_enabled")
headlines_job_enabled_raw = extract_raw("headlines_job_enabled")
headlines_job_name_raw = extract_raw("headlines_job_name")
headlines_job_bucket_raw = extract_raw("headlines_job_bucket")
headlines_job_batch_webhook_raw = extract_raw("headlines_job_batch_webhook")
headlines_job_error_webhook_raw = extract_raw("headlines_job_error_webhook")

environment = parse_string(environment_raw)
frontend_bucket = parse_string(frontend_bucket_raw)
article_asset_url_bucket = parse_string(article_asset_url_bucket_raw)
articles_table = parse_string(articles_table_raw)
lambda_name = parse_string(lambda_name_raw)
headlines_job_name = parse_string(headlines_job_name_raw)
headlines_job_bucket = parse_string(headlines_job_bucket_raw)
headlines_job_batch_webhook = parse_string(headlines_job_batch_webhook_raw)
headlines_job_error_webhook = parse_string(headlines_job_error_webhook_raw)

def parse_bool(raw, default):
  if raw is None:
    return default
  raw = raw.strip().lower()
  if raw in ("true", "1", "yes"):
    return "true"
  if raw in ("false", "0", "no"):
    return "false"
  return default

create_dynamodb_table = parse_bool(create_dynamodb_table_raw, "false")
is_localstack = parse_bool(is_localstack_raw, "false")
frontend_public_enabled = parse_bool(frontend_public_enabled_raw, "false")
headlines_job_enabled = parse_bool(headlines_job_enabled_raw, "false")

def emit(name, value):
  value = value or ""
  print(f"{name}={shlex.quote(value)}")

emit("ENVIRONMENT", environment)
emit("FRONTEND_BUCKET", frontend_bucket)
emit("ARTICLE_ASSET_URL_BUCKET", article_asset_url_bucket)
emit("ARTICLES_TABLE", articles_table)
emit("LAMBDA_NAME", lambda_name)
emit("CREATE_DYNAMODB_TABLE", create_dynamodb_table)
emit("IS_LOCALSTACK", is_localstack)
emit("FRONTEND_PUBLIC_ENABLED", frontend_public_enabled)
emit("HEADLINES_JOB_ENABLED", headlines_job_enabled)
emit("HEADLINES_JOB_NAME", headlines_job_name)
emit("HEADLINES_JOB_BUCKET", headlines_job_bucket)
emit("HEADLINES_JOB_BATCH_WEBHOOK", headlines_job_batch_webhook)
emit("HEADLINES_JOB_ERROR_WEBHOOK", headlines_job_error_webhook)
PY
)"

for required in ENVIRONMENT FRONTEND_BUCKET ARTICLE_ASSET_URL_BUCKET ARTICLES_TABLE; do
  if [[ -z "${!required:-}" ]]; then
    echo "Missing required value for $required (check $VAR_FILE)" >&2
    exit 1
  fi
done

if [[ "${HEADLINES_JOB_ENABLED:-false}" == "true" && -z "${HEADLINES_JOB_NAME:-}" ]]; then
  echo "Missing required value for HEADLINES_JOB_NAME (check $VAR_FILE)" >&2
  exit 1
fi
if [[ "${HEADLINES_JOB_ENABLED:-false}" == "true" && -z "${HEADLINES_JOB_BATCH_WEBHOOK:-}" ]]; then
  echo "Missing required value for HEADLINES_JOB_BATCH_WEBHOOK (check $VAR_FILE or secrets)" >&2
  exit 1
fi

get_account_id() {
  if [[ -n "${AWS_ACCOUNT_ID:-}" ]]; then
    echo "$AWS_ACCOUNT_ID"
    return
  fi

  if [[ "$IS_LOCALSTACK" == "true" ]]; then
    echo "000000000000"
    return
  fi

  if ! command -v aws >/dev/null 2>&1; then
    echo "Missing required command: aws (needed to discover AWS account ID for IAM imports)" >&2
    exit 1
  fi

  AWS_PAGER="" aws sts get-caller-identity --query Account --output text
}

ACCOUNT_ID="$(get_account_id)"

BACKEND_NAME="$ENVIRONMENT"
if [[ "$ENVIRONMENT" == "localstack" ]]; then
  BACKEND_NAME="local"
fi

# Allow override via LOCALSTACK_BACKEND environment variable
if [[ -n "${LOCALSTACK_BACKEND:-}" ]]; then
  BACKEND_FILE="$TF_DIR/$LOCALSTACK_BACKEND"
else
  BACKEND_FILE="$TF_DIR/backends/${BACKEND_NAME}.hcl"
fi
if [[ ! -f "$BACKEND_FILE" ]]; then
  echo "Backend config not found: $BACKEND_FILE" >&2
  exit 1
fi

TF_CMD=(terraform "-chdir=$TF_DIR")

echo "Initializing backend (${BACKEND_FILE})..."
INIT_ARGS=(-backend-config="$BACKEND_FILE" -input=false -reconfigure)
if [[ "$ENVIRONMENT_NAME" == "localstack" ]]; then
  INIT_ARGS+=(-var="is_localstack=true")
fi

"${TF_CMD[@]}" init "${INIT_ARGS[@]}" >/dev/null

run_import() {
  local address="$1"
  local identifier="$2"

  if [[ -z "$identifier" || "$identifier" == "None" ]]; then
    echo "Skipping $address because identifier is empty" >&2
    return
  fi

  if "${TF_CMD[@]}" state show "$address" >/dev/null 2>&1; then
    echo "skip   -> $address (already in state)"
    return
  fi

  echo "import -> $address :: $identifier"
  set +e
  import_output="$("${TF_CMD[@]}" import "-var-file=$VAR_FILE" -no-color "$address" "$identifier" 2>&1)"
  import_status=$?
  set -e

  if [[ $import_status -ne 0 ]]; then
    if echo "$import_output" | grep -q "Cannot import non-existent remote object"; then
      echo "skip   -> $address (missing remote object)"
      return
    fi
    if echo "$import_output" | grep -q "Configuration for import target does not exist"; then
      echo "skip   -> $address (missing configuration)"
      return
    fi
    if echo "$import_output" | grep -q "couldn't find resource"; then
      echo "skip   -> $address (missing resource)"
      return
    fi
    echo "$import_output" >&2
    exit "$import_status"
  fi
  echo "$import_output"
}

echo "Skipping frontend S3 imports (frontend uses R2) unless localstack."
S3_MOD="module.service.module.s3"

IS_LOCALSTACK_LOWER="$(echo "${IS_LOCALSTACK}" | tr '[:upper:]' '[:lower:]')"

if [[ "$ENVIRONMENT_NAME" == "local" || "$ENVIRONMENT_NAME" == "localstack" || "$IS_LOCALSTACK_LOWER" == "true" ]]; then
  run_import "$S3_MOD.aws_s3_bucket.article_asset_url[\"current\"]" "$ARTICLE_ASSET_URL_BUCKET"
  run_import "$S3_MOD.aws_s3_bucket.frontend[0]" "$FRONTEND_BUCKET"
fi

echo "Importing DynamoDB resources for ${ARTICLES_TABLE}..."
DDB_MOD="module.service.module.dynamodb"
run_import "$DDB_MOD.aws_dynamodb_table.politopics" "$ARTICLES_TABLE"

if [[ "${HEADLINES_JOB_ENABLED}" == "true" ]]; then
  echo "Importing Headlines cron Lambda resources for ${HEADLINES_JOB_NAME}..."
  CRON_MOD="module.service"
  CRON_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${HEADLINES_JOB_NAME}-bucket-access"
  CRON_STATEMENT_ID="AllowExecutionFromEventsHeadlines-${ENVIRONMENT}"
  CRON_RULE_NAME="${HEADLINES_JOB_NAME}-schedule"

  run_import "$CRON_MOD.aws_iam_role.headlines_job[\"current\"]" "${HEADLINES_JOB_NAME}-role"
  run_import "$CRON_MOD.aws_iam_policy.headlines_job_bucket_access[\"current\"]" "$CRON_POLICY_ARN"
  run_import "$CRON_MOD.aws_iam_role_policy_attachment.headlines_job_bucket_access[\"current\"]" "${HEADLINES_JOB_NAME}-role/$CRON_POLICY_ARN"
  run_import "$CRON_MOD.aws_iam_role_policy_attachment.headlines_job_basic_execution[\"current\"]" "${HEADLINES_JOB_NAME}-role/arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  run_import "$CRON_MOD.aws_lambda_function.headlines_job[\"current\"]" "$HEADLINES_JOB_NAME"
  run_import "$CRON_MOD.aws_cloudwatch_event_rule.headlines_job[\"current\"]" "$CRON_RULE_NAME"
  run_import "$CRON_MOD.aws_cloudwatch_event_target.headlines_job[\"current\"]" "${CRON_RULE_NAME}/headlines-cron"
  run_import "$CRON_MOD.aws_lambda_permission.allow_events_headlines_job[\"current\"]" "${HEADLINES_JOB_NAME}/${CRON_STATEMENT_ID}"
fi

echo "Imports complete."
