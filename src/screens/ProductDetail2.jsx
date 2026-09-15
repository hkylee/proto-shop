import { useEffect, useRef, useState } from 'react'
import Pointer, { userTap } from '../components/pointer.js'
import { IcoSparkleAi, IcoBack } from '../components/Icons.jsx'
import { StatusBar } from './AgentShell.jsx'
import { PlanCard } from './AgentChat.jsx'
import { variant } from '../lib/variants.js'
import { wait, scrollTo, inOut, inOutSine, cubicOut, outExpo, tween, restart, reducedMotion } from '../lib/motion.js'
import './product2.css'

/* 상품 상세 Step 1·2 (Figma T1mhlbfql60C88mfLqCHNv 10547:16625, 360 → 393 환산 ×1.0917)
   전부 HTML 로 직접 구현 (PNG 사용 안 함, 기기 사진만 원본 해상도 크롭). 자동 시퀀스가 탭하는 섹션은 상태를 가진다.
   stage 'top'     : 진입 직후, 미선택
   stage 'options' : 자동 시퀀스 뒤 "요금제를 선택해 주세요" 섹션에서 정지, 포인터는 좌하단 AI 버튼 위 대기 (기존 규칙)
   시퀀스 시안 html[data-pdflow]:
     P1 직접 둘러보기 : [직접 둘러볼게요] 탭 → 색상·용량·수령·납부·사용자·가입을 차례로 탭 → 요금제
     P2 AI 조합 수락  : [이 옵션으로 진행할게요] 탭 → 옵션이 한 번에 채워지고 아래로 길게 팬 → 요금제
     P3 중간 아코디언 : 색상·용량만 직접 → "그간의 가입 이력…" 아코디언 탭해 펼침 → [이 옵션으로 진행할게요] → 나머지 자동 → 요금제 */

export const px = (v) => Math.round(v * 393 / 360)
export const SEC_PAD = 24
export const anchorSec = (el) => el.offsetTop - SEC_PAD
/* 요금제 카드를 옆으로 밀어 보다가 Agent 를 부른다 (1·2안 공통, 사용자 2026-09-15). 시안 html[data-planswipe]
   W1 끝까지 밀어 보고 좌하단 AI 버튼 / W2 캐러셀 끝의 [AI 에게 추천받기] 카드 / W3 한 장 밀고 머물면 떠오르는 힌트 */
const PLAN_AI_TITLE = 'AI 에게 추천받기', PLAN_AI_DESC = '이용 현황을 보고 맞는 요금제를 골라드려요'
const PLAN_HINT = '어떤 요금제가 맞을지 물어볼까요?'

export const NAME = '하경'
export const COLORS = [
  { name: '핑크', hex: '#D8CDE6', cap: '품절' },
  { name: '크림', hex: '#F1EBDD' },
  { name: '그라파이트', hex: '#3F4147' },
]
export const STORAGE = [
  { t: '256G', d: '약 5만 장의 사진을 저장할 수 있어요', r: '1,684,000 원' },
  { t: '512G', d: '약 10만 장의 사진을 저장할 수 있어요', r: '1,936,000 원' },
  { t: '1T', d: '약 20만 장의 사진을 저장할 수 있어요', r: '2,557,500 원' },
]
export const DELIVERY = [
  { t: '바로도착', d: '평일 18시까지 주문 시 원하는 시간에 배송해드려요' },
  { t: '행복배송', d: '월~금 3시까지 주문 시 전문가가 개통까지 도와드려요' },
  { t: '일반배송', d: '월~토 14시까지 주문 시 다음날 배송해 드려요' },
  { t: '바로픽업', d: '주문하고 가까운 대리점에서 바로 찾아갈래요' },
]
export const TERMS = ['12개월', '24개월', '30개월', '일시불', '6개월', '18개월', '36개월', '48개월']
export const USER = [
  { t: '제가 사용할 휴대폰이에요', d: '가입자(본인)의 정보만 있으면 돼요' },
  { t: '다른 사람이 사용할 휴대폰이에요', d: '주문하시는 분의 정보를 함께 확인해주세요' },
]
export const JOIN = [
  { t: '신규가입', d: 'SKT에 새 번호로 가입하고 싶어요.' },
  { t: '번호이동', d: '지금 번호 그대로, 다른 통신사에서 SKT로 옮기고 싶어요.' },
  { t: '기기변경', d: '지금 번호 그대로, 기기만 바꾸고 싶어요.' },
]
// AI 조합 카드 내용 (Figma 10547:16632). 요금제 행은 Agent 가 도울 영역이므로 '미정' 으로 두었다 (Figma 는 5GX 플래티넘)
export const COMBO = [
  ['기기 옵션', [['색상', '그라파이트'], ['용량', '512G']]],
  ['이용 옵션', [['할부 기간', '24개월'], ['요금제', '미정 · Agent 추천'], ['할인 방법', '약정 24개월'], ['SIM 유형', 'USIM']]],
  ['혜택 옵션', [['T 기프트', '정품케이스 + 25W 충전기'], ['티다팩', '올리브영 월 10,000원 쿠폰']]],
]
export const AI_TEXT = `30대 데이터 헤비유저 ${NAME}님에게 가장 잘 어울리는 조합이 있어요. 최근 3개월 데이터를 초과 사용한 분께 특히 유리한 조합이에요.`

// 선택 결과 (시퀀스가 채우는 값). AI 조합 = P2·P3 가 한 번에 채우는 값
const NONE = { color: -1, storage: -1, delivery: -1, term: -1, user: -1, join: -1 }
const PICKED = { color: 2, storage: 1, delivery: 0, term: 1, user: 0, join: 2 }

// ── 요금제 이후 섹션 (Figma 스크린샷 구간을 HTML 로 재구성 · PNG 사용 안 함) ──
export const SIM = [
  { t: 'eSIM', d: '칩 없이 QR로 바로 개통해요', r: '3,000원' },
  { t: '새 USIM 구매', d: '택배로 받아 이후면 바로 개통해요', r: '3,000원' },
  { t: '가지고 있는 USIM 사용', d: '쓰던 USIM을 그대로 사용해요', r: '3,000원' },
]
export const GIFTS = [   // Figma ixGPs9 71:67237 — 실제 사은품 이미지(공기청정기 · 이어버드) 2종 교차
  { brand: '알로', name: 'NEW 휴대용 미니 공기청정기 allo AP500', img: '/screens/pd2/gift1.png' },
  { brand: '삼성', name: '갤럭시 버즈4 프로', img: '/screens/pd2/gift2.png' },
  { brand: '알로', name: 'NEW 휴대용 미니 공기청정기 allo AP500', img: '/screens/pd2/gift1.png' },
  { brand: '삼성', name: '갤럭시 버즈4 프로', img: '/screens/pd2/gift2.png' },
]
export const COUPONS = [
  { l: 'D', bg: '#E0353A', t: '다이소', d: '매월 10,000원' },
  { l: 'M', bg: '#111', t: '무신사머니', d: '매월 10,000원' },
  { l: 'O', bg: '#8DBF3A', t: '올리브영', d: '매월 10,000원' },
  { t: '티다팩을 받지 않을게요' },
]
export const TRADEIN = [
  { t: '바로보상을 이용하지 않을게요', d: '쓰던 휴대폰을 반납 없이 진행해요' },
  { t: '네, 보상금액을 알아볼게요', d: '쓰던 휴대폰 모델과 상태를 확인해요' },
]
export const INSURANCE = [
  { badge: '많이 선택했어요', t: 'T ALL케어+ 5', pct: '15%', r: '8,900 원/월', d: '분실·파손 최대 200만원 보상 · 연 2회 · 자기부담금 30%' },
  { t: 'T ALL케어+ 5', pct: '15%', r: '8,900 원/월', d: '분실·파손 최대 200만원 보상 · 연 2회 · 자기부담금 30%' },
  { t: '보험 없이 진행할게요' },
]
export const SERVICES = [
  { l: 'W', bg: '#1A50FF', s: 'Wavve 무제한 감상 + 매달 데이터 300GB', t: 'Wavve 앤 데이터', r: '9,900 원/월' },
  { l: 'F', bg: '#3C4CFF', s: 'FLO 음악 무제한 감상 + 매달 데이터 3GB', t: 'Wavve 앤 데이터', r: '9,900 원/월' },
  { l: 'V', bg: '#111', s: '전화 걸 때 영상·이미지로 나를 표현', t: 'V 컬러링', r: '9,900 원/월' },
  { t: '부가서비스 없이 진행할게요' },
]
export const CARD_NOTE = '· 제휴카드 구매 후 14일 안에 T 다이렉트샵 고객센터를 통해 발급된 카드 정보를 등록해야 합니다.\n· 14일 이내로 카드 정보 미등록 시 예상 납부 금액과 실제 납부 금액이 다를 수 있습니다.'

function RadioCard({ t, d, r, selected, innerRef }) {
  return (
    <div className={`radio-card ${selected ? 'sel' : ''}`} ref={innerRef}>
      <div className="txt"><div className="t">{t}</div>{d && <div className="d">{d}</div>}</div>
      {r && <div className="r">{r}</div>}
    </div>
  )
}
function Section({ title, link, desc, children, refEl }) {
  return (
    <section className="pd2-sec" ref={refEl}>
      <div className="head"><h2>{title}</h2>{link && <span className="link">{link}</span>}</div>
      {desc && <p className="sdesc">{desc}</p>}
      {children}
    </section>
  )
}
export const Logo = ({ l, bg }) => <i className="logo" style={{ background: bg }}>{l}</i>
export function ComboRows() {
  return (
    <div className="combo-rows">
      {COMBO.map(([g, rows], gi) => (
        <div className="grp" key={g}>
          {gi > 0 && <div className="divider" />}
          <div className="gname">{g}</div>
          {rows.map(([k, v]) => <div className="row" key={k}><span>{k}</span><b className={v.startsWith('미정') ? 'tbd' : ''}>{v}</b></div>)}
        </div>
      ))}
    </div>
  )
}

export default function ProductDetail2({ stage = 'top' }) {
  const rootRef = useRef(null), scrollRef = useRef(null), ptrLayerRef = useRef(null), ptrRef = useRef(null)
  const aiBtnRef = useRef(null), goBtnRef = useRef(null), browseRef = useRef(null), accRef = useRef(null), accGoRef = useRef(null)
  const comboRef = useRef(null)   // E-3: 지나칠 때 물러나는 AI 조합 카드
  const carRef = useRef(null), planAiRef = useRef(null), planHintRef = useRef(null)   // 요금제 캐러셀 · W2 출구 카드 · W3 힌트
  const [planHint, setPlanHint] = useState(false)
  const secs = { color: useRef(null), storage: useRef(null), delivery: useRef(null), term: useRef(null), acc: useRef(null), user: useRef(null), join: useRef(null), plan: useRef(null) }
  const picked = stage === 'options'
  const [sel, setSel] = useState(() => (picked ? PICKED : NONE))
  const [accOpen, setAccOpen] = useState(false)
  const [comboOn, setComboOn] = useState(false)   // AI 조합 적용됨 (버튼 라벨 전환)
  const prevRef = useRef(null), seqRef = useRef(0)

  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])

  // 2→3: App 이 'ai-tap' 을 보내면 좌하단 AI 버튼을 탭 (이어서 LaunchOverlay 가 덮는다)
  useEffect(() => {
    const onTap = async () => {
      const X = variant('planexit')
      const btn = (X === 'card' ? planAiRef.current : X === 'hint' ? planHintRef.current : null) || aiBtnRef.current
      if (!btn) return
      restart(btn, 'tapped')
      await ptrRef.current?.press(btn)
      ptrRef.current?.hide()
    }
    window.addEventListener('ai-tap', onTap)
    return () => window.removeEventListener('ai-tap', onTap)
  }, [])

  useEffect(() => {
    const el = scrollRef.current, ptr = ptrRef.current
    if (!el) return
    const seq = ++seqRef.current, alive = () => seq === seqRef.current
    const cancel = () => { seqRef.current++ }
    const flow = variant('pdflow')
    const pick = (k) => setSel((s) => ({ ...s, [k]: PICKED[k] }))
    /* ── 요금제 카드를 옆으로 밀어 보다가 Agent 를 부른다 (html[data-planswipe], 1·2안 공통 · 사용자 2026-09-15)
       손가락이 캐러셀을 잡고 왼쪽으로 끌면 카드가 1:1 로 따라오고, 놓으면 다음 카드에 스냅된다 — 세로 스와이프(H-3)와 같은 언어 */
    const cardX = (i) => { const c = carRef.current?.children; return c?.[i] ? c[i].offsetLeft - c[0].offsetLeft : 0 }
    const swipePlans = async (to, { dur = 600, ease = cubicOut, coast = 0, coastDur = 0, x0 = .8, x1 = .22, hold = false } = {}) => {
      const car = carRef.current
      if (!car) return alive()
      if (!ptr) { car.scrollLeft = to; return alive() }
      const r = ptr.rectOf(car), cy = r.y + r.h * .5, from = car.scrollLeft, dragTo = to + coast
      await ptr.moveXY(r.x + r.w * x0, cy, 300); if (!alive()) return false
      car.style.scrollSnapType = 'none'          // mandatory 스냅은 프로그램 스크롤도 매 프레임 끌어당겨 끌리는 동안 그림이 안 나온다 — 손을 뗄 때 다시 켠다
      ptr.hold(); await wait(70)
      await Promise.all([
        tween(dur, (e) => { car.scrollLeft = from + (dragTo - from) * e }, ease),
        tween(dur, (e) => ptr.setXY(r.x + r.w * (x0 + (x1 - x0) * e), cy), ease),
      ]); if (!alive()) return false
      ptr.release()
      if (coast) { await tween(coastDur, (e) => { car.scrollLeft = dragTo + (to - dragTo) * e }, outExpo); if (!alive()) return false }
      car.scrollLeft = to
      if (!hold) car.style.scrollSnapType = ''   // hold: 스냅을 켜면 그 자리에서 끌려가 버린다 (엿보기처럼 중간에 멈춰 있어야 할 때)
      return alive()
    }
    /* 미는 동작 3안 (html[data-planswipe])
       S1 한 장씩 또박또박: 카드 폭만큼 끌고 놓으면 스냅. 카드마다 0.34s 머문다 (세로 H-2 와 같은 언어)
       S2 한 번에 훑고 안착: 한 번 길게 끌어 지나치고 관성으로 흘러 마지막 카드에 고무줄 안착
       S3 반쯤 엿보고 되돌아왔다 다시: 절반만 밀었다 놓아 되돌아오고(망설임) 한 박자 뒤 끝까지 */
    const browsePlans = async () => {
      const W = variant('planswipe')
      if (W === 'off') return alive()
      const last = variant('planexit') === 'card' ? 3 : 2      // 출구 카드가 있으면 그 카드까지
      await wait(520); if (!alive()) return false
      if (variant('planexit') === 'hint') {
        if (!await swipePlans(cardX(1), { dur: 720, ease: inOutSine, coast: -14, coastDur: 380 })) return false
        ptr?.hide(); await wait(760); if (!alive()) return false
        setPlanHint(true); await wait(620); return alive()
      }
      if (W === 'S2') {
        // 한 번에 훑기: 손가락이 화면 밖까지 길게 끌고, 놓은 뒤 남은 거리를 관성으로. 끝에서 살짝 넘겼다 되돌아온다
        if (!await swipePlans(cardX(last), { dur: 760, ease: cubicOut, coast: 46, coastDur: 620, x0: .92, x1: .06 })) return false
        await wait(560); if (!alive()) return false
      } else if (W === 'S3') {
        // 엿보기: 다음 카드를 절반만 당겼다 놓으면 원래 자리로 되돌아온다
        const peek = cardX(1) * .46
        if (!await swipePlans(peek, { dur: 560, ease: inOutSine, x0: .8, x1: .46, hold: true })) return false
        await wait(260); if (!alive()) return false
        const back = carRef.current
        await tween(420, (e) => { if (back) back.scrollLeft = peek * (1 - e) }, outExpo); if (!alive()) return false
        if (back) { back.scrollLeft = 0; back.style.scrollSnapType = '' }
        ptr?.hide(); await wait(520); if (!alive()) return false
        for (let i = 1; i <= last; i++) {
          if (!await swipePlans(cardX(i), { dur: i === last ? 700 : 520, coast: 12, coastDur: 300 })) return false
          await wait(i === last ? 520 : 300); if (!alive()) return false
        }
      } else {
        for (let i = 1; i <= last; i++) {
          if (!await swipePlans(cardX(i), { dur: i === last ? 700 : 560, coast: 12, coastDur: 320 })) return false
          await wait(i === last ? 520 : 340); if (!alive()) return false
        }
      }
      ptr?.hide(); return alive()
    }
    // 스텝 끝 대기 = 다음 탭 자리. 사용자 탭 모드면 여기서 탭해야 다음 스텝
    const parkAi = () => {
      const X = variant('planexit')
      const t = (X === 'card' ? planAiRef.current : X === 'hint' ? planHintRef.current : null) || aiBtnRef.current
      ptr?.park(t, 520, 'AI Agent 실행')
    }
    const finish = async () => {
      await scrollTo(el, anchorSec(secs.plan.current), 800, inOut); if (!alive()) return
      if (!await browsePlans()) return
      parkAi()
    }
    /* 옵션 영역으로 들어가는 방식 (html[data-pdenter], 사용자 2026-09-11 "버튼 선택 안 하고 그냥 스크롤 내려서 컬러 영역으로")
       off 기존([직접 둘러볼게요] 탭) / E1 바로 지나쳐 색상까지 / E2 조합 카드를 한 번 훑고 지나감 / E3 지나치며 조합 카드가 물러남 */
    const enterOptions = async () => {
      const E = variant('pdenter') || 'off'
      comboRef.current?.classList.remove('passed')
      if (E === 'off') {
        await scrollTo(el, browseRef.current.offsetTop - 500, 500, inOut); if (!alive()) return false
        await ptr?.tap(browseRef.current, { move: 350, pause: 60 }); return alive()
      }
      const to = anchorSec(secs.color.current)
      ptr?.hide()
      if (E === 'E2') {
        await scrollTo(el, Math.max(0, comboRef.current.offsetTop - 240), 700, inOut); if (!alive()) return false
        await wait(600); if (!alive()) return false
        await scrollTo(el, to, 900, inOut); return alive()
      }
      if (E === 'E3') comboRef.current?.classList.add('passed')
      await scrollTo(el, to, 1400, inOut); return alive()
    }
    const tapIn = async (secRef, selector, key, opts) => {
      await scrollTo(el, anchorSec(secRef.current), 600, inOut); if (!alive()) return false
      await ptr?.tap(secRef.current.querySelector(selector), opts); if (!alive()) return false
      pick(key); await wait(380); return alive()
    }

    if (!picked) { setSel(NONE); setAccOpen(false); setComboOn(false); ptr?.hide(); scrollTo(el, 0, 500, inOut).then(() => { if (alive() && userTap()) ptr?.park(browseRef.current, 400, '직접 둘러보기') }); prevRef.current = 'top'; return cancel }   // 사용자 탭 모드: 스텝 1 의 다음 탭 = [직접 둘러볼게요]
    // 즉시 상태 (2번 직접 진입 · 3→2 복귀)
    if (prevRef.current !== 'top' || reducedMotion()) {
      setSel(PICKED); setComboOn(flow !== 'P1'); setAccOpen(flow === 'P3'); ptr?.hide(); el.scrollTop = anchorSec(secs.plan.current); prevRef.current = 'options'
      const X = variant('planexit')
      if (variant('planswipe') !== 'off') { setPlanHint(X === 'hint'); requestAnimationFrame(() => { if (carRef.current) carRef.current.scrollLeft = cardX(X === 'hint' ? 1 : X === 'card' ? 3 : 2) }) }
      if (userTap()) setTimeout(() => { if (alive()) parkAi() }, 400)
      return cancel
    }
    prevRef.current = 'options'
    ;(async () => {
      await wait(400); if (!alive()) return
      if (flow === 'P2') {
        // AI 조합 수락: 카드 버튼 탭 → 옵션 전부 채워짐(버튼 '적용됐어요') → 채워진 섹션들을 길게 지나 요금제로
        await scrollTo(el, goBtnRef.current.offsetTop - 420, 500, inOut); if (!alive()) return
        await ptr?.tap(goBtnRef.current); if (!alive()) return
        setSel(PICKED); setComboOn(true)
        await wait(700); if (!alive()) return
        await scrollTo(el, anchorSec(secs.plan.current), 2400, inOut); if (!alive()) return
        if (!await browsePlans()) return
        parkAi(); return
      }
      if (flow === 'P3') {
        // 색상·용량은 직접 → 중간 아코디언 → 펼침 → 안의 버튼 탭 → 나머지 자동
        if (!await tapIn(secs.color, '.swatch:nth-child(3)', 'color')) return
        if (!await tapIn(secs.storage, '.radio-card:nth-child(2)', 'storage')) return
        await scrollTo(el, anchorSec(secs.acc.current), 600, inOut); if (!alive()) return
        await ptr?.tap(accRef.current.querySelector('.acc-head')); if (!alive()) return
        setAccOpen(true); await wait(650); if (!alive()) return
        await scrollTo(el, accGoRef.current.offsetTop - 560, 500, inOut); if (!alive()) return
        await ptr?.tap(accGoRef.current); if (!alive()) return
        setSel(PICKED); setComboOn(true); await wait(600); if (!alive()) return
        await scrollTo(el, anchorSec(secs.plan.current), 1600, inOut); if (!alive()) return
        if (!await browsePlans()) return
        parkAi(); return
      }
      // P1 직접 둘러보기 (기존 흐름): 링크 탭 → 섹션마다 탭
      if (!await enterOptions()) return
      if (!await tapIn(secs.color, '.swatch:nth-child(3)', 'color')) return
      if (!await tapIn(secs.storage, '.radio-card:nth-child(2)', 'storage')) return
      if (!await tapIn(secs.delivery, '.radio-card:nth-child(1)', 'delivery')) return
      if (!await tapIn(secs.term, '.term:nth-child(2)', 'term')) return
      if (!await tapIn(secs.user, '.radio-card:nth-child(1)', 'user', { move: 300, pause: 80 })) return
      if (!await tapIn(secs.join, '.radio-card:nth-child(3)', 'join', { move: 300, pause: 80 })) return
      await wait(200); if (!alive()) return
      await finish()
    })()
    return cancel
  }, [picked])

  return (
    <div className="pd pd2" ref={rootRef}>
      <div className="pd2-scroll" ref={scrollRef}>
        {/* 히어로 (Figma 10547:16627): 원본이 622px 스크린샷이라 이미지를 그대로 쓰면 흐릿함 → 텍스트·배지·박스는 HTML, 기기 사진만 원본 해상도로 크롭 */}
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

        {/* AI 조합 카드 (ListProductHorizontal, Figma 10547:16632) */}
        <div className="combo-card" ref={comboRef}>
          <div className="combo-title">{NAME}님의 평소 이용 패턴을<br />바탕으로 최적의 조합을 적용할 수 있어요.</div>
          <div className="ai-note"><span>✦ AI 분석</span><p>{AI_TEXT}</p></div>
          <ComboRows />
          <div className={`btn-primary ${comboOn ? 'done' : ''}`} ref={goBtnRef}>{comboOn ? '옵션이 적용됐어요 ✓' : '이 옵션으로 진행할게요'}</div>
          <div className="btn-text" ref={browseRef}>직접 둘러볼게요</div>
        </div>

        <Section title="어떤 색상이 마음에 드세요?" link="구매 현황 보기" refEl={secs.color}>
          <div className="swatches">
            {COLORS.map((c, i) => (
              <div className={`swatch ${sel.color === i ? 'sel' : ''}`} key={c.name}><i style={{ background: c.hex }} /><span>{c.name}</span>{c.cap && <small>{c.cap}</small>}</div>
            ))}
          </div>
        </Section>
        <Section title="용량은 얼마나 필요하세요?" link="구매 현황 보기" refEl={secs.storage}>
          <div className="stack">{STORAGE.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.storage === i} />)}</div>
        </Section>
        <Section title="휴대폰은 어떻게 받으시겠어요?" refEl={secs.delivery}>
          <div className="stack">{DELIVERY.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.delivery === i} />)}</div>
        </Section>
        <Section title="단말기는 몇 달 동안 납부할까요?" refEl={secs.term}>
          <div className="grid4">{TERMS.map((t, i) => <div className={`term ${sel.term === i ? 'sel' : ''}`} key={t}><b>{t}</b></div>)}</div>
        </Section>

        {/* 중간 아코디언 (Figma 10547:16708 접힘 / 16717 펼침) */}
        <div className="pd2-sec" ref={secs.acc}>
          <div className={`accordion ${accOpen ? 'open' : ''}`} ref={accRef}>
            <div className="acc-head"><div className="acc-title">그간의 가입 이력을 바탕으로<br />{NAME}님께 꼭 맞는 주문 조건을 찾았어요.<br />확인해 보시겠어요?</div><i className="chev" /></div>
            <div className="acc-body">
              <div className="acc-in">
                <div className="divider" />
                <div className="ai-note"><span>✦ AI 분석</span><p>{AI_TEXT}</p></div>
                <ComboRows />
                <div className={`btn-primary ${comboOn ? 'done' : ''}`} ref={accGoRef}>{comboOn ? '옵션이 적용됐어요 ✓' : '이 옵션으로 진행할게요'}</div>
              </div>
            </div>
          </div>
        </div>

        <Section title="어떤 분이 사용할 휴대폰인가요?" refEl={secs.user}>
          <div className="stack">{USER.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.user === i} />)}</div>
        </Section>
        <Section title="어떻게 가입할까요?" refEl={secs.join}>
          <div className="stack">{JOIN.map((it, i) => <RadioCard key={it.t} {...it} selected={sel.join === i} />)}</div>
        </Section>

        {/* 요금제 — 자동 시퀀스가 멈추는 곳. Agent 가 도울 영역이므로 미선택 (Figma 10547:16764) */}
        {/* 요금제 — 자동 시퀀스가 카드를 옆으로 밀어 보다 Agent 를 부르는 곳 (html[data-planswipe]) */}
        <Section title="요금제를 선택해 주세요" refEl={secs.plan}>
          {variant('planexit') === 'hint' && (
            <div className={`plan-hint ${planHint ? 'on' : ''}`} ref={planHintRef}><IcoSparkleAi size={16} /><span>{PLAN_HINT}</span></div>
          )}
          <div className="plan-carousel" ref={carRef}>
            {[0, 1, 2].map((i) => <PlanCard key={i} idx={i} sel={false} style={{ '--i': i }} />)}
            {variant('planexit') === 'card' && (
              <div className="plan-ai-card" ref={planAiRef}>
                <IcoSparkleAi size={30} />
                <b>{PLAN_AI_TITLE}</b>
                <p>{PLAN_AI_DESC}</p>
                <span className="go">추천받기</span>
              </div>
            )}
          </div>
        </Section>

        <Section title="어떤 SIM으로 개통하시겠어요?">
          <div className="stack">{SIM.map((it) => <RadioCard key={it.t} {...it} />)}</div>
        </Section>
        <Section title="T 기프트 하나를 선택해 주세요" link="전체보기" desc="원하는 단말 사은품 하나를 지정한 주소로 보내드려요.">
          <div className="gift-grid">
            {GIFTS.map((g, i) => (
              <div className="gift" key={i}><div className="gimg"><img src={g.img} alt="" draggable="false" /></div><small>{g.brand}</small><b>{g.name}</b><span className="ai-pick">AI PICK</span></div>
            ))}
          </div>
        </Section>
        <Section title="원하는 티다팩 쿠폰을 골라주세요" link="전체보기" desc="12개월간 매달 발송되는 쿠폰 혜택이에요.">
          <div className="stack">
            {COUPONS.map((c) => (
              <div className="radio-card ico-row" key={c.t}>{c.l && <Logo l={c.l} bg={c.bg} />}<div className="txt"><div className="t">{c.t}</div>{c.d && <div className="d">{c.d}</div>}</div></div>
            ))}
          </div>
        </Section>
        <Section title="쓰던 휴대폰을 반납하고 보상금을 받으시겠어요?" desc="바로보상 신청 시 예상 보상금을 새 휴대폰 가격에서 할인해 드려요.">
          <div className="stack">{TRADEIN.map((it) => <RadioCard key={it.t} {...it} />)}</div>
        </Section>
        <Section title="소중한 휴대폰, 보험으로 지켜보세요" link="전체보기" desc="떨어뜨리거나 잃어버려도 걱정 없이 쓰세요.">
          <div className="stack">
            {INSURANCE.map((it, i) => (
              <div className="radio-card ins" key={i}>
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
        <Section title="이런 서비스는 어때요?" link="전체보기" desc="나에게 유용하고 꼭 필요한 부가서비스를 찾아보세요!">
          <div className="stack">
            {SERVICES.map((s, i) => (
              <div className="radio-card ico-row svc" key={i}>{s.l && <Logo l={s.l} bg={s.bg} />}<div className="txt">{s.s && <div className="s">{s.s}</div>}<div className="t">{s.t}</div>{s.r && <div className="price">{s.r}</div>}</div></div>
            ))}
          </div>
        </Section>
        <Section title="더 할인받을 수 있는 제휴카드를 확인해보세요" desc="자동이체 등록하고 매월 요금 할인 받아보세요">
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
            <div className="radio-card"><div className="txt"><div className="t">제휴카드 없이 주문할게요</div></div></div>
          </div>
        </Section>
        <Section title="추가로 할인받을 수 있는 수단이 있어요" desc="보유하신 쿠폰과 포인트 적용하고 더 저렴하게 구매하세요">
          <div className="stack">
            <div className="radio-card link-row"><div className="t">쿠폰·이용권 선택</div><i className="arrow" /></div>
            <div className="radio-card link-row"><div className="t">T 모아 제휴 포인트 적용</div><i className="arrow" /></div>
            <div className="radio-card link-row two"><div className="t">쿠폰·이용권 선택<i className="arrow" /></div><div className="kv"><span>쿠폰명</span><b>-99,999원</b></div></div>
            <div className="radio-card link-row two"><div className="t">T 모아 제휴 포인트 적용<i className="arrow" /></div><div className="kv"><span>포인트명</span><b>-99,999원</b></div></div>
            <div className="radio-card"><div className="txt"><div className="t">추가 할인 없이 주문할게요</div></div></div>
          </div>
        </Section>
        <div style={{ height: px(180) }} />
      </div>

      {/* BottomGroupAi (Figma 10547:16816): AI 버튼 + 옵션 선택하기 (툴팁 제외) */}
      <div className="pd2-bottom">
        {/* AI 한마디 툴팁(Figma 10547:16816 "또래는 그라파이트 색상을 더 선호해요")은 사용자 요청으로 표시하지 않음 (2026-09-07) */}
        <div className="bottom-group-ai inline">
          <div className="ai-btn" ref={aiBtnRef}><IcoSparkleAi size={26} /></div>
          <div className="primary">옵션 선택하기</div>
        </div>
      </div>
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}
