# Monitoring and Alerting Setup

## Services
- Prometheus: metrics store (`:9090`)
- Grafana: dashboards (`:3000`)
- Alertmanager: alert routing (`:9093`)
- Node Exporter: VPS metrics (`:9100`)

## Start stack
```bash
cd /var/www/roomhy/deploy/monitoring
docker compose up -d
docker compose ps
```

## Verify
1. Backend metrics endpoint:
```bash
curl -I http://127.0.0.1:5001/metrics
```
2. Prometheus targets:
- Open `http://<server-ip>:9090/targets`
- Ensure `roomhy-backend` is `UP`

## Environment values to set
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`
- Slack/PagerDuty values used in `alertmanager.yml`

## Common issues
- If backend target is DOWN, ensure docker can reach host port 5001.
- `host.docker.internal` mapping is already added in compose.
- If alerts not firing, verify Alertmanager config and webhook credentials.
