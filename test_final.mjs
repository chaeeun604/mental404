import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
await mkdir('screenshots', { recursive: true })

const b = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', e => errors.push(e.message))

const shot = async n => { await page.screenshot({ path: `screenshots/${n}.png` }); console.log(`📸 ${n}`) }

// Splash
await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(1200); await shot('A_splash')

// Auth
await page.waitForTimeout(2500); await shot('B_auth')

// Login
await page.locator('input[placeholder*="이메일"]').fill('testuser@morbit.app')
await page.locator('input[type="password"]').fill('test1234')
await page.locator('text=로그인').last().click()
await page.waitForTimeout(5000); await shot('C_home')
console.log('홈 도달:', (await page.getByText('님의 우주').count()) > 0 ? '✅' : '❌')

// Dismiss tutorial if shown
if (await page.getByText('알겠어요').count() > 0) {
  await page.getByText('알겠어요').click()
  await page.waitForTimeout(400)
}
await shot('D_home_planet')

// List tab
await page.mouse.click(222, 795)
await page.waitForTimeout(600); await shot('E_home_list')

// GNB check
console.log('에러:', errors.length === 0 ? '없음 ✅' : errors.slice(0,3))
await b.close()
