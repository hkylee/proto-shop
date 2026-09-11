import { useEffect, useRef, useState } from 'react'
import { IcoBack, IcoSparkleAi } from '../components/Icons.jsx'
import Pointer from '../components/pointer.js'
import { StatusBar } from './AgentShell.jsx'
import { wait, scrollTo, inOut, restart, reducedMotion } from '../lib/motion.js'

const NONE = { color: false, storage: false, term: false, join: false, user: false }
const ALL = { color: true, storage: true, term: true, join: true, user: true }

// 상품 상세 풀 케이스 (Figma 11230:27110 레퍼런스 → DS 컴포넌트로 재구성)
// stage 'top'     : 진입 직후, 모든 입력 미선택
// stage 'options' : 색상 ~ [사용자 선택]까지 완료. 스크롤 길이는 동일, 선택 props만 다름
// CTA는 BottomGroupAi(11800:138578) 고정: AI 버튼 + 구매하기

const COLORS = [
  { name: '핑크', hex: '#E9B4C0' }, { name: '그라파이트', hex: '#4A4F57' },
  { name: '크림', hex: '#EEEBE3' }, { name: '민트', hex: '#BFD9CF' },
]
const STORAGE = [
  { t: '256GB', d: '사진 약 51,200장을 저장할 수 있어요', r: '1,684,000원' },
  { t: '512GB', d: '사진 약 102,400장을 저장할 수 있어요', r: '1,936,000원' },
  { t: '1TB', d: '사진 약 204,800장을 저장할 수 있어요', r: '2,557,500원' },
]
const TERMS = [
  ['일시불', '1,684,000원'], ['6개월', '월 280,667원'], ['12개월', '월 140,333원'],
  ['18개월', '월 93,556원'], ['24개월', '월 70,167원'], ['36개월', '월 46,778원'],
]
const JOIN = [
  { t: '신규가입', d: 'SKT에 새 번호로 가입하고 싶어요.' },
  { t: '번호이동', d: '지금 번호 그대로, 다른 통신사에서 SKT로 옮기고 싶어요.' },
  { t: '기기변경', d: '지금 번호 그대로, 기기만 바꾸고 싶어요.' },
]
const SEC_PAD = 24 // 섹션 상단이 스크롤 영역 위에서 떨어지는 여백
const anchorSec = (el) => el.offsetTop - SEC_PAD
const JOIN_SEL = 2 // 기기변경 — 페르소나는 SKT 기존 회선 이용 중
const USER = [
  { t: '제가 사용할 휴대폰이에요', d: '등록된 생체정보로 바로 확인해요' },
  { t: '다른 사람이 사용할 휴대폰이에요', d: '사용할 분의 정보를 먼저 확인해요' },
]
const PLANS = [
  { name: '5GX 프라임', price: '89,000원/월', discounts: [['공시지원금', '최대 할인', '896,000원 할인'], ['선택약정', '12개월', '613,000원 할인'], ['선택약정', '24개월', '880,000원 할인']] },
  { name: '다이렉트 5GX 69', price: '62,800원/월', discounts: [['공시지원금', '최대 할인', '620,000원 할인'], ['선택약정', '12개월', '452,000원 할인'], ['선택약정', '24개월', '640,000원 할인']] },
]
const EXTRA = [
  { t: '청년 데이터 60GB 추가', d: '매월 데이터를 넉넉하게 사용해요' },
  { t: '콘텐츠 이용권', d: 'YouTube·Netflix·TVING 중 하나를 골라요' },
  { t: '추가혜택을 선택하지 않을게요', d: '나중에 T world 에서 신청할 수 있어요' },
]
const SIM = [
  { t: '기존 USIM을 그대로 사용할게요', d: '선택한 회선의 USIM 재사용 가능 여부를 확인했어요' },
  { t: 'eSIM으로 개통할게요', d: '배송 없이 디지털 SIM을 발급해요' },
  { t: '새 USIM을 받을게요', d: '휴대폰과 함께 배송받아요' },
]
const GIFT = [
  { t: '정품 케이스 + 25W 충전기', d: '갤럭시 Z 플립8 전용 액세서리 패키지' },
  { t: '듀오 무선충전 패드', d: '휴대폰과 웨어러블을 함께 충전해요' },
  { t: '차량용 충전기 + 거치대', d: '차 안에서도 편리하게 충전하고 거치해요' },
  { t: '슬림 보조배터리', d: 'USB-C 케이블이 포함된 휴대용 배터리예요' },
]
const COUPON = [
  { t: '티다팩을 받지 않을게요' },
  { t: '다이소', r: '매월 10,000원' }, { t: '올리브영', r: '매월 10,000원' },
  { t: '무신사머니', r: '매월 10,000원' }, { t: '컬리', r: '매월 10,000원' },
]
const DELIVERY = [
  { t: '집에서 편하게 받아볼게요', d: '일반 배송 · 원하는 주소로 안전하게 배송해요' },
  { t: '오늘 최대한 빨리 받아볼래요', d: '바로 도착 · 서비스 가능 지역이면 빠르게 배송해요' },
  { t: '가까운 매장에서 직접 받을게요', d: '바로 픽업 · 위치를 기준으로 재고가 있는 매장을 찾아요' },
]
const INSURANCE = [
  { t: '가입하지 않을게요', d: '보험 없이 진행해요' },
  { t: 'T All케어플러스 파손형', d: '파손 수리와 분실 상담을 지원해요', r: '월 8,900원' },
]
const TRADEIN = [
  { t: '바로보상을 이용하지 않을게요', d: '쓰던 휴대폰 반납 없이 진행해요' },
  { t: '네, 보상금액을 알아볼게요', d: '쓰던 휴대폰 모델과 상태를 확인해요' },
]
const CARD = [
  { t: '제휴카드를 선택하지 않을게요', d: '제휴카드 할인 없이 진행해요' },
  { t: 'T PREMIUM 삼성카드', d: '전월 실적 충족 시 통신비·할부금 할인', r: '월 최대 35,000원', more: true },
  { t: 'SKT T&Life 신한카드', d: '생활 영역과 통신요금을 함께 할인', r: '월 최대 25,000원', more: true },
]
const DISCOUNT = [
  { t: '추가 할인 수단을 사용하지 않을게요', d: '쿠폰과 포인트 없이 진행해요' },
  { t: '쿠폰/이용권을 사용할게요', d: '등록된 쿠폰을 확인해요' },
  { t: '제휴 포인트를 사용할게요', d: '보유 포인트를 조회해요' },
]
const BENEFITS = [
  { tag: '제조사 혜택', sub: 'SPECIAL', title: '갤럭시와 함께 쓰는 혜택', desc: '워치와 액세서리 할인부터 콘텐츠 구독까지 준비했어요.', items: ['갤럭시 워치9·워치 울트라2 10% 할인 쿠폰 1장', '케이스·액세서리 30% 할인 쿠폰 5장', 'Google AI Pro 6개월 무료와 윌라 3개월 구독권', '정품 보호필름 1회 무료 부착 서비스'] },
  { tag: '쓰던 폰 보상', sub: '최대 100만 원', title: 'T 안심보상 with 민팃', desc: '쓰던 휴대폰을 반납하고 기종과 상태에 따라 보상받을 수 있어요.', items: ['T 안심보상과 민팃 All 보상을 함께 적용', '민팃 ATM 또는 안내된 방법으로 간편하게 반납', '보상 금액은 반납 기종과 휴대폰 상태에 따라 달라져요'] },
  { tag: '구매 고객 전용', sub: '택 1', title: '원하는 T 기프트 선택', desc: '휴대폰 개통 후 아래 선물 중 하나를 받을 수 있어요.', items: ['삼성전자 정품 클리어 케이스와 25W PD 충전기 패키지', '다이소·올리브영·무신사머니·컬리 3만 원권', '재고가 소진되면 선택 가능한 상품이 변경될 수 있어요'] },
  { tag: '결제 혜택', sub: '최대 24개월', title: '삼성카드 무이자 할부', desc: '갤럭시 Z플립8 결제 부담을 긴 할부 기간으로 나눌 수 있어요.', items: ['삼성 개인 신용카드 결제 시 2~24개월 무이자 할부', '주문 단계에서 일시불을 선택한 뒤 카드 결제 단계에서 적용', '카드사와 행사 조건에 따라 조기 종료될 수 있어요'] },
  { tag: '제휴카드 혜택', sub: '최대 96만 원', title: '매월 통신비·할부금 할인', desc: '전월 실적과 카드별 조건을 충족하면 월별 할인을 받을 수 있어요.', items: ['T PREMIUM 삼성카드 월 최대 3만 5천 원 할인', 'SKT T&Life 신한카드·T 라이트 카드 등 선택 가능', '할인 금액은 카드, 전월 실적, 할부 기간에 따라 달라져요'] },
  { tag: '온라인 전용', sub: '최대 30% 저렴', title: '약정 없는 다이렉트 플랜', desc: '온라인에서만 가입할 수 있는 합리적인 요금제도 비교해 보세요.', items: ['일반 요금제보다 월 이용료를 최대 3만 3천 원 절약', '약정 없이 이용하고 콘텐츠·스마트기기 혜택도 선택'] },
]
const GUIDES = ['휴대폰 구매 안내', '교환/환불 안내', '요금제 안내', '약정 할인 안내', '지원금 안내', '바로도착, 행복배송 안내']

function RadioCard({ t, d, r, more, selected }) {
  return (
    <div className={`radio-card ${selected ? 'sel' : ''}`}>
      <div className="txt">
        <div className="t">{t}</div>
        {d && <div className="d">{d}</div>}
        {more && <div className="more">상세 카드 할인정보·신청방법 보기 <i>▾</i></div>}
      </div>
      {r && <div className="r">{r}</div>}
    </div>
  )
}
function Section({ title, desc, children, refEl }) {
  return (
    <section className="pd-sec" ref={refEl}>
      <h2>{title}</h2>
      {desc && <p className="desc">{desc}</p>}
      {children}
    </section>
  )
}
const List = ({ items, sel }) => (
  <div className="stack">{items.map((it, i) => <RadioCard key={it.t} {...it} selected={sel === i} />)}</div>
)

export default function ProductDetail({ stage = 'top' }) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const ptrLayerRef = useRef(null)
  const ptrRef = useRef(null)
  const aiBtnRef = useRef(null)
  const secs = { color: useRef(null), storage: useRef(null), term: useRef(null), join: useRef(null), user: useRef(null), plan: useRef(null) }
  const picked = stage === 'options'
  const prevRef = useRef(null)
  const seqRef = useRef(0)
  const [sel, setSel] = useState(() => (picked ? ALL : NONE))
  const S = (key, i) => (sel[key] ? i : -1) // 선택 인덱스 (미선택 = -1)

  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])

  // 2→3: App 이 'ai-tap' 을 보내면 좌하단 AI 버튼을 탭한 뒤 Agent 로 디졸브
  useEffect(() => {
    const onTap = async () => {
      const btn = aiBtnRef.current; if (!btn) return
      restart(btn, 'tapped')
      await ptrRef.current?.press(btn)
      ptrRef.current?.hide()   // 이어서 오버레이(스텝 3)가 덮으므로 포인터는 정리
    }
    window.addEventListener('ai-tap', onTap)
    return () => window.removeEventListener('ai-tap', onTap)
  }, [])

  useEffect(() => {
    const el = scrollRef.current, ptr = ptrRef.current
    if (!el) return
    const seq = ++seqRef.current, alive = () => seq === seqRef.current
    const cancel = () => { seqRef.current++ }   // 언마운트 시 진행 중 시퀀스 중단 (rAF/타이머가 떨어진 DOM 위에서 계속 돌지 않게)

    if (!picked) { setSel(NONE); ptr?.hide(); scrollTo(el, 0, 500, inOut); prevRef.current = 'top'; return cancel }

    // 즉시 상태 (2번 직접 진입 · 3→2 복귀)
    if (prevRef.current !== 'top' || reducedMotion()) {
      setSel(ALL); ptr?.hide(); el.scrollTop = anchorSec(secs.plan.current); prevRef.current = 'options'; return cancel
    }
    prevRef.current = 'options'

    // 1→2 시퀀스: 스크롤 → (포인터 이동) → 탭 → 선택 … → '요금제와 할인방법' 섹션까지 내려와 정지 → 좌하단 AI 버튼으로 이동해 hover (여기서 탭 → 스텝 3)
    const beats = [
      { key: 'color',   sec: secs.color,   pick: (s) => s.querySelectorAll('.swatch')[1] },
      { key: 'storage', sec: secs.storage, pick: (s) => s.querySelector('.radio-card') },
      { key: 'term',    sec: secs.term,    pick: (s) => s.querySelectorAll('.term')[1] },
      { key: 'join',    sec: secs.join,    pick: (s) => s.querySelectorAll('.radio-card')[JOIN_SEL] },
      { key: 'user',    sec: secs.user,    pick: (s) => s.querySelector('.radio-card'), quick: true, noScroll: true },
    ]
    ;(async () => {
      for (const b of beats) {
        const secEl = b.sec.current
        if (!b.noScroll) { await scrollTo(el, anchorSec(secEl), 600, inOut); if (!alive()) return }
        await ptr?.tap(b.pick(secEl), b.quick ? { move: 300, pause: 80 } : {}); if (!alive()) return
        setSel((s) => ({ ...s, [b.key]: true }))
        await wait(b.quick ? 240 : 420); if (!alive()) return
      }
      await wait(200); if (!alive()) return
      await scrollTo(el, anchorSec(secs.plan.current), 700, inOut); if (!alive()) return
      await ptr?.moveTo(aiBtnRef.current, 520, 'AI Agent 실행'); if (!alive()) return
      ptr?.hover()
    })()
    return cancel
  }, [picked])

  return (
    <div className="pd" ref={rootRef}>
      <StatusBar className="pd-status" />
      <div className="pd-appbar"><IcoBack /></div>

      <div className="pd-scroll" ref={scrollRef}>
        <h1 className="pd-title">갤럭시 Z 플립8 구매하기</h1>
        <div className="pd-rating"><span className="stars">★★★★★</span><b>5.0</b><span className="cnt">(88)</span></div>
        <div className="pd-chip">전문가와 1:1 상담하기 <i>›</i></div>
        <div className="pd-visual"><div className="device" /></div>
        <div className="pd-btns"><div>상품 정보 보기</div><div>구매 혜택 보기</div></div>

        <Section title="어떤 색상이 마음에 드세요?" refEl={secs.color}>
          <div className="swatches">
            {COLORS.map((c, i) => (
              <div className={`swatch ${S('color', 1) === i ? 'sel' : ''}`} key={c.name}><i style={{ background: c.hex }} /><span>{c.name}</span></div>
            ))}
          </div>
        </Section>

        <Section title="용량은 얼마나 필요하세요?" refEl={secs.storage}>
          <List items={STORAGE} sel={S('storage', 0)} />
          <p className="caption">사진 1장당 약 5MB를 기준으로 계산한 예상치예요.</p>
        </Section>

        <Section title="단말대금 납부기간을 선택해 주세요" refEl={secs.term} desc="선택한 기간을 기준으로 하단에 월 단말기 납부금을 바로 계산해 드려요.">
          <div className="grid3">
            {TERMS.map(([t, p], i) => <div className={`term ${S('term', 1) === i ? 'sel' : ''}`} key={t}><b>{t}</b><span>{p}</span></div>)}
          </div>
        </Section>

        <Section title="어떻게 가입할까요?" refEl={secs.join}><List items={JOIN} sel={S('join', JOIN_SEL)} /></Section>
        <Section title="어떤 분이 사용할 휴대폰인가요?" refEl={secs.user}><List items={USER} sel={S('user', 0)} /></Section>

        {/* ── 여기부터는 두 스텝 모두 미선택 (Agent가 도울 영역) ── */}
        <Section title="요금제와 할인방법을 함께 골라주세요" refEl={secs.plan} desc={<>오른쪽에 이어지는 요금제를 옆으로 밀어 비교해 보세요 <i>→</i></>}>
          <div className="plan-scroll">
            {PLANS.map((p) => (
              <div className="plan-card" key={p.name}>
                <div className="pn">{p.name}</div>
                <div className="pp">{p.price}</div>
                <div className="pd-hint">할인 방법을 선택해 주세요.</div>
                <div className="stack tight">
                  {p.discounts.map(([a, b, c]) => (
                    <div className="disc" key={a + b}><div className="a">{a} <small>{b}</small></div><div className="c">{c}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="find-card">
            <div><b>다른 혜택으로 찾기</b><span>YouTube·Netflix·TVING 등 원하는 혜택부터 찾아보세요</span></div>
            <em>찾아보기</em>
          </div>
        </Section>

        <Section title="5GX 프라임 추가혜택을 선택해 주세요" desc="선택한 요금제에서 제공하는 혜택만 보여드려요."><List items={EXTRA} /></Section>
        <Section title="어떤 방식으로 개통할까요?"><List items={SIM} /></Section>
        <Section title="원하는 T 기프트를 골라주세요" desc="모바일 상품권과 별도로 받을 수 있는 실물 사은품이에요."><List items={GIFT} /></Section>
        <Section title="티다팩 쿠폰을 골라주세요." desc="12개월간 매월 발송되는 쿠폰 혜택이에요."><List items={COUPON} /></Section>
        <Section title="휴대폰은 어떻게 받으시겠어요?"><List items={DELIVERY} /></Section>
        <Section title="휴대폰 보험을 선택해 주세요"><List items={INSURANCE} /></Section>
        <Section title="쓰던 휴대폰을 바로 보상받으시겠어요?" desc="예상 보상금은 새 휴대폰 가격에서 바로 할인해 드려요."><List items={TRADEIN} /></Section>
        <Section title="제휴카드 혜택을 선택하시겠어요?"><List items={CARD} /></Section>
        <Section title="추가 할인 수단을 사용하시겠어요?"><List items={DISCOUNT} /></Section>

        <div className="pd-tabs sticky-off"><span className="on">구매 혜택</span><span>상품 정보</span><span>구매 후기</span></div>
        <div className="benefit-head">
          <div className="eyebrow">T 다이렉트샵 혜택</div>
          <h2>Z플립8을 더 알뜰하게<br />구매해 보세요</h2>
          <p>선택한 구매 조건에 따라 받을 수 있는 혜택이 달라질 수 있어요.</p>
        </div>
        <div className="benefits">
          {BENEFITS.map((b) => (
            <div className="benefit" key={b.title}>
              <div className="tag">{b.tag} <small>{b.sub}</small></div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
              <ul>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="footnote">2026년 8월 T 다이렉트샵 갤럭시 폴더블8 기획전 기준이에요. 행사 기간, 재고, 카드 실적과 가입 조건에 따라 혜택이 변경되거나 조기 종료될 수 있어요.</p>
        <div className="guides">{GUIDES.map((g) => <div className="guide" key={g}><span>{g}</span><i>▾</i></div>)}</div>
        <div style={{ height: 200 }} />
      </div>

      <div className="pd-bottom">
        <div className="summary">
          <div><span>단말</span><b>{sel.term ? '월 70,167원' : '계산 전'}</b></div>
          <i>+</i>
          <div><span>통신요금</span><b>계산 전</b></div>
          <i>=</i>
          <div><span>예상 월 청구금액</span><b className="brand">계산 전</b></div>
        </div>
        <div className="bottom-group-ai inline">
          <div className="ai-btn" ref={aiBtnRef}><IcoSparkleAi size={26} /></div>
          <div className="primary">구매하기</div>
        </div>
      </div>
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}
