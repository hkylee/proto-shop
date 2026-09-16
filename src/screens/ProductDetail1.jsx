import { useEffect, useRef, useState } from 'react'
import Pointer, { userTap } from '../components/pointer.js'
import { IcoSparkleAi, IcoSparkle, IcoVoice, IcoBack } from '../components/Icons.jsx'
import { StatusBar, Keyboard, TYPE_MS } from './AgentShell.jsx'
import { PlanCard, UsageGraph, UserMessage, AiMessage, Card, BenefitBadges, Thinking } from './AgentChat.jsx'
import { AgentBackground, SearchAi } from './AgentShell.jsx'
import { IcoNewChat } from '../components/Icons.jsx'
import OrderConfirm from './OrderConfirm.jsx'
import { variant } from '../lib/variants.js'
import { wait, scrollTo, tween, inOut, inOutSine, inOutQuart, cubicOut, outExpo, reducedMotion } from '../lib/motion.js'
import './product2.css'
import './product1.css'
import { SCREEN_W, SCREEN_H } from '../lib/screen.js'

/* 1안 · Static 중심 + AI 일시 호출 — 상품 상세 (3안 v2 화면 구조 그대로, Figma T1mhl… 10547:16625)
   E-1 배지 + 팬: T+ 버튼이 입력창으로 모핑 → 질의 → 입력창 위 답변 스트립 → 페이지의 추천 항목에 [AI 추천] 배지 →
   스트립의 [이 항목으로 선택] 을 눌러야 props 가 selected 로 바뀐다 → selected 가 되는 순간 배지는 디졸브로 사라지고, 스트립·입력창이 닫히며 T+ 로 복귀.
   ── 2026-09-16 흐름 개편 (사용자): 색상 직접 → 용량은 모달 질의 → 수령·납부·사용자·가입 직접 → 요금제는 Agent 풀팝업 질의 → [나가기] 확인 팝업 → 상세 랜딩(선택값 유지) 끝 ──
   stage 'top'     : 진입 직후, 미선택
   stage 'color'   : 색상 섹션까지 내려가 그라파이트를 직접 탭
   stage 'storage' : 용량에서 T+ 호출 → 질의 → 답이 모달(html[data-askmodal]: Q1 스트립 / Q2 시트 추천 1장 / Q3 시트 용량 3개) → 512G 선택
   stage 'opts'    : 수령(택배) · 납부(24개월) · 사용자(본인) · 가입(기기변경) 직접 탭
   stage 'plan'    : 요금제에서 T+ 호출 → 긴 질의 → Agent 풀팝업(Figma ixGPs9 438:190278): 이용현황 → 그래프 → 추천 → 비교표 → 시트 "추천된 요금제를 선택하실래요?"
   stage 'exit'    : 우측 상단 [나가기] → 확인 팝업(exitpop X-3) → [돌아가기] → 풀팝업 하강 → 요금제 섹션에 AI PICK 선택된 채 랜딩('pd1-landed' → 2s 뒤 완료 토스트) → SIM 개통까지 내려가 멈춤, 선택 없음 (끝). 나가는 방식 html[data-exitflow]: F1 시트 [네] 뒤 나가기 / F2 시트 없이 나가기 한 번 / F3 [네] 자리에 확인이 이어짐
   (아래 'rest' · 'payout' 은 예전 흐름 코드 보존 — ORDER 에서 빠져 재생되지 않는다)
   stage 'payout'  : [주문하기] 탭 → 주문 정보 확인 화면(OrderConfirm · Figma 134:60488)이 오른쪽에서 슬라이드 인 → 아래로 팬 → 시나리오 종료
   stage 'payout'  : [주문하기] 탭 → 결제 화면(3안 스텝 16 과 같은 외부 결제 페이지)이 오른쪽에서 슬라이드 인 → 시나리오 종료
   T+ → 입력창 모핑 시안 html[data-tmorph]: T1 늘어나기 / T2 올라가서 펴지기 / T3 CTA 와 합쳐지기
   Ambient Layer (Figma ixGPs9 209:100824 · 2026-09-10, html[data-ambient]): 선택 영역에 1~2초 머무르고 선택이 완료되지 않으면 관련 AI 참고 정보가
   Bottom Group 으로 살짝 뜬다(질문 없이). 사용자가 직접 선택하면 사라지고 다음 맥락으로 갱신. [적용하기]/칩을 누르면 그 문장이 SearchAi 로 들어가고
   추천 카드(AiAgentBottomSheet)가 SearchAi 위로 올라와 스택된다 (90:132452 → 90:136843).
   전체 플로우(Figma 209:117730): 옵션 탐색(머무름 → 한 줄) → AI 호출(T+ → 줄 사라짐) → AI 질문(타이핑) → AI 응답(카드 스택) → 선택(그룹 복귀, 알약 갱신) → 다음 옵션 탐색.
   A1 Figma 기본(한 줄은 참고만, T+ → 타이핑 질의) / A2 [적용하기] 지름길(타이핑 없이 문장이 SearchAi 로, 카드 바로) / A3 떠 있는 칩(알약 자리, 칩 탭 → 카드) / off 기존 */

import { px, anchorSec, NAME, COLORS, STORAGE, DELIVERY, TERMS, USER, JOIN, SIM, GIFTS, COUPONS, TRADEIN, INSURANCE, SERVICES, CARD_NOTE, AI_TEXT, Logo, ComboRows } from './ProductDetail2.jsx'   // 3안과 같은 데이터·정적 조각 (한 곳에서만 고친다)
const KB_MS = 500          // 키패드 상승·하강 (--kb-ms)
const THINK_MS = 1000      // 스트립 생각 점
// 요금제 질의 (Figma 438:190278 두 번째 프레임 문장 그대로) — 이것만 Agent 풀팝업으로 넘어간다
const PLAN_Q = '요금제를 변경하고 싶어. 어떤 요금제가 적합한지 추천해주고 보기 쉽게 비교표로 답변해줘'
const PLAN_REC = '5GX 프라임 플러스'
const AG_MS = 500           // 풀팝업 상승·하강 (.pa transition)

// ── 세 번의 AI 질의 (E-1): 섹션 · 발화 · 추천 항목 · 이유 ──
const ASKS = {
  color:   { sec: '색상',   q: '제일 인기 많은 색이 뭐야?',                    key: 'color',   rec: 2, opt: '그라파이트',        why: 'Z 폴드8 구매 고객 중 41%가 골랐고, 지금 바로 출고돼요' },
  storage: { sec: '용량',   q: '사진 많이 찍는데 용량은 뭐로 하는 게 좋을까?',     key: 'storage', rec: 1, opt: '512G',              why: '지금 폰에 사진 38,000장, 256G의 74%를 쓰고 있어요' },
  plan:    { sec: '요금제', q: '이용 현황에 맞춰서 적합한 요금제 추천해줘',      key: 'plan',    rec: 0, opt: '5GX 프라임 플러스', why: '6개월 평균 22.4GB, 최근 3개월은 20GB를 넘겼어요', josa: '를' },
  ins:     { sec: '보험',   q: '보험은 뭐가 제일 인기 많아?',                    key: 'ins',     rec: 0, opt: 'T ALL케어+ 5',      why: 'Z 폴드8 구매 고객 10명 중 7명이 골랐고, 폴더블은 파손 보상이 특히 유리해요', josa: '를' },
}
// ── Ambient Layer 문구 (Figma 209:100824 의 세 케이스를 페르소나·추천값에 맞춰 치환. Figma 더미: 크림 / 256GB / 0 청년 107·선택약정 12개월) ──
const AMBIENT = {
  color:    `${NAME}님 또래는 그라파이트 색상을 더 선호해요`,
  storage:  '또래 분들은 512GB를 가장 많이 사용하고 있어요',
  plan:     `${NAME}님 데이터 사용량이면 5GX 프라임 플러스 · 선택약정 24개월이 총 할인이 가장 컸어요`,
  delivery: `${NAME}님 주소는 바로도착으로 오늘 받을 수 있는 지역이에요`,   // 직접 선택 → Props 가 사라지는 케이스 시연용
}
const DWELL_MS = 1500      // '머무름' 판정 (요건 1~2초)
// 단계별 최종 선택 상태 (직접 고른 것 + AI 로 고른 것)
// 지금 이용중인 요금제 (AgentChat 의 '이용중 요금제' 카드와 같은 값 — Figma 는 0 청년 99 더미)
const CUR_PLAN = { badge: '지금 이용중인 요금제', name: '0 청년 69', price: '62,800원', caps: ['데이터 20GB', '통화 무제한', '문자 무제한'], more: '' }
/* 질의 전 AI PICK 카드 (html[data-planmorph]="on") — Figma 302:104587 은 질의 전 0 청년 99 → 질의 뒤 0 청년 107 로 바뀐다.
   우리 기준으로는 지금 쓰는 요금제가 들어가 있다가 추천 요금제로 교체된다. 할인 금액은 62,800원 × 25% × 기간 */
const PRE_PICK = { badge: 'AI PICK', name: '0 청년 69', price: '62,800원', caps: ['데이터 20GB', '통화 무제한', '문자 무제한'], more: '', support: '400,000원', m12: '188,400원', m24: '376,800원' }
const NONE = { color: -1, storage: -1, delivery: -1, term: -1, user: -1, join: -1, plan: -1, sim: -1, gift: -1, coupon: -1, tradein: -1, ins: -1, svc: -1, card: -1, extra: -1 }
// 스텝 5 나머지 옵션: [섹션 키, 선택자, 값] 순서대로 쭉 내려가며 탭
const REST_A = [['sim', '.radio-card:nth-child(1)', 0], ['gift', '.gift:nth-child(1)', 0], ['coupon', '.radio-card:nth-child(3)', 2], ['tradein', '.radio-card:nth-child(1)', 0]]   // 보험 앞: 직접
const REST_B = [['svc', '.radio-card:nth-child(4)', 3], ['card', '.radio-card.none', 0], ['extra', '.radio-card.none', 0]]   // 보험(AI 질의) 뒤: 직접
const REST_SEL = { ...Object.fromEntries([...REST_A, ...REST_B].map(([k, , v]) => [k, v])), ins: ASKS.ins.rec }   // 한 곳(REST_A/B · ASKS)에서 파생
const FINAL = {
  top: NONE,
  color: { ...NONE, color: 2 },
  storage: { ...NONE, color: 2, storage: 1 },
  opts: { ...NONE, color: 2, storage: 1, delivery: 0, term: 1, user: 0, join: 2 },
}
FINAL.plan = FINAL.opts                     // 풀팝업이 열려 있는 동안 상세의 요금제는 아직 미선택
FINAL.exit = { ...FINAL.opts, plan: 0 }     // 돌아오면 AI PICK 카드가 selected
FINAL.rest = { ...FINAL.exit, ...REST_SEL }
FINAL.payout = FINAL.rest
const ORDER = ['top', 'color', 'storage', 'opts', 'plan', 'exit']

// [AI 추천] 배지 (.pd1 .ai-badge: 파란 칩 + 흰 스파클). 자기 자신을 렌더하던 재귀(무한 렌더로 1안 전체가 멈춤, 2026-09-08) 수정
const AiBadge = () => <span className="ai-badge"><i className="sp"><IcoSparkleAi size={12} /></i>AI 추천</span>
function RadioCard({ t, d, r, selected, hint, innerRef }) {
  return (
    <div className={`radio-card opt ${selected ? 'sel' : ''} ${hint ? 'hint ai-rec' : ''}`} ref={innerRef}>
      <AiBadge />
      <div className="txt"><div className="t">{t}</div>{d && <div className="d">{d}</div>}</div>
      {r && <div className="r">{r}</div>}
    </div>
  )
}
function Section({ title, link, desc, children, refEl, className = '' }) {
  return (
    <section className={`pd2-sec ${className}`} ref={refEl}>
      <div className="head"><h2>{title}</h2>{link && <span className="link">{link}</span>}</div>
      {desc && <p className="sdesc">{desc}</p>}
      {children}
    </section>
  )
}
export default function ProductDetail1({ stage = 'top' }) {
  const rootRef = useRef(null), scrollRef = useRef(null), ptrLayerRef = useRef(null), ptrRef = useRef(null)
  const dockRef = useRef(null), stripRef = useRef(null), okRef = useRef(null), scrollIndRef = useRef(null)
  const secs = { color: useRef(null), storage: useRef(null), delivery: useRef(null), term: useRef(null), acc: useRef(null), user: useRef(null), join: useRef(null), plan: useRef(null), sim: useRef(null), gift: useRef(null), coupon: useRef(null), tradein: useRef(null), ins: useRef(null), svc: useRef(null), card: useRef(null), extra: useRef(null) }
  const ctaRef = useRef(null)
  const [sel, setSel] = useState(() => FINAL[stage] || NONE)
  // AI 호출 상태: dock = idle | open(키패드·타이핑) | sent(스트립) | closing ; hint = 배지가 붙은 섹션 키 ; ask = 현재 질의
  const [dock, setDock] = useState('idle')
  const [typed, setTyped] = useState('')
  const [ask, setAsk] = useState(null)
  const [answered, setAnswered] = useState(false)   // 스트립: 생각 점 → 답
  const [hint, setHint] = useState(null)            // 배지 + 나머지 물러남 (질의 중)
  const [amb, setAmb] = useState(null)              // Ambient Layer: 머무르는 섹션 키 (문구 = AMBIENT[amb])
  const ambRef = useRef(null), applyRef = useRef(null)
  const [payReady, setPayReady] = useState(() => stage === 'rest' || stage === 'payout')   // 모든 옵션 선택 → CTA [주문하기]
  const [payOn, setPayOn] = useState(false)          // 결제 화면 슬라이드 인
  const prevRef = useRef(stage), seqRef = useRef(0)
  // Agent 풀팝업(요금제 질의): agent = off | in | out ; aph = 드러난 턴 수(0~5) ; asheet = 추천 시트 ; apick = 시트에서 [네] 를 눌러 선택됨 ; xpop = [나가기] 확인 팝업
  const [agent, setAgent] = useState('off')
  const [aph, setAph] = useState(0)
  const [asheet, setAsheet] = useState(false)
  const [apick, setApick] = useState(false)
  const [xpop, setXpop] = useState(false)
  const agScrollRef = useRef(null), exitBtnRef = useRef(null), yesRef = useRef(null), backRef = useRef(null)
  // SearchAi 1줄 → 2줄(SearchAiMulti, Figma 472:144639) 전환: multi = 두 줄 레이아웃 · wrap = 본문 줄바꿈 허용 · fade = M3 크로스페이드 중
  const [multi, setMulti] = useState(false), [wrap, setWrap] = useState(false), [fade, setFade] = useState(false)
  const [lift, setLift] = useState(false)   // P3: 보내기 뒤 입력창의 문장이 위로 떠오른다
  const [tout, setTout] = useState(false)   // 생각 점(…)이 사라지는 중

  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])
  useEffect(() => {
    const onTap = async () => { const btn = ctaRef.current; if (!btn) return; await ptrRef.current?.press(btn); ptrRef.current?.hide() }
    window.addEventListener('pay-tap', onTap)
    return () => window.removeEventListener('pay-tap', onTap)
  }, [])

  useEffect(() => {
    const el = scrollRef.current, ptr = ptrRef.current
    if (!el) return
    const seq = ++seqRef.current, alive = () => seq === seqRef.current
    let camEl = null, camRaf = 0   // N3 연속 추적 카메라 (cancel 이 먼저 불려도 안전하게 effect 맨 위에)
    const cancel = () => { seqRef.current++; if (camRaf) cancelAnimationFrame(camRaf); camRaf = 0; camEl = null }
    const prev = prevRef.current; prevRef.current = stage
    const ambV = variant('ambient'), ambientOn = ambV && ambV !== 'off'
    const pick = (k, v) => setSel((s) => ({ ...s, [k]: v }))
    // 사용자 탭 모드: 스텝이 끝나면 '다음 스텝이 처음 탭할 자리' 에 대기 — 사용자가 그 자리를 탭해 넘어간다 (2026-09-10)
    const XF = variant('exitflow') || 'F1'
    const NEXT_TAP = { top: () => secs.color.current?.querySelector('.swatch:nth-child(3)'), color: () => dockRef.current, storage: () => secs.delivery.current?.querySelector('.radio-card:nth-child(1)'), opts: () => dockRef.current, plan: () => (XF === 'F3' ? yesRef.current : exitBtnRef.current) }
    const NEXT_LABEL = { color: 'T 호출', opts: 'T 호출', plan: XF === 'F3' ? '네' : '나가기' }
    const parkNext = (delay = 0) => { if (!userTap() || !NEXT_TAP[stage]) return; setTimeout(() => { if (alive()) ptr?.park(NEXT_TAP[stage](), 400, NEXT_LABEL[stage] || '탭') }, delay) }
    const settle = () => {   // 즉시 최종 상태 (건너뛰기 · 뒤로 가기 · reduced motion)
      setSel(FINAL[stage]); setDock('idle'); setTyped(''); setAsk(null); setAnswered(false); setHint(null); setAmb(null); setXpop(false); setMulti(false); setWrap(false); setFade(false); setLift(false); setTout(false)
      setPayReady(stage === 'rest' || stage === 'payout'); setPayOn(stage === 'payout'); ptr?.hide()
      // 요금제 스텝의 최종 상태 = 풀팝업이 열려 답이 모두 나온 뒤 (F1: [네] 눌러 선택 완료 · F2: 안내만 · F3: 시트가 떠 있음)
      if (stage === 'plan') { setAgent('in'); setAph(11); setAsheet(XF === 'F3'); setApick(XF === 'F1'); const toEnd = () => { const a = agScrollRef.current; if (a) a.scrollTop = a.scrollHeight }; requestAnimationFrame(toEnd); setTimeout(toEnd, 350) }
      else { setAgent('off'); setAph(0); setAsheet(false); setApick(false) }
      if (stage === 'top') scrollTo(el, 0, 500, inOut)
      else if (stage === 'rest' || stage === 'payout') el.scrollTop = el.scrollHeight
      else el.scrollTop = anchorSec(secs[stage === 'opts' ? 'join' : stage === 'exit' ? 'sim' : stage].current)
      if (stage === 'exit') setTimeout(() => window.dispatchEvent(new CustomEvent('pd1-landed')), 80)   // 직접 로드: 부모(App) effect 가 리스너를 단 뒤에 신호
    }
    const forward = ORDER.indexOf(prev) === ORDER.indexOf(stage) - 1
    if (!forward || reducedMotion()) { settle(); parkNext(650); return cancel }

    // ── 사람이 스크롤하는 느낌 (3안 확정 규칙 재사용): 손가락(터치 포인트)이 화면을 잡고 끌면 콘텐츠가 1:1 로 따라오고, 놓으면 관성.
    //    아래로 = 플릭(45% 끌고 놓은 뒤 관성으로 길게 감속, 거리가 길면 2~3번) · 위로 = H-3 천천히 끌어 살피기(1:1, 고무줄 안착) · G-2 인디케이터 함께
    const showInd = () => {
      const ind = scrollIndRef.current, thumb = ind?.firstElementChild
      const track = ind ? ind.clientHeight : 0, range = el.scrollHeight - el.clientHeight
      const h = Math.max(40, track * el.clientHeight / el.scrollHeight)
      if (thumb) thumb.style.height = `${h}px`
      const place = () => { if (thumb) thumb.style.transform = `translateY(${(track - h) * el.scrollTop / range}px)` }
      place(); ind?.classList.add('on')
      return { place, hide: () => ind?.classList.remove('on') }
    }
    const clampTo = (to) => Math.max(0, Math.min(to, el.scrollHeight - el.clientHeight))
    const drag = async ({ to, y0, y1, dur, ease, coast = 0, coastDur = 0, coastEase = outExpo, place }) => {
      const r = ptr.rectOf(el), cx = r.x + r.w * .55
      await ptr.moveXY(cx, r.y + r.h * y0, 260); if (!alive()) return
      ptr.hold(); await wait(70)
      await Promise.all([
        scrollTo(el, to + coast, dur, ease, place),
        tween(dur, (e) => ptr.setXY(cx, r.y + r.h * (y0 + (y1 - y0) * e)), ease),
      ]); if (!alive()) return
      ptr.release()
      if (coast) { await scrollTo(el, to, coastDur, coastEase, place); if (!alive()) return }
    }
    const swipeTo = async (target) => {
      target = clampTo(target)
      const total = target - el.scrollTop
      if (Math.abs(total) < 2) return alive()
      if (!ptr || reducedMotion()) { await scrollTo(el, target); return alive() }
      const ind = showInd()
      if (total < 0) {
        // 위로 (H-3): 손가락에 1:1 로 붙어 1.1~1.6s 느리게 올라오다 놓으면 14px 넘겼다 되돌아오는 고무줄 안착
        const dur = Math.min(1600, Math.max(1100, -total / 0.45))
        await drag({ to: target, y0: .28, y1: .82, dur, ease: inOutSine, coast: -14, coastDur: 380, coastEase: cubicOut, place: ind.place })
      } else {
        // 아래로 — 시안 html[data-pdscroll] (사용자 2026-09-08 "내리는 액션이 어색")
        const D = variant('pdscroll')
        if (D === 'D2') {
          // D-2 천천히 끌기: H-3(위로)의 대칭. 손가락이 화면을 잡고 위로 1:1 로 천천히 끌어 내려온다(420px 씩, 필요하면 나눠서), 마지막에 14px 고무줄 안착. 관성 없음
          let left = total
          while (left > 1 && alive()) {
            const d = Math.min(left, 420), last = d >= left - 1
            const dur = Math.min(1500, Math.max(900, d / 0.5))
            await drag({ to: el.scrollTop + d, y0: .8, y1: .8 - d / (el.clientHeight * .95), dur, ease: inOutSine, coast: last ? 14 : 0, coastDur: 380, coastEase: cubicOut, place: ind.place })
            left -= d; if (left > 1) await wait(160)
          }
        } else if (D === 'D3') {
          // D-3 손가락 없이 팬: 3안 C-3 곡선(휙 출발 긴 안착, 600px/s quart) 으로 페이지만 내려간다. 인디케이터만 보임
          const dur = Math.min(1500, Math.max(550, total / 0.6))
          await scrollTo(el, target, dur, inOutQuart, ind.place)
        } else {
          // D-1 엄지 튕기기: 짧은 플릭을 여러 번. 한 번에 ~380px — 손가락이 0.28s 에 150px 만 빠르게 올라가고 콘텐츠는 관성으로 0.7s 미끄러진다. 사람이 훑어 내리는 리듬
          const STEP = 380
          const n = Math.max(1, Math.round(total / STEP))
          for (let i = 0; i < n && alive(); i++) {
            const part = i === n - 1 ? target : el.scrollTop + total / n
            const d = part - el.scrollTop, dragPart = Math.min(d * .4, 150)
            await drag({ to: el.scrollTop + dragPart, y0: .72, y1: .72 - 150 / el.clientHeight, dur: 280, ease: cubicOut, place: ind.place }); if (!alive()) break
            await scrollTo(el, part, 700, outExpo, ind.place); if (!alive()) break
            if (i < n - 1) await wait(120)
          }
        }
      }
      await wait(200); ind.hide()
      return alive()
    }
    const tapIn = async (secRef, selector, key, val, opts, { ambient = true } = {}) => {
      if (!await swipeTo(anchorSec(secRef.current))) return false
      // Ambient 시연: 이 섹션에 머무르면(1.5s) 참고 문구가 떠 있다가, 사용자가 직접 고르는 순간 사라진다 (Props 갱신 규칙)
      if (ambient && ambientOn && AMBIENT[key]) { await wait(DWELL_MS); if (!alive()) return false; setAmb(key); await wait(1400); if (!alive()) return false }
      await ptr?.tap(secRef.current.querySelector(selector), opts); if (!alive()) return false
      pick(key, val); setAmb(null); await wait(380); return alive()
    }
    // 대상이 스트립에 가리면 그만큼만 위로 (E 고도화 공통 규칙). 섹션 상단 정렬을 깨지 않는 범위에서
    const panForStrip = async (targetEl) => {
      const root = rootRef.current.getBoundingClientRect(), k = root.width / SCREEN_W || 1
      const t = targetEl.getBoundingClientRect(), s = stripRef.current.getBoundingClientRect()
      const over = (t.bottom - (s.top - 16)) / k
      if (over > 4) { await scrollTo(el, el.scrollTop + over, 500, inOut) }
    }
    // ── 한 번의 AI 질의: T+ 탭 → 모핑·키패드 → 타이핑 → 전송 → 스트립(생각 → 답) + 배지 → [이 항목으로 선택] 탭 → selected → 닫힘 ──
    const askAI = async (a, targetSel) => {
      const secEl = secs[a.key].current
      if (!await swipeTo(anchorSec(secEl))) return false
      await wait(300); if (!alive()) return false
      // ── Ambient: 섹션에 머무르면(1.5s, 선택 미완료) 참고 문장이 Bottom Group 으로 살짝 뜬다 (Figma 209:100824) ──
      const ambient = ambientOn && AMBIENT[a.key]
      if (ambient) { await wait(DWELL_MS); if (!alive()) return false; setAmb(a.key); await wait(1600); if (!alive()) return false }
      if (ambient && ambV !== 'A1') {
        // A2/A3 지름길: 포인터가 [적용하기](A2) 또는 칩(A3)을 탭 → 문장이 SearchAi 로 들어가고(키패드 없음) 카드가 그 위로 올라와 스택
        const tapEl = (ambV === 'A3' ? ambRef.current : applyRef.current) || ambRef.current
        await ptr?.tap(tapEl, { move: 480, pause: 140, label: ambV === 'A3' ? '추천 보기' : '적용하기' }); if (!alive()) return false
        ptr?.hide()
        setAsk({ ...a, q: AMBIENT[a.key], fromAmb: true }); setTyped(AMBIENT[a.key])
        setDock('sent'); setAnswered(false)
        await wait(120); if (!alive()) return false
        setAmb(null)   // 문장은 SearchAi 로 옮겨 갔다 — 그룹의 줄/칩은 비워진다
        await wait(KB_MS); if (!alive()) return false
      } else {
      // A1(Figma 기본)·off: T+ 탭 → 키패드·타이핑 질의. Ambient 한 줄은 참고 정보였으므로 T+ 를 누르는 순간 그룹과 함께 사라진다 (209:106716)
      await ptr?.tap(dockRef.current, { move: 500, pause: 120, label: 'T 호출' }); if (!alive()) return false
      ptr?.hide()
      setAsk(a); setDock('open'); setAmb(null)
      await wait(KB_MS + 350); if (!alive()) return false
      // 타이핑
      // 한 글자씩은 DOM 에 직접 (setState 로 페이지 전체를 글자마다 다시 그리지 않도록) → 끝나면 상태에 반영
      const tq = dockRef.current.querySelector('.tq'), fieldEl = dockRef.current.querySelector('.field')
      fieldEl.classList.add('filled')
      for (let i = 1; i <= a.q.length; i++) { tq.textContent = a.q.slice(0, i); await wait(TYPE_MS / a.q.length); if (!alive()) return false }
      setTyped(a.q)
      await wait(450); if (!alive()) return false
      // 전송: 키패드 하강, 스트립(생각 점)
      setDock('sent'); setAnswered(false)
      await wait(KB_MS + 100); if (!alive()) return false
      }
      const target = secEl.querySelector(targetSel)
      await panForStrip(target); if (!alive()) return false
      await wait(Math.max(0, THINK_MS - 200)); if (!alive()) return false
      setAnswered(true); setHint(a.key)
      await wait(1500); if (!alive()) return false
      await ptr?.tap(okRef.current, { move: 480, pause: 140 }); if (!alive()) return false
      // 선택: selected 로 바뀌는 순간 [AI 추천] 배지는 디졸브로 사라지고 나머지 항목이 돌아온다 (사용자 2026-09-08)
      pick(a.key, a.rec); setHint(null)
      await wait(500); if (!alive()) return false
      // 닫힘: 스트립 → 입력창이 T+ 로 복귀
      setDock('closing'); ptr?.hide()
      await wait(450); if (!alive()) return false
      setDock('idle'); setTyped(''); setAnswered(false); setAsk(null)
      return alive()
    }

    // ── 요금제 질의: T+ → 타이핑 → 전송과 함께 Agent 풀팝업이 올라온다 → 턴이 차례로 드러나며 아래로 팬 → 추천 시트 ──
    /* 풀팝업 안에서 새 요소를 따라가는 리듬 = 시안 1 의 follow 규칙 (html[data-agentfollow], 사용자 2026-09-16 "슈우웅 올라온다 → 시안 1 처럼")
       예전: 매번 맨 아래(꼬리 200px 포함)까지 quart 로 팬 → 필요 이상으로 크게 밀려 올라갔다.
       공통: 목표는 '새 요소의 아래가 SearchAi 위 30px' (시안 1 anchorBottom), 위로는 가지 않는다
       N1 요소마다 팬 (시안 1 F-1 확정 규칙 그대로: 거리 기반 320px/s · 최소 0.6s · 사인)
       N2 턴 끝에 한 번: 요소들은 제자리에서 나타나고 카드까지 들어온 뒤 한 번만 팬
       N3 연속 추적: 카메라가 마지막 요소 아래를 매 프레임 10% 씩 따라간다 (시안 1 F-3) */
    const PA_SEARCH_TOP = SCREEN_H - 24 - 52, PA_GAP = 30
    const agLast = () => { const a = agScrollRef.current; return a ? [...a.children].filter((c) => !c.classList.contains('pa-tail')).pop() : null }
    const agAnchor = (el) => el.offsetTop + el.offsetHeight - (PA_SEARCH_TOP - PA_GAP)
    const camStop = () => { if (camRaf) cancelAnimationFrame(camRaf); camRaf = 0; camEl = null }
    const camLoop = () => { const a = agScrollRef.current; if (!camEl || !a) return; const goal = Math.max(a.scrollTop, Math.min(agAnchor(camEl), a.scrollHeight - a.clientHeight)); const d = goal - a.scrollTop; if (Math.abs(d) > .5) a.scrollTop += d * 0.10; camRaf = requestAnimationFrame(camLoop) }
    const agPan = async (_dur, end = false) => {
      const a = agScrollRef.current; if (!a) return alive()
      await wait(40); if (!alive()) return false
      const AF = variant('agentfollow') || 'N1', el = agLast()
      if (!el) return alive()
      if (AF === 'N3') { camEl = el; if (!camRaf) camRaf = requestAnimationFrame(camLoop); if (end) { await wait(700); camStop() } return alive() }
      if (AF === 'N2' && !end) return alive()
      await scrollTo(a, Math.max(a.scrollTop, agAnchor(el))); return alive()
    }
    const askPlan = async () => {
      const secEl = secs.plan.current
      if (!await swipeTo(anchorSec(secEl))) return false
      await wait(400); if (!alive()) return false
      await ptr?.tap(dockRef.current, { move: 500, pause: 120, label: 'T 호출' }); if (!alive()) return false
      ptr?.hide()
      setAsk({ ...ASKS.plan, q: PLAN_Q }); setDock('open'); setAmb(null)
      // A2(입력창이 화면이 된다) 출발 사각형 — 두 줄 입력창(SearchAiMulti 110) 자리: left 20 · width 353 · bottom 319(키패드 위). 전환 전에 미리 심어 두어야 clip-path 가 거기서 출발한다
      rootRef.current.style.setProperty('--pa-clip', `inset(${SCREEN_H - 319 - 110}px 20px 319px 20px round 28px)`)
      await wait(KB_MS + 350); if (!alive()) return false
      const tq = dockRef.current.querySelector('.tq'), fieldEl = dockRef.current.querySelector('.field')
      fieldEl.classList.add('filled')
      const T = TYPE_MS * 1.8   // 긴 문장
      // 한 줄을 넘치는 순간 SearchAi → SearchAiMulti (html[data-sinput]): M1 제자리에서 자라며 줄바꿈 / M2 두 박자(아이콘 줄이 먼저 내려가고 → 줄바꿈) / M3 넘치는 순간 크로스페이드
      const MV = variant('sinput') || 'M1'
      let grown = false
      const grow = async () => {
        grown = true
        if (MV === 'M3') { setFade(true); await wait(150); if (!alive()) return; setMulti(true); setWrap(true); setFade(false); return }
        setMulti(true)
        if (MV === 'M2') { await wait(380); if (!alive()) return }
        setWrap(true)
      }
      for (let i = 1; i <= PLAN_Q.length; i++) {
        tq.textContent = PLAN_Q.slice(0, i)
        if (!grown && fieldEl.scrollWidth > fieldEl.clientWidth + 1) { await grow(); if (!alive()) return false }
        await wait(T / PLAN_Q.length); if (!alive()) return false
      }
      setTyped(PLAN_Q)
      await wait(450); if (!alive()) return false
      // [↑ 보내기] 를 눌러 전송 — 그 다음 전환의 호흡 (html[data-agentpace], 사용자 2026-09-16 "속도가 너무 빠르고 전환감이 빨라")
      //   P1 숨 고르기: 누른 뒤 0.5s 멈추고 → 1.0s 디졸브
      //   P2 두 단계: 먼저 키패드가 내려가고 입력창만 남아 0.7s → 그 다음 상세가 흐려지며 1.0s 디졸브
      //   P3 떠오르기: 누르는 순간 입력창의 문장이 위로 떠오르고(0.8s) 그 사이 1.2s 디졸브가 이어진다
      await ptr?.tap(dockRef.current.querySelector('.send'), { move: 320, pause: 120, label: '보내기' }); if (!alive()) return false
      ptr?.hide()
      const GP = variant('agentpace') || 'P1'
      if (GP === 'P1') { await wait(500); if (!alive()) return false }
      if (GP === 'P2') { setDock('hold'); await wait(700); if (!alive()) return false }
      if (GP === 'P3') { setLift(true); await wait(300); if (!alive()) return false }
      // 풀팝업 등장 (html[data-agentin] = A-1 블러 디졸브 확정; A2 입력창이 화면으로 / A3 위에서 스며듦 코드 보존)
      const AI = variant('agentin') || 'A1'
      const DIS = GP === 'P3' ? 1200 : 1000
      // 시안 1 의 턴 리듬(Figma 483:145930): 말풍선 → 오프닝 타이틀 → (타이틀이 접히며) 안내 문장 → 카드 하나씩 → 추천 → 비교표. 한 번에 한 조각
      // 입력창은 T+ 로 되감지 않는다 — 디졸브 동안 그 모양 그대로 흐려지고, Agent 화면이 다 덮은 뒤 조용히 초기화 (사용자 2026-09-16 "몰핑되는 게 아니라 바로 agent 로 랜딩")
      setAgent('in'); setAph(1)                                      // 1 질문 말풍선
      await wait(AI === 'A1' ? DIS + 50 : AG_MS); if (!alive()) return false
      setDock('idle'); setTyped(''); setAsk(null); setMulti(false); setWrap(false); setLift(false)
      await wait(350); if (!alive()) return false
      setAph(2)                                                      // 2 "최근 6개월간 이용현황을 먼저 살펴볼게요 · 나의 요금제 확인"
      await wait(1600); if (!alive()) return false
      // 생각 점(…) = 시안 1-1·1-2 의 think(): 텍스트 자리에 0.75s 보이다 0.16s 에 사라지고 그 자리에 문장 (사용자 2026-09-16 "로딩될 때 … 뜨는 거")
      const think = async (n) => { setAph(n); await wait(750); if (!alive()) return false; setTout(true); await wait(160); if (!alive()) return false; setTout(false); setAph(n + 1); return alive() }
      if (!await think(3)) return false                              // 3 타이틀이 접히고 … → 4 이용현황 안내 문장
      await wait(1000); if (!alive()) return false
      setAph(5); if (!await agPan(600)) return false                 // 5 이용중 요금제 카드
      await wait(900); if (!alive()) return false
      setAph(6); if (!await agPan(700, true)) return false           // 6 6개월 그래프 (턴 끝)
      await wait(1200); if (!alive()) return false
      if (!await think(7)) return false                              // 7 … → 8 추천 문장
      if (!await agPan(500)) return false
      await wait(900); if (!alive()) return false
      setAph(9); if (!await agPan(600, true)) return false           // 9 추천 요금제 카드 (턴 끝)
      await wait(1000); if (!alive()) return false
      setAph(10); if (!await agPan(700, true)) return false          // 10 현재 요금제와 비교 (턴 끝)
      await wait(1400); if (!alive()) return false
      if (XF === 'F2') { setAph(11); await agPan(500, true); return alive() }   // 시트 없이 — [나가기] 한 번으로 정리
      setAsheet(true)                                          // "추천된 요금제를 선택하실래요?"
      await wait(900); if (!alive()) return false
      if (XF === 'F3') return alive()                          // [네] 위에서 대기 — 다음 스텝에서 확인 팝업이 이어진다
      await ptr?.tap(yesRef.current, { move: 420, pause: 140, label: '네' }); if (!alive()) return false
      ptr?.hide(); setAsheet(false); setApick(true); setAph(11)
      await wait(200); if (!alive()) return false
      await agPan(600, true); return alive()
    }
    // ── [나가기]: 확인 팝업(X-3) → [돌아가기] → 풀팝업 하강 → 요금제 섹션, AI PICK 카드 selected ──
    const leaveAgent = async () => {
      const popOn = variant('exitpop') !== 'off'
      if (XF === 'F3') {
        await ptr?.tap(yesRef.current, { move: 420, pause: 140, label: '네' }); if (!alive()) return false
        setAsheet(false); setApick(true)
        await wait(popOn ? 350 : 700); if (!alive()) return false
        if (popOn) setXpop(true)
      } else {
        await ptr?.tap(exitBtnRef.current, { move: 480, pause: 140, label: '나가기' }); if (!alive()) return false
        if (popOn) setXpop(true)
      }
      if (popOn) {
        await wait(1500); if (!alive()) return false
        await ptr?.tap(backRef.current, { move: 420, pause: 140, label: '돌아가기' }); if (!alive()) return false
        setXpop(false)
      }
      ptr?.hide()
      pick('plan', 0)                                          // 상세의 AI PICK 카드가 selected 로 (팝업이 내려가며 드러난다)
      await wait(120); if (!alive()) return false
      setAgent('out')
      await wait(AG_MS + 100); if (!alive()) return false
      setAgent('off'); setAph(0); setApick(false)
      // 랜딩 신호 (App: 2초 뒤 완료 토스트) → 잠시 숨 고르고 다음 옵션인 SIM 개통까지 내려가 멈춘다. 선택은 하지 않는다 (사용자 2026-09-16)
      window.dispatchEvent(new CustomEvent('pd1-landed'))
      await wait(500); if (!alive()) return false
      await swipeTo(anchorSec(secs.sim.current))
      return alive()
    }

    ;(async () => {
      await wait(400); if (!alive()) return
      // 2: 색상은 직접 (사용자 2026-09-16)
      // 색상은 Ambient 한 줄을 기다리지 않고 내려가서 바로 탭 (사용자 2026-09-16)
      if (stage === 'color') { if (await tapIn(secs.color, '.swatch:nth-child(3)', 'color', 2, undefined, { ambient: false })) parkNext(); return }
      // 3: 용량은 T 에게 짧게 묻고 모달에서 고른다
      if (stage === 'storage') { if (await askAI(ASKS.storage, '.radio-card:nth-child(2)')) parkNext(); return }
      // 4: 수령 · 납부 · 사용자 · 가입 직접
      if (stage === 'opts') {
        // 직접 고르는 구간은 Ambient 한 줄을 기다리지 않는다 (사용자 2026-09-16 "step 4에서도 ai ambient Layer 안 기다리고 바로")
        const NA = { ambient: false }
        if (!await tapIn(secs.delivery, '.radio-card:nth-child(1)', 'delivery', 0, undefined, NA)) return
        if (!await tapIn(secs.term, '.term:nth-child(2)', 'term', 1, undefined, NA)) return
        if (!await tapIn(secs.user, '.radio-card:nth-child(1)', 'user', 0, { move: 300, pause: 80 }, NA)) return
        if (!await tapIn(secs.join, '.radio-card:nth-child(3)', 'join', 2, { move: 300, pause: 80 }, NA)) return
        parkNext(); return
      }
      // 5: 요금제 — Agent 풀팝업 (Figma 438:190278)
      if (stage === 'plan') { if (await askPlan()) parkNext(); return }
      // 6: [나가기] → 확인 팝업 → 상세 랜딩 (끝)
      if (stage === 'exit') { await leaveAgent(); return }
      if (stage === 'rest') {
        // 나머지 옵션을 쭉 내려가며 직접 탭 → 맨 아래 → 비활성 [주문하기] 가 활성화되고 포인터가 그 위에서 대기 (사용자가 눌러 다음 스텝)
        for (const [key, selector, val] of REST_A) { if (!await tapIn(secs[key], selector, key, val, { move: 300, pause: 80 })) return }
        // 보험은 네 번째 T 질의 ("보험은 뭐가 제일 인기 많아?") 로 고른다 (사용자 2026-09-08)
        await wait(350); if (!alive()) return
        if (!await askAI(ASKS.ins, '.radio-card:nth-child(1)')) return
        for (const [key, selector, val] of REST_B) { if (!await tapIn(secs[key], selector, key, val, { move: 300, pause: 80 })) return }
        await wait(200); if (!alive()) return
        if (!await swipeTo(el.scrollHeight)) return
        await wait(300); if (!alive()) return
        setPayReady(true)
        await wait(500); if (!alive()) return
        ptr?.park(ctaRef.current, 520, '주문하기'); return
      }
      if (stage === 'payout') {
        // [주문하기] 는 App 의 pay-tap 으로 이미 눌렸다 → 주문 정보 확인 화면이 오른쪽에서 슬라이드 인 (3안 X-1 앱 전환과 같은 언어)
        ptr?.hide(); setPayReady(true)
        await wait(60); if (!alive()) return
        setPayOn(true); return
      }
    })()
    return cancel
  }, [stage])

  const kbOpen = dock === 'open'
  const stripOn = dock === 'sent'
  const QM = variant('askmodal') || 'Q1'          // 용량 질의 답의 그릇: Q1 스트립 / Q2 시트 추천 1장 / Q3 시트 용량 3개
  const sheetAsk = stripOn && QM !== 'Q1' && ask && !ask.fromAmb
  const XF = variant('exitflow') || 'F1'
  const morph = variant('tmorph')
  const ambV = variant('ambient') || 'off', ambientOn = ambV !== 'off'
  const ambText = amb ? AMBIENT[amb] : ''
  // 가격 요약 알약 (Figma 209:117730 흐름): 용량 전 '1,684,000원부터' → 용량 뒤 '1,936,000원' → 요금제 뒤 '다음달 1,793,200원' (209:103184)
  const pill = sel.plan >= 0 ? { b: '다음달 1,793,200원', t: '' } : sel.storage >= 0 ? { b: STORAGE[sel.storage].r.replace(/\s/g, ''), t: '' } : { b: '1,684,000원', t: '부터' }
  const dimKey = hint   // 질의 중인 섹션의 나머지 항목이 물러남 (배지도 같은 조건)
  const isBadge = (k) => hint === k
  // 요금제명 교체 연출: 질의로 추천이 확정되기 전까지는 지금 쓰는 요금제가 AI PICK 카드에 들어 있다 (?pm=on)
  const morphPre = variant('planmorph') === 'on' && sel.plan < 0

  return (
    <div className={`pd pd2 pd1 ${morph} dock-${dock} ag-${agent} ain-${variant('agentin') || 'A1'} gp-${variant('agentpace') || 'P1'} amb-${ambV} ${amb ? 'amb-on' : ''} ${ask?.fromAmb ? 'from-amb' : ''}`} ref={rootRef}>
      <div className="pd2-scroll" ref={scrollRef}>
        <StatusBar className="pd-status" />
        <div className="pd2-appbar"><IcoBack /><span className="sp" /><i className="ico-share" /><i className="ico-menu" /></div>
        <div className="hero">
          <div className="badges"><span className="dark">워치 10% 할인</span><span>콘텐츠 특화</span><span>인기</span></div>
          <h1>최적의 비율로 즐기는,<br />세상에서 가장 가벼운 갤럭시 Z 폴드</h1>
          <div className="model">SM-F971NV</div>
          <div className="pname">갤럭시 Z 폴드8</div>
          <div className="visual"><img src="/screens/pd2/device.png" alt="" draggable="false" /></div>
          <div className="check-acc"><span>꼭 확인해 주세요</span><i className="chev" /></div>
          <div className="notice"><i>i</i><div><b>기기 변경이 적절한 타이밍이에요</b><p>{NAME}님의 단말 교체 주기와 SKT 약정 상태를 분석한 결과, 별도 위약금 발생 없이 지금 기기변경을 신청하시는 것이 가장 유리해요.</p></div></div>
        </div>

        <div className="pd2-tabs"><span className="on">상품 주문</span><span>구매 혜택</span><span>상품 정보</span><span>구매 후기</span></div>

        <div className="combo-card">
          <div className="combo-title">{NAME}님의 평소 이용 패턴을<br />바탕으로 최적의 조합을 적용할 수 있어요.</div>
          <div className="ai-note"><span>✦ AI 분석</span><p>{AI_TEXT}</p></div>
          <ComboRows />
          <div className="btn-primary">이 옵션으로 진행할게요</div>
          <div className="btn-text">직접 둘러볼게요</div>
        </div>

        <Section title="어떤 색상이 마음에 드세요?" link="구매 현황 보기" refEl={secs.color} className={dimKey === 'color' ? 'dimmed' : ''}>
          <div className="swatches">
            {COLORS.map((c, i) => (
              <div className={`swatch opt ${sel.color === i ? 'sel' : ''} ${isBadge('color') && i === ASKS.color.rec ? 'hint ai-rec' : ''}`} key={c.name}>
                <AiBadge />
                <i style={{ background: c.hex }} /><span>{c.name}</span>{c.cap && <small>{c.cap}</small>}
              </div>
            ))}
          </div>
        </Section>
        <Section title="용량은 얼마나 필요하세요?" link="구매 현황 보기" refEl={secs.storage} className={dimKey === 'storage' ? 'dimmed' : ''}>
          <div className="stack">{STORAGE.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.storage === i} hint={isBadge('storage') && i === ASKS.storage.rec} />)}</div>
        </Section>
        <Section title="휴대폰은 어떻게 받으시겠어요?" refEl={secs.delivery}>
          <div className="stack">{DELIVERY.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.delivery === i} />)}</div>
        </Section>
        <Section title="단말기는 몇 달 동안 납부할까요?" refEl={secs.term}>
          <div className="grid4">{TERMS.map((t, i) => <div className={`term ${sel.term === i ? 'sel' : ''}`} key={t}><b>{t}</b></div>)}</div>
        </Section>

        <div className="pd2-sec" ref={secs.acc}>
          <div className="accordion">
            <div className="acc-head"><div className="acc-title">그간의 가입 이력을 바탕으로<br />{NAME}님께 꼭 맞는 주문 조건을 찾았어요.<br />확인해 보시겠어요?</div><i className="chev" /></div>
            <div className="acc-body"><div className="acc-in"><div className="divider" /><div className="ai-note"><span>✦ AI 분석</span><p>{AI_TEXT}</p></div><ComboRows /><div className="btn-primary">이 옵션으로 진행할게요</div></div></div>
          </div>
        </div>

        <Section title="어떤 분이 사용할 휴대폰인가요?" refEl={secs.user}>
          <div className="stack">{USER.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.user === i} />)}</div>
        </Section>
        <Section title="어떻게 가입할까요?" refEl={secs.join}>
          <div className="stack">{JOIN.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.join === i} />)}</div>
        </Section>

        {/* 요금제 — Figma ixGPs9 302:104587 그대로: 캐러셀이 아니라 세로 스택 2장.
            ① [지금 이용중인 요금제] 카드(할인 행 없음) ② [AI PICK] 카드(할인 3행) ③ [나에게 맞는 요금제 더보기 ›]
            AI 질의 3번째 — 추천 중엔 파란 테두리 + 나머지 물러남, 선택 뒤 검은 테두리(S-1)와 공통지원금 행 선택 */}
        <Section title="요금제를 선택해 주세요" refEl={secs.plan} className={dimKey === 'plan' ? 'dimmed' : ''}>
          <div className="plan-stack">
            <div className="pcw cur"><PlanCard data={CUR_PLAN} nodisc /></div>
            <div className={`pcw opt ${isBadge('plan') ? 'hint ai-rec' : ''} ${sel.plan >= 0 ? 'sel' : ''}`}>
              <PlanCard key={morphPre ? 'pre' : 'rec'} idx={ASKS.plan.rec} data={morphPre ? PRE_PICK : undefined} sel={sel.plan >= 0} disc={sel.plan >= 0 ? 0 : -1} />
            </div>
            <button className="plan-more" type="button">나에게 맞는 요금제 더보기<i className="chev r" /></button>
          </div>
        </Section>

        <Section title="어떤 SIM으로 개통하시겠어요?" refEl={secs.sim}>
          <div className="stack">{SIM.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.sim === i} />)}</div>
        </Section>
        <Section title="T 기프트 하나를 선택해 주세요" link="전체보기" desc="원하는 단말 사은품 하나를 지정한 주소로 보내드려요." refEl={secs.gift}>
          <div className="gift-grid">
            {GIFTS.map((g, i) => (
              <div className={`gift ${sel.gift === i ? 'sel' : ''}`} key={i}><div className="gimg"><img src={g.img} alt="" draggable="false" /></div><small>{g.brand}</small><b>{g.name}</b><span className="ai-pick">AI PICK</span></div>
            ))}
          </div>
        </Section>
        <Section title="원하는 티다팩 쿠폰을 골라주세요" link="전체보기" desc="12개월간 매달 발송되는 쿠폰 혜택이에요." refEl={secs.coupon}>
          <div className="stack">
            {COUPONS.map((c, i) => (
              <div className={`radio-card ico-row ${sel.coupon === i ? 'sel' : ''}`} key={c.t}>{c.l && <Logo l={c.l} bg={c.bg} />}<div className="txt"><div className="t">{c.t}</div>{c.d && <div className="d">{c.d}</div>}</div></div>
            ))}
          </div>
        </Section>
        <Section title="쓰던 휴대폰을 반납하고 보상금을 받으시겠어요?" desc="바로보상 신청 시 예상 보상금을 새 휴대폰 가격에서 할인해 드려요." refEl={secs.tradein}>
          <div className="stack">{TRADEIN.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.tradein === i} />)}</div>
        </Section>
        <Section title="소중한 휴대폰, 보험으로 지켜보세요" link="전체보기" desc="떨어뜨리거나 잃어버려도 걱정 없이 쓰세요." refEl={secs.ins} className={dimKey === 'ins' ? 'dimmed' : ''}>
          <div className="stack">
            {INSURANCE.map((it, i) => (
              <div className={`radio-card ins opt ${sel.ins === i ? 'sel' : ''} ${isBadge('ins') && i === ASKS.ins.rec ? 'hint ai-rec' : ''}`} key={i}>
                <AiBadge />
                <div className="txt">
                  {it.badge && <span className="mini-badge">{it.badge}</span>}
                  <div className="t">{it.t}</div>
                  {it.pct && <div className="price"><em>{it.pct}</em> {it.r}</div>}
                  {it.d && <div className="d">● {it.d}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="이런 서비스는 어때요?" link="전체보기" desc="나에게 유용하고 꼭 필요한 부가서비스를 찾아보세요!" refEl={secs.svc}>
          <div className="stack">
            {SERVICES.map((s, i) => (
              <div className={`radio-card ico-row svc ${sel.svc === i ? 'sel' : ''}`} key={i}>{s.l && <Logo l={s.l} bg={s.bg} />}<div className="txt">{s.s && <div className="s">{s.s}</div>}<div className="t">{s.t}</div>{s.r && <div className="price">{s.r}</div>}</div></div>
            ))}
          </div>
        </Section>
        <Section title="더 할인받을 수 있는 제휴카드를 확인해보세요" desc="자동이체 등록하고 매월 요금 할인 받아보세요" refEl={secs.card}>
          <div className="stack">
            <div className="card-box">
              <div className="cb-title">기존 사용하던 제휴카드 선택</div>
              <div className="cb-label">요금 할인</div>
              <div className="cb-row"><i className="cimg" /><div><b>T라이트 우리카드</b><span>월 10,000~20,000원 할인</span></div></div>
            </div>
            <div className="radio-card link-row"><div className="t">제휴 카드 선택</div><i className="arrow" /></div>
            <div className="card-box">
              <div className="cb-title link">제휴 카드 선택<i className="arrow" /></div>
              <div className="cb-label">요금 할인</div>
              <div className="cb-row"><i className="cimg red" /><div><b><span className="tag">보유</span> 삼성 TL는 혜택카드</b><span>월 7,000~13,000원 할인</span></div></div>
              <div className="cb-label">휴대폰 할인</div>
              <div className="cb-row"><i className="cimg teal" /><div><b><span className="tag off">미보유</span> 파인애플 카드 (by 신한카드)</b><span>월 10,000~15,000원 할인</span></div></div>
              <div className="cb-note">{CARD_NOTE.split('\n').map((l) => <p key={l}>{l}</p>)}</div>
            </div>
            <div className={`radio-card none ${sel.card === 0 ? 'sel' : ''}`}><div className="txt"><div className="t">제휴카드 없이 주문할게요</div></div></div>
          </div>
        </Section>
        <Section title="추가로 할인받을 수 있는 수단이 있어요" desc="보유하신 쿠폰과 포인트 적용하고 더 저렴하게 구매하세요" refEl={secs.extra}>
          <div className="stack">
            <div className="radio-card link-row"><div className="t">쿠폰·이용권 선택</div><i className="arrow" /></div>
            <div className="radio-card link-row"><div className="t">T 모아 제휴 포인트 적용</div><i className="arrow" /></div>
            <div className={`radio-card none ${sel.extra === 0 ? 'sel' : ''}`}><div className="txt"><div className="t">추가 할인 없이 주문할게요</div></div></div>
          </div>
        </Section>
        <div style={{ height: px(180) }} />
      </div>

      {/* 하단: BottomGroupAi (3안 Step 1·2 와 같은 T+ 버튼 + [옵션 선택하기]) — T+ 가 SearchAi(353×52) 로 모핑한다 */}
      <div className="pd2-bottom pd1-bottom">
        {/* Ambient Layer · A1/A3 = BottomGroupUpperItem (Figma 209:100476): ✦ 그라데이션 문장 14/18 + [적용하기] 13 underline. 그룹이 그만큼 위로 자란다 */}
        {ambientOn && ambV !== 'A3' && (
          <div className={`amb-line ${amb ? 'on' : ''}`} aria-hidden={!amb}>
            <div className="in" ref={ambRef}>
              <img className="nav" src="/icons/ctx_navigate.svg" alt="" />
              <span className="amb-txt">{ambText}</span>
              <span className="apply" ref={applyRef}>적용하기</span>
            </div>
          </div>
        )}
        <div className={`primary cta ${payReady ? 'pay' : ''}`} ref={ctaRef} aria-disabled={!payReady}>주문하기</div>
        {/* 가격 요약 알약 (Figma 209:100470 '1,684,000원부터 ⌃') — Bottom Group 위 6px. Agent 응답 중(dock-open/sent)에는 숨김 (90:136843 에 없음) */}
        {ambientOn && <div className={`price-pill ${ambV === 'A3' && amb ? 'hide' : ''}`} aria-hidden><b>{pill.b}</b>{pill.t}<i className="tri" /></div>}
        {/* A3 · 떠 있는 칩: 알약 자리에 참고 문장 칩이 뜬다. 탭 → 칩 자리에서 카드로 펼쳐진다 (탭 대상이므로 transform 으로 자리 잡지 않는다) */}
        {ambientOn && ambV === 'A3' && (
          <div className={`amb-chip ${amb ? 'on' : ''}`} ref={ambRef} aria-hidden={!amb}>
            <img className="nav" src="/icons/ctx_navigate.svg" alt="" /><span className="amb-txt">{ambText}</span><i className="chev" />
          </div>
        )}
      </div>

      {/* SearchAi(353×52) ↔ SearchAiMulti(110, Figma 472:144639): 본문이 한 줄을 넘치면 두 줄 + 아래 줄에 ✦ · [↑ 보내기] */}
      <div className={`dock ${multi ? 'multi' : ''} ${wrap ? 'wrap' : ''} ${fade ? 'fade' : ''} ${lift ? 'lift' : ''} mv-${variant('sinput') || 'M1'}`} ref={dockRef} aria-label="T 호출">
        <div className="tico"><IcoSparkleAi size={26} /></div>
        <div className="sinp">
          <IcoSparkle size={16} className="spark lead" />
          <div className={`field ${typed ? 'filled' : ''}`}><span className="tq">{typed}</span>{!typed && !kbOpen && 'T에 대해 무엇이든 물어보세요.'}{kbOpen && <i className="caret" />}</div>
          <IcoVoice size={24} className="voice" />
          <div className="srow"><IcoSparkle size={16} className="spark tail" /><span className="send" aria-label="보내기"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" stroke="#060C1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div>
        </div>
      </div>
      <div className="ai-dim" aria-hidden />   {/* Agent 호출 시 하단 그라데이션 딤 (html[data-aidim]) */}
      {/* 답변 스트립 (E-1): 입력창 바로 위. 생각 점 → 이유 1줄 + 추천 → [이 항목으로 선택] */}
      {/* Q2·Q3: 답이 2안 언어의 바텀 시트로 (딤 없음 G-1). 입력창 위 12px, 생각 점 → 제목·답 → 추천 행 → 선택 */}
      {sheetAsk ? (
        <div className={`ai-sheet qsheet q-${QM} on ${answered ? 'answered' : ''}`} ref={stripRef}>
          <div className="hd"><div><h3>{answered ? `${ask.sec}은 이렇게 추천해요` : <span className="think"><i /><i /><i /></span>}</h3>{answered && <p>{ask.why}.</p>}</div><i className="x" /></div>
          {answered && (QM === 'Q2' ? (
            <>
              <div className="qrow rec"><span className="rec-badge">AI 추천</span><div className="top"><b>{STORAGE[ask.rec].t}</b><span>{STORAGE[ask.rec].r}</span></div>{STORAGE[ask.rec].d && <div className="desc">{STORAGE[ask.rec].d}</div>}</div>
              <div className="qbtn" ref={okRef}>이 항목으로 선택</div>
            </>
          ) : (
            <div className="items qitems">
              {STORAGE.map((it, i) => <div className={`qrow ${i === ask.rec ? 'rec' : ''}`} key={it.t} ref={i === ask.rec ? okRef : undefined}>{i === ask.rec && <span className="rec-badge">AI 추천</span>}<div className="top"><b>{it.t}</b><span>{it.r}</span></div>{it.d && <div className="desc">{it.d}</div>}</div>)}
            </div>
          ))}
        </div>
      ) : (
      <div className={`strip ${stripOn ? 'on' : ''} ${answered ? 'answered' : ''}`} ref={stripRef} aria-hidden={!stripOn}>
        {ask && (<>
          {/* AiAgentBottomSheet 룩 (Figma ixGPs9 90:107516): ✦ {섹션} 선택 · × / 본문 15/24 / [이어서 대화하기] [추천 선택하기 ›] */}
          <div className="hd"><img className="nav" src="/icons/ctx_navigate.svg" alt="" /><span className="cap">{ask.sec} 선택</span><i className="x" /></div>
          <div className="ans">
            <span className="think"><i /><i /><i /></span>
            <span className="txt">{ask.why}. 위에 표시한 <b>{ask.opt}</b>{ask.josa || '을'} 추천해요.</span>
          </div>
          <div className="chips">
            <span className="sbtn more">이어서 대화하기</span>
            <span className="sbtn ok" ref={okRef}>추천 선택하기<i className="chev" /></span>
          </div>
        </>)}
      </div>
      )}
      <div className="scroll-ind pd1-ind" ref={scrollIndRef} aria-hidden><i /></div>
      <Keyboard slide open={kbOpen} />
      {/* 주문 정보 확인 화면 (Figma ixGPs9 134:60488) — X-1 앱 전환 슬라이드로 오른쪽에서 덮는다 */}
      <div className={`pay-layer ${payOn ? 'on' : ''}`} aria-hidden={!payOn}>{payOn && <OrderConfirm />}</div>
      {/* AI Agent 우측 상단 [나가기] → '고른 값은 저장돼요' confirm (Figma ixGPs9 438:190278 방향, 사용자 2026-09-15).
          시안 html[data-exitpop]: X1 중앙 알럿 · X2 하단 시트 · X3 저장된 값을 보여주는 카드 */}
      {/* 요금제 질의 → Agent 풀팝업 (Figma ixGPs9 438:190278). 상세 위로 올라오고, [나가기] 뒤 내려가며 selected 된 상세가 드러난다 */}
      <PlanAgent state={agent} aph={aph} tout={tout} sheet={asheet} picked={apick} flow={XF} scrollRef={agScrollRef} exitRef={exitBtnRef} yesRef={yesRef} />
      <ExitConfirm open={xpop} flow={XF} backRef={backRef} />
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}

/* [나가기] 시점(요금제 질의 직후)까지의 상태. AI 에게 물어본 것과 직접 고른 것을 나눈다 —
   전부 'T 가 골라줬다' 고 하면 사실과 다르다 (사용자 2026-09-15 "나는 요금제 질의만 했는데") */
/* 이 팝업은 AI Agent 풀팝업 안에서 뜬다 — 거기서 물어본 건 요금제 하나뿐이다 (사용자 2026-09-15).
   용량은 상세 화면의 모달에서 물어본 것이라 아래 '직접 고른 것' 쪽에 함께 남는다 */
const EXIT_ASKED = [ASKS.plan].map((a) => [a.sec, a.opt])
/* 나눠 보여주는 방식 시안 (html[data-exitlist])
   D1 두 묶음: 'AI 에게 물어본 것' / '직접 고른 것' 을 소제목으로 갈라 둘 다 펼친다
   D2 한 목록 + 표시: 한 줄로 이어 두고 물어본 줄에만 ✦ 를 달아 구분한다
   D3 물어본 것만: T 가 답한 둘만 보여주고 직접 고른 것은 '그 외 n개' 한 줄로 접는다 */
const EXIT_PICKED = [['색상', COLORS[ASKS.color.rec]?.name || '그라파이트'], ['용량', ASKS.storage.opt], ['수령 방법', DELIVERY[0]?.t || '택배 배송'], ['납부 기간', TERMS[1]?.t || '24개월'], ['가입 유형', JOIN[2]?.t || '기기변경'], ['사용자', USER[0]?.t || '본인']]
function ExitSaved() {
  /* 두 묶음(AI 에게 물어본 것 / 직접 고른 것)의 위계 시안 (html[data-exithier])
     H1 무게 대비: 물어본 쪽만 흰 카드 + 큰 값, 직접 고른 쪽은 배경 없는 작은 목록
     H2 카드 분리: 두 묶음을 각각 박스로 떼고 물어본 쪽에 브랜드 틴트 + 테두리
     H3 접기: 물어본 쪽만 펼치고 직접 고른 쪽은 '직접 고른 것 6개 ›' 한 줄로 */
  const H = variant('exithier')
  const Row = ([k, v], cls = '') => <div className={`row ${cls}`} key={k}><span>{k}</span><b>{v}</b></div>
  const asked = (
    <div className={`grp asked h-${H}`}>
      <div className="cap"><img src="/icons/ctx_navigate.svg" alt="" />AI 에게 물어본 것</div>
      {EXIT_ASKED.map((r) => Row(r, 'big'))}
    </div>
  )
  if (H === 'H3') return (
    <div className={`exit-saved hier h-${H}`}>
      {asked}
      <div className="grp picked fold"><span>직접 고른 것 {EXIT_PICKED.length}개</span><i className="fold-chev" /></div>
    </div>
  )
  return (
    <div className={`exit-saved hier h-${H}`}>
      {asked}
      <div className={`grp picked h-${H}`}>
        <div className="cap plain">직접 고른 것</div>
        {EXIT_PICKED.map((r) => Row(r))}
      </div>
    </div>
  )
}
function ExitConfirm({ open = false, flow = 'F1', backRef }) {
  const X = variant('exitpop')
  if (X === 'off' || !open) return null
  /* 문구 A (사용자 2026-09-15). '상담' 은 사람 상담원 느낌이고 '끝내고' 는 고른 걸 버리는 뉘앙스라 사실과 반대로 읽혔다
     — 3안은 상세가 본진이고 Agent 는 잠깐 불러 쓰는 곳이라 '돌아간다' 가 맞다 */
  // F2(시트 없이 나가기 한 번): 이 팝업이 요금제 선택까지 맡는다 — 문구가 '추천 요금제로 선택하고' 를 품는다
  const title = flow === 'F2' ? '추천 요금제로 선택하고 돌아갈까요?' : '상품 상세로 돌아갈까요?'
  const body = flow === 'F2' ? `${PLAN_REC}가 선택된 상태로 상품 상세에 이어져요. 직접 고른 값도 그대로 저장돼요.` : '지금까지 고른 내용은 그대로 저장돼요. 돌아가서 이어서 진행할 수 있어요.'
  return (
    <div className={`exit-pop x-${X} on`}>
      <div className="exit-dim" />
      <div className="exit-box">
        {X === 'X2' && <i className="grab" />}
        <h3>{title}</h3>
        <p>{X === 'X3' && flow !== 'F2' ? 'AI 에게 물어본 내용은 그대로 저장돼요. 돌아가서 이어서 진행할 수 있어요.' : body}</p>
        {X === 'X3' && <ExitSaved />}
        <div className="exit-btns">
          <button type="button" className="ghost">더 물어보기</button>
          <button type="button" className="solid" ref={backRef}>돌아가기</button>
        </div>
      </div>
    </div>
  )
}

/* ── 요금제 질의 Agent 풀팝업 (Figma ixGPs9 438:190278, 2026-09-16) ──
   상단: 상태바 · [요금제 추천 & 변경 ∨] 칩 · 새 대화 · [나가기]. 본문은 1안 AgentChat 의 조각(말풍선 · 오프닝 · 카드 · 그래프)을 그대로 빌려 쓴다.
   aph: 1 질문 + 오프닝 / 2 이용현황 안내 + 이용중 요금제 + 그래프 / 3 추천 문장 + 추천 카드 / 4 현재 요금제와 비교 / 5 마무리(F1 선택 완료 선 · F2 안내) */
const IcoExit = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="#101010" strokeWidth="1.7" strokeLinecap="round" /><path d="M3 12h11M10.5 8.5 14 12l-3.5 3.5" stroke="#101010" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
const PA_CUR = { name: '0 청년 69', price: '월 62,800원', caps: '데이터 20GB・통화 무제한・문자 무제한' }
const PA_REC = { name: PLAN_REC, price: '월 99,000원', caps: '데이터 무제한・통화 무제한・문자 무제한' }
function PlanAgent({ state, aph, tout = false, sheet, picked, flow, scrollRef, exitRef, yesRef }) {
  const hdr = variant('exithdr') || 'H1'
  return (
    <div className={`pa ${state}`} aria-hidden={state === 'off'}>
      <AgentBackground />
      {/* 고정 헤더: AgentChat 의 .ai-header-fixed 와 같은 불투명 basement + 글로우 복제 — 올라오는 본문이 뒤로 가려진다 */}
      <div className="ai-header-fixed pa-head">
        <AgentBackground />
        <StatusBar />
        {/* 헤더 (Figma 473:146215 = 선택이 끝난 뒤): 칩 안에 ‹ 되돌아가기 + "요금제 추천 & 변경 | 7/20 선택 완료", 우측은 새 대화 하나.
            그 상태로 바뀌는 방식 html[data-exithdr]: H1 [네] 뒤 칩이 자라며 ‹ · 카운트가 들어오고 우측 [나가기] 가 사라짐 / H2 처음부터 그 헤더(6/20 선택 중 → 7/20 선택 완료 롤) / H3 라벨이 통째로 "7/20 선택 완료" 로 롤 */}
        <div className={`appbar-ai eh-${hdr} ${picked ? 'done' : ''}`}>
          <div className="left">
            <div className={`contextual-chip ${hdr === 'H2' || picked ? 'has-back' : ''}`} ref={exitRef} aria-label="나가기">
              <span className="back"><IcoBack size={18} /></span>
              <span className="lbl-wrap">
                <span className={`lbl ${hdr === 'H3' && picked ? 'swap-out' : ''}`}>요금제 추천 &amp; 변경</span>
                {hdr === 'H3' && picked && <span className="lbl alt swap-in">7/20 선택 완료</span>}
              </span>
              <i className="chev-d" />
              {hdr !== 'H3' && <span className="cnt" key={picked ? 'done' : 'cur'}><em>|</em>{picked ? '7/20 선택 완료' : '6/20 선택 완료'}</span>}
            </div>
          </div>
          <div className="right"><div className="btn-icon-ai"><IcoNewChat /></div><div className="btn-icon-ai exit" aria-hidden><IcoExit /></div></div>
        </div>
      </div>
      <div className="chat-scroll pa-scroll" ref={scrollRef}>
        {aph >= 1 && <UserMessage className="pa-in">{PLAN_Q}</UserMessage>}
        {/* 오프닝 타이틀은 답이 시작되면 접혀 사라진다 (시안 1 collapse C-2: 글자 먼저 → 높이). Figma 두 번째 프레임에는 타이틀이 없다 */}
        {aph >= 2 && aph < 11 && <div className={`opening pa-in ${aph >= 3 ? 'gone' : ''}`}><h2 className="ai-title">최근 6개월간 이용현황을<br />먼저 살펴볼게요</h2><div className="status">나의 요금제 확인</div></div>}
        {(aph === 3 || aph === 7) && <div className={`pa-think pa-in ${tout ? 'out' : ''}`}><Thinking /></div>}
        {aph >= 4 && <AiMessage className="pa-in">최근 6개월간 월평균 22.4GB를 사용했어요. 현재 요금제의 데이터 제공량은 20GB로, 초과 시 속도 제한이 적용되고 있어요.</AiMessage>}
        {aph >= 5 && <Card className="pa-in"><span className="badge">이용중 요금제</span><div className="cell-desc">{PA_CUR.name}</div><div className="cell-title">{PA_CUR.price}</div><div className="cell-desc">{PA_CUR.caps}</div><BenefitBadges /></Card>}
        {aph >= 6 && <Card className="pa-in"><UsageGraph /></Card>}
        {aph >= 8 && <AiMessage className="pa-in">이용 패턴을 고려하면 데이터를 제한 없이 사용할 수 있는 {PLAN_REC}가 가장 적합해요.</AiMessage>}
        {aph >= 9 && <Card className="pa-in"><div className="cell-desc">{PA_REC.name}</div><div className="cell-title">{PA_REC.price}</div><div className="cell-desc">{PA_REC.caps}</div><BenefitBadges /></Card>}
        {aph >= 10 && (
          <Card className="compare pa-cmp pa-in">
            <h3>현재 요금제와 비교</h3>
            <div className="cmp">
              <div className="col"><span>기존</span><b>{PA_CUR.name}</b><em>{PA_CUR.price}</em><small>데이터 20GB</small></div>
              <div className="col new"><span>변경 후</span><b>{PA_REC.name}</b><em>{PA_REC.price}</em><small>데이터 무제한</small></div>
            </div>
            <p>월 36,200원이 높지만 데이터가 무제한으로 바뀌어 속도 제한이 사라져요. 가족결합이 가능한 상품이라 함께 쓰면 더 유리해요.</p>
          </Card>
        )}
        {aph >= 11 && picked && <div className="done-line pa-in in"><i className="chk" /><span>{PLAN_REC} 선택 완료</span><em /></div>}
        {aph >= 11 && !picked && flow === 'F2' && <AiMessage className="pa-in">이 요금제로 진행하시려면 오른쪽 위 [나가기]로 돌아가 주세요. 추천 요금제가 선택된 상태로 이어져요.</AiMessage>}
        <div className="pa-tail" />
      </div>
      <SearchAi style={{ bottom: 24 }} />
      <div className={`ai-sheet pa-sheet ${sheet ? 'on' : ''}`}>
        <div className="pa-down" aria-hidden><i /></div>
        <div className="hd"><div><h3>추천된 요금제를 선택하실래요?</h3></div><i className="x" /></div>
        <div className="items"><div className="ai-sheet-item" ref={yesRef}>네</div><div className="ai-sheet-item">다른 요금제 살펴보기</div></div>
      </div>
      <div className="home-ind"><i /></div>
    </div>
  )
}
