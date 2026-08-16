const BASE_URL = 'https://keyabroad.com';

const ROUTES = [
  '/',
  '/about',
  '/ai-advisor',
  '/blog',
  '/book-appointment',
  '/careers',
  '/compare',
  '/contact',
  '/cost-calculator',
  '/counseling',
  '/destinations',
  '/eligibility',
  '/language-tests',
  '/login',
  '/programs',
  '/scholarships',
  '/services',
  '/student',
  '/teams',
  '/universities',
  '/walk-in'
];

async function checkRoute(route) {
  try {
    const res = await fetch(`${BASE_URL}${route}`);
    return { route, status: res.status };
  } catch (err) {
    return { route, status: 'ERROR', message: err.message };
  }
}

async function run() {
  console.log(`Starting automated check for ${ROUTES.length} routes on ${BASE_URL}...`);
  
  let passed = 0;
  let failed = [];

  for (const route of ROUTES) {
    const result = await checkRoute(route);
    if (result.status === 200) {
      console.log(`[PASS] ${route} (200 OK)`);
      passed++;
    } else {
      console.log(`[FAIL] ${route} (Status: ${result.status})`);
      failed.push(result);
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Total Checked: ${ROUTES.length}`);
  console.log(`Passed (200 OK): ${passed}`);
  console.log(`Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log(`\nFailed Routes Details:`);
    failed.forEach(f => console.log(`- ${f.route}: HTTP ${f.status}`));
  }
}

run();
