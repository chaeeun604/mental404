import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'

await mkdir('screenshots', { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()

// Capture console errors
const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', e => errors.push(e.message))

const BASE = 'http://localhost:8081'

async function shot(name) {
  await page.screenshot({ path: `screenshots/${name}.png` })
  console.log(`📸 ${name}`)
}

// ── 1. Splash ──────────────────────────────────────────────
console.log('→ Splash')
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(1200)
await shot('1_splash')

// ── 2. Auth (자동 이동 대기) ────────────────────────────────
console.log('→ Auth')
await page.waitForTimeout(2500)
await shot('2_auth')

// ── 3. 회원가입 시도 ────────────────────────────────────────
console.log('→ 회원가입 탭 클릭')
const signupToggle = page.getByText('계정 만들기')
if (await signupToggle.count() > 0) {
  await signupToggle.click()
  await page.waitForTimeout(400)
}
await shot('3_signup_form')

// 이메일/비밀번호 입력
const emailInput = page.locator('input').first()
const pwInput    = page.locator('input[type="password"]').first()
await emailInput.fill('testuser@morbit.app')
await pwInput.fill('test1234')
await shot('4_signup_filled')

// 시작하기 버튼 클릭
const submitBtn = page.getByText('시작하기').first()
if (await submitBtn.count() > 0) await submitBtn.click()
else await page.getByText('로그인').first().click()

console.log('→ 회원가입 제출 후 대기...')
await page.waitForTimeout(3500)
await shot('5_after_signup')
console.log('현재 URL:', page.url())

// ── 4. 로그인 시도 (이미 로그인됐으면 건너뜀) ───────────────
const isAuthPage = await page.getByText('로그인').count() > 0
  || await page.locator('input').count() > 0

if (isAuthPage) {
  console.log('→ 아직 Auth 화면 — 로그인 시도')
  // 혹시 회원가입 모드면 "이미 계정이 있어요" 클릭
  const alreadyHave = page.getByText('이미 계정이 있어요')
  if (await alreadyHave.count() > 0) await alreadyHave.click()

  await page.locator('input').first().fill('testuser@morbit.app')
  await page.locator('input[type="password"]').first().fill('test1234')
  await shot('6_login_filled')

  await page.getByText('로그인').first().click()
  await page.waitForTimeout(3500)
  await shot('7_after_login')
  console.log('현재 URL:', page.url())
}

// ── 5. 홈 화면 ─────────────────────────────────────────────
const homeTitle = await page.getByText('의 우주').count() > 0
console.log('홈 화면 도달:', homeTitle)
await shot('8_home_or_final')

// ── 에러 요약 ──────────────────────────────────────────────
console.log('\n=== 콘솔 에러 ===')
if (errors.length === 0) {
  console.log('에러 없음 ✅')
} else {
  errors.slice(0, 10).forEach(e => console.log(' ✗', e))
}

await browser.close()
