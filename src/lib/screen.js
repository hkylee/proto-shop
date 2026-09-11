// 폰 화면 캔버스 크기. 기본은 Figma 기준 393×852.
// 모바일에서는 기기마다 캔버스 자체가 달라진다 — 화면 코드(AgentChat 의 SCREEN_H 파생 상수, 포인터 좌표 환산 k,
// CSS 의 --sw/--sh)가 모두 이 값을 써야 스크롤·시트·키패드·터치 자리가 맞는다.
// 모듈 로드 시점에 한 번 정한다(파생 상수가 많아 나중에 바꿀 수 없음).
import { CONFIRMED } from './variants.js'

export const BASE_W = 393
export const BASE_H = 852
export const MAX_FILL_W = 430   // 폰보다 넓은 화면(≤767)에서도 무한정 늘어나지 않게

const q = new URLSearchParams(location.search)
const pick = (key, ids) => (ids.includes(q.get(key)) ? q.get(key) : CONFIRMED[key === 'mf' ? 'mfit' : 'mwidth'])
export const MFIT = pick('mf', ['F0', 'F1', 'F2', 'F3'])
export const MWIDTH = pick('mw', ['W1', 'W2', 'W3'])

const mobile = typeof window !== 'undefined' && innerWidth <= 767
const vw = mobile ? Math.min(innerWidth, MAX_FILL_W) : BASE_W

/* 폭 시안 html[data-mwidth] (?mw=) — 사용자 2026-09-11 "width 가 각 핸드폰당 최적화되어야 할 듯"
   W1 비례: 캔버스는 393 그대로, 기기 폭에 맞춰 통째로 확대·축소 (375 → 0.954 배, 글자까지 작아짐)
   W2 1:1 유동: 캔버스 폭 = 기기 폭, 배율 1. 좌우 여백 20 은 그대로 두고 카드·입력창이 늘고 줄어든다 (실제 앱과 같은 글자 크기)
   W3 1:1 + 393 상한: 작은 폰은 W2 처럼 유동, 393 보다 넓은 폰에서는 393 에서 멈추고 가운데 정렬
   폭 시안은 높이 유동(F-2) 위에서만 의미가 있어 F1/F3/F0 에서는 393 캔버스를 쓴다. */
let sw = BASE_W
if (mobile && MFIT === 'F2') sw = MWIDTH === 'W2' ? vw : MWIDTH === 'W3' ? Math.min(vw, BASE_W) : BASE_W
export const SCREEN_W = sw
export const FLUID = sw !== BASE_W   // 353px 처럼 393 캔버스를 전제로 찍힌 폭을 유동으로 바꿔야 하는가

// 캔버스 → 화면 배율. W3 는 넓은 폰에서 확대하지 않는다
export const MS = mobile && MFIT === 'F2' ? (MWIDTH === 'W3' ? Math.min(vw / sw, 1) : vw / sw) : 1

let h = BASE_H
if (mobile && MFIT === 'F2') h = Math.max(560, Math.round(innerHeight / MS))
export const SCREEN_H = h
