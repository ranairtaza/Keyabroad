const https = require('https');
const http = require('http');

async function ping(url, options = {}) {
  const lib = url.startsWith('https') ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = lib.get(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runSmokeTests() {
  console.log("🔥 Running Smoke Tests...");

  const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000';
  const webUrl = process.env.WEB_URL || 'http://localhost:3001';
  const webhookSecret = process.env.WEBHOOK_SECRET || '';

  try {
    const adminHealth = await ping(`${adminUrl}/api/health`);
    console.log("✅ Admin Liveness Passed:", adminHealth.status);

    const webHealth = await ping(`${webUrl}/api/health`);
    console.log("✅ Web Liveness Passed:", webHealth.status);

    if (webhookSecret) {
      const adminReady = await ping(`${adminUrl}/api/health/ready`, {
        headers: { 'Authorization': `Bearer ${webhookSecret}` }
      });
      console.log("✅ Admin Readiness Passed:", adminReady.status);
    }

    console.log("🎉 All smoke tests passed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Smoke Test Failed!", err.message);
    process.exit(1);
  }
}

runSmokeTests();
