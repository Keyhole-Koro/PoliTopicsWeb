# R2 パブリックアクセス & アセット CDN アーキテクチャ

このドキュメントでは、カスタムドメイン (`asset.politopics.net`) を使用した R2 パブリックアクセスによる記事アセット配信のアーキテクチャを説明します。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   フロントエンド                                      │
│                                 (politopics.net)                                    │
└──────────────────────────────────────┬──────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │       API リクエスト            │      │      アセットリクエスト          │
    │    (記事メタデータのみ)          │      │   (要約、対話形式など)           │
    └───────────────┬───────────────┘      └───────────────┬───────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │     api.politopics.net        │      │    asset.politopics.net       │
    │     (Cloudflare Worker)       │      │    (R2 パブリックアクセス)       │
    │                               │      │                               │
    │  • 記事メタデータを返却          │      │  • CDNキャッシュ               │
    │  • assetUrl を返却             │      │  • CORS 有効                  │
    │  • S3/R2 読み取り不要           │      │  • グローバル分散              │
    └───────────────┬───────────────┘      └───────────────┬───────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │       D1 データベース           │      │         R2 バケット            │
    │                               │      │   (politopics-assets-prod)    │
    │  • 記事メタデータ               │      │                               │
    │  • asset_url カラム            │      │  articles/{id}/asset.json     │
    └───────────────────────────────┘      └───────────────────────────────┘
```

## データフロー

### 1. 記事ページ読み込み (2段階ローディング)

```
┌─────────────┐    ステップ1: メタデータ取得     ┌─────────────────────┐
│  ブラウザ    │ ──────────────────────────────▶ │ api.politopics.net  │
│             │ ◀────────────────────────────── │                     │
└──────┬──────┘   { id, title, date, assetUrl } └─────────────────────┘
       │
       │         ステップ2: アセット取得
       │         (assetUrl を使用)
       │
       │         ┌─────────────────────────────────────────────────────┐
       └────────▶│             asset.politopics.net                    │
                 │    /articles/{id}/asset.json                        │
                 │                                                     │
                 │  レスポンス:                                         │
                 │  {                                                  │
                 │    "summary": {...},                                │
                 │    "soft_language_summary": {...},                  │
                 │    "middle_summary": [...],                         │
                 │    "dialogs": [...]                                 │
                 │  }                                                  │
                 └─────────────────────────────────────────────────────┘
```

### 2. 記事処理 (Recap Fargate)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Recap Fargate コンテナ                                   │
│                                                                                     │
│   1. DietWatch API から法案を取得                                                    │
│   2. LLM で記事コンテンツを生成                                                       │
│   3. R2 にアセットをアップロード:                                                     │
│      - キー: articles/{articleId}/asset.json                                        │
│      - assetUrl 生成: https://asset.politopics.net/articles/{id}/asset.json         │
│   4. D1 にメタデータを保存 (assetUrl 含む)                                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                    │                                      │
                    ▼                                      ▼
    ┌───────────────────────────────┐      ┌───────────────────────────────┐
    │       D1 データベース           │      │         R2 バケット            │
    │      (記事メタデータ)           │      │       (記事アセット)            │
    └───────────────────────────────┘      └───────────────────────────────┘
```

## URL 構造

### 環境別 URL

| 環境     | API URL                            | アセット URL                             |
| -------- | ---------------------------------- | ---------------------------------------- |
| 本番     | `https://api.politopics.net`       | `https://asset.politopics.net`           |
| ステージ | `https://api.stage.politopics.net` | `https://asset.stage.politopics.net`     |
| ローカル | `http://localhost:8787`            | `http://localhost:4566/...` (LocalStack) |

### アセットパス形式

```
https://asset.politopics.net/articles/{articleId}/asset.json
```

例:

```
https://asset.politopics.net/articles/abc123-def456/asset.json
```

## CORS 設定

R2 バケットでは、フロントエンドからのブラウザベースのフェッチを許可するために CORS 設定が必要です。

### 本番環境の CORS ルール

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

### Wrangler で CORS を適用

```bash
# ステージ環境（環境変数が必要）
STAGE_FRONTEND_URL=https://your-stage-domain.net ./scripts/r2-configure-cors.sh stage

# 追加オリジンを指定する場合
STAGE_FRONTEND_URL=https://your-stage-domain.net \
STAGE_CORS_ORIGINS_EXTRA=https://preview.your-domain.net \
./scripts/r2-configure-cors.sh stage

# 本番環境
./scripts/r2-configure-cors.sh prod
```

または手動で:

```bash
npx wrangler r2 bucket cors set politopics-assets-prod --file scripts/cors-config/prod.json
npx wrangler r2 bucket cors list politopics-assets-prod
```

## R2 パブリックアクセス設定

### Cloudflare ダッシュボードでの手順

1. Cloudflare ダッシュボードで **R2 Object Storage** に移動
2. バケット (`politopics-assets-prod`) を選択
3. **Settings** → **Public Access** に移動
4. **Connect Domain** をクリック
5. カスタムドメインを入力: `asset.politopics.net`
6. Cloudflare が自動的に以下を設定:
   - DNS レコード作成
   - SSL 証明書発行
   - CDN キャッシュ設定

### キャッシュ設定

アセットは以下のヘッダーで Cloudflare エッジにキャッシュされます:

```http
Cache-Control: public, max-age=31536000, immutable
```

記事 ID は一意でコンテンツは不変のため、積極的なキャッシュが安全です。

## このアーキテクチャの利点

### パフォーマンス

- **CDN 分散配信**: 最寄りの Cloudflare エッジロケーションからアセットを配信
- **バックエンド負荷軽減**: API はメタデータのみを返却、R2 読み取りなし
- **並列読み込み**: メタデータとアセットを独立して取得可能

### コスト

- **Worker CPU 削減**: Worker でのアセット処理が不要
- **R2 エグレス無料**: パブリックアクセスのエグレスは無料（制限内）
- **D1 読み取り削減**: アセットデータはデータベースに保存しない

### スケーラビリティ

- **独立したスケーリング**: API とアセット配信が独立してスケール
- **高キャッシュヒット率**: 不変アセットの高いキャッシュヒット率
- **地理的分散**: グローバル CDN カバレッジ

## フォールバック処理

フロントエンドにはレガシー `s3://` URL 用のフォールバックロジックが含まれています:

```typescript
export async function fetchArticleAsset(
  assetUrl: string,
): Promise<ArticleAssetData | null> {
  // レガシー s3:// URL をスキップ（ブラウザからアクセス不可）
  if (assetUrl.startsWith("s3://")) {
    return null;
  }

  const response = await fetch(assetUrl);
  if (!response.ok) return null;

  return response.json();
}
```

## 監視

### 監視すべき主要メトリクス

1. **R2 メトリクス** (Cloudflare ダッシュボード)
   - リクエスト数
   - 帯域幅使用量
   - キャッシュヒット率

2. **Worker メトリクス**
   - API レスポンス時間（アセット読み込みなしで短縮されるはず）
   - リクエストあたりの CPU 時間

3. **フロントエンドメトリクス**
   - アセット読み込み時間
   - 2段階ローディングのパフォーマンス

## 関連ドキュメント

- [Fargate アーキテクチャ](./fargate-architecture.md)
- [Cloudflare R2 CORS ドキュメント](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 パブリックバケット](https://developers.cloudflare.com/r2/buckets/public-buckets/)
