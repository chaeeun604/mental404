const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  // Auth screen
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'ss_auth.png' });
  console.log('auth done');

  // Try clicking "계정이 없으신가요? 시작하기" -> Onboarding
  try {
    await page.click('text=시작하기', { timeout: 3000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ss_onboarding.png' });
    console.log('onboarding done');
  } catch (e) {
    console.log('onboarding skip:', e.message);
  }

  await browser.close();
})().catch(console.error);
