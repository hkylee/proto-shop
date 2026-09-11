import { AgentBackground, StatusBar, AppbarAi, ContextHeader, SearchAi, HomeIndicator, Keyboard, SEARCH_BOTTOM_KB, useTyped } from './AgentShell.jsx'
import { IcoWon } from '../components/Icons.jsx'

// Figma 11996:19903 / 11996:20120 — Agent 실행 직후 홈 (키보드 열림)
const SUGGESTIONS = ['구독 상품 해지하고 싶어', '가족 결합 현황 확인해줘', '이번달 요금이 많이 나온 이유 알려줘']

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
