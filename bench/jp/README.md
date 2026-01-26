# バックエンドレイテンシ測定
[English Version](../README.md)

このフォルダには、シンプルなクライアントサイドレイテンシプローブスクリプトが含まれています。ターゲットごとに固定間隔で HTTP リクエストを送信し、パスパラメータをサポートし、最初のリクエストの前にクールダウンを待つことでコールドスタートのタイミングをキャプチャできます。

## 要件

- Node.js 18+ (グローバル `fetch` 用)

## クイックスタート

```
node measure/measure-backend-latency.js --config measure/targets.example.json --duration-ms 60000
```

各リクエストは JSON 行としてログに記録されます。サマリーは最後に印刷されます。

## 設定ファイル形式

```
{
  "baseUrl": "http://127.0.0.1:4500",
  "durationMs": 60000,
  "defaults": {
    "method": "GET",
    "intervalMs": 5000,
    "timeoutMs": 15000,
    "samples": 10,
    "readBody": true,
    "headers": {
      "x-api-key": "secret"
    },
    "coldStart": {
      "enabled": false,
      "cooldownMs": 60000
    }
  },
  "targets": [
    {
      "name": "healthz",
      "path": "/healthz",
      "intervalMs": 2000
    }
  ]
}
```

### ターゲットフィールド

- `name`: ログとサマリーのラベル (省略時は `path` がデフォルト)
- `path`: リクエストパス (`:id` または `{id}` プレースホルダーをサポート)
- `pathParams`: パスプレースホルダーのキー/値マップ
- `query`: クエリパラメータ (文字列, 数値, 配列)
- `baseUrl`: ターゲットごとのオプションのオーバーライド
- `method`: HTTP メソッド
- `headers`: リクエストヘッダー
- `body`: JSON オブジェクトまたは文字列ボディ
- `intervalMs`: リクエスト開始間隔
- `timeoutMs`: リクエストごとのタイムアウト
- `samples`: ウォームリクエスト数 (`null` で無制限)
- `readBody`: true の場合、完全なレスポンスボディを読み取ります
- `coldStart`: コールドスタートタイミング用 `{ enabled: true, cooldownMs: 90000 }`

## コールドスタート

`coldStart.enabled` を `true` に設定し、`cooldownMs` を提供します。スクリプトはそのクールダウンを待ってから、最初のリクエストをコールドスタートとして個別に記録します。残りのリクエストはウォームサンプルとして扱われます。
