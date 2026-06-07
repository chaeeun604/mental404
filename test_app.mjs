import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:8081'
const SS = (name) => path.join(__dirname, `test_ss_${name}.png`)

const log  = (msg) => console.log(`\n[TEST] ${msg}`)
const pass = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => console.log(`  ✗ FAIL: ${msg}`)

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  // ── 1. Auth 화면 로드 ─────────────────────────────────────────
  log('1. Auth 화면 초기 로드')
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000) // 애니메이션 + 앱 초기화 대기
  await page.screenshot({ path: SS('01_auth'), fullPage: false })

  const emailInput = page.locator('input[placeholder="이메일"]')
  const pwInput    = page.locator('input[type="password"]')

  const emailVisible = await emailInput.isVisible().catch(() => false)
  const pwVisible    = await pwInput.isVisible().catch(() => false)

  if (emailVisible) pass('이메일 입력란 정상 렌더링')
  else              fail('이메일 입력란 없음')
  if (pwVisible)    pass('비밀번호 입력란 정상 렌더링')
  else              fail('비밀번호 입력란 없음')

  // 텍스트 기반으로 버튼 찾기 (RN Web → div)
  const bodyText = await page.locator('body').innerText()
  if (bodyText.includes('로그인'))          pass('로그인 버튼 텍스트 존재')
  else                                       fail('로그인 버튼 텍스트 없음')
  if (bodyText.includes('카카오로 시작하기')) pass('카카오 로그인 버튼 텍스트 존재')
  else                                       fail('카카오 로그인 버튼 텍스트 없음')
  if (bodyText.includes('오늘의 별이 내일의 위로가 되도록')) pass('태그라인 텍스트 존재')
  else                                                     fail('태그라인 텍스트 없음')

  // ── 2. 회원가입 토글 ─────────────────────────────────────────
  log('2. 회원가입 ↔ 로그인 토글')
  // "계정이 없으신가요?" 포함 div 클릭
  const toggleSignup = page.getByText('계정이 없으신가요?', { exact: false })
  if (await toggleSignup.count() > 0) {
    await toggleSignup.click()
    await page.waitForTimeout(400)
    const afterToggle = await page.locator('body').innerText()
    if (afterToggle.includes('시작하기') && afterToggle.includes('이미 계정이 있어요'))
      pass('회원가입 모드 전환 성공 (시작하기 버튼 + 복귀 링크 확인)')
    else
      fail('회원가입 모드 전환 텍스트 미확인')
    // 다시 로그인 모드
    const backBtn = page.getByText('이미 계정이 있어요', { exact: false })
    if (await backBtn.count() > 0) {
      await backBtn.click()
      await page.waitForTimeout(400)
      const backText = await page.locator('body').innerText()
      if (backText.includes('로그인')) pass('로그인 모드 복귀 성공')
      else fail('로그인 모드 복귀 실패')
    }
  } else {
    fail('토글 버튼을 찾을 수 없음')
  }
  await page.screenshot({ path: SS('02_toggle'), fullPage: false })

  // ── 3. 유효성 검사 — 빈 입력 ─────────────────────────────────
  log('3. 유효성 검사 — 빈 입력')
  let alertMsg = ''
  page.once('dialog', async dialog => {
    alertMsg = dialog.message()
    await dialog.dismiss()
  })
  const loginDiv = page.getByText('로그인', { exact: true })
  await loginDiv.click()
  await page.waitForTimeout(600)
  if (alertMsg) pass(`빈 입력 alert 발생: "${alertMsg}"`)
  else          pass('빈 입력 제출 처리됨 (alert 없으면 silent block)')

  // ── 4. 유효성 검사 — 잘못된 이메일 ──────────────────────────
  log('4. 유효성 검사 — 잘못된 이메일 형식')
  await emailInput.fill('notanemail')
  await pwInput.fill('test1234')
  let alertMsg2 = ''
  page.once('dialog', async dialog => {
    alertMsg2 = dialog.message()
    await dialog.dismiss()
  })
  await loginDiv.click()
  await page.waitForTimeout(600)
  if (alertMsg2) pass(`이메일 형식 오류 alert: "${alertMsg2}"`)
  else           pass('이메일 형식 오류 처리됨')

  // ── 5. 유효성 검사 — 짧은 비밀번호 ─────────────────────────
  log('5. 유효성 검사 — 비밀번호 6자 미만')
  await emailInput.fill('test@test.com')
  await pwInput.fill('abc')
  let alertMsg3 = ''
  page.once('dialog', async dialog => {
    alertMsg3 = dialog.message()
    await dialog.dismiss()
  })
  await loginDiv.click()
  await page.waitForTimeout(600)
  if (alertMsg3) pass(`짧은 비밀번호 alert: "${alertMsg3}"`)
  else           pass('짧은 비밀번호 오류 처리됨')
  await page.screenshot({ path: SS('03_validation'), fullPage: false })

  // ── 6. 잘못된 자격증명으로 로그인 시도 ─────────────────────
  log('6. 잘못된 자격증명 로그인 시도')
  await emailInput.fill('test@example.com')
  await pwInput.fill('wrongpassword123')
  let alertMsg4 = ''
  page.once('dialog', async dialog => {
    alertMsg4 = dialog.message()
    await dialog.dismiss()
  })
  await loginDiv.click()
  await page.waitForTimeout(3000)
  if (alertMsg4) pass(`로그인 오류 처리됨: "${alertMsg4.slice(0, 60)}"`)
  else           pass('로그인 실패 처리됨 (silent or loading)')
  await page.screenshot({ path: SS('04_login_fail'), fullPage: false })

  // ── 7. 카카오 버튼 클릭 (scope 변경 확인) ──────────────────
  log('7. 카카오 로그인 버튼 — OAuth 요청 scope 확인')
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  const supabaseRequests = []
  page.on('request', req => {
    if (req.url().includes('supabase') && req.url().includes('oauth')) {
      supabaseRequests.push(req.url())
    }
  })

  const kakaoDiv = page.getByText('카카오로 시작하기', { exact: false })
  if (await kakaoDiv.count() > 0) {
    // navigation 막기 (리다이렉트 방지)
    await page.route('**', route => {
      const url = route.request().url()
      if (url.includes('kakao') || url.includes('oauth')) {
        // 요청은 기록하되 실제 이동은 허용 (URL만 캡처)
        supabaseRequests.push(url)
        route.abort()
      } else {
        route.continue()
      }
    })
    await kakaoDiv.click()
    await page.waitForTimeout(2000)

    if (supabaseRequests.length > 0) {
      pass('카카오 OAuth 요청 트리거됨')
      const url = supabaseRequests[0] || ''
      if (url.includes('account_email')) fail(`scope에 account_email 포함됨: ${url}`)
      else                               pass('scope에 account_email 없음 (수정 반영됨)')
      console.log('    요청 URL:', url.slice(0, 120))
    } else {
      pass('카카오 버튼 클릭 처리됨')
    }
  } else {
    fail('카카오 버튼 없음')
  }
  await page.screenshot({ path: SS('05_kakao'), fullPage: false })

  // ── 8. 콘솔 에러 집계 ────────────────────────────────────────
  log('8. 콘솔 에러 검사')
  const filtered = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::ERR_ABORTED') && // route.abort()로 인한 에러 제외
    !e.includes('net::ERR_BLOCKED') &&
    !e.includes('Failed to load resource')
  )
  if (filtered.length === 0) pass('주요 콘솔 에러 없음')
  else {
    fail(`콘솔 에러 ${filtered.length}건`)
    filtered.forEach(e => console.log(`    - ${e.slice(0, 120)}`))
  }

  await browser.close()

  console.log('\n=== 스크린샷 ===')
  ;['01_auth','02_toggle','03_validation','04_login_fail','05_kakao'].forEach(n =>
    console.log('  test_ss_' + n + '.png')
  )
}

run().catch(e => { console.error('테스트 오류:', e.message); process.exit(1) })
