import { AgentBackground, StatusBar, AppbarAi, ContextHeader, SearchAi, HomeIndicator, Keyboard, SEARCH_BOTTOM_KB, useTyped } from './AgentShell.jsx'
import { IcoWon } from '../components/Icons.jsx'

// Figma 11996:19903 / 11996:20120 — Agent 실행 직후 홈 (키보드 열림)
const SUGGESTIONS = ['지금 이용중인 휴대폰과 뭐가 달라', '기기변경하면 받을 수 있는 혜택 뭐있어', '나의 이용현황에 맞는 요금제 추천해줘']   // 시안 2(ProductDetail1 SUGGEST)와 같은 문구로 일괄 (사용자 2026-09-16)

const TYPE_DELAY = 700  // Agent 홈 노출 후 타이핑 시작까지

export default function AgentHome({ typed = '' }) {
  const { shown, typing } = useTyped(typed, TYPE_DELAY)
  return (
    <div className="ai-screen">
      <AgentBackground />
      <StatusBar />
      <AppbarAi chip="SKT Agent" />
      <ContextHeader />

      <div className="greeting">안녕하세요 하경님!<br />무엇을 도와드릴까요?</div>

      <div className="suggest-stack">
        {SUGGESTIONS.map((t) => (
          <div className="button-ai" key={t}><IcoWon />{t}</div>
        ))}
      </div>

      <SearchAi value={shown} caret={typing} style={{ bottom: SEARCH_BOTTOM_KB }} />
      <Keyboard />
      <HomeIndicator />
    </div>
  )
}
