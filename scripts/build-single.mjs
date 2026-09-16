// dist/ → 단일 HTML (Claude Code 아티팩트 미리보기용). 이미지/아이콘은 base64 인라인.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
let html = readFileSync(join(dist, 'index.html'), 'utf8')

const mime = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' }

// public 에셋(/screens/… · /icons/…) 경로 → data URI. 실제로 참조된 파일만 읽어 인코딩한다 (lazy)
const files = new Set()
const walk = (rel) => {
  for (const e of readdirSync(join(dist, rel), { withFileTypes: true })) {
    const r = `${rel}/${e.name}`
    if (e.isDirectory()) walk(r)
    else if (mime[extname(e.name)]) files.add(`/${r}`)
  }
}
for (const d of ['screens', 'icons']) { try { walk(d) } catch { /* 폴더 없으면 건너뜀 */ } }
const cache = new Map()
const dataUri = (p) => {
  if (!cache.has(p)) cache.set(p, `data:${mime[extname(p)]};base64,${readFileSync(join(dist, p)).toString('base64')}`)
  return cache.get(p)
}
// 한 번의 정규식 패스로 모든 에셋 경로를 치환 (에셋 수 × 번들 길이 만큼 반복 스캔하던 것을 대체)
const ASSET_RE = /\/(?:screens|icons)\/[\w./-]+\.(?:png|svg|jpg)/g
const inlineAssets = (s) => s.replace(ASSET_RE, (m) => (files.has(m) ? dataUri(m) : m))

// inline css
html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) =>
  `<style>${inlineAssets(readFileSync(join(dist, href), 'utf8'))}</style>`)
// inline js (module)
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, src) =>
  `<script type="module">${inlineAssets(readFileSync(join(dist, src), 'utf8')).replace(/<\/script>/g, '<\\/script>')}</script>`)
// 외부 폰트 링크 제거(아티팩트 CSP) + doctype/html/head/body/meta 래퍼 제거 — 한 패스
html = html.replace(/<link rel="stylesheet" as="style" crossorigin href="https:\/\/cdn\.jsdelivr[^>]*>|<!doctype html>|<\/?html[^>]*>|<\/?head>|<\/?body>|<meta[^>]*>/gi, '')

// 주소창이 없는 아티팩트용 기본 쿼리 (예: `node scripts/build-single.mjs out.html "lab=all&an=3&step=9&ru=U1"`)
const q = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : ''
if (q) html = `<script>window.__LAB_Q=${JSON.stringify(q)}</script>` + html

// --local: 더블클릭(file://)으로 열 수 있는 완전한 HTML 문서. 아티팩트용 래퍼 제거 상태로는 charset 이 없고,
// history.replaceState('/1?step=1') 이 file:// 에서 SecurityError 로 막혀 빈 화면이 되므로 셤으로 우회 (2026-09-15)
if (process.argv.includes('--local')) {
  const shim = '<script>(function(){if(location.protocol!=="file:")return;for(const k of ["pushState","replaceState"]){const o=history[k].bind(history);history[k]=function(s,t,u){try{if(typeof u==="string"){const i=u.indexOf("?");u=location.pathname+(i>=0?u.slice(i):"")}return o(s,t,u)}catch(e){}}}})()</script>'
  html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + html.replace(/<title>[^<]*<\/title>/, (m) => `${m}</head><body>${shim}`) + '</body></html>'
}

const out = process.argv[2] || join(root, 'dist', 'single.html')
writeFileSync(out, html.trim())
console.log('wrote', out, Math.round(html.length / 1024) + 'KB')
