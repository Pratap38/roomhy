import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 0 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.02'],
        http_req_duration: ['p(95)<800']
    }
};

const BASE_URL = __ENV.BASE_URL || 'https://api.roomhy.com';

export default function () {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
        'health status 200': (r) => r.status === 200
    });
    sleep(1);
}
