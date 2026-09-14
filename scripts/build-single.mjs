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
const q = process.argv[3]
if (q) html = `<script>window.__LAB_Q=${JSON.stringify(q)}</script>` + html

const out = process.argv[2] || join(root, 'dist', 'single.html')
writeFileSync(out, html.trim())
console.log('wrote', out, Math.round(html.length / 1024) + 'KB')
