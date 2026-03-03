import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://api.roomhy.com';

const errorCounter = new Counter('errors_total');
const healthLatency = new Trend('health_latency_ms');
const propertiesLatency = new Trend('properties_latency_ms');
const citiesLatency = new Trend('cities_latency_ms');
const areasLatency = new Trend('areas_latency_ms');

export const options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '4m', target: 300 },
        { duration: '4m', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '3m', target: 1000 },
        { duration: '3m', target: 0 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.03'],
        http_req_duration: ['p(95)<1200', 'p(99)<2500'],
        errors_total: ['count<200']
    }
};

function recordCheck(result, metric, checks) {
    const ok = check(result, checks);
    metric.add(result.timings.duration);
    if (!ok) errorCounter.add(1);
}

export default function () {
    group('Health', () => {
        const res = http.get(`${BASE_URL}/api/health`);
        recordCheck(res, healthLatency, {
            'health 200': (r) => r.status === 200
        });
    });

    sleep(Math.random() * 0.8);

    group('Cities', () => {
        const res = http.get(`${BASE_URL}/api/locations/cities`);
        recordCheck(res, citiesLatency, {
            'cities 200': (r) => r.status === 200
        });
    });

    sleep(Math.random() * 0.8);

    group('Areas', () => {
        const res = http.get(`${BASE_URL}/api/locations/areas`);
        recordCheck(res, areasLatency, {
            'areas 200': (r) => r.status === 200
        });
    });

    sleep(Math.random() * 0.8);

    group('Properties', () => {
        const res = http.get(`${BASE_URL}/api/properties?limit=20&page=1`);
        recordCheck(res, propertiesLatency, {
            'properties 200': (r) => r.status === 200
        });
    });

    sleep(Math.random() * 1.2);
}

export function handleSummary(data) {
    return {
        stdout:
            `\n` +
            `=== K6 Stress Summary ===\n` +
            `requests: ${data.metrics.http_reqs?.values?.count || 0}\n` +
            `failed: ${data.metrics.http_req_failed?.values?.rate || 0}\n` +
            `p95: ${data.metrics.http_req_duration?.values?.['p(95)'] || 0} ms\n` +
            `p99: ${data.metrics.http_req_duration?.values?.['p(99)'] || 0} ms\n` +
            `==========================\n`
    };
}
