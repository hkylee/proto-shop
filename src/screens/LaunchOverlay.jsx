import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Pointer, { userTap } from '../components/pointer.js'
import { SearchAi, Keyboard, SEARCH_BOTTOM_KB, useTyped } from './AgentShell.jsx'
import { IcoWon } from '../components/Icons.jsx'
import { variant } from '../lib/variants.js'
import { afterLayout } from '../lib/motion.js'

// 스텝 3 Agent 실행 = 상품 상세 위에 딤 + 추천 발화 칩 + SearchAi + 키패드 오버레이 (Figma 12769:43212)
// 페이지 전환 없이 상품 상세(ProductDetail)가 그대로 남고, 그 위에 이 레이어가 올라온다. html[data-launch]
//  L1 딤 + 한 덩어리 슬라이드업 : 칩·입력창·키패드가 한 몸으로 아래에서 올라옴 (Figma 정지 화면 그대로)
//  L2 블러 딤 + 순차 등장       : 상품 상세가 흐려지고, 키패드·입력창 먼저 → 칩이 아래에서 위로 하나씩
//  L3 AI 버튼에서 확장          : 좌하단 AI 버튼 자리에서 입력창이 커지며 올라오고, 칩이 입력창에서 튀어나옴
const SUGGESTIONS = ['구독 상품 해지하고 싶어', '가족 결합 현황 확인해줘', '이번달 요금이 많이 나온 이유 알려줘']
const TYPE_DELAY = { L1: 900, L2: 1300, L3: 1300 }   // 오버레이가 자리 잡은 뒤 타이핑 시작까지

export default function LaunchOverlay({ typed = '' }) {
  const v = variant('launch')
  const rootRef = useRef(null)
  const [on, setOn] = useState(false)
  const [from, setFrom] = useState(null)   // L3: AI 버튼의 화면 좌표 (입력창 출발 위치)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (v === 'L3' && root) {
      const btn = root.parentElement?.querySelector('.ai-btn')
      if (btn) {
        const r = btn.getBoundingClientRect(), b = root.getBoundingClientRect(), k = b.width / 393 || 1
        setFrom({ left: (r.left - b.left) / k, bottom: (b.bottom - r.bottom) / k, w: r.width / k, h: r.height / k })
      }
    }
    afterLayout(() => setOn(true))
  }, [v])

  const { shown, typing } = useTyped(typed, TYPE_DELAY[v] ?? 900)
  // 사용자 탭 모드: 발화가 다 찍히면 키패드 ↵ 위에서 기다린다 — 사용자가 '전송' 을 탭해야 다음 스텝(Agent 대화)
  const ptrLayerRef = useRef(null), ptrRef = useRef(null)
  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])
  useEffect(() => {
    if (!userTap() || !typed || typing || shown !== typed) return
    const t = setTimeout(() => ptrRef.current?.park(rootRef.current?.querySelector('.key.ret'), 300, '전송'), 350)
    return () => clearTimeout(t)
  }, [typed, typing, shown])
  const searchStyle = v === 'L3' && from && !on
    ? { left: from.left, bottom: from.bottom, width: from.w, height: from.h }
    : v === 'L3' ? { left: 20, bottom: SEARCH_BOTTOM_KB, width: 353, height: 52 }
    : { bottom: SEARCH_BOTTOM_KB }

  return (
    <div className={`launch-ov ${v} ${on ? 'on' : ''}`} ref={rootRef}>
      <div className="launch-scrim" />
      <div className="rise">
        <div className="stack">
          {SUGGESTIONS.map((t, i) => (
            <div className="button-ai" key={t} style={{ '--i': i, '--ri': SUGGESTIONS.length - 1 - i }}><IcoWon />{t}</div>
          ))}
        </div>
        <SearchAi value={shown} caret={typing} style={searchStyle} />
        <Keyboard slide open={on} />
      </div>
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}
