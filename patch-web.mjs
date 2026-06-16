import fs from 'fs'

const html = fs.readFileSync('dist/index.html', 'utf8')
const patched = html.replace(
  '</head>',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png"></head>'
)
fs.writeFileSync('dist/index.html', patched)
fs.copyFileSync('assets/icon.png', 'dist/apple-touch-icon.png')
console.log('✅ apple-touch-icon 패치 완료')
