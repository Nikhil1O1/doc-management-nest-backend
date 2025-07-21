import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50, // virtual users
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.TOKEN || '';

export default function () {
  const payload = {
    file: http.file('dummy content', 'dummy.txt'),
    title: 'Perf Test',
    description: 'Performance upload test',
    documentType: 'text',
  };

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
  };

  const res = http.post(`${BASE_URL}/api/v1/documents/upload`, payload, {
    headers,
  });

  check(res, {
    'is status 201': (r) => r.status === 201,
  });

  sleep(1);
} 