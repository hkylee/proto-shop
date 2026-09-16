import { Fragment, useEffect, useRef, useState } from 'react'
import { AgentBackground, StatusBar, AppbarAi, ContextHeader, SearchAi, HomeIndicator, Keyboard, SEARCH_BOTTOM, SEARCH_BOTTOM_KB, TYPE_MS, OPTIONS } from './AgentShell.jsx'
import { IcoBrand, IcoSparkle } from '../components/Icons.jsx'
import Pointer, { userTap } from '../components/pointer.js'
import { useSheetOut } from '../lib/sheet.js'
import { wait, tween, scrollTo, panTo, inOut, inOutSine, inOutQuart, outExpo, cubicOut, clamp01, linear, afterLayout, reducedMotion } from '../lib/motion.js'
import { variant } from '../lib/variants.js'
import { PRE_MSG, PRE_MSG_B, PRE_MSG2, PRE_ROWS, PRE_CHIP, LAST_Q, LAST_A } from '../data/an2.js'
import { SCREEN_H as SH } from '../lib/screen.js'

const SHEET_TABS = ['베스트', '라이트', '전용', '스마트기기', '다이렉트', '전체']
// '라이트' 탭 임시 데이터 (B-2 탭 둘러보기용)
const SHEET_PLANS_LIGHT = [
  ['5GX 레귤러 플러스', '월 79,000원', '데이터 250GB・테더링 50GB'],
  ['5GX 레귤러', '월 69,000원', '데이터 110GB・테더링 40GB'],
  ['5GX 슬림', '월 55,000원', '데이터 15GB・테더링 15GB'],
  ['베이직', '월 49,000원', '데이터 8GB'],
]
const ALT_PLANS = [
  ['5GX 프라임 플러스', '월 99,000원', '데이터 무제한・테더링 80GB'],
  ['베스트 Max', '월 129,000원', '데이터 무제한・테더링 140GB'],
  ['베스트 Pro', '월 119,000원', '데이터 무제한・테더링/공유 120GB'],
  ['베스트 109', '월 109,000원', '데이터 무제한・테더링/공유 80GB'],
  ['베스트 99', '월 99,000원', '데이터 무제한・테더링/공유 80GB'],
]
// 바텀시트 '베스트' 탭 = 위 목록에서 베스트 Max 를 뺀 4개 (Figma 12067:30027) — 이제 풀페이지 팝업의 데이터로 쓰인다
const SHEET_PLANS = ALT_PLANS.filter((_, i) => i !== 1)
// 스텝 5 전체 요금제 = 풀페이지 팝업 (Figma ixGPs9 88:83221 → 88:83232, 사용자 2026-09-08: 바텀시트 → 풀페이지). ListProductHorizontal 컴팩트 카드 4장, 선택 = 2px 검정 테두리
//  Figma 의 '0 청년 99' 대신 흐름과 맞는 SHEET_PLANS 순서 유지 (선택 index 0 = 5GX 프라임 플러스 = planIdx 0)
const POP_PLANS = [
  // 스펙은 '데이터 | 테더링' 두 항목 한 줄 (사용자 스크린샷 2026-09-16 18:03 형식)
  { name: '5GX 프라임 플러스', price: '99,000원', caps: ['데이터 무제한', '테더링 80GB'] },
  { name: '베스트 Pro', price: '119,000원', caps: ['데이터 무제한', '테더링 120GB'] },
  { name: '베스트 109', price: '109,000원', caps: ['데이터 무제한', '테더링 80GB'] },
  { name: '베스트 99', price: '99,000원', caps: ['데이터 무제한', '테더링 80GB'] },
]
const POP_PLANS_LIGHT = SHEET_PLANS_LIGHT.map(([name, price, desc]) => ({ name, price: price.replace('월 ', ''), caps: desc.split('・') }))
const PLAN_DEFAULT = 0, PLAN_RESELECT = 2   // 5GX 프라임 플러스 → (스텝 9) 베스트 109
// [다른 요금제 살펴보기] 결과를 ListProductHorizontal 카드로 (Figma ixGPs9 23:11234, html[data-altcard]). ALT_PLANS 앞 3개와 1:1
//  할인 3종 금액 = 요금 × 25% × 기간 (선택약정), 공통지원금은 임의값. 실제 값은 Figma 가 99,999,999원 더미라 프로토타입용으로 채움
const ALT_CARDS = [
  { badge: 'AI PICK', price: '99,000원', caps: ['데이터 무제한', '통화 무제한', '문자 무제한'], more: '+2', support: '450,000원', m12: '297,000원', m24: '594,000원' },
  { badge: '추천',    price: '129,000원', caps: ['데이터 무제한', '통화 무제한', '문자 무제한'], more: '+3', support: '500,000원', m12: '387,000원', m24: '774,000원' },
  { badge: '추천',    price: '119,000원', caps: ['데이터 무제한', '통화 무제한', '문자 무제한'], more: '+2', support: '480,000원', m12: '357,000원', m24: '714,000원' },
]
// 안내문(본문) 카피 시안 (html[data-altcopy]) — 카드에 할인 방법까지 들어오면서 문장이 무엇을 안내해야 하는지 달라짐
const ALT_COPY = {
  C0: '데이터를 무제한으로 이용할 수 있는 요금제들을 추천드려요. 원하는 요금제를 선택해보세요.',
  C1: '데이터 무제한 요금제 중 하경님 이용 패턴에 맞는 3개를 골랐어요. 요금제와 할인 방법을 함께 선택해 보세요.',
  C2: '무제한 요금제 3개를 추천드려요. 할인 방법까지 한 번에 고를 수 있어요.',
  C3: '첫 번째가 하경님 사용량에 가장 잘 맞는 AI PICK이에요. 다른 요금제도 함께 비교해 보세요.',
}
const CHIP_UP = '쿠폰 선택으로 이동 ↑', CHIP_DOWN = '이어서 선택으로 이동 ↓', CHIP_PLAN = '요금제 선택으로 이동 ↑', CHIP_BACK = '변경 결과로 이동 ↓', CHIP_RESUME = '신청서 작성으로 이동 ↓'

// 추가혜택 (Figma 12120:33276) — RadioCard 3개, 미선택
const BENEFITS = [
  ['청년 데이터 60GB 추가', '매일 데이터를 넉넉하게 사용해요'],
  ['콘텐츠 이용권', 'YouTube, Netflix, TVING 중 하나를 골라요'],
  ['추가혜택을 선택하지 않을게요', '나중에 T world에서 신청할 수 있어요'],
]

// 할인방법 (Figma 12132:34343 · 상세 12132:39475) — RadioCard 3개: 제목 · 우측 총액 · '자세히 보기 ⌄' → 펼치면 CellRightTable 8행
// detail: [항목, 값]. 두 묶음(휴대폰 가격 할인 4행 · 통신 요금 할인 4행)으로 나눠 X-2 시안에서 소제목을 붙인다
const DISCOUNTS = [
  { title: '12개월간 통신요금', total: '총 643,000원', detail: [
    ['휴대폰 가격', '1,684,000원'], ['공통 지원금', '0원'], ['추가 지원금', '346,000원'], ['휴대폰 가격 할인 금액', '346,000원'],
    ['통신 요금', '월 99,000원'], ['할인율', '25%'], ['할인 기간', '12개월'], ['통신 요금 할인 금액', '297,000원'],
  ] },
  { title: '통신요금을 24개월간', total: '총 940,000원', badge: '할인 총액이 가장 커요', detail: [
    ['휴대폰 가격', '1,684,000원'], ['공통 지원금', '0원'], ['추가 지원금', '346,000원'], ['휴대폰 가격 할인 금액', '346,000원'],
    ['통신 요금', '월 99,000원'], ['할인율', '25%'], ['할인 기간', '24개월'], ['통신 요금 할인 금액', '594,000원'],
  ] },
  { title: '24개월간 휴대폰 가격', total: '총 896,000원', detail: [
    ['휴대폰 가격', '1,684,000원'], ['공통 지원금', '500,000원'], ['추가 지원금', '396,000원'], ['휴대폰 가격 할인 금액', '896,000원'],
    ['통신 요금', '월 99,000원'], ['할인율', '0%'], ['할인 기간', '—'], ['통신 요금 할인 금액', '0원'],
  ] },
]
const DETAIL_GROUPS = ['휴대폰 가격 할인', '통신 요금 할인']   // X-2: 4행씩 소제목
const ACC_DEMO_ROW = 1                                        // 시연에서 펼치는 항목 = 통신요금을 24개월간 (Figma 12132:39475)

// 10번: 위약금 질문 (Figma 12349:37144 키패드 · 12349:37232 말풍선) — 스텝 3과 같은 타이핑 인터랙션
const PENALTY_Q = '지금 요금제 변경해도 위약금 없어?'   // Figma ixGPs9 27:12503
const CHIP_DEFAULT = '요금제 추천', CHIP_PENALTY = '휴대폰 구매' // 컨텍스트 칩 (Figma 12349 프레임은 '휴대폰 구매')
// 위약금 답변 (Figma 12370:42010): 타이틀 → 본문 → 회선/약정 카드(CellRightTable 3행 + 구분선 + 예상 할인 반환금 18Semi) → ButtonAi → 할인 선택 재제시
const PENALTY_ROWS = [['내 회선', '010-9292-9292'], ['현재 약정', '선택 약정 24개월'], ['약정 만료일', '2025. 8. 22 (만료됨)']]
const PENALTY_TOTAL = ['예상 할인 반환금', '0원']
const PENALTY_RESUME = '이어서 옵션 선택하기'
const PENALTY_PICK = 0                       // 재제시된 할인 카드에서 고르는 항목 = 12개월간 통신요금 (Figma 선택 상태)
const PEN_BUBBLE_Y = 136                     // 말풍선 상단 = 채팅 시작선 + 136 (Figma 12349:37232, 425/1080 × 852 ≈ 335px)

// Figma 11996:22260 (usage) / 11996:22353 (recommend) — DS 토큰으로 재구성
const MONTHS = ['3월', '4월', '5월', '6월', '7월', '8월']
// 152px 그래프 영역 기준 막대 높이 (Figma 값)
const BARS = [11.5, 55.4, 41.8, 101.9, 79, 84.6]

/* ── 레이아웃 상수 (393×852, Figma 498px 프레임 환산) ── */
const SCREEN_H = SH   // 기본 852. F-2(화면 높이 유동)에서는 실제 뷰포트 높이 — src/lib/screen.js
const CHAT_TOP = 140          // 고정 헤더(상태바 59 + 앱바 48 = 107) 아래 33px (Figma 483:145930 첫 말풍선 top) — 헤더 그라데이션 꼬리(33px)가 말풍선을 가리지 않는 선. 채팅 시작선 = 두 번째 오프닝 앵커 위치 (.chat-scroll padding-top). 컨텍스트 헤더 줄이 없어져 199 → 124 (2026-09-16)
const SEARCH_H = 52
const SEARCH_TOP = SCREEN_H - SEARCH_BOTTOM - SEARCH_H       // SearchAi 상단 = 776
const SEARCH_TOP_KB = SCREEN_H - SEARCH_BOTTOM_KB - SEARCH_H // 키보드 위로 올라간 SearchAi 상단
const GAP = 30                // 마지막 카드/칩 ↔ SearchAi
const TAIL = SCREEN_H - SEARCH_TOP + GAP                      // 채팅 끝 여백 106: 마지막 카드가 SearchAi 위 30px 에 오도록
const PEN_TAIL = SCREEN_H - CHAT_TOP - 44 + 30               // 말풍선 아래 답변 자리 여백 → 말풍선을 시작선까지 올릴 수 있는 tail
const OPENING_MT = 23, TURN_GAP = 8                          // .opening margin-top · 턴 컨테이너 flex gap (agent.css 와 동일)
const OPENING_OUTER = OPENING_MT + TURN_GAP
const LATER_THAN_ALT = ['sheet', 'penalty', 'opts1', 'opts', 'opts2', 'replan', 'form', 'addr', 'contact', 'review', 'auth', 'pay', 'payout']   // usage 보다 뒤인 스텝들
/* 15 [결제하기] 탭 → 결제(외부) 화면으로 이동해 마무리 (T1mhl 10906:6338: 흰 화면 · 닫기 · '외부이동'). 돌아오지 않는다 = 플로우 끝 */
/* 14 [실물 신분증 촬영] 탭 → 밖(신분증 촬영)으로 → 복귀 → '신원 인증 완료' 선 → 요금 납부 방식(기존 수단 유지 추천 → 탭) → 요금안내서(Bill Letter 추천 → 탭) → 결제 안내 + 시트 [결제하기] (T1mhl 10906:5737)
   업무처리 결과 선(txt_complete)은 왼쪽 → 오른쪽으로 그려진다: 시안 html[data-line] D1 선만 / D2 순차(체크 → 글 → 선) / D3 한 붓 */
const AUTH_SHEET3 = { title: '기기를 결제할까요?', items: ['결제하기'], alert: false }
const PAY_DONE = '신원 인증 완료'
const PAY_MSGS = ['신원인증 처리가 완료되었어요. 휴대폰 개통을 이어서 하려면 휴대폰 요금 납부 방식을 선택해야 돼요.', '기존 납부 수단을 유지하면 편리하게 이용할 수 있어요.', '요금안내서는 Bill Letter를 이용하는 것을 가장 추천해요. 다른 방식들도 안내해드릴게요.', '휴대폰 개통을 위한 모든 선택이 완료되었어요. 결제를 마무리하면 개통이 완료돼요. 결제 과정을 이어가볼까요?']
const PAY_KEEP = { title: '기존 납부 수단 유지', rows: [['납부 수단', '계좌이체\n농협 / 1234-****-****-12'], ['예금주', '김하경']] }
const PAY_LINKS = ['계좌이체', '체크/신용카드']
const BILLS = ['Bill Letter 앱', '문자 요금안내서', '이메일 요금안내서', 'T world 앱']
/* 10~13 신청서 시트 플로우 (Figma ixGPs9 67:28493, 2026-09-08): [신청서 작성 시작하기] 탭 → 말풍선 → 개인정보 Alert → 화면 딤 + AiAgentBottomSheet 4장(‹ n/4 › ×)
   10 주민등록번호(61:38454) → 11 주소(52:58702: 우편번호+검색 · 상세 주소 2 · 5G 안내 확인 체크) → 12 이메일(52:60548) · 연락 번호(52:61515) → 13 시트 닫힘 → Alert 자리에 안내 + '작성 완료 · 재입력' 선 → 신청서 카드 + [개통 이어가기] (52:62418)
   키패드가 열리면 시트가 키패드 위로 올라간다(52:58030). 값은 페르소나(하경) 기준 — Figma 더미(김티월드·123456)와 다름
   14 [개통 이어가기] → 말풍선 → 본인 인증 안내 → AI 바텀시트(6개) → 토스 탭 → 밖(토스)으로 나갔다 복귀 (시안 html[data-ext]) → '본인 인증 완료' 선 → 신원인증 안내 + 시트(3개) (10906:5561 → 5614) */
const ADDR_LABEL = '주소', ADDR_ZIP = '06048', ADDR_LINE = '서울시 강남구 언주로 149길 17 (63-1)', ADDR_DETAIL = '4층 플러스엑스'   // Figma 210:122423 주소 검색 풀페이지 팝업 결과 (더미 123456 대신 목록의 06048)
// 주소 검색 풀페이지 팝업 (Figma 178:87323 → 174:86299): 검색어 타이핑 → 우편번호 · 도로명 · 지번 8행 → 첫 행 탭 → 시트로 복귀
const ZIP_Q = '강남구 언주로 149길'
const ZIP_RESULTS = [['17', '63-1'], ['13', '63-2'], ['12', '62-20'], ['11-4', '63-12'], ['11', '63-3'], ['9', '63-5'], ['7', '63-8'], ['5', '63-10']].map(([n, j]) => ({ zip: '06048', road: `서울특별시 강남구 언주로 149길 ${n}(논현동)`, jibun: `논현동 ${j}` }))
const ADDR_CHK = '5G 이용 가능 지역에 대한 안내 사항을 확인했습니다.'
const EMAIL = 'hakyung@tworld.com', EMAIL_PH = 'tworld@tworld.com', PHONE = '010-9292-9292', PHONE_PH = '010-0000-0000'
const FORM_ALERT = ['개인정보는 안전하게 보호돼요.', '입력하신 개인정보는 신청서 작성을 위해서만 사용되며, 대화를 종료하면 저장된 정보는 사라져요.']
const FSHEETS = ['주민등록번호를 입력해주세요.', '주소를 입력해주세요.', '이메일 주소를 입력해주세요.', '개통 시 연락받을 번호를 입력해주세요.']
const FV0 = { rrn: '', zip: '', line: '', detail: '', chk: false, email: '', phone: '', p2phone: '', p2code: '' }
// 2안(mode='an2') 스텝 15 납부·번호 인증 (Figma ixGPs9 107:47520 · 90:92843 → 90:100465): 시트로 묻고 결과 한 줄만 남긴다
const P2_MSGS = ['신원인증 처리가 완료되었어요. 휴대폰 개통을 이어서 하려면 휴대폰 요금 납부 방식을 선택해야돼요.', '이미 사용 중인 SK텔레콤 휴대폰 번호가 있어서 요금을 함께 납부하면 기존납부 수단을 유지할 수 있어요.', '사용 중인 번호로 인증을 진행해주세요.', '번호 인증이 완료되었어요. 요금안내서는 바로 보는 요금안내서에 함께 안내드릴게요.', '결제를 마무리하면 개통이 완료돼요. 결제 과정을 이어가볼까요?']
const P2_SHEET_A = { title: '요금을 함께 납부하시겠어요?', rows: ['네', '아니요'] }
const P2_SHEET_B = '사용 중인 번호로 인증해주세요.'
const P2_DONE = '번호 인증 완료', P2_CODE = '000000'
/* ── 1안 15번 바닥 납부 (Figma ixGPs9 366:107271, 2026-09-15): 기존 '납부 수단 카드 + 요금안내서 4종' 을 폐기하고
   2안의 '함께 납부하시겠어요?' 흐름을 바닥으로 옮겼다. 시트 없이 대화 안 행 2개 → 고른 답만 줄로 남고 → 번호 카드 한 장 → 확인 선 → 결제 시트 */
const PAY1_ASK = '요금을 함께 납부하시겠어요?'
const PAY1_ROWS = ['네', '아니요']
const PAY1_FOLD = '함께 납부 선택 여부'
const PAY1_NEED = '요금을 함께 납부하시려면, 사용 중인 번호 인증이 필요해요. 요금안내서는 함께 보내드릴게요.'
const PAY1_LABEL = '사용 중인 번호'
const PAY1_LINE = '사용 중인 번호 입력이 완료되었어요.'
const PAY1_CHK = '번호 확인 완료'
const PAY1_AFTER = ['번호 확인이 완료되었어요. 요금안내서는 바로 보는 요금안내서에 함께 안내드릴게요.', '결제를 마무리하면 개통이 완료돼요. 결제 과정을 이어가볼까요?']
const FORM_INTRO = ['가입자 정보를 확인해주세요.', '앞에서 확인한 정보가 맞다면 가입자 정보를 입력해주세요.']
const FORM_DONE = '개통 신청서 작성이 완료되었어요.', FORM_REDO = '수정하기'   // Figma 52:62418 ButtonText (사용자 2026-09-08: 재입력 → 수정하기)
const REVIEW_MSG = '신청서 작성이 완료되었어요. 작성된 내용이 맞는지 확인해주세요.'
const REVIEW_ROWS = [['가입자 이름', '김하경'], ['휴대폰 번호', PHONE], ['주소', `${ADDR_LINE} ${ADDR_DETAIL}`], ['이메일 주소', EMAIL], ['개통 시 연락받을 수 있는 번호', PHONE]]
const REVIEW_CHIP = '개통 이어가기'
/* ── 1안 신청서 바닥 플로우 (Figma ixGPs9 360:81747 → 360:84842, 사용자 2026-09-15 "지금은 모달형식인데 바닥으로 바꿨어")
   스텝 10~13 을 통째로 대체한다. 바텀시트(‹n/4› · [다음] · 딤)는 사라지고 대화 안 흰 카드 하나에 필드 하나.
   10 가입자 정보 조회 → 가입자 정보 카드 → [신청서 작성하기] → 말풍선 → 안내 2줄 + 개인정보 Alert → 주민등록번호 카드
   11 주소(우편번호+[검색] · 상세 주소 2 · 5G 안내 체크) — [검색]은 기존 Z-1 풀페이지 팝업 그대로
   12 이메일 주소 → 개통 시 연락받을 번호
   13 신청서 카드 + [개통 이어가기]
   한 칸이 끝나면 그 카드는 접혀 사라지고 자리에 '│ … 입력이 완료되었어요 ─ 수정하기' 선만 남는다 (html[data-fincard]) */
const LOOKUP_STATUS = '고객 정보 조회 중', LOOKUP_TITLE = ['고객님의 정보를', '조회하고 있어요']
const LOOKUP_ASK = ['가입자 정보를 확인해주세요.', '확인한 정보가 맞다면 신청서 작성을 시작해볼까요?']
const LOOKUP_ROWS = [['가입자 이름', '김하경'], ['휴대폰 번호', PHONE]]   // Figma 더미(김티월드·010-1234-5678) 대신 페르소나 하경
const LOOKUP_CHIP = '신청서 작성하기'
const FIN_DONE_MSG = '필요한 옵션 선택이 모두 완료되었어요. 휴대폰 개통을 이어가려면 신청서 작성을 위한 가입자 정보 확인이 필요한데, 먼저 조회해볼게요.'
const FIN_START = '신청서 작성을 시작할게요.'
const FIN_GUIDE = '개통을 위해서는 개인정보 입력이 필요해요. 주민등록번호, 주소, 이메일 주소, 개통시 연락받을 번호를 순차적으로 입력해주세요.'
const FIN_LABEL = ['주민등록번호', '주소', '이메일 주소', '개통 시 연락받을 번호']
const FIN_DONE = FIN_LABEL.map((t) => `${t} 입력이 완료되었어요.`)
const FIN_NEXT = [
  ['주민등록번호가 저장되었어요.', '주소를 입력하고 안내사항을 확인해주세요.'],
  ['주소가 저장되었어요.', '이메일 주소를 입력해주세요.'],
  ['이메일 주소가 저장되었어요.', '개통이 되었을 때 연락 받을 수 있는 번호 입력이 필요해요.'],
]
const AUTH_MSG1 = <>개통을 하기 앞서 본인 인증이 필요해요.<br />어떤 방법으로 인증할까요?</>   // 두 줄 (사용자 2026-09-16)
const AUTH_DONE = '본인 인증 완료'
const AUTH_MSG2 = <>휴대폰 개통을 이어서 하려면 신원인증이 필요해요.<br />어떤 방법으로 인증할까요?</>   // 두 줄, '본인인증 처리가 완료되었어요.' 는 바로 위 완료 선이 대신한다 (사용자 2026-09-16)
const AUTH_SHEET1 = { title: '어떤 방법으로 인증할까요?', desc: '가입자 정보 확인을 위한 인증을 진행해주세요.', items: ['신용카드', 'PASS', '카카오', '카카오뱅크', '네이버', '토스'] }
const AUTH_SHEET2 = { title: '어떤 방법으로 인증할까요?', desc: '신분증 인증과 안면인증을 진행해주세요', items: ['실물 신분증 촬영', 'PASS 앱 이용', '모바일 신분증 이용'] }
const AUTH_ALERT = ['본인인증 전 읽어주세요', '다른 사람의 개인 정보를 도용하면 관련 법령에 따라 처벌 받을 수 있습니다.']
const EXT_PICK = 5   // 토스
// 주민등록번호 입력값 (앞 7자리는 타이핑, 뒷자리는 마스킹). 이전 카드형 입력(Figma 26:36540/36595, html[data-fill] I1~I3 · data-kbfield K1~K3)은 67:28493 시트 플로우로 대체됨 (2026-09-08)
const FORM_LABEL = '주민등록번호', FORM_PH = '123456-7890123'
const FORM_VAL = '900101-1', FORM_MASK = '●●●●●●'   // 앞 7자리는 타이핑, 뒷자리는 마스킹
const USAGE_READ = 2400                              // 스텝 4 추천 문단(6줄) 읽는 시간 — 사용자 피드백 2026-09-07 '너무 빨리 내려간다'
const USAGE_PAN = { speed: 0.22, min: 1400, max: 3600, ease: inOutSine }   // 그 뒤 내려가는 팬은 평소(320px/s)보다 느리게
const KB_TOP = SCREEN_H - 310                        // 키패드 상단 = 542. 필드 타이핑 중엔 SearchAi 를 숨기므로 이 선 기준으로 정렬

/* ── 시나리오 v3 (2026-09-07, 전시 파일 ixGPs9 기준) ──
   4 이용현황 → 추천(한 문단) + 이용중 카드 + 요금제 카드 캐러셀 + [전체보기]      (26:26073)
   5 바텀시트                                                                     (1:5077)
   6 적용 → 끼어든 질문(위약금) → 답변 → 요금제·할인 재제시 카드                    (27:12503 → 27:12538 → 27:26848)
   7 옵션 순차 선택 ①: 할인 24개월 탭 → 추가 할인 수단 → 쿠폰 → 결제 방법           (26:31995)
   8 재선택: 마지막 안내가 뜨자 쿠폰 섹션으로 올라가 30,000원으로 바꾸고 내려옴
   9 추가 혜택 선택 → 옵션 선택 완료 + [신청서 작성 시작하기]                       (26:33289) */
const USAGE_MSG = '현재 이용 패턴을 고려하면 데이터를 제한 없이 사용할 수 있는 5GX 프라임 플러스를 추천드려요. 최근 6개월간 현황을 살펴보니 월평균 22.4GB를 사용해 제공량 20GB를 초과했고, 초과 시 속도 제한이 적용되고 있어요. 요금제를 변경하시면 월 36,200원이 높아지지만, 데이터를 제한 없이 사용할 수 있고 넷플릭스·FLO 혜택도 함께 이용할 수 있어 추천드려요. 다른 요금제들도 같이 보여드릴게요.'
const PEN_MSGS = ['지금 요금제를 변경해도 위약금이나 할인반환금은 발생하지 않아요. 안심하고 변경하셔도 돼요.', '이어서 요금제와 할인 방법을 확인해볼까요?']
const DISC_REC = 2   // 재제시 카드에서 추천·탭하는 할인 = 선택약정 24개월
// 옵션 순차 선택: 미리 선택하지 않고 안내문이 추천을 말하고 추천 행에 '추천' 배지, 사용자가 탭해 고른다 (사용자 방향 2026-09-07). rows = [이름, 설명, 우측값]
/* ── 스텝 4~7 여정 (Figma ixGPs9 435:179973, 사용자 2026-09-15) ────────────────────────────────────
   4 추천 문단 → 이용중 요금제 카드 → **요금제 세로 리스트 카드**(3행 + [전체보기])   ← 가로 캐러셀 A-1 을 대체
   5 [전체보기] → 풀페이지 팝업 → 선택 → [적용하기] → 카드가 접히고 '선택한 요금제' 줄 → **할인 방법 턴**(바닥 3행)
   6 끼어든 질문(위약금) → 조회 타이틀 → 답변 2줄 → 할인 방법 재제시(바닥 3행, 공통지원금 추천)
   7 할인 선택 → '선택한 할인방법' 줄 → **추가 혜택 턴**(바닥 3행) */
const CUR_PLAN = { name: '0플랜 미디엄', price: '월 49,000원', caps: '데이터 20GB・통화 무제한・문자 무제한' }
const PLAN_ALL = '전체보기', PLAN_PICK_TITLE = '요금제를 선택해주세요'
const DISC_MSG = <>할인 방법에 따라 휴대폰 가격과<br />월 통신요금에서 받을 수 있는 할인 금액이 달라져요.<br />비교해보고 할인 방법을 선택해주세요.</>   // 세 줄 (사용자 2026-09-16)   // 사용자 2026-09-16 (이전: '공통지원금으로 할인 받으시는걸 추천드려요. 24개월동안…')
const DISC_LIST = [
  ['공통지원금', '-300,000원', '휴대폰 가격에서 바로 할인'],
  ['선택약정 12개월', '-250,000원', '12개월간 통신요금 25% 할인'],
  ['선택약정 24개월', '-280,000원', '24개월간 통신요금 25% 할인'],
]
const DISC_PICK = 0                                  // 추천·선택 = 공통지원금 (Figma 435:178652 검은 테두리)
const DISC_FOLD = '선택한 할인방법'
const FOLD_REDO = '재선택'   // 접힌 요약 줄의 되돌리기 라벨 (사용자 2026-09-16: '다시 선택하기' → '재선택')
const PEN_ANSWER = ['지금 요금제를 변경해도 위약금이나 할인반환금은 발생하지 않아요. 안심하고 변경하셔도 돼요.', '이어서 할인 방법을 선택할까요?']
const BEN_MSG = ['추가로 받을 수 있는 혜택이 있어요.', '원하는 혜택을 선택해 주세요.']   // 두 줄 (사용자 2026-09-16)
const BEN_LIST = [
  ['청년 데이터 60GB 추가', '매월 데이터를 넉넉하게 사용해요'],
  ['콘텐츠 이용권', 'YouTube・Netflix・TVING 중 하나'],
  ['추가 혜택을 선택하지 않을게요', '나중에 Tworld에서 신청할 수 있어요'],
]
const BEN_PICK = 0

const OPTS = [
  { sum: '혜택', ico: true, plus: 2, msg: BEN_MSG, rec: BEN_PICK, rows: BEN_LIST.map(([n, d]) => [n, d]) },
  // 안내문 두 줄 (사용자 2026-09-16)
  { sum: '할인 방법', msg: ['추가로 적용하실 수 있는 할인이 있을까요?', '보유하고 있는 할인 수단이 있다면 선택해 주세요.'], rec: 0, rows: [['쿠폰/이용권', ''], ['제휴 포인트', ''], ['추가 할인 수단을 사용하지 않기', '']] },
  { sum: '할인 방법', msg: '보유하신 쿠폰 중에서는 50,000원 할인 쿠폰이 가장 혜택이 커요.', rec: 0, rows: [['휴대폰 구매 할인 쿠폰', '', '월 50,000원'], ['휴대폰 구매 할인 쿠폰', '', '월 30,000원'], ['휴대폰 구매 할인 쿠폰', '', '월 20,000원']] },
  { sum: '결제 방법', msg: '휴대폰 대금을 결제할 방법을 선택해 주세요.', msg2: '월 부담을 줄이고 싶다면 18개월 할부를 추천해요. 월 53,667원 정도 결제하게 돼요.', rec: 3, rows: [['한번에 결제할게요', '일시 결제 1,288,000원 더 필요해요'], ['6개월 할부로 할게요', '월 휴대폰 가격 214,667원'], ['12개월 할부로 할게요', '월 휴대폰 가격 71,566원'], ['18개월 할부로 할게요', '월 휴대폰 가격 53,667원'], ['36개월 할부로 할게요', '월 휴대폰 가격 35,778원']] },
  { sum: '기프트', msg: '마지막으로, 휴대폰 구매와 함께 받을 수 있는 기프트를 선택해 주세요. 쓰던 휴대폰을 반납하고 보상받을 수 있는 T 안심보상을 가장 많이 선택해요.', rec: 0, rows: [['T 안심보상', '쓰던 휴대폰, 반납부터 보상까지 간편하게'], ['무이자 할부 카드', '쓰던 카드 그대로, 할부 수수료 부담 없이'], ['라이트 할부 카드', '휴대폰 할부금을 카드 혜택으로 더 가볍게'], ['통신 요금 할인 카드', '매달 내는 통신 요금도 꾸준히 아껴보세요']] },
]
const REPLAN_PICK = 2   // 스텝 9 에서 바꿔 고르는 요금제 = 베스트 109 (Figma 는 0 청년 107)
const LAST_OPT = OPTS.length - 1, DONE_TURN = OPTS.length   // 마지막 옵션 턴(추가 혜택) · 완료 턴
const OPT_RESELECT = { sec: 2, row: 1 }   // 스텝 8: 쿠폰 섹션으로 올라가 30,000원 쿠폰으로 바꿈
const DONE_MSG = '필요한 옵션 선택이 모두 완료되었어요!', DONE_MSG2 = '개통을 위한 신청서만 작성하면 모든 절차가 완료돼요.', DONE_CHIP = '신청서 작성 시작하기'   // 두 말풍선 순차 (사용자 2026-09-16)
const REPLAN_ASK = '변경된 요금제로 신청서 작성을 이어갈게요.'   // 스텝 9 끝맺음 E-2 에서만 쓰는 한 마디

/* ── 이어서 옵션 안내 (스텝 9·11, Figma ixGPs9 29:21972): 요금제 카드에 할인 방법이 묶여 들어와 할인방법 턴은 폐기(2026-09-07).
   상품 상세의 남은 구매 옵션 8개를 Agent 가 바닥에 차례로 뿌린다. 각 섹션 = 제목 + RadioCard 행, AI PICK 행은 미리 선택.
   STREAM_SPLIT 앞(0~2 개통·사은품)은 스텝 9, 그 사이 스텝 10 재선택, 나머지(3~7)는 스텝 11 */
const STREAM = [
  { id: 'sim',   title: '어떤 SIM으로 개통하시겠어요?', pick: 0, rows: [['eSIM', '칩 없이 QR로 바로 개통해요', '3,000원'], ['새 USIM 구매', '택배로 받아 이후면 바로 개통해요', '3,000원'], ['가지고 있는 USIM 사용', '쓰던 USIM을 그대로 사용해요', '3,000원']] },
  { id: 'gift',  title: 'T 기프트 하나를 선택해 주세요', pick: 0, rows: [['알로 NEW 휴대용 미니 공기청정기', '단말 사은품 · 지정한 주소로 배송해요'], ['삼성 정품 클리어 케이스 + 25W 충전기', '단말 사은품 · 개통 후 발송해요'], ['T 기프트를 받지 않을게요', '']] },
  { id: 'pack',  title: '원하는 티다팩 쿠폰을 골라주세요', pick: 2, rows: [['다이소', '매월 10,000원 · 12개월'], ['무신사머니', '매월 10,000원 · 12개월'], ['올리브영', '매월 10,000원 · 12개월'], ['티다팩을 받지 않을게요', '']] },
  { id: 'trade', title: '쓰던 휴대폰을 반납하고 보상금을 받으시겠어요?', pick: 0, rows: [['바로보상을 이용하지 않을게요', '쓰던 휴대폰을 반납 없이 진행해요'], ['네, 보상금액을 알아볼게요', '쓰던 휴대폰 모델과 상태를 확인해요']] },
  { id: 'ins',   title: '소중한 휴대폰, 보험으로 지켜보세요', pick: 0, rows: [['T ALL케어+ 5', '분실·파손 최대 200만원 보상 · 연 2회 · 자기부담금 30%', '8,900원/월'], ['T ALL케어+ 3', '파손 최대 100만원 보상 · 연 2회 · 자기부담금 30%', '5,900원/월'], ['보험 없이 진행할게요', '']] },
  { id: 'svc',   title: '이런 서비스는 어때요?', pick: 3, rows: [['Wavve 앤 데이터', 'Wavve 무제한 감상 + 매달 데이터 300GB', '9,900원/월'], ['FLO 앤 데이터', 'FLO 음악 무제한 감상 + 매달 데이터 3GB', '9,900원/월'], ['V 컬러링', '전화 걸 때 영상·이미지로 나를 표현', '9,900원/월'], ['부가서비스 없이 진행할게요', '']] },
  { id: 'card',  title: '더 할인받을 수 있는 제휴카드를 확인해보세요', pick: 0, rows: [['T라이트 우리카드', '기존 사용 중 · 월 10,000~20,000원 요금 할인'], ['삼성 TL는 혜택카드', '보유 · 월 7,000~13,000원 요금 할인'], ['제휴카드 없이 주문할게요', '']] },
  { id: 'disc',  title: '추가로 할인받을 수 있는 수단이 있어요', pick: 2, rows: [['쿠폰·이용권 선택', '보유 쿠폰 2장'], ['T 모아 제휴 포인트 적용', '보유 포인트 12,400P'], ['추가 할인 없이 주문할게요', '']] },
]
const STREAM_SPLIT = 3
// 안내문 카피 (html[data-stream]): Z1 턴마다 한 줄 / Z2 첫 턴에만(연속 스트림) / Z3 묶음 머리글(0 개통·사은품, 3 보상·보험, 5 할인·부가). {p} = 요금제명(재선택 시 교체)
const STREAM_MSG = {
  Z1: ['{p}에 맞춰 남은 옵션도 차례로 정리해 드릴게요. 먼저 개통 방식이에요. 추천 항목을 미리 골라두었어요.', 'T 기프트는 하경님 또래가 가장 많이 고른 상품을 골라두었어요.', '티다팩은 12개월간 매달 받는 쿠폰이에요. 자주 쓰시는 올리브영으로 골랐어요.', '쓰던 휴대폰 반납은 선택이에요. 지금은 반납 없이 진행하는 것으로 두었어요.', '보험은 폴더블 기기라 파손 보장이 있는 상품을 추천해요.', '부가서비스는 꼭 필요한 게 아니라면 건너뛰어도 괜찮아요.', '제휴카드는 이미 쓰고 계신 T라이트 우리카드를 그대로 적용해 두었어요.', '마지막이에요. 추가 할인 수단은 지금은 적용하지 않았어요.'],
  Z2: ['{p}에 맞춰 남은 옵션도 차례로 정리해 드릴게요. 추천 항목은 미리 골라두었으니 바꾸고 싶은 것만 골라주세요.'],
  Z3: { 0: '{p}에 맞춰 남은 옵션도 정리해 드릴게요. 먼저 개통과 사은품이에요. 추천 항목을 미리 골라두었어요.', 3: '이번엔 보상과 보험이에요. 쓰던 휴대폰 반납은 선택이고, 보험은 파손 보장이 있는 상품을 추천해요.', 5: '마지막으로 할인과 부가서비스예요. 쓰고 계신 제휴카드는 그대로 적용해 두었어요.' },
}
const streamMsg = (i) => { const Z = variant('stream'); return Z === 'Z1' ? STREAM_MSG.Z1[i] : Z === 'Z3' ? (STREAM_MSG.Z3[i] || null) : (i === 0 ? STREAM_MSG.Z2[0] : null) }
/* ── 공통 등장 리듬 (html[data-reveal]) — 순서는 고정: 말풍선 → 타이틀 → 타이틀 접힘 → 텍스트 → 컴포넌트 순차
   S1 균일 박자 · S2 생각하는 리듬(타이틀 오래, 텍스트는 생성되듯) · S3 빠른 캐스케이드(카드가 겹치며 올라옴) */
const REVEAL = {
  S1: { bubble: 600, hold: 1750, hold2: 1000, settle: 350, text: 550, card: 450, tail: 300 },
  S2: { bubble: 350, hold: 2200, hold2: 1300, settle: 300, text: 900, card: 320, tail: 320 },
  S3: { bubble: 450, hold: 1300, hold2: 800,  settle: 250, text: 380, card: 220, tail: 220 },
}
const rv = () => REVEAL[variant('reveal')] || REVEAL.S1
const reveal = (el) => { if (!el) return; el.style.transition = ''; el.style.transitionDelay = ''; el.classList.add('in') }
const showNow = (els) => els.forEach((el) => { el.style.transition = 'none'; el.classList.add('in') })   // 최종 상태(직접 진입·reduced-motion)
const unreveal = (els) => els.forEach((el) => { el.classList.remove('in'); el.style.cssText = '' })
const hideOpening = (el) => { el.style.display = 'none' }

/* ── 모션 프리미티브(wait/tween/scrollTo/이징)는 src/lib/motion.js — 여기엔 이 화면 전용 곡선만 ── */
// 천천히 출발(ease-in) → 중반 가속 → 길게 감속: in-quad 로 0.35 까지, 이후 out-expo
const inThenOut = (t) => (t < .35 ? (t / .35) * (t / .35) * .3 : .3 + .7 * outExpo((t - .35) / .65))
// 살짝 넘겼다 되돌아오는 스프링 안착 (~4% 오버슈트)
const springSoft = (t) => 1 - Math.exp(-6.2 * t) * Math.cos(5.4 * t)
/* 스텝 9 올라갈 때(G-2) 속도 곡선 시안 — html[data-panup] */
const PANUP = {
  P1: { speed: 0.55, min: 500, max: 1400, ease: inOut },        // 가속-감속 대칭, 320→550px/s
  P2: { speed: 0.62, min: 550, max: 1500, ease: inThenOut },    // ease-in 출발 → 급가속 → 긴 감속
  P3: { speed: 0.72, min: 480, max: 1300, ease: springSoft },   // 빠르게 도착해 살짝 넘겼다 안착
  W1: { speed: 0.8, min: 1600, max: 2600, ease: inOutSine },    // 스텝 9 되감기 W-1: P-1 의 절반 속도(≈800px/s), 사인 곡선으로 길게 (사용자 2026-09-16 '너무 빠르다')
}
/* 내려갈 때(앵커 칩 탭 후) 이동 시안 — html[data-down] */
const DOWN = {
  C1: { speed: 0.5, min: 600, max: 1600, ease: inOutSine },     // 일정 속도 팬 (올라갈 때보다 조금 빠름)
  C3: { speed: 0.6, min: 550, max: 1500, ease: inOutQuart },    // 강한 가속-감속 (휙 출발, 길게 안착)
}
// 오프닝을 제자리에서 접기 (스크롤 고정 → 본문이 그 자리로 올라옴)
// 접힘 질감 변주: <html data-collapse="cur|C1|C2|C3"> (시안 비교용, 확정 C2)
const soft = (t) => 1 - Math.exp(-6 * t) * Math.cos(6.5 * t) // 약 6% 오버슈트 뒤 안착
const COLLAPSE = {
  // 현재: 0.4s in-out, 글자는 1.8배 빨리 사라짐
  cur: { dur: 400, f: (p) => { const q = inOut(p); return { h: 1 - q, op: Math.max(0, 1 - q * 1.8), lift: 6 * q, blur: 0 } } },
  // C-1 긴 감속: 빠르게 출발해 길게 안착. 글자·높이가 같은 곡선으로 함께 사라짐
  C1: { dur: 550, f: (p) => { const q = outExpo(p); return { h: 1 - q, op: 1 - q, lift: 10 * q, blur: 0 } } },
  // C-2 (확정) 글자 먼저 + 거의 동시에 자리 닫힘: 글자 0~0.3s cubic-out, 높이 0.03~0.6s in-out
  C2: { dur: 600, f: (p) => { const f = cubicOut(clamp01(p / 0.5)); const q = inOut(clamp01((p - 0.05) / 0.95)); return { h: 1 - q, op: 1 - f, lift: 8 * f, blur: 0 } } },
  // C-3 블러 디졸브 + 안착: 글자가 흐려지며 사라지고(I-3 전환과 같은 언어), 높이는 살짝 스프링으로 닫힘
  C3: { dur: 650, f: (p) => { const f = clamp01(p / 0.58); const q = Math.min(1, soft(p)); return { h: Math.max(0, 1 - q), op: 1 - f, lift: 6 * f, blur: 6 * f } } },
}
async function collapseOpening(op, dur) {
  const v = COLLAPSE[variant('collapse')] || COLLAPSE.C2
  const h = op.offsetHeight
  op.style.transition = 'none' // .rec > * 의 CSS 트랜지션이 트윈을 지연시키지 않도록
  await tween(dur ?? v.dur, (p) => {           // 질감 함수 v.f 가 곡선을 직접 만드므로 선형 진행값을 넘긴다
    const { h: hh, op: oo, lift, blur } = v.f(p)
    op.style.height = `${h * hh}px`
    op.style.marginTop = `${OPENING_MT * hh}px`
    op.style.marginBottom = `${-TURN_GAP * (1 - hh)}px`
    op.style.opacity = oo
    op.style.transform = `translateY(${-lift}px)`
    op.style.filter = blur ? `blur(${blur}px)` : ''
  }, linear)
}
const anchorHeader = (el) => el.offsetTop - CHAT_TOP
const anchorBottom = (el) => el.offsetTop + el.offsetHeight - (SEARCH_TOP - GAP)

function UserMessage({ children, className = '' }) {
  return <div className={`msg-user ${className}`}><span>{children}</span></div>
}
// 2안: 시트에서 고른 결과 = 사용자 말풍선 "질문: {시트 제목} / 답: {선택}" (Figma ixGPs9 155:88000). 다음 턴의 상단 앵커가 된다
// pairs: [[q, a], ...] 여러 세트를 한 말풍선에 (1-2 스텝 4 — 추천 시트의 답과 전체 팝업의 답이 한 세트, Figma ixGPs9 442:158816)
function AnswerBubble({ q, a, pairs, innerRef, className = '' }) {
  const list = pairs || [[q, a]]
  return <div className={`msg-user t2-bubble ${className}`} ref={innerRef}><span>{list.map(([qq, aa], i) => <span className="qa" key={i}><em className="q">질문: {qq}</em><b className="a">답: {aa}</b></span>)}</span></div>
}
function AiMessage({ children, className = '' }) {
  return <p className={`msg-ai ${className}`}>{children}</p>
}
function Opening({ status, title, className = '', innerRef }) {
  return (
    <div className={`opening ${className}`} ref={innerRef}>
      <div className="status">{status}</div>
      <h2 className="ai-title">{title}</h2>
    </div>
  )
}
// N-2 생각 점: 타이틀 없는 전시 턴에서 텍스트가 오기 전 0.9s 동안 보이는 인디케이터 (순서 배열에서는 제외, CSS order:-1 로 텍스트 자리)
function Thinking() {
  return <div className="thinking" aria-hidden><i /><i /><i /></div>
}
/* 입력이 끝난 자리에 남는 것 (html[data-findone], Figma ixGPs9 540:149303 — 사용자 2026-09-16 "개인정보 바닥에서 입력했을 때 나오는 컴포넌트 형태 일괄 변경")
   off 기존: '│ ○○ 입력이 완료되었어요 ─ 수정하기' 선
   K1 Figma 그대로: 흰 카드(라운드 28 · 테두리) 안에 라벨 + [재입력]
   K2 라벨 + 입력값: 같은 카드에 입력한 값이 라벨 아래 회색으로 (주민등록번호는 마스킹) — 무엇을 넣었는지 카드에서 확인
   K3 라벨 + 완료 체크: 라벨 앞에 작은 체크 — 기존 완료 선의 '끝났다' 신호를 카드로 옮김 */
const FIN_REDO = '재입력'
/* 개인정보 마스킹 (사용자 2026-09-16 "접힐 때 나오는 컴포넌트 마스킹 처리 일괄") — 라벨로 종류를 가른다 */
const maskField = (label, v = '') => {
  if (!v) return ''
  if (/주민/.test(label)) return v.replace(/●/g, '*')
  if (/번호/.test(label)) return v.replace(/^(\d{3}-\d{2})\d{2}-(\d{2})\d{2}$/, '$1**-$2**')
  if (/이메일/.test(label)) return v.replace(/^(.{2})[^@]*(@.*)$/, (m, a, b) => a + '*'.repeat(Math.max(3, m.length - a.length - b.length)) + b)
  if (/주소/.test(label)) return v.replace(/^(\S+\s\S+)\s.*$/, '$1 ****')
  if (/이름/.test(label)) return v.length >= 3 ? v[0] + '*'.repeat(v.length - 2) + v[v.length - 1] : v
  return v
}
const IcoEye = () => <svg className="eye" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" /></svg>
/* K1 = Figma ixGPs9 545:163657: 흰 카드 안에 파란 배지(라벨) → 마스킹된 값 · 우측 [재입력] */
function FinDone({ label, value, line }) {
  const K = variant('findone') || 'off'
  if (K === 'off') return <div className="form-line"><span>{line}</span><a>{FORM_REDO}</a></div>
  return (
    <div className={`form-line fin-done ${K.toLowerCase()}`}>
      {K === 'K3' && <i className="fd-chk" />}
      <span className="fd-body"><i className="fd-tag">{label}</i><b>{maskField(label, value) || label}</b>{K === 'K2' && value && <small>{value}</small>}</span>
      <a>{FIN_REDO}</a>
    </div>
  )
}
function Card({ children, className = '', innerRef }) {
  return <section className={`ai-card ${className}`} ref={innerRef}>{children}</section>
}
/* 4번 요금제 리스트 한 줄 = RadioCard (Figma 435:172477): 추천 배지 → 이름 + 우측 chevron 한 줄 → 설명 → 월 가격 */
// 스텝 4 요금제 리스트 행 = 풀팝업 카드(.plan-mini)와 같은 컴포넌트 (사용자 스크린샷 2026-09-16 18:03: 이름 · 가격/월 · 데이터|테더링 · 썸네일 · 배지)
function PlanPickRow({ idx, sel, rec, style }) {
  const [name, price, caps] = ALT_PLANS[idx]
  return (
    <div className={`plan-pick plan-mini ${rec ? 'pp-rec' : ''} ${sel ? 'sel' : ''}`} style={style}>
      {rec && <span className="rec-badge">추천</span>}
      <div className="pc-head">
        <div className="pc-text">
          <div className="pc-name">{name}</div>
          <div className="pc-price"><b>{price.replace(/^월\s*/, '')}</b><span>/월</span></div>
          <div className="pc-caps">{caps.split('・').slice(0, 2).map((t, k) => <span key={t}>{k > 0 && <i />}{t}</span>)}</div>
        </div>
        <div className="pc-thumb"><img src="/screens/pd2/plan-thumb.png" alt="" /><em>무제한</em></div>
      </div>
      <BenefitBadges />
    </div>
  )
}
/* 할인 방법 한 줄 (Figma 435:177019) — 이름 · 우측 할인액 · 설명 */
function DiscRow({ name, amt, desc, sel, style }) {
  return (
    <div className={`plan-row disc-row ${sel ? 'sel' : ''}`} style={style}>
      <div className="top"><span className="name">{name}</span><b className="amt">{amt}</b></div>
      <div className="desc">{desc}</div>
    </div>
  )
}
// Figma 12120:34071 · 12132:37495: 카드 상단 CellTitle + CellDescription
function CardHead({ title, desc }) {
  return <div className="card-head"><h3>{title}</h3><p>{desc}</p></div>
}
// Figma RadioCard 한 줄: 이름 · (우측 가격) · (설명) · 추가 children(아코디언 등)
function PlanRow({ name, price, priceClass = 'price', desc, sel, className = '', innerRef, children, icon = false, style, badge }) {
  const body = (
    <>
      {badge && <span className="rec-badge">{badge}</span>}
      <div className="top"><span className="name">{name}</span>{price && <span className={priceClass}>{price}</span>}</div>
      {desc && <div className="desc">{desc}</div>}
      {children}
    </>
  )
  // icon: 카드 → 바닥 시안(Figma ixGPs9 15:10217)의 좌측 아이콘 자리(40px 플레이스홀더). 기존(C0)에서는 CSS 로 숨김
  return (
    <div className={`plan-row ${className} ${sel ? 'sel' : ''} ${icon ? 'with-ico' : ''}`} ref={innerRef} style={style}>
      {icon ? <><i className="row-ico" aria-hidden /><div className="body">{body}</div></> : body}
    </div>
  )
}
// ListProductHorizontal (Figma 23:11235, ÷1.21): 배지 · 이름 · 가격/월 · 캡션 · 썸네일 64 · BadgeIconGroup · 할인 RadioCard×3(첫 항목 선택)
// 루트에 plan-row 클래스를 함께 두어 스텝 6~9(적용 selected · 재선택 탭)가 그대로 동작한다. collapsed = A-3 (할인 카드 접힘)
// disc: 선택된 할인 행 (-1 = 없음). 라디오 카드는 모두 default 로 시작하고 고객이 골라야 selected (Figma ixGPs9 117:53492, 사용자 2026-09-08 — 이전엔 공통지원금이 기본 선택)
export function PlanCard({ idx, sel, collapsed = false, open = true, innerRef, style, disc = -1, data, nodisc = false }) {
  // data: 카드 내용을 직접 넘길 때 (3안 상품 상세의 '지금 이용중인 요금제' 카드 — Figma ixGPs9 302:104587). nodisc: 할인 3행 없음
  const [name] = data ? [data.name] : ALT_PLANS[idx], c = data || ALT_CARDS[idx]
  return (
    <div className={`plan-card plan-row ${sel ? 'sel' : ''} ${collapsed && !open ? 'collapsed' : ''}`} ref={innerRef} style={style}>
      {/* 선택 표현 시안 html[data-cardsel]: S2 는 배지가 '선택한 요금제 ✓' 로 바뀐다 */}
      <span className={`pc-badge ${sel && variant('cardsel') === 'S2' ? 'chosen' : c.badge === 'AI PICK' ? 'pick' : ''}`}>{sel && variant('cardsel') === 'S2' ? '선택한 요금제 ✓' : c.badge}</span>
      <div className="pc-head">
        <div className="pc-text">
          <div className="pc-name">{name}</div>
          <div className="pc-price"><b>{c.price}</b><span>/월</span></div>
          <div className="pc-caps">{c.caps.map((t, i) => <span key={t}>{i > 0 && <i />}{t}</span>)}<span className="more">{c.more}</span></div>
        </div>
        <div className="pc-thumb"><img src="/screens/pd2/plan-thumb.png" alt="" /></div>
      </div>
      <div className="badge-icon-group"><span className="badge-icon"><IcoBrand letter="N" />넷플릭스 무료</span><span className="badge-icon"><IcoBrand letter="F" />FLO 무료</span></div>
      {!nodisc && <div className="pc-discounts">
        <div className={`pc-rc ${disc === 0 ? 'on' : ''}`}><div className="top"><span>공통지원금</span><b>{c.support}</b></div><div className="desc">휴대폰 가격에서 바로 할인</div></div>
        <div className={`pc-rc ${disc === 1 ? 'on' : ''}`}><div className="top"><span>선택약정 12개월</span><b>{c.m12}</b></div><div className="desc">12개월간 통신요금 25% 할인</div></div>
        <div className={`pc-rc ${disc === 2 ? 'on' : ''}`}><div className="top"><span>선택약정 24개월</span><b>{c.m24}</b></div><div className="desc">24개월간 통신요금 25% 할인</div></div>
      </div>}
    </div>
  )
}
const DISCOUNT_HEAD = { title: '어떤 할인을 받고 싶으세요?', desc: '더 유리한 방법을 확인해 보세요' }
function BenefitBadges() {
  return (
    <div className="badge-icon-group">
      <span className="badge-icon"><IcoBrand letter="N" />넷플릭스 무료</span>
      <span className="badge-icon"><IcoBrand letter="F" />FLO 무료</span>
    </div>
  )
}

function UsageGraph() {
  return (
    <div className="graph">
      <div className="insight">
        <IcoSparkle size={16} />
        <p>6개월 동안 평균 22.4GB 사용했어요.<br />최근 세 달은 제공량 20GB를 넘겨 속도 제한이 걸렸어요</p>
      </div>
      <div className="bars">
        <div className="avg-line" style={{ top: 59 }}>
          <span className="avg-tag">평균</span>
          <i />
        </div>
        {MONTHS.map((m, i) => {
          const last = i === MONTHS.length - 1
          return (
            <div className={`bar-col ${last ? 'cur' : ''}`} key={m}>
              <div className="bar-area">
                {last && <div className="bubble-val">39.9GB<i /></div>}
                <div className="bar" style={{ height: BARS[i] }} />
              </div>
              <div className="label">{m}</div>
            </div>
          )
        })}
      </div>
      <div className="cell-text"><span>기본 제공량</span><span>20GB</span></div>
      <div className="cell-text"><span>기본 제공 사용량</span><span>39.9GB</span></div>
    </div>
  )
}

// 신청서 시트 필드 (DS Input 48h · radius 14). 포커스면 캐럿, 값이 있으면 filled. 모듈 스코프 — 컴포넌트 안에서 만들면 글자마다 리마운트되어 캐럿 애니메이션이 끊긴다
const FsField = ({ k, ph, fv, ffocus }) => (
  <div className={`input-field fs-field ${ffocus === k ? 'on' : ''} ${fv[k] ? 'filled' : ''}`} data-f={k}>
    <span className={fv[k] ? 'val' : 'ph'}>{fv[k] || ph}</span>{ffocus === k && <i className="caret" />}
  </div>
)
export default function AgentChat({ stage = 'usage', from = null, mode = 'an3' }) {
  const scrollRef = useRef(null)
  const openingRef = useRef(null)
  const rootRef = useRef(null)
  const ptrLayerRef = useRef(null)
  const ptrRef = useRef(null)
  const altRef = useRef(null)
  const seqRef = useRef(0)           // 진행 중 시퀀스 취소용
  const collapsedRef = useRef(false) // 첫 오프닝 접힘 여부
  const prevRef = useRef(null)       // null = 첫 마운트. from: 다른 화면(2안 AgentChat2)에서 넘어와 첫 마운트인데도 재생해야 할 때 이전 스테이지를 알려준다
  const allRef = useRef(null)
  const sheetRef = useRef(null)
  const applyRef = useRef(null), confirmRef = useRef(null), confirmNoRef = useRef(null)
  const [selPlan, setSelPlan] = useState(-1)
  // 스텝 7 요금제 재선택 (Figma ixGPs9 271:126019): 팝업 상단 초기화 안내 띠 · 변경 확인 모달 · 대화 줄의 요금제명 교체
  const [warnBar, setWarnBar] = useState(false), [confirmPop, setConfirmPop] = useState(false), [replanIdx, setReplanIdx] = useState(-1)
  const [sheetTab, setSheetTab] = useState(0)
  const [zipPop, setZipPop] = useState(false), [zipQ, setZipQ] = useState(''), [zipList, setZipList] = useState(false)   // 주소 검색 풀페이지 팝업 (시트 2/4 [검색])
  const [applied, setApplied] = useState(false)
  const usageCardRef = useRef(null)             // 4번: 요금제 카드 캐러셀 (전체보기 포함)
  const plansCardRef = useRef(null)             // 6번: 위약금 답변 뒤 재제시 캐러셀 (할인 탭 대상)
  const foldCardRef = useRef(null), foldTailRef = useRef(null), foldNewRef = useRef(null), replanOutRef = useRef(null), penFoldRef = useRef(null)   // 6번: 요금제 선택이 끝나면 카드가 접히고 남는 요약 줄 (html[data-planfold], Figma 261:117032)
  const [discPick, setDiscPick] = useState(-1)  // 적용된 요금제 카드의 할인 선택 (-1 없음 → 스텝 6에서 고객이 24개월 탭)
  const disRef = useRef(null)                   // 5번 끝: 첫 할인 방법 턴 (Figma 435:177019)
  const penRef = useRef(null)                   // 6번: 위약금 질문 말풍선 + 답변 턴 컨테이너
  const penVarRef = useRef(null)
  const optsRef = useRef(null)                  // 7~9번: 옵션 순차 선택 (4 섹션 + 완료)
  const doneChipRef = useRef(null)              // [신청서 작성 시작하기] (2안이면 이력 블록의 [신청서 작성하기])
  const reChipRef = useRef(null)                // 스텝 9 끝의 [신청서 작성 시작하기] (재선택 결과 뒤에 다시 내주는 CTA)
  const histRef = useRef(null)                  // 2안 이력 블록 (.an2-hist)
  const [optPick, setOptPick] = useState(() => OPTS.map(() => -1))   // 섹션별 고른 행 (섹션 수가 바뀌어도 따라간다)
  const formRef = useRef(null)
  // 1안 바닥 신청서 (html[data-fform] B1): 스텝 10~13 이 시트 대신 대화 안 카드로 흐른다. 2안(an2)은 계속 시트
  const inForm = mode !== 'an2' && variant('fform') !== 'off'
  const lookupChipRef = useRef(null)                               // 가입자 정보 카드 뒤의 [신청서 작성하기]
  const finAddrRef = useRef(null), finContactRef = useRef(null)    // 11 주소 · 12 이메일·연락 번호 턴
  const [kbField, setKbField] = useState(false)          // 신청서 시트 입력 중 (SearchAi 숨김, 키패드 스크림 없음 — 시트 딤이 대신)
  const [fsheet, setFsheet] = useState(0)                // 신청서 AI 바텀시트: 0 없음 / 1 주민등록번호 / 2 주소 / 3 이메일 / 4 연락 번호
  const { shown: fsShow, out: fsOut } = useSheetOut(fsheet, { closed: 0 })   // 내려가는 동안 내용 유지 + .out (src/lib/sheet.js)
  const [fpeek, setFpeek] = useState(false)              // 스텝 10 시작: 시트가 하단에 살짝 걸쳐 대기 (사용자 2026-09-08)
  const fsheetRef = useRef(null), fsWrapRef = useRef(null)
  const [fv, setFv] = useState(FV0)                      // 시트 입력값
  /* 가입자 정보 카드 마스킹 — [신청서 작성하기] 를 누르고 다음 플로우로 넘어가면 이름·번호를 가린다 (사용자 2026-09-16, 스크린샷 "010-92**-92**") */
  const [maskInfo, setMaskInfo] = useState(false)
  const [reviewMasked, setReviewMasked] = useState(false)   // [개통 이어가기] 뒤 신청서 카드는 남되 값이 마스킹 + 회색 눈 아이콘 (사용자 2026-09-16, reviewaway M1)
  const maskVal = (k, v) => !maskInfo ? v : /번호/.test(k) ? v.replace(/^(\d{3}-\d{2})\d{2}-(\d{2})\d{2}$/, '$1**-$2**') : v.length >= 3 ? v[0] + '*'.repeat(v.length - 2) + v[v.length - 1] : v
  const [ffocus, setFfocus] = useState('')               // 포커스(캐럿) 중인 필드 키
  const reviewRef = useRef(null), reviewChipRef = useRef(null), reviewFoldRef = useRef(null)
  const authRef = useRef(null), tossItemRef = useRef(null)
  const [authSheet, setAuthSheet] = useState(0)          // 0 없음 / 1 본인인증 / 2 신원인증
  const [sheetToss, setSheetToss] = useState(false)      // X-2: 시트 안이 토스 화면으로 바뀜
  const [ext, setExt] = useState('')                     // 밖(토스) 화면: '' | 'in' | 'done'
  const [extBanner, setExtBanner] = useState(false)      // X-3 복귀 배너
  const [extKind, setExtKind] = useState('toss')         // 밖 화면 종류: toss | id
  const payRef = useRef(null), payKeepRef = useRef(null), billRef = useRef(null)
  const [payPick, setPayPick] = useState(false), [billPick, setBillPick] = useState(-1)
  const [p2sheet, setP2sheet] = useState(0), [p2pick, setP2pick] = useState(-1), [p2step, setP2step] = useState(1)
  const { out: p2Out } = useSheetOut(p2sheet, { closed: 0 }), { out: authOut } = useSheetOut(authSheet, { closed: 0 })   // 2안 납부 시트: 1 함께 납부? / 2 번호 인증 (step 1 번호 → 2 인증번호)
  const [optK, setOptK] = useState(7)                    // 헤더 k/n: 지금 고르는 옵션 번호 (7 = 요금제). 해당 옵션의 컴포넌트가 화면에 뜨는 순간 바뀐다 (사용자 2026-09-07)
  const OPT = { plan: 7, disc: 8, benefit: 9, extra: 10, coupon: 11, pay: 12, gift: 13, rrn: 14, addr: 15, auth1: 16, auth2: 17, method: 18, bill: 19, checkout: 20 }   // AgentShell OPTIONS 와 1:1
  const searchRef = useRef(null)
  const [kbOpen, setKbOpen] = useState(false)   // 키패드 열림 (SearchAi 가 키보드 위로)
  const kbOpenRef = useRef(false); kbOpenRef.current = kbOpen
  const [penTyped, setPenTyped] = useState('')  // SearchAi 에 타이핑 중인 글자
  const [penTyping, setPenTyping] = useState(false)
  const [chip, setChip] = useState(CHIP_DEFAULT)
  const [planIdx, setPlanIdx] = useState(PLAN_DEFAULT)     // 적용된 요금제 (스텝 9 재선택 → PLAN_RESELECT)
  const [recalc, setRecalc] = useState(false)              // 스텝 9 R-3: 아래 턴 안내문 재계산 중 표시
  const [msgPlanIdx, setMsgPlanIdx] = useState(PLAN_DEFAULT) // 안내문에 쓰이는 요금제 (선택보다 늦게, 앵커링 뒤 교체 연출)
  const planName = ALT_PLANS[msgPlanIdx][0]
  const foldLbl = /^[BDS]/.test(variant('planfold') || '') ? '선택됨' : '선택한 요금제'
  const foldPlanName = replanIdx >= 0 ? POP_PLANS[replanIdx].name : planName   // 재선택 뒤에는 바뀐 요금제명   // D·S 시안은 사용자 표현('머 선택됨 뜨게'), F 시안은 Figma 표기
  const scrollIndRef = useRef(null)
  const jumpChipRef = useRef(null)
  const tailRef = useRef(null)
  const sheet = stage === 'sheet'
  const penalty = stage === 'penalty'
  const replan = stage === 'replan'
  const opts1 = stage === 'opts1'
  const reselect = stage === 'reselect'
  const opts2 = stage === 'opts2'
  const opts = stage === 'opts'      // 스텝 7 = 예전 7(opts1) + 8(opts2) 을 한 스텝으로 (사용자 2026-09-16)
  const form = stage === 'form'
  const addr = stage === 'addr'
  const contact = stage === 'contact'
  const review = stage === 'review'
  const auth = stage === 'auth'
  const pay = stage === 'pay'
  const payout = stage === 'payout'

  useEffect(() => { if (rootRef.current && ptrLayerRef.current) ptrRef.current = new Pointer(rootRef.current, ptrLayerRef.current) }, [])

  useEffect(() => {
    const scroll = scrollRef.current, op = openingRef.current
    if (!scroll || !op) return
    const altEl = altRef.current, ptr = ptrRef.current
    const altItems = [...altEl.children].filter((el) => !['pen', 'opts', 'form', 'addr', 'contact', 'review', 'auth', 'pay'].some((c) => el.classList.contains(c))) // [요금제 카드 캐러셀]; 이후 턴은 별도 시퀀스
    const turnKids = (el) => [...el.children].filter((c) => !c.classList.contains('thinking'))   // 생각 점(N-2)은 순서 배열에서 제외
    const penEl = penRef.current, penItems = [...penEl.children].filter((c) => !c.classList.contains('pen-fold-host'))                 // [말풍선, 타이틀, 안내 1, 재제시 카드] (안내 2·3 은 2026-09-16 삭제)
    const optsEl = optsRef.current, turns = [...optsEl.children]                 // .opt-turn × 4 + .done, 각각 [msg, msg2|none, card]
    const optKids = (t) => [...t.children].filter((c) => !c.classList.contains('thinking') && !c.classList.contains('opt-fold'))
    const optRow = (i, j) => turns[i].querySelectorAll('.plan-row')[j]
    const formEl = formRef.current, formItems = [...formEl.children]   // [말풍선, 개인정보 Alert]
    const reviewEl = reviewRef.current, reviewItems = [...reviewEl.children].filter((c) => !c.classList.contains('thinking') && !c.classList.contains('review-fold'))   // [완료 선, 안내 2, 신청서 카드, 칩] (2안 안내 1 은 2026-09-16 삭제)
    const reviewCard = () => reviewEl.querySelector('.review-card')   // 자식 수가 시트(5)·바닥(4)으로 다르다 — 위치 대신 무엇인지로
    const reviewChipWrap = reviewEl.querySelector('.cta-stack')
    const authEl = authRef.current, authItems = [...authEl.children].filter((c) => !c.classList.contains('thinking'))   // [말풍선, 안내 1, 완료 선, 안내 2]
    const payEl = payRef.current, payItems = [...payEl.children].filter((c) => !c.classList.contains('thinking'))   // [완료 선, 안내 1, 안내 2, 납부 카드, 안내 3, 요금안내서, 안내 4]
    const discRow = () => plansCardRef.current?.querySelectorAll('.disc-row')[DISC_PICK]
    const jumpChip = jumpChipRef.current
    /* 꼬리(대화 아래 여백). 재생 중에는 **줄이지 않는다** — 줄이는 순간 스크롤이 클램프돼
       화면에 있던 것이 통째로 튄다(사용자 2026-09-12 "접히는 감각에 따라 이전 위치 바뀌는 거"). 초기화 경로만 setTailHard 로 되돌린다 */
    const setTailHard = (px) => { if (tailRef.current) tailRef.current.style.height = `${px}px` }
    const setTail = (px) => { const el = tailRef.current; if (!el) return; const cur = parseInt(el.style.height, 10) || 0; el.style.height = `${Math.max(cur, px)}px` }
    const resetChip = () => {
      if (!jumpChip) return
      jumpChip.classList.remove('on', 'down', 'near', 'absorb', 'release', 'pressing'); jumpChip.style.top = ''; jumpChip.textContent = CHIP_UP
    }
    const resetTurn = (el, turnItems) => { el.classList.remove('on'); unreveal(turnItems); resetFlat(el); unreveal([...el.querySelectorAll('.thinking')]); el.querySelectorAll('.thinking').forEach((d) => d.classList.remove('out')); setTailHard(TAIL) }
    // 접힘 해제 (요금제 선택 앞 스텝으로 되돌아올 때)
    const unfold = () => {
      const card = usageCardRef.current
      if (card) { card.style.cssText = ''; card.classList.remove('boxing', 'l3-start'); [...card.children].forEach((c) => { c.style.opacity = '' }) }
      for (const r of [foldCardRef.current, foldTailRef.current]) { if (r) { r.classList.remove('on', 'from-box', 'keep-box'); r.style.opacity = '' } }
    }
    const resetPen = () => {
      const de = disRef.current; if (de) { de.classList.remove('on', 'stale'); unreveal([...de.children]); resetFlat(de) }
      resetTurn(penEl, penItems); penItems[1].style.cssText = ''
      if (plansCardRef.current) { plansCardRef.current.style.cssText = ''; plansCardRef.current.classList.remove('boxing', 'l3-start'); [...plansCardRef.current.children].forEach((k) => { k.style.opacity = '' }) }
      penFoldRef.current?.classList.remove('on', 'from-box')
      setKbOpen(false); setPenTyped(''); setPenTyping(false)
    }
    // 옵션 섹션 되감기: from 이후 턴만 (재선택 스텝은 마지막 섹션의 행만 되감아야 하므로)
    const resetOpts = (from = 0) => {
      for (let i = from; i < turns.length; i++) { resetTurn(turns[i], optKids(turns[i])); uncollapseOpt(i) }
      if (from === 0) optsEl.classList.remove('on')
      setOptPick((p) => p.map((v, i) => (i >= from ? -1 : v)))
      resetForm()
    }
    const resetReview = () => { setReviewMasked(false); resetTurn(reviewEl, reviewItems); showChipEl(reviewChipRef.current); const c = reviewCard(); if (c) c.style.cssText = ''; const rf = reviewFoldRef.current; if (rf) { rf.classList.remove('in'); rf.style.cssText = '' } }
    const resetPayout = () => { if (extKind === 'pay') { setExt(''); setExtKind('toss') } }
    const resetPay = () => { resetPayout(); resetTurn(payEl, payItems); payItems.forEach((el) => { el.style.cssText = '' }); setPayPick(false); setBillPick(-1); setP2sheet(0); setP2pick(-1); setP2step(1); setFv((o) => ({ ...o, p2phone: '', p2code: '' })) }
    const resetAuth = () => { resetPay(); resetTurn(authEl, authItems); setAuthSheet(0); setSheetToss(false); setExt(''); setExtKind('toss'); setExtBanner(false) }
    const resetForm = () => {
      setMaskInfo(false)
      resetReview(); resetAuth()
      resetTurn(formEl, formItems)
      showChipEl(turns[DONE_TURN].querySelector('.button-ai'))
      showChipEl(reChipRef.current)
      setFsheet(0); setFpeek(false); setFv(FV0); setFfocus(''); setKbOpen(false); setKbField(false); setPenTyped(''); setPenTyping(false)
      if (inForm) resetFin()
    }
    const resetReselect = () => {
      setRecalc(false)
      scrollIndRef.current?.classList.remove('on'); resetChip()
      optsEl.querySelectorAll('.row-link').forEach((l) => l.remove())
    }
    const reduced = reducedMotion()
    const seq = ++seqRef.current
    const alive = () => seq === seqRef.current

    const resetAll = () => {
      op.style.cssText = ''; unreveal(s5)
      resetAlt()
      scroll.scrollTop = 0
      collapsedRef.current = false
    }
    const resetAlt = () => {
      altEl.classList.remove('on'); unreveal(altItems); resetFlat(altEl)
      closeSheet(); resetApply(); ptr?.hide()
    }
    const openSheet = () => { sheetRef.current.classList.add('on') }                 // 풀페이지 팝업이 아래에서 올라온다 (딤 없음)
    const hideSheet = () => { sheetRef.current?.classList.remove('on') }             // 선택값은 유지한 채 팝업만 내림
    const closeSheet = () => { hideSheet(); setSelPlan(-1); setSheetTab(0) }
    const resetApply = () => { setApplied(false); setDiscPick(-1); setOptK(OPT.plan); resetPen(); resetOpts(); resetReselect(); unfold(); setReplanIdx(-1); setWarnBar(false); setConfirmPop(false); unstale() }
    const parkOnAll = () => ptr?.park(allRef.current)
    const snapBottom = (el) => requestAnimationFrame(() => { scroll.scrollTop = anchorBottom(el) })
    // 아래로만 진행하는 팬: 목표가 현재보다 위면 움직이지 않는다 (재선택 외에는 위아래 요동 금지 — 사용자 2026-09-07)
    const downTo = (el, dur, ease) => scrollTo(scroll, Math.max(scroll.scrollTop, anchorBottom(el)), dur, ease)
    /* 턴 안에서 화면이 새 요소를 따라가는 리듬 (html[data-follow]) — 사용자 "뚝뚝 끊긴다" 2026-09-07
       F1 요소마다 팬: 점·본문·행이 나올 때마다 거리 기반 팬 (현재)
       F2 턴 끝에 한 번: 요소들은 제자리에서 나타나고, 턴의 마지막 요소가 들어온 뒤 한 번만 팬
       F3 연속 추적: 카메라가 마지막 요소 하단을 부드럽게 계속 따라감 (프레임마다 10% 접근, 위로는 안 감) */
    let camTarget = null, camRaf = 0
    const camStop = () => { if (camRaf) cancelAnimationFrame(camRaf); camRaf = 0; camTarget = null }
    const camLoop = () => { if (!camTarget) return; const goal = Math.max(scroll.scrollTop, anchorBottom(camTarget)); const d = goal - scroll.scrollTop; if (Math.abs(d) > .5) scroll.scrollTop += d * 0.10; camRaf = requestAnimationFrame(camLoop) }
    const follow = async (el, end = false) => {
      const F = variant('follow')
      if (F === 'F3') { camTarget = el; if (!camRaf) camRaf = requestAnimationFrame(camLoop); if (end) { await wait(700); camStop() } return }
      if (F === 'F2' && !end) return
      await downTo(el)
    }
    // 공통 등장 리듬의 가운데 토막: 타이틀 유지 → 접힘 → 멈춤 → 본문 텍스트. 중단되면 false
    const collapseThenMsg = async (opEl, msg, T) => {
      await wait(T.hold2); if (!alive()) return false
      await collapseOpening(opEl); if (!alive()) return false
      await wait(T.settle); if (!alive()) return false
      reveal(msg); await wait(T.text); return alive()
    }
    const revealEach = async (els, ms) => { for (const c of els) { reveal(c); await wait(ms); if (!alive()) return false } return true }
    /* 카드 → 바닥 (html[data-flat]) — 카드가 사라져 행이 각각 컴포넌트가 됐을 때의 등장 리듬
       F1 한 덩어리: 리스트 전체가 하나로 등장 (기존 카드 리듬)   F2 캐스케이드: 행 80ms 간격 CSS 스태거 후 팬
       F3 행마다 규칙: 공통 규칙 6(컴포넌트 0.45s 간격)을 행 단위로 적용하고 행마다 화면이 따라간다 */
    const revealCard = async (card, ms) => {
      const f = variant('flat')
      if (!card.classList.contains('flatable') || f === 'C0' || f === 'F1') { reveal(card); await wait(ms); return alive() }
      card.classList.add('seq')
      if (f === 'F2') { reveal(card); await wait(ms + 80 * (card.children.length - 1)); return alive() }
      card.style.transition = 'none'; card.classList.add('in')
      const kids = [...card.children].filter((k) => getComputedStyle(k).display !== 'none')
      for (const k of kids) {
        reveal(k)
        await scrollTo(scroll, Math.max(scroll.scrollTop, anchorBottom(k)), 300, inOut); if (!alive()) return false
        await wait(Math.max(0, rv().card - 300)); if (!alive()) return false
      }
      return true
    }
    const resetFlat = (root) => root.querySelectorAll('.flatable').forEach((c) => { c.classList.remove('seq'); ;[...c.children].forEach((k) => k.classList.remove('in')) })
    // G-2 스크롤 인디케이터: 트랙 대비 썸 높이를 잡고 켠 뒤, 팬 동안 place() 로 따라오게 한다
    const showScrollInd = () => {
      const ind = scrollIndRef.current, thumb = ind?.firstElementChild
      const track = SEARCH_TOP - CHAT_TOP - 16
      const range = scroll.scrollHeight - scroll.clientHeight          // 팬 동안 변하지 않는 값은 한 번만 읽는다
      const h = Math.max(40, track * scroll.clientHeight / scroll.scrollHeight)
      if (thumb) thumb.style.height = `${h}px`
      const place = () => { if (thumb) thumb.style.transform = `translateY(${(track - h) * scroll.scrollTop / range}px)` }
      place(); ind?.classList.add('on')
      return { place, hide: () => ind?.classList.remove('on') }
    }

    const s5 = [...scroll.querySelectorAll(':scope > .s5')]   // [말풍선, 타이틀, 추천 문단, 이용중 카드]

    // 4번 (공통 규칙): 말풍선 → 타이틀(이용 현황 조회 = 내 정보 조회, 앵커 유지) → 접힘 → 멈춤 → 추천 문단 → 이용중 카드 → 요금제 카드 캐러셀(F-2) → 전체보기 → 팬 → 포인터 [전체보기] 대기
    const playUsage = async () => {
      resetAll()
      const T = rv()
      const [bubble, opening, msg, curCard] = s5
      reveal(bubble); await wait(T.bubble); if (!alive()) return
      reveal(opening); await scrollTo(scroll, anchorHeader(opening)); if (!alive()) return
      await wait(T.hold); if (!alive()) return
      await collapseOpening(op); if (!alive()) return
      collapsedRef.current = true
      await wait(T.settle); if (!alive()) return
      reveal(msg); await wait(USAGE_READ); if (!alive()) return                 // 긴 문단 — 읽을 시간을 준 뒤 카드
      reveal(curCard); await wait(T.card + 400); if (!alive()) return
      altEl.classList.add('on'); void altEl.offsetHeight
      if (!await revealCard(usageCardRef.current, T.card)) return
      await wait(T.tail + 500); if (!alive()) return
      await panTo(scroll, anchorBottom(usageCardRef.current), USAGE_PAN); if (!alive()) return   // 느린 팬 (사용자: 본문이 많으니 천천히)
      parkOnAll()
    }
    const finalUsage = () => {
      setOptK(OPT.plan)
      showNow(s5); hideOpening(op); collapsedRef.current = true
      altEl.classList.add('on'); showNow(altItems)
      scroll.scrollTop = anchorBottom(usageCardRef.current)
    }
    // 6→7: [전체보기] 탭 → 바텀시트 상승 → 첫 요금제 탭 → 선택 반영 → [적용하기] 위에서 대기
    const playSheet = async () => {
      await ptr?.tap(allRef.current, { move: 350, pause: 0 }); if (!alive()) return
      openSheet()
      await wait(650); if (!alive()) return
      // ── 둘러보기 (html[data-browse]: B1 스크롤 탐색 · B2 탭 둘러보기 · B3 호버 비교)
      const browse = variant('browse')
      const list = sheetRef.current.querySelector('.list')
      const rowsOf = () => sheetRef.current.querySelectorAll('.plan-mini')
      if (browse === 'B1' && ptr) {
        const r = ptr.rectOf(list), cx = r.x + r.w / 2
        await ptr.moveXY(cx, r.y + r.h * .8, 400); if (!alive()) return
        ptr.hold()
        await Promise.all([scrollTo(list, list.scrollHeight, 1000), ptr.moveXY(cx, r.y + r.h * .22, 1000)]); if (!alive()) return
        ptr.release(); await wait(600); if (!alive()) return
        ptr.hold()
        await Promise.all([scrollTo(list, 0, 800), ptr.moveXY(cx, r.y + r.h * .8, 800)]); if (!alive()) return
        ptr.release(); await wait(300); if (!alive()) return
      } else if (browse === 'B2' && ptr) {
        const tabs = sheetRef.current.querySelectorAll('.tabs span')
        await ptr.tap(tabs[1], { pause: 120 }); setSheetTab(1); if (!alive()) return
        await wait(1000); if (!alive()) return
        await ptr.tap(tabs[0], { move: 400, pause: 120 }); setSheetTab(0); if (!alive()) return
        await wait(500); if (!alive()) return
      } else if (browse === 'B3' && ptr) {
        const rows = rowsOf()
        for (const i of [1, 2, 3]) {
          await ptr.moveTo(rows[i], 420, '비교'); if (!alive()) return
          ptr.hover(); await wait(560); if (!alive()) return
        }
        await scrollTo(list, 0, 300)
      }
      await ptr?.tap(rowsOf()[0]); if (!alive()) return
      setSelPlan(0)
      await wait(500); if (!alive()) return
      ptr?.park(applyRef.current, 450, '탭')   // 스텝 끝 대기 = [적용하기] (사용자 탭 모드면 탭해야 다음 스텝)
    }
    /* ── 7번: [적용하기] → 시트 닫힘 → 요금제 선택 카드는 그대로, 고른 row 만 selected (Figma 12113:31378) */
    /* ── 7번 후반: 추가혜택 턴으로 넘어가기 (시안 T1/T2/T3, html[data-turn]) — 순서 규칙은 공통(타이틀 → 접힘 → 텍스트 → 카드) */
    const playTurn = async (turnEl, turnItems, pick) => {
      const T = rv(), turn = variant('turn'), disp = variant('disp')
      const [op3, msg, card] = turnItems
      turnEl.classList.add('on'); void turnEl.offsetHeight
      if (disp !== 'T0') {
        /* 전시 턴(추가혜택·할인방법)은 타이틀(Opening) 없음 — 타이틀은 고객 요청으로 '내 정보를 조회'할 때만 (사용자 규칙 2026-09-07). html[data-disp]
           N-1 바로 이어쓰기: 본문 텍스트 → 카드 (따라가기)
           N-2 생각 점: 점 3개 인디케이터 0.9s → 텍스트로 교체 → 카드
           N-3 카드만: 본문 텍스트도 생략, 카드 헤더가 안내문 역할 */
        hideOpening(op3)
        setTail(420)
        if (disp === 'N2') {
          const dots = turnEl.querySelector('.thinking')
          reveal(dots); await scrollTo(scroll, anchorBottom(dots)); if (!alive()) return
          await wait(900); if (!alive()) return
          dots.classList.add('out'); await wait(180); if (!alive()) return
          dots.style.display = 'none'
        }
        if (disp === 'N3') {
          msg.style.display = 'none'
        } else {
          reveal(msg); await scrollTo(scroll, anchorBottom(msg)); if (!alive()) return
          await wait(T.text); if (!alive()) return
        }
        if (!await revealCard(card, 120)) return
        await scrollTo(scroll, anchorBottom(card)); if (!alive()) return
        setTail(TAIL)
        if (pick) await pick()
        return
      }
      if (turn === 'T3') {
        // T-3 페이지 넘김: 먼저 빈 자리까지 팬(요금제 카드가 헤더 뒤로 빠짐) → 앵커 자리에서 타이틀이 나타남
        await scrollTo(scroll, anchorHeader(op3)); if (!alive()) return
        await wait(300); if (!alive()) return
        reveal(op3); if (!await collapseThenMsg(op3, msg, T)) return
        reveal(card); await wait(T.tail); if (!alive()) return
        await scrollTo(scroll, anchorBottom(card))
      } else if (turn === 'T2') {
        // T-2 따라가기 (확정 방향). 타이틀이 접힐 때 스크롤 끝에 걸려 scrollTop 이 클램프되어 화면이 위로 튀던 문제를
        // 세 방식으로 풀어 비교: html[data-t2] U1 자리 지키기 · U2 자리 바꾸기 · U3 미리 내려두기. 공통: tail 을 임시로 늘려 클램프 차단.
        const fix = variant('t2')
        setTail(420)
        if (fix === 'U3') {
          // U-3 미리 내려두기: 타이틀이 나타나기 전에 자리를 먼저 확보(타이틀 하단 + 여유 40px 까지 팬) → 타이틀은 멈춘 화면 안에서 등장
          op3.style.transition = 'none'; op3.style.visibility = 'hidden'; op3.classList.add('in') // 높이 확보용(보이지 않게)
          await scrollTo(scroll, anchorBottom(op3) + 40); if (!alive()) return
          op3.classList.remove('in'); op3.style.visibility = ''; void op3.offsetHeight
          reveal(op3); if (!await collapseThenMsg(op3, msg, T)) return   // 화면은 그대로, 타이틀 자리만 비워지고 그 자리에 텍스트 (팬 없음)
          reveal(card); await wait(120); if (!alive()) return
        } else if (fix === 'U2') {
          // U-2 자리 바꾸기: 타이틀이 접히는 동안 텍스트가 같은 자리에서 올라오며 교체 (빈 자리·되감기 없음)
          reveal(op3); await scrollTo(scroll, anchorBottom(op3)); if (!alive()) return
          await wait(T.hold2); if (!alive()) return
          const H = op3.offsetHeight + OPENING_OUTER                 // 타이틀 박스 + margin-top + flex gap
          msg.style.marginTop = `${-H}px`; msg.classList.add('in')
          const D = 600
          await Promise.all([
            collapseOpening(op3, D),
            tween(D, (e) => { msg.style.marginTop = `${-H * (1 - e)}px` }),
          ]); if (!alive()) return
          msg.style.marginTop = ''
          await wait(T.text); if (!alive()) return
          reveal(card); await wait(120); if (!alive()) return
        } else {
          // U-1 자리 지키기: 타이틀 등장 → 하단까지 따라 내려감 → 접혀도 화면은 멈춘 채 자리만 비워짐 → 텍스트가 그 자리에 들어옴
          reveal(op3); await scrollTo(scroll, anchorBottom(op3)); if (!alive()) return
          if (!await collapseThenMsg(op3, msg, T)) return
          reveal(card); await wait(120); if (!alive()) return
        }
        await scrollTo(scroll, anchorBottom(card)); if (!alive()) return
        setTail(TAIL)
        if (pick) await pick()
      } else {
        // T-1 앵커 점프 (공통 규칙 그대로): 타이틀 등장 → 타이틀을 채팅 시작선(199)으로 팬 → 유지 → 접힘 → 텍스트 → 카드 → 하단 팬
        reveal(op3); await scrollTo(scroll, anchorHeader(op3)); if (!alive()) return
        if (!await collapseThenMsg(op3, msg, T)) return
        reveal(card); await wait(T.tail); if (!alive()) return
        await scrollTo(scroll, anchorBottom(card))
      }
    }
    /* ── 9번: 스크롤 위로 → 요금제 재선택(베스트 Pro) → 아래 턴 안내문 갱신 → 다시 아래로 (Figma 12132:35075 → 12132:37456)
       시안 html[data-reselect]: R1 왕복 팬 · R2 갱신 하이라이트 · R3 재계산 연출 */
    // 8번 앞부분: 마지막 안내("마지막으로… T 안심보상…") + 행이 다 나온 상태. 사용자 탭 모드에서는 스텝 7 끝에서 미리 재생하고 쿠폰 위에 대기
    let reselectPrepDone = false
    const reselectIntro = async () => {
      const T = rv()
      const last = turns[LAST_OPT], [lm, , lastCard] = optKids(last)
      if (last.classList.contains('on')) return true
      last.classList.add('on'); void last.offsetHeight
      if (!await anchorTurnTop(last)) return false
      if (!await think(last, lm)) return false
      await follow(lm); if (!alive()) return false
      await wait(T.text); if (!alive()) return false
      setOptK(OPT.gift)
      if (!await revealCard(lastCard, 120)) return false                    // 행까지 다 나온 상태에서 (사용자 2026-09-07)
      await follow(lastCard, true); if (!alive()) return false
      await wait(1100); return alive()                                       // 읽다가 "쿠폰 다른 걸로 할까" 하는 틈
    }
    const reselectPrep = async () => {   // 사용자 탭 모드: 쿠폰 섹션까지 올라가(H-3) 30,000원 쿠폰 위에서 대기
      if (!await reselectIntro()) return
      const { sec, row } = OPT_RESELECT
      await panUpWithGesture(anchorHeader(optKids(turns[sec])[0]) - 8); if (!alive()) return
      await wait(250); if (!alive()) return
      reselectPrepDone = true
      ptr?.park(optRow(sec, row), 0, '쿠폰 변경')
    }
    /* 8번(2026-09-11 개편): 이제 모든 턴이 요약 줄로 접히므로, 위로 스크롤해 카드를 찾는 대신
       쿠폰 줄의 [다시 선택하기] 를 눌러 그 자리에서 목록을 다시 펼치고 30,000원 쿠폰으로 바꾼다. 뒤 선택에 영향이 없어 확인 모달도 없다 */
    const playReselectFold = async () => {
      const { sec, row } = OPT_RESELECT, fold = optFold(sec)
      await follow(fold); if (!alive()) return
      await wait(600); if (!alive()) return
      await ptr?.tap(fold.querySelector('em'), { move: 420, pause: 120 }); if (!alive()) return
      ptr?.hide(); uncollapseOpt(sec)
      const card = turns[sec].querySelector('.opt-card')
      await new Promise(afterLayout); if (!alive()) return
      if (!await revealCard(card, 120)) return
      await follow(card, true); if (!alive()) return
      await wait(700); if (!alive()) return
      await ptr?.tap(optRow(sec, row), { move: 400, pause: 120 }); if (!alive()) return
      setOptPick((p) => p.map((v, i) => (i === sec ? row : v)))
      await wait(560); if (!alive()) return
      ptr?.hide()
      if (!await collapseCard(card, optFold(sec))) return
      await follow(optFold(sec)); if (!alive()) return
      await wait(400); if (!alive()) return
      ptr?.park(optRow(LAST_OPT, OPTS[LAST_OPT].rec), 450, '탭')
    }
    const playReselectOld = async () => {
      // 8번: 마지막 안내("마지막으로… T 안심보상…")가 뜨자 → 쿠폰 섹션으로 올라가(H-3) 30,000원 쿠폰으로 바꾸고 → 하단 칩(K-2) 탭 → 내려옴(C-3)
      const last = turns[LAST_OPT], [, , lastCard] = optKids(last)
      if (!await reselectIntro()) return
      const { sec, row } = OPT_RESELECT, target = optRow(sec, row), card = optKids(turns[sec])[2]
      if (!reselectPrepDone) {   // 사용자 탭 모드에서는 스텝 7 끝에 이미 올라와 쿠폰 위에서 기다렸다
        await panUpWithGesture(anchorHeader(optKids(turns[sec])[0]) - 8); if (!alive()) return
        await wait(250); if (!alive()) return
      }
      reselectPrepDone = false
      await ptr?.tap(target); if (!alive()) return
      setOptPick((p) => p.map((v, i) => (i === sec ? row : v))); await wait(300); if (!alive()) return
      ptr?.hide()
      await anchorDown(target, lastCard); if (!alive()) return
      if (userTap()) ptr?.park(optRow(LAST_OPT, OPTS[LAST_OPT].rec))   // 다음 스텝의 첫 탭 = T 안심보상
    }
    const planRow = (i) => plansCardRef.current.querySelectorAll('.plan-row')[i]
    // A-1 가로 캐러셀: i번째 카드가 좌측 20px 선에 오도록 가로 스크롤 (세로 팬과 같은 in-out)
    const showCard = async (i, dur = 500) => {
      const rail = plansCardRef.current?.querySelector('.alt-cards'); if (!rail || getComputedStyle(rail).overflowX !== 'auto') return
      const card = planRow(i); if (!card) return
      const from = rail.scrollLeft, to = Math.max(0, card.offsetLeft - rail.offsetLeft - 20)   /* 컬럼 밖 -20 여백 보정 */
      if (Math.abs(to - from) < 2) return
      await tween(dur, (e) => { rail.scrollLeft = from + (to - from) * e }, inOut)
    }
    /* ── 9번 세부 시안 ① 올라갈 때 제스처 표현 (html[data-gesture]) */
    const panUpWithGesture = async (target) => {
      const G = variant('gesture')
      const SW = variant('swipe')
      if (SW !== 'none' && ptr) { await swipeUp(target, SW); return }
      if (G === 'G2' && scrollIndRef.current) {
        // G-2 (확정) 스크롤 인디케이터 + 속도 곡선 시안(P1/P2/P3): 320px/s 보다 빠르되 곡선으로 '쇽' 하고 안착
        const P = PANUP[variant('panup')] || PANUP.P1
        const ind = showScrollInd()
        await panTo(scroll, target, P, ind.place); if (!alive()) return
        await wait(250); ind.hide()
      } else if (G === 'G3' && jumpChip) {
        // G-3 앵커 칩: '요금제 선택으로 이동 ↑' 칩이 나타나고 포인터가 탭 → 위로 팬
        jumpChip.classList.add('on'); await wait(450); if (!alive()) return
        await ptr?.tap(jumpChip, { move: 400, pause: 120 }); if (!alive()) return
        jumpChip.classList.remove('on')
        await scrollTo(scroll, target)
      } else if (ptr) {
        // G-1 드래그 제스처: 손가락이 화면을 잡고 아래로 끌어 내려(콘텐츠는 위로) 이전 카드를 불러옴. 거리에 따라 1~2회
        const dist = scroll.scrollTop - Math.max(0, target)
        const r = ptr.rectOf(scroll), cx = r.x + r.w * .55
        const swipes = dist > 520 ? 2 : 1
        for (let i = 0; i < swipes; i++) {
          const part = i === swipes - 1 ? target : scroll.scrollTop - dist / swipes
          await ptr.moveXY(cx, r.y + r.h * .32, i === 0 ? 400 : 250); if (!alive()) return
          ptr.hold(); await wait(80)
          await Promise.all([scrollTo(scroll, part, 900, outExpo), ptr.moveXY(cx, r.y + r.h * .78, 900)]); if (!alive()) return
          ptr.release(); await wait(180); if (!alive()) return
        }
      } else {
        await scrollTo(scroll, target)
      }
    }
    /* ── 사람이 밀어 올리는 스크롤 시안 (html[data-swipe] H1/H2/H3) — 손가락(터치 포인트)이 화면을 잡고 아래로 끌면 콘텐츠가 위로.
       스크롤 인디케이터(G-2)는 함께 보인다. 손가락 이동과 스크롤은 같은 트윈에서 동기화(1:1), 놓은 뒤에는 관성으로 이어진다 */
    const swipeUp = async (target, SW) => {
      const ind = showScrollInd(), place = ind.place
      const r = ptr.rectOf(scroll), cx = r.x + r.w * .55
      const total = scroll.scrollTop - Math.max(0, target)      // 올라갈 거리(px)
      // 손가락이 y0→y1 로 내려가는 동안 콘텐츠도 같은 비율로 따라 움직이고(1:1), 손을 떼면 남은 거리를 관성으로
      const drag = async ({ to, y0, y1, dur, ease, coast = 0, coastDur = 0, coastEase = outExpo }) => {
        await ptr.moveXY(cx, r.y + r.h * y0, 260); if (!alive()) return
        ptr.hold(); await wait(70)
        const dragTo = to + coast                                 // 손가락이 닿아 있는 동안 도달하는 위치
        await Promise.all([
          scrollTo(scroll, dragTo, dur, ease, place),
          tween(dur, (e) => ptr.setXY(cx, r.y + r.h * (y0 + (y1 - y0) * e)), ease),
        ]); if (!alive()) return
        ptr.release()
        if (coast) { await scrollTo(scroll, to, coastDur, coastEase, place); if (!alive()) return }   // 관성 구간
      }
      const now = scroll.scrollTop
      if (SW === 'H2') {
        // H-2 두 번 나눠 밀기: 55% → 짧은 멈춤(220ms) → 45%. 실제로 엄지를 두 번 튕기는 리듬
        const mid = now - total * .55
        await drag({ to: mid, y0: .3, y1: .72, dur: 520, ease: cubicOut }); if (!alive()) return
        await wait(220); if (!alive()) return
        await drag({ to: target, y0: .32, y1: .78, dur: 560, ease: cubicOut }); if (!alive()) return
      } else if (SW === 'W2') {
        // W-2 엄지 두 번 튕기기: 짧게 튕겨 30% 끌고 25% 는 관성 → 240ms 멈칫 → 다시 튕겨 나머지. 사람이 두 번 스크롤하는 리듬 (2026-09-16)
        await drag({ to: now - total * .55, y0: .34, y1: .64, dur: 320, ease: cubicOut, coast: total * .25, coastDur: 720 }); if (!alive()) return
        await wait(240); if (!alive()) return
        await drag({ to: target, y0: .34, y1: .66, dur: 340, ease: cubicOut, coast: total * .2, coastDur: 900 }); if (!alive()) return
      } else if (SW === 'W3') {
        // W-3 한 번 밀고 관성으로: 손가락이 45% 를 끌고(0.55s) 놓으면 남은 55% 가 1.5s 동안 길게 감속하다 14px 넘겼다 되돌아온다 (2026-09-16)
        const over = Math.min(14, Math.max(0, target))                  // 맨 위(0)라면 넘길 곳이 없다
        await drag({ to: target - over, y0: .3, y1: .8, dur: 550, ease: cubicOut, coast: total * .55, coastDur: 1500 }); if (!alive()) return
        if (over) { await scrollTo(scroll, target, 360, cubicOut, place); if (!alive()) return }
      } else if (SW === 'H3') {
        // H-3 천천히 끌어 살피기: 손가락에 1:1 로 붙어 느리게 올라오다(1.1~1.6s) 놓으면 살짝 넘겼다 되돌아오는 고무줄 안착
        const dur = Math.min(1600, Math.max(1100, total / 0.45))
        await drag({ to: target, y0: .28, y1: .82, dur, ease: inOutSine, coast: -14, coastDur: 380, coastEase: cubicOut }); if (!alive()) return
      } else {
        // H-1 한 번에 튕기기(플릭): 손가락이 빠르게 내려가며 60% 를 끌고, 놓은 뒤 남은 40% 는 관성으로 길게 감속
        const dur = Math.min(700, Math.max(420, total / 1.1))
        await drag({ to: target, y0: .3, y1: .8, dur, ease: cubicOut, coast: total * .4, coastDur: 900 }); if (!alive()) return
      }
      await wait(220); ind.hide()
    }
    /* ── ② 선택 후: 하단에 앵커 칩('할인 방법 선택으로 ↓')이 뜨고 포인터가 탭 → 아래로 '쫘라락' (html[data-down] C1/C2/C3) */
    const anchorDown = async (row, toEl, label = CHIP_DOWN, { track = false, settle = false } = {}) => {
      const C = variant('down')
      const K = variant('trigger')
      /* 재선택 결과로 내려갈 때 "뻑" (사용자 2026-09-16): 목표를 핀이 뜨기 전에 한 번만 재는데 그 사이 꼬리 여백 · 흐림 전환으로 스크롤 높이가 바뀌어 어긋난다.
         G1 settle: 두 프레임 + 150ms 기다려 레이아웃이 굳은 뒤 재고 출발 / G2 track: 내려가는 동안 매 프레임 목표를 다시 읽는다 / G3 은 playReplan 에서 두 박자로 부른다 */
      if (settle) { await new Promise(afterLayout); await wait(150); if (!alive()) return }
      const to = anchorBottom(toEl)
      if (K === 'K2') {
        // K-2 (확정) 하단 앵커 칩 + 사용자 탭: 칩은 row 와 같은 가로 중심에 뜨므로 포인터는 수직으로만 내려가 탭.
        // 칩은 탭 뒤 제자리에서 페이드아웃만 하고, 문구·위치 초기화는 완전히 사라진 뒤에 한다 (옆으로 흔들림 방지).
        const FX = variant('chipfx')
        jumpChip.textContent = label; jumpChip.classList.add('down', 'on')
        await wait(420); if (!alive()) return
        await ptr?.tap(jumpChip, { move: 380, pause: 110 }); if (!alive()) return
        ptr?.hide()
        if (FX === 'E2') { jumpChip.classList.add('release'); await wait(140); jumpChip.classList.remove('release') } // E-2: 떼는 순간 살짝 튀어 오름
        if (FX === 'E3') { jumpChip.classList.add('absorb'); await wait(120) }          // E-3: 아래로 빨려 들어가며 사라짐 (이동 방향 예고)
        jumpChip.classList.remove('on')
        setTimeout(() => { if (!jumpChip.classList.contains('on')) resetChip() }, 360)
      } else if (K === 'K3') {
        // K-3 인라인 링크: 선택된 row 우측에 '할인 방법으로 ↓' 텍스트 버튼이 생기고 포인터가 그 자리에서 탭 (이동 거의 없음)
        const link = document.createElement('span'); link.className = 'row-link'; link.textContent = '할인 방법으로 ↓'
        row.querySelector('.top').appendChild(link); await wait(60); link.classList.add('on')
        await wait(420); if (!alive()) return
        await ptr?.tap(link, { move: 260, pause: 100 }); if (!alive()) return
        link.classList.remove('on'); ptr?.hide(); await wait(160); link.remove()
      } else {
        // K-1 손가락 아래 칩: 방금 탭한 row 바로 아래에 칩이 나타나 포인터가 조금만 내려가 탭
        const rs = ptr?.rectOf(row), root = rootRef.current.getBoundingClientRect()
        jumpChip.textContent = label
        jumpChip.classList.add('near'); jumpChip.style.top = `${rs ? rs.y + rs.h - root.top + 6 : 400}px`
        jumpChip.classList.add('on'); await wait(400); if (!alive()) return
        await ptr?.tap(jumpChip, { move: 260, pause: 100 }); if (!alive()) return
        jumpChip.classList.remove('on'); ptr?.hide(); await wait(120)
        jumpChip.classList.remove('near'); jumpChip.style.top = ''
      }
      if (C === 'C2') {
        // C-2 카드 단위 스텝: 추가혜택 카드 → 할인 카드 순으로 멈칫멈칫 내려감 (각 구간 짧은 팬 + 120ms)
        for (const s of [to]) {
          await panTo(scroll, s, { speed: 0.7, min: 350, max: 700, ease: outExpo }); if (!alive()) return
          await wait(120); if (!alive()) return
        }
      } else {
        if (track) {
          // G2 목표 추적: 시간은 처음 거리로 정하고, 프레임마다 toEl 의 현재 위치로 목표를 갱신한다 — 도중에 높이가 바뀌어도 어긋나지 않는다
          const prof = DOWN[C] || DOWN.C3, from = scroll.scrollTop
          const clampS = (v) => Math.max(0, Math.min(v, scroll.scrollHeight - scroll.clientHeight))
          const dist = Math.abs(clampS(to) - from), dur = Math.min(prof.max, Math.max(prof.min, dist / prof.speed))
          await tween(dur, (e) => { const goal = clampS(anchorBottom(toEl)); scroll.scrollTop = from + (goal - from) * e }, prof.ease)
          scroll.scrollTop = clampS(anchorBottom(toEl))
        } else await panTo(scroll, to, DOWN[C] || DOWN.C3)
      }
      if (K !== 'K2') resetChip()
    }
    /* ── ③ 가변 텍스트 {요금제명} 교체 연출 (html[data-var]) — 앵커링이 끝난 뒤 시작 */
    const swapPlanVar = async () => {
      const V = variant('var')
      const next = ALT_PLANS[PLAN_RESELECT][0]
      const vars = [penVarRef.current].filter(Boolean)
      if (V === 'V2') {
        // V-2 타이핑 교체: 옛 이름이 한 글자씩 지워지고 새 이름이 타이핑됨 (커서 표시)
        const el = vars[0]; const old = el.textContent
        el.classList.add('typing')
        for (let i = old.length; i >= 0; i--) { el.textContent = old.slice(0, i); await wait(28); if (!alive()) return }
        await wait(160)
        for (let i = 1; i <= next.length; i++) { el.textContent = next.slice(0, i); await wait(55); if (!alive()) return }
        await wait(300); el.classList.remove('typing')
        vars.slice(1).forEach((v) => { v.textContent = next })
      } else if (V === 'V3') {
        // V-3 롤업 교체: 옛 이름이 위로 밀려 나가고 새 이름이 아래에서 올라옴 (카운터 롤), 잠깐 밑줄 강조
        for (const el of vars) {
          el.classList.add('roll'); el.innerHTML = `<i class="old">${el.textContent}</i><i class="new">${next}</i>`
        }
        await wait(20); vars.forEach((el) => el.classList.add('go'))
        await wait(520); if (!alive()) return
        vars.forEach((el) => { el.className = 'plan-var mark'; el.textContent = next })
        await wait(900); vars.forEach((el) => el.classList.remove('mark'))
      } else {
        // V-1 (확정) 교체 페이드 + 문장 나머지의 움직임 시안 (html[data-morph] M1/M2/M3)
        const M = variant('morph')
        const el = vars[0], msg = el.parentElement
        // {}의 폭 변화만큼 뒤 문장이 자연스럽게 밀리도록 폭을 트윈 (모든 시안 공통 — 스마트 애니메이트의 기본)
        // 고스트를 먼저 붙이고 두 폭을 한 번에 읽은 뒤 스타일을 쓴다 (레이아웃 1회)
        const ghost = el.cloneNode(true); ghost.textContent = next; ghost.style.cssText = 'position:absolute;visibility:hidden;width:auto'; msg.appendChild(ghost)
        const w0 = el.getBoundingClientRect().width, w1 = ghost.getBoundingClientRect().width; ghost.remove()
        el.style.width = `${w0}px`; el.style.whiteSpace = 'nowrap'; el.style.overflow = 'hidden'
        if (M === 'M3') { msg.classList.add('morph-blur') }                    // M-3: 문장 전체가 살짝 흐려지고 0.98 로 줄었다가 새 값과 함께 맺힘
        el.classList.add('fade-out'); await wait(220); if (!alive()) return
        el.textContent = next; el.classList.remove('fade-out'); el.classList.add('fade-in')
        await tween(420, (e) => { el.style.width = `${w0 + (w1 - w0) * e}px` })   // 뒤 문장이 새 폭으로 미끄러짐 (ease-in-out)
        if (!alive()) return
        if (M === 'M2') {
          // M-2: {} 뒤의 단어들이 왼쪽에서 오른콝으로 잔물결처럼 한 번 튀어오르며 다시 자리잡음
          const tail = el.nextSibling
          if (tail && tail.nodeType === 3) {
            const frag = document.createDocumentFragment()
            tail.textContent.split(/(\s+)/).forEach((w, i) => {
              if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return }
              const s = document.createElement('span'); s.className = 'ripple'; s.style.animationDelay = `${i * 28}ms`; s.textContent = w; frag.appendChild(s)
            })
            tail.replaceWith(frag)
            await wait(700); if (!alive()) return
            msg.querySelectorAll('.ripple').forEach((s) => s.replaceWith(document.createTextNode(s.textContent)))
            msg.normalize()
          }
        }
        if (M === 'M3') { await wait(80); msg.classList.remove('morph-blur') }
        await wait(300); el.classList.remove('fade-in'); el.style.width = ''; el.style.whiteSpace = ''; el.style.overflow = ''
        vars.slice(1).forEach((v) => { v.textContent = next })
      }
      setMsgPlanIdx(PLAN_RESELECT)
    }
    const finalReselect = () => { setOptK(OPT.gift); const last = turns[LAST_OPT], kids = optKids(last); last.classList.add('on'); showNow(kids); setOptPick((p) => p.map((v, i) => (i === OPT_RESELECT.sec ? OPT_RESELECT.row : v))); afterLayout(() => { scroll.scrollTop = anchorBottom(kids[2]) }) }
    /* ── 10번: 위약금 질문 — SearchAi 탭 → 키패드 상승 → 타이핑(스텝 3과 같은 리듬) → 전송 → 키패드 하강 → 말풍선이 채팅 시작선에 (Figma 12349:37144 → 37232) */
    // 키패드가 열린 상태에서 마지막 카드 하단이 (키보드 위로 올라간) SearchAi 위 30px 에 오는 scrollTop.
    // K-1 처럼 채팅 영역이 키보드 높이만큼 줄어도 SearchAi 와 영역 하단이 같이 올라가므로 값은 같다
    // 요금제 카드가 접히면(§27) 그 자리의 요약 줄이 기준이 된다 — 접힌 카드는 display:none 이라 offsetTop 이 0
    const planAnchorEl = () => { const c = usageCardRef.current; return c && c.style.display !== 'none' ? c : foldRow() || c }
    const kbScrollTarget = () => { const row = planAnchorEl(); return row.offsetTop + row.offsetHeight - (SEARCH_TOP_KB - GAP) }
    /* 5번 끝 · 첫 할인 방법 출력 (Figma 435:177019) — 안내 한 줄 + 바닥 3행. 곧 위약금 질문이 이 위로 끼어든다 */
    const playDisc = async () => {
      const T = rv(), el = disRef.current
      if (!el) return alive()
      const [msg, card] = [...el.children]
      el.classList.add('on'); void el.offsetHeight
      setOptK(OPT.disc); setTail(420)
      reveal(msg); await follow(msg); if (!alive()) return false
      await wait(T.text); if (!alive()) return false
      if (!await revealCard(card, T.card)) return false
      await wait(T.tail); if (!alive()) return false
      setTail(TAIL)
      await follow(card, true); return alive()
    }
    const finalDisc = () => { const el = disRef.current; if (el) { el.classList.add('on'); showNow([...el.children]) } }
    const playPenalty = async () => {
      // 6번 앞부분: 시트의 [적용하기] 탭 → 시트 내려감 → 4번 캐러셀의 카드가 선택됨 → 그 다음 고객이 끼어들어 질문
      // Figma T1mhl 10906:6356 → 4864: 시트만 닫히고 카드는 아직 선택 표시 없음(사용자 2026-09-07). 화면이 아래에 정착한 뒤에야 입력 시작 — 모션 교차 방지
      await ptr?.tap(applyRef.current, { move: 300, pause: 0 }); if (!alive()) return
      ptr?.hide(); hideSheet(); setOptK(OPT.disc)                  // 요금제 적용(전송) → 다음 옵션 = 할인 방법
      if (!await syncFold()) return                                 // 팝업 하강과 박스 변환을 맞물리는 방식 (§27-3)
      /* 접힘이 끝난 자리를 다시 겨냥하지 않는다. 요약 줄은 대화 위쪽에 있어서 거기로 스크롤하면
         맨 위(0)까지 올라갔다가 말풍선 때문에 다시 내려온다 — 사용자 2026-09-12 '위로 올라갔다가 내려가고 어색'.
         접힘은 이미 제자리에서 끝났으니 멈춤만 두고 이어간다 (§28-5) */
      await wait(700); if (!alive()) return
      if (!await playDisc()) return                                 // 요금제를 적용하면 할인 방법이 곧바로 이어진다 (Figma 435:177019)
      await ptr?.tap(searchRef.current, { move: 420, pause: 100 }); if (!alive()) return
      ptr?.hide()
      setKbOpen(true)                                            // 키패드 상승. 채팅은 제자리(K-2 스크림), 스크롤 이동 없음
      await wait(600); if (!alive()) return
      setPenTyping(true)
      for (let i = 1; i <= PENALTY_Q.length; i++) { setPenTyped(PENALTY_Q.slice(0, i)); await wait(TYPE_MS / PENALTY_Q.length); if (!alive()) return }
      await wait(350); if (!alive()) return
      setPenTyping(false); setPenTyped(''); setKbOpen(false)     // 전송: 키패드 하강(0.5s), SearchAi 제자리로
      await wait(320); if (!alive()) return
      penEl.classList.add('on'); void penEl.offsetHeight
      setTail(PEN_TAIL)                                            // 아래는 Agent 답변 자리 — 말풍선이 시작선까지 올라갈 수 있게 여백 확보 (Figma 37232)
      disRef.current?.classList.add('stale')                      // 질문이 끼어든 순간 위의 할인 카드는 60% 로 — 지금은 고를 수 없다 (사용자 2026-09-16). 답변 뒤 재제시 카드가 그 역할을 잇는다
      reveal(penItems[0])                                         // 말풍선 (공통 규칙: 사용자 발화가 새 턴의 첫 요소)
      await scrollTo(scroll, Math.max(scroll.scrollTop, anchorHeader(penItems[0]) - PEN_BUBBLE_Y)); if (!alive()) return // 말풍선이 시작선 +136 (아래로만)
      await wait(900); if (!alive()) return
      await playPenaltyAnswer()
    }
    /* ── 10번 후반: 위약금 답변 턴 (Figma 12370:42010) — 공통 규칙(타이틀 → 접힘 → 텍스트 → 카드 → 칩) 위에 시안 html[data-pen]
       Y-1 공통 규칙 그대로(카드 한 덩어리) → 칩 탭 → 아래에 할인 선택 재제시 → 12개월 탭
       Y-2 표 행 순차: 회선/약정 행이 60ms 간격으로 맺히고 '예상 할인 반환금 0원'이 마지막에 살짝 튀어오르며 결론을 찍음 → 이후 Y-1 과 동일
       Y-3 복귀: 재제시 없이 칩 탭 → 원래 할인 카드로 되돌아가(팬) 카드가 한 번 빛나고 12개월 탭 (대화가 길어지지 않음) */
    const playPenaltyAnswer = async () => {
      // 27:12503 타이틀(내 정보 조회) → 27:12538 접힘 + 안내 1 → 27:26848 안내 2·3 + 요금제·할인 재제시 카드 → 포인터가 추천 할인(24개월) 위에서 대기
      const T = rv()
      const [, op4, m1, card2] = penItems
      reveal(op4); if (!await collapseThenMsg(op4, m1, T)) return
      await follow(m1); if (!alive()) return
      if (!await revealCard(card2, T.card)) return
      await wait(T.tail); if (!alive()) return
      setTail(TAIL)
      await follow(card2, true); if (!alive()) return
      if (!await foldTail()) return
      ptr?.park(discRow())
    }
    // 뷰포트 위쪽 요소들을 높이 0 으로 접어 없앤다 (opacity 와 함께). 줄어드는 만큼 scrollTop 을 보정해 보이는 화면은 고정
    const retireAbove = async (els, dur) => {
      const hs = els.map((el) => el.offsetHeight + TURN_GAP)        // flex gap 포함
      els.forEach((el) => { el.style.transition = 'none'; el.style.overflow = 'hidden'; el.style.marginBottom = '0px' })
      let prev = 0
      await tween(dur, (e) => {
        els.forEach((el, i) => { el.style.height = `${hs[i] * (1 - e)}px`; el.style.marginBottom = `${-TURN_GAP * e}px`; el.style.opacity = String(Math.max(0, 1 - e * 1.6)) })
        const gone = hs.reduce((a, b) => a + b, 0) * e
        scroll.scrollTop -= gone - prev; prev = gone
      }, inOut)
      els.forEach((el) => { el.style.display = 'none' })
    }
    /* ── 요금제 선택 플로우의 끝 = 카드가 접히고 요약 줄이 남는다 (html[data-planfold], Figma ixGPs9 261:117032, 사용자 2026-09-11)
       F1 접히며 제자리에 요약 줄(카드 높이 0 + 줄 페이드 인, 동시) / F2 요약 줄이 먼저 자리 잡고 카드가 뒤따라 접힘(두 박자) / F3 카드는 조용히 접히고 줄은 위약금 답변이 끝난 뒤 대화 맨 아래에 */
    const foldRow = () => (variant('planfold') === 'F3' ? foldTailRef : foldCardRef).current
    const shrink = async (el, dur) => {
      const h = el.offsetHeight
      el.style.overflow = 'hidden'
      await tween(dur, (e) => { el.style.height = `${h * (1 - e)}px`; el.style.opacity = String(Math.max(0, 1 - e * 1.5)) }, inOut)
      el.style.display = 'none'
    }
    const dissolvePlans = async () => {
      const card = usageCardRef.current, row = foldCardRef.current
      const h = card.offsetHeight + TURN_GAP
      await tween(350, (e) => { card.style.opacity = String(1 - e) }, inOut); if (!alive()) return false
      card.style.display = 'none'                                   // 둘 다 보이지 않는 순간에 자리를 바꾼다
      row.classList.add('on'); row.style.opacity = '0'
      await new Promise(afterLayout); if (!alive()) return false
      const gone = h - (row.offsetHeight + TURN_GAP)
      if (scroll.scrollTop > gone) scroll.scrollTop -= gone         // 아래 내용이 위로 튀지 않게 보정
      await tween(300, (e) => { row.style.opacity = String(e) }, inOut); if (!alive()) return false
      row.style.opacity = ''
      return alive()
    }
    /* S 시안 (사용자 2026-09-11 "F-1 인데 페이드아웃되면서 부드럽게"): 카드를 요약 줄 높이까지 줄이면서 페이드아웃 →
       높이가 같아진 지점에서 갈아끼우므로 자리 튐이 0 (스크롤 보정도 불필요) → 요약 줄 페이드인.
       S1 한 호흡(0.55s + 0.25s) / S2 먼저 흐려지고 자리가 줄어듦(0.3 → 0.4 + 0.25) / S3 느린 출발 긴 안착(0.8s R-2 + 0.35s) */
    const foldSmooth = async (mode) => {
      const card = usageCardRef.current, row = foldCardRef.current
      const h0 = card.offsetHeight
      row.classList.add('on'); row.style.opacity = '0'
      await new Promise(afterLayout); if (!alive()) return false
      const hRow = row.offsetHeight
      row.classList.remove('on')
      card.style.overflow = 'hidden'
      if (mode === 'S2') {
        await tween(300, (e) => { card.style.opacity = String(1 - e) }, inOut); if (!alive()) return false
        await tween(400, (e) => { card.style.height = `${h0 - (h0 - hRow) * e}px` }, inOut); if (!alive()) return false
      } else {
        const dur = mode === 'S3' ? 800 : 550, ease = mode === 'S3' ? inOutQuart : inOut   // S3 = 느린 출발 + 긴 안착
        await tween(dur, (e) => { card.style.height = `${h0 - (h0 - hRow) * e}px`; card.style.opacity = String(Math.max(0, 1 - e * 1.25)) }, ease); if (!alive()) return false
      }
      card.style.display = 'none'                                  // 높이가 같아진 지점 — 갈아끼워도 아래가 움직이지 않는다
      row.classList.add('on'); row.style.opacity = '0'
      await new Promise(afterLayout); if (!alive()) return false
      await tween(mode === 'S3' ? 350 : 250, (e) => { row.style.opacity = String(e) }, inOut); if (!alive()) return false
      row.style.opacity = ''
      return alive()
    }
    /* B-1 (사용자 2026-09-11 "카드가 줄어들면서 흰색 박스 형태가 되고 그게 다시 선택됨으로"):
       ① 내용만 흐려지고 카드가 흰 박스(.boxing)로 바뀌며 요약 줄 높이까지 줄어든다 → ② 빈 흰 박스로 잠깐 머문다
       → ③ 높이가 같아진 지점에서 갈아끼우고, 흰 박스가 '선택됨' 줄(뉴트럴 회색)로 물들며 글자가 떠오른다 */
    // 안착 느낌 시안 (html[data-boxland], 사용자 2026-09-11 "좀 더 스무스하게 랜딩되는 경험"):
    //   E1 긴 안착(끝을 길게 감속하고 머무는 박자를 줄임) / E2 마지막 16px 을 따로 아주 느리게 / E3 그림자·라운드가 함께 내려앉음 / off B-1 기본값
    const EXPO_OUT = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -9 * t))
    /* 확정된 접힘 모션(B-1 + E-3 + N-2, §27-7)을 카드 → 요약 줄 어디서나 쓰도록 뺀 것.
       카드를 요약 줄 높이까지 흰 박스로 줄이고 → 높이가 같은 지점에서 갈아끼우고 → 배경이 먼저 물들고 글자가 따라 뜬다 */
    const collapseCard = async (card, row, hold = 100) => {
      if (!card || !row || reducedMotion()) { if (card) card.style.display = 'none'; row?.classList.add('on'); return alive() }
      const h0 = card.offsetHeight
      row.classList.add('on'); row.style.opacity = '0'
      await new Promise(afterLayout); if (!alive()) return false
      const hRow = row.offsetHeight
      row.classList.remove('on'); row.style.opacity = ''
      /* 줄어드는 만큼 꼬리를 미리 늘려 둔다. 안 그러면 콘텐츠가 짧아지며 스크롤이 클램프됐다가
         내용이 다시 늘어날 때 원래 값으로 튕겨, 카드가 아래로 흐르고 요약 줄이 위로 점프한다 (사용자 2026-09-12) */
      const prevTail = tailRef.current?.style.height || ''
      setTail((parseInt(prevTail, 10) || TAIL) + Math.max(0, h0 - hRow))
      card.style.overflow = 'hidden'
      card.classList.add('boxing', 'l3-start')
      await new Promise(afterLayout); if (!alive()) return false
      card.classList.remove('l3-start')
      const inner = [...card.children]
      await tween(640, (e) => {
        card.style.height = `${h0 - (h0 - hRow) * e}px`
        const p = (h0 - (h0 - (h0 - hRow) * e)) / (h0 - hRow)
        inner.forEach((c) => { c.style.opacity = String(Math.max(0, 1 - p * 1.8)) })
      }, (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -9 * t))); if (!alive()) return false
      if (hold) { await wait(hold); if (!alive()) return false }
      card.style.display = 'none'; card.classList.remove('boxing')
      inner.forEach((c) => { c.style.opacity = '' })
      row.style.transition = ''
      row.classList.add('on', 'from-box')
      await new Promise(afterLayout); if (!alive()) return false
      row.classList.remove('from-box')
      await wait(820)
      // 꼬리는 되돌리지 않는다 — 되돌리는 순간 다시 클램프돼 아래 내용이 튄다. 이어지는 setTail 이 정상화한다 (2026-09-12)
      return alive()
    }
    /* 접힘 뒤 화면의 기준 (html[data-foldanchor], 사용자 2026-09-12 "2안처럼 위로 고정으로 해볼까" · "공통적으로 적용해야 할 것")
       K1 다음 턴을 시작선(199)에 고정 (2안 상단 앵커링과 같은 기조) / K2 방금 접힌 요약 줄을 시작선에 / K3 지금처럼 아래로만 따라가기 */
    const foldAnchor = () => variant('foldanchor') || 'K1'
    const anchorTurnTop = async (el) => { if (!el || foldAnchor() !== 'K1') return true; await scrollTo(scroll, anchorHeader(el)); return alive() }
    const afterFold = async (rowEl) => {
      const A = foldAnchor()
      if (!rowEl) return alive()
      if (A === 'K2') { await scrollTo(scroll, anchorHeader(rowEl)); return alive() }
      if (A === 'K3') { await follow(rowEl); return alive() }
      return alive()                                               // K1 은 다음 턴 시작에서 앵커
    }
    const optFold = (i) => turns[i]?.querySelector('.opt-fold')
    const uncollapseOpt = (i) => { const c = turns[i]?.querySelector('.opt-card'), r = optFold(i); if (c) { c.style.cssText = ''; c.classList.remove('boxing', 'l3-start'); [...c.children].forEach((k) => { k.style.opacity = '' }) } if (r) { r.classList.remove('on', 'from-box'); r.style.opacity = '' } }
    const foldBox = async (mode) => {
      const L = variant('boxland') || 'off'
      const hold = mode === 'B2' ? 0 : (L === 'E1' ? 110 : L === 'E3' ? 100 : 220)   // B2 는 머물지 않고 바로 물든다
      const card = usageCardRef.current, row = foldCardRef.current
      const h0 = card.offsetHeight
      row.classList.add('on'); row.style.opacity = '0'
      await new Promise(afterLayout); if (!alive()) return false
      const hRow = row.offsetHeight
      row.classList.remove('on'); row.style.opacity = ''
      const prevTail = tailRef.current?.style.height || ''                        // collapseCard 와 같은 이유: 클램프 방지 (2026-09-12)
      setTail((parseInt(prevTail, 10) || TAIL) + Math.max(0, h0 - hRow))
      card.style.overflow = 'hidden'
      card.classList.add('boxing')                                  // 흰 박스 표면이 0.3s 로 켜짐 (agent.css)
      if (L === 'E3') { card.classList.add('l3-start'); await new Promise(afterLayout); if (!alive()) return false; card.classList.remove('l3-start') }
      const inner = [...card.children]
      /* 내용이 사라지는 방식 (html[data-boxfade], 사용자 2026-09-11 "E-3 도 T-1 시점처럼 서서히 오파시티 되었으면"):
         기존은 1.8배로 앞당겨 진행 55% 에 이미 0 이었다 → 축소 전 구간에 걸쳐 서서히 사라지게.
         O1 전 구간 균일 / O2 착지까지 옅게 남기고 마지막에 0 / O3 처음 15% 는 버티다 그 뒤 균일 */
      const FADE = variant('boxfade') || 'O1'
      const fadeAt = (p) => {
        if (FADE === 'O2') return Math.max(0, 1 - p * .85)
        if (FADE === 'O3') return p < .15 ? 1 : Math.max(0, 1 - (p - .15) / .85)
        if (FADE === 'old') return Math.max(0, 1 - p * 1.8)
        return Math.max(0, 1 - p)
      }
      const shrink = (dur, from, to, ease) => tween(dur, (e) => {
        card.style.height = `${from - (from - to) * e}px`
        const p = (h0 - (from - (from - to) * e)) / (h0 - hRow)      // 전체 진행도로 내용 투명도를 맞춘다
        inner.forEach((c) => { c.style.opacity = String(fadeAt(p)) })
      }, ease)
      if (L === 'E2') {                                             // 마지막 16px 만 따로, 아주 느리게 마무리
        await shrink(460, h0, hRow + 16, inOut); if (!alive()) return false
        await shrink(260, hRow + 16, hRow, cubicOut); if (!alive()) return false
      } else {
        await shrink(L === 'off' ? 500 : 640, h0, hRow, L === 'off' ? inOut : EXPO_OUT); if (!alive()) return false
      }
      if (FADE === 'O2') { await tween(140, (e) => { inner.forEach((c) => { c.style.opacity = String(.15 * (1 - e)) }) }, cubicOut); if (!alive()) return false }
      if (hold) { await wait(hold); if (!alive()) return false }      // ② 빈 흰 박스로 한 박자 (B2 는 생략)
      card.style.display = 'none'; card.classList.remove('boxing', 'l3-start')
      inner.forEach((c) => { c.style.opacity = '' })
      row.style.transition = ''                                      // showNow(altItems) 가 남긴 인라인 transition:none 해제 — 없으면 배경이 순간 전환된다
      row.classList.add('on', 'from-box')                            // ③ 흰 박스 → 선택됨 줄
      if (mode === 'B3') row.classList.add('keep-box')               // B3 은 흰 박스 그대로 남는다
      await new Promise(afterLayout); if (!alive()) return false
      row.classList.remove('from-box')
      await wait(variant('selfade') === 'N2' ? 820 : 780)          // 배경·글자 트랜지션이 끝날 때까지 (agent.css html[data-selfade])
      // 꼬리는 되돌리지 않는다 — 되돌리는 순간 다시 클램프돼 아래 내용이 튄다. 이어지는 setTail 이 정상화한다 (2026-09-12)
      return alive()
    }
    /* ── 풀팝업이 내려가는 것과 카드 → 흰 박스 → [선택됨] 을 어떻게 맞물리게 하나 (html[data-foldsync], 사용자 2026-09-11
       "5→6 넘어갈 때 팝업 내려가잖아, 그때 같이 B-1 로 떠야 하지 않나. 매끄럽게 떨어지게")
       팝업 하강은 0.5s(.sheet transform). T1 동시 출발 / T2 팝업이 카드를 지나는 순간 시작 / T3 팝업이 앉은 직후 ── */
    const SHEET_DOWN = 500
    // 팝업은 위에서부터 걷힌다. 팝업 상단이 카드 상단을 지나는 시점을 하강 곡선에서 역산한다
    const revealDelay = () => {
      const card = usageCardRef.current, root = rootRef.current
      if (!card || !root) return 0
      const rr = root.getBoundingClientRect(), k = rr.width / 393 || 1
      const top = (card.getBoundingClientRect().top - rr.top) / k
      const target = clamp01(Math.max(0, top) / SCREEN_H)
      for (let i = 1; i <= 50; i++) if (inOut(i / 50) >= target) return Math.round(SHEET_DOWN * (i / 50))
      return SHEET_DOWN
    }
    const syncFold = async () => {
      if ((variant('planfold') || 'off') === 'off' || reducedMotion()) { await wait(600); return alive() }
      const S = variant('foldsync') || 'T3'
      if (S === 'T1') {                                            // 팝업이 내려가기 시작하는 순간 함께 출발
        const p = foldPlans()
        await wait(SHEET_DOWN); if (!alive()) return false
        return await p
      }
      if (S === 'T2' || S === 'T2A') {                              // 팝업 상단이 카드를 지나 드러나는 순간 (T2A 는 그보다 0.15s 앞)
        const d = Math.max(0, revealDelay() - (S === 'T2A' ? 150 : 0))
        await wait(d); if (!alive()) return false
        const p = foldPlans()
        await wait(Math.max(0, SHEET_DOWN - d)); if (!alive()) return false
        return await p
      }
      await wait(SHEET_DOWN + 120); if (!alive()) return false      // T3: 팝업이 앉은 직후
      return await foldPlans()
    }
    const foldPlans = async () => {
      const F = variant('planfold') || 'off'
      if (F === 'off' || reducedMotion()) return true
      if (F[0] === 'B') return foldBox(F)
      if (F[0] === 'S') return foldSmooth(F)
      if (F === 'D1') return dissolvePlans()
      const card = usageCardRef.current, row = foldCardRef.current
      if (F === 'F2') { row.classList.add('on'); await wait(320); if (!alive()) return false }
      if (F === 'F1') row.classList.add('on')
      await shrink(card, 500); return alive()
    }
    const foldTail = async () => {
      if (variant('planfold') !== 'F3' || reducedMotion()) return true
      const row = foldTailRef.current
      row.classList.add('on'); await follow(row); return alive()
    }
    // 최종 상태(직접 진입·되돌아오기): 접힘이 이미 끝난 모습
    const foldFinal = () => {
      const F = variant('planfold') || 'off'
      const card = usageCardRef.current, r1 = foldCardRef.current, r2 = foldTailRef.current
      r1.classList.remove('on', 'from-box', 'keep-box'); r2.classList.remove('on', 'from-box', 'keep-box'); r1.style.opacity = ''; r2.style.opacity = ''
      card.style.cssText = ''; card.classList.remove('boxing', 'l3-start'); [...card.children].forEach((c) => { c.style.opacity = '' })
      if (F === 'off' || reducedMotion()) return
      card.style.display = 'none'
      foldRow().classList.add('on')
      if (F === 'B3') foldRow().classList.add('keep-box')
    }
    const finalPenaltyAnswer = () => {
      showNow(penItems); hideOpening(penItems[1])
      afterLayout(() => { scroll.scrollTop = anchorBottom(penItems[3]) })
    }
    /* ── 본문이 '띡' 나오지 않게: 생각 점 → 본문 (html[data-think])
       W1 점 → 본문 페이드 (N-2 그대로)   W2 점 → 본문이 단어 단위로 흘러나옴(스트리밍)   W3 짧은 점 → 본문과 행이 한 호흡에 캐스케이드 */
    const streamIn = async (el, ms = 42) => {
      el.dataset.txt ??= el.textContent
      el.innerHTML = el.dataset.txt.split(/(\s+)/).map((w) => (w.trim() ? `<span class="sw">${w}</span>` : w)).join('')
      el.style.transition = 'none'; el.classList.add('in')
      for (const w of el.querySelectorAll('.sw')) { w.classList.add('on'); await wait(ms); if (!alive()) return false }
      return true
    }
    const think = async (t, msg) => {
      const W = variant('think'), dots = t.querySelector('.thinking')
      if (dots) {
        reveal(dots); await follow(dots); if (!alive()) return false
        await wait(W === 'W3' ? 450 : 750); if (!alive()) return false
        dots.classList.add('out'); await wait(160); if (!alive()) return false
        dots.style.display = 'none'
      }
      if (W === 'W2') { if (!await streamIn(msg)) return false } else reveal(msg)
      return alive()
    }
    /* ── 7번: 옵션 순차 선택 ① — 추천 할인(24개월) 탭 → 섹션 0·1·2 가 차례로: 안내문(추천을 말함) → 행(F-2) → 포인터가 추천 행 탭 → 다음 */
    const playOptSection = async (i, T) => {
      const t = turns[i], [m1, m2, card] = optKids(t), o = OPTS[i]
      t.classList.add('on'); void t.offsetHeight
      if (!await anchorTurnTop(t)) return false                      // K1: 턴의 시작을 채팅 시작선에
      const W = variant('think'), gap = W === 'W3' ? 180 : T.text
      if (!await think(t, m1)) return false
      await follow(m1); if (!alive()) return false
      await wait(gap); if (!alive()) return false
      if (!m2.classList.contains('none')) { if (W === 'W2') { if (!await streamIn(m2)) return false } else reveal(m2); await follow(m2); if (!alive()) return false; await wait(gap); if (!alive()) return false }
      setOptK([OPT.benefit, OPT.extra, OPT.coupon, OPT.pay, OPT.gift][i])   // 섹션 i 컴포넌트가 뜨는 순간 헤더 '{옵션} 선택중 k/n'
      if (!await revealCard(card, 120)) return false
      await follow(card, true); if (!alive()) return false
      await wait(650); if (!alive()) return false
      await ptr?.tap(optRow(i, o.rec)); if (!alive()) return false
      setOptPick((p) => p.map((v, k) => (k === i ? o.rec : v)))
      await wait(520); if (!alive()) return false
      ptr?.hide()
      if (!await collapseCard(t.querySelector('.opt-card'), optFold(i))) return false   // 고르면 요약 줄로 접힘
      if (!await afterFold(optFold(i))) return false
      return true
    }
    const playOpts1 = async () => {
      const T = rv()
      await ptr?.tap(discRow(), { move: 320, pause: 60 }); if (!alive()) return
      setDiscPick(DISC_PICK); setApplied(true); await wait(700); if (!alive()) return   // 이 순간 요금제 카드가 선택됨(S-1), 할인 방법 전송 → 추가 할인 수단
      ptr?.hide()
      if (!await collapseCard(plansCardRef.current, penFoldRef.current)) return         // 재출력 카드도 요약 줄로 (§28)
      if (!await afterFold(penFoldRef.current)) return
      optsEl.classList.add('on'); void optsEl.offsetHeight
      setTail(420)
      for (let i = 0; i < LAST_OPT; i++) { if (!await playOptSection(i, T)) return }
      ptr?.hide()
      setTail(TAIL)
      await downTo(optFold(LAST_OPT - 1) || optKids(turns[LAST_OPT - 1])[2]); if (!alive()) return   // 아래로만 — 되감기면 §28-5 위반
    }
    const finalOpts1 = () => {
      setDiscPick(DISC_PICK); setApplied(true); setOptK(OPT.pay); optsEl.classList.add('on')   // 스텝 7 끝 = 결제 방법까지
      if (plansCardRef.current) plansCardRef.current.style.display = 'none'
      penFoldRef.current?.classList.add('on')
      for (let i = 0; i < LAST_OPT; i++) { turns[i].classList.add('on'); showNow(optKids(turns[i])); const c = turns[i].querySelector('.opt-card'); if (c) c.style.display = 'none'; optFold(i)?.classList.add('on') }
      setOptPick((p) => p.map((v, k) => (k < LAST_OPT ? OPTS[k].rec : v)))
      afterLayout(() => { scroll.scrollTop = anchorBottom(optFold(LAST_OPT - 1) || optKids(turns[LAST_OPT - 1])[2]) })
    }
    /* ── 9번: 마지막 섹션의 행 → T 안심보상 탭 → 완료 안내 + [신청서 작성 시작하기] */
    const playOpts2 = async () => {
      const T = rv()
      const last = turns[LAST_OPT], [, , card] = optKids(last), done = turns[DONE_TURN], [dm, dm2, chipWrap] = optKids(done)
      setTail(420)
      if (!await reselectIntro()) return                              // 추가 혜택 턴 등장 (옛 재선택 스텝이 하던 몫, 스텝 8 폐기 2026-09-11)
      await ptr?.tap(optRow(LAST_OPT, OPTS[LAST_OPT].rec)); if (!alive()) return
      setOptPick((p) => p.map((v, k) => (k === LAST_OPT ? OPTS[LAST_OPT].rec : v)))
      await wait(700); if (!alive()) return
      ptr?.hide()
      if (!await collapseCard(card, optFold(LAST_OPT))) return                // T 안심보상도 요약 줄로 (Figma 271:125498)
      if (!await afterFold(optFold(LAST_OPT))) return
      done.classList.add('on'); void done.offsetHeight
      if (!await think(done, dm)) return
      await follow(dm); if (!alive()) return
      await wait(T.text + 650); if (!alive()) return                // '완료되었어요!' 뒤 한 박자 더 쉰다 (사용자 2026-09-16 '퍼즈 약간 길게') — 0.55s → 1.2s
      reveal(dm2); await follow(dm2); if (!alive()) return          // 두 번째 말풍선이 뒤따른다 (사용자 2026-09-16)
      await wait(T.text); if (!alive()) return
      reveal(chipWrap); await wait(T.tail); if (!alive()) return
      setTail(TAIL)
      await follow(chipWrap, true); if (!alive()) return
      ptr?.park(doneChipRef.current, 500, '탭', true)   // 스텝 8(재선택)이 먼저라 여기서는 CTA 를 강조하지 않는다 — 강조는 재선택 끝에 (사용자 2026-09-16)
    }
    const finalOpts2 = () => {
      setOptK(OPT.gift)
      turns[LAST_OPT].classList.add('on'); showNow(optKids(turns[LAST_OPT])); const c3 = turns[LAST_OPT].querySelector('.opt-card'); if (c3) c3.style.display = 'none'; optFold(LAST_OPT)?.classList.add('on')
      turns[DONE_TURN].classList.add('on'); showNow(optKids(turns[DONE_TURN]))
      setOptPick((p) => p.map((v, k) => (k === LAST_OPT ? OPTS[LAST_OPT].rec : v)))
      afterLayout(() => { scroll.scrollTop = anchorBottom(optKids(turns[DONE_TURN])[2]) })
    }
    /* ── 10번: [신청서 작성 시작하기] 탭 → 칩이 말풍선으로 → 개인정보 Alert → 화면 딤 + 신청서 AI 바텀시트 1/4 (주민등록번호) → 입력 → [다음] 위 대기
       (Figma 67:28493 → 51:37984 · 52:57568 키패드 · 52:58165 입력 완료). 시트 4장은 같은 시트 안에서 내용만 바뀐다 */
    const fsEl = (k) => rootRef.current?.querySelector(inForm ? `.fin-card [data-f="${k}"]` : `.ai-sheet.fs [data-f="${k}"]`)
    const setF = (k, v) => setFv((o) => ({ ...o, [k]: v }))
    const typeInto = async (setter, text, per) => { for (let i = 1; i <= text.length; i++) { setter(text.slice(0, i)); await wait(per); if (!alive()) return false } return true }
    /* 시트 열기/장 넘기기 — 높이 변화 시안 html[data-fsh]
       H1 높이 트윈: 바닥에 붙은 채 .fs-wrap 높이를 이전 → 새 높이로 트랜지션(0.45s), 내용은 크로스페이드
       H2 고정 높이: CSS 로 가장 큰 장 높이에 고정 — 여기서는 내용만 교체
       H3 내려갔다 올라오기: 시트가 바닥으로 내려간 뒤(0.35s) 내용을 바꾸고 새 높이로 다시 올라온다(0.45s) */
    const openFsheet = async (n) => {
      const H = variant('fsh'), sheet = fsheetRef.current, wrap = fsWrapRef.current
      setKbField(true); setFpeek(false)
      if (n === 1 || H === 'H2') { setFsheet(n); await wait(n === 1 ? 900 : 700); return alive() }
      if (H === 'H3') {
        sheet.classList.add('swap'); await wait(380); if (!alive()) return false          // .swap: .on 이어도 아래로
        setFsheet(n); await wait(40); if (!alive()) return false
        sheet.classList.remove('swap'); await wait(700); return alive()
      }
      // H1 (확정) — 모션감 html[data-fsm]: M1 부드러운 감속 / M2 스프링 안착(CSS 곡선) / M3 두 박자(내용 out → 높이 → 내용 in)
      const M = variant('fsm'), h0 = wrap.offsetHeight
      if (M === 'M3') { wrap.firstElementChild?.classList.add('out'); await wait(160); if (!alive()) return false; sheet.classList.add('hold') }
      wrap.style.height = `${h0}px`; setFsheet(n)
      afterLayout(() => { wrap.style.height = `${wrap.firstElementChild?.offsetHeight ?? h0}px`; setTimeout(() => { wrap.style.height = '' }, M === 'M2' ? 650 : 500) })
      if (M === 'M3') { await wait(430); if (!alive()) return false; sheet.classList.remove('hold'); await wait(420); return alive() }
      await wait(M === 'M2' ? 850 : 750); return alive()
    }
    const kbUp = async (k) => { setFfocus(k); setKbOpen(true); await wait(550); return alive() }
    /* 텍스트 입력이 있는 시트는 뜨자마자 입력 상태로 (사용자 2026-09-14 "바로 typing 상태로 활성화 되는 거 어때?")
       html[data-autokb]: T1 시트와 키패드가 함께 / T2 시트가 앉은 뒤 곧바로 / T3 커서 먼저, 키패드 뒤따라 / off 포인터가 필드를 탭(기존) */
    let autoKbField = null
    const autoKbBefore = (k) => { if (variant('autokb') !== 'T1') return; setFfocus(k); setKbOpen(true); autoKbField = k }
    const autoKbAfter = async (k) => {
      const A = variant('autokb')
      if (kbKeep() !== 'off' && kbOpenRef.current) {   // 키패드가 이미 떠 있다 — 커서만 새 칸으로 (B2 는 한 박자 뒤)
        await wait(kbKeep() === 'B2' ? 300 : 120); if (!alive()) return false
        setFfocus(k); autoKbField = k; await wait(260); return alive()
      }
      if (A === 'off' || A === 'T1') return alive()
      if (A === 'T3') { setFfocus(k); await wait(420); if (!alive()) return false; setKbOpen(true); await wait(480) }
      else { await wait(150); setFfocus(k); setKbOpen(true); await wait(520) }
      autoKbField = k
      return alive()
    }
    const kbDown = async () => { setFfocus(''); setKbOpen(false); await wait(450); return alive() }
    // 필드 탭 → 키패드(이미 열려 있으면 포커스만 이동) → 한 글자씩 → (마스킹). 키패드는 내리지 않는다 — [다음]은 키패드 위에서 바로 누른다 (사용자 2026-09-08)
    /* 다음 필드로 넘어갈 때 (html[data-fieldtap], 사용자 2026-09-16 "키보드가 이미 뜨는데 필드를 계속 클릭할 필요 있어?")
       F1 포인터가 탭(기존) / F2 자동 포커스 — 키패드가 열려 있으면 커서만 다음 필드로 / F3 자동 포커스 + 필드가 한 번 들썩여 '여기로 옮겨 왔다' 표시 */
    const fillField = async (k, text, per = 110, mask = '') => {
      const FT = variant('fieldtap') || 'F1'
      if (autoKbField === k) { autoKbField = null; ptr?.hide() }   // 시트가 이미 입력 상태로 떴다 — 탭 없이 바로 타이핑
      else if (FT !== 'F1' && kbOpenRef.current) {
        ptr?.hide(); setFfocus(k)
        if (FT === 'F3') { const el = fsEl(k); if (el) { el.classList.add('hop'); setTimeout(() => el.classList.remove('hop'), 520) } }
        await wait(FT === 'F3' ? 420 : 260); if (!alive()) return false
      }
      else {
        await ptr?.tap(fsEl(k), { move: 340, pause: 90 }); if (!alive()) return false
        ptr?.hide(); if (kbOpenRef.current) { setFfocus(k); await wait(200) } else if (!await kbUp(k)) return false
      }
      if (!alive()) return false
      if (!await typeInto((v) => setF(k, v), text, per)) return false
      for (let i = 1; i <= mask.length; i++) { setF(k, text + mask.slice(0, i)); await wait(90); if (!alive()) return false }
      await wait(350); return alive()
    }
    // [다음] 탭 (키패드 위에서) → 키패드가 먼저 내려가고(0.3s 시차) 그 뒤 내용이 바뀐다 — 두 움직임이 겹치지 않게
    /* 시트가 연속될 때 키패드를 내리지 않는다 (html[data-kbkeep], 사용자 2026-09-16 "키패드 올라온 상태로 연속되는 건 어떨까요")
       B1 유지: [다음] 을 눌러도 키패드는 그대로, 시트 내용만 바뀌고 커서가 새 칸으로
       B2 유지 + 한 박자: 키패드는 그대로, 시트가 바뀌는 동안 커서가 잠깐 사라졌다(0.3s) 새 칸에 — '장이 넘어갔다' 는 표시
       B3 리턴 키로 넘김: 키패드가 계속 떠 있으니 시트의 [다음] 대신 키패드 ↵ 를 눌러 다음 시트로 (마지막 장만 [다음])
       off 기존: [다음] → 키패드 내려감 → 새 시트 → 키패드 다시 올라옴 */
    const kbKeep = () => variant('kbkeep') || 'off'
    const tapNext = async (close = false) => {   // close: 다음이 입력 시트가 아니면(스텝 12 마지막 [다음] → 신청서 확인) 키패드를 닫는다 (사용자 2026-09-16)
      const K = kbKeep()
      const btn = K === 'B3' && kbOpenRef.current && !close ? rootRef.current?.querySelector('.key.ret') : fsEl('next')
      await ptr?.tap(btn || fsEl('next'), { move: 300, pause: 80 }); if (!alive()) return false
      if (K !== 'off' && !close) { ptr?.hide(); setFfocus(''); await wait(220); return alive() }   // 키패드는 그대로 둔다
      ptr?.hide(); setFfocus(''); setKbOpen(false); await wait(300); return alive()
    }
    const parkNext = () => setTimeout(() => { if (alive()) ptr?.park(fsEl('next')) }, 60)   // 시트 내용이 렌더된 뒤 [다음] 위에
    const hideChipEl = (c) => { if (!c) return; c.classList.add('gone'); if (c.parentElement) c.parentElement.style.display = 'none' }
    const showChipEl = (c) => { if (!c) return; c.classList.remove('gone'); if (c.parentElement) c.parentElement.style.display = '' }
    const hideDoneChip = () => hideChipEl(doneChipRef.current)
    /* 스텝 9 를 지나왔다면 살아 있는 CTA 는 재선택 결과 아래의 것이다 (위의 것은 흐려졌거나 걷혔다) — 9 → 10 은 그 칩에서 이어진다 */
    const liveDoneChip = () => (replanOutRef.current?.classList.contains('on') && variant('replanend') !== 'off' && reChipRef.current ? reChipRef.current : doneChipRef.current)
    const playForm = async (hold = false) => {
      const T = rv(), chip = liveDoneChip(), [bubble, alert] = formItems
      if (hold) { await wait(1400); if (!alive()) return }   // 2안: 스텝 8 마지막 부분을 읽을 시간 뒤에 칩 탭 (사용자 2026-09-09)
      await ptr?.tap(chip, { move: 300, pause: 80 }); if (!alive()) return
      setMaskInfo(true)                                                // 2안: 이력 블록의 가입자 정보 카드가 마스킹된다 (사용자 2026-09-16)
      ptr?.hide(); chip.classList.add('gone'); await wait(220); if (!alive()) return
      chip.parentElement.style.display = 'none'
      formEl.classList.add('on'); void formEl.offsetHeight
      setTail(PEN_TAIL)
      reveal(bubble); await scrollTo(scroll, Math.max(scroll.scrollTop, anchorHeader(bubble) - 8)); if (!alive()) return   // 말풍선이 채팅 시작선으로 (Figma 51:37984)
      setFpeek(true)                                                                       // 신청서 스텝부터 시트가 하단에 살짝 걸쳐 대기
      await wait(T.bubble); if (!alive()) return
      reveal(alert); await wait(T.card + 400); if (!alive()) return
      setOptK(OPT.rrn)                                                 // 주민등록번호 시트가 뜨는 순간 헤더 갱신
      autoKbBefore('rrn')
      if (!await openFsheet(1)) return
      if (!await autoKbAfter('rrn')) return
      if (!await fillField('rrn', FORM_VAL, 110, FORM_MASK)) return
      await wait(250); if (!alive()) return
      parkNext()
    }
    const finalForm = (park = false) => {
      setMaskInfo(true)
      setOptK(OPT.rrn); hideDoneChip(); hideChipEl(reChipRef.current)
      formEl.classList.add('on'); showNow(formItems); setTail(PEN_TAIL)
      setKbField(true); setFsheet(1); setFv((o) => ({ ...o, rrn: FORM_VAL + FORM_MASK })); setFfocus('rrn'); setKbOpen(true)
      afterLayout(() => { scroll.scrollTop = anchorHeader(formItems[0]) - 8 })
      if (park) parkNext()
    }
    /* ── 11번: [다음] → 시트 2/4 주소 — 우편번호 탭 → 키패드 → 5자리 → [검색] → 주소 채움 → 키패드 내려감 → 상세 주소 → 5G 안내 확인 체크 → [다음] 위 대기 (52:58702 → 52:59460) */
    const playAddr = async () => {
      if (!await tapNext()) return
      setOptK(OPT.addr); if (!await openFsheet(2)) return
      // [검색] 탭 → 주소 검색 풀페이지 팝업(html[data-zippop] Z1 아래서 / Z2 오른쪽에서 / Z3 시트에서 자라남) → 키패드 → 검색어 타이핑 → 결과 8행 → 첫 행 탭 → 팝업 닫히며 우편번호·주소 채움
      const keep = kbKeep() !== 'off'
      if (keep) { setFfocus(''); setKbOpen(false); await wait(420); if (!alive()) return }   // B-1: 풀팝업으로 나갈 때는 키패드가 먼저 내려간다 (사용자 2026-09-16)
      await ptr?.tap(fsEl('zipbtn'), { move: 340, pause: 90 }); if (!alive()) return
      ptr?.hide(); setZipPop(true); setZipQ(''); setZipList(false)
      await wait(520); if (!alive()) return
      if (keep) { await ptr?.tap(rootRef.current?.querySelector('.sheet.zip .zip-search'), { move: 320, pause: 80 }); if (!alive()) return; ptr?.hide() }   // 검색 필드를 눌러야 키패드가 뜬다
      setKbOpen(true); await wait(500); if (!alive()) return
      if (!await typeInto(setZipQ, ZIP_Q, 85)) return
      await wait(250); if (!alive()) return
      setZipList(true)
      await wait(900); if (!alive()) return
      await ptr?.tap(rootRef.current?.querySelector('.zip-item'), { move: 360, pause: 90 }); if (!alive()) return
      ptr?.hide(); setZipPop(false); setF('zip', ADDR_ZIP); setF('line', ADDR_LINE)
      if (keep) { setKbOpen(false); setFfocus('') } else setFfocus('detail')   // B-1: 결과를 고르면 키패드도 함께 내려가고, 상세 주소를 칠 때 다시 올라온다
      await wait(550); if (!alive()) return                                    // 팝업이 내려간 뒤 상세 주소
      if (!await fillField('detail', ADDR_DETAIL, 120)) return
      await wait(300); if (!alive()) return
      await ptr?.tap(fsEl('chk'), { move: 300, pause: 80 }); if (!alive()) return
      ptr?.hide(); setF('chk', true)
      await wait(350); if (!alive()) return
      parkNext()
    }
    const finalAddr = (park = false) => {
      setZipPop(false); setZipList(false); setZipQ('')
      setOptK(OPT.addr); setFsheet(2); setFv((o) => ({ ...o, zip: ADDR_ZIP, line: ADDR_LINE, detail: ADDR_DETAIL, chk: true })); setFfocus('detail'); setKbOpen(true)
      if (park) parkNext()
    }
    /* ── 12번: [다음] → 3/4 이메일 → [다음] → 4/4 개통 시 연락받을 번호 → [다음] 위 대기 (52:60548 → 52:61515) */
    const playContact = async () => {
      if (!await tapNext()) return
      autoKbBefore('email')
      if (!await openFsheet(3)) return
      if (!await autoKbAfter('email')) return
      if (!await fillField('email', EMAIL, 70)) return
      await wait(300); if (!alive()) return
      if (!await tapNext()) return
      autoKbBefore('phone')
      if (!await openFsheet(4)) return
      if (!await autoKbAfter('phone')) return
      if (!await fillField('phone', PHONE, 100)) return
      await wait(250); if (!alive()) return
      parkNext()
    }
    const finalContact = (park = false) => { setFsheet(4); setFv((o) => ({ ...o, email: EMAIL, phone: PHONE })); setFfocus('phone'); setKbOpen(true); if (park) parkNext() }

    /* ══ 1안 바닥 신청서 (html[data-fform] B1, Figma 360:81747 → 360:84842) ══════════════════════════════
       시트가 없으므로 [다음]도 없다. 한 칸을 다 채우면 다음 스텝이 그 카드를 접고 자리에 완료 선을 남긴다. */
    const addrItems = finAddrRef.current ? [...finAddrRef.current.children] : []        // [완료 선, 안내, 주소 카드]
    const contactItems = finContactRef.current ? [...finContactRef.current.children] : []   // [완료 선, 안내, 이메일 카드, 완료 선, 안내, 번호 카드]
    // 입력 카드는 담고 있는 필드 키로 찾는다 — 턴 블록의 문서 순서가 바뀌어도 따라 흔들리지 않게 (rrn · detail · email · phone · p2phone)
    const finCard = (k) => rootRef.current?.querySelector(`.fin-card:has([data-f="${k}"])`)
    // 카드가 키패드에 가리지 않게 (K-1 과 같은 규칙 — 카드 통째로 키패드 위로). anchorBottom 과 같은 자리 계산 함수
    const kbTop = (el) => Math.max(0, el.offsetTop + el.offsetHeight - (KB_TOP - 20))
    const kbFit = async (el, dur = 420) => { if (!el) return alive(); await scrollTo(scroll, kbTop(el), dur, inOut); return alive() }
    /* 입력 카드가 나오는 순간 = 키패드가 올라오는 순간 (스텝 10 확정 리듬 T-2 와 같은 박자).
       카드를 SearchAi 위로 한 번 팬했다가 키패드 때문에 또 올리면 두 번 움직여 어색하다 — 팬은 키패드 위 자리로 한 번만 */
    const kbCard = async (card, k) => {
      reveal(card); await wait(200); if (!alive()) return false
      setKbField(true)                                   // SearchAi 가 먼저 물러나고
      const pan = kbFit(card, 560)                       // 카드가 키패드 자리 위로 올라가는 동안
      await wait(180); if (!alive()) return false
      setFfocus(k); setKbOpen(true)                      // 키패드가 그 빈자리로 올라온다
      await pan; if (!alive()) return false
      await wait(180); return alive()
    }
    /* 입력이 끝난 카드 → 완료 선 (html[data-fincard])
       N1 제자리 접힘: 카드가 그 자리에서 높이를 잃고 사라진다 (요금제 카드 접힘과 같은 언어)
       N2 선으로 수축: 내용이 먼저 빠지고(0.18s) 남은 틀이 선 높이까지 줄어든 뒤 사라진다
       N3 먼저 물러나고 선이 따라옴: 카드가 살짝 내려앉으며 지워지고, 한 박자 뒤 완료 선이 온다 */
    const finFold = async (k) => {
      const card = finCard(k), F = variant('fincard')
      if (!card || card.style.display === 'none') return alive()
      if (F === 'N2') {
        card.classList.add('drain'); await wait(180); if (!alive()) return false
        await collapseAway(card, 380); return alive()
      }
      if (F === 'N3') {
        card.classList.add('sink'); await wait(260); if (!alive()) return false
        await collapseAway(card, 320); if (!alive()) return false
        await wait(220); return alive()
      }
      await collapseAway(card, 450); return alive()
    }
    const finFoldNow = (k) => hideOpening(finCard(k))
    /* 한 묶음 = [완료 선, 안내, 카드] — 마지막이 카드다.
       holdCard 면 그 카드는 내보내지 않고 남긴다 (kbCard 가 키패드와 한 호흡으로 내보낸다) */
    const finEmit = async (el, items, T, holdCard = false) => {
      if (!el.classList.contains('on')) { el.classList.add('on'); void el.offsetHeight }
      const n = items.length - (holdCard ? 1 : 0)
      for (let i = 0; i < n; i++) {
        reveal(items[i]); await follow(items[i]); if (!alive()) return false
        await wait(i === items.length - 1 ? T.card : T.text); if (!alive()) return false
      }
      return alive()
    }
    /* ── 10번: [신청서 작성 시작하기] 탭 → 가입자 정보 조회 → 가입자 정보 카드 → [신청서 작성하기] → 말풍선
       → '신청서 작성을 시작할게요' + 개인정보 안내 + Alert → 주민등록번호 카드 → 키패드 입력 (Figma 360:79418 → 360:79497) */
    const playFormIn = async (hold = false) => {
      const T = rv(), chip = liveDoneChip()
      const [op, ask, card1, chipWrap, bubble, start, guide, alert, rrnCard] = formItems
      if (hold) { await wait(1400); if (!alive()) return }
      await ptr?.tap(chip, { move: 300, pause: 80 }); if (!alive()) return
      ptr?.hide(); chip.classList.add('gone'); await wait(220); if (!alive()) return
      chip.parentElement.style.display = 'none'
      formEl.classList.add('on'); void formEl.offsetHeight
      setTail(PEN_TAIL)
      setOptK(OPT.rrn)
      reveal(op); await new Promise(afterLayout); if (!alive()) return                       // .form 이 방금 켜졌다 — 레이아웃이 잡힌 뒤 위치를 읽는다
      await scrollTo(scroll, Math.max(scroll.scrollTop, anchorHeader(op) - OPENING_MT)); if (!alive()) return
      await wait(1500); if (!alive()) return                                   // '고객님의 정보를 조회하고 있어요'
      await collapseOpening(op); if (!alive()) return
      await wait(T.settle); if (!alive()) return
      reveal(ask); await follow(ask); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(card1); await follow(card1); if (!alive()) return
      await wait(T.card); if (!alive()) return
      reveal(chipWrap); await follow(chipWrap, true); if (!alive()) return
      await wait(T.tail); if (!alive()) return
      // [신청서 작성하기] → 말풍선부터가 본격적인 작성
      await ptr?.tap(lookupChipRef.current, { move: 300, pause: 80 }); if (!alive()) return
      setMaskInfo(true)                                                // 다음 플로우로 넘어가는 순간 가입자 정보 카드가 마스킹된다
      ptr?.hide(); lookupChipRef.current.classList.add('gone'); await wait(220); if (!alive()) return
      chipWrap.style.display = 'none'
      reveal(bubble); await follow(bubble); if (!alive()) return
      await wait(T.bubble); if (!alive()) return
      reveal(start); await follow(start); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(guide); await follow(guide); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(alert); await follow(alert); if (!alive()) return
      await wait(T.card); if (!alive()) return
      if (!await kbCard(rrnCard, 'rrn')) return
      if (!await fillField('rrn', FORM_VAL, 110, FORM_MASK)) return
      setFfocus('')
    }
    const finalFormIn = (park = false) => {
      setMaskInfo(true)
      setOptK(OPT.rrn); hideDoneChip(); hideChipEl(reChipRef.current)
      formEl.classList.add('on'); showNow(formItems); setTail(PEN_TAIL)
      hideOpening(formItems[0]); hideChipEl(lookupChipRef.current)
      setKbField(true); setFv((o) => ({ ...o, rrn: FORM_VAL + FORM_MASK })); setFfocus('rrn'); setKbOpen(true)
      if (park) afterLayout(() => { const c = finCard('rrn'); if (c) scroll.scrollTop = kbTop(c) })
    }
    /* ── 11번: 주민등록번호 카드가 접히고 완료 선 → 안내 → 주소 카드 → [검색] 풀페이지 팝업 → 상세 주소 → 5G 안내 확인 (Figma 360:79547 → 360:79864) */
    const playAddrIn = async () => {
      const T = rv(), el = finAddrRef.current, card = addrItems.at(-1)
      setFfocus(''); setKbOpen(false); await wait(380); if (!alive()) return
      if (!await finFold('rrn')) return
      setOptK(OPT.addr)
      if (!await finEmit(el, addrItems, T)) return
      await ptr?.tap(fsEl('zipbtn'), { move: 340, pause: 90 }); if (!alive()) return
      ptr?.hide(); setZipPop(true); setZipQ(''); setZipList(false)
      await wait(520); if (!alive()) return
      setKbOpen(true); await wait(500); if (!alive()) return
      if (!await typeInto(setZipQ, ZIP_Q, 85)) return
      await wait(250); if (!alive()) return
      setZipList(true)
      await wait(900); if (!alive()) return
      await ptr?.tap(rootRef.current?.querySelector('.zip-item'), { move: 360, pause: 90 }); if (!alive()) return
      ptr?.hide(); setZipPop(false); setF('zip', ADDR_ZIP); setF('line', ADDR_LINE); setFfocus('detail')
      setKbField(true)
      await kbFit(card); if (!alive()) return
      await wait(400); if (!alive()) return
      if (!await fillField('detail', ADDR_DETAIL, 120)) return
      setFfocus(''); setKbOpen(false); await wait(420); if (!alive()) return
      await ptr?.tap(fsEl('chk'), { move: 300, pause: 80 }); if (!alive()) return
      ptr?.hide(); setF('chk', true); setKbField(false)
      await wait(350); if (!alive()) return
      await follow(card, true)
    }
    const finalAddrIn = (park = false) => {
      setZipPop(false); setZipList(false); setZipQ('')
      setOptK(OPT.addr); finFoldNow('rrn')
      finAddrRef.current.classList.add('on'); showNow(addrItems)
      setKbField(false); setKbOpen(false); setFfocus('')
      setFv((o) => ({ ...o, rrn: FORM_VAL + FORM_MASK, zip: ADDR_ZIP, line: ADDR_LINE, detail: ADDR_DETAIL, chk: true }))
      if (!park) return
      afterLayout(() => { scroll.scrollTop = anchorBottom(addrItems.at(-1)) })
      setTimeout(() => { if (alive()) ptr?.park(fsEl('chk')) }, 60)
    }
    /* ── 12번: 주소 카드 접힘 → 이메일 주소 → 다시 접힘 → 개통 시 연락받을 번호 (Figma 360:79595 → 360:84478) */
    const playContactIn = async () => {
      const T = rv(), el = finContactRef.current
      const parts = [['detail', contactItems.slice(0, 3), 'email', EMAIL, 70], ['email', contactItems.slice(3), 'phone', PHONE, 100]]
      for (const [prev, part, k, val, per] of parts) {
        if (!await finFold(prev)) return
        if (!await finEmit(el, part, T, true)) return
        if (!await kbCard(part.at(-1), k)) return
        if (!await fillField(k, val, per)) return
        setFfocus('')
        if (k === 'phone') return
        setKbOpen(false); await wait(420); if (!alive()) return
      }
    }
    const finalContactIn = (park = false) => {
      finFoldNow('detail'); finFoldNow('email')
      finContactRef.current.classList.add('on'); showNow(contactItems)
      setFv((o) => ({ ...o, email: EMAIL, phone: PHONE }))
      setKbField(true); setFfocus('phone'); setKbOpen(true)
      if (!park) return
      afterLayout(() => { const c = finCard('phone'); if (c) scroll.scrollTop = kbTop(c) })
      setTimeout(() => { if (alive()) ptr?.park(fsEl('phone')) }, 60)
    }
    /* ── 13번: 연락 번호 카드 접힘 → 완료 선 → '신청서 작성이 완료되었어요' → 신청서 카드 → [개통 이어가기] (Figma 360:84406) */
    const playReviewIn = async () => {
      const T = rv()
      setFfocus(''); setKbOpen(false); setKbField(false)
      await wait(520); if (!alive()) return
      if (!await finFold('phone')) return
      setTail(420)
      if (!await finEmit(reviewEl, [reviewItems[0], reviewItems[1], reviewCard()], T)) return
      reveal(reviewChipWrap); await wait(T.tail); if (!alive()) return
      setTail(TAIL)
      await follow(reviewChipWrap, true); if (!alive()) return
      ptr?.park(reviewChipRef.current)
    }
    const finalReviewIn = (park = false) => {
      setOptK(OPT.addr); setZipPop(false); setKbField(false); setFfocus(''); setKbOpen(false)
      finFoldNow('phone')
      reviewEl.classList.add('on'); showNow(reviewItems); setTail(TAIL)
      if (park) afterLayout(() => { scroll.scrollTop = anchorBottom(reviewChipWrap) })
    }
    const resetFin = () => {
      resetTurn(finAddrRef.current, addrItems); resetTurn(finContactRef.current, contactItems)
      rootRef.current?.querySelectorAll('.fin-card').forEach((c) => { c.style.cssText = ''; c.classList.remove('drain', 'sink') })
      const op = formItems[0]; if (op) op.style.cssText = ''
      showChipEl(lookupChipRef.current)
    }
    /* ── 13번: [다음] → 시트 내려감·딤 해제 → 개인정보 Alert 가 제자리에서 접히고 → 안내 → '개통 신청서 작성이 완료되었어요 · 재입력' 선 → 안내 2 → 신청서 카드 → [개통 이어가기] (52:62418) */
    const collapseAway = async (el, dur = 450) => {
      const h = el.offsetHeight
      el.style.transition = 'none'; el.style.overflow = 'hidden'
      await tween(dur, (e) => { el.style.height = `${h * (1 - e)}px`; el.style.marginBottom = `${-16 * e}px`; el.style.opacity = String(Math.max(0, 1 - e * 1.6)) }, inOut)
      el.style.display = 'none'
    }
    const playReview = async () => {
      const T = rv(), [line, msg2, card] = reviewItems
      if (!await tapNext(true)) return
      setFsheet(0); setKbField(false); setFfocus('')
      await wait(650); if (!alive()) return
      await collapseAway(formItems[1]); if (!alive()) return           // Alert 는 역할을 마쳤으니 그 자리에 결과가 온다
      reviewEl.classList.add('on'); void reviewEl.offsetHeight
      setTail(420)
      if (!await think(reviewEl, line)) return                        // 생각 점 → 곧바로 '개통 신청서 작성이 완료되었어요' 선
      await follow(line); if (!alive()) return
      await wait(1200); if (!alive()) return
      reveal(msg2); await follow(msg2); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(card); await follow(card); if (!alive()) return
      await wait(T.card); if (!alive()) return
      reveal(reviewChipWrap); await wait(T.tail); if (!alive()) return
      setTail(TAIL)
      await follow(reviewChipWrap, true); if (!alive()) return
      ptr?.park(reviewChipRef.current)
    }
    const finalReview = () => {
      setOptK(OPT.addr); setFsheet(0); setZipPop(false); setKbField(false); setFfocus(''); setKbOpen(false)
      formItems[1].style.display = 'none'
      reviewEl.classList.add('on'); showNow(reviewItems); reviewEl.querySelectorAll('.thinking').forEach((d) => { d.style.display = 'none' }); setTail(TAIL)
      afterLayout(() => { scroll.scrollTop = anchorBottom(reviewChipWrap) })
    }
    /* ── 13번: [개통 이어가기] → 말풍선 → 본인 인증 안내 → AI 바텀시트 → 토스 → 밖으로 나갔다 복귀 (html[data-ext])
       X1 앱 전환 슬라이드: 토스 화면이 오른쪽에서 밀려 들어와 덮고(0.45s), 인증이 끝나면 오른쪽으로 빠지며 돌아옴
       X2 시트 안에서: 시트 내용이 토스 미니 화면으로 바뀌어 그 자리에서 인증되고 시트가 내려감 (앱을 떠나지 않음)
       X3 페이드 + 배너: 화면이 흐려지며 토스로 바뀌고(0.5s), 돌아올 때 위에서 '본인인증이 완료되어 돌아왔어요' 배너 */
    /* [개통 이어가기] 를 누르면 작성이 끝난 신청서 카드(Figma ixGPs9 90:88097)는 대화에서 물러난다 (사용자 2026-09-14, 1·2안 공통)
       html[data-reviewaway]: W1 제자리에서 접혀 사라짐 / W2 '작성한 신청서 · 다시 보기' 줄로 접힘 / W3 접힘과 말풍선이 겹침 / off 남겨 둠(기존) */
    const reviewAway = async () => {
      const W = variant('reviewaway')
      const card = reviewCard(), fold = reviewFoldRef.current
      if (W === 'M1') { setReviewMasked(true); await wait(350); return alive() }   // M1: 카드는 그대로, 값만 가려진다
      if (W === 'off' || !card) return true
      if (W === 'W3') { collapseAway(card, 420); await wait(160); return alive() }   // 접히는 동안 말풍선이 이미 올라온다
      await collapseAway(card, 450); if (!alive()) return false
      if (W === 'W2' && fold) { reveal(fold); await wait(380); if (!alive()) return false }
      return alive()
    }
    /* 시트가 올라오기 전에 그 시트에 가려질 안내 문장을 시트 위 12px 까지 올려 둔다 — 문장이 먼저 자리를 잡고(팬) 한 박자 뒤 시트 (사용자 2026-09-16) */
    const clearForSheet = async (el, n) => {
      const sh = rootRef.current?.querySelectorAll('.ai-sheet:not(.fs):not(.p2a)')[n - 1]
      const h = sh ? sh.offsetHeight : 320
      const to = el.offsetTop + el.offsetHeight - (SCREEN_H - 14 - h - 12)
      if (to > scroll.scrollTop + 1) { await scrollTo(scroll, to); if (!alive()) return false; await wait(350) }
      return alive()
    }
    const playAuth = async () => {
      const T = rv(), X = variant('ext'), [bubble, m1, doneLine, m2] = authItems
      await ptr?.tap(reviewChipRef.current, { move: 300, pause: 80 }); if (!alive()) return
      ptr?.hide(); reviewChipRef.current.classList.add('gone'); await wait(220); if (!alive()) return
      reviewChipWrap.style.display = 'none'                            // 칩 자리까지 접어 말풍선이 카드 아래 16px 에 (Figma 26:41946)
      if (!await reviewAway()) return
      authEl.classList.add('on'); void authEl.offsetHeight
      setTail(420)
      reveal(bubble); await follow(bubble); if (!alive()) return
      await wait(T.bubble); if (!alive()) return
      if (!await think(authEl, m1)) return
      await follow(m1, true); if (!alive()) return
      await wait(600); if (!alive()) return
      if (!await clearForSheet(m1, 1)) return
      setAuthSheet(1); setOptK(OPT.auth1); await wait(900);   // 본인 인증 시트 등장 if (!alive()) return
      await ptr?.tap(tossItemRef.current, { move: 420, pause: 120 }); if (!alive()) return
      ptr?.hide(); await wait(150); if (!alive()) return
      if (X === 'X2') {
        setSheetToss(true); await wait(2400); if (!alive()) return          // 시트 안에서 진행 → 완료
        setSheetToss(false); setAuthSheet(0); await wait(500); if (!alive()) return
      } else {
        setExt('in'); await wait(2000); if (!alive()) return                 // 토스 화면(진행 중 → 완료)
        setExt('done'); await wait(900); if (!alive()) return
        setAuthSheet(0); setExt(''); await wait(500); if (!alive()) return   // 복귀
        if (X === 'X3') { setExtBanner(true); setTimeout(() => setExtBanner(false), 1800) }
      }
      reveal(doneLine); await follow(doneLine); if (!alive()) return
      await wait(1500); if (!alive()) return
      if (!await think(authEl, m2)) return
      setTail(TAIL)
      await follow(m2, true); if (!alive()) return
      await wait(600); if (!alive()) return
      if (!await clearForSheet(m2, 2)) return
      setAuthSheet(2); setOptK(OPT.auth2); await wait(700);   // 신원 인증 시트 등장 if (!alive()) return
      ptr?.park(authEl.ownerDocument.querySelector('.ai-sheet.on .ai-sheet-item'))
    }
    const finalAuthCard = () => {   // 직접 진입·되감기: 재생 없이 같은 결과 상태로
      const W = variant('reviewaway'), card = reviewCard(), fold = reviewFoldRef.current
      if (W === 'M1') { setReviewMasked(true); return }
      if (W === 'off' || !card) return
      card.style.display = 'none'
      if (W === 'W2' && fold) showNow([fold])
    }
    const finalAuth = () => { setOptK(OPT.auth2); reviewChipRef.current?.classList.add('gone'); reviewChipWrap.style.display = 'none'; finalAuthCard(); authEl.classList.add('on'); showNow(authItems); authEl.querySelectorAll('.thinking').forEach((d) => { d.style.display = 'none' }); setAuthSheet(2); afterLayout(() => { scroll.scrollTop = anchorBottom(authItems[3]) }) }
    /* ── 7번: 요금제 재선택 (Figma ixGPs9 271:126019). 대화에 남은 [다시 선택하기] → 전체 요금제 팝업(초기화 안내 띠, 현재 요금제 선택됨·적용 비활성)
       → 다른 요금제 탭 → [적용하기] 활성 → 탭 → '요금제를 변경하시겠어요?' 확인 모달 → [네] → 팝업 내려가고 줄의 요금제명이 바뀐다 */
    /* 스텝 9 진입 — 대화 위쪽에 남아 있는 '선택한 요금제 · 다시 선택하기' 줄까지 화면을 되감아 앵커링한다
       (사용자 2026-09-14 "[다시 선택하기] 누르려면 화면이 거기로 앵커링이 되어 있는 상황에서"). 재선택은 위아래 요동이 허용되는 유일한 구간.
       U1 인디케이터 곡선 팬(G-2 + P-1, 손가락 없음) / U2 손가락으로 끌어 올리기(H-3 1:1 + 고무줄) / U3 앵커 칩 '요금제 선택으로 이동 ↑' 탭 → 점프 / off 올라가지 않음(기존) */
    const replanUp = async (row) => {
      const U = variant('replanup')
      const target = Math.max(0, anchorHeader(row))
      if (U === 'off' || scroll.scrollTop <= target + 2) return alive()
      /* 되감기 질감 (html[data-rewind], 사용자 2026-09-16 "너무 빠르고 사람이 움직인다는 느낌이 덜 든다")
         W1 느린 곡선(손가락 없음, P-1 의 절반 속도) / W2 엄지 두 번 튕기기 / W3 한 번 밀고 긴 관성 / off 기존 U-1 */
      const W = variant('rewind')
      if (W === 'W1') { const ind = showScrollInd(); await panTo(scroll, target, PANUP.W1, ind.place); if (!alive()) return false; await wait(250); ind.hide(); return alive() }
      if (W === 'W2' || W === 'W3') { await swipeUp(target, W); return alive() }
      if (U === 'U2') { await swipeUp(target, 'H3'); return alive() }
      if (U === 'U3' && jumpChip) {
        jumpChip.textContent = CHIP_PLAN; jumpChip.classList.add('on')
        await wait(450); if (!alive()) return false
        await ptr?.tap(jumpChip, { move: 400, pause: 120 }); if (!alive()) return false
        jumpChip.classList.add('release'); await wait(140); jumpChip.classList.remove('release', 'on')
        setTimeout(() => { if (!jumpChip.classList.contains('on')) resetChip() }, 360)
        await panTo(scroll, target, PANUP.P1); return alive()
      }
      const ind = showScrollInd()                                  // U1 (기본): G-2 인디케이터 + P-1 곡선
      await panTo(scroll, target, PANUP[variant('panup')] || PANUP.P1, ind.place); if (!alive()) return false
      await wait(250); ind.hide(); return alive()
    }
    const playReplan = async () => {
      const row = foldRow()
      if (!row || !row.classList.contains('on')) { await wait(200) }
      setTail(Math.max(TAIL, SCREEN_H - CHAT_TOP - row.offsetHeight))   // 줄을 시작선까지 올릴 수 있도록 꼬리를 늘려 둔다
      await new Promise(afterLayout); if (!alive()) return
      if (!await replanUp(row)) return
      await follow(row); if (!alive()) return
      await wait(500); if (!alive()) return
      await ptr?.tap(row.querySelector('em'), { move: 420, pause: 120 }); if (!alive()) return
      ptr?.hide()
      setWarnBar(true); setSelPlan(0); setSheetTab(0); openSheet()   // 현재 요금제가 선택된 채로 열린다 → [적용하기] 비활성
      await wait(900); if (!alive()) return
      const rows = () => sheetRef.current.querySelectorAll('.plan-mini')
      const target = rows()[REPLAN_PICK], list = sheetRef.current.querySelector('.list')
      const over = target.offsetTop + target.offsetHeight - (list.scrollTop + list.clientHeight) + 24
      if (over > 0) { await scrollTo(list, list.scrollTop + over, 600); if (!alive()) return; await wait(200) }
      await ptr?.tap(target, { move: 420, pause: 120 }); if (!alive()) return
      setSelPlan(REPLAN_PICK); await wait(650); if (!alive()) return  // [적용하기] 활성
      await ptr?.tap(applyRef.current, { move: 380, pause: 120 }); if (!alive()) return
      ptr?.hide(); setConfirmPop(true); await wait(900); if (!alive()) return
      /* [아니오] 로 되돌아오기 (html[data-replanno], 사용자 2026-09-16 "요금제 변경하면 앞선 옵션을 다시 다 골라야 해서 꼬인다").
         모달이 닫히고 팝업이 내려간 뒤 아무것도 바뀌지 않은 채, 하단 핀 [신청서 작성으로 이동 ↓] 을 눌러 원래 있던 CTA 자리로 내려간다 */
      if (variant('replanno') !== 'off') {
        await ptr?.tap(confirmNoRef.current, { move: 420, pause: 140 }); if (!alive()) return
        ptr?.hide(); setConfirmPop(false); await wait(220); if (!alive()) return
        await ptr?.tap(sheetRef.current?.querySelector('.appbar .x'), { move: 380, pause: 120 }); if (!alive()) return   // 팝업은 × 로 직접 닫는다 (사용자 2026-09-16)
        ptr?.hide(); hideSheet(); setWarnBar(false); setSelPlan(0)
        await wait(600); if (!alive()) return
        setTail(TAIL)
        await new Promise(afterLayout); if (!alive()) return
        const wrap = doneChipRef.current?.parentElement
        await anchorDown(null, wrap, CHIP_RESUME); if (!alive()) return
        ptr?.park(doneChipRef.current, 450, '탭')   // 다음 스텝(신청서)의 첫 탭 = 원래의 [신청서 작성 시작하기]
        return
      }
      await ptr?.tap(confirmRef.current, { move: 420, pause: 140 }); if (!alive()) return
      ptr?.hide(); setConfirmPop(false); await wait(220); if (!alive()) return
      hideSheet(); setWarnBar(false)
      await wait(500); if (!alive()) return
      staleAbove()                                                 // 위 블록(요약 줄 + 고른 옵션들)은 비활성으로 남는다
      await wait(450); if (!alive()) return
      const outEl = replanOutRef.current, [notice, newRow, ask, cta] = [...outEl.children]
      outEl.classList.add('on'); void outEl.offsetHeight
      setTail(TAIL)
      /* 되감아 올라와 있으므로 내려갈 길을 손으로 준다 (사용자 2026-09-14 "밑으로 핀하는 거 하나 추가해서 그거 누르면 바로 밑으로").
         스텝 7 과 같은 언어 — K-2 하단 앵커 칩 + E-2 눌림 → C-3 곡선으로 결과 자리까지 */
      await new Promise(afterLayout); if (!alive()) return
      /* 결과 세 줄은 이미 자리를 잡고 흐리게 기다린다 — 핀을 누르면 그 자리까지 한 번에 가고,
         도착한 뒤에는 제자리에서 차례로 나타난다. (도착 후 요소마다 또 팬을 하면 찔끔찔끔 내려가 걸린다, 사용자 2026-09-15) */
      const E0 = variant('replanend')
      const restAt = E0 === 'off' ? newRow : cta
      const G = variant('replanpan')
      if (G === 'G3') {
        // G3 두 박자: 핀 → 요약 줄(선택한 요금제 · 다시 선택하기)까지 먼저 내려가 0.2s 멈추고 → 결과 자리까지
        await anchorDown(null, foldRow(), CHIP_BACK, { settle: true }); if (!alive()) return
        await wait(200); if (!alive()) return
        await scrollTo(scroll, anchorBottom(restAt), undefined, DOWN.C3.ease); if (!alive()) return
      } else {
        await anchorDown(null, restAt, CHIP_BACK, { settle: G === 'G1', track: G === 'G2' }); if (!alive()) return
      }
      reveal(notice)
      await wait(rv().text); if (!alive()) return
      reveal(newRow)
      setReplanIdx(REPLAN_PICK)
      await wait(400); if (!alive()) return
      /* 끝맺음 (html[data-replanend], Figma ixGPs9 250:154086 + 250:154093 — 사용자 2026-09-14 "변경됐다 하면서 바로 밑에 이거 뜨고 신청서 이어서")
         E1 바로 이어서 CTA / E2 한 마디 덧붙이고 CTA / E3 위의 흐려진 CTA 를 걷고 새로 / off 기존(CTA 없음) */
      const E = E0
      if (E === 'off') { ptr?.park(doneChipRef.current, 450, '탭'); return }
      if (E === 'E2') { reveal(ask); await wait(rv().text); if (!alive()) return }
      if (E === 'E3') {   // 위의 흐려진 칩이 먼저 걷힌다. 걷히며 줄어드는 높이만큼 스크롤을 보정해 화면이 튀지 않게 (§28-3 과 같은 규칙)
        const c = doneChipRef.current, wrap = c?.parentElement
        if (wrap) {
          c.classList.add('gone'); await wait(340); if (!alive()) return
          const h = wrap.offsetHeight + 8
          wrap.style.display = 'none'; scroll.scrollTop = Math.max(0, scroll.scrollTop - h)
          await wait(120); if (!alive()) return
        }
      }
      reveal(cta); await wait(300); if (!alive()) return
      await follow(cta, true); if (!alive()) return          // 혹시 모자란 만큼만 마지막에 한 번
      ptr?.park(reChipRef.current, 450, '탭')   // 다음 스텝(신청서)의 첫 탭 자리
    }
    // 위 블록을 비활성으로 (Figma 271:124668: 이전 요약 줄과 그때 고른 옵션들이 흐려지고 [다시 선택하기] 도 꺼진다)
    const staleAbove = () => { foldCardRef.current?.classList.add('stale'); optsRef.current?.classList.add('stale') }
    const unstale = () => { foldCardRef.current?.classList.remove('stale'); optsRef.current?.classList.remove('stale'); replanOutRef.current?.classList.remove('on'); unreveal([...(replanOutRef.current?.children || [])]) }
    const finalReplan = () => {
      if (variant('replanno') !== 'off') {   // [아니오] 흐름의 최종 상태 = 스텝 8 이 끝난 자리 그대로 (요금제 · 옵션 불변, CTA 가 화면 아래)
        setReplanIdx(-1); setWarnBar(false); setConfirmPop(false); hideSheet(); setSelPlan(0)
        const wrap = doneChipRef.current?.parentElement
        afterLayout(() => { if (wrap) scroll.scrollTop = anchorBottom(wrap) })
        return
      }
      setReplanIdx(REPLAN_PICK); setWarnBar(false); setConfirmPop(false); hideSheet()
      staleAbove()
      const E = variant('replanend')
      const outEl = replanOutRef.current; outEl.classList.add('on')
      const kids = [...outEl.children]
      showNow(E === 'off' ? kids.slice(0, 2) : kids)
      if (E === 'E3') hideDoneChip()
      // 직접 진입·되감기에서도 끝맺음이 화면에 들어오도록 (다른 스텝의 final* 과 같은 규칙)
      const last = [...kids].reverse().find((k) => k.offsetParent !== null) || kids[1]
      afterLayout(() => { scroll.scrollTop = anchorBottom(last) })
    }
    /* ── 14번: 실물 신분증 촬영(밖으로, X-1) → 복귀 → 신원 인증 완료 선 → 납부 방식 → 요금안내서 → 결제 시트 */
    // 14·15번 공통 앞부분: 실물 신분증 촬영(밖) → 복귀 → 신원 인증 완료 선 → 생각 점 → 첫 안내
    const afterIdVerify = async (line, m1) => {
      const idItem = rootRef.current.querySelector('.ai-sheet.on .ai-sheet-item')   // 신원인증 시트의 [실물 신분증 촬영]
      await ptr?.tap(idItem, { move: 400, pause: 120 }); if (!alive()) return false
      ptr?.hide(); await wait(150); if (!alive()) return false
      setExtKind('id'); setExt('in'); await wait(2000); if (!alive()) return false
      setExt('done'); await wait(900); if (!alive()) return false
      setAuthSheet(0); setExt(''); await wait(500); if (!alive()) return false
      payEl.classList.add('on'); void payEl.offsetHeight
      setTail(420)
      reveal(line); await follow(line); if (!alive()) return false
      await wait(1500); if (!alive()) return false                         // 선이 다 그려진 뒤(D-2 1.65s) 숨 고르기
      if (!await think(payEl, m1)) return false
      await follow(m1); if (!alive()) return false
      await wait(rv().text); return alive()
    }
    // 공통 끝부분: [결제하기] 시트 등장 → 포인터 대기
    const showCheckout = async () => {
      setAuthSheet(3); setOptK(OPT.checkout); await wait(700)
      ptr?.park(rootRef.current.querySelector('.ai-sheet.on .ai-sheet-item'))       // [결제하기]
    }
    const playPay = async () => {
      const T = rv(), [line, m1, m2, keepCard, m3, bills, m4] = payItems
      if (!await afterIdVerify(line, m1)) return
      reveal(m2); await follow(m2); if (!alive()) return
      await wait(T.text); if (!alive()) return
      setOptK(OPT.method)   // 납부 수단 컴포넌트 등장
      if (!await revealCard(keepCard, 120)) return
      await follow(keepCard, true); if (!alive()) return
      await wait(650); if (!alive()) return
      await ptr?.tap(payKeepRef.current); if (!alive()) return
      setPayPick(true); await wait(600); if (!alive()) return
      reveal(m3); await follow(m3); if (!alive()) return
      await wait(T.text); if (!alive()) return
      setOptK(OPT.bill)     // 요금안내서 컴포넌트 등장
      if (!await revealCard(bills, 120)) return
      await follow(bills, true); if (!alive()) return
      await wait(650); if (!alive()) return
      await ptr?.tap(billRef.current); if (!alive()) return
      setBillPick(0); await wait(600); if (!alive()) return
      ptr?.hide()
      if (!await think(payEl, m4)) return
      setTail(TAIL)
      await follow(m4, true); if (!alive()) return
      await wait(600); if (!alive()) return
      await showCheckout()
    }
    // 세 안의 납부 최종 상태가 공유하는 부분: 턴을 켜고 · 생각 점을 지우고 · 결제 시트를 띄우고 · 마지막 줄에 자리를 잡는다
    const finalPayBase = () => {
      setOptK(OPT.checkout); payEl.classList.add('on'); showNow(payItems); setAuthSheet(3)
      payEl.querySelectorAll('.thinking').forEach((d) => { d.style.display = 'none' })
      afterLayout(() => { scroll.scrollTop = anchorBottom(payItems.at(-1)) })
    }
    const finalPay = () => { finalPayBase(); setPayPick(true); setBillPick(0) }
    /* ── 2안 15번 (mode='an2', Figma 90:92843 → 90:100465): 신원 인증 완료 선 → 안내 2 → 시트 [요금을 함께 납부하시겠어요?] 네 → 결과 한 줄 → 안내 →
       시트 [사용 중인 번호로 인증해주세요] 번호 타이핑 → 다음 → 인증번호 + 타이머 → 다음 → '번호 인증 완료' 선 → 안내 2 → 결제 시트 */
    const playPay2 = async () => {
      const T = rv(), [line, m1, m2, res, m3, line2, m4, m5] = payItems
      if (!await afterIdVerify(line, m1)) return
      reveal(m2); await follow(m2, true); if (!alive()) return
      await wait(600); if (!alive()) return
      setOptK(OPT.method); setP2sheet(1); await wait(900); if (!alive()) return                       // 시트 A: 함께 납부?
      const rowA = rootRef.current.querySelector('.ai-sheet.p2a .plan-row')
      await ptr?.tap(rowA, { move: 420, pause: 120 }); if (!alive()) return
      setP2pick(0); await wait(480); if (!alive()) return
      ptr?.hide(); setP2sheet(0); await wait(800); if (!alive()) return                         // 시트 하강 0.8s (R-2)
      reveal(res); await follow(res); if (!alive()) return                                             // 결과 한 줄 '네'
      await wait(700); if (!alive()) return
      if (!await think(payEl, m3)) return
      await follow(m3, true); if (!alive()) return
      await wait(600); if (!alive()) return
      setP2step(1); setP2sheet(2); setKbField(true); autoKbBefore('p2phone'); await wait(900); if (!alive()) return   // 시트 B: 번호 인증
      if (!await autoKbAfter('p2phone')) return
      if (!await fillField('p2phone', PHONE, 70)) return
      if (!await tapNext()) return
      setP2step(2); await wait(500); if (!alive()) return
      if (!await typeInto((v) => setF('p2code', v), P2_CODE, 120)) return
      await wait(700); if (!alive()) return
      await ptr?.tap(fsEl('next'), { move: 300, pause: 80 }); if (!alive()) return
      ptr?.hide(); setP2sheet(0); setKbField(false); setKbOpen(false); setFfocus(''); await wait(800); if (!alive()) return   // 인증이 끝나면 시트와 함께 키패드도 내려간다 (사용자 2026-09-16)
      reveal(line2); await follow(line2); if (!alive()) return
      await wait(1500); if (!alive()) return
      if (!await think(payEl, m4)) return
      await follow(m4); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(m5); setTail(TAIL); await follow(m5, true); if (!alive()) return
      await wait(600); if (!alive()) return
      await showCheckout()
    }
    /* ── 1안 15번 (바닥): 신분증 촬영 → 복귀 → '신원 인증 완료' 선 → 안내 2 → 질문 → 행 [네/아니요] 탭 → 행이 접히고 '함께 납부 선택 여부 · 네' 줄
       → 안내 → '사용 중인 번호' 카드 입력 → 완료 선 → '번호 확인 완료' 선 → 안내 2 → 결제 시트 (Figma 366:105450 → 366:105730) */
    const playPay1 = async () => {
      const T = rv(), [line, m1, m2, ask, rows, fold, m3, card, doneLine, chkLine, m4, m5] = payItems
      if (!await afterIdVerify(line, m1)) return
      reveal(m2); await follow(m2); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(ask); await follow(ask); if (!alive()) return
      await wait(T.text); if (!alive()) return
      setOptK(OPT.method)
      if (!await revealCard(rows, T.card)) return                    // .flatable — 확정된 F-2 행 캐스케이드를 탄다
      await follow(rows, true); if (!alive()) return
      await ptr?.tap(rows.querySelector('.plan-row'), { move: 420, pause: 120 }); if (!alive()) return
      setP2pick(0); await wait(560); if (!alive()) return
      ptr?.hide()
      await collapseAway(rows, 450); if (!alive()) return            // 고른 뒤에는 답만 줄로 남는다 (요금제·옵션과 같은 규칙)
      reveal(fold); await follow(fold); if (!alive()) return
      await wait(700); if (!alive()) return
      if (!await think(payEl, m3)) return
      await follow(m3); if (!alive()) return
      await wait(T.text); if (!alive()) return
      if (!await kbCard(card, 'p2phone')) return
      if (!await fillField('p2phone', PHONE, 70)) return
      setFfocus(''); setKbOpen(false); setKbField(false)
      await wait(460); if (!alive()) return
      if (!await finFold('p2phone')) return                           // 번호 카드도 다른 입력 카드처럼 접히고 자리에 완료 선
      reveal(doneLine); await follow(doneLine); if (!alive()) return
      await wait(700); if (!alive()) return
      reveal(chkLine); await follow(chkLine); if (!alive()) return
      await wait(1500); if (!alive()) return
      if (!await think(payEl, m4)) return
      await follow(m4); if (!alive()) return
      await wait(T.text); if (!alive()) return
      reveal(m5); setTail(TAIL); await follow(m5, true); if (!alive()) return
      await wait(600); if (!alive()) return
      await showCheckout()
    }
    const finalPay1 = () => {
      const [, , , , rows] = payItems
      finalPayBase(); setP2pick(0); setFv((o) => ({ ...o, p2phone: PHONE }))
      setKbField(false); setKbOpen(false); setFfocus('')
      hideOpening(rows); finFoldNow('p2phone')                        // [네/아니요] 행과 번호 카드는 접힌 상태
    }
    const finalPay2 = () => { finalPayBase(); setP2pick(0); setP2sheet(0); setP2step(2); setFv((o) => ({ ...o, p2phone: PHONE, p2code: P2_CODE })) }
    /* ── 15번: [결제하기] 탭 → 결제 화면(외부)으로 슬라이드(X-1) → 끝 */
    const playPayout = async () => {
      const item = rootRef.current.querySelector('.ai-sheet.on .ai-sheet-item')     // [결제하기]
      await ptr?.tap(item, { move: 380, pause: 120 }); if (!alive()) return
      ptr?.hide(); await wait(150); if (!alive()) return
      setExtKind('pay'); setExt('in')
    }
    const finalPayout = () => { setExtKind('pay'); setExt('in') }
    const finalPenalty = () => {
      hideSheet(); setOptK(OPT.disc)
      if (document.documentElement.dataset.kbdemo === '1') {   // LAB 시안 확인용: 키패드 열린 채 타이핑된 상태로 멈춤
        setKbOpen(true); setPenTyped(PENALTY_Q); setPenTyping(true)
        setTimeout(() => { scroll.scrollTop = kbScrollTarget() }, 420)   // 영역 축소 전환(0.35s) 뒤에 정렬
        return
      }
      finalDisc(); disRef.current?.classList.add('stale')
      penEl.classList.add('on'); setTail(TAIL)
      finalPenaltyAnswer()
    }
    const finalSheet = () => {
      sheetRef.current.style.transition = 'none'; openSheet(); setSelPlan(0)
      requestAnimationFrame(() => { sheetRef.current.style.transition = '' })
      ptr?.park(applyRef.current, 0)
    }
    // 사용자 탭 모드: 최종 상태로 앉은 스텝(직접 진입·재로드 복원·되감기)에도 '다음 스텝의 첫 탭 자리' 에 대기
    let finalsOnly = true
    const run = (fn) => { finalsOnly = false; return fn() }
    const PARK_FOR = {
      usage: () => allRef.current, sheet: () => applyRef.current, penalty: () => discRow(), replan: () => foldRow()?.querySelector('em'), opts1: () => optRow(OPT_RESELECT.sec, OPT_RESELECT.row), reselect: () => optRow(LAST_OPT, OPTS[LAST_OPT].rec), opts2: () => doneChipRef.current, opts: () => doneChipRef.current, /* 9 를 지났으면 아래의 새 CTA */
      form: () => (inForm ? fsEl('rrn') : fsEl('next')), addr: () => (inForm ? fsEl('chk') : fsEl('next')), contact: () => (inForm ? fsEl('phone') : fsEl('next')), review: () => reviewChipRef.current,
      auth: () => rootRef.current.querySelector('.ai-sheet.on .ai-sheet-item'), pay: () => rootRef.current.querySelector('.ai-sheet.on .ai-sheet-item'),
    }
    const parkFor = () => { const f = PARK_FOR[stage]; if (f) ptr?.park(f(), 0, stage === 'opts1' ? '쿠폰 변경' : '탭', stage === 'opts2') }
    // 스텝 진입: 바로 앞 스텝에서 왔으면 재생, 아니면 최종 상태로 즉시 (직접 진입·되감기·reduced-motion)
    const dispatch = () => {
      /* 2안(mode an2)은 스텝 9 까지를 AgentChat2 가 그렸고 여기서는 이력 블록(.an2-hist)만 보인다.
         3안 대화(요금제 줄·옵션 줄)를 켜면 이력 아래에 '선택됨 · 5GX 프라임 플러스' 같은 남의 줄이 끼어들었다 (사용자 2026-09-14 "9→10 이 매끄럽지 않아") */
      const an2 = mode === 'an2'
      const histTop = () => {
        if (!an2 || !histRef.current) return
        setOptK(OPT.plan)
        altEl.classList.add('on')                                  // 신청서·인증·결제 턴이 모두 이 컨테이너 안에 있다
        showNow([histRef.current])
        setTail(SCREEN_H)
        afterLayout(() => { scroll.scrollTop = anchorHeader(histRef.current) })   // 이력 블록이 채팅 시작선에
      }
      const upToPenalty = () => { if (an2) return histTop(); finalUsage(); finalPenalty(); foldFinal() }

      const upToOpts2 = () => { upToPenalty(); if (an2) return; finalOpts1(); finalOpts2() }
      const upToReplan = () => { upToOpts2(); if (an2) return; finalReplan() }
      /* 신청서~납부는 1안이 바닥(…In), 2안이 시트, 그 외가 기존 시트다 — 여기서 한 번만 고른다 */
      const pForm = inForm ? playFormIn : playForm, fForm = inForm ? finalFormIn : finalForm
      const pAddr = inForm ? playAddrIn : playAddr, fAddr = inForm ? finalAddrIn : finalAddr
      const pContact = inForm ? playContactIn : playContact, fContact = inForm ? finalContactIn : finalContact
      const pReview = inForm ? playReviewIn : playReview, fReview = inForm ? finalReviewIn : finalReview
      const pPay = an2 ? playPay2 : inForm ? playPay1 : playPay, finPay = an2 ? finalPay2 : inForm ? finalPay1 : finalPay
      const upToForm = () => { upToReplan(); fForm() }
      if (payout) {
        if (prevRef.current === 'pay' && !reduced) run(playPayout)
        else { upToForm(); fAddr(); fContact(); fReview(); finalAuth(); finPay(); finalPayout() }
        prevRef.current = 'payout'; return
      }
      if (pay) {
        if (prevRef.current === 'auth' && !reduced) pPay()
        else { resetPayout(); upToForm(); fAddr(); fContact(); fReview(); finalAuth(); finPay() }
        prevRef.current = 'pay'; return
      }
      if (auth) {
        if (prevRef.current === 'review' && !reduced) run(playAuth)
        else { resetPay(); upToForm(); fAddr(); fContact(); fReview(); finalAuth() }
        prevRef.current = 'auth'; return
      }
      if (review) {
        if (prevRef.current === 'contact' && !reduced) run(pReview)
        else { resetAuth(); upToForm(); fAddr(); fContact(); fReview(true) }
        prevRef.current = 'review'; return
      }
      if (contact) {
        if (prevRef.current === 'addr' && !reduced) run(pContact)
        else { resetReview(); resetAuth(); upToForm(); fAddr(); fContact(true) }
        prevRef.current = 'contact'; return
      }
      if (addr) {
        if (prevRef.current === 'form' && !reduced) run(pAddr)
        else { resetReview(); resetAuth(); upToForm(); fAddr(true) }
        prevRef.current = 'addr'; return
      }
      if (form) {
        if (prevRef.current === null && from === 'opts2' && !reduced) { resetForm(); upToOpts2(); run(() => pForm(true)) }   // 2안: 바텀시트 흐름 끝(AgentChat2) 에서 넘어옴 — 이력 블록이 시작선에 놓인 채 [신청서 작성하기] 탭 → 신청서
        else if ((prevRef.current === 'opts2' || prevRef.current === 'replan') && !reduced) run(pForm)
        else { resetForm(); upToReplan(); fForm(true) }
        prevRef.current = 'form'; return
      }
      if (opts) {
        // 7+8 합침: 할인 · 쿠폰 · 결제(옛 7) 를 재생하고 이어서 추가 혜택 → 선택 완료(옛 8) 까지 한 번에. 최종 상태와 이후 스텝의 되감기는 옛 8 과 같다
        if (prevRef.current === 'penalty' && !reduced) run(async () => { await playOpts1(); if (!alive()) return; await playOpts2() })
        else { resetForm(); unstale(); upToOpts2() }
        prevRef.current = 'opts2'; return
      }
      if (opts2) {
        if (prevRef.current === 'opts1' && !reduced) run(playOpts2)
        else { resetForm(); unstale(); upToOpts2() }   // 재선택은 스텝 9 — 여기서는 아직 켜지 않는다
        prevRef.current = 'opts2'; return
      }

      if (replan) {
        if (prevRef.current === 'opts2' && !reduced) run(playReplan)
        else { resetForm(); upToOpts2(); finalReplan() }   // 10 에서 되감아 오면 신청서 시트·칩까지 되돌린다
        prevRef.current = 'replan'; return
      }
      if (opts1) {
        if (prevRef.current === 'penalty' && !reduced) run(playOpts1)
        else { resetReselect(); resetOpts(LAST_OPT); unstale(); upToPenalty(); finalOpts1() }
        prevRef.current = 'opts1'; return
      }
      if (penalty) {
        if (prevRef.current === 'sheet' && !reduced) run(playPenalty)
        else { resetReselect(); resetOpts(); setDiscPick(-1); upToPenalty() }
        prevRef.current = 'penalty'; return
      }
      if (sheet) {
        if (LATER_THAN_ALT.slice(1).includes(prevRef.current)) { resetApply(); finalUsage(); finalSheet() }
        else if (prevRef.current === 'usage' && !reduced) run(playSheet)
        else { finalUsage(); finalSheet() }
        prevRef.current = 'sheet'; return
      }
      // usage (4번): 처음 진입이면 재생, 뒤에서 되돌아오면 최종 상태 + [전체보기] 위 대기
      if (LATER_THAN_ALT.includes(prevRef.current)) { closeSheet(); resetApply(); finalUsage(); parkOnAll() }
      else if (prevRef.current === null && !reduced) run(playUsage)
      else { finalUsage(); parkOnAll() }
      prevRef.current = 'usage'
    }
    dispatch()
    if (finalsOnly && userTap()) setTimeout(() => { if (alive()) parkFor() }, 650)
    return () => { seqRef.current++; camStop() }   // 언마운트 시 진행 중 시퀀스 중단 (rAF/타이머가 떨어진 DOM 위에서 계속 돌지 않게)
  }, [stage]) // 위의 불리언들은 모두 stage 에서 파생

  // 신청서 시트 필드 (DS Input 48h · radius 14). 포커스면 캐럿, 값이 있으면 filled
  // [다음] 활성 조건: 시트별 필수 입력이 모두 채워졌을 때 (Figma: 비활성 회색 → 활성 검정)
  const fsReady = [false, fv.rrn.length >= (FORM_VAL + FORM_MASK).length, !!(fv.zip && fv.line && fv.detail && fv.chk), fv.email === EMAIL, fv.phone === PHONE][fsheet]

  return (
    <div className={`ai-screen ${mode === 'an2' ? 'an2' : ''} ${kbOpen ? 'kb' : ''} ${kbField ? 'kbf' : ''} ${fsheet || p2sheet === 2 ? 'fs-open' : ''} ${zipPop ? 'zip-open' : ''}`} ref={rootRef}>
      <AgentBackground />
      <div className="ai-header-fixed">
        <AgentBackground />
        <StatusBar />
        <AppbarAi chip={chip} k={optK} n={OPTIONS.length} />
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        <UserMessage className="s5">이용 현황에 맞춰서 적합한 요금제 추천해줘</UserMessage>

        <Opening className="first s5" innerRef={openingRef} status="이용 현황 조회중" title={<>최근 6개월 이용 현황을<br />먼저 살펴볼게요</>} />
        <AiMessage className="s5">{USAGE_MSG}</AiMessage>
        <Card className="s5">
          <span className="badge">이용중 요금제</span>
          <div className="cell-desc">{CUR_PLAN.name}</div>
          <div className="cell-title">{CUR_PLAN.price}</div>
          <div className="cell-desc">{CUR_PLAN.caps}</div>
          <BenefitBadges />
        </Card>

        {/* 4번 후반: 요금제 카드 캐러셀(A-1) + [전체보기] (Figma ixGPs9 26:26073). 이후 턴(끼어든 질문·옵션 선택)의 컨테이너를 겸한다 */}
        <div className="alt" ref={altRef}>
          {/* 2안(mode an2) 스텝 9~: 3안 이력 대신 스텝 8(AgentChat2) 의 마지막 부분을 그대로 보인다 — 마지막 시트의 질문/답 말풍선 → 완료 안내 → 가입자 정보 안내·카드 → [신청서 작성하기] (사용자 2026-09-09) */}
          {mode === 'an2' && (
            <div className="an2-hist" ref={histRef}>
              <AnswerBubble q={LAST_Q} a={LAST_A} />
              <AiMessage>{PRE_MSG}</AiMessage>
              <AiMessage>{PRE_MSG_B}</AiMessage>
              <AiMessage>{PRE_MSG2[0]}<br />{PRE_MSG2[1]}</AiMessage>
              <Card className="review-card">
                <h3>가입자 정보</h3>
                <div className="kv-list">{PRE_ROWS.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{maskVal(k, v)}</b></div>)}</div>
              </Card>
              <div className="cta-stack"><div className="button-ai" ref={doneChipRef}>{PRE_CHIP}</div></div>
            </div>
          )}
          {variant('journey') === 'off' ? (
          <Card className={`plans flatable altcard-${variant('altcard')}`} innerRef={usageCardRef}>
            <div className="alt-cards" style={{ '--i': 0 }}>{ALT_CARDS.map((_, i) => <PlanCard key={i} idx={i} sel={applied && i === planIdx} style={{ '--i': i }} />)}</div>
            <div className="plan-all" ref={allRef} style={{ '--i': 1 }}><span>전체보기</span></div>
          </Card>
          ) : (
          /* J-1 세로 리스트 카드 — 요금제는 이름·설명·월 가격 한 줄씩, 할인은 뒤의 독립 턴으로 뺐다 */
          <Card className="plans plan-picks" innerRef={usageCardRef}>
            <h3 className="pp-title">{PLAN_PICK_TITLE}</h3>
            {[0, 1, 2].map((i) => <PlanPickRow key={i} idx={i} rec={i === 0} sel={applied && i === planIdx} style={{ '--i': i }} />)}
            <div className="plan-all" ref={allRef} style={{ '--i': 3 }}><span>{PLAN_ALL}</span></div>
          </Card>
          )}
          {/* 요금제 선택이 끝나면 카드가 접히고 이 요약 줄이 남는다 (Figma ixGPs9 261:117032 마지막 프레임) */}
          <div className="plan-fold at-card" ref={foldCardRef}><span className="lbl">{foldLbl}</span><b>{planName}</b><em>{FOLD_REDO}</em></div>

          {/* 5번 끝: 요금제를 적용하면 곧바로 할인 방법이 이어진다 (Figma 435:177019). 위약금 질문이 이 위에서 끼어든다 */}
          <div className="dis" ref={disRef}>
            <AiMessage>{DISC_MSG}</AiMessage>
            <Card className="plans flatable disc-list">
              {DISC_LIST.map(([n, amt, d], i) => <DiscRow key={n} name={n} amt={amt} desc={d} style={{ '--i': i }} />)}
            </Card>
          </div>

          {/* 6번: 끼어든 질문 — 말풍선 + 타이틀(27:12503) → 안내(27:12538) → 안내 2·3 + 요금제·할인 재제시 카드(27:26848) */}
          <div className="pen" ref={penRef}>
            <UserMessage>{PENALTY_Q}</UserMessage>
            <Opening className="fifth" status="위약금 조회 중" title={<>발생할 수 있는 위약금을<br />조회하고 있어요</>} />
            {/* 답은 이 한 줄만 — '이어서 할인 방법을 선택할까요?' 와 할인 안내 말풍선은 걷었다 (사용자 2026-09-16 "이것만"). 재제시 카드가 바로 이어진다 */}
            <AiMessage>{PEN_ANSWER[0]}</AiMessage>
            <Card className="plans flatable disc-list" innerRef={plansCardRef}>
              {DISC_LIST.map(([n, amt, d], i) => <DiscRow key={n} name={n} amt={amt} desc={d} sel={discPick === i} style={{ '--i': i }} />)}
            </Card>
            {/* 6→7: 할인 방법을 고르면 이 재출력 카드도 요약 줄로 접힌다 (Figma ixGPs9 271:125825) */}
            <div className="pen-fold-host" ref={penFoldRef}>
              {/* 스텝 6 카드는 할인 방법 3행이므로 남는 줄도 '선택한 할인방법 · 공통지원금' (사용자 2026-09-16). 요금제 줄은 A2·A3 에서만 두 번째로 */}
              <div className="plan-fold pf-1"><span className="lbl">{DISC_FOLD}</span><b>{DISC_LIST[discPick >= 0 ? discPick : DISC_PICK][0]}</b><em>{FOLD_REDO}</em></div>
              <div className="plan-fold pf-2"><span className="lbl">선택한 요금제</span><b>{planName}</b><em>{FOLD_REDO}</em></div>
            </div>
          </div>
          {/* F-3: 접힌 뒤 대화 맨 아래에 재출력되는 요약 줄 */}
          <div className="plan-fold at-tail" ref={foldTailRef}><span className="lbl">{foldLbl}</span><b>{foldPlanName}</b><em>{FOLD_REDO}</em></div>

          {/* 7~9번: 옵션 순차 선택 (Figma 26:31995 → 26:33289). 추천은 안내문 + '추천' 배지로만, 선택은 포인터 탭 */}
          <div className="opts" ref={optsRef}>
            {OPTS.map((o, i) => (
              <div className="opt-turn" key={i}>
                <Thinking />
                <AiMessage>{Array.isArray(o.msg) ? o.msg.map((l, k) => <span key={k}>{k > 0 && <br />}{l}</span>) : o.msg}</AiMessage>
                {o.msg2 ? <AiMessage>{o.msg2}</AiMessage> : <AiMessage className="none" />}
                <Card className="plans flatable opt-card">
                  {o.rows.map(([n, d, r], j) => (
                    <PlanRow key={j} name={n} desc={d || undefined} price={r} sel={optPick[i] === j} icon={!!o.ico} style={{ '--i': j }}>
                      {o.plus > j && <i className="row-plus" aria-hidden />}
                    </PlanRow>
                  ))}
                </Card>
                {/* 고르면 이 줄로 접힌다 (Figma ixGPs9 271:126718 — 모든 옵션 턴 공통 규칙) */}
                <div className="plan-fold opt-fold"><span className="lbl">선택한 {o.sum}</span><b>{optPick[i] >= 0 ? [o.rows[optPick[i]][0], o.rows[optPick[i]][2]].filter(Boolean).join(' ') : ''}</b><em>{FOLD_REDO}</em></div>
              </div>
            ))}
            <div className="opt-turn done">
              <Thinking />
              <AiMessage>{DONE_MSG}</AiMessage>
              <AiMessage>{DONE_MSG2}</AiMessage>
              <div className="cta-stack"><div className="button-ai" ref={mode === 'an2' ? undefined : doneChipRef}>{DONE_CHIP}</div></div>
            </div>
          </div>
          {/* 스텝 9 재선택 결과 (Figma ixGPs9 271:124668): 위 블록은 비활성으로 남고 아래에 변경 안내 + 새 요약 줄이 붙는다 */}
          <div className="replan-out" ref={replanOutRef}>
            <AiMessage>요금제가 {planName}에서 {POP_PLANS[REPLAN_PICK].name}으로 변경되었어요.</AiMessage>
            {/* Figma 250:154093 은 이 줄의 라벨이 '선택한 요금제' — 위 줄(선택됨)과 달리 바꾼 결과를 다시 이름 붙여 준다 */}
            <div className="plan-fold at-new" ref={foldNewRef}><span className="lbl">선택한 요금제</span><b>{POP_PLANS[REPLAN_PICK].name}</b><em>{FOLD_REDO}</em></div>
            {/* 끝맺음 (html[data-replanend]) — E2 에서만 보이는 한 마디 */}
            <AiMessage className="re-ask">{REPLAN_ASK}</AiMessage>
            <div className="cta-stack re-cta"><div className="button-ai" ref={reChipRef}>{DONE_CHIP}</div></div>
          </div>

          {/* 10번: 신청서 작성 시작 — 말풍선 → 개인정보 Alert (Figma 51:37984). 입력은 화면 하단의 신청서 AI 바텀시트에서 */}
          {inForm ? (
            /* 1안 바닥 플로우 (Figma 360:79418 → 360:79371): 조회 → 가입자 정보 카드 → [신청서 작성하기] → 말풍선 → 안내 2줄 + Alert → 주민등록번호 카드 */
            <div className="form fin" ref={formRef}>
              <Opening className="lookup" status={LOOKUP_STATUS} title={<>{LOOKUP_TITLE[0]}<br />{LOOKUP_TITLE[1]}</>} />
              <AiMessage>{LOOKUP_ASK[0]}<br />{LOOKUP_ASK[1]}</AiMessage>
              <Card className="review-card lookup-card">
                <h3>가입자 정보</h3>
                <div className="kv-list">{LOOKUP_ROWS.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{maskVal(k, v)}</b></div>)}</div>
              </Card>
              <div className="cta-stack"><div className="button-ai" ref={lookupChipRef}>{LOOKUP_CHIP}</div></div>
              <UserMessage>{DONE_CHIP}</UserMessage>
              <AiMessage>{FIN_START}</AiMessage>
              <AiMessage>{FIN_GUIDE}</AiMessage>
              <div className="alert form-alert"><b><i>i</i>{FORM_ALERT[0]}</b><p>{FORM_ALERT[1]}</p></div>
              <Card className="form-card fin-card">
                <h3>{FIN_LABEL[0]}</h3>
                <div className="fs-slot"><FsField fv={fv} ffocus={ffocus} k="rrn" ph={FORM_PH} /></div>
              </Card>
            </div>
          ) : (
          <div className="form" ref={formRef}>
            <UserMessage>{mode === 'an2' ? PRE_CHIP : DONE_CHIP}</UserMessage>
            <div className="alert form-alert"><b><i>i</i>{FORM_ALERT[0]}</b><p>{FORM_ALERT[1]}</p></div>
          </div>
          )}
          {inForm && <>
            {/* 11번: 주민등록번호 완료 선 → 안내 → 주소 카드 (Figma 360:79547) */}
            <div className="addr fin" ref={finAddrRef}>
              <FinDone label={FIN_LABEL[0]} value={fv.rrn} line={FIN_DONE[0]} />
              <AiMessage>{FIN_NEXT[0][0]}<br />{FIN_NEXT[0][1]}</AiMessage>
              <Card className="form-card fin-card">
                <h3>{FIN_LABEL[1]}</h3>
                <div className="fs-slot">
                <div className="input-row"><FsField fv={fv} ffocus={ffocus} k="zip" ph="우편번호" /><div className="input-btn" data-f="zipbtn">검색</div></div>
                <FsField fv={fv} ffocus={ffocus} k="line" ph="상세 주소" />
                <FsField fv={fv} ffocus={ffocus} k="detail" ph="상세 주소" />
                <div className={`fs-chk ${fv.chk ? 'on' : ''}`} data-f="chk"><i className="ck" /><span>{ADDR_CHK}</span><i className="chev r" /></div>
                </div>
              </Card>
            </div>
            {/* 12번: 주소 완료 선 → 이메일 카드 → 이메일 완료 선 → 개통 시 연락받을 번호 카드 (Figma 360:79595 → 360:79648) */}
            <div className="contact fin" ref={finContactRef}>
              <FinDone label={FIN_LABEL[1]} value={`${ADDR_LINE} ${ADDR_DETAIL}`} line={FIN_DONE[1]} />
              <AiMessage>{FIN_NEXT[1][0]}<br />{FIN_NEXT[1][1]}</AiMessage>
              <Card className="form-card fin-card">
                <h3>{FIN_LABEL[2]}</h3>
                <div className="fs-slot"><FsField fv={fv} ffocus={ffocus} k="email" ph={EMAIL_PH} /></div>
              </Card>
              <FinDone label={FIN_LABEL[2]} value={EMAIL} line={FIN_DONE[2]} />
              <AiMessage>{FIN_NEXT[2][0]}<br />{FIN_NEXT[2][1]}</AiMessage>
              <Card className="form-card fin-card">
                <h3>{FIN_LABEL[3]}</h3>
                <div className="fs-slot"><FsField fv={fv} ffocus={ffocus} k="phone" ph={PHONE_PH} /></div>
              </Card>
            </div>
          </>}

          {/* 13번: 시트 닫힘 → Alert 자리에 안내 + 완료 선(재입력) → 안내 2 → 신청서 카드 → [개통 이어가기] (52:62418)
              1안 바닥(B1)에서는 마지막 완료 선 → 안내 → 신청서 카드 → [개통 이어가기] 로 줄어든다 (Figma 360:84406) */}
          <div className={`review ${inForm ? 'fin' : ''}`} ref={reviewRef}>
            {!inForm && <Thinking />}
            {inForm
              ? <FinDone label={FIN_LABEL[3]} value={PHONE} line={FIN_DONE[3]} />
              : <AnswerBubble pairs={[[FSHEETS[0], fv.rrn ? fv.rrn.replace(/●/g, '*') : ''], [FSHEETS[1], `${ADDR_LINE} ${ADDR_DETAIL}`], [FSHEETS[2], fv.email || EMAIL], [FSHEETS[3], fv.phone || PHONE]].map(([q, a]) => [q.replace(/\.$/, ''), a])} />}   {/* 2안: 시트 4장의 질문·답이 한 말풍선에 (Figma ixGPs9 545:163804, 사용자 2026-09-16) — 주민등록번호만 마스킹 */}
            <AiMessage>{REVIEW_MSG}</AiMessage>
            <Card className="review-card">
              <h3>신청서</h3>
              <div className="kv-list">{REVIEW_ROWS.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{reviewMasked ? <>{maskField(k, v)}<IcoEye /></> : v}</b></div>)}</div>
            </Card>
            {/* W-2: 카드가 접힌 자리에 남는 줄 */}
            <div className="plan-fold review-fold" ref={reviewFoldRef}><span className="lbl">작성한 신청서</span><b>{REVIEW_ROWS[0][1]} · {PHONE}</b><em>다시 보기</em></div>
            <div className="cta-stack"><div className="button-ai" ref={reviewChipRef}>{REVIEW_CHIP}</div></div>
          </div>

          {/* 13번: 본인 인증 → 밖으로 → 복귀 → 신원 인증 (10906:5561 → 5614) */}
          <div className="auth" ref={authRef}>
            <UserMessage>{REVIEW_CHIP}</UserMessage>
            <Thinking />
            <AiMessage>{AUTH_MSG1}</AiMessage>
            <div className="done-line"><i className="chk" /><span>{AUTH_DONE}</span><em /></div>
            <AiMessage>{AUTH_MSG2}</AiMessage>
          </div>

          {/* 14번: 신원 인증 완료 → 요금 납부 방식 → 요금안내서 → 결제 안내 (10906:5737). 추천은 문장으로, 선택은 탭 */}
          {mode === 'an2' ? (
          <div className="pay pay2" ref={payRef}>
            <div className="done-line"><i className="chk" /><span>{PAY_DONE}</span><em /></div>
            <Thinking />
            <AiMessage>{P2_MSGS[0]}</AiMessage>
            <AiMessage>{P2_MSGS[1]}</AiMessage>
            {/* 시트 [네/아니요] 를 고른 결과 = 질문/답 말풍선 (Figma ixGPs9 230:92732, 사용자 2026-09-11). 2안의 다른 시트 결과와 같은 표현 */}
            <div className="p2-result">{p2pick >= 0 && <AnswerBubble q={P2_SHEET_A.title} a={P2_SHEET_A.rows[p2pick]} />}</div>
            <AiMessage>{P2_MSGS[2]}</AiMessage>
            <div className="done-line"><i className="chk" /><span>{P2_DONE}</span><em /></div>
            <AiMessage>{P2_MSGS[3]}</AiMessage>
            <AiMessage>{P2_MSGS[4]}</AiMessage>
          </div>
          ) : inForm ? (
            /* 1안 바닥 납부 (Figma 366:105450 → 366:105730) */
            <div className="pay fin" ref={payRef}>
              <div className="done-line"><i className="chk" /><span>{PAY_DONE}</span><em /></div>
              <Thinking />
              <AiMessage>{P2_MSGS[0]}</AiMessage>
              <AiMessage>{P2_MSGS[1]}</AiMessage>
              <AiMessage>{PAY1_ASK}</AiMessage>
              <Card className="plans flatable pay-ask">
                {PAY1_ROWS.map((t, i) => <PlanRow key={t} name={t} sel={p2pick === i} style={{ '--i': i }} />)}
              </Card>
              <div className="plan-fold at-new"><span className="lbl">{PAY1_FOLD}</span><b>{PAY1_ROWS[Math.max(p2pick, 0)]}</b><em>{FOLD_REDO}</em></div>
              <AiMessage>{PAY1_NEED}</AiMessage>
              <Card className="form-card fin-card">
                <h3>{PAY1_LABEL}</h3>
                <div className="fs-slot"><FsField fv={fv} ffocus={ffocus} k="p2phone" ph={PHONE_PH} /></div>
              </Card>
              <FinDone label={PAY1_LABEL} value={PHONE} line={PAY1_LINE} />
              <div className="done-line"><i className="chk" /><span>{PAY1_CHK}</span><em /></div>
              <AiMessage>{PAY1_AFTER[0]}</AiMessage>
              <AiMessage>{PAY1_AFTER[1]}</AiMessage>
            </div>
          ) : (
          <div className="pay" ref={payRef}>
            <div className="done-line"><i className="chk" /><span>{PAY_DONE}</span><em /></div>
            <Thinking />
            <AiMessage>{PAY_MSGS[0]}</AiMessage>
            <AiMessage>{PAY_MSGS[1]}</AiMessage>
            <Card className="plans flatable pay-card">
              <div className={`plan-row keep ${payPick ? 'sel' : ''}`} ref={payKeepRef} style={{ '--i': 0 }}>
                <div className="top"><span className="name">{PAY_KEEP.title}</span></div>
                <div className="kv-list">{PAY_KEEP.rows.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v.split('\n').map((l, i) => <Fragment key={i}>{i > 0 && <br />}{l}</Fragment>)}</b></div>)}</div>
              </div>
              {PAY_LINKS.map((t, i) => <div className="plan-row link" key={t} style={{ '--i': i + 1 }}><div className="top"><span className="name">{t}</span><i className="arrow" /></div></div>)}
            </Card>
            <AiMessage>{PAY_MSGS[2]}</AiMessage>
            <div className="bill-grid">{BILLS.map((t, i) => <div className={`bill ${billPick === i ? 'sel' : ''}`} key={t} ref={i === 0 ? billRef : undefined} style={{ '--i': i }}>{t}</div>)}</div>
            <AiMessage>{PAY_MSGS[3]}</AiMessage>
          </div>
          )}
        </div>
        {/* 마지막 카드/칩 ↔ SearchAi 30px. 카드 축소 중엔 임시로 늘려 스크롤 튐 방지 */}
        <div ref={tailRef} style={{ height: TAIL, flex: 'none' }} />
      </div>

      <div className="bottom-fade" aria-hidden />
      <div className="kb-scrim" aria-hidden />
      {/* 9번 시안용: G-2 스크롤 인디케이터 · G-3 앵커 칩 */}
      <div className="scroll-ind" ref={scrollIndRef} aria-hidden><i /></div>
      <div className="jump-chip" ref={jumpChipRef} aria-hidden>{CHIP_UP}</div>
      <SearchAi innerRef={searchRef} value={penTyped} caret={penTyping} style={{ bottom: kbOpen ? SEARCH_BOTTOM_KB : SEARCH_BOTTOM }} />
      <Keyboard slide open={kbOpen} />
      {/* K-3: 키패드 위 입력 바 (필드 승격). 값은 카드의 필드와 같은 상태를 공유 */}
      <div className={`kb-field-bar ${kbField && variant('kbfield') === 'K3' ? 'on' : ''}`} aria-hidden>
        <span className="lbl">{FORM_LABEL}</span>
        <span className={fv.rrn ? 'val' : 'ph'}>{fv.rrn || FORM_PH}</span><i className="caret" />
      </div>
      <HomeIndicator />

      {/* 7번: 전체 요금제 바텀시트 — Figma 12067:30027 */}
      {/* 5번: 전체 요금제 풀페이지 팝업 (Figma 88:83221 → 88:83232): 상태바 · 앱바(제목 + ×) · TabScroll · ListProductHorizontal 4장 · BottomGroup(선택한 요금제 + 적용하기) */}
      <div className="sheet" ref={sheetRef}>
        <StatusBar className="pop-status" />
        <div className="appbar"><h3>요금제를 선택해주세요</h3><i className="x" /></div>
        {/* 재선택(스텝 7) 에서만: 요금제를 바꾸면 뒤 선택이 초기화된다는 안내 띠 (Figma 271:126019) */}
        {warnBar && <div className="warn-bar">요금제를 변경하면 이후 선택한 항목이 모두 초기화돼요</div>}
        <div className="tabs">{SHEET_TABS.map((t, i) => <span className={i === sheetTab ? 'on' : ''} key={t}>{t}</span>)}</div>
        <div className="list" key={sheetTab}>
          {(sheetTab === 1 ? POP_PLANS_LIGHT : POP_PLANS).map((pl, i) => (
            <div className={`plan-mini ${selPlan === i && sheetTab === 0 ? 'sel' : ''}`} key={pl.name}>
              <div className="pc-head">
                <div className="pc-text">
                  <div className="pc-name">{pl.name}</div>
                  <div className="pc-price"><b>{pl.price}</b><span>/월</span></div>
                  <div className="pc-caps">{pl.caps.map((t, k) => <span key={t}>{k > 0 && <i />}{t}</span>)}{pl.more && <span className="more">{pl.more}</span>}</div>
                </div>
                <div className="pc-thumb"><img src="/screens/pd2/plan-thumb.png" alt="" /><em>무제한</em></div>
              </div>
              <BenefitBadges />
            </div>
          ))}
        </div>
        <div className="ft">
          <div className="row"><span>선택한 요금제</span><b>{selPlan >= 0 ? POP_PLANS[selPlan].name : ''}</b></div>
          <div className={`apply ${selPlan >= 0 && !(warnBar && selPlan === 0) ? 'ready' : ''}`} ref={applyRef}>적용하기</div>
        </div>
        {/* 변경 확인 모달 (Figma 271:126019 마지막 프레임) */}
        <div className={`confirm-pop ${confirmPop ? 'on' : ''}`} aria-hidden={!confirmPop}>
          <div className="cp-box">
            <h4>요금제를 변경하시겠어요?</h4>
            <p>요금제를 변경하면 이후 Agent와 대화하며 선택한 항목이 모두 초기화돼요.</p>
            <div className="cp-btns"><span className="no" ref={confirmNoRef}>아니오</span><span className="yes" ref={confirmRef}>네</span></div>
          </div>
        </div>
      </div>
      {/* 13번: AI 바텀시트 (AiAgentBottomSheet · 글라스) — 1 본인인증 6개 / 2 신원인증 3개. X-2 에서는 시트 안이 토스 화면으로 */}
      {/* 신청서 2/4 주소 — [검색] → 주소 검색 풀페이지 팝업 (Figma 210:122423: 178:87323 검색 → 174:86299 결과). 상태바 · 앱바(주소를 검색해주세요 + ×) · Search 353×46 · TextProductGroup 64h ×8 · 키패드 */}
      <div className={`sheet zip ${zipPop ? 'on' : ''}`} aria-hidden={!zipPop}>
        <StatusBar className="pop-status" />
        <div className="appbar"><h3>주소를 검색해주세요</h3><i className="x" /></div>
        <div className={`zip-search ${zipQ ? 'filled' : ''}`}><span>{zipQ || '주소'}</span>{zipPop && !zipList && <i className="caret" />}<i className={zipQ ? 'clr' : 'mag'} /></div>
        <div className="zip-list">
          {zipList && ZIP_RESULTS.map((r, i) => (
            <div className="zip-item" key={i} style={{ '--i': i }}><small>{r.zip}</small><b>{r.road}</b><span><em>지번</em>{r.jibun}</span></div>
          ))}
        </div>
      </div>
      <div className={`ai-sheet-dim ${authSheet || fsheet || p2sheet ? 'on' : ''} ${fsheet || p2sheet ? 'deep' : ''}`} aria-hidden />
      {/* 10~12번: 신청서 입력 AI 바텀시트 (AiAgentBottomSheet 61:38454 / 52:58702 / 52:60548 / 52:61515) — ‹ n/4 › × · 타이틀 · 입력 · [다음]. 키패드가 열리면 시트가 키패드 위로 (52:58030) */}
      <div className={`ai-sheet fs ${fsheet ? 'on' : ''} ${fsOut ? 'out' : ''} ${fpeek && !fsheet ? 'peek' : ''} ${kbOpen && fsheet ? 'kb' : ''}`} ref={fsheetRef}>
        <div className="fs-wrap" ref={fsWrapRef}>
        {fsShow > 0 && (
          <div className="fs-body" key={fsShow}>
            {mode === 'an2'
              ? <div className="fs-top hd"><h3>{FSHEETS[fsShow - 1].replace(/\.$/, '')}</h3><i className="x" /></div>   /* 2안: 페이저 없음 — 타이틀과 × 가 같은 줄 (Figma 90:101338, 사용자 2026-09-08) */
              : <>
                <div className="fs-top">
                  <div className="pager"><i className={`chev l ${fsShow === 1 ? 'dim' : ''}`} /><b>{fsShow}</b><span>/ {FSHEETS.length}</span><i className="chev r" /></div>
                  <i className="x" />
                </div>
                <h3>{FSHEETS[fsShow - 1]}</h3>
              </>}
            <div className="fs-slot">
              {fsShow === 1 && <FsField fv={fv} ffocus={ffocus} k="rrn" ph={FORM_PH} />}
              {fsShow === 2 && <>
                <div className="input-row"><FsField fv={fv} ffocus={ffocus} k="zip" ph="우편번호" /><div className="input-btn" data-f="zipbtn">검색</div></div>
                <FsField fv={fv} ffocus={ffocus} k="line" ph="상세 주소" />
                <FsField fv={fv} ffocus={ffocus} k="detail" ph="상세 주소" />
                <div className={`fs-chk ${fv.chk ? 'on' : ''}`} data-f="chk"><i className="ck" /><span>{ADDR_CHK}</span><i className="chev r" /></div>
              </>}
              {fsShow === 3 && <FsField fv={fv} ffocus={ffocus} k="email" ph={EMAIL_PH} />}
              {fsShow === 4 && <FsField fv={fv} ffocus={ffocus} k="phone" ph={PHONE_PH} />}
            </div>
            {mode === 'an2' ? (
              /* 2안 (Figma 90:101338): 진행 ‹ n / 4 › 가 [다음] 왼쪽 같은 줄에, 버튼은 brand-solid(비활성 30%) */
              <div className="fs-foot">
                <div className="pager"><i className={`chev l ${fsShow === 1 ? 'dim' : ''}`} /><b>{fsShow}</b><span>/ {FSHEETS.length}</span><i className={`chev r ${fsShow === FSHEETS.length ? 'dim' : ''}`} /></div>
                {/* 마지막 장은 [완료] — 화살표 없음 (사용자 2026-09-16, 1-1 · 1-2 일괄) */}
                <div className={`fs-next brand ${fsReady ? 'on' : ''}`} data-f="next">{fsShow === FSHEETS.length ? '완료' : <>다음<i className="chev r" /></>}</div>
              </div>
            ) : (
              <div className={`fs-next ${fsReady ? 'on' : ''}`} data-f="next">{fsShow === FSHEETS.length ? '완료' : <>다음<i className="chev r" /></>}</div>
            )}
          </div>
        )}
        </div>
      </div>
      {[AUTH_SHEET1, AUTH_SHEET2, AUTH_SHEET3].map((sh, n) => (
        <div className={`ai-sheet ${authSheet === n + 1 ? 'on' : ''} ${authOut === n + 1 ? 'out' : ''} ${n === 0 && sheetToss ? 'toss-mode' : ''}`} key={n}>
          {n === 0 && sheetToss
            ? <TossPane done={false} inline />
            : <>
              <div className="hd"><div><h3>{sh.title}</h3>{sh.desc && <p>{sh.desc}</p>}</div><i className="x" /></div>
              <div className="items">{sh.items.map((t, i) => <div className="ai-sheet-item" key={t} ref={n === 0 && i === EXT_PICK ? tossItemRef : undefined}>{t}</div>)}</div>
              {sh.alert !== false && <div className="alert"><b><i>i</i>{AUTH_ALERT[0]}</b><p>{AUTH_ALERT[1]}</p></div>}
            </>}
        </div>
      ))}
      {/* 밖(토스 본인인증) 화면 — html[data-ext] X1 슬라이드 / X3 페이드 */}
      <div className={`ext ${variant('ext')} ${ext ? 'in' : ''}`} aria-hidden><TossPane done={ext === 'done'} kind={extKind} /></div>
      <div className={`ext-banner ${extBanner ? 'on' : ''}`} aria-hidden>✓ 본인인증이 완료되어 돌아왔어요</div>
      {mode === 'an2' && (<>
        {/* 2안 납부 시트 A: 요금을 함께 납부하시겠어요? (Figma 90:92843) */}
        <div className={`ai-sheet p2a ${p2sheet === 1 ? 'on' : ''} ${p2Out === 1 ? 'out' : ''}`}>
          <div className="hd"><div><h3>{P2_SHEET_A.title}</h3></div><i className="x" /></div>
          <div className="rows">{P2_SHEET_A.rows.map((t, i) => <PlanRow key={t} name={t} sel={p2pick === i} />)}</div>
        </div>
        {/* 2안 납부 시트 B: 사용 중인 번호로 인증 (90:98954 → 90:103732) — 번호 → [다음] → 인증번호 + 타이머 → [다음] */}
        <div className={`ai-sheet fs p2 ${p2sheet === 2 ? 'on' : ''} ${p2Out === 2 ? 'out' : ''} ${kbOpen && p2sheet === 2 ? 'kb' : ''}`}>
          <div className="fs-body" key={p2step}>
            {/* 타이틀과 × 는 같은 줄 (Figma ixGPs9 229:89619, 사용자 2026-09-11) — 신청서 시트 .fs-top.hd 와 같은 헤더 */}
            <div className="fs-top hd"><h3>{P2_SHEET_B}</h3><i className="x" /></div>
            <div className="fs-slot">
              {p2step === 1 ? <FsField fv={fv} ffocus={ffocus} k="p2phone" ph={PHONE_PH} /> : (
                <div className={`input-field fs-field ${fv.p2code ? 'filled on' : ''}`} data-f="p2code"><span className={fv.p2code ? 'val' : 'ph'}>{fv.p2code || '인증번호 6자리'}</span><em className="p2-timer">00:59</em></div>
              )}
            </div>
            <div className="fs-foot"><span /><div className={`fs-next brand ${(p2step === 1 ? fv.p2phone === PHONE : fv.p2code === P2_CODE) ? 'on' : ''}`} data-f="next">다음<i className="chev r" /></div></div>
          </div>
        </div>
      </>)}
      <div ref={ptrLayerRef} aria-hidden />
    </div>
  )
}
// 토스 본인인증 목업: 진행 중(점 3개) → 완료(체크). inline = 시트 안 미니 버전(X-2)
export function TossPane({ done, inline = false, kind = 'toss' }) {
  const id = kind === 'id'   // 14번: 실물 신분증 촬영 (외부 인증 화면)
  if (kind === 'pay') return (   // 15번: 결제 외부 화면 (Figma 10906:6338 은 '외부이동' 자리표시 → 실제 결제 페이지처럼 구성, 사용자 요청 2026-09-07)
    <div className="payout">
      <div className="pd-status"><span>9:41</span><img src="/icons/status_right.svg" alt="" /></div>
      <div className="appbar"><b>결제</b><i className="x" /></div>
      <div className="po-body">
        <section>
          <h4>주문 상품</h4>
          <div className="po-item"><i className="thumb" /><div><b>갤럭시 Z 폴드8</b><span>512G · 그라파이트 · 기기변경</span><span>5GX 프라임 플러스 · 선택약정 24개월</span></div></div>
        </section>
        <section>
          <h4>결제 금액</h4>
          <div className="po-kv"><span>휴대폰 가격</span><b>1,738,000원</b></div>
          <div className="po-kv"><span>공통지원금</span><b>-450,000원</b></div>
          <div className="po-kv"><span>휴대폰 구매 할인 쿠폰</span><b>-30,000원</b></div>
          <div className="po-kv total"><span>할부원금 (24개월)</span><b>1,258,000원</b></div>
          <div className="po-kv sub"><span>월 납부 예상</span><b>52,417원 <em>+ 통신요금 99,000원</em></b></div>
        </section>
        <section>
          <h4>결제 수단</h4>
          <div className="po-methods">
            <div className="po-m sel"><i className="radio" /><span>신용·체크카드</span><small>삼성 TL는 혜택카드 · 무이자 24개월</small></div>
            <div className="po-m"><i className="radio" /><span>간편결제</span><small>토스페이 · 네이버페이 · 카카오페이</small></div>
            <div className="po-m"><i className="radio" /><span>계좌이체</span></div>
          </div>
        </section>
        <section className="agree">
          <div className="po-check"><i className="cb on" /><span>결제 정보 및 할부 조건을 확인했으며 결제에 동의합니다</span></div>
          <div className="po-check"><i className="cb on" /><span>개인정보 제3자 제공 동의 (카드사)</span></div>
        </section>
      </div>
      <div className="po-bottom"><div className="po-btn">1,258,000원 결제하기</div></div>
    </div>
  )
  return (
    <div className={`toss ${inline ? 'inline' : ''} ${done ? 'done' : ''} ${id ? 'idcam' : ''}`}>
      <div className="toss-logo">{id ? '신분증 촬영' : 'toss'}</div>
      <div className="toss-body">
        <div className="toss-ring"><i /></div>
        <b>{id ? (done ? '신원인증이 완료되었어요' : '신분증을 확인하고 있어요') : (done ? '본인인증이 완료되었어요' : '본인인증을 진행하고 있어요')}</b>
        <p>{done ? 'SKT 로 돌아갑니다' : id ? '촬영한 신분증의 정보를 대조 중이에요' : '휴대폰 번호와 생년월일을 확인 중이에요'}</p>
      </div>
    </div>
  )
}

// 2안(AgentChat2) 이 같은 언어를 쓰도록 공유하는 조각들
export { PlanPickRow, UsageGraph, AnswerBubble, reveal, showNow, unreveal, hideOpening, rv, collapseOpening, anchorBottom, UserMessage, AiMessage, Opening, Thinking, Card, PlanRow, BenefitBadges, POP_PLANS, POP_PLANS_LIGHT, SHEET_TABS, TAIL, CHIP_DEFAULT }
