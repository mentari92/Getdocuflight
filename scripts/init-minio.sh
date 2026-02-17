#!/bin/sh
# ================================================================
# GetDocuFlight — MinIO Bucket Initialization
# Creates the required bucket for encrypted document storage
# ================================================================

set -e

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until mc alias set local http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" > /dev/null 2>&1; do
  sleep 2
done

echo "✅ MinIO is ready"

# Create bucket if it doesn't exist
BUCKET="${MINIO_BUCKET:-getdocuflight-documents}"

if mc ls "local/${BUCKET}" > /dev/null 2>&1; then
  echo "✅ Bucket '${BUCKET}' already exists"
else
  mc mb "local/${BUCKET}"
  echo "✅ Created bucket '${BUCKET}'"
fi

# Set bucket to private (no public access)
mc anonymous set none "local/${BUCKET}"
echo "🔒 Bucket set to private access only"

echo "🚀 MinIO initialization complete!"
