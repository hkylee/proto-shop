// 공통 모션 프리미티브 — 화면(AgentChat · ProductDetail)과 포인터가 함께 쓴다.
export const wait = (ms) => new Promise((r) => setTimeout(r, ms))
// 재로드 복원 중(html[data-restored="1"], App 이 세움)에도 true — 브라우저가 탭을 정리한 뒤 다시 로드했을 때 스텝을 처음부터 재생하지 않고 멈춰 있던 최종 상태로 돌아가기 위해 (2026-09-10)
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.restored === '1'
// 레이아웃이 반영된 뒤(두 프레임) 실행 — display/grid 전환 직후 scrollTop 계산용
export const afterLayout = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))
// CSS 애니메이션 클래스를 다시 재생 (remove → reflow → add)
export const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls) }

/* 이징 */
export const clamp01 = (v) => Math.max(0, Math.min(1, v))
export const linear = (t) => t
export const inOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)          // cubic in-out
export const inOutQuart = (t) => (t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2)
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
export const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const cubicOut = (t) => 1 - Math.pow(1 - t, 3)

/* rAF 트윈 — frame(easedProgress, rawProgress) */
export function tween(dur, frame, ease = inOut) {
  return new Promise((res) => {
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      frame(ease(p), p)
      p < 1 ? requestAnimationFrame(tick) : res()
    }
    requestAnimationFrame(tick)
  })
}

/* 팬(자동 스크롤) — 거리 기준 일정 속도 (docs/interaction-rules.md §2). 프로필 = { speed px/ms, min, max, ease } */
const PAN_DEFAULT = { speed: 0.32, min: 600, max: 3200, ease: inOutSine }
const panDur = (v, dist) => Math.min(v.max, Math.max(v.min, dist / v.speed))
const clampScroll = (el, to) => Math.max(0, Math.min(to, el.scrollHeight - el.clientHeight))

// dur 을 주면 그 값 우선, 없으면 PAN_DEFAULT 속도로 거리에 맞춰 계산
export async function scrollTo(el, to, dur, ease = PAN_DEFAULT.ease, onFrame) {
  to = clampScroll(el, to)
  const from = el.scrollTop, dist = Math.abs(to - from)
  if (dist < 1) return
  await tween(dur ?? panDur(PAN_DEFAULT, dist), (e, p) => { el.scrollTop = from + (to - from) * e; onFrame?.(p) }, ease)
  el.scrollTop = to
}
// 속도 프로필로 팬 (거리를 내부에서 계산)
export const panTo = (el, to, profile, onFrame) =>
  scrollTo(el, to, panDur(profile, Math.abs(el.scrollTop - clampScroll(el, to))), profile.ease, onFrame)
