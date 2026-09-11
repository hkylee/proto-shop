// NEXT DS IconItem — Figma NftD7SW7XAhm4VkeYk8omQ / IconItem(54182:37246)에서 내려받은 SVG.
// 각 SVG는 24px 박스 안의 Shape만 담고 있어, Figma의 inset 값으로 박스 안에 배치한다.
const box = (size) => ({ position: 'relative', width: size, height: size, flex: 'none', display: 'inline-block' })
const shape = (inset) => ({ position: 'absolute', inset, width: 'auto', height: 'auto' })

function DsIcon({ src, inset, size = 24, alt = '', className }) {
  return (
    <span style={box(size)} className={className} aria-hidden={alt === ''}>
      <img src={src} alt={alt} style={shape(inset)} />
    </span>
  )
}

export const IcoBack      = ({ size }) => <DsIcon size={size} src="/icons/ds/back.svg"    inset="12.5% 41.67% 12.5% 16.67%" />
export const IcoNewChat   = ({ size }) => <DsIcon size={size} src="/icons/ds/newchat.svg" inset="14.5% 14.5% 14.5% 14.5%" />
export const IcoVoice     = ({ size, className }) => <DsIcon size={size} className={className} src="/icons/ds/voice.svg"   inset="20.83% 17.71%" />
export const IcoWon       = ({ size }) => <DsIcon size={size} src="/icons/ds/won.svg"     inset="21.25% 10%" />
// SearchAi·인사이트의 AI 스파클: DS Navigate/AI(ai.svg, 둥근 4각 별)는 16px 에서 덩어리로 보여 Figma 12349:37312 렌더처럼 오목한 4점 스파클로 그림
export const IcoSparkle   = ({ size, className }) => <DsIcon size={size} className={className} src="/icons/ds/ai-sparkle.svg" inset="0" />
export const IcoSparkleAi = ({ size }) => <DsIcon size={size} src="/icons/ds/tagent.svg"  inset="12.5% 11% 12.5% 11%" /> // IconItem/Navigate · TAgent

// IconItem/Logo
// BadgeIconGroup 의 로고 (Figma ixGPs9 27:27003 · IconItem/Logo Netflix·Flo): 16px 둥근 사각(4px).
// Netflix = 실제 로고 PNG(검정 바탕 + 빨간 N), FLO = DS flo.svg(남보라 바탕 + F). 둘 다 이미지를 16px 에 맞춰 넣는다.
export const IcoBrand = ({ letter = 'N', size = 16 }) =>
  letter === 'F'
    ? <img className="brand-badge" src="/icons/ds/flo.svg" alt="" style={{ width: size, height: size }} aria-hidden />
    : <span className="brand-badge nf" style={{ width: size, height: size }} aria-hidden><img src="/icons/ds/netflix.png" alt="" /></span>   /* PNG 는 원형 로고 → 검정 둥근 사각 안에 확대해 넣어 Figma 의 사각 배지로 */
