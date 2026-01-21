# Backend API Latency Comparison

Latency measurements for backend APIs running on **AWS Lambda** and **Cloudflare Workers**.

> **Measurement script:** `profile/measure-backend-latency.js`  
> This script repeatedly calls each backend endpoint and records latency statistics (min / avg / p50 / p95 / p99).

---

## Cold Start Latency (AWS Lambda)

Measured by invoking the function after a period of inactivity.

| Endpoint     | Avg (ms) | p50 (ms) | p95 (ms) | Max (ms) |
| ------------ | -------: | -------: | -------: | -------: |
| `/headlines` |  6228.89 |  6285.55 |  6314.38 |  6314.38 |
| `/article`   |  6432.02 |  6319.97 |  6702.59 |  6702.59 |
| `/suggest`   |  4985.03 |  5809.22 |  6133.70 |  6133.70 |

> Cloudflare Workers do not exhibit measurable cold start latency due to their isolate-based execution model.

---

## Steady-State Latency (Average / p95)

### `/headlines`

| Platform           |   Avg (ms) |   p95 (ms) |
| ------------------ | ---------: | ---------: |
| AWS Lambda         |      454.6 |    1496.98 |
| Cloudflare Workers | **234.79** | **567.15** |

---

### `/article`

| Platform           |   Avg (ms) |   p95 (ms) |
| ------------------ | ---------: | ---------: |
| AWS Lambda         |     763.87 |    1446.46 |
| Cloudflare Workers | **377.91** | **554.54** |

---

### `/suggest`

| Platform           |  Avg (ms) |   p95 (ms) |
| ------------------ | --------: | ---------: |
| AWS Lambda         |    296.75 |     630.88 |
| Cloudflare Workers | **85.88** | **211.02** |

---

## Overall Comparison

### Cold Start vs Steady State (Avg)

| Endpoint     | Lambda Cold Start | Lambda Steady | Workers Steady |
| ------------ | ----------------: | ------------: | -------------: |
| `/headlines` |            ~6.2 s |      454.6 ms |  **234.79 ms** |
| `/article`   |            ~6.4 s |     763.87 ms |  **377.91 ms** |
| `/suggest`   |            ~5.0 s |     296.75 ms |   **85.88 ms** |

---

## Key Takeaways

- AWS Lambda cold starts add **~5–6.7 seconds** of latency.
- Even without cold starts, Cloudflare Workers are **1.9×–3.5× faster** on average.
- Tail latency (p95) is consistently lower on Workers.
- For latency-sensitive, user-facing APIs, **Cloudflare Workers provide a clear advantage**.
