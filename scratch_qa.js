const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to https://keyabroad.com...");
  await page.goto('https://keyabroad.com', { waitUntil: 'networkidle' });
  
  // Test Navigation
  console.log("\n--- Testing Navigation Links ---");
  const navLinks = await page.$$eval('nav a', links => links.map(l => ({ text: l.textContent.trim(), href: l.href })));
  console.log(`Found ${navLinks.length} navigation links.`);
  for (const link of navLinks.slice(0, 5)) {
    console.log(`- ${link.text}: ${link.href}`);
  }

  // Test Search/Buttons
  console.log("\n--- Testing Buttons and CTAs ---");
  const buttons = await page.$$eval('button, a.btn, [role="button"]', btns => btns.map(b => b.textContent.trim()).filter(t => t.length > 0));
  console.log(`Found ${buttons.length} buttons.`);
  console.log("Sample buttons:", buttons.slice(0, 5));

  // Check for any visible text that looks like a placeholder (0%, $0M+, etc.)
  console.log("\n--- Checking for Placeholders ---");
  const pageText = await page.evaluate(() => document.body.innerText);
  const placeholders = ['0%', '0+', '$0M+', 'lorem ipsum'];
  for (const ph of placeholders) {
    if (pageText.toLowerCase().includes(ph.toLowerCase())) {
      console.log(`WARNING: Found placeholder "${ph}" on homepage!`);
    }
  }
  
  // Test specific flows
  console.log("\n--- Testing Programs Route ---");
  const programsRes = await page.goto('https://keyabroad.com/programs');
  console.log(`Programs page status: ${programsRes.status()}`);
  
  console.log("\n--- Testing Destinations Route ---");
  const destRes = await page.goto('https://keyabroad.com/destinations');
  console.log(`Destinations page status: ${destRes.status()}`);

  console.log("\n--- Testing 404 behavior on invalid slug ---");
  const invalidRes = await page.goto('https://keyabroad.com/universities/this-slug-does-not-exist-12345');
  console.log(`Invalid University page status: ${invalidRes.status()}`);
  
  await browser.close();
  console.log("\n--- QA Audit Complete ---");
})();
