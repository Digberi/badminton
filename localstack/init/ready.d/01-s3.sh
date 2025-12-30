#!/usr/bin/env bash
set -euo pipefail

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

BUCKET="${S3_PHOTOS_BUCKET:-photo-app-photos}"

echo "[localstack] creating bucket: ${BUCKET}"
awslocal s3api create-bucket --bucket "${BUCKET}" >/dev/null 2>&1 || true

# CORS чтобы браузер мог PUT напрямую по presigned URL
cat >/tmp/cors.json <<'JSON'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
JSON

echo "[localstack] applying CORS on bucket: ${BUCKET}"
awslocal s3api put-bucket-cors --bucket "${BUCKET}" --cors-configuration file:///tmp/cors.json >/dev/null

echo "[localstack] ready ✅ bucket=${BUCKET}"