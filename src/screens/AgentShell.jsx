import { useEffect, useRef, useState } from 'react'
import { variant } from '../lib/variants.js'
import { reducedMotion } from '../lib/motion.js'
import { IcoBack, IcoNewChat, IcoSparkle, IcoVoice } from '../components/Icons.jsx'

// AI 화면 공통 뼈대: 배경 글로우 + status bar + AppbarAi(Chat) + 컨텍스트 헤더 + SearchAi + Home indicator
export function AgentBackground() {
  return (
    <div className="ai-bg" aria-hidden>
      <img className="anchor a1" src="/icons/anchor1.svg" alt="" />
      <img className="anchor a2" src="/icons/anchor2.svg" alt="" />
      <img className="anchor a3" src="/icons/anchor3.svg" alt="" />
    </div>
  )
}

export function StatusBar({ className = 'ai-status' }) {
  return (
    <div className={className}>
      <span>9:41</span>
      <img src="/icons/status_right.svg" alt="" />
    </div>
  )
}

export function AppbarAi({ chip }) {
  return (
    <div className="appbar-ai">
      <div className="left">
        <div className="btn-icon-ai"><IcoBack /></div>
        <div className="contextual-chip">{chip}</div>
      </div>
      <div className="btn-icon-ai"><IcoNewChat /></div>
    </div>
  )
}

/* 컨텍스트 헤더 (Figma ixGPs9 47:31020): "휴대폰 옵션 선택중 · 단계 k/n ∙ {지금 고르는 옵션}". k/n 은 전체 선택 옵션 기준 실제 값.
   값은 '선택 → 적용(시스템 전송)' 시점에만 바뀐다 (사용자 규칙 2026-09-07). 표현 시안 html[data-ctxfx]:
   H1 즉시 교체(Figma 구조 그대로) · H2 카운터 롤(숫자가 위로 굴러 바뀌고 라벨 크로스페이드, 메인은 "{옵션} 선택중") · H3 진행 바(얇은 바가 k/n 만큼 차오름 + 롤) */
export const OPTIONS = ['색상', '용량', '수령 방법', '납부 기간', '사용자', '가입 유형', '요금제', '할인 방법', '추가 할인 수단', '쿠폰', '결제 방법', '추가 혜택', '주민등록번호', '주소', '본인 인증', '신원 인증', '납부 수단', '요금안내서', '결제']
/* M2: 라벨+카운트 한 덩어리가 아래에서 올라오며 교체 (이전 덩어리는 위로 빠짐) */
function Swap({ k, phrase, n }) {
  const [prev, setPrev] = useState(null), lastRef = useRef({ k, phrase })
  useEffect(() => {
    if (lastRef.current.k === k && lastRef.current.phrase === phrase) return
    setPrev(lastRef.current); lastRef.current = { k, phrase }
    const t = setTimeout(() => setPrev(null), 520); return () => clearTimeout(t)
  }, [k, phrase])
  const line = (p, cls) => <span className={`swap-line ${cls}`} key={cls + p.k}><span className="main">{p.phrase}</span><span className="cnt">{Math.min(p.k, n)}/{n}</span></span>
  return <span className="swap">{prev && line(prev, 'out')}{line({ k, phrase }, prev ? 'in' : 'stay')}</span>
}
// 옵션별 문구: 고르는 것은 '{옵션} 선택중', 적는 것은 '입력중', 인증은 '본인 인증중', 결제는 '결제 진행중'
const PHRASE = { '주민등록번호': '주민등록번호 입력중', '주소': '주소 입력중', '본인 인증': '본인 인증중', '신원 인증': '신원 인증중', '결제': '결제 진행중' }
export function ContextHeader({ k = 7, n = OPTIONS.length, label }) {
  const fx = variant('ctxfx'), name = label || OPTIONS[k - 1] || '', phrase = PHRASE[name] || `${name} 선택중`
  const done = k >= n && label === '완료'
  if (fx === 'H4' || fx[0] === 'M') return (   // Figma ixGPs9 51:26203 — 한 줄: ✦ {옵션} 선택중 k/n · 우측 [원래 화면으로 ›] 글래스 필. 변화 모션 M1 롤 / M2 슬라이드 교체 / M3 스파클 펄스
    <div className={`ctx-header fx-H4 m-${fx}`}>
      <div className="row">
        <span className="nav-wrap" key={fx.startsWith('M3') ? k : 'nav'}><img className="nav" src="/icons/ctx_navigate.svg" alt="" /><i className="glow" /></span>
        {fx === 'M2' ? <Swap k={k} phrase={phrase} n={n} /> : <>
          <span className="main"><span className="roll-lbl" key={name}>{fx === 'H4' ? '휴대폰 옵션 선택중' : phrase}</span></span>
          <span className="cnt"><span className="roll-num" key={k}>{Math.min(k, n)}</span>/{n}</span>
        </>}
      </div>
      <button type="button" className="back-pill">원래 화면으로 <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5 8 6l-3.5 3.5" stroke="#101010" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    </div>
  )
  return (
    <div className={`ctx-header fx-${fx}`}>
      <div className="ico"><img src="/icons/ico_graph_s.svg" alt="" /></div>
      <div className="txt">
        <div className="main">{fx === 'H2' ? <><span className="roll-lbl" key={name}>{name}</span> 선택중</> : '휴대폰 옵션 선택중'}</div>
        <div className="sub">
          <span>단계 <span className="roll-num" key={k}>{Math.min(k, n)}</span>/{n}</span><span>∙</span>
          {fx === 'H2' ? <span>휴대폰 옵션</span> : <span className="roll-lbl" key={name}>{name}</span>}
        </div>
        {fx === 'H3' && <div className="ctx-bar"><i style={{ width: `${Math.round(Math.min(k, n) / n * 100)}%` }} /></div>}
      </div>
    </div>
  )
}

// SearchAi 위치·타이핑 리듬 — AgentHome(스텝 3)과 AgentChat(스텝 10)이 같은 값을 쓴다
export const SEARCH_BOTTOM = 24        // 키보드 닫힘: SearchAi bottom (Figma 12349:37312)
export const SEARCH_BOTTOM_KB = 319    // 키보드 열림: 키보드(310) 위
export const TYPE_MS = 1000            // 발화 전체 타이핑 시간

// 발화 타이핑 리듬 — delay 뒤 시작, TYPE_MS 동안 한 글자씩, 끝나고 0.25s 뒤 커서 종료. AgentHome·LaunchOverlay 공용
export function useTyped(typed = '', delay = 700) {
  const [shown, setShown] = useState('')
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!typed) { setShown(''); setTyping(false); return }
    if (reducedMotion()) { setShown(typed); setTyping(false); return }   // 재로드 복원·reduced-motion: 타이핑 없이 완성 문장
    let i = 0, id
    setShown(''); setTyping(false)
    const start = setTimeout(() => {
      setTyping(true)
      id = setInterval(() => {
        i += 1; setShown(typed.slice(0, i))
        if (i >= typed.length) { clearInterval(id); setTimeout(() => setTyping(false), 250) }
      }, TYPE_MS / typed.length)
    }, delay)
    return () => { clearTimeout(start); clearInterval(id) }
  }, [typed, delay])
  return { shown, typing }
}

// Figma 12349:37312: 353×52 · padding 0 20 0 24 · [AI 16] gap 8 [Text 16/22 medium] gap 16 [Voice 24]
export function SearchAi({ value = '', placeholder = 'T에 대해 무엇이든 물어보세요.', style, caret = false, innerRef }) {
  return (
    <div className="search-ai" style={style} ref={innerRef}>
      <div className="input">
        <IcoSparkle size={16} className="spark" />
        <div className={`field ${value || caret ? 'filled' : ''}`}>{value || (caret ? '' : placeholder)}{caret && <i className="caret" />}</div>
      </div>
      <IcoVoice size={24} className="voice" />
    </div>
  )
}

export function HomeIndicator() {
  return <div className="home-ind"><i /></div>
}

// iOS 키보드 목업 (Figma 11996:19903 · 12349:37144). slide=true 면 아래에서 올라오는 전환용(.on 으로 열림)
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
export function Keyboard({ slide = false, open = true }) {
  return (
    <div className={`keyboard ${slide ? 'slide' : ''} ${open ? 'on' : ''}`} aria-hidden>
      {KEY_ROWS.map((row, ri) => (
        <div className={`krow r${ri}`} key={ri}>
          {ri === 2 && <div className="key wide sym">⇧</div>}
          {row.split('').map((k) => <div className="key" key={k}>{k}</div>)}
          {ri === 2 && <div className="key wide sym">⌫</div>}
        </div>
      ))}
      <div className="krow r3">
        <div className="key abc">ABC</div>
        <div className="key space" />
        <div className="key ret">↵</div>
      </div>
      <div className="kfoot">
        <img src="/icons/emoji.svg" alt="" />
        <img src="/icons/mic.svg" alt="" />
      </div>
    </div>
  )
}
