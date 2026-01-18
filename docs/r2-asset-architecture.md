# R2 Public Access & Asset CDN Architecture

This document describes the architecture for serving article assets via R2 public access using a custom domain (`asset.politopics.net`).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                     FRONTEND                                        │
│                                 (politopics.net)                                    │
└──────────────────────────────────────┬──────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │         API Request           │      │       Asset Request           │
    │   (Article Metadata Only)     │      │   (Summary, Dialog, etc.)     │
    └───────────────┬───────────────┘      └───────────────┬───────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │     api.politopics.net        │      │    asset.politopics.net       │
    │     (Cloudflare Worker)       │      │    (R2 Public Access)         │
    │                               │      │                               │
    │  • Returns article metadata   │      │  • CDN cached                 │
    │  • Returns assetUrl           │      │  • CORS enabled               │
    │  • No S3/R2 reads required    │      │  • Globally distributed       │
    └───────────────┬───────────────┘      └───────────────┬───────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │         D1 Database           │      │         R2 Bucket             │
    │                               │      │   (politopics-assets-prod)    │
    │  • Article metadata           │      │                               │
    │  • asset_url column           │      │  articles/{id}/asset.json     │
    └───────────────────────────────┘      └───────────────────────────────┘
```

## Data Flow

### 1. Article Page Load (2-Stage Loading)

```
┌─────────────┐     Step 1: Fetch Metadata      ┌─────────────────────┐
│   Browser   │ ──────────────────────────────▶ │ api.politopics.net  │
│             │ ◀────────────────────────────── │                     │
└──────┬──────┘   { id, title, date, assetUrl } └─────────────────────┘
       │
       │          Step 2: Fetch Asset
       │          (using assetUrl)
       │
       │         ┌─────────────────────────────────────────────────────┐
       └────────▶│             asset.politopics.net                    │
                 │    /articles/{id}/asset.json                        │
                 │                                                     │
                 │  Response:                                          │
                 │  {                                                  │
                 │    "summary": {...},                                │
                 │    "soft_language_summary": {...},                  │
                 │    "middle_summary": [...],                         │
                 │    "dialogs": [...]                                 │
                 │  }                                                  │
                 └─────────────────────────────────────────────────────┘
```

### 2. Article Processing (Recap Fargate)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Recap Fargate Container                                  │
│                                                                                     │
│   1. Fetch bills from DietWatch API                                                 │
│   2. Generate article content via LLM                                               │
│   3. Upload asset to R2:                                                            │
│      - Key: articles/{articleId}/asset.json                                         │
│      - Generate assetUrl: https://asset.politopics.net/articles/{id}/asset.json     │
│   4. Save metadata to D1 (including assetUrl)                                       │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │         D1 Database           │      │         R2 Bucket             │
    │    (Article Metadata)         │      │    (Article Assets)           │
    └───────────────────────────────┘      └───────────────────────────────┘
```

## URL Structure

### Environment-specific URLs

| Environment | API URL                            | Asset URL                                |
| ----------- | ---------------------------------- | ---------------------------------------- |
| Production  | `https://api.politopics.net`       | `https://asset.politopics.net`           |
| Stage       | `https://api.stage.politopics.net` | `https://asset.stage.politopics.net`     |
| Local       | `http://localhost:8787`            | `http://localhost:4566/...` (LocalStack) |

### Asset Path Format

```
https://asset.politopics.net/articles/{articleId}/asset.json
```

Example:

```
https://asset.politopics.net/articles/abc123-def456/asset.json
```

## CORS Configuration

R2 buckets require CORS configuration to allow browser-based fetching from the frontend.

### Production CORS Rules

```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["https://politopics.net", "https://www.politopics.net"],
        "methods": ["GET", "HEAD"],
        "headers": ["*"]
      },
      "exposed_headers": [
        "Content-Length",
        "Content-Type",
        "ETag",
        "Cache-Control"
      ],
      "max_age_seconds": 86400
    }
  ]
}
```

### Apply CORS via Wrangler

```bash
# Stage environment (requires environment variable)
STAGE_FRONTEND_URL=https://your-stage-domain.net ./scripts/r2-configure-cors.sh stage

# With additional origins
STAGE_FRONTEND_URL=https://your-stage-domain.net \
STAGE_CORS_ORIGINS_EXTRA=https://preview.your-domain.net \
./scripts/r2-configure-cors.sh stage

# Production environment
./scripts/r2-configure-cors.sh prod
```

Or manually:

```bash
npx wrangler r2 bucket cors set politopics-assets-prod --file scripts/cors-config/prod.json
npx wrangler r2 bucket cors list politopics-assets-prod
```

## R2 Public Access Setup

### Cloudflare Dashboard Steps

1. Navigate to **R2 Object Storage** in Cloudflare Dashboard
2. Select the bucket (`politopics-assets-prod`)
3. Go to **Settings** → **Public Access**
4. Click **Connect Domain**
5. Enter custom domain: `asset.politopics.net`
6. Cloudflare will automatically:
   - Create DNS record
   - Issue SSL certificate
   - Configure CDN caching

### Cache Configuration

Assets are cached at Cloudflare's edge with the following headers:

```http
Cache-Control: public, max-age=31536000, immutable
```

Since article IDs are unique and content is immutable, aggressive caching is safe.

## Benefits of This Architecture

### Performance

- **CDN Distribution**: Assets served from nearest Cloudflare edge location
- **Reduced Backend Load**: API only returns metadata, no R2 reads
- **Parallel Loading**: Metadata and assets can be fetched independently

### Cost

- **Lower Worker CPU**: No asset processing in Workers
- **R2 Free Egress**: Public access egress is free (within limits)
- **Reduced D1 Reads**: Asset data not stored in database

### Scalability

- **Independent Scaling**: API and asset delivery scale independently
- **Cache Hit Ratio**: High cache hit ratio for immutable assets
- **Geographic Distribution**: Global CDN coverage

## Fallback Handling

The frontend includes fallback logic for legacy `s3://` URLs:

```typescript
export async function fetchArticleAsset(
  assetUrl: string,
): Promise<ArticleAssetData | null> {
  // Skip legacy s3:// URLs (not accessible from browser)
  if (assetUrl.startsWith("s3://")) {
    return null;
  }

  const response = await fetch(assetUrl);
  if (!response.ok) return null;

  return response.json();
}
```

## Monitoring

### Key Metrics to Monitor

1. **R2 Metrics** (Cloudflare Dashboard)
   - Request count
   - Bandwidth usage
   - Cache hit ratio

2. **Worker Metrics**
   - API response times (should decrease without asset loading)
   - CPU time per request

3. **Frontend Metrics**
   - Asset load times
   - 2-stage loading performance

## Related Documentation

- [Fargate Architecture](./fargate-architecture.md)
- [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
