// 폰 화면 캔버스 크기 (2026-09-11). 기본은 Figma 기준 393×852.
// 모바일 맞춤 시안 F-2(폭 맞춤 + 화면 높이 유동)에서는 화면 높이 자체가 실제 뷰포트 높이가 된다 —
// 화면 코드(AgentChat 의 SCREEN_H 계산, CSS 의 --sh)가 모두 이 값을 써야 스크롤·시트·키패드 자리가 맞는다.
// 모듈 로드 시점에 한 번 정한다(파생 상수가 많아 나중에 바꿀 수 없음). 사파리 툴바가 접혀 뷰포트가 커지면
// 화면 아래에 배경색 여백이 생기는 정도로만 어긋난다.
import { CONFIRMED } from './variants.js'

export const PHONE_W = 393
export const BASE_H = 852
export const MAX_FILL_W = 430   // 폰보다 넓은 화면(≤767)에서도 무한정 늘어나지 않게

const q = new URLSearchParams(location.search)
export const MFIT = ['F0', 'F1', 'F2', 'F3'].includes(q.get('mf')) ? q.get('mf') : CONFIRMED.mfit

let h = BASE_H
if (MFIT === 'F2' && typeof window !== 'undefined' && innerWidth <= 767) {
  const ms = Math.min(innerWidth, MAX_FILL_W) / PHONE_W
  h = Math.max(560, Math.round(innerHeight / ms))
}
export const SCREEN_H = h
