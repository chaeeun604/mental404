import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
await mkdir('screenshots', { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', e => errors.push(e.message))

const BASE = 'http://localhost:8081'
const shot = async name => { await page.screenshot({ path: `screenshots/${name}.png` }); console.log(`📸 ${name}`) }

// 1. Splash
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(1200)
await shot('1_splash')

// 2. Auth
await page.waitForTimeout(2500)
await shot('2_auth')

// 3. 이메일 폼 표시
await page.getByText('이메일로 로그인').click()
await page.waitForTimeout(400)

// 4. 로그인 (email submit button 정확히 선택)
await page.locator('input[placeholder*="이메일"]').fill('testuser@morbit.app')
await page.locator('input[type="password"]').fill('test1234')
// 카카오 버튼이 아닌 이메일 submit 버튼 클릭 (마지막 버튼 텍스트로 특정)
await page.locator('text=로그인').last().click()
console.log('→ 로그인 제출...')
await page.waitForTimeout(5000)
const url = page.url()
console.log('URL after login:', url)
await shot('4_after_login')

// 5. 홈 화면 확인
const onHome = await page.getByText('님의 우주').count() > 0
console.log('홈 도달:', onHome ? '✅' : '❌')

if (onHome) {
  // 튜토리얼
  const tutorial = await page.getByText('MORBIT에 오신 걸 환영해요').count() > 0
  console.log('튜토리얼:', tutorial ? '✅' : '(이미 닫음)')
  if (tutorial) { await page.getByText('알겠어요').click(); await page.waitForTimeout(400) }
  await shot('5_home_graphic')

  // GNB 리스트 버튼 - list icon 클릭
  await page.locator('text=≡').first().click().catch(async () => {
    // ionicons 아이콘이라 텍스트로 못 찾으므로 좌표 클릭
    // GNB pill의 오른쪽 반 클릭: 195 + 56/2 + 28 = 가운데에서 pill 오른쪽
    await page.mouse.click(222, 790)
  })
  await page.waitForTimeout(800)
  await shot('6_home_list')
}

console.log('\n=== 에러 ===')
errors.length === 0 ? console.log('없음 ✅') : errors.slice(0,5).forEach(e => console.log('✗', e))
await browser.close()
