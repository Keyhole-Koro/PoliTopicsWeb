#!/usr/bin/env bash
set -euo pipefail

awslocal s3 mb s3://politopics-articles-stage || true
awslocal s3 mb s3://politopics-articles-prod || true
awslocal s3 mb s3://politopics-frontend-dev || true

echo "LocalStack buckets prepared"
