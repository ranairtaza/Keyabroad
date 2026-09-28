const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = {
    pagesChecked: 0,
    brokenInteractions: 0,
    consoleErrors: 0,
    networkErrors: 0
  };

  page.on('console', msg => {
    if (msg.type() === 'error') results.consoleErrors++;
  });

  page.on('pageerror', exception => {
    results.consoleErrors++;
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.status() < 600) {
      // Ignore some typical analytics/font blocks, count main resources
      if (!response.url().includes('google-analytics')) {
        results.networkErrors++;
      }
    }
  });

  try {
    await page.goto('http://localhost:3001');
    results.pagesChecked++;
    
    // Check elements
    const eligibilityBtn = page.locator('text=Check Eligibility').first();
    if (await eligibilityBtn.isVisible()) {
      await eligibilityBtn.click();
      await page.waitForLoadState('networkidle');
      results.pagesChecked++;
    }
    
    console.log(JSON.stringify(results));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
