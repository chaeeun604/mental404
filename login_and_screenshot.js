const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'ss_01_auth.png' });
  console.log('01 auth');

  await page.fill('input[placeholder="이메일"]', 'ce7828@gmail.com');
  await page.fill('input[placeholder="비밀번호 (6자 이상)"]', '123456');
  await page.click('text=로그인');

  // "우주" 는 홈화면에만 나옴
  try {
    await page.waitForFunction(() => document.body.innerText.includes('우주'), { timeout: 15000 });
    console.log('홈 진입 성공');
  } catch(e) {
    console.log('홈 진입 실패:', await page.evaluate(() => document.body.innerText.slice(0, 100)));
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'ss_02_home.png' });
  console.log('02 home');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
