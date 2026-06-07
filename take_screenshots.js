const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }  // iPhone 14 size
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot_1.png', fullPage: true });
  console.log('Screenshot 1 taken');
  
  await browser.close();
})().catch(console.error);
