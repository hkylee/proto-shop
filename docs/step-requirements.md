# 스텝별 구현 요건 (내부 메모 · 배포물에는 노출하지 않음)

2026-09-03 기준. 배포되는 플레이어에는 `steps.json`의 `purpose`(기획 목적)만 표시한다.
아래 요건은 화면을 구현·검수할 때 참고용으로만 쓴다.

## 1. 상품 상세 진입 (상품 상세)
- 상품 상세 진입 시 하단 BottomGroupAi 노출: AI 원형 버튼(ButtonIconAiItem, TAgent 아이콘) + CTA(Primary)
- AI 버튼은 화면 어디서나 Agent 진입점 역할 (컨텍스트: 현재 상품·선택 옵션)
- 하단 요약 바: 단말 / 통신요금 / 예상 월 청구금액 = "계산 전"

## 2. 옵션 기 선택 (상품 상세)
- 선택 완료 항목: 색상(그라파이트) · 용량(256GB) · 납부기간(6개월) · 가입유형(기기변경) · 사용자(본인)
- 미선택 항목(요금제)은 Agent 컨텍스트 '단계 6/15 · 요금제'로 이어짐
- 하단 BottomGroupAi 유지, CTA는 다음 미선택 항목명("요금제 선택하기")

## 3. AI Agent 실행 (Agent)
- AppbarAi(Chat): Back + ContextualChip 'SKT Agent' + NewChat (History 아이콘은 제외 — 이전 작업 결정)
- 컨텍스트 헤더: '휴대폰 옵션 선택중 · 단계 6/15 · 요금제'
- 인사 문구 + 추천 발화 ButtonAi 3개(구독 해지 / 가족 결합 / 요금 사유), 좌측 Won 아이콘
- SearchAi 포커스 + 키보드 노출

## 4. 발화 입력 (Agent)
- SearchAi에 발화 텍스트 입력 (placeholder → 입력값)
- 전송 시 컨텍스트 칩 'SKT Agent' → '요금제 추천' 전환

## 5. 이용현황 분석 (Agent)
- User 말풍선(AiAgentMessage/User) 우측 정렬
- '이용 현황 조회중' 상태 텍스트 → AiAgentTitle '최근 6개월 이용 현황을 먼저 살펴볼게요'
- Ai 메시지: 6개월 평균 22.4GB, 제공량 20GB 초과, 최근 3개월 속도 제한
- AiAgentCard ① 이용중 요금제(0 청년 69 · 월 62,800원 · 데이터 20GB · 넷플릭스/FLO 배지) ② 6개월 사용량 그래프(8월 39.9GB 강조, 평균선)
- 카드 순차 등장 (애니메이션 일괄 적용 예정)

## 6. 요금제 추천 (Agent)
- '요금제 조회중' → AiAgentTitle '가장 추천하는 요금제는 다음과 같아요'
- AiAgentCard ③ 추천 요금제(5GX 프라임 플러스 · 월 99,000원 · 무제한) ④ 현재 요금제와 비교(TextProductGroup 2열: 기존 0 청년 69 62,800 / 변경 후 5GX 프라임 플러스 99,000)
- Ai 메시지: 무제한 요금제로 속도 제한 없이 여유
- ButtonAi 2개: '5GX 프라임 플러스로 진행하기' / '다른 요금제 살펴보기'

## 공통
- 폰 화면은 흑백(grayscale) 렌더 — Figma 내부 검토용 룩과 동일
- 아이콘은 NEXT DS IconItem 실물 SVG (public/icons/ds/)
- 상품 상세는 PNG가 아닌 HTML 재구성 (선명도·애니메이션 대응)
