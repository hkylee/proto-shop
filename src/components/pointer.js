// 클릭 포인트 시각화 (스텝 2 자동 시퀀스용). 스타일은 <html data-pointer="none|P1|P2|P3"> 로 결정.
//  none : 포인터 숨김, 대상의 press 효과만
//  P1   : 커서 + 리플 — 화살표 커서가 이동, 탭 시 링이 퍼짐
//  P2   : 터치 포인트 — 반투명 손가락 원이 이동, 탭 시 눌리며 링
//  P3   : 스포트라이트 — 화면이 어두워지고 대상만 밝게, "탭" 라벨, 탭 시 링
import { wait, restart, scrollTo } from '../lib/motion.js'
import { SCREEN_W } from '../lib/screen.js'

// 사용자 탭 모드 (html[data-tapmode="user"], 폰 도메인 기본 · 2026-09-10): 시나리오의 모든 탭 지점에서 멈춰 대상 위에 '탭' 안내를 띄우고
// 사용자가 그 자리를 실제로 탭해야 이어진다. 스텝 끝 대기(park)도 사용자가 탭하면 'ptr-park-tap' 이벤트 → 셸이 다음 스텝으로.
export const userTap = () => document.documentElement.dataset.tapmode === 'user'
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }))
// 스텝 끝 대기 자리를 사용자가 탭했으면 그 자리를 '장전'해 두고, 다음 스텝의 첫 tap 이 같은 자리면 다시 기다리지 않는다 (한 번 탭 = 한 번 진행)
let armed = null
const sameSpot = (a, b) => {
  if (!a || !b) return false
  if (a === b) return true
  if (a.tagName !== b.tagName || a.textContent.trim() !== b.textContent.trim()) return false
  const r = a.getBoundingClientRect(), q = b.getBoundingClientRect()
  return Math.abs(r.left - q.left) < 8 && Math.abs(r.top - q.top) < 8
}
// 대상이 스크롤 컨테이너 밖이면 안으로 끌어온다 (다음 스텝의 첫 탭 자리가 화면 밖에 있을 때)
const scrollParent = (el) => { let n = el.parentElement; while (n) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) return n; n = n.parentElement } return null }
async function revealInto(el, k) {
  const c = scrollParent(el); if (!c) return
  const r = el.getBoundingClientRect(), b = c.getBoundingClientRect()
  const top = (r.top - b.top) / k, bottom = (r.bottom - b.top) / k, h = b.height / k
  if (top >= 80 && bottom <= h - 90) return
  await scrollTo(c, c.scrollTop + ((top + bottom) / 2 - h / 2))
}

export default class Pointer {
  constructor(root, layer) {
    this.root = root
    this.layer = layer
    layer.className = 'ptr-layer'
    layer.innerHTML = `
      <div class="ptr-spot"></div>
      <div class="ptr-label">탭</div>
      <div class="ptr-ring"></div>
      <div class="ptr-dot">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M5 3l14 8-6.2 1.6L11 19z" fill="#fff" stroke="#060C1F" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>
      <button type="button" class="ptr-hit" aria-label="탭"></button>`
    this.label = layer.querySelector('.ptr-label')
    this.ring = layer.querySelector('.ptr-ring')
    this.hit = layer.querySelector('.ptr-hit')
    this.hit.addEventListener('click', (e) => { e.stopPropagation(); const r = this._resolve; this._resolve = null; r?.() })
    this.target = null
    this._resolve = null
    this._track = 0
  }
  // 사용자 탭 대기: 대상 위에 안내(맥동 테두리 + 라벨)를 두고 탭될 때까지. 레이아웃이 움직여도 200ms 마다 자리를 다시 잰다
  _startWait(el, onTap) {
    this._stopWait()
    this.layer.classList.add('wait'); this.hover()
    this._track = setInterval(() => { if (el.isConnected) this.setVars(this.rectOf(el)) }, 200)
    this._resolve = () => { this._stopWait(); onTap() }
    emit('ptr-wait')
  }
  _stopWait() {
    if (this._track) { clearInterval(this._track); this._track = 0 }
    this.layer.classList.remove('wait', 'park')
    this._resolve = null
    emit('ptr-idle')
  }
  waitTap(el) { return new Promise((r) => this._startWait(el, r)) }
  rectOf(el) {
    const r = el.getBoundingClientRect(), b = this.root.getBoundingClientRect(), k = b.width / SCREEN_W || 1
    return { x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k }
  }
  setVars(r) {
    const s = this.layer.style
    s.setProperty('--x', `${r.x + r.w / 2}px`); s.setProperty('--y', `${r.y + r.h / 2}px`)
    s.setProperty('--sx', `${r.x - 6}px`); s.setProperty('--sy', `${r.y - 6}px`)
    s.setProperty('--sw', `${r.w + 12}px`); s.setProperty('--sh', `${r.h + 12}px`)
    s.setProperty('--sr', `${Math.min(24, (r.h + 12) / 2)}px`)
  }
  show() { this.layer.classList.add('on') }
  hide() {
    this._stopWait()
    this.layer.classList.remove('on', 'hover', 'press')
    if (this.target) this.target.classList.remove('ptr-hovered')
    this.target = null
  }
  async moveTo(el, dur = 450, label = '탭') {
    if (this.target) this.target.classList.remove('ptr-hovered')
    this.target = el
    this.label.textContent = label
    this.layer.style.setProperty('--move', `${dur}ms`)
    this.setVars(this.rectOf(el))
    this.show()
    await wait(dur)
  }
  // 즉시 이동(트윈 프레임용) — 전환 없이 좌표만 쓴다
  setXY(x, y) {
    const s = this.layer.style
    s.setProperty('--move', '0ms'); s.setProperty('--x', `${x}px`); s.setProperty('--y', `${y}px`)
  }
  async moveXY(x, y, dur = 400) {
    this.layer.style.setProperty('--move', `${dur}ms`)
    this.layer.style.setProperty('--x', `${x}px`); this.layer.style.setProperty('--y', `${y}px`)
    this.show(); await wait(dur)
  }
  // 대상 위로 이동해 hover 상태로 대기 (다음 스텝의 탭 예고)
  park(el, dur = 500, label = '탭') {
    if (!el) return
    if (!userTap()) { this.moveTo(el, dur, label); this.hover(); emit('ptr-park'); return }   // 자동 재생 셸(폰 도메인)은 이 신호로 다음 스텝을 이어간다
    // 사용자 탭 모드: 대상을 화면 안으로 끌어온 뒤 그 자리에서 기다린다. 탭하면 장전 + 셸이 다음 스텝으로
    const b = this.root.getBoundingClientRect(), k = b.width / SCREEN_W || 1
    revealInto(el, k).then(() => {
      if (!el.isConnected) return
      this.moveTo(el, 0, label); this.hover()
      this._startWait(el, () => { armed = el; emit('ptr-park-tap') }); this.layer.classList.add('park')
      emit('ptr-wait')   // 뷰어에 '이 스텝 재생이 끝났다 — 탭 또는 → 으로 다음' 을 알린다 (2026-09-16)
    })
  }
  // 포인터 없이 스텝을 넘긴다 — 자동 재생 셸이 ptr-park 와 같은 신호로 받되 지연은 호출자가 정한다 (스텝 8 → 9, html[data-ctaup] 2026-09-16)
  handoff(delay = 0) { this.hide(); emit('ptr-park', { delay }) }
  hold() { this.layer.classList.add('press') }     // 누른 채 (드래그 시작)
  release() { this.layer.classList.remove('press') }
  hover() {
    this.layer.classList.add('hover')
    if (this.target) this.target.classList.add('ptr-hovered')
  }
  async press(el = this.target) {
    if (!el) return
    if (this.target && this.target !== el) this.target.classList.remove('ptr-hovered')
    this.target = el
    this.setVars(this.rectOf(el))
    el.classList.add('pressing')
    this.layer.classList.add('press')
    restart(this.ring, 'rip')
    await wait(180)
    el.classList.remove('pressing')
    this.layer.classList.remove('press', 'hover')
    el.classList.remove('ptr-hovered')
  }
  // 탭 제스처 = 이동 → 잠깐 멈춤 → 누름 (공통 규칙 §6). 시퀀스마다 세 줄씩 반복하던 것을 한 호출로
  async tap(el, { move = 450, pause = 160, label = '탭' } = {}) {
    await this.moveTo(el, move, label)
    if (userTap()) { if (armed && sameSpot(armed, el)) armed = null; else await this.waitTap(el) }   // 사용자 탭 모드: 직전 스텝 끝에서 이미 탭한 자리면 바로, 아니면 여기서 기다린다
    else if (pause) await wait(pause)
    await this.press(el)
  }
}
