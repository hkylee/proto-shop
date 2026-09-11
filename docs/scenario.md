# 시나리오: 상품 상세 → Agent 요금제 추천

출처: Figma oWim7Vh2m7pYSq0NiKHWAM, 섹션 "Node 확인 용" (node 12014-26030). 2026-09-03 추출.
화면 이미지: `assets/screens/`

| # | 존 | 스텝(화면) | 고객 | 요건/메모 | 화면 파일 |
|---|---|---|---|---|---|
| 1 | 상품 상세 | 상품 상세 진입 | 갤럭시 Z플립 구매를 위해 상품 상세 진입 | 하단 BottomGroupAi(AI 원형 버튼 + 구매하기) | s1-product-detail.png, s1-bottomgroup-ai.png |
| 2 | 상품 상세 | 상품 상세 화면 내 옵션 기 선택 | (화면 조작) | *색상, 용량, 배송, 가입유형, 회선, 사용자 선택 | s2-option-select.png, s2-appbar.png |
| 3 | Agent | AI Agent 실행 (홈) | AI 버튼 탭 | AppbarAi(Chat) "SKT Agent", 컨텍스트 "휴대폰 옵션 선택중 · 단계 6/15 · 요금제", 인사 + 추천 발화 ButtonAi 3개, SearchAi + 키보드 | s3a-agent-launch.png (Figma 11996:19903) |
| 4 | Agent | 발화 입력 | "이용 현황에 맞춰서 적합한 요금제 추천해줘" | SearchAi에 발화 텍스트 채워짐 | s3b-agent-launch.png (11996:20120) |
| 5 | Agent | 이용현황 분석 | (발화 전송) | 칩 "요금제 추천"으로 전환, User 말풍선, "이용 현황 조회중" → AiAgentTitle "최근 6개월 이용 현황을 먼저 살펴볼게요" → Ai 메시지 → 이용중 요금제 카드 → 6개월 그래프 카드 | s4a-usage-analysis.png (11996:22260) |
| 6 | Agent | 요금제 추천 | — | "요금제 조회중" → "가장 추천하는 요금제는 다음과 같아요" → 5GX 프라임 카드 → 현재 요금제와 비교 카드 → Ai 메시지 → ButtonAi "5GX 프라임 플러스로 진행하기" / "다른 요금제 살펴보기" | s4b-plan-recommend.png (11996:22353) |

참고
- 상품 상세 풀 케이스 레퍼런스: node 11230-27110 → `assets/screens/ref-product-detail-full.png` (393×8298 스티칭)
- Figma Agent 화면은 프레임에 luminosity 블렌드가 걸려 회색조로 내보내짐. 프로토타입에서는 DS 토큰 컬러(blue-600 #4B59FF, 그라디언트 앵커)로 HTML 재구성.
- 이전 작업(docs/prior-work-0901.md)의 결정: 요금제명은 "5GX 프라임 플러스"로 통일, AppbarAi History 아이콘 제외(NewChat만), 상단 진행 표시는 시안 2(앱바 인라인 칩) 선호 흐름.
