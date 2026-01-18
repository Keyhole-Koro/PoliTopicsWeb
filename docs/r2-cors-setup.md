# R2 Asset Bucket CORS Configuration Guide

This guide explains how to manually configure CORS for R2 asset buckets used to serve article assets.

## Prerequisites

- Cloudflare account with R2 access
- R2 bucket created (`politopics-assets-stage` or `politopics-assets-prod`)
- Wrangler CLI installed (for CLI method)

## Method 1: Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Select your bucket (e.g., `politopics-assets-prod`)
4. Click **Settings** tab
5. Scroll to **CORS Policy** section
6. Click **Add CORS policy**
7. Paste the following JSON:

### Production Environment

```json
[
  {
    "AllowedOrigins": ["https://politopics.net"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type",
      "ETag",
      "Cache-Control"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

### Stage Environment

```json
[
  {
    "AllowedOrigins": [
      "https://your-stage-domain.net",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type",
      "ETag",
      "Cache-Control"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

8. Click **Save**

## Method 2: Wrangler CLI

### Using the provided script

```bash
# Stage environment
STAGE_FRONTEND_URL=https://your-stage-domain.net ./scripts/r2-configure-cors.sh stage

# Production environment
./scripts/r2-configure-cors.sh prod
```

### Manual Wrangler commands

1. Create a CORS config file:

```bash
# For production
cat > /tmp/cors-prod.json << 'EOF'
{
  "rules": [
    {
      "allowed": {
        "origins": ["https://politopics.net", "https://www.politopics.net"],
        "methods": ["GET", "HEAD"],
        "headers": ["*"]
      },
      "exposed_headers": ["Content-Length", "Content-Type", "ETag", "Cache-Control"],
      "max_age_seconds": 86400
    }
  ]
}
EOF
```

2. Apply the configuration:

```bash
# Production
npx wrangler r2 bucket cors set politopics-assets-prod --file /tmp/cors-prod.json

# Stage
npx wrangler r2 bucket cors set politopics-assets-stage --file /tmp/cors-stage.json
```

3. Verify the configuration:

```bash
npx wrangler r2 bucket cors list politopics-assets-prod
```

## Enabling Public Access

CORS alone is not enough - you also need to enable public access for the bucket.

### Via Dashboard

1. Go to R2 bucket settings
2. Under **Public Access**, click **Connect Domain**
3. Enter custom domain: `asset.politopics.net`
4. Cloudflare will automatically:
   - Create DNS record
   - Issue SSL certificate
   - Enable CDN caching

### Via Wrangler (if supported)

```bash
# Note: Custom domain setup may require dashboard configuration
npx wrangler r2 bucket info politopics-assets-prod
```

## Troubleshooting

### CORS errors in browser

1. **Check Origin header**: Ensure the request includes `Origin` header
2. **Verify AllowedOrigins**: Must match exactly (including protocol)
3. **Cache propagation**: CORS changes may take up to 30 seconds

### Test CORS configuration

```bash
# Test with curl
curl -I -X OPTIONS \
  -H "Origin: https://politopics.net" \
  -H "Access-Control-Request-Method: GET" \
  https://asset.politopics.net/articles/test/asset.json
```

Expected response headers:

```
Access-Control-Allow-Origin: https://politopics.net
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 86400
```

### Common Issues

| Issue                    | Cause                           | Solution                                    |
| ------------------------ | ------------------------------- | ------------------------------------------- |
| No CORS headers returned | Request missing `Origin` header | Ensure browser request includes Origin      |
| Origin not allowed       | Typo in AllowedOrigins          | Check exact match including `https://`      |
| Cached old response      | CDN cache                       | Purge cache or wait for TTL                 |
| Bucket not found         | Bucket doesn't exist            | Create bucket first via Terraform/Dashboard |

## Related Documentation

- [R2 Asset Architecture](./r2-asset-architecture.md)
- [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
