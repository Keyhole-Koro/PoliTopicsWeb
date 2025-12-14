#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "[build-frontend] Cleaning previous Next.js output"
rm -rf frontend/.next frontend/out

echo "[build-frontend] Running npm run build:frontend from $REPO_ROOT"
npm run build:frontend
