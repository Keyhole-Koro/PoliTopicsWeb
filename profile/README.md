# Backend Latency Measurement
[日本語版](./jp/README.md)

This folder contains a simple client-side latency probe script. It sends HTTP
requests on a fixed interval per target, supports path parameters, and can
capture cold-start timings by waiting for a cooldown before the first request.

## Requirements

- Node.js 18+ (for global `fetch`)

## Quick start

```
node measure/measure-backend-latency.js --config measure/targets.example.json --duration-ms 60000
```

Each request is logged as a JSON line. A summary is printed at the end.

## Config file format

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

### Target fields

- `name`: label for logs and summary (defaults to `path` if omitted)
- `path`: request path (supports `:id` or `{id}` placeholders)
- `pathParams`: key/value map for path placeholders
- `query`: query parameters (strings, numbers, arrays)
- `baseUrl`: optional per-target override
- `method`: HTTP method
- `headers`: request headers
- `body`: JSON object or string body
- `intervalMs`: interval between request starts
- `timeoutMs`: per-request timeout
- `samples`: number of warm requests (`null` for unlimited)
- `readBody`: when true, reads the full response body
- `coldStart`: `{ enabled: true, cooldownMs: 90000 }` for cold-start timing

## Cold start

Set `coldStart.enabled` to `true` and provide a `cooldownMs`. The script will
wait for that cooldown, then record the first request separately as a cold
start. The remaining requests are treated as warm samples.
