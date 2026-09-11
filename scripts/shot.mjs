// 헤드리스 크롬 CDP 캡처: node scripts/shot.mjs <url> <out.png> [--eval "js"] [--wait ms] [--scale 2] [--reduced] [--win W,H]
// 예) node scripts/shot.mjs "http://localhost:4179/?step=4" out.png --reduced --eval "document.querySelector('.chat-scroll').scrollTop=0"
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const [, , url, out, ...rest] = process.argv
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d }
const evalJs = opt('--eval', ''), waitMs = Number(opt('--wait', 1500)), scale = Number(opt('--scale', 2)), reduced = rest.includes('--reduced')
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9222 + Math.floor(Math.random() * 500)
const args = [`--remote-debugging-port=${port}`, '--remote-allow-origins=*', '--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${opt("--win", "1500,1000")}`, `--force-device-scale-factor=${scale}`, '--user-data-dir=/tmp/shot-profile-' + port, 'about:blank']
if (reduced) args.push('--force-prefers-reduced-motion')
const chrome = spawn(CH, args, { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  let targets
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch {} await sleep(150) }
  const page = targets.find((t) => t.type === 'page') || targets[0]   // 첫 타깃이 browser_ui(옴니박스)일 수 있어 page 를 고른다
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', (e) => j(new Error('ws error'))) })
  const budget = waitMs + Number(opt('--press', 0)) * Number(opt('--gap', 600)) + Number(opt('--after', 0)) + 20000 + Number(opt('--budget', 0))   // --budget ms: 긴 --eval(탭 체인 검증) 여유
  const kill = setTimeout(() => { console.error('timeout'); chrome.kill(); process.exit(1) }, budget)
  let id = 0; const pending = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } })
  const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })
  await send('Page.enable'); await send('Runtime.enable')
  // --device W,H: 모바일 뷰포트 에뮬레이션 (헤드리스 창 최소 500×725 보다 작은 화면 검증용, 2026-09-10)
  const dev = opt('--device', ''); if (dev) { const [dw, dh] = dev.split(',').map(Number); await send('Emulation.setDeviceMetricsOverride', { width: dw, height: dh, deviceScaleFactor: scale, mobile: true }); await send('Emulation.setTouchEmulationEnabled', { enabled: true }) }
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.log('EXC:', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.log('ERR:', m.params.args.map((a) => a.value || a.description).join(' ')) })
  await send('Page.navigate', { url })
  await sleep(waitMs)
  // --trace: 100ms 마다 .chat-scroll scrollTop 을 기록해 끝에 출력 (위아래 요동 검사)
  if (rest.includes('--trace')) await send('Runtime.evaluate', { expression: "window.__t=[];setInterval(()=>{const s=document.querySelector('.chat-scroll');if(s)window.__t.push(Math.round(s.scrollTop))},100)" })
  // --probe "js": 50ms 마다 식을 평가해 기록, 끝에 출력 (요소 위치·높이 변화 검사). 예) --probe "(r=>r&&Math.round(r.top)+'/'+Math.round(r.height))(document.querySelector('.ai-sheet.fs')?.getBoundingClientRect())"
  const probe = opt('--probe', ''); if (probe) await send('Runtime.evaluate', { expression: `window.__p=[];setInterval(()=>{try{window.__p.push(${probe})}catch(e){window.__p.push('!')}},50)` })
  // --pre "js" [--reload ms]: 식을 먼저 실행한 뒤(예: 안 전환 클릭) 페이지를 다시 로드하고 ms 기다린다 — 브라우저 탭 정리 후 재로드 복원 검증용 (2026-09-10)
  const pre = opt('--pre', ''); if (pre) await send('Runtime.evaluate', { expression: pre, awaitPromise: true })
  const reloadMs = Number(opt('--reload', 0)); if (reloadMs) { await sleep(300); await send('Page.reload'); await sleep(reloadMs) }
  // --press N [--gap ms] [--after ms]: ArrowRight 를 N 번 눌러 스텝을 진행시키고 after 만큼 기다린다 (재생 경로 검증용)
  const press = Number(opt('--press', 0)), gap = Number(opt('--gap', 600)), after = Number(opt('--after', 0))
  for (let i = 0; i < press; i++) { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }); await sleep(gap) }
  if (after) await sleep(after)
  if (rest.includes('--trace')) { const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__t)', returnByValue: true }); console.log('trace:', r?.result?.value) }
  if (probe) { const r = await send('Runtime.evaluate', { expression: 'JSON.stringify(window.__p)', returnByValue: true }); console.log('probe:', r?.result?.value) }
  if (evalJs) { const r = await send('Runtime.evaluate', { expression: evalJs, awaitPromise: true, returnByValue: true }); if (rest.includes('--print')) console.log('eval:', JSON.stringify(r?.result?.value)) }
  await sleep(400)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64')); console.log('wrote', out)
  ws.close(); clearTimeout(kill)
} finally { chrome.kill() }
