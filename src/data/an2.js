// 2안(Agent + 바텀시트) 마지막 턴의 문구 — AgentChat2(스텝 8) 와 AgentChat(스텝 9~, 2안 이력 표시) 가 함께 쓴다. import 순환을 피하려고 여기 둔다
export const PRE_MSG = '필요한 옵션 선택이 모두 완료되었어요.'   // 두 말풍선으로 나눠 순차 출력 (사용자 2026-09-16)
export const PRE_MSG_B = '휴대폰 개통을 이어가려면 신청서 작성을 위한 가입자 정보 확인이 필요한데, 먼저 조회해볼게요.'
export const PRE_MSG2 = ['가입자 정보를 확인해주세요.', '앞에서 확인한 정보가 맞다면 가입자 정보를 입력해주세요.']
export const PRE_ROWS = [['가입자 이름', '김하경'], ['휴대폰 번호', '010-9292-9292']]
export const PRE_CHIP = '신청서 작성하기'
// 스텝 8 마지막 시트(추가 혜택)의 질문·답 — 스텝 9 첫 화면 맨 위 말풍선
export const LAST_Q = '추가로 받을 수 있는 혜택이 있어요.'
export const LAST_A = 'T 안심보상'
