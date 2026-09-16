import { useEffect, useRef, useState } from 'react'
import Pointer, { userTap } from '../components/pointer.js'
import { AgentBackground, StatusBar, AppbarAi, ContextHeader, SearchAi, HomeIndicator, Keyboard, SEARCH_BOTTOM, OPTIONS } from './AgentShell.jsx'
import { AnswerBubble, reveal, showNow, unreveal, hideOpening, rv, collapseOpening, anchorBottom, UserMessage, AiMessage, Opening, Thinking, Card, PlanRow, BenefitBadges, POP_PLANS, POP_PLANS_LIGHT, SHEET_TABS, TAIL, CHIP_DEFAULT } from './AgentChat.jsx'
import { wait, scrollTo, tween, linear, reducedMotion, afterLayout } from '../lib/motion.js'
import { variant } from '../lib/variants.js'
import { PRE_MSG, PRE_MSG2, PRE_ROWS, PRE_CHIP } from '../data/an2.js'
import { useSheetOut, SHEET_KEEP_MS } from '../lib/sheet.js'
import './agent2.css'
import { SCREEN_H as SH, SCREEN_W } from '../lib/screen.js'

/* 2안 · AI Agent 중심 + Bottom Sheet 선택 (Figma ixGPs9IrNB0e2VD2OFEZlB 96:47398, 22장)
   전체 흐름과 등장 리듬은 3안(AgentChat)과 같다. 다른 점 하나: 선택이 필요한 모듈은 대화 안에 깔지 않고 **바텀 모달(시트)** 로 올려 고르고,
   시트가 내려가면 대화에는 고른 결과 한 줄(카드)만 남는다. 요금제 [더보기] 는 3안과 같은 전체 요금제 팝업.
   stage: usage(추천 → 시트 → [전체보기] → 팝업 → 적용 → 결과 카드) → sim → benefit → discount → pay  (그 뒤 신청서~결제는 3안 AgentChat form… 를 그대로 잇는다) */

const STAGES = ['usage', 'plandisc', 'sim', 'benefit', 'discount', 'pay']
const USAGE_MSG_1 = '최근 6개월간 현황을 살펴보니 월평균 22.4GB를 사용해 제공량 20GB를 초과했고, 초과 시 속도 제한이 적용되고 있어요.'
const USAGE_MSG_2 = '데이터를 제한 없이 사용할 수 있는 5GX 프라임 플러스를 추천드려요. 요금제를 변경하시면 월 36,200원이 높아지지만, 넷플릭스·FLO 혜택도 함께 이용할 수 있어요.'   // Figma 134:60944 축약본 (요금제명은 0청년 99 대신 프로토 기준 유지)
const PLAN_SHEET_TITLE = '요금제를 선택해주세요.'
// 스텝 4 추천 흐름 (Figma 210:124536, 2026-09-10): 추천 문장 → 추천 요금제 카드(대화 안) → 모달 "추천된 요금제를 선택하실래요?" [네 / 다른 요금제 살펴보기] → [다른 요금제 살펴보기] → 전체 요금제 풀팝업 → 선택·적용 → 결과 말풍선
//   html[data-recflow]: P1 Figma 그대로(카드 유지) / P2 적용 뒤 카드 접힘(말풍선이 자리 차지) / P3 카드에 선택 테두리 / old 기존(모달 안 카드 + [전체보기])
const REC_SHEET_TITLE = '추천된 요금제를 선택하실래요?'
const REC_CHOICES = ['네', '다른 요금제 살펴보기']
const REC = POP_PLANS[0]   // 5GX 프라임 플러스 (AI PICK)
// 옵션 끝 → 가입자 정보 조회 (Figma 107:47520 · 71:82028 → 71:82083): 안내 → 타이틀 → 가입자 정보 카드 → [신청서 작성하기]

// 시트로 고르는 턴들. rows = [이름, 설명, 우측값], pick = 포인터가 고르는 행 (Figma 기준). 안내문은 Figma 134:60944 축약본 (2026-09-09: 추천·되묻기 문장 삭제)
const TURNS = [
  // 요금제를 고른 직후 할인 방법 (Figma ixGPs9 229:92086 5·6번째 프레임, 2026-09-11). 요금제와 한 세트라 '요금제 추천' 단계 안에 둔다
  { id: 'plandisc', k: 8, label: '할인 방법',     msgs: ['이어서 할인방법을 선택할게요.', '공통지원금으로 할인 받으시는걸 추천드려요. 24개월동안 사용하면서 가격 할인을 가장 많이 받으실 수 있어요.'],   // Figma ixGPs9 307:72924 (2026-09-14)
    sheet: '할인 방법을 선택해주세요.', rows: [['공통지원금', '휴대폰 가격에서 바로 할인', '-300,000원'], ['선택약정 12개월', '12개월간 통신요금 25% 할인', '-250,000원'], ['선택약정 24개월', '24개월간 통신요금 25% 할인', '-280,000원']], pick: 0 },
  { id: 'sim',     k: 8,  label: 'SIM 유형',      msgs: ['기기변경으로 진행 중이시니, 쓰시던 유심을 그대로 사용하시면 새로 사지 않아도 되고 개통도 가장 빠르게 끝나요.'],
    sheet: '어떤 SIM으로 개통하시겠어요?', rows: [['eSIM', '칩 없이 QR로 바로 개통해요', '3,000원'], ['새 USIM 구매', '택배로 받아 끼우면 바로 개통돼요', '3,000원'], ['가지고 있는 USIM 사용', '쓰던 USIM을 그대로 사용해요', '3,000원']], pick: 2,
    xchip: '개통 방법 선택하기', xmsg: '이어서 진행할게요.' },   // 시트 × → 복귀 시안 (html[data-simx], Figma 229 234:92897)
  { id: 'benefit', k: 12, label: '추가 혜택',     msgs: ['데이터를 넉넉하게 쓰시려면 청년 데이터 60GB 추가를 추천드려요. 자동으로 추가돼서 신경 쓰지 않으셔도 돼요.'],
    sheet: '어떤 혜택을 선택하시겠어요?', rows: [['청년 데이터 60GB 추가', '매월 데이터를 넉넉하게 사용해요'], ['콘텐츠 이용권', 'YouTube · Netflix · TVING 중 하나'], ['추가 혜택을 선택하지 않을게요', '나중에 Tworld에서 신청할 수 있어요']], pick: 0, icon: true },
  { id: 'disc',    k: 9,  label: '추가 할인 수단', msgs: ['쿠폰이나 이용권이 있으시면 바로 적용해서 가장 간편하게 할인받으실 수 있어요. 어떤 방식으로 할인받으실래요?'],
    sheet: '추가로 할인받을 수 있는 수단이 있어요.', rows: [['쿠폰/이용권'], ['제휴 포인트'], ['추가 할인 수단을 사용하지 않기']], pick: 0 },
  { id: 'coupon',  k: 10, label: '쿠폰',          msgs: ['보유하신 쿠폰 중에서는 50,000원 할인 쿠폰이 가장 혜택이 커요. 이 쿠폰으로 적용해드릴까요?'],
    sheet: '추가로 할인받을 수 있는 수단이 있어요.', rows: [['휴대폰 구매 할인 쿠폰', '', '월 50,000원'], ['휴대폰 구매 할인 쿠폰', '', '월 30,000원'], ['휴대폰 구매 할인 쿠폰', '', '월 20,000원']], pick: 0 },
  { id: 'pay',     k: 11, label: '결제 방법',      msgs: ['휴대폰 대금을 결제할 방법을 선택해 주세요.', '월 부담을 줄이고 싶다면 24개월 할부를 추천해요. 월 71,566원 정도 결제하게 돼요.'],
    sheet: '휴대폰 대금을 어떻게 결제할까요?', rows: [['한번에 결제할게요.', '일시 결제 1,288,000원 더 필요해요'], ['6개월 할부로 할게요', '월 휴대폰 가격 214,667원'], ['12개월 할부로 할게요', '월 휴대폰 가격 107,333원'], ['24개월 할부로 할게요', '월 휴대폰 가격 53,667원']], pick: 0 },
  { id: 'extra',   k: 12, label: '추가 혜택',     msgs: ['마지막으로, 추가 혜택을 선택해 주세요. 쓰던 휴대폰을 반납하고 보상받을 수 있는 T 안심보상을 가장 많이 선택해요.'],
    sheet: '추가로 받을 수 있는 혜택이 있어요.', rows: [['T 안심보상', '쓰던 휴대폰, 반납부터 보상까지 간편하게'], ['무이자 할부 카드', '쓰던 카드 그대로, 할부 수수료 부담 없이'], ['라이트 할부 카드', '휴대폰 할부금을 카드 혜택으로 더 가볍게'], ['통신 요금 할인 카드', '매달 내는 통신 요금도 꾸준히 아껴보세요']], pick: 0 },
]
// 스테이지 → 그 스테이지에서 재생하는 턴 인덱스
const STAGE_TURNS = { plandisc: [0], sim: [1], benefit: [2], discount: [3, 4], pay: [5, 6] }
const turnsUpTo = (stage) => { const all = []; if (!STAGE_TURNS[stage]) return all; for (const s of ['plandisc', 'sim', 'benefit', 'discount', 'pay']) { all.push(...STAGE_TURNS[s]); if (s === stage) break } return all }

const SHEET_MS = 900       // 시트 상승 (R-2 0.9s)
const SHEET_OUT_MS = SHEET_KEEP_MS - 100   // 시트 하강 뒤 다음 요소까지 (내용 유지 시간과 같은 곳에서)
const SHEET_HOLD = 650     // 시트가 올라온 뒤 첫 탭까지
const SCREEN_H = SH   // 기본 852. F-2(화면 높이 유동)에서는 실제 뷰포트 높이 — src/lib/screen.js
const CHAT_TOP = 140       // 고정 헤더(107) 아래 33px — 그라데이션 꼬리 끝. 채팅 시작선 (.chat-scroll padding-top). 컨텍스트 헤더 줄이 없어져 199 → 124 (2026-09-16)
const SHEET_BOTTOM = 86    // .sheet2 bottom (agent2.css) — 기존(SearchAi 위) 모드
// 대화창을 덮는 모달 (Figma 90:86712 / 155:88000): 시트(높이 그대로)가 화면 아래 20px 에 앉아 SearchAi 를 덮는다. ∨ 플로팅 버튼은 사용자 요청으로 제거 (2026-09-09)
const SHEET_GAP = 30       // 안내문 하단 ↔ 시트 상단 (사용자 2026-09-09: 20 → +10; Figma 71:76431 실측은 36). 마지막 카드 ↔ SearchAi 30 과 같은 값
// R-2 곡선 cubic-bezier(.4,0,.15,1) 을 JS 로 (시트 transform 과 같은 박자로 채팅을 밀기 위해)
const bezier = (x1, y1, x2, y2) => (t) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  let u = t
  for (let i = 0; i < 6; i++) { const x = ((ax * u + bx) * u + cx) * u - t, d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(x) < 1e-4 || d === 0) break; u -= x / d }
  return ((ay * u + by) * u + cy) * u
}
const R2 = bezier(.4, 0, .15, 1)
const QUINT_OUT = (t) => 1 - Math.pow(1 - t, 5)

function PlanMini({ pl, sel, className = '', innerRef }) {
  return (
    <div className={`plan-mini ${sel ? 'sel' : ''} ${className}`} ref={innerRef}>
      <div className="pc-head">
        <div className="pc-text">
          <div className="pc-name">{pl.name}</div>
          <div className="pc-price"><b>{pl.price}</b><span>/월</span></div>
          <div className="pc-caps">{pl.caps.map((t, k) => <span key={t}>{k > 0 && <i />}{t}</span>)}{pl.more && <span className="more">{pl.more}</span>}</div>
        </div>
        <div className="pc-thumb"><img src="/screens/pd2/plan-thumb.png" alt="" /><em>무제한</em></div>
      </div>
      <BenefitBadges />
    </div>
  )
}

export default function AgentChat2({ stage = 'usage' }) {
  const rootRef = useRef(null), scrollRef = useRef(null), ptrLayerRef = useRef(null), ptrRef = useRef(null)
  const openingRef = useRef(null), planResRef = useRef(null), doneRef = useRef(null), doneChipRef = useRef(null), tailRef = useRef(null)
  const turnRefs = useRef([])
  const nextChipRef = useRef(null)   // 사용자 탭 모드: 턴이 끝나면 [이어서 진행하기] 칩이 떠서 사용자가 탭해야 다음 스텝 (2안은 Agent 가 스스로 이어가는 구조라 탭할 자리가 없음)
  const sheetRef = useRef(null), moreRef = useRef(null), popRef = useRef(null), applyRef = useRef(null)
  const seqRef = useRef(0), prevRef = useRef(null)
  const [sheet, setSheet] = useState(null)        // 열린 바텀 모달: 'plan' | 턴 인덱스 | null
  const [pre, setPre] = useState(null)             // 시트를 올리기 전에 높이만 재려고 내용을 먼저 그림 (G-2, 화면 밖 transform 상태라 안 보임)
  const { shown: shown0, out } = useSheetOut(sheet)   // 내려가는 동안 내용 유지 + .out (src/lib/sheet.js)
  const shown = shown0 ?? pre
  const [sheetPick, setSheetPick] = useState(-1)  // 모달 안에서 고른 행
  const [picks, setPicks] = useState(() => TURNS.map(() => -1))   // 대화에 남은 결과
  const [pop, setPop] = useState(false), [popTab, setPopTab] = useState(0), [popSel, setPopSel] = useState(-1)
  const [optK, setOptK] = useState(7), [optLabel, setOptLabel] = useState(null)
  const recRef = useRef(null), [recSel, setRecSel] = useState(false)
  // ∨ 플로팅 (Figma 210:122678 ButtonIconAiItem 44, 시트 위 12px): 모달이 방금 나온 응답을 가리면 뜬다. html[data-knob] K1 채팅 내려가기 / K2 시트 접힘 / K3 시트가 잠깐 비켜줌 / off
  const knobOverRef = useRef(0)   // 모달이 직전 응답을 가린 양(px) — armKnob 이 재고 revealHidden 이 쓴다
  const [knobBase, setKnobBase] = useState('search')   // T0: 카드가 바닥에 닿은 순간엔 SearchAi 위(88)에, 시트가 오면 시트 위(20+h+12)로 함께 올라감
  const xpillRef = useRef(null), [xpill, setXpill] = useState(false)   // S-3: 시트를 닫으면 SearchAi 위에 뜨는 복귀 알약
  const knobRef = useRef(null), [knob, setKnob] = useState(false), [knobUp, setKnobUp] = useState(false), [sheetFold, setSheetFold] = useState(false), [sheetAway, setSheetAway] = useState(false), [sheetH, setSheetH] = useState(0)   // 대화 안 추천 요금제 카드 (recflow ≠ old) · P3 선택 테두리
  const recflow = variant('recflow') || 'old'

  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])

  useEffect(() => {
    const scroll = scrollRef.current, ptr = ptrRef.current
    if (!scroll) return
    const seq = ++seqRef.current, alive = () => seq === seqRef.current
    const cancel = () => { seqRef.current++ }
    const prev = prevRef.current; prevRef.current = stage
    const reduced = reducedMotion()
    const T = rv()
    const s5 = [...scroll.querySelectorAll(':scope > .s5')]           // [말풍선, 타이틀, 안내 1, 이용중 카드, 추천 문장, (추천 카드 — recflow ≠ old)]
    const turnEls = turnRefs.current
    // .xdetour = 시트 × → 복귀 시안이 쓰는 조각(칩 · '이어서 진행할게요.'). 턴의 기본 순서(안내 → 결과)를 흐트러뜨리지 않게 제외한다
    const kids = (el) => [...el.children].filter((c) => !c.classList.contains('thinking') && !c.classList.contains('xdetour'))
    const setTail = (px) => { if (tailRef.current) tailRef.current.style.height = `${px}px` }
    const downTo = (el) => scrollTo(scroll, Math.max(scroll.scrollTop, anchorBottom(el)))
    // 2안 상단 앵커링 (사용자 2026-09-09, Figma 90:86712): 새 턴이 시작되면 그 턴의 첫 요소를 채팅 시작선(199)에 맞춘다. 이후 같은 턴 안의 요소는 아래로 흘러 쌓이고 스크롤하지 않는다
    const topAnchor = () => variant('s2cover') !== 'off'
    const prevResult = (i) => (i === 0 ? planResRef.current : turnEls[i - 1]?.querySelector('.t2-result'))   // 턴 i 직전의 결과 말풍선 (i=0 → 요금제 말풍선, done → 마지막 턴)
    const anchorTop = (el) => scrollTo(scroll, Math.max(scroll.scrollTop, el.offsetTop - CHAT_TOP))
    const follow = (el) => (topAnchor() ? Promise.resolve() : downTo(el))   // 턴 안 요소: 상단 앵커 모드면 제자리
    const setHead = (k, label) => { setOptK(k); setOptLabel(label || null) }

    // ── 되감기 / 최종 상태 ──
    const resetAll = () => {
      unreveal(s5); openingRef.current.style.cssText = ''
      planResRef.current.classList.remove('on', 'in')
      if (recRef.current) recRef.current.style.cssText = ''; setRecSel(false)
      setKnob(false); setKnobUp(false); setSheetFold(false); setSheetAway(false); setKnobBase('search')
      setXpill(false)
      turnEls.forEach((el) => { el.classList.remove('on'); unreveal([...el.children]); el.querySelectorAll('.thinking').forEach((d) => { d.classList.remove('out'); d.style.display = '' }); el.querySelectorAll('.xdetour').forEach((d) => { d.classList.remove('gone'); d.style.display = '' }) })
      doneRef.current.classList.remove('on'); unreveal([...doneRef.current.children]); doneRef.current.querySelector('.thinking').style.display = ''; const dop = doneRef.current.querySelector('.opening'); if (dop) dop.style.cssText = ''
      setPicks(TURNS.map(() => -1)); setSheet(null); setSheetPick(-1); setPop(false); setPopSel(-1); setPopTab(0)
      setHead(7); setTail(TAIL); ptr?.hide()
      scroll.scrollTop = 0
    }
    const finalUsage = () => { showNow(s5); hideOpening(openingRef.current) }
    const finalPlan = () => {
      planResRef.current.classList.add('on'); planResRef.current.style.transition = 'none'; planResRef.current.classList.add('in')
      if (recflow === 'P2' && recRef.current) recRef.current.style.display = 'none'   // 적용 뒤 카드는 접혀 사라진 상태
      if (recflow === 'P3') setRecSel(true)
    }
    // P2: 적용 순간 대화 안 추천 카드가 접히며 사라진다 (높이 → 0, 0.45s) — 결과 말풍선이 그 자리를 이어받음
    const retireRec = async () => {
      const el = recRef.current; if (!el) return
      el.style.height = `${el.offsetHeight}px`; el.style.overflow = 'hidden'; void el.offsetHeight
      el.style.transition = 'height .45s cubic-bezier(.65,0,.35,1), opacity .3s, margin .45s cubic-bezier(.65,0,.35,1)'
      el.style.height = '0px'; el.style.opacity = '0'; el.style.marginTop = '0'; el.style.marginBottom = '0'
      await wait(470); el.style.display = 'none'
    }
    // S-1 만 대화에 흔적('이어서 진행할게요.')을 남긴다 — 최종 상태에도 그대로 있어야 한다. 칩은 눌러서 사라진 것이라 최종 상태엔 없다
    const finalTurn = (i) => {
      const el = turnEls[i]; el.classList.add('on'); showNow(kids(el)); el.querySelector('.thinking').style.display = 'none'
      const xmsg = el.querySelector('.x-msg'); if (xmsg) { if (variant('simx') === 'S1') showNow([xmsg]); else xmsg.style.display = 'none' }
      setPicks((p) => p.map((v, j) => (j === i ? TURNS[i].pick : v)))
    }
    const finalDone = () => { const el = doneRef.current; el.classList.add('on'); showNow(kids(el)); el.querySelector('.thinking').style.display = 'none'; hideOpening(el.querySelector('.opening')) }
    const settle = () => {
      resetAll()
      const si = STAGES.indexOf(stage)
      if (si >= 0) { finalUsage(); finalPlan() }
      for (const t of turnsUpTo(stage)) finalTurn(t)
      if (stage === 'pay') finalDone()
      const last = STAGE_TURNS[stage] ? TURNS[STAGE_TURNS[stage].at(-1)] : null
      if (last) setHead(last.k, last.label)
      // 최종 상태: 상단 앵커 모드는 마지막 턴을 채팅 시작선에 (tail 을 화면 높이로), 기존 모드는 맨 아래
      const lastIdx = stage === 'pay' ? TURNS.length : (STAGE_TURNS[stage] ? STAGE_TURNS[stage].at(-1) : -1)
      const lastEl = lastIdx < 0 ? (si >= 0 ? planResRef.current : null) : prevResult(lastIdx)   // usage 최종 상태도 결과 말풍선을 시작선에 (없으면 tail(852)만 보여 빈 화면 — 직접 진입·재로드 버그 2026-09-10)
      if (topAnchor()) setTail(SCREEN_H)
      // setPicks(결과 행) 커밋 뒤에 재야 위 턴의 결과 행 높이가 반영된다 → rAF 만으로는 이르다 (상단 앵커가 ~100px 어긋남)
      const place = () => { scroll.scrollTop = topAnchor() && lastEl ? lastEl.offsetTop - CHAT_TOP : scroll.scrollHeight }
      requestAnimationFrame(place); setTimeout(place, 60)
      if (stage === 'pay') ptr?.park(doneChipRef.current, 0)
    }

    // N-2 생각 점: 0.9s → 0.18s 페이드아웃 (3안 전시 턴과 같은 리듬)
    const dots = async (el, head) => {
      const d = el.querySelector('.thinking')
      // 상단 앵커 모드: 직전 턴의 결과 말풍선(head)이 시작선에 오고 그 아래에 생각 점 → 안내 (Figma 155:83685: 말풍선이 맨 위, 다음 안내가 이어짐)
      reveal(d); await (topAnchor() ? anchorTop(head || d) : downTo(d)); if (!alive()) return false
      await wait(900); if (!alive()) return false
      d.classList.add('out'); await wait(180); if (!alive()) return false
      d.style.display = 'none'; return true
    }
    // ── 바텀 모달 공통: 올라옴 → 탭 → 내려감 → 대화에 결과 ──
    // 시트가 올라올 때 마지막 안내문이 시트 뒤로 숨지 않도록 — 안내문 하단을 시트 상단 위 SHEET_GAP 에 놓는다 (시안 html[data-sheetgap], 사용자 2026-09-09)
    //   G0 없음(기존: SearchAi 위 30px 그대로, 시트가 덮음) / G1 함께 밀기 / G2 먼저 자리 잡기 / G3 시트가 밀어 올리기
    const gapTarget = (msg) => {
      const h = sheetRef.current?.offsetHeight || 0
      const sheetTop = SCREEN_H - SHEET_BOTTOM - h
      return Math.max(scroll.scrollTop, msg.offsetTop + msg.offsetHeight - (sheetTop - SHEET_GAP))
    }
    // 2안 커버 모달 (html[data-s2cover]="on", Figma 90:86712): 시트는 높이·내용 그대로, 화면 아래에서 20px 고정(SearchAi 를 덮음). 시트 위 8px 에 44px ∨ 버튼 — 위치는 시트 높이를 재서 --sheet-h 로
    const openSheet = async (which, msg) => {
      if (variant('s2cover') !== 'off') {
        setSheet(which); setSheetPick(-1)
        const armed = await armKnob(msg); if (!alive()) return
        await wait(SHEET_MS + 150 + (armed && variant('knobtime') === 'T3' ? 500 : 0)); return
      }
      const G = variant('sheetgap')
      if (!msg || G === 'G0' || reducedMotion()) { setSheet(which); setSheetPick(-1); await wait(SHEET_MS + 150); return }
      setSheetPick(-1)
      setTail(600)   // 안내문을 시트 위까지 올릴 스크롤 여유: 시트 bottom 86 + 높이(3행 ~320 · 4행 ~410) + 30 > 420 이라 부족했음(클램프 → 간격 -3px). 턴 끝에 TAIL 로 복귀
      if (G === 'G2') {
        // 먼저 자리 잡기: 내용만 먼저 그려 높이를 재고(화면 밖) → 채팅이 0.45s 로 먼저 올라가 자리를 비우고 → 0.1s → 시트 상승. 두 박자
        setPre(which); await new Promise(afterLayout); if (!alive()) return
        await scrollTo(scroll, gapTarget(msg), 450, QUINT_OUT); if (!alive()) return
        await wait(100); if (!alive()) return
        setSheet(which); setPre(null); await wait(SHEET_MS + 150); return
      }
      setSheet(which)
      await new Promise(afterLayout); if (!alive()) return
      const from = scroll.scrollTop, to = gapTarget(msg), h = sheetRef.current.offsetHeight
      if (G === 'G3') {
        // 시트가 밀어 올리기: 시트 상단이 안내문 하단 + 20px 에 닿는 순간부터 시트에 붙어 함께 올라감. 물리적으로 밀리는 느낌
        const travel = h + 120 + SHEET_BOTTOM                       // translateY(100% + 120px) → 0 : 시트 상단이 지나는 거리
        const msgBottom = msg.offsetTop + msg.offsetHeight - from  // 화면 좌표 (지금 스크롤 기준)
        await tween(SHEET_MS, (t) => {
          const sheetTop = SCREEN_H + 120 + h - travel * R2(t) - h   // 현재 프레임의 시트 상단 (화면 좌표)
          const need = msgBottom + SHEET_GAP - sheetTop              // 시트가 안내문을 얼마나 밀었나
          scroll.scrollTop = Math.min(to, from + Math.max(0, need))
        }, linear)
      } else {
        // G1 함께 밀기: 시트 transform 과 같은 R-2 0.9s 곡선으로 채팅이 동시에 올라간다. 한 동작으로 읽힘
        await scrollTo(scroll, to, SHEET_MS, R2)
      }
      if (!alive()) return
      await wait(150)
    }
    const closeSheet = async () => { setKnob(false); setSheetFold(false); setSheetAway(false); setSheet(null); await wait(SHEET_OUT_MS) }
    // ── ∨ 플로팅 (사용자 2026-09-10): 모달이 직전 응답(el)을 가리면 시트 위 12px 에 44px ∨. 시트가 올라오기 시작할 때 '가려질지' 를 시트의 최종 자리로 먼저 계산한다 ──
    //    html[data-knobtime] T1 시트와 동시에(∨ 가 시트와 같은 R-2 곡선으로 함께 올라옴) / T2 시트가 앉은 직후 페이드 / T3 시트 안착 0.5s 뒤
    // T0 (사용자 2026-09-10 "5GX 컴포가 바닥에 뜰 때부터 ∨ 가 뜨다가, 모달이 뜨면 그게 올라가는 식"): 응답이 화면 아래쪽(SearchAi 위 12px 선) 아래로 걸치면 그 순간 SearchAi 위 88px 에 ∨ 가 뜬다
    const armKnobEarly = (el) => {
      const K = variant('knob'); if (!el || !K || K === 'off' || variant('knobtime') !== 'T0') return
      const root = rootRef.current.getBoundingClientRect(), k = root.width / SCREEN_W || 1
      const elBottom = (el.getBoundingClientRect().bottom - root.top) / k
      if (elBottom > SCREEN_H - SEARCH_BOTTOM - 52 - 12) { setKnobBase('search'); setKnobUp(false); setKnob(true) }
    }
    const armKnob = async (el) => {
      knobOverRef.current = 0
      const K = variant('knob'); if (!el || !K || K === 'off' || !sheetRef.current) return false
      await new Promise(afterLayout); if (!alive()) return false          // 시트 내용이 그려진 뒤 높이를 잰다 (아직 화면 밖)
      const root = rootRef.current.getBoundingClientRect(), k = root.width / SCREEN_W || 1
      const h = sheetRef.current.offsetHeight, finalTop = SCREEN_H - 20 - h
      const elBottom = (el.getBoundingClientRect().bottom - root.top) / k
      const over = elBottom - finalTop + 8                                 // 응답 하단이 시트(최종 자리) 상단 아래로 들어갈 만큼
      const KT = variant('knobtime')
      if (over <= 0) { if (KT === 'T0') setKnob(false); return false }
      knobOverRef.current = over; setSheetH(h); setKnobUp(false)
      if (KT === 'T0') { setKnobBase('sheet'); setKnob(true) }                 // 이미 떠 있던 ∨ 가 시트와 같은 R-2 로 시트 위로 올라감 (bottom 트랜지션)
      else if (KT === 'T1') setKnob(true)
      else setTimeout(() => { if (alive()) setKnob(true) }, SHEET_MS + (KT === 'T3' ? 500 : 0))
      return true
    }
    const revealHidden = async () => {
      const K = variant('knob'), over = knobOverRef.current
      if (!over || !K || K === 'off') return true
      await wait(650); if (!alive()) return false
      await ptr?.tap(knobRef.current, { move: 380, pause: 110 }); if (!alive()) return false
      ptr?.hide()
      const target = Math.min(scroll.scrollHeight - scroll.clientHeight, scroll.scrollTop + over + SHEET_GAP - 8)
      if (K === 'K1') {
        // K1 채팅이 내려간다 (확정 2026-09-10): 시트는 그대로, 응답 하단이 시트 위 30px 에 올 때까지 채팅을 팬 → ∨ 사라짐
        await scrollTo(scroll, target, 600, QUINT_OUT); if (!alive()) return false
        setKnob(false); await wait(500)
        setKnobBase('search')   // 사라진 뒤 대기 자리(SearchAi 위)로 — 다음 턴에 제자리에서 페이드만 하도록
      } else if (K === 'K2') {
        setSheetFold(true); setKnobUp(true)
        await wait(SHEET_MS + 1100); if (!alive()) return false
        await ptr?.tap(knobRef.current, { move: 300, pause: 110 }); if (!alive()) return false
        ptr?.hide(); setSheetFold(false); setKnobUp(false); setKnob(false)
        await wait(SHEET_MS + 100)
      } else {
        setKnob(false); setSheetAway(true)
        await wait(400); if (!alive()) return false
        await scrollTo(scroll, target, 600, QUINT_OUT); if (!alive()) return false
        await wait(1200); if (!alive()) return false
        setSheetAway(false); await wait(SHEET_MS + 100)
      }
      knobOverRef.current = 0
      return alive()
    }
    /* ── 시트 × → 어떻게 다시 돌아오나 (Figma ixGPs9 234:92897, 사용자 2026-09-11). html[data-simx] ──
       S1 대화에 칩: 시트가 내려가고 안내문 아래에 [개통 방법 선택하기] 칩이 남는다 → 탭 → 칩이 사라지고 '이어서 진행할게요.' → 시트 복귀 (Figma 그대로)
       S2 제자리 접힘: 시트가 제목 줄(68px)만 남기고 바닥에 접힌다 → 제목 줄 탭 → 다시 펼쳐짐. 대화에는 아무것도 남지 않음
       S3 입력창 위 알약: 시트는 완전히 내려가고 SearchAi 위 12px 에 복귀 알약이 떠 있는다 → 탭 → 시트 복귀. 대화 흐름을 건드리지 않음 */
    const sheetDetour = async (i, el, msg) => {
      const t = TURNS[i], S = variant('simx') || 'off', T = rv()
      if (!t.xchip || S === 'off' || reducedMotion()) return true
      await wait(SHEET_HOLD); if (!alive()) return false
      await ptr?.tap(sheetRef.current?.querySelector('.hd .x'), { move: 420, pause: 120 }); if (!alive()) return false
      if (S === 'S2') {
        setSheetFold(true); await wait(900); if (!alive()) return false
        await ptr?.tap(sheetRef.current?.querySelector('.hd'), { move: 380, pause: 120 }); if (!alive()) return false
        setSheetFold(false); ptr?.hide(); await wait(SHEET_MS); return alive()
      }
      ptr?.hide(); await closeSheet(); if (!alive()) return false
      if (S === 'S3') {
        setXpill(true); await wait(480); if (!alive()) return false
        await ptr?.tap(xpillRef.current?.firstElementChild, { move: 420, pause: 120 }); if (!alive()) return false
        setXpill(false); ptr?.hide(); await wait(300); if (!alive()) return false
        await openSheet(i, msg); return alive()
      }
      const chip = el.querySelector('.x-chip'), xmsg = el.querySelector('.x-msg')
      reveal(chip); await follow(chip); if (!alive()) return false
      await wait(500); if (!alive()) return false
      await ptr?.tap(chip.firstElementChild, { move: 420, pause: 120 }); if (!alive()) return false
      ptr?.hide(); chip.classList.add('gone'); await wait(320); if (!alive()) return false
      chip.style.display = 'none'
      reveal(xmsg); await follow(xmsg); if (!alive()) return false
      await wait(T.text); if (!alive()) return false
      await openSheet(i, xmsg); return alive()
    }
    const pickInSheet = async (row) => {
      await wait(SHEET_HOLD); if (!alive()) return false
      const el = sheetRef.current.querySelectorAll('.plan-row')[row], sh = sheetRef.current
      // 커버 모달(C1)은 높이가 고정이라 아래 행이 잘릴 수 있다 → 시트 안을 살짝 스크롤해 행을 드러낸 뒤 탭
      const over = el.offsetTop + el.offsetHeight - (sh.scrollTop + sh.clientHeight) + 20
      if (over > 0) { await scrollTo(sh, sh.scrollTop + over, 500); if (!alive()) return false; await wait(120) }
      await ptr?.tap(el, { move: 420, pause: 120 }); if (!alive()) return false
      setSheetPick(row); await wait(480); if (!alive()) return false
      ptr?.hide(); await closeSheet(); return alive()
    }
    // 한 턴: 생각 점 → 안내(1~2) → 팬 → 시트 → 고르기 → 결과 카드 → 팬
    const playTurn = async (i) => {
      const t = TURNS[i], el = turnEls[i], ks = kids(el), [msg1, msg2, result] = ks.length === 3 ? ks : [ks[0], null, ks[1]]
      el.classList.add('on'); void el.offsetHeight
      setTail(topAnchor() ? SCREEN_H : 420)
      if (!await dots(el, prevResult(i))) return false
      reveal(msg1); await follow(msg1); if (!alive()) return false
      await wait(T.text); if (!alive()) return false
      if (msg2) { reveal(msg2); await follow(msg2); if (!alive()) return false; await wait(T.text); if (!alive()) return false }
      armKnobEarly(msg2 || msg1)
      setHead(t.k, t.label)
      await openSheet(i, msg2 || msg1); if (!alive()) return false
      if (!await revealHidden()) return false
      if (!await sheetDetour(i, el, msg2 || msg1)) return false
      if (!await pickInSheet(t.pick)) return false
      setPicks((p) => p.map((v, j) => (j === i ? t.pick : v)))
      reveal(result); await wait(150); if (!alive()) return false
      await follow(result); if (!alive()) return false
      if (!topAnchor()) setTail(TAIL)   // 상단 앵커 모드는 다음 턴을 시작선까지 올릴 여유(tail)를 유지
      await wait(T.tail); return alive()
    }

    // ── 스테이지별 재생 ──
    const playUsage = async () => {
      resetAll()
      const [bubble, opening, msg1, curCard, msg2, recCard] = s5
      reveal(bubble); await wait(T.bubble); if (!alive()) return
      reveal(opening); await wait(T.hold); if (!alive()) return          // 3안처럼 화면은 멈춘 채 말풍선 아래에 타이틀 (팬하면 말풍선이 헤더 뒤로 '쓕' 밀림 — 사용자 2026-09-08)
      await collapseOpening(openingRef.current); if (!alive()) return
      await wait(T.settle); if (!alive()) return
      reveal(msg1); await wait(T.text + 600); if (!alive()) return
      reveal(curCard); await wait(T.card + 300); if (!alive()) return
      reveal(msg2); await follow(msg2); if (!alive()) return
      if (recCard) {   // Figma 210:124536: 추천 요금제 카드가 대화 안에 뜬다 (모달에는 카드 없음)
        await wait(T.text + 200); if (!alive()) return
        reveal(recCard); await follow(recCard); if (!alive()) return
        await wait(T.card); if (!alive()) return
        armKnobEarly(recCard)                                                // T0: 카드가 바닥에 걸치면 ∨ 먼저
        await wait(900); if (!alive()) return
      } else { await wait(1800); if (!alive()) return }                 // 추천 문장 읽는 시간
      setTail(topAnchor() ? SCREEN_H : 420)
      await openSheet('plan', recCard || msg2); if (!alive()) return      // old: 추천 요금제 1장 + [전체보기] (96:41100) / 새 흐름: "추천된 요금제를 선택하실래요?" 네 · 다른 요금제 살펴보기 (210:122803)
      if (!await revealHidden()) return                    // 카드가 모달 뒤에 숨었으면 ∨ 로 드러낸다
      await wait(SHEET_HOLD + 200); if (!alive()) return
      // [전체보기]/[다른 요금제 살펴보기] 탭 → 모달이 내려가고 전체 요금제 팝업 → 라이트 탭 둘러보기(B-2) → 첫 카드 → [적용하기] → 팝업 내려감 → 대화에 결과 말풍선 (사용자 2026-09-08: 스텝 4 안에서)
      await ptr?.tap(moreRef.current, { move: 420, pause: 120 }); if (!alive()) return
      ptr?.hide(); await closeSheet(); if (!alive()) return
      setPop(true); await wait(SHEET_MS + 150); if (!alive()) return
      const tabs = popRef.current.querySelectorAll('.tabs span')
      await ptr?.tap(tabs[1], { pause: 120 }); setPopTab(1); if (!alive()) return
      await wait(1000); if (!alive()) return
      await ptr?.tap(tabs[0], { move: 400, pause: 120 }); setPopTab(0); if (!alive()) return
      await wait(500); if (!alive()) return
      await ptr?.tap(popRef.current.querySelectorAll('.plan-mini')[0]); if (!alive()) return
      setPopSel(0); await wait(500); if (!alive()) return
      await ptr?.tap(applyRef.current, { move: 450, pause: 140 }); if (!alive()) return
      ptr?.hide(); setPop(false); await wait(SHEET_MS); if (!alive()) return
      if (recCard && recflow === 'P2') { await retireRec(); if (!alive()) return }
      if (recCard && recflow === 'P3') { setRecSel(true); await wait(350); if (!alive()) return }
      const res = planResRef.current
      res.classList.add('on'); void res.offsetHeight
      reveal(res); await wait(150); if (!alive()) return
      await follow(res); if (!alive()) return
      if (!topAnchor()) setTail(TAIL)
      await showNextChip()
    }
    const playTurns = async (idx) => { for (const i of idx) { if (!await playTurn(i)) return false } return true }
    // 사용자 탭 모드: 스텝 끝에 [이어서 진행하기] 칩 → 탭 → 다음 스텝. 다음 스텝이 시작되면 칩은 사라진다
    const showNextChip = async () => {
      const w = nextChipRef.current; if (!userTap() || !w) return
      w.classList.add('on'); void w.offsetHeight
      await wait(60); if (!alive()) return
      await follow(w); if (!alive()) return
      ptr?.park(w.firstElementChild, 0, '이어서')
    }
    const hideNextChip = () => nextChipRef.current?.classList.remove('on')
    const playDone = async () => {
      // 완료 안내 → '고객 정보 조회 중' 타이틀(내 정보 조회 턴이라 타이틀 있음) → 접힘 → 안내 → 가입자 정보 카드 → [신청서 작성하기] 대기
      const el = doneRef.current, [msg, opening, msg2, card, chipWrap] = kids(el)
      el.classList.add('on'); void el.offsetHeight
      setTail(topAnchor() ? SCREEN_H : 420)
      if (!await dots(el, prevResult(TURNS.length))) return
      reveal(msg); await follow(msg); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(opening); await follow(opening); if (!alive()) return
      await wait(T.hold2); if (!alive()) return
      await collapseOpening(opening); if (!alive()) return
      await wait(T.settle); if (!alive()) return
      reveal(msg2); await follow(msg2); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(card); await follow(card); if (!alive()) return
      await wait(T.card); if (!alive()) return
      reveal(chipWrap); await follow(chipWrap); if (!alive()) return
      if (!topAnchor()) setTail(TAIL)
      ptr?.park(doneChipRef.current, 450, '탭')
    }

    const forward = STAGES.indexOf(prev) === STAGES.indexOf(stage) - 1
    hideNextChip()
    if (prev === null && stage === 'usage' && !reduced) { playUsage(); return cancel }
    if (!forward || reduced) {
      settle()
      if (userTap()) setTimeout(() => { if (!alive()) return; if (stage === 'pay') ptr?.park(doneChipRef.current, 0); else showNextChip() }, 650)
      return cancel
    }
    ;(async () => {
      // 이전 스테이지가 아직 재생 중이었다면(빨리 넘김) 그 최종 상태를 먼저 깔아 둔다 — 결과 말풍선이 다음 턴의 앵커라서 없으면 시작선 계산이 0 이 됨
      finalUsage(); finalPlan()
      for (const t of turnsUpTo(prev)) finalTurn(t)
      await new Promise(afterLayout); if (!alive()) return
      if (stage === 'pay') { if (await playTurns(STAGE_TURNS.pay)) await playDone(); return }
      if (await playTurns(STAGE_TURNS[stage])) await showNextChip()
    })()
    return cancel
  }, [stage])

  const sheetTurn = typeof shown === 'number' ? TURNS[shown] : null
  return (
    <div className={`ai-screen ai2 ${sheet !== null ? 's2open' : ''}`} ref={rootRef}>
      <AgentBackground />
      <div className="ai-header-fixed">
        <AgentBackground />
        <StatusBar />
        <AppbarAi chip={CHIP_DEFAULT} k={optK} n={OPTIONS.length} label={optLabel || undefined} />
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        <UserMessage className="s5">이용 현황에 맞춰서 적합한 요금제 추천해줘</UserMessage>
        <Opening className="first s5" innerRef={openingRef} status="이용 현황 조회중" title={<>최근 6개월 이용 현황을<br />먼저 살펴볼게요</>} />
        <AiMessage className="s5">{USAGE_MSG_1}</AiMessage>
        <Card className="s5">
          <span className="badge">이용중 요금제</span>
          <div className="cell-desc">0 청년 69</div>
          <div className="cell-title">월 62,800원</div>
          <div className="cell-desc">데이터 20GB・통화 무제한・문자 무제한</div>
          <BenefitBadges />
        </Card>
        <AiMessage className="s5">{USAGE_MSG_2}</AiMessage>
        {recflow !== 'old' && <div className="s5 rec-wrap" ref={recRef}><PlanMini pl={REC} className={`in-chat ${recSel ? 'sel' : ''}`} /></div>}   {/* 추천 요금제 카드 — 대화 안 (Figma 210:122773) */}

        {/* 요금제 적용 결과 카드 (Figma 96:40978) — 스텝 4 끝 */}
        <div className="turn2 plan-res" ref={planResRef}>
          <AnswerBubble q={PLAN_SHEET_TITLE} a={REC.name} />
        </div>

        {/* 시트로 고르는 턴들: 생각 점 → 안내 → (시트) → 고른 결과 한 줄 */}
        {TURNS.map((t, i) => (
          <div className="turn2" key={t.id} ref={(el) => { turnRefs.current[i] = el }}>
            <Thinking />
            {t.msgs.map((m, j) => <AiMessage key={j}>{m.split('\n').map((l, k) => <span key={k}>{k > 0 && <br />}{l}</span>)}</AiMessage>)}
            {/* 시트 × → 복귀 시안 S-1 (Figma 234:92897): 안내문 아래 칩 → 탭 → 칩이 사라지고 '이어서 진행할게요.' → 시트 복귀 */}
            {t.xchip && <div className="cta-stack xdetour x-chip"><div className="button-ai">{t.xchip}</div></div>}
            {t.xmsg && <p className="msg-ai xdetour x-msg">{t.xmsg}</p>}
            <div className="t2-result">
              {picks[i] >= 0 && <AnswerBubble q={t.sheet} a={t.rows[picks[i]][0]} />}
            </div>
          </div>
        ))}
        <div className="turn2 done2" ref={doneRef}>
          <Thinking />
          <AiMessage>{PRE_MSG}</AiMessage>
          <Opening status="고객 정보 조회 중" title={<>고객님의 정보를<br />조회하고 있어요</>} />
          <AiMessage>{PRE_MSG2[0]}<br />{PRE_MSG2[1]}</AiMessage>
          <Card className="review-card">
            <h3>가입자 정보</h3>
            <div className="kv-list">{PRE_ROWS.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
          </Card>
          <div className="cta-stack"><div className="button-ai" ref={doneChipRef}>{PRE_CHIP}</div></div>
        </div>
        <div className="cta-stack next-chip" ref={nextChipRef}><div className="button-ai">이어서 진행하기</div></div>
        <div ref={tailRef} style={{ height: TAIL, flex: 'none' }} />
      </div>

      <div className="bottom-fade" aria-hidden />
      <div className="kb-scrim" aria-hidden />
      <SearchAi style={{ bottom: SEARCH_BOTTOM }} />
      <Keyboard slide open={false} />
      <HomeIndicator />

      {/* 바텀 모달 (AiAgentBottomSheet 96:41834): 딤 + 시트. 요금제 = 추천 1장 + [더보기], 나머지 = RadioCard 행 */}
      <div className={`ai-sheet-dim s2dim ${sheet !== null ? 'on' : ''}`} aria-hidden />
      <div className={`s2knob ${knob ? 'on' : ''} ${knobUp ? 'up' : ''} base-${knobBase}`} ref={knobRef} style={{ '--sheet-h': `${sheetH}px` }} aria-label="가려진 내용 보기"><i /></div>
      {/* 시트 × → 복귀 시안 S-3: 대화가 아니라 SearchAi 위 12px 에 뜨는 복귀 알약 */}
      <div className={`s2xpill ${xpill ? 'on' : ''}`} ref={xpillRef}><div className="button-ai">개통 방법 선택하기</div></div>
      <div className={`sheet2 ${sheet !== null ? 'on' : ''} ${out !== null ? 'out' : ''} ${sheetFold ? 'fold' : ''} ${sheetAway ? 'away' : ''}`} ref={sheetRef} aria-hidden={sheet === null}>
        <div className="hd"><h3>{shown === 'plan' ? (recflow === 'old' ? PLAN_SHEET_TITLE : REC_SHEET_TITLE) : sheetTurn?.sheet}</h3><i className="x" /></div>
        {shown === 'plan' && recflow === 'old' && (<>
          <PlanMini pl={REC} className="in-sheet" />
          <div className="more-btn" ref={moreRef}>전체보기</div>
        </>)}
        {shown === 'plan' && recflow !== 'old' && (
          /* AiAgentBottomSheetItem ×2 (Figma 210:122803): 16/22 medium, 간격 12. 두 번째가 포인터의 탭 대상 */
          <div className="choice">{REC_CHOICES.map((c, i) => <div className="ai-sheet-item" key={c} ref={i === 1 ? moreRef : undefined}>{c}</div>)}</div>
        )}
        {sheetTurn && (
          <div className="rows">
            {sheetTurn.rows.map(([n, d, r], j) => <PlanRow key={j} name={n} desc={d || undefined} price={r} sel={sheetPick === j} icon={sheetTurn.icon} />)}
          </div>
        )}
      </div>

      {/* 전체 요금제 팝업 — 3안 스텝 5 와 같은 화면 (Figma 96:41892 → 96:41903) */}
      <div className={`sheet ${pop ? 'on' : ''}`} ref={popRef}>
        <StatusBar className="pop-status" />
        <div className="appbar"><h3>{PLAN_SHEET_TITLE.replace(/\.$/, '')}</h3><i className="x" /></div>
        <div className="tabs">{SHEET_TABS.map((t, i) => <span className={i === popTab ? 'on' : ''} key={t}>{t}</span>)}</div>
        <div className="list" key={popTab}>
          {(popTab === 1 ? POP_PLANS_LIGHT : POP_PLANS).map((pl, i) => <PlanMini key={pl.name} pl={pl} sel={popSel === i && popTab === 0} />)}
        </div>
        <div className="ft">
          <div className="row"><span>선택한 요금제</span><b>{popSel >= 0 ? POP_PLANS[popSel].name : ''}</b></div>
          <div className={`apply ${popSel >= 0 ? 'ready' : ''}`} ref={applyRef}>적용하기</div>
        </div>
      </div>
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}
