const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.fill('input[placeholder="이메일"]', 'ce7828@gmail.com');
  await page.fill('input[placeholder="비밀번호 (6자 이상)"]', '123456');
  await page.click('text=로그인');
  await page.waitForFunction(() => document.body.innerText.includes('우주'), { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 튜토리얼 닫기
  await page.click('body'); await page.waitForTimeout(400);
  await page.click('body'); await page.waitForTimeout(400);

  // 별똥별 배너 클릭
  await page.click('text=오늘의 별똥별이 도착했어요');
  await page.waitForTimeout(2000);

  // 박스 중앙 클릭 (화면 중앙)
  await page.mouse.click(195, 490);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'ss_star_after.png' });
  console.log('done');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
