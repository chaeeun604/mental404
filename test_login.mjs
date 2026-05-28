import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

await mkdir('screenshots', { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', e => errors.push(e.message))

await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(3000) // splash → auth

async function shot(name) {
  await page.screenshot({ path: `screenshots/${name}.png` })
  console.log(`📸 ${name}`)
}

// 로그인 (이미 가입된 계정)
console.log('→ 로그인 시도')
await page.locator('input').first().fill('testuser@morbit.app')
await page.locator('input[type="password"]').first().fill('test1234')
await shot('login_1_filled')

await page.getByText('로그인').first().click()
console.log('→ 제출 후 대기...')
await page.waitForTimeout(4000)
await shot('login_2_result')
console.log('URL:', page.url())

// 홈 화면 도달 여부
const onHome = await page.getByText('의 우주').count() > 0
console.log('홈 화면 도달:', onHome ? '✅' : '❌')
if (onHome) {
  await page.waitForTimeout(1000)
  await shot('login_3_home')
}

// Alert 등 오류 메시지 확인
const alertEl = await page.locator('[role="alert"], text=오류').count()
console.log('오류 메시지:', alertEl > 0 ? '⚠️ 있음' : '없음')

console.log('\n=== 콘솔 에러 ===')
errors.length === 0 ? console.log('없음 ✅') : errors.slice(0, 5).forEach(e => console.log(' ✗', e))

await browser.close()
