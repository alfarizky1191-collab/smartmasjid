import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const SLUG = __ENV.MOSQUE_SLUG || "jamie";

const errorRate = new Rate("errors");
const tvLoadTime = new Trend("tv_load_time", true);
const mobileLoadTime = new Trend("mobile_load_time", true);

export const options = {
  stages: [
    { duration: "30s", target: 10 },   // ramp up to 10 users
    { duration: "1m", target: 50 },    // ramp up to 50 users
    { duration: "2m", target: 50 },    // hold 50 users
    { duration: "30s", target: 100 },  // spike to 100 users
    { duration: "1m", target: 100 },   // hold spike
    { duration: "30s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"],  // 95% requests under 3s
    errors: ["rate<0.05"],              // error rate under 5%
    tv_load_time: ["p(95)<5000"],
    mobile_load_time: ["p(95)<5000"],
  },
};

export default function () {
  // TV page
  const tvRes = http.get(`${BASE_URL}/tv/${SLUG}`);
  tvLoadTime.add(tvRes.timings.duration);
  const tvOk = check(tvRes, {
    "tv page status 200": (r) => r.status === 200,
    "tv page has mosque name": (r) => r.body.includes(SLUG) || r.body.length > 500,
  });
  errorRate.add(!tvOk);

  sleep(1);

  // Mobile page
  const mobileRes = http.get(`${BASE_URL}/m/${SLUG}`);
  mobileLoadTime.add(mobileRes.timings.duration);
  const mobileOk = check(mobileRes, {
    "mobile page status 200": (r) => r.status === 200,
    "mobile page has content": (r) => r.body.length > 500,
  });
  errorRate.add(!mobileOk);

  sleep(1);

  // Login page (unauthenticated)
  const loginRes = http.get(`${BASE_URL}/login`);
  check(loginRes, {
    "login page status 200": (r) => r.status === 200,
  });

  sleep(1);
}
