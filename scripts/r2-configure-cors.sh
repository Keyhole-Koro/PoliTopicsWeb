#!/bin/bash
# R2 CORS Configuration Script
# Configures CORS rules for R2 asset bucket using Wrangler CLI
#
# Environment Variables (for stage):
#   STAGE_FRONTEND_URL - Frontend URL for stage environment (required for stage)
#   STAGE_CORS_ORIGINS_EXTRA - Additional origins, comma-separated (optional)
#
# Example:
#   STAGE_FRONTEND_URL=https://your-stage-domain.net ./scripts/r2-configure-cors.sh stage

set -e

# Get environment from argument (default: stage)
ENV="${1:-stage}"

# Validate environment
if [[ ! "$ENV" =~ ^(stage|prod)$ ]]; then
    echo "Usage: $0 <stage|prod>"
    echo "  stage - Configure CORS for politopics-assets-stage bucket"
    echo "          Requires STAGE_FRONTEND_URL environment variable"
    echo "  prod  - Configure CORS for politopics-assets-prod bucket"
    echo ""
    echo "Environment variables for stage:"
    echo "  STAGE_FRONTEND_URL       - Frontend URL (required)"
    echo "  STAGE_CORS_ORIGINS_EXTRA - Additional origins, comma-separated (optional)"
    exit 1
fi

# Set bucket name and origins based on environment
if [ "$ENV" = "prod" ]; then
    BUCKET_NAME="politopics-assets-prod"
    ALLOWED_ORIGINS='["https://politopics.net", "https://www.politopics.net"]'
else
    BUCKET_NAME="politopics-assets-stage"
    
    # Require STAGE_FRONTEND_URL for stage environment
    if [ -z "$STAGE_FRONTEND_URL" ]; then
        echo "❌ Error: STAGE_FRONTEND_URL environment variable is required for stage environment"
        echo ""
        echo "Example usage:"
        echo "  STAGE_FRONTEND_URL=https://your-stage-domain.net $0 stage"
        echo ""
        echo "With additional origins:"
        echo "  STAGE_FRONTEND_URL=https://your-stage-domain.net \\"
        echo "  STAGE_CORS_ORIGINS_EXTRA=http://localhost:3000,http://localhost:5173 \\"
        echo "  $0 stage"
        exit 1
    fi
    
    # Build origins array
    ORIGINS_ARRAY="\"$STAGE_FRONTEND_URL\""
    
    # Add localhost for development
    ORIGINS_ARRAY="$ORIGINS_ARRAY, \"http://localhost:3000\", \"http://localhost:5173\""
    
    # Add extra origins if provided
    if [ -n "$STAGE_CORS_ORIGINS_EXTRA" ]; then
        IFS=',' read -ra EXTRA_ORIGINS <<< "$STAGE_CORS_ORIGINS_EXTRA"
        for origin in "${EXTRA_ORIGINS[@]}"; do
            # Trim whitespace
            origin=$(echo "$origin" | xargs)
            ORIGINS_ARRAY="$ORIGINS_ARRAY, \"$origin\""
        done
    fi
    
    ALLOWED_ORIGINS="[$ORIGINS_ARRAY]"
fi

echo "🔧 Configuring CORS for R2 bucket: $BUCKET_NAME"

# Create temporary CORS configuration file
CORS_CONFIG_FILE=$(mktemp)
cat > "$CORS_CONFIG_FILE" << EOF
{
  "rules": [
    {
      "allowed": {
        "origins": $ALLOWED_ORIGINS,
        "methods": ["GET", "HEAD"],
        "headers": ["*"]
      },
      "exposed_headers": ["Content-Length", "Content-Type", "ETag", "Cache-Control"],
      "max_age_seconds": 86400
    }
  ]
}
EOF

echo "📋 CORS Configuration:"
cat "$CORS_CONFIG_FILE"
echo ""

# Apply CORS policy using Wrangler
echo "🚀 Applying CORS policy..."
npx wrangler r2 bucket cors set "$BUCKET_NAME" --file "$CORS_CONFIG_FILE"

# Verify the configuration
echo ""
echo "✅ Verifying CORS configuration..."
npx wrangler r2 bucket cors list "$BUCKET_NAME"

# Clean up temp file
rm -f "$CORS_CONFIG_FILE"

echo ""
echo "✅ CORS configuration complete for $BUCKET_NAME"
