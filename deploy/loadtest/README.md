# Load and Stress Test

## Prerequisite
- Install k6: https://k6.io/docs/get-started/installation/

## 1) Smoke test (quick check)
```bash
k6 run -e BASE_URL="https://api.roomhy.com" /var/www/roomhy/deploy/loadtest/k6-smoke.js
```

## 2) Stress test (ramp to 1000 VUs)
```bash
k6 run -e BASE_URL="https://api.roomhy.com" /var/www/roomhy/deploy/loadtest/k6-stress.js
```

## 3) Export report JSON
```bash
k6 run -e BASE_URL="https://api.roomhy.com" --out json=/var/www/roomhy/deploy/loadtest/k6-result.json /var/www/roomhy/deploy/loadtest/k6-stress.js
```

## Endpoints covered
- `/api/health`
- `/api/locations/cities`
- `/api/locations/areas`
- `/api/properties?limit=20&page=1`

## Pass criteria (recommended)
- `http_req_failed < 3%`
- `p95 < 1200ms`
- `p99 < 2500ms`
