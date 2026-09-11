import { useEffect, useState, useCallback, useRef } from 'react'
import data from './data/steps.json'
import proposalsData from './data/proposals.json'
import Phone from './components/Phone.jsx'
import { CONFIRMED } from './lib/variants.js'
import { SCREEN_H, SCREEN_W, BASE_W, BASE_H, MAX_FILL_W as MAX_W, MFIT, MWIDTH, MS as MS0 } from './lib/screen.js'

const { zones, persona } = data
/* 1·2·3안 (prompt 파일, 2026-09-07): 3안 = 현재 구현(steps.json). 1·2안은 UI 준비 중 → 자리표시 스텝(placeholder 뷰)으로 구조만 보여준다.
   웹 셸 시안 html[data-web]: WA 상단 탭 / WB 좌측 패널 계층 / WC 3안 나란히 비교 */
// 1·2안 스텝 → 플레이어 스텝. ref: 3안 스텝을 그대로 빌려옴 / view: 실제 UI 가 있는 스텝 / 그 외: 자리표시
const stepOf = (p, st) => {
  if (st.ref) return { ...data.steps.find((s3) => s3.id === st.ref), ...(st.view ? { view: st.view } : {}), id: st.id }
  if (st.view) return { ...st, zone: st.zone || 'shop', utterance: st.utterance ?? null, utteranceNote: st.note, purpose: st.purpose || [p.concept, p.example] }
  return { ...st, zone: 'agent', utterance: null, utteranceNote: st.note, purpose: [p.concept, p.example], view: { type: 'placeholder', pid: p.id, title: p.short, screen: st.screen, note: st.note, status: p.status } }
}
const PROPOSALS = proposalsData.proposals.map((p) => p.id === 3 ? { ...p, steps: data.steps, phases: data.phases } : { ...p, steps: p.steps.map((st) => stepOf(p, st)) })
const scOf = (pid) => PROPOSALS.find((p) => p.id === pid) || PROPOSALS[2]
// 아래 헬퍼들은 현재 시나리오(sc)에 대해 동작하도록 함수형으로
const stepIdxIn = (sc, id) => sc.steps.findIndex((s) => s.id === id)
const phaseOfIn = (sc, i) => sc.phases.findIndex((p) => p.steps.includes(sc.steps[i].id))
// W-B 세부 시안 (html[data-wb]) — 왼쪽 패널에서 '안' 층을 어떻게 놓을지
const WBS = [
  { id: 'B1', label: 'B-1 세그먼트 + 개념 카드', desc: '패널 맨 위에 1안·2안·3안 세그먼트 필. 그 아래 고른 안의 개념 카드(제목·개념·상태) 한 장, 그 밑에 단계·스텝. 위계는 얕고 패널이 짧다' },
  { id: 'B2', label: 'B-2 사이드 레일', desc: '패널 왼쪽에 좁은 레일(Slack 워크스페이스 식). 1·2·3 숫자 타일이 세로로 서 있고 고른 타일이 패널과 이어진다. 패널 안은 안 제목·개념 헤더 + 단계·스텝. 안 전환과 스텝 이동이 공간으로 분리' },
  { id: 'B3', label: 'B-3 아코디언 트리', desc: '한 패널에 1·2·3안이 접히는 섹션으로 쌓이고, 고른 안만 펼쳐져 개념 → 단계 → 스텝이 안으로 들여 이어진다. 접힌 안엔 스텝 수만. 안 → 단계 → 스텝이 완전한 한 나무' },
]
function AnPanel({ wb, pid, pick, sc, cur, go }) {
  const p = sc
  if (wb === 'B2') return (
    <div className="wb2" aria-label="안 · 스텝">
      <nav className="rail">
        {PROPOSALS.map((q) => <button key={q.id} className={q.id === pid ? 'on' : ''} onClick={() => pick(q.id)} title={q.title}><b>{q.id}</b><span>{q.short}</span></button>)}
      </nav>
      <aside className="rnav1">
        <div className="head an-head"><span className="num">{p.id}안 · {p.status}</span><b>{p.title}</b><span>{p.concept}</span></div>
        <PhaseList sc={sc} cur={cur} go={go} />
      </aside>
    </div>
  )
  if (wb === 'B3') return (
    <aside className="rnav1 wb3" aria-label="안 · 스텝">
      <ol className="an-tree">
        {PROPOSALS.map((q) => { const on = q.id === pid; return (
          <li key={q.id} className={on ? 'on' : ''}>
            <button className="an-row" onClick={() => pick(q.id)} aria-expanded={on}>
              <span className="num">{q.id}</span><span className="tt"><b>{q.title}</b><small>{q.status} · {q.steps.length} 스텝</small></span><i className="chev" />
            </button>
            {on && <div className="an-body"><p>{q.concept}</p><PhaseList sc={sc} cur={cur} go={go} /></div>}
          </li>
        ) })}
      </ol>
    </aside>
  )
  // B1
  return (
    <aside className="rnav1 wb1" aria-label="안 · 스텝">
      <div className="seg">{PROPOSALS.map((q) => <button key={q.id} className={q.id === pid ? 'on' : ''} onClick={() => pick(q.id)}>{q.id}안</button>)}</div>
      <div className="concept"><span className="num">{p.status} · {p.steps.length} 스텝</span><b>{p.title}</b><p>{p.concept}</p></div>
      <PhaseList sc={sc} cur={cur} go={go} />
    </aside>
  )
}
// 마지막 스텝이 끝나면 1.5s 뒤 뜨는 완료 토스트 (Figma ixGPs9 26:40069 · 51:23693 형식). 1·2·3안 공통. 탭하면 다음 안의 첫 스텝으로(3안이면 1안으로)
const DONE_DELAY = 1500
function DoneToast({ show, onNext }) {
  return (
    <button className={`done-toast ${show ? 'on' : ''}`} onClick={onNext} aria-hidden={!show}>
      <span className="row"><b>프로토타이핑이 완료되었습니다.</b><i className="chev" /></span>
      <small>다음 테스트로 넘어가시려면 눌러주세요.</small>
    </button>
  )
}
const WEBS = [
  { id: 'WA', label: 'W-A 상단 탭', desc: '헤더 아래 1·2·3안 세그먼트 탭. 탭마다 제목 + 한 줄 개념. 고르면 왼쪽 스텝퍼·폰·목적 카드가 그 안의 것으로 바뀐다. 한 번에 한 안만 보되 전환이 가장 빠름' },
  { id: 'WB', label: 'W-B 좌측 패널 계층', desc: '기존 왼쪽 스텝퍼 위에 "안" 층을 하나 더 둔다. 3개의 안 카드가 쌓여 있고 고른 안만 펼쳐져 단계·스텝이 아래로 이어진다. 안 → 단계 → 스텝 한 나무로 읽힘' },
  { id: 'WC', label: 'W-C 나란히 비교', desc: '폰 3대를 나란히(0.62 배) 두고 같은 스텝 번호를 함께 넘긴다. 각 폰 위에 안 이름, 아래에 그 안의 스텝명. 폰을 클릭하면 그 안만 크게 보는 단일 모드로' },
]
const LAB = import.meta.env.VITE_LAB === '1'
const Q0 = new URLSearchParams(location.search)
const SHOW_ALL = LAB && Q0.get('lab') === 'all'   // 확정된 시안 그룹까지 모두 보기
/* 위치 복원 (2026-09-10). 브라우저(Chrome 메모리 절약·Safari)가 백그라운드 탭을 정리한 뒤 다시 로드하면 페이지 상태가 모두 사라진다.
   → 안·스텝을 URL(?step=) 과 sessionStorage 에 항상 기록하고, 재로드로 돌아온 경우 <html data-restored="1"> 을 세워 화면들이
   재생 대신 최종 상태(reducedMotion() 경로)로 바로 앉게 한다. 플래그는 사용자가 다음 이동을 하는 순간 지운다 */
const POS_KEY = 'asp.pos'
const readPos = () => { try { return JSON.parse(sessionStorage.getItem(POS_KEY)) || null } catch { return null } }
const savePos = (pid, step) => { try { sessionStorage.setItem(POS_KEY, JSON.stringify({ pid, step })) } catch {} }
const NAV_TYPE = performance.getEntriesByType?.('navigation')?.[0]?.type
const RETURNED = NAV_TYPE === 'reload' || NAV_TYPE === 'back_forward' || document.wasDiscarded === true || !!readPos()
if (RETURNED) document.documentElement.dataset.restored = '1'
const userNav = () => { delete document.documentElement.dataset.restored }   // 사용자가 직접 이동 → 이후 스텝은 정상 재생
/* 모바일 셸 (2026-09-10, 사용자: "핸드폰으로도 보고 싶다 · iPhone 13 mini 375×812 기준 · 반응형"). 별도 Vercel 프로젝트 prototype-aiagent-shop-phone 는 VITE_MOBILE=1 로 항상 이 셸,
   본 사이트도 뷰포트 폭 ≤ 700 이면 이 셸로 바뀐다. 폰 화면(393×852)을 뷰포트에 맞춰 scale — 375 폭이면 0.954, 812 높이에 꼭 들어간다.
   셸 시안 html[data-mshell] (?m=): M1 미니멀(상단 알약 + 좌우 탭 존) / M2 상단 세그먼트 + 하단 바 / M3 하단 플로팅 알약 (기본) */
const FORCE_MOBILE = import.meta.env.VITE_MOBILE === '1'
// 폰 도메인은 사용자가 직접 탭해서 진행 (2026-09-10 "내가 click 하게끔"). ?tap=auto 로 자동 재생 비교
// 2026-09-10 후반: 사용자 "터쳐블하게 하니까 더 애매" → 폰 도메인 기본은 **자동 재생 플로우**(스텝도 자동으로 이어짐). ?tap=user 로 탭 모드 비교
document.documentElement.dataset.tapmode = Q0.get('tap') === 'user' ? 'user' : 'auto'
const AUTOPLAY = FORCE_MOBILE && Q0.get('tap') !== 'user' && Q0.get('auto') !== '0'   // 스텝 끝(포인터 대기) 1.5s 뒤 다음 스텝. 대기가 없는 스텝은 화면이 4.5s 멈추면
const MOBILE_Q = '(max-width: 700px)'
const MSHELLS = [
  { id: 'M0', label: 'M-0 풀페이지', desc: '컨트롤 없음. 폰 폭에 맞춰 화면만. 옆으로 밀거나 좌우 가장자리를 탭해 스텝 이동, 상단 가운데(상태바 자리)를 탭하면 안·스텝·목적 시트' },
  { id: 'M3', label: 'M-3 하단 알약', desc: '아래 76px 띠에 알약 하나: ‹  1안 · 2/6 색상 질의  ›. 폰 화면을 가리지 않는다(0.9x). 가운데를 누르면 안·스텝·목적 시트' },
  { id: 'M1', label: 'M-1 미니멀', desc: '화면 위 상단에 작은 알약(1안 · 2/6)만. 화면 좌우 가장자리를 탭하거나 옆으로 밀어 스텝 이동. 알약을 누르면 시트' },
  { id: 'M2', label: 'M-2 상단 세그먼트 + 하단 바', desc: '위에 1안·2안·3안 세그먼트와 스텝 제목, 아래에 ← STEP 2/6 → 와 [목적]. 컨트롤이 항상 보이는 대신 화면이 조금 작아진다(0.8x)' },
]
// 첫 렌더 전에 <html data-*> 를 채운다 — 자식(AgentChat) effect 가 부모 effect 보다 먼저 돌아 최종 상태 계산 때 값이 비어 있지 않도록
Object.assign(document.documentElement.dataset, CONFIRMED, { kbdemo: LAB && Q0.get('kb') === '1' ? '1' : '0', launch: (LAB && Q0.get('l')) || CONFIRMED.launch, disp: (LAB && Q0.get('d')) || CONFIRMED.disp, flat: (LAB && Q0.get('f')) || CONFIRMED.flat, altcard: (LAB && Q0.get('a')) || CONFIRMED.altcard, altcopy: (LAB && Q0.get('c')) || CONFIRMED.altcopy, pd: LAB ? (Q0.get('pd') || 'new') : CONFIRMED.pd, pdflow: (LAB && Q0.get('p')) || CONFIRMED.pdflow, cardsel: (LAB && Q0.get('s')) || CONFIRMED.cardsel, stream: (LAB && Q0.get('z')) || CONFIRMED.stream, think: (LAB && Q0.get('w')) || CONFIRMED.think, fill: (LAB && Q0.get('i')) || CONFIRMED.fill, kbfield: (LAB && Q0.get('k')) || CONFIRMED.kbfield, follow: (LAB && Q0.get('f2')) || CONFIRMED.follow, ext: (LAB && Q0.get('x')) || CONFIRMED.ext, line: (LAB && Q0.get('ln')) || CONFIRMED.line, fsh: (LAB && Q0.get('fs')) || CONFIRMED.fsh, fsm: (LAB && Q0.get('fm')) || CONFIRMED.fsm, dim: (LAB && Q0.get('dm')) || CONFIRMED.dim, sheetgap: (LAB && Q0.get('sg')) || CONFIRMED.sheetgap, s2cover: (LAB && Q0.get('cv')) || CONFIRMED.s2cover, tmorph: (LAB && Q0.get('tm')) || CONFIRMED.tmorph, pdscroll: (LAB && Q0.get('ds')) || CONFIRMED.pdscroll, sheetfx: (LAB && Q0.get('sf')) || CONFIRMED.sheetfx, sheetout: (LAB && Q0.get('so')) || CONFIRMED.sheetout, ctxfx: (LAB && Q0.get('h')) || CONFIRMED.ctxfx, hdrfade: (LAB && Q0.get('hf')) || CONFIRMED.hdrfade, aihint: (LAB && Q0.get('ah')) || CONFIRMED.aihint, aidim: (LAB && Q0.get('ad')) || CONFIRMED.aidim, ambient: (LAB && Q0.get('am')) || CONFIRMED.ambient, zippop: (LAB && Q0.get('zp')) || CONFIRMED.zippop, recflow: (LAB && Q0.get('rf')) || CONFIRMED.recflow, knob: (LAB && Q0.get('kn')) || CONFIRMED.knob, knobtime: (LAB && Q0.get('kt')) || CONFIRMED.knobtime, simx: (LAB && Q0.get('sx')) || CONFIRMED.simx, dimfx: (LAB && Q0.get('df')) || CONFIRMED.dimfx, pdenter: (LAB && Q0.get('pe')) || CONFIRMED.pdenter, sheetlook: (LAB && Q0.get('sl')) || CONFIRMED.sheetlook, planfold: LAB ? (Q0.get('pf') || 'B1') : CONFIRMED.planfold, foldsync: LAB ? (Q0.get('fy') || 'T2') : CONFIRMED.foldsync })
// 상단 고정 헤더 배경 페이드 (html[data-hdrfade]). 헤더 171px = 상태바 59 + 앱바 48 + 컨텍스트 47
const HDRFADES = [   // 2차 (사용자: 51:26203 컨텍스트 헤더까지는 안정감 있게) — 헤더 171px 구간은 유지, 그 아래 꼬리가 사라짐
  { id: 'G4', label: 'G-4 fill 유지 + 꼬리 32px', desc: '헤더 끝(171px)까지 basement 100% 그대로. 그 아래 32px 꼬리에서 100 → 0%. 블러 없음, 가장 단순' },
  { id: 'G5', label: 'G-5 85% + 블러 20 + 꼬리 40px', desc: '상태바·앱바 100%, 컨텍스트 헤더 구간 100 → 85% 위에 backdrop blur 20. 아래 40px 꼬리에서 색과 블러가 함께 사라짐. 헤더 뒤 채팅이 흐릿하게만 비침' },
  { id: 'G6', label: 'G-6 70% + 블러 30 + 꼬리 56px', desc: '상태바만 100%, 앱바부터 헤더 끝까지 100 → 70% + blur 30. 아래 56px 긴 꼬리. 가장 유리 같은 느낌' },
]
// 컨텍스트 헤더 k/n 변화 시안 (html[data-ctxfx]) — AgentShell ContextHeader. 값은 '적용(전송)' 시점에만 바뀜
const CTXFXS = [   // M-3(스파클 펄스)이 좋지만 경박함 → 회전·색 변화 빼고 작고 느리게 (사용자 2026-09-07)
  { id: 'M3a', label: 'M-3a 잔잔한 펄스', desc: '✦가 1 → 1.12 → 1 로 한 번 숨 쉬듯 커지고(0.6s), 숫자·옵션명은 페이드로만 바뀜. 회전·색 변화 없음' },
  { id: 'M3b', label: 'M-3b 글로우', desc: '✦ 뒤로 옅은 블루 글로우가 한 번 번지고 사라짐(0.9s). 아이콘 자체는 움직이지 않음. 텍스트는 페이드' },
  { id: 'M3c', label: 'M-3c 느린 반짝', desc: '✦가 0.8s 동안 1/4 바퀴만 돌며 살짝(1.08) 커지고, 숫자만 롤(0.5s). 원안의 반 바퀴·1.5x 팝·색 변화를 모두 줄임' },
]
// 업무처리 결과 선 그려지는 방식 시안 (html[data-line])
// 신청서 시트 높이 변화 시안 (html[data-fsh]) — 스텝 10~13. 시트 4장의 높이가 달라(주민번호 262 · 주소 ~470) 윗선이 튀는 문제
const FSHS = [
  { id: 'H1', label: 'H-1 높이 트윈', desc: '시트는 바닥에 붙어 있고, 내용이 바뀔 때 높이가 0.45s 동안 부드럽게 늘고 준다(내용은 크로스페이드). 윗선이 미끄러지듯 움직임' },
  { id: 'H2', label: 'H-2 고정 높이', desc: '시트 높이를 가장 큰 장(주소)에 맞춰 고정. 짧은 장은 위쪽에 내용, [다음]은 항상 같은 자리. 윗선이 전혀 움직이지 않음' },
  { id: 'H3', label: 'H-3 내려갔다 올라오기', desc: '[다음]을 누르면 시트가 바닥으로 내려가 사라지고(0.35s), 새 장이 새 높이로 다시 올라온다(0.45s). 한 장씩 넘기는 느낌' },
]
// 1안 T+ 버튼 → 입력창(SearchAi) 모핑 시안 (html[data-tmorph]) — ProductDetail1. 스텝 2~4 에서 세 번 반복
const TMORPHS = [
  { id: 'T1', label: 'T-1 늘어나기', desc: 'T+ 원이 제자리에서 가로로 353px 까지 늘어나면서 동시에 키패드 위로 올라간다(0.5s, 한 호흡). 아이콘이 줄어들며 사라지고 ✦ + 입력 텍스트가 이어 뜬다. 닫힐 때는 반대로 줄어들어 T+ 로' },
  { id: 'T2', label: 'T-2 올라가서 펴지기', desc: '원이 먼저 키패드와 함께 올라가고(0.38s), 자리에 닿은 뒤 옆으로 펴진다(0.4s). 두 박자라 "부른다 → 말한다" 가 나눠 읽힌다. 전송 뒤 내려올 때는 펴진 채로 내려온다' },
  { id: 'T3', label: 'T-3 CTA 와 합쳐지기', desc: '[옵션 선택하기] 버튼이 왼쪽으로 접혀 들어가며 흰 유리로 바뀌고, T+ 원이 그 자리를 채워 하나의 입력창이 된다(0.5s) → 이어서 키패드와 함께 올라감. 하단 그룹 전체가 입력창으로 변하는 느낌. 닫힐 때 입력창이 줄고 CTA 가 오른쪽으로 다시 펴진다' },
]
// 1안 상품 상세 아래로 스크롤 제스처 시안 (html[data-pdscroll]) — ProductDetail1 swipeTo. 위로는 H-3 그대로
const PDSCROLLS = [
  { id: 'D1', label: 'D-1 엄지 튕기기', desc: '짧은 플릭을 여러 번. 한 번에 약 380px — 손가락이 0.28s 동안 150px 만 빠르게 올라가고 콘텐츠는 관성으로 0.7s 미끄러진다. 사람이 훑어 내리는 리듬, 거리가 길면 플릭 수가 늘어남' },
  { id: 'D2', label: 'D-2 천천히 끌기', desc: '위로 올라갈 때(H-3)의 대칭. 손가락이 화면을 잡고 1:1 로 천천히 끌어 내려온다(0.9~1.5s). 관성 없이 손가락이 멈추는 곳에 멈추고, 마지막에 14px 넘겼다 되돌아오는 고무줄 안착. 살피며 내려가는 느낌' },
  { id: 'D3', label: 'D-3 손가락 없이 팬', desc: '손가락 제스처 없이 페이지만 3안 C-3 곡선(휙 출발 긴 안착, 600px/s)으로 내려간다. 스크롤 인디케이터만 보임. 가장 깔끔하지만 사람이 조작하는 느낌은 약함' },
]
// 바텀 모달 등장 모션 시안 (html[data-sheetfx]) — 2안 .sheet2 + 2·3안 .ai-sheet 공통. 1차 S0~S3(출발 빠름) → 2차 R1~R3(출발 느리게), R-2 확정
const SHEETFXS = [
  { id: 'S0', label: 'S-0 처음', desc: '0.5s quint-out. 빠르게 튀어 올라와 멈춤 — "쓕"' },
  { id: 'S2', label: 'S-2 딤 먼저, 두 박자', desc: '딤 0.3s 먼저 → 0.2s 뒤 시트 0.6s' },
  { id: 'S3', label: 'S-3 스프링 안착 + 내용 페이드', desc: '0.7s 살짝 넘겼다 안착, 내용은 0.28s 뒤 떠오름' },
  { id: 'S1', label: 'S-1 현재 (길게 감속)', desc: '0.8s expo-out. 첫 프레임에 이미 절반쯤 와 있어 "쑈옹" 하고 튀어 오르는 느낌' },
  { id: 'R1', label: 'R-1 부드러운 출발 (sine in-out)', desc: '0.7s 동안 천천히 출발 → 중간에 가장 빠르고 → 천천히 멈춤. 가속·감속이 대칭이라 손으로 밀어 올린 듯 차분함. 딤 0.6s' },
  { id: 'R2', label: 'R-2 느린 출발 + 긴 안착', desc: '0.9s. 출발은 R-1 보다 더 느리고 안착 꼬리는 길다(cubic-bezier .4,0,.15,1). 가장 무겁고 고급스러운 질감, 대신 가장 오래 걸림' },
  { id: 'R3', label: 'R-3 딤 먼저 → 느린 출발', desc: '딤이 0.35s 먼저 깔리고 0.15s 뒤 시트가 0.8s 에 느리게 출발해 올라온다. 대화가 물러나는 예고 뒤 시트가 따라와 급발진 느낌이 가장 적음' },
]
// 시트 내려가기 시안 (html[data-sheetout]) — 2안 모달 + 2·3안 AI 바텀시트. 공통: 내려가는 동안 내용 유지
const SHEETOUTS = [
  { id: 'X1', label: 'X-1 통째로 내려가기', desc: '내용을 그대로 담은 채 올라올 때와 같은 곡선(0.8s 느린 출발·긴 안착)으로 내려간다. 높이 변화 없음. 대칭이라 가장 예측 가능' },
  { id: 'X2', label: 'X-2 제자리 디졸브', desc: '멀리 내려가지 않고 24px 만 내려가며 0.45s 에 페이드아웃. 딤도 함께 사라짐. 선택이 끝나 "닫힌다" 보다 "사라진다" 느낌, 가장 빠르고 조용함' },
  { id: 'X3', label: 'X-3 두 박자', desc: '안의 내용이 0.15s 먼저 사라지고, 빈 시트가 0.6s 에 내려간다. 신청서 시트 높이 변화(M-3 두 박자)와 같은 리듬. 대신 빈 판이 잠깐 보임' },
]
// H-1 높이 트윈의 모션감 시안 (html[data-fsm])
// 2안 상단 앵커링 + 대화창을 덮는 모달 (html[data-s2cover]) — Figma 90:86712
const S2COVERS = [
  { id: 'on', label: '켬 (상단 앵커 + 아래 20px 시트)', desc: '새 턴은 채팅 시작선(199)에 상단 앵커. 시트(높이 그대로)는 화면 아래 20px 에 앉아 SearchAi 를 덮고, 그 위 8px 에 ∨ 버튼' },
  { id: 'off', label: '기존 (하단 앵커 + SearchAi 위)', desc: '비교용. 3안과 같은 하단 앵커, 시트는 SearchAi 위 10px, G-1 밀기' },
]
// 2안 시트 올라올 때 마지막 안내문 위치 (html[data-sheetgap]) — 기존은 SearchAi 위 30px 에 둔 채 시트가 덮었다
const SHEETGAPS = [
  { id: 'G1', label: 'G-1 함께 밀기', desc: '시트가 올라오는 0.9s R-2 곡선 그대로 채팅도 같은 박자로 올라가, 안내문 하단이 시트 상단 위 20px 에 멈춘다. 한 동작으로 읽힘' },
  { id: 'G2', label: 'G-2 먼저 자리 잡기', desc: '채팅이 0.45s 로 먼저 올라가 자리를 비우고 → 0.1s → 시트가 올라온다. 두 박자, 시트가 빈자리에 들어오는 느낌' },
  { id: 'G3', label: 'G-3 시트가 밀어 올리기', desc: '시트가 올라오다 상단이 안내문 하단 + 20px 에 닿는 순간부터 안내문을 물리적으로 밀고 올라간다. 접촉 전까지 채팅은 멈춰 있음' },
  { id: 'G0', label: 'G-0 기존 (덮임)', desc: '비교용. 안내문은 SearchAi 위 30px 에 그대로, 시트가 그 위를 덮는다' },
]
// 2안 바텀시트 딤 농도 (html[data-dim]) — 기존 42%
const DIMS = [
  { id: 'A1', label: 'A-1 32%', desc: '42 → 32%. 뒤 대화가 또렷해지되 시트가 여전히 확실히 앞에 있음' },
  { id: 'A2', label: 'A-2 26%', desc: '42 → 26%. 3안 신청서 시트(38%)보다 연하고 3안 인증 시트(22%)와 비슷한 무게' },
  { id: 'A3', label: 'A-3 20%', desc: '42 → 20%. 가장 연함. 뒤 대화를 계속 읽을 수 있는 정도 — 시트가 살짝 뜬 느낌' },
]
const FSMS = [
  { id: 'M1', label: 'M-1 부드러운 감속', desc: '높이 0.45s quint-out(키패드와 같은 곡선), 내용은 제자리 페이드. 지금까지 본 것' },
  { id: 'M2', label: 'M-2 스프링 안착', desc: '높이가 0.6s 동안 목표를 살짝(3%) 넘겼다 되돌아와 안착, 새 내용은 10px 아래서 같은 스프링으로 올라옴. 시트 첫 상승도 같은 곡선' },
  { id: 'M3', label: 'M-3 두 박자', desc: '옛 내용이 먼저 사라지고(0.15s) → 빈 시트가 높이만 바꾸고(0.4s in-out) → 새 내용이 아래서 떠오름(0.35s). 숨 고르는 리듬' },
]
// 1안 AI 추천 표시 시안 (html[data-aihint]) — ProductDetail1. 사용자 2026-09-10: 칩은 컴포넌트마다 자리가 달라 한계 → selected 보다 낮은 위계의 그레이 라인·그림자가 '우웅' 거리며
const AIHINTS = [
  { id: 'R1', label: 'R-1 숨 쉬는 그림자', desc: '칩 없음. 추천 항목에 얇은 회색 라인이 생기고 그림자가 1.8s 주기로 커졌다 작아진다. 스와치·행·카드 어디든 그림자 하나로 같은 언어. 가장 조용함' },
  { id: 'R2', label: 'R-2 은은한 링', desc: '칩 없음. 1px 회색 라인 바깥으로 옅은 빛의 링이 물결처럼 퍼져 사라지기를 반복(1.7s). "여기" 를 가리키는 힘이 가장 크지만 계속 움직임' },
  { id: 'R3', label: 'R-3 떠오름 + 미니 배지', desc: '항목이 2~5px 떠서 천천히 부유하고 그림자가 따라간다(2.4s). 우상단에 Figma 검정 미니 배지 [AI 추천](11px). 배지는 남기되 작게, 위계는 그림자가 만든다' },
  { id: 'B0', label: 'B-0 기존 (파란 칩)', desc: '비교용. 파란 [AI 추천] 칩 + 파란 테두리' },
]
// 1안 Agent 호출 시 하단 그라데이션 딤 (html[data-aidim]) — Figma T1mhl 11751:9847 하단 340px 투명 → 브랜드 블루
const AIDIMS = [
  { id: 'D1', label: 'D-1 브랜드 그라데이션 340', desc: 'Figma 그대로. 화면 아래 340px 이 투명 → 브랜드 블루 55% 로 물든다. T+ 를 누르는 순간부터 스트립이 닫힐 때까지. 페이지 위 · 입력창·스트립·키패드 아래' },
  { id: 'D2', label: 'D-2 뉴트럴 그림자 300', desc: '색 없이 검정 0 → 30%. 화면 아래가 어두워져 스트립이 떠 보이는 그림자 느낌. 흑백 검토 모드에서도 같은 인상' },
  { id: 'D3', label: 'D-3 브랜드 + 안개 300', desc: '브랜드 그라데이션에 blur 6 안개가 겹쳐 아래쪽 페이지가 흐려진다. 3안 L-2(블러 딤)와 같은 계열의 "물러남"' },
  { id: 'D0', label: 'D-0 없음 (기존)', desc: '비교용' },
]
// 1안 Ambient Layer 시안 (html[data-ambient]) — Figma ixGPs9 209:100824 (색상·용량·요금제 세 케이스) + 90:132452 → 90:136843 (카드가 SearchAi 위로 스택)
const AMBIENTS = [
  { id: 'A1', label: 'A-1 Figma 기본 · 한 줄은 참고, T+ 로 질문', desc: 'Figma 209:117730 흐름 그대로. 섹션에 1.5s 머무르면 Bottom Group 이 위로 자라며 ✦ 그라데이션 한 줄 + [적용하기] 가 들어온다(알약 "1,684,000원부터" 도 함께). 줄은 참고만 — 포인터는 T+ 를 탭해 질문을 타이핑하고, 그 순간 줄은 그룹과 함께 사라진다. 답 카드는 SearchAi 뒤에서 올라와 12px 위에 스택. 선택 뒤 그룹이 돌아오고 알약 금액이 갱신된다' },
  { id: 'A2', label: 'A-2 [적용하기] 지름길', desc: '같은 한 줄이지만 포인터가 [적용하기] 를 탭한다. 키패드·타이핑 없이 그 문장이 SearchAi 안으로 들어가고 카드가 바로 올라와 스택. 한 줄이 "질문을 대신 써 둔 것" 으로 읽힘 — 가장 빠르지만 T+ 질의 장면이 사라진다' },
  { id: 'A3', label: 'A-3 떠 있는 칩 → 펼침', desc: '그룹 높이는 그대로. 알약 자리에 참고 문장 칩(글라스 · ›)이 떠오른다. 칩 탭 → 칩 자리에서 카드로 펼쳐지고(scale .6 → 1) 아래에 SearchAi 가 문장을 받는다. 페이지가 가장 조용하지만 Figma Bottom Group 구조와는 다름' },
  { id: 'off', label: '기존 (Ambient 없음)', desc: '비교용. 참고 문장·알약 없이 T+ 탭 → 키패드 → 질문 타이핑 → 카드' },
]
// 신청서 2/4 주소 [검색] → 주소 검색 풀페이지 팝업 등장 시안 (html[data-zippop], Figma ixGPs9 210:122423) — 2·3안 공통 (AgentChat)
const ZIPPOPS = [
  { id: 'Z1', label: 'Z-1 아래서 올라옴', desc: '흰 풀페이지가 아래에서 0.5s 올라와 화면을 덮는다(요금제 전체보기 팝업 §8 과 같은 언어). 키패드는 팝업 위로 이어서 올라오고, 결과 행을 탭하면 같은 길로 내려가며 시트에 우편번호·주소가 채워진다' },
  { id: 'Z2', label: 'Z-2 오른쪽에서', desc: '앱 화면 전환처럼 오른쪽에서 0.45s 슬라이드 인(토스 본인인증 X-1 과 같은 언어). "검색은 다른 화면" 이라는 느낌이 가장 분명함' },
  { id: 'Z3', label: 'Z-3 시트에서 자라남', desc: '시트 자리에서 팝업이 확대(0.92 → 1)되며 위 모서리 28 → 0 으로 펴져 풀페이지가 된다. 시트가 커진 것으로 읽혀 연속성은 가장 좋지만 움직임이 하나 더 있음' },
]
// 2안 스텝 4 추천 흐름 시안 (html[data-recflow], Figma ixGPs9 210:124536)
const RECFLOWS = [
  { id: 'P1', label: 'P-1 Figma 그대로 · 카드 유지', desc: '추천 문장 뒤 대화 안에 추천 요금제 카드가 뜨고, 모달은 "추천된 요금제를 선택하실래요?" [네 / 다른 요금제 살펴보기] 두 줄. [다른 요금제 살펴보기] → 모달 내려감 → 전체 요금제 풀팝업 → 라이트 탭 둘러보기 → 첫 카드 → [적용하기] → 결과 말풍선. 카드는 대화에 그대로 남는다(위로 스크롤하면 보임)' },
  { id: 'P2', label: 'P-2 적용 뒤 카드 접힘', desc: '같은 흐름. 팝업이 내려가는 순간 대화 안 추천 카드가 접혀 사라지고(0.45s) 결과 말풍선이 그 자리를 이어받는다. 대화에 "요금제" 흔적이 말풍선 하나로만 남아 가장 가벼움 (3안 위약금 Y-1 접힘과 같은 언어)' },
  { id: 'P3', label: 'P-3 카드에 선택 테두리', desc: '같은 흐름. 적용 순간 대화 안 추천 카드에 2px 검정 테두리(S-1)가 들어오고 그 아래 결과 말풍선. 추천과 최종 선택이 같았음이 카드에서 바로 읽힌다 — 다만 카드와 말풍선이 같은 사실을 두 번 말함' },
  { id: 'old', label: '기존 (모달 안 카드 + 전체보기)', desc: '비교용. 추천 카드가 모달 안에 있고 [전체보기] 버튼으로 팝업' },
]
// 2안 ∨ 플로팅 (html[data-knob], Figma ixGPs9 210:122678): 모달이 직전 응답(추천 카드·안내문)을 가리면 시트 위 12px 에 44px ∨ — 누르면?
const KNOBS = [
  { id: 'K1', label: 'K-1 채팅이 내려감', desc: 'Figma 화살표 뜻 그대로. ∨ 탭 → 시트는 그대로, 채팅이 팬(0.6s)되어 가려진 응답 하단이 시트 위 30px 에 온다 → ∨ 사라짐. 시트·응답이 동시에 보이는 상태로 선택. 가장 단순' },
  { id: 'K2', label: 'K-2 시트가 접힘', desc: '∨ 탭 → 시트가 제목 한 줄만 남기고 내려가(0.9s R-2) 뒤의 응답이 그대로 보인다. ∨ 는 ∧ 로 바뀌어 접힌 시트 위로 따라 내려오고, 다시 누르면 시트가 올라와 선택. 응답을 온전히 읽는 대신 두 번 누름' },
  { id: 'K3', label: 'K-3 시트가 잠깐 비켜줌', desc: '∨ 탭 → 시트가 화면 밖으로 내려가고 채팅이 응답을 보여준 뒤 1.2s 후 시트가 스스로 돌아온다. 한 번의 탭으로 끝나지만 시트가 스스로 움직임(사용자 취향: 튀는 모션 비선호 — 검토 필요)' },
  { id: 'off', label: '없음 (기존)', desc: '비교용. 가려진 채로 진행' },
]
// ∨ 등장 타이밍 (html[data-knobtime]) — 사용자 2026-09-10: "문단 다 뜨고 모달 뜨고, 거의 동시에 아래 포인터도"
const KNOBTIMES = [
  { id: 'T0', label: 'T-0 카드가 바닥에 닿을 때부터 → 시트와 함께', desc: '사용자 지시. 추천 카드가 화면 아래쪽(SearchAi 위 선)에 걸치는 순간 SearchAi 위 12px 에 ∨ 가 먼저 뜬다 → 모달이 올라오면 ∨ 가 같은 R-2 0.9s 로 시트 위 12px 까지 함께 올라간다 → 탭 → 채팅이 내려감' },
  { id: 'T1', label: 'T-1 시트와 동시', desc: '안내가 끝나고 모달이 올라오기 시작하는 순간 ∨ 도 화면 아래에서 시트와 같은 R-2 0.9s 곡선으로 함께 올라온다. 시트 위 12px 에 붙어 한 덩어리처럼 움직임 — "거의 동시" 그대로' },
  { id: 'T2', label: 'T-2 시트가 앉은 직후', desc: '모달이 0.9s 로 안착한 바로 뒤 ∨ 가 제자리에서 0.3s 페이드업. 시트 → ∨ 두 박자로 읽힘 (지금까지 본 것)' },
  { id: 'T3', label: 'T-3 안착 0.5s 뒤', desc: '모달이 앉고 0.5s 쉰 뒤 ∨ 가 뜬다. "가려졌네" 하고 Agent 가 알려주는 느낌 — 가장 느림' },
]
// 2안 스텝 6 · SIM 시트의 × 를 눌렀을 때 어떻게 돌아오나 (html[data-simx], Figma ixGPs9 234:92897, 사용자 2026-09-11)
const SIMXS = [
  { id: 'S1', label: 'S-1 대화에 칩 (Figma 그대로)', desc: '× 를 누르면 시트가 내려가고 안내문 아래에 [개통 방법 선택하기] 칩이 남는다 → 탭하면 칩이 사라지고 "이어서 진행할게요." 한 줄이 붙은 뒤 시트가 R-2 로 다시 올라온다. 닫았다는 사실과 돌아온 경로가 대화에 남음' },
  { id: 'S2', label: 'S-2 제자리 접힘', desc: '시트가 사라지지 않고 제목 줄 68px 만 남기고 바닥에 접힌다(∨ K-2 와 같은 언어) → 제목 줄을 탭하면 다시 펼쳐진다. 대화에는 아무것도 남지 않고 "잠깐 치워둔" 느낌' },
  { id: 'S3', label: 'S-3 입력창 위 복귀 알약', desc: '시트는 완전히 내려가고 SearchAi 위 12px 에 [개통 방법 선택하기] 알약이 떠 있는다 → 탭하면 시트 복귀. 대화 흐름은 그대로 두고 복귀 수단만 화면에 남기는 방식' },
  { id: 'off', label: '없음 (기존)', desc: '비교용. × 를 누르지 않고 바로 고른다' },
]
// 모달 뒤 딤 (html[data-dimfx], 2·3안 공통) — 사용자 2026-09-11 "전반적인 인터랙션 고민"
const DIMFXS = [
  { id: 'G2', label: 'G-2 모달 영역만 그라디언트', desc: '화면 위쪽은 딤이 전혀 없고 아래로 갈수록 진해져(38% 지점부터 0 → 28%) 모달 주변만 가라앉는다. 대화 윗부분은 그대로 읽히면서 모달이 앞에 있다는 것만 전달됨' },
  { id: 'G1', label: 'G-1 딤 없음', desc: '모달 뒤를 전혀 어둡게 하지 않는다. 시트의 흰 유리와 그림자만으로 층을 구분 — 가장 가볍지만 뒤 내용과 섞여 보일 수 있음' },
  { id: 'G0', label: 'G-0 기존 전면 (지금)', desc: '화면 전체에 균일한 딤. 2안 모달 20% · 3안 22% · 신청서 시트 38%. 모달에 확실히 집중되지만 대화가 통째로 어두워짐' },
]
// 2·3안 상품 상세 → 옵션 영역 진입 (html[data-pdenter]) — 사용자 2026-09-11 "그 버튼 선택 안 하구 그냥 스크롤 쭉 내려서 컬러 영역으로"
const PDENTERS = [
  { id: 'E1', label: 'E-1 바로 지나쳐 색상까지', desc: '[직접 둘러볼게요] 를 누르지 않고 AI 조합 카드를 지나 색상 섹션까지 한 번에 내려간다(1.4s). 버튼은 화면에 그대로 있고 "안 눌러도 그냥 내려가면 된다"가 가장 분명하게 읽힘' },
  { id: 'E2', label: 'E-2 조합 카드를 훑고 지나감', desc: 'AI 조합 카드에서 0.6s 멈춰 한 번 보여준 뒤 색상까지 내려간다. 추천을 보긴 했고 그래도 직접 고르기로 했다는 시간이 생김' },
  { id: 'E3', label: 'E-3 지나치며 조합 카드가 물러남', desc: '내려가는 동안 AI 조합 카드가 흐려지며(45%) 살짝 축소된다. 그 추천을 쓰지 않기로 했다는 것이 화면에 남지만, 시스템이 판단한 것처럼 보일 수도 있음' },
  { id: 'off', label: '없음 (기존)', desc: '비교용. [직접 둘러볼게요] 를 탭하고 들어간다' },
]
// 모달 안 행이 배경과 구분되지 않는 문제 (html[data-sheetlook]) — 사용자 2026-09-11 "미선택 라디오박스 회색 선이 왜 안 보이지 · 전반적으로 그런 룩"
const SHEETLOOKS = [
  { id: 'L2', label: 'L-2 테두리 + 시트를 Figma 농도로', desc: '미선택 행에 2px #EBEEF6 를 되돌리고, 시트 배경을 흰색 92%(2안)·78%(3안) → Figma 값인 흰색 40% + 블러 50 으로 낮춘다. 시트가 뒤 배경을 비쳐 흰 카드가 그 위에 올라앉는다 — Figma 컴포넌트 그대로' },
  { id: 'L1', label: 'L-1 테두리만 복원', desc: '시트 안에서 transparent 로 덮어쓰던 미선택 테두리만 Figma 값(2px #EBEEF6)으로 되돌린다. 시트 농도는 지금 그대로 — 가장 적게 건드리지만 흑백 모드에서는 선이 여전히 옅다' },
  { id: 'L3', label: 'L-3 회색 시트 + 행은 그림자로', desc: '테두리 대신 시트 자체를 옅은 회색 판(94%)으로 바꾸고 흰 행에 얕은 그림자를 준다. 뒤에 무엇이 있든·흑백이든 층이 확실히 갈리지만 유리 느낌은 약해진다' },
  { id: 'off', label: '없음 (지금)', desc: '비교용. 미선택 테두리 없음 + 시트 흰색 92% — 행과 배경이 같은 흰색으로 붙어 보이는 현재 상태' },
]
// 3안 스텝 6 · 요금제 선택 플로우 끝의 접힘 (html[data-planfold], Figma ixGPs9 261:117032) — 사용자 2026-09-11
const PLANFOLDS = [
  { id: 'B1', label: 'B-1 흰 박스로 한 박자 머문 뒤 선택됨', desc: '사용자 2026-09-11 "카드가 줄어들면서 흰색 박스 형태가 되고 그게 다시 선택됨으로". 내용만 먼저 흐려지고 카드가 흰 박스가 되며 요약 줄 높이까지 줄어든다(0.5s) → 빈 흰 박스로 0.22s 머문다 → 회색 "선택됨" 줄로 물들며 글자가 떠오른다(0.45s). 세 박자가 또렷하게 읽힘' },
  { id: 'B2', label: 'B-2 머물지 않고 바로 선택됨', desc: '같은 흐름이지만 빈 흰 박스에서 멈추지 않고 줄어들자마자 곧바로 회색으로 물들며 글자가 떠오른다. 한 동작처럼 이어져 빠릿하지만 "박스가 됐다"는 단계는 약하게 스친다' },
  { id: 'B3', label: 'B-3 흰 박스 그대로 유지', desc: '박스가 회색으로 물들지 않고 흰색 그대로 남고 그 안에 "선택됨"만 떠오른다. 선택된 항목이 흰 카드로 남는 다른 화면들(RadioCard 선택 상태)과 같은 결이지만, 배경이 밝아 대화 흐름에서 덜 물러나 보임' },
  { id: 'S1', label: 'S-1 한 호흡', desc: '카드가 요약 줄 높이까지 줄어들면서 함께 흐려진다(0.55s, cubic in-out) → 높이가 같아진 지점에서 갈아끼우고 → "선택됨" 줄이 0.25s 로 떠오른다. 멈춤 없이 한 호흡. 자리가 같아진 뒤 바꾸므로 아래 내용이 전혀 튀지 않음' },
  { id: 'S2', label: 'S-2 먼저 흐려지고, 자리가 줄어듦', desc: '카드가 먼저 0.3s 흐려지고(높이는 그대로) → 빈 자리가 0.4s 로 요약 줄 높이까지 줄어든 뒤 → 줄이 0.25s 로 떠오른다. "내용이 없어졌다 → 자리를 정리한다" 두 박자로 읽힘' },
  { id: 'S3', label: 'S-3 느린 출발 + 긴 안착', desc: '같은 한 동작이지만 0.8s 로 느리게, quart in-out 으로 시작이 느긋하고 끝이 길게 안착한다. 줄도 0.35s 로 천천히. 요금제를 확정하는 무게가 실림' },
  { id: 'D1', label: 'D-1 페이드아웃 → 그 자리에 [선택됨]', desc: '사용자 2026-09-11 "접히게 하니까 이상한 것 같은데, 걍 페이드아웃되고 거기에 선택됨 뜨게". 카드가 높이를 접지 않고 0.35s 페이드아웃하고, 둘 다 보이지 않는 순간에 자리를 바꾼 뒤(아래 내용이 튀지 않게 스크롤 보정) "선택됨 · 5GX 프라임 플러스 · 다시 선택하기" 줄이 0.3s 페이드인' },
  { id: 'F1', label: 'F-1 접히며 제자리에 요약 줄 (Figma)', desc: '[적용하기] 직후 요금제 카드가 높이 0 으로 접히고(0.5s) 같은 자리에 "선택한 요금제 · 5GX 프라임 · 다시 선택하기" 회색 줄이 함께 페이드 인. Figma 마지막 프레임 그대로 — 한 동작으로 읽힘' },
  { id: 'F2', label: 'F-2 줄이 먼저, 카드가 뒤따라 접힘', desc: '요약 줄이 카드 아래에 먼저 생기고(0.32s) 그 뒤 카드가 접혀 사라진다. "이걸로 정해졌다 → 목록은 치운다" 두 박자로 읽혀 무엇이 무엇으로 바뀌었는지가 분명하다' },
  { id: 'F3', label: 'F-3 접힌 뒤 대화 맨 아래 재출력', desc: '카드는 조용히 접혀 사라지고, 요약 줄은 위약금 답변이 끝난 뒤 대화의 맨 아래에 나타난다. 기존 Y-1(접혀 사라지고 아래에 재출력)과 같은 언어라 대화의 시간 순서가 지켜진다' },
  { id: 'off', label: '없음 (기존)', desc: '비교용. 카드가 그대로 남고 접히지 않는다' },
]
// 3안 스텝 5→6 · 풀팝업 하강과 카드 → 흰 박스 → [선택됨] 의 맞물림 (html[data-foldsync]) — 사용자 2026-09-11 "팝업 내려갈 때 같이 떠야 하지 않나, 매끄럽게 떨어지게"
const FOLDSYNCS = [
  { id: 'T2', label: 'T-2 팝업이 카드를 지나는 순간 시작', desc: '팝업은 위에서부터 걷힌다. 팝업 상단이 요금제 카드 위를 지나 카드가 드러나는 바로 그 순간 변환이 시작된다(하강 곡선에서 역산). 드러나는 것과 변하는 것이 같은 지점에서 만나 가장 매끄럽지만, 카드가 화면 아래쪽이면 시작이 늦다' },
  { id: 'T1', label: 'T-1 팝업과 동시 출발', desc: '팝업이 내려가기 시작하는 순간 카드도 함께 줄어들기 시작한다. 팝업이 다 내려갔을 때는 이미 흰 박스가 되어 있고 곧 "선택됨"으로 물든다. 가장 빠르고 한 동작이지만 변환의 앞부분이 팝업에 가려진다' },
  { id: 'T3', label: 'T-3 팝업이 앉은 직후', desc: '팝업이 완전히 내려간 뒤 0.12s 쉬고 시작한다(지금은 0.6s 대기). 두 동작이 겹치지 않아 각각 또렷하게 보이지만, 그만큼 전체가 길고 "따로따로"로 읽힐 수 있음' },
]
const LINES = [
  { id: 'D1', label: 'D-1 선만 좌→우', desc: '체크와 글은 함께 페이드로 뜨고, 가는 선이 왼콽에서 오른콽으로 0.6s 동안 그려진다. 가장 조용함' },
  { id: 'D2', label: 'D-2 순차', desc: '체크 아이콘이 톡 찍히고(0.35s) → 글이 뜨고 → 선이 그려진다. 세 박자로 결과를 도장 찍듯' },
  { id: 'D3', label: 'D-3 한 붓', desc: '체크 → 글 → 선이 왼쪽 끝에서 하나의 와이프로 이어져 그려진다(1.1s). 붓으로 한 줄 긋는 느낌' },
]
// 스텝 13 토스 본인인증 밖으로 나갔다 오는 시안 (html[data-ext])
const EXTS = [
  { id: 'X1', label: 'X-1 앱 전환 슬라이드', desc: '토스 화면이 오른쪽에서 밀려 들어와 전체를 덮고(0.45s), 진행 → 완료 뒤 오른콽으로 빠지며 돌아온다. iOS 앱 전환 그대로. 돌아오면 시트가 닫혀 있고 "본인 인증 완료" 선이 그어짐' },
  { id: 'X2', label: 'X-2 시트 안에서', desc: '앱을 떠나지 않는다. 바텀시트 안의 목록이 토스 미니 화면(진행 → 완료)으로 바뀌고 끝나면 시트가 내려간다. 맥락 유지가 가장 좋음' },
  { id: 'X3', label: 'X-3 페이드 + 복귀 배너', desc: '화면이 흐려지며 토스로 바뀌고(0.5s), 돌아올 때 위에서 "본인인증이 완료되어 돌아왔어요" 배너가 1.8s 떠서 어디로 돌아왔는지 알려준다' },
]
// 턴 안에서 화면이 따라가는 리듬 시안 (html[data-follow]) — AgentChat follow()
const FOLLOWS = [
  { id: 'F1', label: 'F-1 요소마다 팬', desc: '현재. 생각 점·본문·행이 나올 때마다 화면이 한 번씩 내려간다(거리 기반, 최소 0.6s). 요소 수만큼 멈췄다 가서 끊기는 느낌' },
  { id: 'F2', label: 'F-2 턴 끝에 한 번', desc: '요소들은 제자리에서 차례로 나타나고(화면은 멈춤), 턴의 마지막 요소가 들어온 뒤 한 번만 부드럽게 내려간다. 읽는 동안 화면이 흔들리지 않음' },
  { id: 'F3', label: 'F-3 연속 추적', desc: '카메라가 마지막 요소 하단을 매 프레임 조금씩(10%) 따라간다. 멈춤 없이 미끄러지듯 흘러 내려가고, 위로는 절대 가지 않음' },
]
// 스텝 11 키패드 ↔ 입력 카드 겹침 해결 시안 (html[data-kbfield])
const KBFIELDS = [
  { id: 'K1', label: 'K-1 카드 통째로 위로', desc: '키패드가 올라올 때 카드 전체(제목 + 필드)가 키패드 위 16px 에 오도록 함께 올라간다. SearchAi 는 숨김. 무엇을 입력하는지 카드 제목까지 보인다' },
  { id: 'K2', label: 'K-2 필드만 위로', desc: '필드 하단만 키패드 위 16px 에 맞춘다(이동 최소). 카드 제목은 위로 살짝 잘릴 수 있지만 대화 문맥이 더 남는다' },
  { id: 'K3', label: 'K-3 키패드 위 입력 바', desc: '카드는 제자리(가려져도 됨). 키패드 위에 "주민등록번호" 입력 바가 떠서 거기서 타이핑되고 카드 필드에도 동시에 채워진다. iOS 키패드 액세서리 바 방식' },
]
// 스텝 11 입력 필드 기입 시안 (html[data-fill]) — AgentChat playFill. Figma ixGPs9 26:36595
const FILLS = [
  { id: 'I1', label: 'I-1 키패드 직접 입력', desc: 'Figma 그대로. 필드 탭 → 키패드가 올라오고 카드가 그 위로 따라감 → 숫자가 한 자씩 찍히고 뒷자리는 ●로 마스킹 → 키패드 하강' },
  { id: 'I2', label: 'I-2 Agent 자동 채움', desc: '키패드 없음. 필드 아래 [✦ 인증된 내 정보로 채우기] 칩을 탭하면 값이 한 번에 채워지고 "T 인증 정보" 태그가 붙는다. Agent 가 대신 채워 주는 느낌' },
  { id: 'I3', label: 'I-3 SearchAi 로 입력', desc: '하단 대화 입력창을 탭 → 키패드 → 거기에 타이핑(스텝 6과 같은 리듬) → 전송하면 값이 카드의 필드로 옮겨 감. 입력도 대화의 일부라는 방식' },
]
// 옵션 섹션 본문 등장 시안 (html[data-think]) — AgentChat think()
const THINKS = [
  { id: 'W1', label: 'W-1 점 → 페이드', desc: '점 3개가 0.75s 깜빡인 뒤 사라지고 본문이 페이드로 등장, 0.55s 뒤 행. 지금까지의 N-2 그대로' },
  { id: 'W2', label: 'W-2 점 → 스트리밍', desc: '점 3개 뒤 본문이 단어 단위(42ms)로 흘러나온다. 읽는 속도에 맞춰 문장이 완성되고, 끝나면 행. Agent 가 말하는 느낌이 가장 강함' },
  { id: 'W3', label: 'W-3 짧은 점 → 한 호흡', desc: '점은 0.45s 만 보이고, 본문과 행이 거의 동시에(0.18s 간격) 캐스케이드. 대기감은 남기고 전체 길이는 가장 짧음' },
]
// 스텝 9·11 이어서 옵션 안내 시안 (html[data-stream]) — AgentChat playStream. Figma ixGPs9 29:21972
const STREAMS = [
  { id: 'Z1', label: 'Z-1 턴마다', desc: '섹션 하나가 Agent 턴 하나. 생각 점 → 한 줄 안내("먼저 개통 방식이에요…") → 행 → 팬 → 0.7s → 다음. 대화 리듬은 살지만 8개면 가장 길다' },
  { id: 'Z2', label: 'Z-2 연속 스트림', desc: '첫 안내문 한 번("남은 옵션도 차례로 정리해 드릴게요") 뒤 섹션 제목 + 행이 0.45s 간격으로 쭉 이어지고 팬이 따라간다. 가장 "쭉쭉"' },
  { id: 'Z3', label: 'Z-3 묶음', desc: '개통·사은품 / 보상·보험 / 할인·부가 세 묶음. 묶음 머리글 뒤 섹션들이 짧게 이어지고 묶음 끝에서만 길게 팬. 읽는 단위가 생긴다' },
]
// 요금제 카드 선택 표현 시안 (html[data-cardsel]) — 적용하기 뒤 어느 카드를 골랐는지. Figma ixGPs9 28:18482
const CARDSELS = [
  { id: 'S1', label: 'S-1 검은 테두리', desc: '카드 전체에 2px 검은 테두리. 안의 할인 RadioCard 선택 테두리와 같은 언어라 일관되지만, 테두리가 두 겹으로 보일 수 있다' },
  { id: 'S2', label: 'S-2 배지 전환 + 틴트', desc: '테두리 없이 좌상단 배지가 "선택한 요금제 ✓"(검은 배지)로 바뀌고 카드 배경이 살짝 회색 틴트. 글로 상태를 말해 주는 방식' },
  { id: 'S3', label: 'S-3 나머지 물러남', desc: '선택한 카드는 그대로 두고(그림자만 살짝) 선택되지 않은 카드들이 45% 로 흐려지며 뒤로 물러난다. 캐러셀에서 대비가 가장 크다' },
]
// 상품 상세 v2 (Step 1·2) 자동 시퀀스 시안 (html[data-pdflow]) — ProductDetail2.jsx. LAB 은 기본 new 화면
const PDFLOWS = [
  { id: 'P1', label: 'P-1 직접 둘러보기', desc: '기존 흐름. [직접 둘러볼게요] 탭 → 색상·용량·수령 방법·납부 기간·사용자·가입을 차례로 탭하며 내려가 [요금제를 선택해 주세요]에서 정지, AI 버튼 위 대기' },
  { id: 'P2', label: 'P-2 AI 조합 수락', desc: '상단 AI 조합 카드의 [이 옵션으로 진행할게요] 탭 → 옵션이 한 번에 채워지고(버튼: 옵션이 적용됐어요) 채워진 섹션들을 길게 지나 요금제에서 정지. 요금제 행은 미정·Agent 추천' },
  { id: 'P3', label: 'P-3 중간 아코디언', desc: '색상·용량만 직접 고르고 내려가다 "그간의 가입 이력을 바탕으로…" 아코디언을 탭해 펼침 → 안의 [이 옵션으로 진행할게요] → 나머지 자동 채움 → 요금제 정지' },
]
// [다른 요금제 살펴보기] 결과 컴포넌트 시안 (html[data-altcard]) — Figma ixGPs9 23:11234 ListProductHorizontal 카드를 바닥에
const ALTCARDS = [
  { id: 'A0', label: 'A-0 현재 (RadioCard 5행)', desc: '비교용. 이름·월 요금·한 줄 설명만 있는 행 5개' },
  { id: 'A1', label: 'A-1 카드 가로 캐러셀', desc: 'Figma 그대로. 요금제 카드 3장(배지·가격·캡션·썸네일·혜택·할인 3종)이 옆으로 이어지고 다음 카드가 살짝 보인다. 세로 길이는 카드 1장' },
  { id: 'A2', label: 'A-2 카드 세로 스택', desc: '같은 카드 3장을 대화 흐름대로 위→아래로 쌓는다. 한눈에 다 보이지만 카드 하나가 ~430px 라 세로로 길다' },
  { id: 'A3', label: 'A-3 세로 · 할인 접힘', desc: '세로 스택인데 할인 3종은 접어 두고 요금제 헤더(배지·가격·캡션·혜택)만. 선택된 카드만 할인이 펼쳐진다' },
]
const ALTCOPIES = [
  { id: 'C0', label: 'C-0 현재', desc: '데이터를 무제한으로 이용할 수 있는 요금제들을 추천드려요. 원하는 요금제를 선택해보세요.' },
  { id: 'C1', label: 'C-1 근거 + 함께 선택', desc: '데이터 무제한 요금제 중 하경님 이용 패턴에 맞는 3개를 골랐어요. 요금제와 할인 방법을 함께 선택해 보세요.' },
  { id: 'C2', label: 'C-2 짧게', desc: '무제한 요금제 3개를 추천드려요. 할인 방법까지 한 번에 고를 수 있어요.' },
  { id: 'C3', label: 'C-3 AI PICK 강조', desc: '첫 번째가 하경님 사용량에 가장 잘 맞는 AI PICK이에요. 다른 요금제도 함께 비교해 보세요.' },
]
// 카드 → 바닥 시안 (html[data-flat]) — 요금제 선택(스텝 5)·추가혜택(스텝 7) 리스트를 카드 없이 배경 위에. Figma ixGPs9 15:9564 · 15:10217
const FLATS = [
  { id: 'C0', label: 'C-0 기존 (카드)', desc: '비교용. 요금제 선택·추가혜택 행이 흰 카드(패딩 28) 안에 들어 있고 카드 제목이 있다' },
  { id: 'F1', label: 'F-1 바닥 · 한 덩어리', desc: 'Figma 그대로. 카드·카드 제목 없이 흰 RadioCard 행(간격 4)이 배경 위에 직접 놓이고, 전체보기는 폭 전체 버튼. 리스트 전체가 하나의 컴포넌트로 등장(기존 카드 리듬)' },
  { id: 'F2', label: 'F-2 바닥 · 캐스케이드', desc: '같은 모습. 카드가 없어졌으니 행이 80ms 간격으로 위에서부터 차례로 맺히고(전체보기 마지막), 그 뒤 하단 팬' },
  { id: 'F3', label: 'F-3 바닥 · 행마다 규칙', desc: '같은 모습. 공통 규칙 6(컴포넌트 0.45s 간격)을 행 하나하나에 적용하고, 행이 나올 때마다 화면이 따라 내려간다. 가장 느리지만 한 행씩 읽힘' },
]
// 전시 턴 타이틀 시안 (html[data-disp]) — AgentChat playTurn. 스텝 6 → 7 → 8 로 진행하며 본다
const DISPS = [
  { id: 'T0', label: 'T-0 기존 (타이틀 있음)', desc: '비교용. 추가혜택·할인방법 턴에 "○○ 조회중" 타이틀이 뜨고 접힌 뒤 텍스트·카드' },
  { id: 'N1', label: 'N-1 바로 이어쓰기', desc: '타이틀 없이 0.9s 뒤 안내 텍스트가 바로 이어 붙고 카드가 따라온다. 가장 빠르고 조용함. 대신 Agent 가 생각하는 틈이 없다' },
  { id: 'N2', label: 'N-2 생각 점', desc: '텍스트 자리에 점 3개가 0.9s 깜빡인 뒤 텍스트로 바뀌고 카드가 따라온다. 조회 타이틀 없이도 기다림 신호는 남김' },
  { id: 'N3', label: 'N-3 카드만', desc: '안내 텍스트도 생략. 카드 헤더(추가혜택을 선택해 주세요 / 선택한 요금제 대상 혜택을 보여드려요)가 안내문 역할을 하고 카드만 바로 등장. 대화가 가장 짧아짐' },
]
// 스텝 3 Agent 실행 오버레이 시안 (html[data-launch]) — LaunchOverlay.jsx
const LAUNCHES = [
  { id: 'L1', label: 'L-1 딤 + 한 덩어리 슬라이드업', desc: 'Figma 정지 화면 그대로. 상품 상세는 선명하게 55% 딤만, 칩 3개·입력창·키패드가 한 몸으로 아래에서 0.5s(quint-out) 올라온다. 자리 잡은 뒤 0.9s 후 타이핑' },
  { id: 'L2', label: 'L-2 블러 딤 + 순차 등장', desc: '상품 상세가 흐려지며(blur 10 · 35% 딤) 뒤로 물러남. 키패드와 입력창이 먼저 올라오고, 칩이 입력창 바로 위부터 하나씩(0.1s 간격) 위로 쌓인다' },
  { id: 'L3', label: 'L-3 AI 버튼에서 확장', desc: '탭한 좌하단 AI 버튼 자리에서 입력창이 커지면서 키패드 위로 올라오고(0.55s), 칩이 입력창에서 위로 튀어나온다. 키패드는 0.1s 뒤따라 상승. 버튼이 입력창이 됐다는 연결감' },
]
// 스텝 탐색 UI 시안 — 사용자가 준 레퍼런스(세로 체크 스텝퍼 · OKX 가로 스텝퍼 · Hers 진행바 모달 · Klook 중첩 패널) 기반. html[data-nav]
const NAVS = [
  { id: 'R1', label: 'R-1 세로 체크 스텝퍼 패널', desc: 'Klook·ElevenReader 식. 왼쪽 패널에 단계 번호(완료 ✓ · 현재 채움 · 예정 회색)와 세로 연결선, 현재 단계 아래에만 세부 스텝(설명 포함)이 펼쳐짐. 모든 스텝 클릭 이동' },
  { id: 'R2', label: 'R-2 가로 체크 스텝퍼', desc: 'OKX 식. 상단에 10개 원: 완료는 ✓, 현재는 검은 채움 숫자, 예정은 회색 숫자와 점선. 아래에 스텝명을 질문처럼 크게, 왼쪽에 ‹ Back. 원에 마우스를 올리면 이름 툴팁' },
  { id: 'R3', label: 'R-3 진행바 + 카운터', desc: 'Hers 식. 얇은 진행바와 "08 / 10" 카운터, 큰 제목과 한 줄 설명, 아래 왼쪽 ← 둥근 버튼과 오른쪽 Next 버튼. 진행바 구간 클릭 이동' },
]
const ZoneTag = ({ zone }) => <span className={`zone ${zone}`}>{zones[zone].label}</span>
const stateOf = (i, cur) => (i < cur ? 'done' : i === cur ? 'cur' : 'todo')
const shortNote = (s) => (s.utterance ? `“${s.utterance}”` : (s.utteranceNote || '').split(' · ')[0])

// R-1 의 단계 → 스텝 트리 (안 셸 시안들이 공유)
function PhaseList({ sc, cur, go }) {
  const { steps, phases } = sc
  const stepIdx = (id) => stepIdxIn(sc, id)
  const pi = phaseOfIn(sc, cur)
  return (
        <ol className="phases">
          {phases.map((p, k) => {
            const state = stateOf(k, pi)
            return (
              <li key={p.id} className={state}>
                <button className="phase" onClick={() => go(stepIdx(p.steps[0]))} aria-current={state === 'cur' ? 'step' : undefined}>
                  <span className="mark">{state === 'done' ? <i className="chk" /> : state === 'cur' ? <i className="dot" /> : <i className="ring" />}</span>
                  <span className="pt">{p.title}<small>{p.steps.length}개 스텝</small></span>
                </button>
                {state === 'cur' && (
                  <ol className="subs">
                    {p.steps.map((id) => { const i = stepIdx(id); const st = steps[i]; const ss = stateOf(i, cur); return (
                      <li key={id} className={ss}>
                        <button onClick={() => go(i)} aria-current={ss === 'cur' ? 'step' : undefined}>
                          <span className="mark"><i /></span>
                          <span className="st"><b>{i + 1}. {st.screen}</b><small>{shortNote(st)}</small></span>
                        </button>
                      </li>
                    ) })}
                  </ol>
                )}
              </li>
            )
          })}
        </ol>
  )
}
function StepNav({ variant, cur, go, sc, head }) {
  const { steps, phases } = sc
  const pi = phaseOfIn(sc, cur)
  const s = steps[cur]
  if (variant === 'R1') {
    return (
      <aside className="rnav1" aria-label="스텝">
        {head || <div className="head"><b>시나리오 진행</b><span>{persona.goal} · 단계별로 이동할 수 있어요</span></div>}
        <PhaseList sc={sc} cur={cur} go={go} />
      </aside>
    )
  }
  if (variant === 'R2') {
    return (
      <nav className="rnav2" aria-label="스텝">
        <button className="back" onClick={() => go(cur - 1)} disabled={cur === 0}>‹ Back</button>
        <div className="center">
          <ol className="dots">
            {steps.map((st, i) => {
              const state = stateOf(i, cur)
              return (
                <li key={st.id} className={state}>
                  <button onClick={() => go(i)} aria-current={state === 'cur' ? 'step' : undefined} aria-label={`${i + 1}. ${st.screen}`}>
                    {state === 'done' ? <i className="chk" /> : <span className="num">{i + 1}</span>}
                    <span className="tip">{i + 1}. {st.screen}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="phase-label"><ZoneTag zone={s.zone} />{phases[pi].title}</div>
          <h2>{s.screen}</h2>
        </div>
      </nav>
    )
  }
  // R3 Hers 식 진행바 + 카운터
  const pct = ((cur + 1) / steps.length) * 100
  return (
    <nav className="rnav3" aria-label="스텝">
      <div className="track" role="list">
        <div className="fill" style={{ width: `${pct}%` }} />
        {steps.map((st, i) => <button key={st.id} className="hit" style={{ left: `${(i / steps.length) * 100}%`, width: `${100 / steps.length}%` }} onClick={() => go(i)} aria-label={`${i + 1}. ${st.screen}`} aria-current={i === cur ? 'step' : undefined} />)}
      </div>
      <div className="counter num"><b>{String(cur + 1).padStart(2, '0')}</b> / {String(steps.length).padStart(2, '0')}<span className="ph">· {phases[pi].title}</span></div>
      <h2>{s.screen}</h2>
      <p>{shortNote(s)}</p>
      <div className="btns">
        <button className="prev" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전">←</button>
        <button className="next" onClick={() => go(cur + 1)} disabled={cur === steps.length - 1}>{cur === steps.length - 1 ? '마지막 스텝' : `다음 · ${cur + 2}. ${steps[cur + 1].screen}`}</button>
      </div>
    </nav>
  )
}

// 폰 화면을 뷰포트에 맞추는 배율. chrome = 셸이 위아래로 차지하는 높이
// 레퍼런스(skt-scenario4) 방식의 반응형 (2026-09-10): ≤767px = 실제 폰, ≥768px = 상단 기기 프리셋 바 + 그 크기의 프레임
// 2026-09-11 모바일 맞춤 시안 (html[data-mfit], ?mf=) — iPhone 13 mini 375×812 기준. 사파리 툴바가 있으면 실제 높이는 ~660 뿐이라
// 기존 F0(폭 맞춤 + 세로 스크롤)은 하단 CTA·입력창이 잘려 "제대로 안 보인다". 아래 세 가지로 비교한다.
const PRESETS = [{ n: 'iPhone 13 mini', w: 375, h: 812 }, { n: 'iPhone 14 Pro', w: 390, h: 844 }, { n: 'iPhone 16 Pro', w: 393, h: 852 }]
const MFITS = [
  { id: 'F1', label: 'F-1 전체 맞춤', desc: '폰 화면 393×852 를 높이까지 맞춰 통째로 줄인다(min(vw/393, vh/852)). 잘림·스크롤이 절대 없고 375×812 어디서나 화면 전체가 한눈에. 대신 사파리 툴바가 있으면 좌우에 여백이 생긴다(배경색으로 이어 붙여 레터박스 티를 지움)' },
  { id: 'F2', label: 'F-2 폭 맞춤 + 화면 높이 유동', desc: '폭은 꽉 채우고(vw/393), 폰 안쪽 화면 높이를 852 고정이 아니라 실제 뷰포트 높이로 준다. 바닥에 붙는 것(CTA·SearchAi·키패드·홈 인디케이터)은 진짜 바닥에, 스크롤 영역만 줄어든다. 진짜 앱에 가장 가까움' },
  { id: 'F3', label: 'F-3 폭 맞춤 + 하단 고정', desc: '폭을 꽉 채우고 비율(393:852)은 그대로. 넘치는 만큼은 위쪽(상태바·장식)만 잘리고 하단은 항상 보인다. 포인터가 잘린 위쪽을 짚으면 화면이 부드럽게 따라 내려온다' },
  { id: 'F0', label: 'F-0 기존', desc: '폭 맞춤 + 넘치면 스테이지 세로 스크롤 (2026-09-10 배포분)' },
]
const MWIDTHS = [
  { id: 'W2', label: 'W-2 기기 폭 1:1 유동', desc: '배율 없이 캔버스 폭 = 기기 폭. 좌우 여백 20px 은 그대로 두고 카드·입력창·버튼이 폭에 맞춰 늘고 줄어든다. 글자 크기가 어느 폰에서나 같아 실제 앱과 가장 비슷하다' },
  { id: 'W1', label: 'W-1 비례 확대·축소', desc: '캔버스는 393 그대로 두고 기기 폭에 맞춰 통째로 확대·축소. 375 에서 0.954 배 — 디자인 비율은 완벽하지만 글자·여백도 함께 4.6% 작아진다' },
  { id: 'W3', label: 'W-3 1:1 유동 + 393 상한', desc: '작은 폰(≤393)은 W-2 처럼 폭을 다 쓰고, 393 보다 넓은 폰에서는 393 에서 멈추고 가운데 정렬. 디자인이 의도한 최대 폭을 넘지 않는다' },
]
const MOBILE_BP = 767
const PHONE_W = BASE_W, PHONE_H = BASE_H
const readFrame = () => { try { const f = JSON.parse(localStorage.getItem('asp.frame')); if (f && f.w >= 320 && f.h >= 480) return f } catch {} return { w: 375, h: 812 } }
function useFit(chrome, mfit, frame) {
  const [fit, setFit] = useState({ ms: 1, sw: SCREEN_W, sh: SCREEN_H, fill: true, fw: PHONE_W, fh: PHONE_H })
  useEffect(() => {
    const f = () => {
      const fill = innerWidth <= MOBILE_BP
      const vw = fill ? Math.min(innerWidth, MAX_W) : frame.w
      const vh = (fill ? innerHeight : frame.h) - chrome
      let ms, sw = PHONE_W, sh = PHONE_H
      if (mfit === 'F1') ms = Math.min(vw / PHONE_W, vh / PHONE_H)
      else if (mfit === 'F2') { sw = SCREEN_W; sh = SCREEN_H; ms = fill ? MS0 : Math.min(vw / sw, vh / sh) }   // 폭·높이·배율 모두 screen.js 가 로드 시점에 정한 값
      else { ms = vw / PHONE_W; if (mfit === 'F0') ms = Math.min(ms, 1) }
      if (fill) { setFit({ ms, sw, sh, fill, fw: innerWidth, fh: innerHeight }); return }
      // 데스크톱: 프리셋 프레임(w×h)을 창에 들어가게 줄이고, 그 안에 폰 화면을 맞춘다
      const k = Math.min((innerHeight - 120) / frame.h, (innerWidth - 48) / frame.w, 1)
      setFit({ ms: ms * k, sw, sh, fill, fw: frame.w * k, fh: frame.h * k })
    }
    f(); addEventListener('resize', f)
    const vv = window.visualViewport   // 사파리 툴바가 접히고 펴질 때 innerHeight 가 resize 없이 바뀐다
    vv?.addEventListener('resize', f)
    return () => { removeEventListener('resize', f); vv?.removeEventListener('resize', f) }
  }, [chrome, mfit, frame.w, frame.h])
  return fit
}
// F-3 전용: 폰이 뷰포트보다 길 때 아래를 붙여 두고, 포인터가 잘린 위쪽을 짚으면 그 자리까지 부드럽게 따라 내려온다
function usePanFollow(ref, on, ms, vh) {
  useEffect(() => {
    if (!on || !ref.current) return
    const el = ref.current
    const over = Math.max(0, PHONE_H * ms - vh)
    let pan = -over
    const set = (v) => { pan = v; el.style.setProperty('--mpan', `${v}px`) }
    set(-over)
    if (!over) return
    const t = setInterval(() => {
      const layer = el.querySelector('.ptr-layer.on')
      if (!layer) return
      const y = parseFloat(getComputedStyle(layer).getPropertyValue('--y')) || 0
      const sy = y * ms + pan            // 뷰포트 기준 포인터 높이
      if (sy > 72 && sy < vh - 96) return
      const want = Math.max(-over, Math.min(0, vh / 2 - y * ms))
      if (Math.abs(want - pan) > 8) set(want)
    }, 260)
    return () => clearInterval(t)
  }, [ref, on, ms, vh])
}
function MobileShell({ mshell, mfit, pid, pick, sc, cur, go, step, doneToast, nextTest, replay }) {
  const steps = sc.steps, n = steps.length
  const [sheet, setSheet] = useState(false)
  // 사용자 탭 모드: 스텝 끝 대기 자리를 탭하면 다음 스텝. 탭할 곳이 없는 채 4초가 지나면 '옆으로 밀어 다음' 안내
  const goRef = useRef(go); goRef.current = go
  const curRef2 = useRef(cur); curRef2.current = cur
  useEffect(() => {
    const onPark = () => goRef.current(curRef2.current + 1)
    addEventListener('ptr-park-tap', onPark)
    return () => removeEventListener('ptr-park-tap', onPark)
  }, [])
  const stageRef = useRef(null)
  // 자동 재생 플로우: 스텝 끝 대기(ptr-park) → 1.5s → 다음 스텝. 대기 없이 끝나는 스텝은 폰 화면 DOM 이 4.5s 동안 멈추면 다음. 마지막 스텝은 완료 토스트에서 멈춤
  useEffect(() => {
    if (!AUTOPLAY || cur >= n - 1 || !stageRef.current) return
    let t = 0
    const next = () => goRef.current(curRef2.current + 1)
    const arm = (ms) => { clearTimeout(t); t = setTimeout(next, ms) }
    arm(4500)
    const onPark = () => arm(1500)
    const mo = new MutationObserver(() => { if (!document.querySelector('.ptr-layer.hover')) arm(4500) })
    mo.observe(stageRef.current, { subtree: true, childList: true, attributes: true, characterData: true })
    addEventListener('ptr-park', onPark)
    return () => { clearTimeout(t); mo.disconnect(); removeEventListener('ptr-park', onPark) }
  }, [cur, pid, n])
  const chrome = mshell === 'M2' ? 128 : mshell === 'M3' ? 76 : 0   // M3: 알약이 폰 화면 하단(SearchAi·CTA)을 가리지 않게 아래 76px 띠를 비운다
  const [frame, setFrame] = useState(readFrame)
  const [draft, setDraft] = useState(frame)
  const applyFrame = (f) => { const nf = { w: Math.max(320, Math.min(600, Number(f.w) || 375)), h: Math.max(480, Math.min(1200, Number(f.h) || 812)) }; setFrame(nf); setDraft(nf); try { localStorage.setItem('asp.frame', JSON.stringify(nf)) } catch {} }
  const { ms, sw, sh, fill, fw, fh } = useFit(chrome, mfit, frame)
  const wrapRef = useRef(null)
  usePanFollow(wrapRef, fill && mfit === 'F3', ms, fh - chrome)
  useEffect(() => { setSheet(false) }, [cur, pid])
  // 옆으로 밀어 스텝 이동 (모든 셸 공통)
  const tx = useRef(null)
  const onTS = (e) => { tx.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTE = (e) => { const t = tx.current; if (!t) return; const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y; tx.current = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1)) }
  const pi = phaseOfIn(sc, cur)
  const label = `${pid}안 · ${cur + 1}/${n}`
  const Seg = () => <div className="m-seg">{PROPOSALS.map((q) => <button key={q.id} className={q.id === pid ? 'on' : ''} onClick={() => pick(q.id)}>{q.id}안</button>)}</div>
  return (
    <div className={`m-root ${fill ? 'fill' : 'desk'} ${sheet ? 'sheet-on' : ''}`} style={{ '--ms': ms, '--cw': `${sw}px`, '--ch': `${sh}px`, '--fw': `${fw}px`, '--fh': `${fh}px` }}>
      {!fill && (
        <div className="m-controls">
          <span className="lbl">화면 크기</span>
          {PRESETS.map((p) => <button key={p.n} className={`preset ${frame.w === p.w && frame.h === p.h ? 'on' : ''}`} onClick={() => applyFrame(p)}>{p.n}</button>)}
          <span className="div" />
          <label>W <input type="number" value={draft.w} onChange={(e) => setDraft({ ...draft, w: e.target.value })} /></label>
          <label>H <input type="number" value={draft.h} onChange={(e) => setDraft({ ...draft, h: e.target.value })} /></label>
          <button className="apply" onClick={() => applyFrame(draft)}>적용</button>
          <span className="div" />
          <div className="m-seg">{MFITS.map((v) => <button key={v.id} className={v.id === mfit ? 'on' : ''} onClick={() => { const q = new URLSearchParams(location.search); q.set('mf', v.id); location.search = q }} title={v.desc}>{v.id}</button>)}</div>
          <div className="m-seg">{MWIDTHS.map((v) => <button key={v.id} className={v.id === MWIDTH ? 'on' : ''} onClick={() => { const q = new URLSearchParams(location.search); q.set('mw', v.id); location.search = q }} title={v.desc}>{v.id}</button>)}</div>
          <span className="div" />
          <Seg />
          <span className="cnt num">STEP {cur + 1} / {n}</span>
        </div>
      )}
      {mshell === 'M2' && (
        <header className="m-top">
          <Seg />
          <div className="m-title"><b>{step.screen}</b><small>{sc.phases[pi]?.title}</small></div>
        </header>
      )}
      <main className="m-stage" onTouchStart={onTS} onTouchEnd={onTE}>
        <div className="phone-wrap" ref={(n) => { stageRef.current = n; wrapRef.current = n }}><Phone key={`${replay}-${pid}`} view={step.view} /><DoneToast show={doneToast} onNext={nextTest} /></div>
        {(mshell === 'M1' || mshell === 'M0') && (<>
          <button className="m-zone l" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전" />
          <button className="m-zone r" onClick={() => go(cur + 1)} disabled={cur === n - 1} aria-label="다음" />
        </>)}
        {mshell === 'M1' && <button className="m-pill top num" onClick={() => setSheet(true)}>{label}<i className="chev" /></button>}
        {mshell === 'M0' && <button className="m-tap-top" onClick={() => setSheet(true)} aria-label="안 · 스텝 · 목적 보기" />}
      </main>
      {mshell === 'M3' && (
        <footer className="m-bot m3">
          <div className="m-pill static">
            <button className="arr" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전">‹</button>
            <button className="mid" onClick={() => setSheet(true)}><span className="num">{label}</span><b>{step.screen}</b></button>
            <button className="arr" onClick={() => go(cur + 1)} disabled={cur === n - 1} aria-label="다음">›</button>
          </div>
        </footer>
      )}
      {mshell === 'M2' && (
        <footer className="m-bot">
          <button className="arr" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전">←</button>
          <button className="mid" onClick={() => setSheet(true)}><span className="num">STEP {cur + 1} / {n}</span><small>목적 보기</small></button>
          <button className="arr" onClick={() => go(cur + 1)} disabled={cur === n - 1} aria-label="다음">→</button>
        </footer>
      )}
      {/* 안 · 스텝 · 목적 시트 */}
      <div className="m-dim" onClick={() => setSheet(false)} />
      <section className="m-sheet" aria-hidden={!sheet}>
        <div className="grab" />
        <Seg />
        <div className="m-concept"><b>{sc.title}</b><p>{sc.concept}</p></div>
        <div className="m-cur">
          <div className="steplabel"><span className="no num">STEP {cur + 1}</span><ZoneTag zone={step.zone} /><span>{step.screen}</span></div>
          {step.utterance ? <div className="bubble">“{step.utterance}”</div> : <div className="bubble none">{step.utteranceNote}</div>}
          <div className="kicker">이 스텝의 [목적]</div>
          <ul className="req">{step.purpose.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        <div className="rnav1 m-nav"><PhaseList sc={sc} cur={cur} go={go} /></div>
      </section>
    </div>
  )
}

export default function App() {
  // 안 선택 = URL 경로로 구분 (/1 · /2 · /3, 사용자 2026-09-08 "vercel 내에서 링크 구분"). 예전 ?an= 도 계속 받는다. 기본 3안
  const [pid, setPid] = useState(() => { const m = location.pathname.match(/^\/([123])\/?$/); const q = m ? Number(m[1]) : Number(Q0.get('an') || (LAB && import.meta.env.VITE_AN)); return [1, 2, 3].includes(q) ? q : 3 })
  const sc = scOf(pid), steps = sc.steps
  const [webV, setWebV] = useState(() => (LAB ? (Q0.get('web') || 'WB') : 'WB'))
  useEffect(() => { document.documentElement.dataset.web = webV }, [webV])
  const [wbV, setWbV] = useState(() => (LAB ? (Q0.get('wb') || 'B1') : 'B1'))
  useEffect(() => { document.documentElement.dataset.wb = wbV }, [wbV])
  const [cur, setCur] = useState(() => {
    const q = Number(Q0.get('step'))
    if (q >= 1 && q <= steps.length) return q - 1
    const pos = readPos()   // URL 에 step 이 없으면(안 전환·완료 토스트 뒤 재로드) 이 탭이 마지막으로 있던 자리
    return pos && pos.pid === pid && pos.step >= 1 && pos.step <= steps.length ? pos.step - 1 : 0
  })
  // 안·스텝이 바뀔 때마다 URL(/{pid}?step=n) 과 sessionStorage 에 기록 — 어떤 경로로 바뀌어도 재로드 시 같은 자리로 돌아온다
  useEffect(() => {
    const q = new URLSearchParams(location.search); q.delete('an'); q.set('step', cur + 1)
    history.replaceState(null, '', `/${pid}?${q}`)
    savePos(pid, cur + 1)
  }, [pid, cur])
  const pick = (id) => { userNav(); setPid(id); setCur((c) => Math.min(c, scOf(id).steps.length - 1)); setReplay((n) => n + 1) }

  const step = steps[Math.min(cur, steps.length - 1)]
  const [replay, setReplay] = useState(0)
  // 완료 토스트: 마지막 스텝에 들어온 뒤 (마지막 모션 여유 + 1.5s) 표시. 스텝이 바뀌면 숨김
  const [doneToast, setDoneToast] = useState(false)
  useEffect(() => {
    setDoneToast(false)
    if (cur !== steps.length - 1) return
    const t = setTimeout(() => setDoneToast(true), DONE_DELAY + (pid === 3 ? 700 : pid === 1 ? 1900 : 300))   // 1안: 주문 확인 화면 슬라이드 0.45 + 대기 0.9 + 팬 ≤1.5 뒤
    return () => clearTimeout(t)
  }, [cur, pid, steps.length, replay])
  const nextTest = () => { userNav(); const n = pid === 3 ? 1 : pid + 1; setPid(n); setCur(0); setReplay((k) => k + 1) }
  // 확정 시안은 모듈 로드 시 <html data-*> 로 내려갔다. LAB 빌드에서는 스텝 탐색 UI(nav)만 바꿔볼 수 있다
  const [navV, setNavV] = useState(() => (LAB ? (Q0.get('n') || 'R1') : CONFIRMED.nav))
  useEffect(() => { document.documentElement.dataset.nav = navV }, [navV])
  const [launchV, setLaunchV] = useState(() => (LAB ? (Q0.get('l') || CONFIRMED.launch) : CONFIRMED.launch))
  useEffect(() => { document.documentElement.dataset.launch = launchV }, [launchV])
  const [dispV, setDispV] = useState(() => (LAB ? (Q0.get('d') || CONFIRMED.disp) : CONFIRMED.disp))
  useEffect(() => { document.documentElement.dataset.disp = dispV }, [dispV])
  const [flatV, setFlatV] = useState(() => (LAB ? (Q0.get('f') || CONFIRMED.flat) : CONFIRMED.flat))
  useEffect(() => { document.documentElement.dataset.flat = flatV }, [flatV])
  const [altcardV, setAltcardV] = useState(() => (LAB ? (Q0.get('a') || CONFIRMED.altcard) : CONFIRMED.altcard))
  useEffect(() => { document.documentElement.dataset.altcard = altcardV }, [altcardV])
  const [altcopyV, setAltcopyV] = useState(() => (LAB ? (Q0.get('c') || CONFIRMED.altcopy) : CONFIRMED.altcopy))
  useEffect(() => { document.documentElement.dataset.altcopy = altcopyV }, [altcopyV])
  const [pdflowV, setPdflowV] = useState(() => (LAB ? (Q0.get('p') || CONFIRMED.pdflow) : CONFIRMED.pdflow))
  useEffect(() => { document.documentElement.dataset.pdflow = pdflowV }, [pdflowV])
  const [cardselV, setCardselV] = useState(() => (LAB ? (Q0.get('s') || CONFIRMED.cardsel) : CONFIRMED.cardsel))
  useEffect(() => { document.documentElement.dataset.cardsel = cardselV }, [cardselV])
  const [streamV, setStreamV] = useState(() => (LAB ? (Q0.get('z') || CONFIRMED.stream) : CONFIRMED.stream))
  useEffect(() => { document.documentElement.dataset.stream = streamV }, [streamV])
  const [thinkV, setThinkV] = useState(() => (LAB ? (Q0.get('w') || CONFIRMED.think) : CONFIRMED.think))
  useEffect(() => { document.documentElement.dataset.think = thinkV }, [thinkV])
  const [fillV, setFillV] = useState(() => (LAB ? (Q0.get('i') || CONFIRMED.fill) : CONFIRMED.fill))
  useEffect(() => { document.documentElement.dataset.fill = fillV }, [fillV])
  const [kbfieldV, setKbfieldV] = useState(() => (LAB ? (Q0.get('k') || CONFIRMED.kbfield) : CONFIRMED.kbfield))
  useEffect(() => { document.documentElement.dataset.kbfield = kbfieldV }, [kbfieldV])
  const [followV, setFollowV] = useState(() => (LAB ? (Q0.get('f2') || CONFIRMED.follow) : CONFIRMED.follow))
  useEffect(() => { document.documentElement.dataset.follow = followV }, [followV])
  const [extV, setExtV] = useState(() => (LAB ? (Q0.get('x') || CONFIRMED.ext) : CONFIRMED.ext))
  useEffect(() => { document.documentElement.dataset.ext = extV }, [extV])
  const [lineV, setLineV] = useState(() => (LAB ? (Q0.get('ln') || CONFIRMED.line) : CONFIRMED.line))
  useEffect(() => { document.documentElement.dataset.line = lineV }, [lineV])
  const [ctxfxV, setCtxfxV] = useState(() => (LAB ? (Q0.get('h') || CONFIRMED.ctxfx) : CONFIRMED.ctxfx))
  useEffect(() => { document.documentElement.dataset.ctxfx = ctxfxV }, [ctxfxV])
  const [hdrfadeV, setHdrfadeV] = useState(() => (LAB ? (Q0.get('hf') || CONFIRMED.hdrfade) : CONFIRMED.hdrfade))
  const [fshV, setFshV] = useState(() => (LAB ? (Q0.get('fs') || CONFIRMED.fsh) : CONFIRMED.fsh))
  useEffect(() => { document.documentElement.dataset.fsh = fshV }, [fshV])
  const [sheetoutV, setSheetoutV] = useState(() => (LAB ? (Q0.get('so') || CONFIRMED.sheetout) : CONFIRMED.sheetout))
  useEffect(() => { document.documentElement.dataset.sheetout = sheetoutV }, [sheetoutV])
  const [sheetfxV, setSheetfxV] = useState(() => (LAB ? (Q0.get('sf') || CONFIRMED.sheetfx) : CONFIRMED.sheetfx))
  useEffect(() => { document.documentElement.dataset.sheetfx = sheetfxV }, [sheetfxV])
  const [pdscrollV, setPdscrollV] = useState(() => (LAB ? (Q0.get('ds') || CONFIRMED.pdscroll) : CONFIRMED.pdscroll))
  useEffect(() => { document.documentElement.dataset.pdscroll = pdscrollV }, [pdscrollV])
  const [tmorphV, setTmorphV] = useState(() => (LAB ? (Q0.get('tm') || CONFIRMED.tmorph) : CONFIRMED.tmorph))
  useEffect(() => { document.documentElement.dataset.tmorph = tmorphV }, [tmorphV])
  const [s2coverV, setS2coverV] = useState(() => (LAB ? (Q0.get('cv') || CONFIRMED.s2cover) : CONFIRMED.s2cover))
  useEffect(() => { document.documentElement.dataset.s2cover = s2coverV }, [s2coverV])
  const [sheetgapV, setSheetgapV] = useState(() => (LAB ? (Q0.get('sg') || CONFIRMED.sheetgap) : CONFIRMED.sheetgap))
  useEffect(() => { document.documentElement.dataset.sheetgap = sheetgapV }, [sheetgapV])
  const [dimV, setDimV] = useState(() => (LAB ? (Q0.get('dm') || CONFIRMED.dim) : CONFIRMED.dim))
  useEffect(() => { document.documentElement.dataset.dim = dimV }, [dimV])
  const [fsmV, setFsmV] = useState(() => (LAB ? (Q0.get('fm') || CONFIRMED.fsm) : CONFIRMED.fsm))
  useEffect(() => { document.documentElement.dataset.fsm = fsmV }, [fsmV])
  useEffect(() => { document.documentElement.dataset.hdrfade = hdrfadeV }, [hdrfadeV])
  const [aihintV, setAihintV] = useState(() => (LAB ? (Q0.get('ah') || CONFIRMED.aihint) : CONFIRMED.aihint))
  useEffect(() => { document.documentElement.dataset.aihint = aihintV }, [aihintV])
  const [aidimV, setAidimV] = useState(() => (LAB ? (Q0.get('ad') || CONFIRMED.aidim) : CONFIRMED.aidim))
  useEffect(() => { document.documentElement.dataset.aidim = aidimV }, [aidimV])
  const [ambientV, setAmbientV] = useState(() => (LAB ? (Q0.get('am') || CONFIRMED.ambient) : CONFIRMED.ambient))
  useEffect(() => { document.documentElement.dataset.ambient = ambientV }, [ambientV])
  const [zippopV, setZippopV] = useState(() => (LAB ? (Q0.get('zp') || CONFIRMED.zippop) : CONFIRMED.zippop))
  useEffect(() => { document.documentElement.dataset.zippop = zippopV }, [zippopV])
  const [recflowV, setRecflowV] = useState(() => (LAB ? (Q0.get('rf') || CONFIRMED.recflow) : CONFIRMED.recflow))
  useEffect(() => { document.documentElement.dataset.recflow = recflowV }, [recflowV])
  const [knobV, setKnobV] = useState(() => (LAB ? (Q0.get('kn') || CONFIRMED.knob) : CONFIRMED.knob))
  useEffect(() => { document.documentElement.dataset.knob = knobV }, [knobV])
  const [knobtimeV, setKnobtimeV] = useState(() => (LAB ? (Q0.get('kt') || CONFIRMED.knobtime) : CONFIRMED.knobtime))
  useEffect(() => { document.documentElement.dataset.knobtime = knobtimeV }, [knobtimeV])
  const [simxV, setSimxV] = useState(() => (LAB ? (Q0.get('sx') || CONFIRMED.simx) : CONFIRMED.simx))
  useEffect(() => { document.documentElement.dataset.simx = simxV }, [simxV])
  const [dimfxV, setDimfxV] = useState(() => (LAB ? (Q0.get('df') || CONFIRMED.dimfx) : CONFIRMED.dimfx))
  useEffect(() => { document.documentElement.dataset.dimfx = dimfxV }, [dimfxV])
  const [pdenterV, setPdenterV] = useState(() => (LAB ? (Q0.get('pe') || CONFIRMED.pdenter) : CONFIRMED.pdenter))
  useEffect(() => { document.documentElement.dataset.pdenter = pdenterV }, [pdenterV])
  const [sheetlookV, setSheetlookV] = useState(() => (LAB ? (Q0.get('sl') || CONFIRMED.sheetlook) : CONFIRMED.sheetlook))
  useEffect(() => { document.documentElement.dataset.sheetlook = sheetlookV }, [sheetlookV])
  const [planfoldV, setPlanfoldV] = useState(() => (LAB ? (Q0.get('pf') || 'B1') : CONFIRMED.planfold))
  useEffect(() => { document.documentElement.dataset.planfold = planfoldV }, [planfoldV])
  const [foldsyncV, setFoldsyncV] = useState(() => (LAB ? (Q0.get('fy') || 'T2') : CONFIRMED.foldsync))
  useEffect(() => { document.documentElement.dataset.foldsync = foldsyncV }, [foldsyncV])
  const [mobile, setMobile] = useState(() => FORCE_MOBILE || matchMedia(MOBILE_Q).matches)
  useEffect(() => { if (FORCE_MOBILE) return; const mq = matchMedia(MOBILE_Q); const f = () => setMobile(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f) }, [])
  const [mshellV] = useState(() => Q0.get('m') || 'M0')   // M0 풀페이지(컨트롤 없음) 기본 — 사용자 2026-09-10
  // 모바일 맞춤 시안 (?mf=F1|F2|F3|F0) — 폰 도메인에서도 바로 비교할 수 있게 LAB 게이트 없음
  const [mfitV] = useState(() => MFIT)
  useEffect(() => { document.documentElement.dataset.mfit = mfitV; document.documentElement.dataset.mwidth = MWIDTH }, [mfitV])
  useEffect(() => { document.documentElement.dataset.mshell = mshellV; document.documentElement.classList.toggle('m', mobile) }, [mshellV, mobile])

  const scRef = useRef(sc); scRef.current = sc
  const go = useCallback((i) => {
    const steps = scRef.current.steps
    const n = Math.max(0, Math.min((document.documentElement.dataset.web === 'WC' ? Math.max(...PROPOSALS.map((p) => p.steps.length)) : steps.length) - 1, i))
    const commit = () => setCur(n)
    userNav()
    // 2 → 3: 상품 상세의 AI 버튼을 먼저 "탭"한 뒤 Agent 로 디졸브
    if (steps[curRef.current]?.id === 'pd-options' && steps[n]?.id === 'agent-launch') {
      window.dispatchEvent(new CustomEvent('ai-tap'))
      setTimeout(commit, 550)
      return
    }
    // 1안 5 → 6: 상품 상세의 [주문하기] 를 먼저 "탭"한 뒤 결제 화면 슬라이드 인
    if (steps[curRef.current]?.id === 'a1-5' && steps[n]?.id === 'a1-6') {
      window.dispatchEvent(new CustomEvent('pay-tap'))
      setTimeout(commit, 450)
      return
    }
    commit()
  }, [])
  const curRef = useRef(cur); curRef.current = cur
  // 스텝이 늘어 필름 스트립이 가로 스크롤됨 → 현재 스텝이 항상 보이도록 (세로 레일도 동일)
  useEffect(() => {
    if (mobile) return   // 모바일 셸: 시트 안 스텝퍼를 scrollIntoView 하면 overflow:hidden 인 스테이지가 통째로 밀려 올라간다 (2026-09-10)
    document.querySelector('.rnav1 [aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [cur, navV, mobile])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(curRef.current + 1)
      if (e.key === 'ArrowLeft') go(curRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  if (mobile) return <MobileShell mshell={mshellV} mfit={mfitV} pid={pid} pick={pick} sc={sc} cur={cur} go={go} step={step} doneToast={doneToast} nextTest={nextTest} replay={replay} />
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <b>Agent Scenario Player</b>
          <span>{pid}안 · {sc.title} · {persona.goal}</span>
        </div>
        <div className="hint"><kbd>←</kbd> <kbd>→</kbd> 스텝 이동</div>
      </header>

      {/* 웹 셸 시안 W-A: 상단 세그먼트 탭 */}
      {webV === 'WA' && (
        <nav className="an-tabs" aria-label="안 선택">
          {PROPOSALS.map((p) => (
            <button key={p.id} className={p.id === pid ? 'on' : ''} onClick={() => pick(p.id)}>
              <span className="num">{p.id}안</span><b>{p.title}</b><small>{p.id === 3 ? p.example : p.concept}</small><em>{p.status}</em>
            </button>
          ))}
        </nav>
      )}
      {navV !== 'R1' && <StepNav variant={navV} cur={cur} go={go} sc={sc} />}

      {LAB && (
        <div className="lab-groups">
          {/* 확정된 시안 그룹(스텝 탐색 UI R-1 · Agent 실행 오버레이 L-2)은 LAB 스위처에서 숨김 — ?lab=all 로만 다시 보임. 검토 중인 그룹만 노출 */}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">시트 내려가기 (2안 스텝 5~8 · 3안 신청서 시트 · 스텝 4에서 →) — X-2 확정</b>
            {SHEETOUTS.map((v) => (
              <button key={v.id} aria-pressed={sheetoutV === v.id} onClick={() => { setSheetoutV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{SHEETOUTS.find((v) => v.id === sheetoutV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">바텀 모달 등장 모션 2차 (2안 스텝 5~8 · 3안 스텝 10~ · 신청서 시트 포함) — R-2 확정</b>
            {SHEETFXS.map((v) => (
              <button key={v.id} aria-pressed={sheetfxV === v.id} onClick={() => { setSheetfxV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{SHEETFXS.find((v) => v.id === sheetfxV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">1안 · 아래로 스크롤 제스처 (스텝 3~5 · 스텝 2에서 →) — D-3 확정</b>
            {PDSCROLLS.map((v) => (
              <button key={v.id} aria-pressed={pdscrollV === v.id} onClick={() => { setPdscrollV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{PDSCROLLS.find((v) => v.id === pdscrollV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">1안 · T+ → 입력창 모핑 (스텝 2~4, 스텝 1에서 →) — T-1 확정</b>
            {TMORPHS.map((v) => (
              <button key={v.id} aria-pressed={tmorphV === v.id} onClick={() => { setTmorphV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{TMORPHS.find((v) => v.id === tmorphV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">스텝 탐색 UI (10개 이상일 때 알아보기)</b>
              {NAVS.map((v) => (
                <button key={v.id} aria-pressed={navV === v.id} onClick={() => { setNavV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{NAVS.find((v) => v.id === navV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">스텝 3 Agent 실행 오버레이</b>
              {LAUNCHES.map((v) => (
                <button key={v.id} aria-pressed={launchV === v.id} onClick={() => { setLaunchV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{LAUNCHES.find((v) => v.id === launchV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">전시 턴 타이틀 (스텝 7·8 · 스텝 6에서 →)</b>
              {DISPS.map((v) => (
                <button key={v.id} aria-pressed={dispV === v.id} onClick={() => { setDispV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{DISPS.find((v) => v.id === dispV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">카드 → 바닥 (스텝 5 요금제 선택 · 스텝 7 추가혜택 · 스텝 4에서 →)</b>
              {FLATS.map((v) => (
                <button key={v.id} aria-pressed={flatV === v.id} onClick={() => { setFlatV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{FLATS.find((v) => v.id === flatV)?.desc}</span>
            </div>
          )}
          {(SHOW_ALL || Q0.get('g') === 'alt') && (<>
          <div className="variants">
            <b className="vtitle">[다른 요금제 살펴보기] 결과 컴포넌트 (스텝 5 · 스텝 4에서 →)</b>
            {ALTCARDS.map((v) => (
              <button key={v.id} aria-pressed={altcardV === v.id} onClick={() => { setAltcardV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{ALTCARDS.find((v) => v.id === altcardV)?.desc}</span>
          </div>
          <div className="variants">
            <b className="vtitle">안내문 카피</b>
            {ALTCOPIES.map((v) => (
              <button key={v.id} aria-pressed={altcopyV === v.id} onClick={() => { setAltcopyV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">“{ALTCOPIES.find((v) => v.id === altcopyV)?.desc}”</span>
          </div>
          </>)}
          {(SHOW_ALL || Q0.get('g') === 'pd') && (
            <div className="variants">
              <b className="vtitle">상품 상세 v2 · 스텝 2 자동 시퀀스 (스텝 1에서 →)</b>
              {PDFLOWS.map((v) => (
                <button key={v.id} aria-pressed={pdflowV === v.id} onClick={() => { setPdflowV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{PDFLOWS.find((v) => v.id === pdflowV)?.desc}</span>
            </div>
          )}
          {(SHOW_ALL || Q0.get('g') === 'sel') && (
            <div className="variants">
              <b className="vtitle">요금제 카드 선택됨 표현 (스텝 6 → 7 적용하기)</b>
              {CARDSELS.map((v) => (
                <button key={v.id} aria-pressed={cardselV === v.id} onClick={() => { setCardselV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{CARDSELS.find((v) => v.id === cardselV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">(폐기) 이어서 옵션 안내 Z 시안</b>
              {STREAMS.map((v) => (
                <button key={v.id} aria-pressed={streamV === v.id} onClick={() => { setStreamV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{STREAMS.find((v) => v.id === streamV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">옵션 섹션 본문 등장 (스텝 7~9 · 스텝 6에서 →)</b>
              {THINKS.map((v) => (
                <button key={v.id} aria-pressed={thinkV === v.id} onClick={() => { setThinkV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{THINKS.find((v) => v.id === thinkV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">스텝 11 입력 필드 기입 (스텝 10에서 →)</b>
              {FILLS.map((v) => (
                <button key={v.id} aria-pressed={fillV === v.id} onClick={() => { setFillV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{FILLS.find((v) => v.id === fillV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">스텝 10 키패드 ↔ 입력 카드 (스텝 9에서 →)</b>
              {KBFIELDS.map((v) => (
                <button key={v.id} aria-pressed={kbfieldV === v.id} onClick={() => { setKbfieldV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{KBFIELDS.find((v) => v.id === kbfieldV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">턴 안에서 화면이 따라가는 리듬 (스텝 6~10 · 스텝 5에서 →)</b>
              {FOLLOWS.map((v) => (
                <button key={v.id} aria-pressed={followV === v.id} onClick={() => { setFollowV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{FOLLOWS.find((v) => v.id === followV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">스텝 13 토스로 나갔다 오기 (스텝 12에서 →)</b>
              {EXTS.map((v) => (
                <button key={v.id} aria-pressed={extV === v.id} onClick={() => { setExtV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{EXTS.find((v) => v.id === extV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">업무처리 결과 선 그려짐 (스텝 13·14 · 스텝 12에서 →)</b>
              {LINES.map((v) => (
                <button key={v.id} aria-pressed={lineV === v.id} onClick={() => { setLineV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{LINES.find((v) => v.id === lineV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">신청서 시트 높이 변화 (스텝 10~13 · 스텝 9에서 →) — H-1 확정</b>
              {FSHS.map((v) => (
                <button key={v.id} aria-pressed={fshV === v.id} onClick={() => { setFshV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{FSHS.find((v) => v.id === fshV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">신청서 시트 H-1 모션감 (스텝 10~13 · 스텝 9에서 →) — M-3 확정</b>
            {FSMS.map((v) => (
              <button key={v.id} aria-pressed={fsmV === v.id} onClick={() => { setFsmV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{FSMS.find((v) => v.id === fsmV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">웹 셸 · 1·2·3안 보기 방식</b>
              {WEBS.map((v) => (
                <button key={v.id} aria-pressed={webV === v.id} onClick={() => setWebV(v.id)}>{v.label}</button>
              ))}
              <span className="vdesc">{WEBS.find((v) => v.id === webV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && webV === 'WB' && (
            <div className="variants">
              <b className="vtitle">W-B 세부 · 왼쪽 패널의 '안' 층</b>
              {WBS.map((v) => (
                <button key={v.id} aria-pressed={wbV === v.id} onClick={() => setWbV(v.id)}>{v.label}</button>
              ))}
              <span className="vdesc">{WBS.find((v) => v.id === wbV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">컨텍스트 헤더 '옵션명 선택중 k/19' 변화 모션 (스텝 6 → 7 → 8 → 9 에서 옵션 컴포넌트가 뜨는 순간)</b>
              {CTXFXS.map((v) => (
                <button key={v.id} aria-pressed={ctxfxV === v.id} onClick={() => { setCtxfxV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
              ))}
              <span className="vdesc">{CTXFXS.find((v) => v.id === ctxfxV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
            <div className="variants">
              <b className="vtitle">상단 헤더 배경 페이드 (스텝 7~9에서 채팅이 헤더 밑으로 지나갈 때)</b>
              {HDRFADES.map((v) => (
                <button key={v.id} aria-pressed={hdrfadeV === v.id} onClick={() => setHdrfadeV(v.id)}>{v.label}</button>
              ))}
              <span className="vdesc">{HDRFADES.find((v) => v.id === hdrfadeV)?.desc}</span>
            </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 상단 앵커링 + 대화창을 덮는 모달 (스텝 4~8) — 아래 20px 고정</b>
            {S2COVERS.map((v) => (
              <button key={v.id} aria-pressed={s2coverV === v.id} onClick={() => { setS2coverV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{S2COVERS.find((v) => v.id === s2coverV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 시트가 올라올 때 안내문 위치 (스텝 4~8 · 시트 상단 위 30px) — G-1 확정</b>
            {SHEETGAPS.map((v) => (
              <button key={v.id} aria-pressed={sheetgapV === v.id} onClick={() => { setSheetgapV(v.id); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{SHEETGAPS.find((v) => v.id === sheetgapV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 바텀시트 딤 농도 (스텝 4~8 시트가 올라올 때) — A-3 확정</b>
            {DIMS.map((v) => (
              <button key={v.id} aria-pressed={dimV === v.id} onClick={() => setDimV(v.id)}>{v.label}</button>
            ))}
            <span className="vdesc">{DIMS.find((v) => v.id === dimV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (<>
          <div className="variants">
            <b className="vtitle">1안 · AI 추천 표시 (스텝 2~5 · 스텝 1에서 →) — R-1 확정</b>
            {AIHINTS.map((v) => (
              <button key={v.id} aria-pressed={aihintV === v.id} onClick={() => setAihintV(v.id)}>{v.label}</button>
            ))}
            <span className="vdesc">{AIHINTS.find((v) => v.id === aihintV)?.desc}</span>
          </div>
          <div className="variants">
            <b className="vtitle">1안 · Agent 응답 시 하단 그라데이션 딤 — D-1 확정 (키패드 단계 제외)</b>
            {AIDIMS.map((v) => (
              <button key={v.id} aria-pressed={aidimV === v.id} onClick={() => setAidimV(v.id)}>{v.label}</button>
            ))}
            <span className="vdesc">{AIDIMS.find((v) => v.id === aidimV)?.desc}</span>
          </div>
          </>)}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">1안 · Ambient Layer (스텝 2~4 색상·용량·요금제 + 스텝 3 수령 직접 선택 시연) — A-1 확정</b>
            {AMBIENTS.map((v) => (
              <button key={v.id} aria-pressed={ambientV === v.id} onClick={() => { setAmbientV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{AMBIENTS.find((v) => v.id === ambientV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2·3안 · 신청서 2/4 주소 [검색] → 주소 검색 풀페이지 팝업 (3안 스텝 10 → 11 / 2안 스텝 9 → 10) — Z-1 확정</b>
            {ZIPPOPS.map((v) => (
              <button key={v.id} aria-pressed={zippopV === v.id} onClick={() => { setZippopV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{ZIPPOPS.find((v) => v.id === zippopV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 · 스텝 4 추천 요금제 → 모달 [다른 요금제 살펴보기] → 풀팝업 (Figma 210:124536, 스텝 3에서 →) — P-1 확정</b>
            {RECFLOWS.map((v) => (
              <button key={v.id} aria-pressed={recflowV === v.id} onClick={() => { setRecflowV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{RECFLOWS.find((v) => v.id === recflowV)?.desc}</span>
          </div>
          )}
          <div className="variants">
            <b className="vtitle">3안 · 풀팝업이 내려가는 것과 [선택됨] 변환의 맞물림 (스텝 5에서 → 스텝 6)</b>
            {FOLDSYNCS.map((v) => (
              <button key={v.id} aria-pressed={foldsyncV === v.id} onClick={() => { setFoldsyncV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{FOLDSYNCS.find((v) => v.id === foldsyncV)?.desc}</span>
          </div>
          <div className="variants">
            <b className="vtitle">3안 · 요금제 카드가 줄어들어 흰 박스가 되고 [선택됨] 으로 (스텝 5에서 → 스텝 6)</b>
            {PLANFOLDS.filter((v) => v.id[0] === 'B' || v.id === 'off').map((v) => (
              <button key={v.id} aria-pressed={planfoldV === v.id} onClick={() => { setPlanfoldV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{PLANFOLDS.find((v) => v.id === planfoldV)?.desc}</span>
          </div>
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2·3안 · 모달 안 행이 배경과 구분되지 않는 문제 (아무 모달 스텝에서나) — L-2 확정</b>
            {SHEETLOOKS.map((v) => (
              <button key={v.id} aria-pressed={sheetlookV === v.id} onClick={() => { setSheetlookV(v.id); userNav() }}>{v.label}</button>
            ))}
            <span className="vdesc">{SHEETLOOKS.find((v) => v.id === sheetlookV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2·3안 · 상품 상세에서 옵션으로 들어가는 방식 (스텝 1에서 → 스텝 2) — E-1 확정</b>
            {PDENTERS.map((v) => (
              <button key={v.id} aria-pressed={pdenterV === v.id} onClick={() => { setPdenterV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{PDENTERS.find((v) => v.id === pdenterV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2·3안 · 모달 뒤 딤 (아무 모달 스텝에서나) — G-1 확정</b>
            {DIMFXS.map((v) => (
              <button key={v.id} aria-pressed={dimfxV === v.id} onClick={() => { setDimfxV(v.id); userNav() }}>{v.label}</button>
            ))}
            <span className="vdesc">{DIMFXS.find((v) => v.id === dimfxV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 · SIM 시트 × 를 눌렀을 때 어떻게 돌아오나 (스텝 5에서 → 스텝 6, Figma 234:92897) — S-1 확정</b>
            {SIMXS.map((v) => (
              <button key={v.id} aria-pressed={simxV === v.id} onClick={() => { setSimxV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{SIMXS.find((v) => v.id === simxV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 · ∨ 등장 타이밍 (K-1 확정 · 스텝 3에서 → 스텝 4) — T-0 확정</b>
            {KNOBTIMES.map((v) => (
              <button key={v.id} aria-pressed={knobtimeV === v.id} onClick={() => { setKnobtimeV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{KNOBTIMES.find((v) => v.id === knobtimeV)?.desc}</span>
          </div>
          )}
          {SHOW_ALL && (
          <div className="variants">
            <b className="vtitle">2안 · 모달이 응답을 가릴 때 ∨ 플로팅 (Figma 210:122678, 스텝 3에서 → 스텝 4) — K-1 확정</b>
            {KNOBS.map((v) => (
              <button key={v.id} aria-pressed={knobV === v.id} onClick={() => { setKnobV(v.id); userNav(); setReplay((n) => n + 1) }}>{v.label}</button>
            ))}
            <span className="vdesc">{KNOBS.find((v) => v.id === knobV)?.desc}</span>
          </div>
          )}
          <div className="variants"><button onClick={() => { userNav(); setReplay((n) => n + 1) }}>↺ 다시 재생</button></div>
        </div>
      )}
      {webV === 'WC' ? (
        /* 웹 셸 시안 W-C: 3안 나란히. 같은 스텝 번호를 함께 넘긴다 */
        <main className="stage compare">
          <button className="round" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전">←</button>
          <div className="phones3">
            {PROPOSALS.map((p) => { const st = p.steps[Math.min(cur, p.steps.length - 1)]; const over = cur > p.steps.length - 1; return (
              <div className={`col ${p.id === pid ? 'on' : ''}`} key={p.id} onClick={() => pick(p.id)}>
                <div className="col-head"><span className="num">{p.id}안</span><b>{p.short}</b><em>{p.status}</em></div>
                <div className="scaled"><Phone key={`${replay}-${p.id}`} view={st.view} /></div>
                <div className="col-foot"><span className="no num">{over ? '—' : `STEP ${cur + 1}`}</span><span>{over ? '이 안은 여기서 끝' : st.screen}</span></div>
              </div>
            ) })}
          </div>
          <button className="round" onClick={() => go(cur + 1)} disabled={cur >= Math.max(...PROPOSALS.map((p) => p.steps.length)) - 1} aria-label="다음">→</button>
        </main>
      ) : (
      <main className="stage">
        {navV === 'R1' && (webV === 'WB'
          ? <AnPanel wb={wbV} pid={pid} pick={pick} sc={sc} cur={cur} go={go} />   /* 웹 셸 W-B: 왼쪽 패널에 '안' 층 (세부 시안 B1/B2/B3) */
          : <StepNav variant="R1" cur={cur} go={go} sc={sc} />)}
        <button className="round" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="이전">←</button>
        <div className="phone-wrap"><Phone key={`${replay}-${pid}`} view={step.view} /><DoneToast show={doneToast} onNext={nextTest} /></div>
        <button className="round" onClick={() => go(cur + 1)} disabled={cur === steps.length - 1} aria-label="다음">→</button>

        <aside className="cards" key={step.id}>
          <div className="card fade">
            <div className="who">
              <div className="avatar" />
              <div><b>고객 {persona.name}</b><br /><span>{persona.summary}</span></div>
            </div>
            {step.utterance
              ? <div className="bubble">“{step.utterance}”</div>
              : <div className="bubble none">{step.utteranceNote}</div>}
          </div>
          <div className="card req-card fade" style={{ animationDelay: '60ms' }}>
            <div className="steplabel">
              <span className="no num">STEP {cur + 1}</span>
              <ZoneTag zone={step.zone} />
              <span>{step.screen}</span>
            </div>
            <div className="kicker">이 스텝의 [목적]</div>
            <ul className="req">
              {step.purpose.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </aside>
      </main>
      )}
    </>
  )
}
