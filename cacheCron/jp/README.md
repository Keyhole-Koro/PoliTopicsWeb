# PoliTopics Cache Cron
[English Version](../README.md)

`/headlines` をフェッチし、JSON スナップショットを S3/R2 に書き込むスケジュールされた Lambda。

## ビルド

```bash
npm install
npm run build   # dist/headlines-cron.zip を出力
```

## 動作

- ランタイム: Node.js 22 (zip 内の `index.handler`)
- 設定は `APP_CONFIG` (local/stage/prod API, bucket, S3 endpoint) に固定されています。環境は Lambda 関数名 (`prod`/`stage` 部分文字列、それ以外は local) から選択されます。
- 環境変数経由のシークレットのみ:
  - Backend (stage): `STAGE_BACKEND_API_URL` (必須; デプロイされた API URL から Terraform 経由で設定)
  - S3/R2 認証: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (stage/prod で必須)
  - S3 互換エンドポイント: `S3_COMPATIBLE_API_STAGE` / `S3_COMPATIBLE_API_PROD` (必須; deploy-backend によって注入)
  - Discord: `DISCORD_WEBHOOK_BATCH` (成功), `DISCORD_WEBHOOK_ERROR` (失敗; 欠落時は batch にフォールバック)

## パッケージングに関する注意

- esbuild でバンドルされ (単一の `index.js`)、`scripts/zip.mjs` を介して zip 圧縮されます (実行時 `node_modules` は不要)。
