/**
 * Load Tests — Artillery
 *
 * Install Artillery: npm install -D artillery -w tests (or globally)
 * Run: npx artillery run tests/load/homepage.yml
 */

// homepage.yml — 100 concurrent users over 60 seconds
const homepageConfig = `
config:
  target: "{{ $processEnvironment.WEB_URL || 'http://localhost:3000' }}"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Ramp up"
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"
    - duration: 30
      arrivalRate: 10
      name: "Ramp down"
  ensure:
    p95: 2000
    maxErrorRate: 1

scenarios:
  - name: "Public visitor homepage"
    weight: 60
    flow:
      - get:
          url: "/"
      - get:
          url: "/universities"
      - get:
          url: "/programs"

  - name: "Blog reader"
    weight: 20
    flow:
      - get:
          url: "/blog"

  - name: "Health check"
    weight: 20
    flow:
      - get:
          url: "/api/health"
          expect:
            - statusCode: 200
`;

const enquiryConfig = `
config:
  target: "{{ $processEnvironment.WEB_URL || 'http://localhost:3000' }}"
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Enquiry form load"
    - duration: 60
      arrivalRate: 20
      name: "Sustained enquiry load"
  ensure:
    p95: 3000
    maxErrorRate: 2

scenarios:
  - name: "API enquiry endpoint"
    flow:
      - post:
          url: "/api/notify"
          json:
            email: "loadtest@test.com"
            name: "Load Test User"
            message: "Load test enquiry"
`;

// Write config files
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname);

fs.writeFileSync(path.join(dir, 'homepage.yml'), homepageConfig.trim());
fs.writeFileSync(path.join(dir, 'api-enquiry.yml'), enquiryConfig.trim());

console.log('✅ Artillery load test configs generated:');
console.log('   tests/load/homepage.yml');
console.log('   tests/load/api-enquiry.yml');
console.log('');
console.log('Run with:');
console.log('   WEB_URL=https://staging.keyabroad.com npx artillery run tests/load/homepage.yml');
console.log('   WEB_URL=https://staging.keyabroad.com npx artillery run tests/load/api-enquiry.yml');
