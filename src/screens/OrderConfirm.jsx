import { useEffect, useRef } from 'react'
import { IcoBack } from '../components/Icons.jsx'
import { StatusBar } from './AgentShell.jsx'
import { wait, scrollTo, inOutQuart, reducedMotion } from '../lib/motion.js'
import { NAME, COLORS, STORAGE, DELIVERY, TERMS, JOIN, SIM, GIFTS, COUPONS, INSURANCE } from './ProductDetail2.jsx'

/* 1안 스텝 6 · 주문 정보 확인하기 (Figma ixGPs9 134:60488 — 래스터 2장이라 HTML 로 재구성)
   [주문하기] 탭 → 이 화면이 오른쪽에서 슬라이드 인(X-1) → 0.9s 뒤 D-3 팬으로 맨 아래(예상 월 청구금액)까지 내려가 멈춤 → 완료 토스트.
   값은 Figma 더미(Z 플립8 · 김티월드 · 0 청년 69)가 아니라 1안 스텝 1~5 에서 실제로 고른 것 (ProductDetail1 FINAL.payout). 하단 [이대로 신청서 작성할게요] 는 Figma 그대로 · 누르지 않음 = 여기서 끝 */

// 1안에서 고른 값 (ProductDetail1 FINAL.payout: color 2 · storage 1 · delivery 0 · term 1 · join 2 · plan 0 · sim 0 · gift 0 · coupon 2 · tradein 0 · ins 0 · svc 3 · card none · extra none)
const PLAN = '5GX 프라임 플러스'
const PLAN_FEE = 99000
const DEVICE_MONTHLY = 52417   // 할부원금 1,258,000 ÷ 24 (3안 결제 화면과 같은 숫자)
const INS_FEE = 8900
const won = (n) => `${n.toLocaleString('ko-KR')}원`

const SECTIONS = [
  { title: '가입 정보', rows: [
    ['가입 유형', JOIN[2].t],
    ['가입자·사용자', `${NAME} (본인)`],
    ['요금제', PLAN],
    ['할인 방법', '선택약정 24개월'],
    ['할부 방법', `${TERMS[1]} 할부`],
  ] },
  { title: '선택한 혜택', rows: [
    ['T 기프트', 'allo 미니 공기청정기 AP500'],   // GIFTS[0] 축약
    ['티다팩', `${COUPONS[2].t} ${COUPONS[2].d}`],
    ['보험', INSURANCE[0].t],
    ['바로보상', '이용하지 않음'],
    ['부가서비스', '신청하지 않음'],
    ['제휴카드', '선택하지 않음'],
    ['추가 할인', '적용하지 않음'],
  ] },
  { title: 'USIM/eSIM과 수령', rows: [
    ['개통 방식', SIM[0].t],
    ['수령 방법', DELIVERY[0].t],
    ['배송지', '서울 중구 을지로 65, SK-T타워 12층'],
  ] },
]

export default function OrderConfirm({ autoPan = true }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !autoPan) return
    let alive = true
    ;(async () => {
      if (reducedMotion()) { el.scrollTop = el.scrollHeight; return }
      await wait(900); if (!alive) return
      // D-3 손가락 없이 팬 (1안 확정 스크롤 규칙): in-out quart · 600px/s · 0.55~1.5s
      const total = el.scrollHeight - el.clientHeight - el.scrollTop
      if (total < 2) return
      await scrollTo(el, el.scrollHeight, Math.min(1500, Math.max(550, total / 0.6)), inOutQuart)
    })()
    return () => { alive = false }
  }, [autoPan])

  return (
    <div className="oc">
      <StatusBar className="pd-status" />
      <div className="oc-appbar"><IcoBack /></div>
      <div className="oc-scroll" ref={scrollRef}>
        <h1>주문 정보 확인하기</h1>
        <p className="oc-sub">신청서를 작성하기 전에 선택한 상품과 혜택을 확인해 주세요.</p>
        <div className="oc-product">
          <div className="thumb"><img src="/screens/pd2/device.png" alt="" draggable="false" /></div>
          <div className="txt">
            <small>삼성전자</small>
            <b>갤럭시 Z 폴드8</b>
            <span>{COLORS[2].name} · {STORAGE[1].t}</span>
          </div>
        </div>
        {SECTIONS.map((s) => (
          <section className="oc-sec" key={s.title}>
            <div className="head"><h2>{s.title}</h2><span className="link">변경</span></div>
            <div className="oc-kv">
              {s.rows.map(([k, v]) => <div className="row" key={k}><span>{k}</span><b>{v}</b></div>)}
            </div>
          </section>
        ))}
        <div className="oc-total">
          <small>예상 월 청구금액</small>
          <b>{won(DEVICE_MONTHLY + PLAN_FEE + INS_FEE)}</b>
          <span>월 단말기 할부금 {won(DEVICE_MONTHLY)} + 월 통신요금 {won(PLAN_FEE)} + 보험 {won(INS_FEE)}</span>
        </div>
        <div className="oc-tail" />
      </div>
      <div className="oc-bottom"><div className="oc-btn">이대로 신청서 작성할게요</div></div>
    </div>
  )
}
