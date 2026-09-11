import { useEffect, useState } from 'react'
import ProductDetail from '../screens/ProductDetail.jsx'
import ProductDetail2 from '../screens/ProductDetail2.jsx'
import ProductDetail1 from '../screens/ProductDetail1.jsx'
import { variant } from '../lib/variants.js'
import AgentHome from '../screens/AgentHome.jsx'
import AgentChat from '../screens/AgentChat.jsx'
import AgentChat2 from '../screens/AgentChat2.jsx'
import LaunchOverlay from '../screens/LaunchOverlay.jsx'

function View({ view }) {
  switch (view.type) {
    case 'product': return variant('pd') === 'new' ? <ProductDetail2 stage={view.stage} /> : <ProductDetail stage={view.stage} />   // 상품 상세 v2 (Figma T1mhl… 10547:16625) 시안 중
    case 'product1': return <ProductDetail1 stage={view.stage} />   // 1안 Static + AI 일시 호출 (E-1 배지 + 팬)
    case 'agent-home': return <AgentHome typed={view.typed} />
    case 'agent-chat': return <AgentChat stage={view.stage} from={view.from} mode={view.mode} />
    case 'agent-chat2': return <AgentChat2 stage={view.stage} />   // 2안 Agent 중심 + 바텀시트 선택 (Figma ixGPs9 96:47398)
    case 'placeholder': return <Placeholder {...view} />   // 1·2안: UI 준비 중 자리표시
    default: return null
  }
}

// 화면 전환 = 시안 I(블러 디졸브): 같은 종류의 뷰(product / agent-home / agent-chat)는 그대로 두고
// props 만 바꿔 내부 전환(스크롤·타이핑·F-2)을 이어가고, 종류가 바뀔 때만 나가는 뷰를 800ms 동안
// 겹쳐 두고 blur+fade 로 교차시킨다. (시안 I-3: 0.6s · blur 6 · 위로 12px 흐름)
const DISSOLVE_MS = 600

// 1·2안 자리표시 화면: 안 이름 · 스텝 화면명 · 메모. 실제 UI 는 순차 반영 예정
function Placeholder({ pid, title, screen, note, status }) {
  return (
    <div className="ph-screen">
      <div className="ph-top"><span className="num">{pid}안</span><b>{title}</b></div>
      <div className="ph-body">
        <div className="ph-frame"><span>{status}</span></div>
        <h3>{screen}</h3>
        <p>{note}</p>
      </div>
    </div>
  )
}
export default function Phone({ view }) {
  const [layers, setLayers] = useState(() => [{ id: view.type, view, leaving: false }])

  useEffect(() => {
    setLayers((ls) => {
      const top = ls[ls.length - 1]
      if (top.view.type === view.type) return [...ls.slice(0, -1), { ...top, view }]
      return [...ls.map((l) => ({ ...l, leaving: true })), { id: `${view.type}:${Date.now()}`, view, leaving: false }]
    })
  }, [view])

  // 나가는 레이어 정리 타이머 — 같은 종류 뷰의 props 갱신(layers 배열 교체)에는 다시 걸지 않는다
  const leaving = layers.some((l) => l.leaving)
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => setLayers((ls) => ls.filter((l) => !l.leaving)), DISSOLVE_MS + 40)
    return () => clearTimeout(t)
  }, [leaving])

  return (
    <div className="phone">
      <div className="island" />
      <div className="screen">
        {layers.map((l) => (
          <div key={l.id} className={`view ${l.leaving ? 'view-out' : 'view-in'}`}>
            <View view={l.view} />
            {l.view.launch && <LaunchOverlay typed={l.view.launch} />}
          </div>
        ))}
      </div>
    </div>
  )
}
