# R2 アセットバケット CORS 設定ガイド

このガイドでは、記事アセット配信用の R2 バケットの CORS を手動で設定する方法を説明します。

## 前提条件

- R2 アクセス権限のある Cloudflare アカウント
- R2 バケット作成済み (`politopics-assets-stage` または `politopics-assets-prod`)
- Wrangler CLI インストール済み（CLI 方式の場合）

## 方法 1: Cloudflare ダッシュボード

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. **R2 Object Storage** に移動
3. バケットを選択（例: `politopics-assets-prod`）
4. **Settings** タブをクリック
5. **CORS Policy** セクションまでスクロール
6. **Add CORS policy** をクリック
7. 以下の JSON を貼り付け:

### 本番環境

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

### ステージ環境

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

8. **Save** をクリック

## 方法 2: Wrangler CLI

### 提供スクリプトを使用

```bash
# ステージ環境
STAGE_FRONTEND_URL=https://your-stage-domain.net ./scripts/r2-configure-cors.sh stage

# 本番環境
./scripts/r2-configure-cors.sh prod
```

### 手動 Wrangler コマンド

1. CORS 設定ファイルを作成:

```bash
# 本番用
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

2. 設定を適用:

```bash
# 本番
npx wrangler r2 bucket cors set politopics-assets-prod --file /tmp/cors-prod.json

# ステージ
npx wrangler r2 bucket cors set politopics-assets-stage --file /tmp/cors-stage.json
```

3. 設定を確認:

```bash
npx wrangler r2 bucket cors list politopics-assets-prod
```

## パブリックアクセスの有効化

CORS だけでは不十分です。バケットのパブリックアクセスも有効にする必要があります。

### ダッシュボード経由

1. R2 バケット設定に移動
2. **Public Access** で **Connect Domain** をクリック
3. カスタムドメインを入力: `asset.politopics.net`
4. Cloudflare が自動的に以下を設定:
   - DNS レコード作成
   - SSL 証明書発行
   - CDN キャッシュ有効化

### Wrangler 経由（サポートされている場合）

```bash
# 注意: カスタムドメイン設定はダッシュボードでの設定が必要な場合があります
npx wrangler r2 bucket info politopics-assets-prod
```

## トラブルシューティング

### ブラウザでの CORS エラー

1. **Origin ヘッダーを確認**: リクエストに `Origin` ヘッダーが含まれているか確認
2. **AllowedOrigins を確認**: プロトコルを含め完全一致が必要
3. **キャッシュ伝播**: CORS 変更は最大 30 秒かかる場合があります

### CORS 設定のテスト

```bash
# curl でテスト
curl -I -X OPTIONS \
  -H "Origin: https://politopics.net" \
  -H "Access-Control-Request-Method: GET" \
  https://asset.politopics.net/articles/test/asset.json
```

期待されるレスポンスヘッダー:

```
Access-Control-Allow-Origin: https://politopics.net
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 86400
```

### よくある問題

| 問題                           | 原因                                 | 解決策                                        |
| ------------------------------ | ------------------------------------ | --------------------------------------------- |
| CORS ヘッダーが返されない      | リクエストに `Origin` ヘッダーがない | ブラウザリクエストに Origin を含める          |
| オリジンが許可されない         | AllowedOrigins のタイプミス          | `https://` を含む完全一致を確認               |
| キャッシュされた古いレスポンス | CDN キャッシュ                       | キャッシュをパージするか TTL を待つ           |
| バケットが見つからない         | バケットが存在しない                 | 先に Terraform/ダッシュボードでバケットを作成 |

## 関連ドキュメント

- [R2 アセットアーキテクチャ](./r2-asset-architecture.md)
- [Cloudflare R2 CORS ドキュメント](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 パブリックバケット](https://developers.cloudflare.com/r2/buckets/public-buckets/)
