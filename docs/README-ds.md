# 디자인 시스템 참고 자료

- `ds-portal-components.md` — SKT DS 포털 153개 컴포넌트 레퍼런스(v0.6.0, 2026-09-01 추출). 원본 그대로 이 폴더에 있습니다.
  AI 전용 컴포넌트 항목: AppbarAi, BottomGroupAi, ButtonAi, ButtonIconAiItem, SearchAi, BottomSheetAi,
  AiAgentBottomSheet, AiAgentCard, AiAgentMessage, AiAgentTitle, AiAgentBottomSheetItem.
  단계 표시 관련: ProgressStepper("1 / 99" 텍스트), CellProgress(세로 단계 셀), ProgressBar.
- 함께 참조하는 Figma:
  - DS 라이브러리: NEXT Platform Design System Library (NftD7SW7XAhm4VkeYk8omQ)
  - 레퍼런스 화면: 내부용 SKT NC 요구사항 협의 및 분석 (oWim7Vh2m7pYSq0NiKHWAM, node 11855-96463 AiChat)

## 레퍼런스 화면에서 확인한 토큰 (AiChat 프레임)

| 역할 | 값 |
|---|---|
| bg/layer/basement | #E2E6F1 |
| fg/neutral-solid | #060C1F |
| fg/neutral-mute | #4F5972 |
| fg/neutral-subtle | #6C7691 |
| bg/neutral-subtle | rgba(0,38,140,.08) |
| blue-600 / fg/brand-solid | #4B59FF / #3A38EC |
| blue-50 / blue-100 | #F0F4FF / #DEE6FF |
| gray-200 | #D3D9E8 |
| cardhome/bg/default | rgba(255,255,255,.9) |
| bg/ai-subtle | rgba(255,255,255,.4) |
| shadow/neutral-mute | 0 0 80px rgba(16,49,140,.12) |
| radius | 4 / 8 / 20 / 28 / 999 |
| 폰트 | Pretendard Variable, letter-spacing -4% |
| 모바일 프레임 | 393 × 852, 콘텐츠 353 |

AI 전용 컴포넌트: AppbarAi(Chat), ContextualChip, AiAgentMessage(Ai/User), AiAgentCard, ButtonAi, SearchAi, BottomGroupAi(UpperItem=AiSuggestion).
