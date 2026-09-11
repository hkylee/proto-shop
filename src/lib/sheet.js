import { useEffect, useRef, useState } from 'react'

// 바텀시트의 세 단계를 한 훅으로: 열림(shown = val) → 닫히는 중(shown = 직전 값 유지 · out = 그 값) → 사라짐.
//  - 내려가는 동안 내용을 유지해야 빈 껍데기가 줄어들며 내려가지 않는다 (2026-09-08)
//  - .out 은 닫힐 때만 붙어 X-2 제자리 디졸브가 올라오기 직전 상태(화면 밖)와 섞이지 않는다
// keepMs = 시트가 내려가는 시간(R-2 0.8s + 여유), outMs = X-2 디졸브 0.45s + 여유. 시안 값이 바뀌면 여기 한 곳만 고친다.
export const SHEET_KEEP_MS = 900
export const SHEET_OUT_MS = 520

// closed = '닫힘'을 뜻하는 값 (AgentChat 은 0, AgentChat2 는 null — 2안은 턴 인덱스 0 이 유효한 시트 값)
export function useSheetOut(val, { keepMs = SHEET_KEEP_MS, outMs = SHEET_OUT_MS, closed = null } = {}) {
  const [keep, setKeep] = useState(val)
  const [out, setOut] = useState(closed)
  const prev = useRef(val)
  useEffect(() => {
    const was = prev.current; prev.current = val
    if (val !== closed) { setKeep(val); return }
    if (was === closed) return
    setOut(was)
    const t1 = setTimeout(() => setOut(closed), outMs), t2 = setTimeout(() => setKeep(closed), keepMs)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [val, keepMs, outMs, closed])
  return { shown: val !== closed ? val : keep, out }
}
