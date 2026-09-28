const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to https://keyabroad.com...");
  await page.goto('https://keyabroad.com', { waitUntil: 'networkidle' });
  
  // Find all form elements
  console.log("\n--- Testing Forms ---");
  const forms = await page.$$('form');
  console.log(`Found ${forms.length} forms on the homepage.`);
  
  if (forms.length > 0) {
      for (let i = 0; i < forms.length; i++) {
          const inputs = await forms[i].$$eval('input', (elements) => elements.map(el => el.type || 'unknown'));
          console.log(`Form ${i + 1} has ${inputs.length} inputs: ${inputs.join(', ')}`);
      }
  } else {
      console.log("No forms found on the homepage. Let's check for specific CTAs.");
  }
  
  // Find all links that might be WhatsApp or Consultation
  console.log("\n--- Testing Specific CTAs (WhatsApp, Consultation) ---");
  const specificLinks = await page.$$eval('a', links => links.map(l => ({ text: l.textContent.trim(), href: l.href })));
  
  const whatsappLinks = specificLinks.filter(l => l.href.includes('wa.me') || l.href.includes('whatsapp'));
  console.log(`Found ${whatsappLinks.length} WhatsApp links.`);
  whatsappLinks.forEach(l => console.log(`- WA Link: ${l.href} (Text: ${l.text})`));
  
  const consultationLinks = specificLinks.filter(l => l.href.includes('consult') || l.href.includes('book-appointment') || l.text.toLowerCase().includes('consult'));
  console.log(`Found ${consultationLinks.length} Consultation links.`);
  consultationLinks.forEach(l => console.log(`- Consult Link: ${l.href} (Text: ${l.text})`));
  
  await browser.close();
  console.log("\n--- Forms/CTA QA Complete ---");
})();
