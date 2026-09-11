# SK텔레콤 디자인 시스템 컴포넌트 레퍼런스

- 출처: https://ds-portal-psi.vercel.app/ (SB studio 디자인 시스템 관리 포털)
- 추출일: 2026-09-01
- 컴포넌트 수: 153개 (버전 v0.6.0 기준)
- 이 문서는 각 컴포넌트의 용도(What/Why/When), 선택 조건, Variant 구성, 디자인 규칙(Do/Don't),
  배치 가능 영역, 슬롯 자식, 포함 컴포넌트, 사용 텍스트 스타일을 정리한 것입니다.
  (토큰 커버리지/색상 값 등 구현 세부 사항은 용량상 생략했습니다 — 필요시 포털에서 직접 확인)

다른 Claude 세션에서 이 디자인 시스템 컴포넌트를 참고하려면, 이 파일을 프로젝트에 함께 두고
"ds-portal-components.md 참고해서 작업해줘"처럼 안내하면 됩니다.

---

## Accordion

용도What헤더 행을 탭하면 슬롯 영역이 펼쳐지는, 4가지 스타일(Info/Product/Price/Notice)을 지원하는 접기·펼치기 컴포넌트입니다.Why필수 정보지만 자주 쓰지 않거나 한 번에 많은 정보를 제공할 때, 제한된 화면 영역에서 선택적으로 보여주기 위해 사용합니다.When항상 노출할 필요 없는 부가 정보·기능을 접어두고 필요 시 펼쳐야 할 때 사용합니다.

선택 조건Use when콘텐츠를 접어두었다가 사용자 선택 시 펼쳐 보여줘야 할 때 사용합니다.

구성 — Variant VariantsInfo제목 텍스트와 화살표만으로 구성된 기본 정보형입니다.  · 구분: 단순 텍스트 콘텐츠를 접어둘 때 사용합니다.Product썸네일 이미지·제목·서브타이틀과 화살표로 구성됩니다.  · 구분: 상품이나 서비스 정보를 접어둘 때 사용합니다.Price제목·Info 버튼·금액/수량 텍스트와 화살표로 구성됩니다.  · 구분: 가격·결제 정보를 접어둘 때 사용합니다.Notice제목·NEW 배지·캡션 텍스트와 화살표로 구성됩니다.  · 구분: 공지나 신규 강조 정보를 표시할 때 사용합니다.

구성 — Variant DisclosureOn콘텐츠가 펼쳐진 상태입니다.  · 구분: 기본으로 열려 있어야 할 때 사용합니다.Off콘텐츠가 접힌 초기 상태입니다.  · 구분: 기본으로 열려 있어야 할 때 사용합니다.

디자인 규칙Do슬롯 영역에 콘텐츠를 삽입하여 Disclosure=On 상태에서 표시합니다.Don't슬롯 콘텐츠는 Disclosure=Off 상태에서 렌더링되지 않습니다.ShowButtonInfo=false일 때 Info 아이콘 버튼을 함께 지정하지 않습니다.

배치 가능 영역Page Slot, Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AlertCellDescriptionCellLeftTableCellRightTableCellSelectCellThumbnailCellTitleColumnDividerInsetSelect

포함하는 컴포넌트 (7)BadgeGroupButtonIconItemDividerInsetmotionThumbnailRoundItemBadgeItem↳BadgeGroupIconItem↳ButtonIconItem

사용 텍스트 스타일 (5)Body/14 mediumBody/15 mediumBody/16 semiboldCaption/13 mediumTitle/18 semibold

---

## Alert

용도What제목과 설명 텍스트로 구성된, 관련 콘텐츠 안에 놓이는 알림 박스입니다.Why사용자에게 정보나 위험 상황을 메시지로 전달하기 위해 사용합니다.When특정 콘텐츠에 대한 안내나 경고를 그 콘텐츠 옆에 함께 보여줘야 할 때 사용합니다.

선택 조건Use when특정 콘텐츠와 묶여 지속적으로 노출되는 안내·경고 메시지가 필요할 때 사용합니다.Don't use when일시적이고 자동 소멸하는 피드백이면 Toast를 사용합니다.유사 컴포넌트ToastAlert는 특정 콘텐츠에 묶여 지속 노출되지만, Toast는 일시적이고 자동 소멸합니다.

구성 — Variant VariantsVariants 값별 규칙이 없습니다.

디자인 규칙Do관련 콘텐츠와 같은 섹션 안에 배치해 시각적으로 연결합니다.Don'tAlert를 단독으로 SectionStack에 배치하지 않습니다.ShowTitle이 false일 때 Title을 함께 지정하지 않습니다.

배치 가능 영역Accordion 슬롯, BottomSheetAi 슬롯, Dialog 슬롯, BottomSheet 슬롯, Layout Frame

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (2)Body/14 regularBody/14 semibold

---

## Appbar

용도What뒤로가기(좌측)·페이지 타이틀(중앙)·아이콘 액션(우측)으로 구성된 상단 내비게이션 바입니다.Why사용자가 현재 위치를 파악하고, 이전 단계로 돌아가거나 주요 페이지로 이동할 수 있도록 하기 위해 사용합니다.When화면 최상단에 내비게이션과 주요 액션이 필요할 때 사용합니다.

선택 조건Use when일반 콘텐츠 페이지의 상단 내비게이션이 필요할 때 사용합니다.Don't use whenAI 서비스 화면(홈/채팅)이면 AppbarAi를 사용합니다.유사 컴포넌트AppbarAiAppbar는 일반 화면용이고, AppbarAi는 AI 전용 아이콘 구성(Barcode/Cart/Menu, History/NewChat)을 포함합니다.

구성 — Variant VariantsDefault기본 앱바입니다.  · 구분: 일반 배경 화면에서 사용합니다.Inverse어두운 배경 위에서 사용합니다.  · 구분: 텍스트·아이콘이 흰색으로 표시됩니다.

디자인 규칙Do좌측 AppbarItem은 뒤로가기(Back) 아이콘으로, 우측 AppbarItem은 기능 아이콘으로 구성합니다.Don'tAI 화면에 Appbar를 사용하지 않습니다 (AppbarAi를 사용합니다).

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (3)AppbarItemButtonIconItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Title/18 semibold

---

## AppbarItem

용도What1~3개의 ButtonIconItem으로 구성된 Appbar 좌·우측 버튼 그룹 아이템입니다.WhyAppbar 좌측(뒤로가기)과 우측(기능 아이콘)의 버튼 수에 맞는 레이아웃을 제공하기 위해 사용합니다.

선택 조건Use whenAppbar 좌·우측 버튼 영역 구성 요소로 사용합니다.유사 컴포넌트AppbarAiItemAppbarItem은 일반 ButtonIconItem을 사용하고, AppbarAiItem은 AI 전용 ButtonIconAiItem을 사용합니다.

구성 — Variant Variants1Button아이콘 버튼 1개입니다.  · 구분: 좌측 뒤로가기 또는 단일 우측 액션에 사용합니다.2Button아이콘 버튼 2개입니다.  · 구분: 우측에 액션 2개가 필요할 때 사용합니다.3Button아이콘 버튼 3개입니다.  · 구분: 우측에 액션 3개가 필요할 때 사용합니다.

디자인 규칙DoAppbar 내부에서만 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

---

## AppbarAi

용도WhatAI 홈 또는 AI 채팅 화면에 맞는 아이콘 구성을 갖춘 AI 전용 상단 내비게이션 바입니다.WhyAI 화면의 맥락에 맞는 내비게이션과 주요 액션을 상단에 고정 제공하기 위해 사용합니다.WhenAI 전용 홈 화면 또는 AI 채팅 화면의 최상단에 배치할 때 사용합니다.

선택 조건Use whenAI 서비스 화면(홈/채팅)의 상단 내비게이션이 필요할 때 사용합니다.Don't use when일반 콘텐츠 페이지 또는 AI와 무관한 화면이면 Appbar를 사용합니다.유사 컴포넌트AppbarAppbarAi는 AI 전용 아이콘 구성(Barcode/Cart/Menu, History/NewChat)을 포함하고, Appbar는 일반 화면용입니다.

구성 — Variant VariantsHomeAI 홈 화면용입니다.  · 구분: 우측에 Barcode·Cart·Menu 아이콘 3개를 배치합니다.ChatAI 채팅 화면용입니다.  · 구분: 좌측에 Back 버튼과 채팅명 표시, 우측에 History·NewChat 아이콘을 배치합니다.

디자인 규칙Do화면 유형(Home/Chat)에 맞는 Variants를 선택하여 사용합니다.Don'tAI 화면이 아닌 일반 화면에 사용하지 않습니다. 두 Variants를 같은 화면에 중복 배치하지 않습니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (3)AppbarAiItemButtonIconAiItemIconItem↳ButtonIconAiItem

사용 텍스트 스타일 (1)Body/14 medium

---

## AppbarAiItem

용도What1~3개의 ButtonIconAiItem으로 구성된 AppbarAi 좌·우측 버튼 그룹 아이템입니다.WhyAppbarAi 좌·우측의 AI 전용 버튼 수에 맞는 레이아웃을 제공하기 위해 사용합니다.

선택 조건Use whenAppbarAi 좌·우측 버튼 영역 구성 요소로 사용합니다.유사 컴포넌트AppbarItemAppbarAiItem은 AI 전용 ButtonIconAiItem을 사용하고, AppbarItem은 일반 ButtonIconItem을 사용합니다.

구성 — Variant Variants1ButtonButtonIconAiItem 1개입니다. · 구분: 좌측 뒤로가기 또는 단일 우측 액션에 사용합니다.2ButtonButtonIconAiItem 2개입니다. · 구분: 우측에 AI 액션 2개가 필요할 때 사용합니다.3ButtonButtonIconAiItem 3개입니다. · 구분: 우측에 AI 액션 3개가 필요할 때 사용합니다.

디자인 규칙DoAppbarAi 내부에서만 사용합니다.Don't일반 Appbar에서 사용하지 않습니다 (AppbarItem을 사용합니다).

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconAiItemIconItem↳ButtonIconAiItem

---

## BadgeGroup

용도WhatBadgeItem을 1~7개까지 가로로 나열하는 뱃지 그룹입니다.Why여러 상태·속성 뱃지를 한 줄로 묶어 표시하기 위해 사용합니다.When항목에 여러 개의 텍스트 뱃지를 동시에 표시해야 할 때 사용합니다.

선택 조건Use when텍스트 뱃지 2개 이상을 가로로 나열해야 할 때 사용합니다.Don't use when뱃지에 로고 아이콘이 함께 표시되어야 하거나, 텍스트 뱃지가 1개뿐일 때는 사용하지 않습니다.유사 컴포넌트BadgeIconGroup로고 아이콘이 포함된 뱃지를 나열할 때 사용합니다.

디자인 규칙Do실제 표시할 뱃지 수에 맞는 Variants를 선택합니다.Don't실제 뱃지 수와 다른 Variants를 사용하지 않습니다. (빈 슬롯이 생깁니다.)

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)BadgeItem

---

## BadgeIconGroup

용도WhatBadgeIconItem을 1~5개까지 가로로 나열하는 아이콘 뱃지 그룹입니다.Why여러 브랜드·파트너 혜택 뱃지를 한 줄로 묶어 표시하기 위해 사용합니다.When항목에 여러 개의 아이콘 뱃지를 동시에 표시해야 할 때 사용합니다.

선택 조건Use when로고 아이콘이 포함된 뱃지 2개 이상을 가로로 나열해야 할 때 사용합니다.Don't use when뱃지가 텍스트 레이블만으로 충분하거나, 아이콘 뱃지가 1개뿐일 때는 사용하지 않습니다.유사 컴포넌트BadgeGroup텍스트 레이블만 있는 뱃지를 나열할 때 사용합니다.

디자인 규칙Do실제 표시할 뱃지 수에 맞는 Variants를 선택합니다.Don't실제 뱃지 수와 다른 Variants를 사용하지 않습니다. (빈 슬롯이 생깁니다.)

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)BadgeIconItemIconItem↳BadgeIconItem

---

## BadgeItem

용도What텍스트 레이블 하나로 상태·카테고리 등 부가 정보를 표시하는 소형 뱃지입니다.Why목록·카드·테이블에서 항목의 상태나 속성을 간결하게 나타내기 위해 사용합니다.When콘텐츠에 상태·카테고리 등 부가적 강조 표시가 필요할 때 사용합니다.

선택 조건Use when클릭 없이 상태·속성 정보를 시각적으로 표시해야 할 때 사용합니다.Don't use when아이콘과 함께 브랜드·파트너 뱃지가 필요하면 BadgeIconItem을 사용합니다.유사 컴포넌트BadgeIconItemBadgeItem은 텍스트 레이블만 표시하고, BadgeIconItem은 로고 아이콘과 텍스트를 함께 표시합니다.

디자인 규칙Do상태·속성 정보를 간결하게 표시하는 용도로 사용합니다.Don't클릭 액션을 연결하지 않습니다. (onclick 기능을 제공하지 않습니다)

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## BadgeIconItem

용도What1~3개의 로고 아이콘과 Label·Caption 텍스트로 구성된 뱃지입니다.Why브랜드·파트너 로고를 텍스트와 함께 표시하여 제휴·혜택 정보를 전달하기 위해 사용합니다.When제휴사·파트너 브랜드 로고와 레이블을 함께 표시해야 할 때 사용합니다.

선택 조건Use when아이콘(로고)과 텍스트를 함께 표시하는 뱃지가 필요할 때 사용합니다.Don't use when텍스트 레이블만 필요하면 BadgeItem을 사용합니다.유사 컴포넌트BadgeItemBadgeIconItem은 로고 아이콘과 텍스트를 함께 표시하고, BadgeItem은 텍스트 레이블만 표시합니다.

디자인 규칙Do배지 그룹, 카드 내부, 리스트 내부 등 상위 컴포넌트나 콘텐츠 그룹 안에서 사용합니다.기본 `BadgeIconItem`은 content-hug로 사용합니다.Badge 컴포넌트 내부의 아이콘+텍스트 조합 항목으로 사용한다.기본 16px 로고 아이콘을 사용한다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Caption/12 medium

---

## Banner

용도What이미지·Title·Subtitle 텍스트와 인디케이터로 구성된, 가로 전체를 차지하는 배너입니다.Why이벤트·광고처럼 사용자의 시선을 끌어야 하는 콘텐츠를 넓은 영역으로 노출하기 위해 사용합니다.When화면 상단 또는 콘텐츠 섹션 사이에 이미지 배너를 표시할 때 사용합니다.

선택 조건Use when이미지를 포함한 프로모션·이벤트 배너가 필요할 때 사용합니다.

구성 — Variant VariantsSmall높이가 낮은 소형 배너입니다. · 구분: 간결한 프로모션 메시지를 표시할 때 사용합니다.Medium높이가 큰 중형 배너입니다. · 구분: 이미지 비중이 높고 강조가 필요한 프로모션에 사용합니다.

디자인 규칙Do여러 장 슬라이드 배너에는 ShowIndicator=true로 인디케이터를 함께 표시합니다.Don't배너 이미지 수와 인디케이터 수를 다르게 지정하지 않습니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (5)BannerImageItemchipRowIndicatorItemChipItem↳chipRowIndicatorDotItem↳IndicatorItem

---

## BannerImageItem

용도WhatBanner 안에서 이미지와 배경 색상을 담당하는 이미지 영역 아이템입니다.WhyBanner 크기에 맞는 이미지 영역을 제공하기 위해 사용합니다.

선택 조건Use when내부 이미지 영역 구성 요소로 사용합니다.

구성 — Variant VariantsSmallBanner=Small에 대응하는 소형 이미지 영역입니다.MediumBanner=Medium에 대응하는 중형 이미지 영역입니다.

디자인 규칙DoBanner의 Variants에 맞는 BannerImageItem Variants를 사용합니다 (Small↔Small, Medium↔Medium).Don'tBanner 외부에서 단독으로 사용하지 않습니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (4)Body/14 semiboldBody/16 semiboldCaption/10 mediumCaption/12 medium

---

## BottomGroup

용도What싱글 또는 듀얼 버튼을 묶어 바텀시트·화면 하단에 고정하는 CTA 그룹 컨테이너입니다.Why보조 작업의 주요 액션을 화면 하단에서 명확하게 제공하기 위해 사용합니다.When바텀시트 또는 화면 하단에 CTA 버튼 그룹이 필요할 때 사용합니다.

선택 조건Use when일반 버튼(Button) 기반의 하단 CTA 그룹이 필요할 때 사용합니다.Don't use whenAI 기능 CTA 그룹이 필요하면 BottomGroupAi를 사용합니다.유사 컴포넌트BottomGroupAiBottomGroup은 일반 Button 기반이고, BottomGroupAi는 AI NavigationButtonItem을 포함합니다.

구성 — Variant UpperVariantsText버튼 위에 보조 정보(BottomGroupUpperItem)를 표시합니다. 결제 금액·예약 정보 등 맥락 확인이 필요할 때 사용합니다.ChipFilter버튼 위에 칩 필터 형태의 보조 선택 항목을 표시하며, 필터 조건 선택과 CTA가 함께 필요할 때 사용합니다.

디자인 규칙Do버튼 구성(1개/2개)은 BottomGroupAreaItem의 Variants로 제어합니다.Label은 줄바꿈되지 않고 영역내 말줄임 처리됩니다.
Label01, Label02는 최대 1줄로 표기합니다.Title과 Caption은 최대 표시 줄 수를 초과할 경우 말줄임(ellipsis) 처리합니다.
Title과 Caption은 최대 1줄로 표기합니다.Don'tTitle과 Caption은 최대 표시 줄 수를 초과할 경우 말줄임(ellipsis) 처리합니다.
Title과 Caption은 최대 1줄로 표기합니다.BottomGroup은 UpperItem에
AiSuggestion 베리언츠를 선택할 수 없습니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (11)BottomGroupAreaItemBottomGroupLowerItemBottomGroupUpperItemchipRowButton↳BottomGroupAreaItemButtonText↳BottomGroupUpperItemChipFilterItem↳BottomGroupUpperItemChipItem↳chipRowIconItem↳BottomGroupUpperItemButtonIconItem↳ChipFilterItemButtonLoaderItem↳Button

---

## BottomGroupAreaItem

용도WhatBottomGroup 안에서 1개 또는 2개의 Button을 배치하는 버튼 영역 아이템입니다.WhyCTA 버튼 수에 따라 레이아웃을 맞추기 위해 사용합니다.

선택 조건Use whenBottomGroup 내 버튼 영역 구성 요소로 사용합니다.유사 컴포넌트BottomGroupAiAreaItemBottomGroupAreaItem은 일반 Button을 사용하고, BottomGroupAiAreaItem은 NavigationButtonItem을 포함합니다.

디자인 규칙Do내부에서만 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (3)ButtonButtonLoaderItem↳ButtonIconItem↳Button

---

## BottomGroupLowerItem

용도What버튼 영역 아래에 가운데 정렬로 놓이는 텍스트버튼 한 줄입니다.Why주 액션을 선택하지 않는 사용자에게 빠져나갈 경로를 CTA 버튼 바로 아래에서 제공하기 위해 사용합니다.WhenCTA 버튼과 함께 '건너뛰기·나중에 하기·다른 방법으로' 같은 보조 선택지를 노출할 때 사용합니다.

선택 조건Use whenCTA 버튼 아래에 '나중에 하기'처럼 낮은 비중의 보조 선택지 한 줄이 필요할 때 사용합니다.

디자인 규칙DoBottomGroup·BottomGroupAi의 ShowLowerItem이 true일 때 사용합니다.주 액션(CTA 버튼)을 대신할 보조 선택지를 텍스트버튼 한 개로 제공합니다.Don'tBottomGroup·BottomGroupAi 밖에서 단독으로 사용하지 않습니다.주 액션과 같은 비중의 문구를 넣지 않습니다. (CTA 버튼과 경쟁합니다.)

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonTextIconItem↳ButtonText

---

## BottomGroupUpperItem

용도What왼쪽 Title 텍스트와 오른쪽 Caption 텍스트로 구성된, 버튼 상단의 보조 정보 행입니다.WhyCTA 버튼을 누르기 전 사용자가 확인해야 할 금액·요약 정보를 제공하기 위해 사용합니다.When결제 금액 확인, 예약 정보 요약 등 버튼 액션 전 보조 정보가 필요할 때 사용합니다.

선택 조건Use whenBottomGroup 위에 라벨+값 형태의 보조 정보 한 줄이 필요할 때 사용합니다.유사 컴포넌트bottomgroupaiupperitem-55433-35204BottomGroupUpperItem은 일반 텍스트(Title+Caption) 구성이고, BottomGroupAIUpperItem은 AI 아이콘+안내 텍스트 구성입니다.

구성 — Variant VariantsText라벨과 값을 좌우로 나눈 한 줄을 표시하며, 결제 금액·예약 정보 등 확인이 필요할 때 사용합니다.ChipFilter적용된 필터를 칩으로 나열하며, 필터 조건을 확인하고 개별 해제할 수 있어야 할 때 사용합니다.AiSuggestionAI 아이콘과 안내 문구를 한 줄로 표시하며, AI 제안·설명을 전달할 때 사용합니다. BottomGroupAi 안에서만 선택할 수 있습니다.

디자인 규칙DoBottomGroup의 ShowUpperItem=true일 때 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (6)ButtonTextChipFilterItemchipRowIconItemButtonIconItem↳ChipFilterItemChipItem↳chipRow

사용 텍스트 스타일 (3)Body/14 mediumBody/14 regularBody/14 semibold

---

## BottomGroupAi

용도WhatAI 내비게이션 버튼(NavigationButtonItem)을 포함한 AI 전용 하단 CTA 그룹입니다.WhyAI 기능의 주요 액션을 일반 CTA와 시각적으로 구분하며 제공하기 위해 사용합니다.WhenAI 바텀시트(BottomSheetAi) 하단에 CTA 그룹이 필요할 때 사용합니다.

선택 조건Use whenAI 기능 전용 하단 CTA 그룹이 필요할 때 사용합니다.Don't use when일반 버튼 CTA 그룹이 필요하면 BottomGroup을 사용합니다.유사 컴포넌트BottomGroupBottomGroupAi는 NavigationButtonItem(AI 전용 버튼)을 포함하고, BottomGroup은 일반 Button을 사용합니다.

구성 — Variant UpperVariantsText버튼 위에 보조 정보(BottomGroupUpperItem)를 표시합니다. 결제 금액·예약 정보 등 맥락 확인이 필요할 때 사용합니다.ChipFilter버튼 위에 칩 필터 형태의 보조 선택 항목을 표시하며, 필터 조건 선택과 CTA가 함께 필요할 때 사용합니다.AiSuggestion버튼 위에 보조 정보(BottomGroupUpperItem)를 표시합니다. AI 제안·설명이 필요할 때 사용합니다.

디자인 규칙Do버튼 구성(1개/2개)은 BottomGroupAiAreaItem의 Variants로 제어합니다.Label은 줄바꿈되지 않고 말줄임 처리됩니다.
Label01, Label02는 최대 1줄로 표기합니다.Don'tDescription은 최대 표시 줄 수를 초과할 경우 말줄임(ellipsis) 처리합니다.
Description은 최대 2줄로 표기합니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (13)BottomGroupAiAreaItemBottomGroupUpperItemchipRowButton↳BottomGroupAiAreaItemButtonText↳BottomGroupUpperItemChipFilterItem↳BottomGroupUpperItemChipItem↳chipRowDividerContentsItem↳BottomGroupAiAreaItemIconItem↳BottomGroupUpperItemNavigationButtonItem↳BottomGroupAiAreaItemButtonIconItem↳ChipFilterItemButtonLoaderItem↳ButtonNavigationTabItem↳NavigationButtonItem

인터랙션 콜백 (2)onLabel01Click() => voidButton01Label 버튼 클릭 콜백 전달 통로(BottomGroupAiAreaItem 경유) — FO/BO 연결용 훅, 현재 내장 동작 없음onLabel02Click() => voidButton02Label 버튼 클릭 콜백 전달 통로(BottomGroupAiAreaItem 경유) — FO/BO 연결용 훅, 2Button 전용

---

## BottomGroupAiAreaItem

용도WhatBottomGroupAi 안에서 NavigationButtonItem(AI 전용)과 Button을 배치하는 버튼 영역 아이템입니다.WhyBottomGroupAi의 버튼 수에 따라 레이아웃을 맞추기 위해 사용합니다.

선택 조건Use whenBottomGroupAi 내 버튼 영역 구성 요소로 사용합니다.유사 컴포넌트BottomGroupAreaItemBottomGroupAiAreaItem은 NavigationButtonItem(AI 전용 둥근 버튼)을 포함하고, BottomGroupAreaItem은 일반 Button만 사용합니다.

구성 — Variant Variants1ButtonNavigationButtonItem(AI 버튼) 1개 + Primary Button 1개 구성입니다.2ButtonNavigationButtonItem(AI 버튼) + 2분할 버튼(Label01|Divider|Label02) 구성입니다.

디자인 규칙DoBottomGroupAi 내부에서만 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (7)ButtonDividerContentsItemNavigationButtonItemButtonIconItem↳NavigationButtonItemButtonLoaderItem↳ButtonIconItem↳ButtonNavigationTabItem↳NavigationButtonItem

인터랙션 콜백 (2)onLabel01Click() => voidButton01Label 버튼 클릭 콜백 — FO/BO 연결용 훅(현재 내장 동작 없음, 1Button/2Button 공통)onLabel02Click() => voidButton02Label 버튼 클릭 콜백 — FO/BO 연결용 훅(현재 내장 동작 없음, 2Button 전용)

---

## BottomSheet

용도What화면 하단에서 슬라이드업되어 현재 화면 위에 겹쳐지는 시트 형태의 보조 콘텐츠 영역입니다.Why현재 화면을 벗어나지 않고 옵션 선택·상세 필터 등 보조 작업을 처리하기 위해 사용합니다.When현재 페이지 맥락을 유지하면서 추가 입력·선택·정보 확인이 필요할 때 사용합니다.

선택 조건Use when페이지 이동 없이 보조 작업을 처리해야 할 때 사용합니다.Don't use whenAI 기능 전용 바텀시트가 필요하면 BottomSheetAi를 사용합니다.유사 컴포넌트BottomSheetAiBottomSheet는 일반 콘텐츠용이고, BottomSheetAi는 AI 기능 전용 글로우 스타일입니다.

디자인 규칙Do슬롯 콘텐츠를 넣을 때 별도 좌우 여백을 추가하지 않습니다.
(슬롯 내부에 좌우 패딩 20이 내장되어 있습니다.)Title과 Description은 최대 표시 줄 수를 초과할 경우 말줄임(ellipsis) 처리합니다.
Title은 최대 1줄, Description은 최대 3줄로 표기합니다. (BottomGroup 요소는 BottomGroup 가이드를 참고해주세요. TabScroll은 TabScroll 가이드를 참고해주세요.)Don't슬롯 영역에 임의 콘텐츠를 삽입할 때 좌우 패딩을 이중으로 추가하지 않습니다.
(여백이 중복됩니다.)

배치 가능 영역Page Slot, 템플릿 고정 영역

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AlertBottomSheetSelectedOptionItemBottomSheetSelectItemCarouselItemCellBrandCellDescriptionCellLeftTableCellPaymentCellRightTableCellSelectCellThumbnailCellTitleColumnDatePickerDividerInsetInputSearchTitleGroupSection

포함하는 컴포넌트 (15)BottomGroupBottomSheetHandleItemchipRowIconItemTabScrollBottomGroupAreaItem↳BottomSheetBottomGroupLowerItem↳BottomGroupBottomGroupUpperItem↳BottomGroupChipItem↳chipRowTabScrollItem↳TabScrollButton↳BottomGroupAreaItemButtonText↳BottomGroupUpperItemChipFilterItem↳BottomGroupUpperItemButtonIconItem↳ChipFilterItemButtonLoaderItem↳Button

사용 텍스트 스타일 (2)Body/14 mediumTitle/20 semibold

---

## BottomSheetHandleItem

용도What바텀시트 상단 중앙에 표시되는 짧은 바 형태의 드래그 핸들입니다.Why스와이프 다운으로 바텀시트를 닫을 수 있음을 시각적으로 안내하기 위해 사용합니다.

선택 조건Use whenBottomSheet 또는 BottomSheetAi의 Handle 방식 variant 내부 구성 요소로 사용합니다.

디자인 규칙DoVarients=Handle 방식의 바텀시트 상단에만 사용합니다.Don'tCloseButton 방식의 바텀시트에서 동시에 사용하지 않습니다 (핸들과 닫기 버튼은 함께 쓰지 않습니다).

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## BottomSheetSelectedOptionItem

용도What선택된 옵션 값(Value01~03)과 가격, 수량 조절 스피너를 한 블록으로 묶어 표시하는 요약 아이템입니다.Why옵션 선택 바텀시트에서 현재 선택된 값과 최종 가격·수량을 확인하고 조절하기 위해 사용합니다.When상품 옵션 선택 바텀시트에서 선택된 옵션 정보를 요약하여 보여줄 때 사용합니다.

선택 조건Use when선택된 옵션 요약과 수량 조절이 함께 필요한 바텀시트에 사용합니다.Don't use when단순 선택 목록만 필요하면 BottomSheetSelectItem을 사용합니다.

디자인 규칙Do바텀시트 내에서 선택된 옵션 요약 영역으로 사용합니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (5)ButtonIconItemCellCountPriceIconItem↳ButtonIconItemNumericSpinnerItem↳CellCountPriceNumericSpinnerButtonItem↳NumericSpinnerItem

사용 텍스트 스타일 (1)Body/16 regular

---

## BottomSheetSelectItem

용도What바텀시트 안에서 단일 또는 드릴다운 선택을 위한 목록 항목입니다.Why바텀시트 내 선택 목록에서 선택 상태와 하위 펼침 여부를 명확히 표현하기 위해 사용합니다.

선택 조건Use when바텀시트 내 선택 목록의 개별 항목이 필요할 때 사용합니다.Don't use when바텀시트 외부에서 목록 항목이 필요하면 Cell 계열 컴포넌트를 사용합니다.

구성 — Variant DisclosureOn · 구분: 탭 시 하위 내용이 펼쳐지는 드릴다운 항목에 사용합니다.Off · 구분: 하위 내용이 없거나 펼침이 필요 없을 때 사용합니다.

구성 — Variant SelectionSelected · 구분: 선택된 상태의 항목에 사용합니다.Unselected · 구분: 선택되지 않은 상태의 항목에 사용합니다.

디자인 규칙Do바텀시트 내부에서만 사용합니다.Don't바텀시트 외부에 단독으로 배치하지 않습니다.

배치 가능 영역Page Slot, Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CellDescriptionCellTitleDividerInset

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/16 medium

---

## BottomSheetAi

용도What글로우 효과가 적용된 AI 전용 바텀시트로, 하단에 AI 내비게이션 버튼(NavigationButtonItem)을 포함합니다.WhyAI 기능 진입 및 상호작용을 일반 바텀시트와 시각적으로 구분하기 위해 사용합니다.WhenAI 기능과 관련된 보조 작업을 처리할 때 사용합니다.

선택 조건Use whenAI 기능 전용 바텀시트가 필요할 때 사용합니다.Don't use when일반 콘텐츠 바텀시트가 필요하면 BottomSheet를 사용합니다.유사 컴포넌트BottomSheetBottomSheetAi는 AI 전용 글로우 스타일과 AI 내비게이션 버튼을 포함하고, BottomSheet는 일반 콘텐츠용입니다.

디자인 규칙DoAI 기능 전용으로만 사용합니다.Title과 Description은 최대 표시 줄 수를 초과할 경우 말줄임(ellipsis) 처리합니다.
Title은 최대 1줄, Description은 최대 3줄로 표기합니다. (BottomGroupAi 요소는 BottomGroupAi 가이드를 참고해주세요.
TabScroll은 TabScroll 가이드를 참고해주세요.)Don't일반 콘텐츠 바텀시트 용도로 사용하지 않습니다 (BottomSheet를 사용합니다).

배치 가능 영역Page Slot, 템플릿 고정 영역

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AlertBottomSheetSelectedOptionItemBottomSheetSelectItemCarouselItemCellBrandCellDescriptionCellLeftTableCellPaymentCellRightTableCellSelectCellThumbnailCellTitleDividerInsetInputSearchTitleGroupSection

포함하는 컴포넌트 (21)BottomGroupAiBottomSheetBottomSheetHandleItemButtonIconItemBottomGroup↳BottomSheetBottomGroupAiAreaItem↳BottomGroupAiBottomGroupUpperItem↳BottomGroupAichipRow↳BottomSheetIconItem↳ButtonIconItemTabScroll↳BottomSheetBottomGroupAreaItem↳BottomGroupBottomGroupLowerItem↳BottomGroupButton↳BottomGroupAiAreaItemButtonText↳BottomGroupUpperItemChipFilterItem↳BottomGroupUpperItemChipItem↳chipRowDividerContentsItem↳BottomGroupAiAreaItemNavigationButtonItem↳BottomGroupAiAreaItemTabScrollItem↳TabScrollButtonLoaderItem↳ButtonNavigationTabItem↳NavigationButtonItem

사용 텍스트 스타일 (2)Body/14 mediumTitle/20 semibold

---

## Button

용도What배경이 채워진(Primary·Secondary) 또는 테두리만 있는(Outline) 클릭 가능한 버튼입니다.Why확인·취소·삭제처럼 의도가 명확한 단일 액션을 제공하기 위해 사용합니다.When콘텐츠 또는 화면 하단 영역에서 주요 액션이 필요할 때 사용합니다.

선택 조건Use when배경·테두리가 있는 강조 버튼이 필요할 때 사용합니다.Don't use when배경 없이 텍스트만으로 표현할 가벼운 액션이면 ButtonText를 사용합니다. AI 기능을 트리거하는 버튼이면 ButtonAi를 사용합니다.유사 컴포넌트ButtonTextButton은 배경·테두리가 있어 시각적으로 강조되고, ButtonText는 배경 없이 텍스트(+아이콘)로만 표현하는 가벼운 버튼입니다.ButtonAiButton은 일반 액션 전용이고, ButtonAi는 AI 기능을 트리거하는 AI 전용 버튼입니다.

구성 — Variant SizeSmall · 구분: 목록·카드 등 인라인 소형 버튼에 사용합니다.Medium · 구분: 중간 크기 버튼에 사용합니다.Large · 구분: 기본 CTA 버튼에 사용합니다.XLarge · 구분: 면 하단의 전체 너비 CTA 버튼에 사용합니다.

구성 — Variant DangerOn · 구분: 삭제·초기화 등 취소 불가능한 위험 액션에 사용합니다.Off · 구분: 일반 액션에 사용합니다.

디자인 규칙Do화면당 Primary 버튼은 1개를 원칙으로 합니다.Don't배경 없이 텍스트만의 가벼운 액션(더보기, 전체삭제)에는 사용하지 않습니다 (ButtonText를 사용합니다).

배치 가능 영역Layout Frame, Column 슬롯, CardHome 슬롯, Page Slot

포함하는 컴포넌트 (2)ButtonLoaderItemIconItem

---

## ButtonGroup

용도WhatButton(OutlineSecondary·XLarge) 을 2~4개 담아 폭을 균등하게 나누고 8 간격으로 배열하는 한 줄 그릇입니다.Why위계가 같은 선택지를 나란히 보여줘 사용자가 한눈에 비교하고 고르게 하기 위해 사용합니다.When콘텐츠 안에서 우열이 없는 액션·선택지를 2~4개 나란히 제시할 때 사용합니다.

선택 조건Use when위계가 같은 액션 버튼 2~4개를 한 줄에 균등한 폭으로 놓을 때 사용합니다.Don't use when화면 하단에 고정되는 CTA 영역이거나, 주·보조 위계를 다르게 줘야 하거나, 버튼이 하나뿐일 때는 사용하지 않습니다.유사 컴포넌트BottomGroup화면 하단에 고정되는 CTA 영역에 사용합니다.BottomGroupAreaItem주·보조 위계를 다르게 준 하단 CTA 버튼 영역에 사용합니다.Button버튼이 하나뿐일 때 사용합니다.

디자인 규칙Do버튼 개수는 Variants(2Button·3Button·4Button)로 정합니다.같은 위계의 액션만 담습니다. (전 버튼이 같은 변형·같은 폭입니다.)4Button 은 라벨이 짧을 때만 씁니다. (391 폭 기준 버튼 하나가 91.75 로 좁습니다.)Don't버튼별로 변형을 달리 줘 주·보조 위계를 만들지 않습니다. (BottomGroupAreaItem 을 사용합니다.)화면 하단 고정 영역에 쓰지 않습니다. (BottomGroup 을 사용합니다.)

배치 가능 영역Layout Frame

포함하는 컴포넌트 (3)ButtonButtonLoaderItem↳ButtonIconItem↳Button

---

## ButtonText

용도What배경·테두리 없이 텍스트만, 언더라인 또는 텍스트+아이콘으로 구성된 경량 버튼입니다.Why헤더·보조 영역에서 강조 없이 기능 액션을 제공하기 위해 사용합니다.When헤더의 더보기·전체삭제처럼 기능성 보조 액션이 필요할 때 사용합니다.

선택 조건Use when배경 없이 텍스트만으로 표현할 보조 액션이 필요할 때 사용합니다.Don't use when배경·테두리가 필요한 주요 CTA 액션이면 Button을 사용합니다.유사 컴포넌트ButtonButtonText는 배경·테두리 없이 경량으로 표현하고, Button은 배경·테두리로 강조되는 주요 버튼입니다.

구성 — Variant SizeLarge · 구분: 기본 크기 텍스트 버튼에 사용합니다.Medium · 구분: 중간 크기 텍스트 버튼에 사용합니다.Small · 구분: 소형 텍스트 버튼에 사용합니다.XLarge · 구분: 가장 큰 텍스트 버튼에 사용합니다.

구성 — Variant DangerOn · 구분: 삭제·경고 등 위험 액션에 사용합니다.Off · 구분: 일반 액션에 사용합니다.

디자인 규칙Do헤더 전체삭제는 Variants=Text, 헤더 더보기는 Variants=Text+Icon을 사용합니다.Don't주요 CTA 액션에는 사용하지 않습니다 (Button을 사용합니다).

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (1)IconItem

---

## ButtonIconItem

용도What텍스트 없이 아이콘 단독으로 구성된 버튼 아이템입니다.Why아이콘만으로 의미가 전달되는 공간 효율적인 버튼을 제공하기 위해 사용합니다.When헤더·툴바·카드 등 텍스트 없이 아이콘 액션이 필요할 때 사용합니다.

선택 조건Use when텍스트 없이 아이콘 단독 버튼이 필요할 때 사용합니다.Don't use when텍스트가 함께 필요하면 Button 또는 ButtonText를 사용합니다.유사 컴포넌트ButtonIconAiItemButtonIconItem은 일반 아이콘 버튼이고, ButtonIconAiItem은 AI 전용 글로우 스타일 아이콘 버튼입니다.

구성 — Variant Variants3232px 크기 아이콘 버튼에 사용합니다.2424px 크기 아이콘 버튼에 사용합니다.1616px 크기 아이콘 버튼에 사용합니다.1212px 크기 아이콘 버튼에 사용합니다.

디자인 규칙Do**props 요약**variant: Large(24px, 기본) | Medium(16px) | Small(12px)icon: ReactNode — 내부 아이콘 슬롯children: ReactNode — 내부 아이콘 슬롯**[맵핑 트리거]** Button 계열 구조 안에 크기 고정 아이콘 슬롯이 필요할 때 사용한다.**[사용 시점]**버튼 내부 아이콘, 텍스트 옆 보조 아이콘, 작은 인터랙션 영역의 아이콘 슬롯아이콘 자체를 컴포넌트 외부에서 주입해야 하는 경우**[구분]**닫기(X) 버튼은 사용처 부모 컴포넌트에서 직접 처리한다.단순 범용 아이콘 표시에는 IconItem 또는 해당 Icon* 컴포넌트를 직접 사용할 수 있다.버튼, 타이틀, 셀 등에서 아이콘을 정해진 크기 슬롯 안에 배치해야 할 때 사용한다.내부 아이콘은 icon prop 또는 children으로 전달할 수 있으며, 지정하지 않으면 기본 Dummy 아이콘을 표시한다.Figma의 varient 오타는 코드에서 variant로 수정해 사용한다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

---

## ButtonLoaderItem

용도WhatButton·ButtonText의 State=Loading 상태에서 표시되는 로딩 스피너 아이템입니다.Why버튼 클릭 후 처리 중임을 시각적으로 나타내기 위해 사용합니다.

선택 조건Use whenButton 또는 ButtonText의 내부 구성 요소로만 사용합니다.Don't use when버튼 외부의 독립 로딩 인디케이터가 필요하면 별도 컴포넌트를 사용합니다.

디자인 규칙DoButton·ButtonText의 State=Loading 시 자동으로 사용됩니다.Don't버튼 외부에서 단독으로 사용하지 않습니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## ButtonAi

용도What글로우 효과가 적용된 AI 전용 버튼입니다.WhyAI 기능 진입점을 일반 버튼과 시각적으로 구분하기 위해 사용합니다.WhenAI 기능을 실행하는 액션이 필요할 때 사용합니다.

선택 조건Use whenAI 기능을 트리거하는 버튼이 필요할 때 사용합니다.Don't use when일반 액션이면 Button 또는 ButtonText를 사용합니다.유사 컴포넌트ButtonButtonAi는 AI 기능 전용이며 글로우 스타일이 적용되고, Button은 일반 액션에 사용하는 표준 버튼입니다.

디자인 규칙DoAI 기능 진입점에만 사용합니다.Don't일반 액션에는 사용하지 않습니다 (Button 또는 ButtonText를 사용합니다).

배치 가능 영역Layout Frame

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Body/14 medium

---

## ButtonIconAiItem

용도What44px 고정 크기에 글로우 효과가 적용된 AI 전용 아이콘 버튼 아이템입니다.WhyAI 페이지의 아이콘 버튼에 사용하며, 일반 페이지의 아이콘 버튼과 시각적으로 구분하기 위해 사용합니다.WhenAI 기능을 트리거하는 아이콘 버튼이 필요할 때 사용합니다.

선택 조건Use whenAI 기능 전용 아이콘 버튼이 필요할 때 사용합니다.Don't use when일반 아이콘 버튼이면 ButtonIconItem을 사용합니다.유사 컴포넌트ButtonIconItemButtonIconAiItem은 AI 전용 글로우 스타일이고, ButtonIconItem은 일반 아이콘 버튼입니다.

디자인 규칙DoAI 기능 진입점에만 사용합니다.Don't일반 액션의 아이콘 버튼에는 사용하지 않습니다 (ButtonIconItem을 사용합니다).

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

---

## Calendar

용도What연월 제목(+드롭다운)·선택 필터 영역(Header)과 요일 헤더·주 단위 날짜/일정 그리드(Container)로 구성된 월간 달력입니다.Why특정 월에 예정된 일정(요금·데이터 사용·가입 정보 등)을 날짜별로 한눈에 조회할 수 있도록 하기 위해 사용합니다.When사용자가 특정 월의 일정을 날짜별로 확인해야 하는 화면(나의 캘린더 등)에서 사용합니다.

선택 조건Use when특정 월의 일정을 날짜별로 조회해야 하는 화면에 사용합니다.Don't use when날짜 하나를 골라 입력값으로 확정해야 할 때는 사용하지 않습니다.유사 컴포넌트DatePicker바텀시트에서 날짜 하나를 입력값으로 선택할 때 사용합니다.

디자인 규칙Do일정(Events)은 겹치는 날짜끼리 자동으로 줄이 나뉘므로, 화면에서 여러 일정이 동시에 보여야 하는 상황을 직접 겹치지 않게 미리 가공할 필요가 없습니다.오늘 날짜는 자동으로 CalendarDateItem의 Current variant로 강조됩니다.공휴일·개통불가일처럼 해당되지 않는 날짜는 DisabledDates에 넘겨 흐리게 표시합니다.필터 칩 라벨은 화면이 실제로 걸러 보여주는 기준(회선·요금·가입정보 등)으로 지정합니다.Don't하루에 보여야 하는 일정 수보다 MaxEventRows를 작게 두지 않습니다 (초과분이 날짜별로 More(+N개)로 접혀 개별 일정을 읽을 수 없습니다).필터로 걸러지지 않는 칩을 남겨두지 않습니다 (누르면 아무 변화가 없어 고장으로 읽힙니다).

배치 가능 영역Layout Frame

포함하는 컴포넌트 (15)ButtonIconItemButtonTextCalendarDateItemCalendarEventItemCalendarWeekRowItemChipContentschipRowDatePickerSheetOverlayButton↳SheetOverlayChipItem↳chipRowDatePickerItem↳DatePickerDimItem↳SheetOverlayIconItem↳ButtonIconItemButtonLoaderItem↳Button

인터랙션 콜백 (4)onMonthChange(year: number, month: number) => void표시 연/월 변경 시 호출(제공 시 controlled — Year/Month가 원천). 미제공 시 uncontrolled(내부 상태로 관리).onTitleClick() => void제목 영역("2026년 7월 ▾") 클릭 시 호출 — 제공 시 소비 앱에 위임(월/연 선택 UI를 직접 띄움), 미제공 시 연·월 Wheel 바텀시트가 내장 기본값으로 열림(DatePicker.onTitleClick 과 동일한 위임 패턴).onRightLabelClick() => voidonChipSelect(index: number) => void칩 클릭 콜백(1-based 번호) — 상태는 보유하지 않고 선택 의도만 외부에 알린다(controlled)

사용 텍스트 스타일 (1)Title/20 semibold

---

## CalendarDateItem

용도What날짜 숫자 하나를 표시하는 원형 셀입니다.Why캘린더 그리드 안에서 각 날짜를 개별적으로 식별할 수 있도록 하기 위해 사용합니다.

선택 조건Use whenCalendarWeekRowItem 내부에서 하루치 날짜를 표시할 때 사용합니다.

디자인 규칙Do오늘 날짜에는 Current variant를 사용해 다른 날짜와 구분합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Body/14 mediumBody/14 regular

---

## CalendarEventItem

용도What날짜 슬롯 안에 텍스트 라벨을 담은 배경색 막대로, 걸치는 날짜 수만큼 폭이 늘어나는 일정 아이템입니다.Why특정 날짜(들)에 어떤 일정이 있는지 한눈에 알아볼 수 있도록 하기 위해 사용합니다.When특정 날짜에 하루짜리 또는 여러 날에 걸친 일정이 있을 때 사용합니다.

선택 조건Use whenCalendarWeekRowItem의 일정 슬롯 안에 일정을 표시해야 할 때 사용합니다.

구성 — Variant VariantsEvent일정 막대를 표시합니다. 걸치는 날짜 수(Span)만큼 폭이 넓어지고, 좌/우 모서리를 각각 둥글게 마감할지(ShowLeftCap/ShowRightCap)는 그 일정이 이번 주에서 시작·끝나는지에 따라 별도로 정해집니다.None다른 날짜의 일정과 세로 정렬을 맞추기 위한 빈 자리채움입니다. 화면에는 보이지 않습니다.More한 날짜에 표시 가능한 일정 개수를 초과했을 때 "+N개"로 나머지 일정 수를 표시합니다.

디자인 규칙Do같은 주 안에서 끝나는 일정은 ShowLeftCap·ShowRightCap을 모두 On으로 두고, 폭은 걸치는 날짜 수만큼 CalendarDateItem 칸 폭의 배수로 맞춥니다.주 경계를 넘어가는 일정은 시작 주에 ShowRightCap Off, 다음 주에 ShowLeftCap Off로 이어 붙여 하나의 일정처럼 보이게 표시합니다.한 날짜에 표시 가능한 개수를 초과하면 More(+N개)로 나머지를 요약합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Caption/10 mediumCaption/12 semibold

---

## CalendarWeekRowItem

용도What7개의 CalendarDateItem과 그 아래 일정을 쌓아 보여주는 슬롯으로 구성된 캘린더의 한 주 행입니다.Why한 주 단위로 날짜와 일정을 함께 묶어 캘린더 그리드를 구성하기 위해 사용합니다.

선택 조건Use whenCalendar 내부에서 한 주 분량의 날짜·일정을 표시할 때 사용합니다.

디자인 규칙Do7개의 CalendarDateItem을 요일 순서(월~일)에 맞게 배치합니다.일정 슬롯 내부는 행(Stack)을 여러 개 쌓은 구조로 구성하고, 각 행 안에 CalendarEventItem을 가로로 나란히 배치합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## Callout

용도What썸네일 이미지, 제목·부제 두 줄 텍스트, 닫기(X) 버튼을 한 줄로 묶은 그림자가 있는 흰색 카드입니다.Why이벤트·혜택·프로모션 등 사용자가 놓치지 않아야 할 정보를 화면 상단에 일시적으로 강조해 보여주기 위해 사용합니다.When화면 상단에 이벤트·혜택·프로모션 등 강조 안내를 일시적으로 띄워야 할 때 사용합니다.

선택 조건Use when화면 상단에서 이벤트·혜택·프로모션 등 놓치면 안 되는 정보를 강조해 안내해야 할 때 사용합니다.Don't use when사용자 동작의 결과를 알리고 스스로 사라져야 하거나, 특정 트리거 요소를 직접 가리켜야 할 때는 사용하지 않습니다.유사 컴포넌트Toast사용자 동작의 결과를 알리고 자동으로 사라져야 할 때 사용합니다.TooltipItem특정 트리거 요소를 직접 가리켜야 할 때 사용합니다.

디자인 규칙Do핵심 정보는 제목에 담고, 부연 설명은 부제로 내립니다.Title과 Subtitle은 최대 표시 줄 수를 초과할 경우 말줄임 처리합니다. Title·Subtitle 모두 최대 1줄로 표기합니다.X 버튼으로 닫으면 다시 노출되지 않도록 처리합니다.Don't화면을 가리는 형태로 사용하지 않습니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (3)ButtonIconItemThumbnailSquareItemIconItem↳ButtonIconItem

인터랙션 콜백 (1)onClose() => void닫기(×) 클릭 콜백 — 계약 아님(포털/Nova 확장)

사용 텍스트 스타일 (2)Body/16 semiboldCaption/12 medium

---

## Card

용도What슬롯 영역을 포함하며, 배경 스타일 또는 이미지로 구분되는 범용 카드 컨테이너입니다.Why다양한 콘텐츠를 하나의 카드 단위로 묶어 표시하기 위해 사용합니다.When정보와 액션을 카드 형식으로 표시해야 할 때 사용합니다.

선택 조건Use when상품 카드가 아닌 범용 콘텐츠를 카드 형식으로 표시해야 할 때 사용합니다.Don't use when상품 정보를 표시해야 하면 CardProduct를 사용합니다. 홈 화면 카드이면 CardHome을 사용합니다.

구성 — Variant VariantsFilled배경 채움형 카드에 사용합니다. · 구분: 콘텐츠가 배경과 명확히 구분되어야 할 때 사용합니다.Line테두리형 카드에 사용합니다.  · 구분: 흰 배경 위에서 카드 구분선이 필요할 때 사용합니다.Image지도 이미지가 배경으로 깔리는 카드에 사용합니다. · 구분: 지도 기반 위치 정보를 표시할 때 사용합니다.

디자인 규칙DoVariants=Filled 또는 Variants=Line 사용 시 슬롯 영역에 콘텐츠를 배치합니다.Don'tVariants=Image에는 슬롯이 없으므로 슬롯 콘텐츠를 전달하지 않습니다.

배치 가능 영역Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AlertBadgeIconGroupCardHomeItemCarouselItemCellBrandCellDescriptionCellProductCellRightTableCellSelectCellSelectHeaderCellThumbnailCellTitleCellProductBoxItemChipContentsColumnDividerInsetIconItemTextProductGroupThumbnailRoundItemTitleGroupSectionButtonCardItem

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Caption/13 medium

---

## CardHome

용도What홈 화면에서 사용하는 태스크·마이·콘텐츠·배너 형식의 카드 컨테이너입니다.Why홈 화면에서 다양한 유형의 서비스 정보를 카드 단위로 표시하기 위해 사용합니다.When홈 화면에서 카드 형식의 정보 표시가 필요할 때 사용합니다.

선택 조건Use when홈 화면에서 카드 형식의 정보 블록이 필요할 때 사용합니다.Don't use when홈 화면이 아닌 일반 화면의 범용 카드이면 Card를 사용합니다.

구성 — Variant VariantsTask이미지 배경 위에 텍스트와 라벨 버튼을 표시하는 태스크 카드입니다. 홈에서 특정 서비스 진입을 유도할 때 사용합니다. AI 홈에서만 사용합니다.My슬롯에 CardHomeItem(프로필·데이터·바코드)을 배치하는 마이 카드입니다. 사용자 개인 정보·혜택을 홈에서 바로 확인할 때 사용합니다.Contents텍스트와 슬롯으로 구성된 콘텐츠 카드입니다. 배너 없이 텍스트 중심의 정보와 하위 콘텐츠를 함께 표시할 때 사용합니다.ContentWithBanner상단 배너 이미지와 하단 슬롯을 함께 제공하는 카드입니다. 프로모션·이벤트 배너와 관련 콘텐츠를 함께 노출할 때 사용합니다.

디자인 규칙DoVariants=My 사용 시 슬롯에 CardHomeItem(프로필·데이터·바코드)만 배치합니다.Don'tVariants=My 사용 시 슬롯에 CardHomeItem(프로덕트·배너핏)을 배치하지 않습니다.

배치 가능 영역Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CardHomeItemCarouselItemChipContentsColumnDividerInsetSelect

포함하는 컴포넌트 (10)ButtonTextCardHomeItemBadgeItem↳CardHomeItembarcode↳CardHomeItemButton↳CardHomeItemDividerContentsItem↳CardHomeItemIconItem↳ButtonTextThumbnailRoundItem↳CardHomeItemThumbnailSquareItem↳CardHomeItemButtonLoaderItem↳Button

사용 텍스트 스타일 (4)Body/14 semiboldBody/16 mediumCaption/13 mediumTitle/18 semibold

---

## CardHomeItem

용도What프로필·데이터·바코드·상품·혜택 등 다양한 형식의 콘텐츠를 CardHome 슬롯에 제공하는 아이템입니다.WhyCardHome 카드 내부 슬롯에 다양한 콘텐츠 유형을 배치하기 위해 사용합니다.

선택 조건Use whenCardHome 슬롯에 콘텐츠 아이템이 필요할 때 사용합니다.Don't use whenCardHome 외부에서는 사용하지 않습니다.

구성 — Variant VariantsProfile · 구분: 원형 프로필 이미지·이름·전화번호·버튼으로 구성된 사용자 프로필 아이템에 사용합니다.Data · 구분: 타이틀·서브타이틀과 그래픽 아이콘으로 구성된 데이터 정보 아이템에 사용합니다.Barcode · 구분: 바코드 이미지와 번호를 표시하는 아이템에 사용합니다.Product · 구분: 소형 썸네일과 가격 정보를 표시하는 상품 아이템에 사용합니다.Benefit · 구분: 원형 썸네일(브랜드 로고)과 타이틀·서브타이틀로 구성된 혜택 아이템에 사용합니다.

디자인 규칙DoCardHome 슬롯 내에서만 사용합니다.Don'tCardHome 외 다른 컴포넌트 내부에서 사용하지 않습니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (8)BadgeItembarcodeButtonDividerContentsItemIconItemThumbnailRoundItemThumbnailSquareItemButtonLoaderItem↳Button

사용 텍스트 스타일 (8)Body/14 mediumBody/15 semiboldBody/16 mediumBody/16 semiboldCaption/11 mediumCaption/12 mediumCaption/13 mediumTitle/18 semibold

---

## Carousel

용도WhatCarouselSlot 하나를 가진 가로 스크롤 컨테이너입니다.Why상품 카드를 화면 폭에 맞춰 나열하고 넘치는 만큼 가로로 스크롤해 탐색하게 하기 위해 사용합니다.When상품 카드 여러 개를 한 영역에서 가로로 훑게 해야 할 때 사용합니다.

선택 조건Use when여러 상품을 한 화면에서 가로 스크롤로 연속 탐색시켜야 할 때 사용합니다.Don't use when한 장씩 넘기는 슬라이드(ThumbnailFull·Banner)나 세로 목록에는 사용하지 않습니다.

디자인 규칙DoCarouselSlot에 CarouselItem을 담아 구성합니다.좌우 끝까지 붙는 full-bleed로 배치하고, 아이템이 넘치면 가로 스크롤로 탐색하게 합니다.Don't한 영역에서 두 줄 이상 겹쳐 사용하지 않습니다.CarouselItem이 아닌 컴포넌트를 슬롯에 담지 않습니다.

배치 가능 영역Page Slot

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CarouselItem

포함하는 컴포넌트 (15)CarouselItemchipRowChipItem↳chipRowTextProductGroup↳CarouselItemThumbnailRectangleItem↳CarouselItemThumbnailSquareItem↳CarouselItemBadgeGroup↳TextProductGroupButton↳TextProductGroupButtonIconItem↳TextProductGroupDividerContentsItem↳TextProductGroupIconItem↳TextProductGroupThumbnailRoundItem↳TextProductGroupToggleItem↳TextProductGroupBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## CarouselItem

용도What썸네일 이미지와 상품 텍스트 정보(가격·할인율·뱃지 등)를 세로로 쌓은 상품 카드 아이템입니다.Why여러 상품을 한 화면 안에서 가로 스크롤로 연속 탐색할 수 있도록 캐러셀을 구성하기 위해 사용합니다.When상품 목록을 가로 스크롤 캐러셀로 탐색해야 할 때 사용합니다.

선택 조건Use when가로 스크롤 캐러셀에서 상품 아이템이 필요할 때 사용합니다.

구성 — Variant VariantsSmall128px 정사각 썸네일 + 타이틀·가격조건 캡션·가격. 좁은 폭의 컴팩트 상품 슬라이드에 사용합니다.Medium128x192 직사각 썸네일 + 타이틀·별점/예매율. 영화·콘텐츠 등 포스터형 슬라이드에 사용합니다.Large160px 정사각 썸네일 + 서브타이틀·타이틀·할인가·배지. 정보량이 많은 대표 상품 슬라이드에 사용합니다.

디자인 규칙Do가로 스크롤이 적용된 List Stack 내부에서 사용합니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (12)TextProductGroupThumbnailRectangleItemThumbnailSquareItemBadgeGroup↳TextProductGroupButton↳TextProductGroupButtonIconItem↳TextProductGroupDividerContentsItem↳TextProductGroupIconItem↳TextProductGroupThumbnailRoundItem↳TextProductGroupToggleItem↳TextProductGroupBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## CellBrand

용도What브랜드 로고 또는 핀 아이콘과 함께 가맹점·브랜드 정보를 표시하는 셀입니다.Why리스트에서 브랜드·가맹점을 시각적으로 구분하여 보여주기 위해 사용합니다.When브랜드·가맹점 정보 목록에서 각 항목을 표시해야 할 때 사용합니다.

선택 조건Use when브랜드·가맹점 정보를 로고 또는 핀과 함께 표시해야 할 때 사용합니다.Don't use when인물이나 출연진을 표시해야 할 때는 사용하지 않습니다.

구성 — Variant VariantsLogo브랜드 로고 이미지와 함께 브랜드 정보를 표시할 때 사용합니다.Pin핀(위치) 아이콘과 함께 가맹점 정보를 표시할 때 사용합니다.

디자인 규칙Do오른쪽 아이템은 ButtonSmall만 사용합니다.Title은 최대 2줄, SubTitle·Caption은 각각 최대 1줄까지 표시되며, 초과하는 텍스트는 말줄임(...) 처리됩니다.Don't오른쪽에 ButtonSmall 외 다른 CellRightItem을 사용하지 않습니다.

배치 가능 영역BottomSheet 슬롯, BottomSheetAi 슬롯, Column 슬롯, Layout Frame, Page Slot

포함하는 컴포넌트 (10)BadgeGroupCellRightItemIconItemThumbnailRoundItemBadgeItem↳BadgeGroupButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemSwitchItem↳CellRightItemButtonLoaderItem↳Button

사용 텍스트 스타일 (3)Body/16 semiboldCaption/12 mediumCaption/13 medium

---

## CellCountPrice

용도What좌측 NumericSpinnerItem과 우측 금액 텍스트로 구성된 셀입니다.Why수량을 조절하면서 그에 따른 금액을 한 줄에서 함께 확인할 수 있도록 하기 위해 사용합니다.When상품 주문·옵션 선택 등 수량 조절과 금액 확인이 동시에 필요한 상황에서 사용합니다.

선택 조건Use when수량 조절 컨트롤과 금액을 한 셀에 함께 표시해야 할 때 사용합니다.Don't use when수량 조절 없이 항목명과 금액만 표시할 때는 사용하지 않습니다.

구성 — Variant Variants16semiBottomSheetSelectedOptionItem 내부에서 사용합니다.14semiCellProduct의 CellProductBoxItem 내부에서 사용합니다.

디자인 규칙디자인 규칙이 없습니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (4)NumericSpinnerItemNumericSpinnerButtonItem↳NumericSpinnerItemButtonIconItem↳NumericSpinnerButtonItemIconItem↳ButtonIconItem

인터랙션 콜백 (1)onStep(delta: 1 | -1) => void중첩 NumericSpinnerItem 증감 의도 콜백(계약 아님) — 전달 시 수량·Price 갱신은 상위(앱) 소관, 미전달 시 자체 관리

---

## CellDescription

용도What본문 설명 텍스트를 표시하고 탭 동작(이동·설정)을 연결하는, 불릿·색 선택을 지원하는 설명 셀입니다.Why리스트·바텀시트 본문에서 설명 문장을 보여주고 탭 동작을 제공하기 위해 사용합니다.When정보 목록·바텀시트 본문에서 설명(+옵션 불릿) + 이동·설정 동작이 필요할 때 사용합니다.

선택 조건Use when본문 설명 텍스트만 있는 단순 항목 셀이 필요할 때, 또는 불릿이 붙은 여러 줄 안내 문장이 필요할 때 사용합니다.Don't use when제목이 필요하면 CellTitle을, 오른쪽에 값을 표시하거나 선택 컨트롤이 필요하면 CellLeftTable/CellRightTable/CellSelect를 사용합니다.

디자인 규칙Do2개 이상 연속으로 노출되는 경우 Stack으로 구성합니다.ShowRightItem이 true이면 최대 2줄 말줄임(...), false이면 개행을 허용해 줄 수 제한 없이 표시합니다.유의사항·안내사항처럼 항목을 나열할 때는 ShowBullet을 켜고 항목을 개행(\n)으로 구분합니다 — 콘텐츠 문자열에 •를 직접 넣지 않습니다.Don't오른쪽에 값(금액·상태 등)이 함께 표시되어야 하는 경우에는 사용하지 않습니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (9)CellRightItemBadgeGroup↳CellRightItemButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemIconItem↳CellRightItemSwitchItem↳CellRightItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## CellLeftTable

용도What항목 이름과 값이 모두 왼쪽으로 치우쳐 정렬되는 테이블 셀입니다.Why항목과 값을 왼쪽 정렬로 나란히 표시해야 하는 테이블 레이아웃에 사용합니다.When항목 이름과 값을 왼쪽 정렬로 함께 표시해야 하는 테이블 형식 셀에서 사용합니다.

선택 조건Use when항목과 값을 왼쪽 정렬로 표시해야 할 때 사용합니다.Don't use when오른쪽에 값이 없는 단순 항목이면 CellText를 사용합니다. 양 끝 정렬이 필요하면 CellRightTable을 사용합니다.

구성 — Variant VariantsSmall · 구분: 소형 셀 크기에 사용합니다.Medium · 구분: 기본 셀 크기에 사용합니다.

디자인 규칙디자인 규칙이 없습니다.

배치 가능 영역Accordion 슬롯, Layout Frame, BottomSheetAi 슬롯, BottomSheet 슬롯

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## CellPayment

용도What결제 수단 항목을 표시하고 선택할 수 있는 셀입니다.Why결제 화면에서 사용 가능한 결제 수단 목록을 보여주고 선택을 제공하기 위해 사용합니다.When결제 수단 선택 화면에서 사용합니다.

선택 조건Use when결제 수단 선택 목록이 필요할 때 사용합니다.Don't use when결제 수단이 아닌 일반 항목을 선택하는 목록일 때는 사용하지 않습니다.

디자인 규칙디자인 규칙이 없습니다.

배치 가능 영역Layout Frame, BottomSheetAi 슬롯, BottomSheet 슬롯

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CellPaymentItem

포함하는 컴포넌트 (4)BadgeGroupRadioItemThumbnailRoundItemBadgeItem↳BadgeGroup

사용 텍스트 스타일 (2)Body/16 regularCaption/13 medium

---

## CellPointInfo

용도What썸네일 이미지와 포인트 증감 정보(적립/사용)를 함께 표시하는 셀입니다.Why포인트 내역 목록에서 각 거래 항목의 썸네일·금액·부호를 한 줄로 제공하기 위해 사용합니다.When포인트 적립·사용 내역 목록을 표시할 때 사용합니다.

선택 조건Use when포인트 거래 내역을 썸네일과 함께 표시해야 할 때 사용합니다.

구성 — Variant VariantsAdd · 구분: 포인트 적립(+) 내역에 사용합니다.Discount · 구분: 포인트 사용(-) 내역에 사용합니다.

디자인 규칙DoVariants=Add/Discount는 부호(+/-)를 시각적으로 구분합니다.Don't부호(+/-)는 컴포넌트에서 고정하지 않고 데이터에서 정의합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (1)ThumbnailRoundItem

사용 텍스트 스타일 (3)Body/16 mediumBody/16 semiboldCaption/13 medium

---

## CellProduct

용도What썸네일·상품명·옵션·수량·가격 등 상품 정보를 세로로 구성하는 상품 아이템입니다.WhyCard 안에서 장바구니·주문서 등 상품 정보를 항목 단위로 표시하기 위해 사용합니다.When장바구니·주문서 페이지 등에서 상품 항목을 Card 안에 표시할 때 사용합니다.

선택 조건Use whenCard 안에서 장바구니·주문서 등 상품 항목 표시가 필요할 때 사용합니다.Don't use when썸네일과 가격을 한 줄로만 표시하면 될 때는 사용하지 않습니다.

구성 — Variant VariantsSelectable체크박스로 선택 가능한 상품 목록 행에 사용합니다.Display선택·닫기·박스 없이 썸네일과 상품 정보만 단독으로 보여줄 때 사용합니다.

디자인 규칙DoCard 안에 포함하여 사용합니다.Title·HelpText는 각각 최대 2줄, SubTitle은 최대 1줄까지 표시되며, 초과하는 텍스트는 말줄임(...) 처리됩니다.

배치 가능 영역Layout Frame, Page Slot

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CellProductBoxItem

포함하는 컴포넌트 (16)ButtonIconItemCellCountPriceCellDescriptionCellProductBoxItemCheckboxItemIconItemThumbnailSquareItemCellRightItem↳CellDescriptionNumericSpinnerItem↳CellCountPriceBadgeGroup↳CellRightItemButton↳CellRightItemButtonText↳CellRightItemNumericSpinnerButtonItem↳NumericSpinnerItemSwitchItem↳CellRightItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

사용 텍스트 스타일 (3)Body/14 semiboldBody/15 regularCaption/13 regular

---

## CellProgress

용도What좌측 단계 표식(번호 또는 그래픽)과 우측 제목·설명으로 구성된 셀입니다. Size=Large에서는 다음 단계로 이어지는 세로 연결선이 함께 표시됩니다.Why여러 단계로 이루어진 진행 과정을 각 단계의 내용과 함께 순서대로 보여주기 위해 사용합니다.When주문·배송·신청 처리의 진행 상황을 보여주거나, 이용 방법·안내 사항을 단계로 풀어 설명해야 할 때 사용합니다.

선택 조건Use when여러 단계의 진행 과정을 각 단계의 제목·설명과 함께 세로로 이어 보여줘야 할 때 사용합니다.Don't use when진행 과정 없이 개별 항목만 나열하거나, 현재 단계를 숫자로만 요약해서 보여줄 때는 사용하지 않습니다.

구성 — Variant VariantsCount단계에 순서 번호를 매겨 몇 번째 단계인지 명시해야 할 때 사용합니다.Graphic각 단계를 이미지나 아이콘으로 식별해야 할 때 사용합니다.

구성 — Variant SizeLarge페이지 안에서 진행 과정을 강조하거나 단계가 많지 않을 때 사용합니다.SmallShop·Manage 페이지에서 자세한 안내 사항이나 이용 방법을 단계로 풀어 설명할 때 사용합니다.

디자인 규칙Do단계가 순서대로 이어지는 목록에서 여러 개를 연속해서 배치합니다.Size=Large 목록의 마지막 단계에서는 ShowVerticalLine을 반드시 끕니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (2)IconItemThumbnailRoundItem

사용 텍스트 스타일 (3)Body/14 semiboldBody/16 semiboldCaption/13 medium

---

## CellRightTable

용도What항목 이름은 왼쪽, 값(금액·상태·정보 등)은 오른쪽 끝으로 배치하는 양 끝 정렬 테이블 셀입니다.Why항목과 값을 양 끝에 대응시켜 시각적으로 명확하게 구분해 보여주기 위해 사용합니다.When항목 이름과 값을 양 끝 정렬로 함께 표시해야 하는 테이블 형식 셀에서 사용합니다.

선택 조건Use when항목과 값을 양 끝으로 대응시켜 표시해야 할 때 사용합니다.

구성 — Variant Variants18Semi · 구분: 강조가 필요한 큰 값(금액 등)에 사용합니다.16Semi · 구분: 중간 강조 값에 사용합니다.16reg · 구분: 기본 값 표시에 사용합니다.15reg · 구분: 보조·소형 셀의 값 표시에 사용합니다.

디자인 규칙Do항목과 값을 양 끝으로 대응시켜 표시해야 할 때 사용합니다.Title은 한 줄로 표시되며, 초과하는 내용은 말줄임(...) 처리됩니다.

배치 가능 영역Layout Frame, Accordion 슬롯, Card 슬롯, BottomSheet 슬롯, BottomSheetAi 슬롯, Dialog 슬롯

포함하는 컴포넌트 (1)IconItem

---

## CellSelect

용도What라디오·체크박스 선택 표시를 포함한 항목 선택 셀입니다.Why리스트에서 단일 또는 복수 항목을 선택할 수 있도록 하기 위해 사용합니다.When항목 목록에서 사용자가 선택해야 하는 상황에서 사용합니다.

선택 조건Use when항목 목록에서 라디오·체크 선택이 필요할 때 사용합니다.

디자인 규칙DoLeftSelect 사용 시 우측 아이템은 Arrow 또는 Text만 사용합니다.Type=Radio로 구성할 때 그룹 내에서 하나의 항목만 Selection=On 상태로 유지합니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (14)BadgeGroupCellRightItemCheckboxLeftTextItemCheckboxRightTextItemRadioLeftTextItemBadgeItem↳BadgeGroupButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemCheckboxItem↳CheckboxLeftTextItemIconItem↳CellRightItemRadioItem↳RadioLeftTextItemSwitchItem↳CellRightItemButtonLoaderItem↳Button

---

## CellSelectHeader

용도What체크박스·타이틀·닫기 버튼으로 구성된 장바구니 상품 그룹의 선택 헤더 행입니다.Why장바구니에서 상품 그룹을 전체 선택하거나 삭제할 수 있는 타이틀 행을 제공하기 위해 사용합니다.

선택 조건Use whenCart 페이지의 상품 그룹 헤더 행이 필요할 때 사용합니다.

디자인 규칙DoCart 페이지에서만 사용합니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (10)CellRightItemCheckboxItemBadgeGroup↳CellRightItemButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemIconItem↳CellRightItemSwitchItem↳CellRightItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

사용 텍스트 스타일 (1)Body/16 semibold

---

## CellThumbnail

용도What가격 또는 안내 텍스트를 표시하는 셀입니다.Why결제 금액·안내 사항 등 고지 정보를 제공하기 위해 사용합니다.When가격 정보 또는 안내 메시지가 필요할 때 사용합니다.

선택 조건Use when가격·안내 정보를 표시해야 할 때 사용합니다.

구성 — Variant VariantsPrice · 구분: 가격·금액 정보를 표시하는 셀에 사용합니다.Notice · 구분: 안내·고지 텍스트를 표시하는 셀에 사용합니다.

디자인 규칙DoVariants=Price 오른쪽에는 Arrow만, Variants=Notice 오른쪽에는 ButtonSmall만 사용합니다.

배치 가능 영역Layout Frame, Accordion 슬롯, Card 슬롯, BottomSheetAi 슬롯, BottomSheet 슬롯, Column 슬롯

포함하는 컴포넌트 (10)CellRightItemThumbnailSquareItemBadgeGroup↳CellRightItemButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemIconItem↳CellRightItemSwitchItem↳CellRightItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

사용 텍스트 스타일 (4)Body/14 semiboldBody/16 semiboldCaption/12 mediumCaption/13 medium

---

## CellTitle

용도What항목 이름을 텍스트로 표시하고 탭 동작(이동·설정)을 연결하는, 뱃지 그룹·서브타이틀을 붙일 수 있는 타이틀 셀입니다.Why리스트에서 제목 + 상태 뱃지(+보조 설명)를 함께 보여주고 탭 동작을 제공하기 위해 사용합니다.

선택 조건Use when제목만 있는 단순 항목 셀이 필요할 때, 또는 뱃지(상태·라벨)·서브타이틀을 제목에 붙여야 할 때 사용합니다.

디자인 규칙Do2개 이상 연속으로 노출되는 경우 Stack으로 구성합니다.Title은 최대 2줄로 표시하고, 넘치면 말줄임(...) 처리합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (9)BadgeGroupCellRightItemBadgeItem↳BadgeGroupButton↳CellRightItemButtonIconItem↳CellRightItemButtonText↳CellRightItemIconItem↳CellRightItemSwitchItem↳CellRightItemButtonLoaderItem↳Button

사용 텍스트 스타일 (1)Caption/13 medium

---

## CellPaymentItem

용도What결제 안내 배너 또는 결제수단 카드를 표시하는 컴포넌트입니다.WhyCellPayment 하단 카드 영역에서 가입 유도 메시지 또는 결제수단 정보를 재사용 가능한 형태로 보여주기 위해 사용합니다.

디자인 규칙DoLabel은 최대 2줄, Caption은 최대 1줄까지 표시되며, 초과하는 텍스트는 말줄임(...) 처리됩니다.

배치 가능 영역미설정

포함하는 컴포넌트 (3)ButtonIconItemThumbnailRoundItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (3)Body/14 semiboldCaption/12 mediumCaption/12 semibold

---

## CellProductBoxItem

용도What배경·라운드가 있는 박스 안에 콘텐츠를 담는 그릇입니다.Why상품 옵션·수량·가격 등 부가 정보를 시각적으로 구분된 박스로 묶어 보여주기 위해 사용합니다.

선택 조건Use whenCellProduct 하단에 옵션·수량·가격 등을 박스 형태로 담아야 할 때 사용합니다.

디자인 규칙DoCellProduct의 CellProductBoxItemSlot 안에서 사용합니다.

배치 가능 영역Page Slot, Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.CellCountPriceCellDescriptionCellRightTableCellTitleDividerInset

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## CellRightItem

용도What화살표·텍스트·라벨·토글·버튼 등 셀 우측에 표시되는 보조 액션·정보 요소입니다.Why셀의 오른쪽 영역에 다양한 형태의 보조 정보나 액션을 제공하기 위해 사용합니다.

구성 — Variant VariantsArrow단순 화살표 등 방향 아이콘에 사용합니다.Close닫기 등 아이콘 버튼 액션에 사용합니다.TextButtonLarge밑줄 텍스트 버튼(탭 가능한 링크) 중 큰 사이즈에 사용합니다.TextButtonMedium밑줄 텍스트 버튼 중 작은 사이즈에 사용합니다.TextIcon텍스트 + 아이콘 조합 버튼에 사용합니다.ButtonSmall작은 버튼 액션에 사용합니다.LevelBadge레벨 뱃지 표시에 사용합니다.Switch온/오프 토글이 필요한 설정 항목에 사용합니다.

디자인 규칙Do셀 우측에 아이템이 필요한 경우 반드시 CellRightItem을 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (8)BadgeGroupButtonButtonIconItemButtonTextIconItemSwitchItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

사용 텍스트 스타일 (1)Body/14 regular

---

## CheckboxItem

용도What원형(Circle) 또는 선형(Line) 스타일의 체크 버튼으로, 텍스트 없이 선택 상태만 표현하는 아이템입니다.WhyCheckboxLeftTextItem·CheckboxRightTextItem 내에서 선택 상태를 시각적으로 표현하기 위해 사용합니다.

디자인 규칙Do선택 상태(Selection=On)이며 비활성(Disabled)인 경우, 현재 선택 값은 유지되고 사용자가 변경할 수 없음을 명시합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

인터랙션 콜백 (1)onSelectionChange(next: CheckboxSelection) => void선택 변경 콜백(controlled) — 제공 시 Selection 그대로 노출·클릭을 외부에 위임.

---

## CheckboxLeftTextItem

용도What체크박스 버튼이 왼쪽, 텍스트 레이블이 오른쪽에 배치된 복수 선택 항목입니다.WhyCellSelect 내부에서 독립적으로 선택·해제할 수 있는 복수 선택 항목을 제공하기 위해 사용합니다.

구성 — Variant VariantsCircle상위 계층 선택(예: 전체 선택)에 사용합니다.Line하위 계층 선택에 사용합니다.

디자인 규칙Do위계가 있는 목록에서는 상위 항목에 Variants=Circle, 하위 항목에 Variants=Line을 사용해 계층을 구분합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)CheckboxItem

인터랙션 콜백 (1)onSelectionChange(next: CheckboxSelection) => void선택 변경 콜백(controlled)

---

## CheckboxRightTextItem

용도What텍스트 레이블이 왼쪽, 체크박스 버튼이 오른쪽 끝에 배치된 단일 선택 항목입니다.WhyCTA가 없는 바텀시트에서 하나의 항목만 선택할 수 있는 선택지를 제공하기 위해 사용합니다.

선택 조건Use whenCTA가 없는 바텀시트 내부에서 체크박스가 텍스트 오른쪽에 위치해야 할 때 사용합니다.

배치 가능 영역미설정

포함하는 컴포넌트 (2)CheckboxItemCheckboxLeftTextItem

인터랙션 콜백 (1)onSelectionChange(next: CheckboxSelection) => void선택 변경 콜백(controlled)

---

## ChipContents

용도What콘텐츠 영역 안에서 가로로 나열되는 소형(Small) 필터 칩 그룹입니다.Why콘텐츠 내부에서 항목을 필터링하거나 태그·조건을 선택하기 위해 사용합니다.

배치 가능 영역Card 슬롯, CardHome 슬롯, Column 슬롯, Layout Frame

포함하는 컴포넌트 (2)chipRowChipItem↳chipRow

인터랙션 콜백 (1)onChipSelect(index: number) => void칩 클릭 콜백(1-based 번호)

---

## ChipFilter

용도WhatSlot에 ChipFilterItem을 가로로 나열하는 필터 칩 컨테이너입니다.Why현재 적용된 필터 조건들을 한 줄로 보여주어 사용자가 적용 상태를 확인하고 개별 해제할 수 있도록 하기 위해 사용합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (5)ChipFilterItemchipRowButtonIconItem↳ChipFilterItemChipItem↳chipRowIconItem↳ButtonIconItem

인터랙션 콜백 (1)onChipRemove(index: number) => void칩 제거(×) 클릭 콜백

---

## ChipHome

용도What아이콘과 텍스트로 구성된 ChipHomeItem을 두 줄로 나열하는 홈 화면 전용 퀵링크 칩 그룹입니다.Why홈 화면에서 자주 사용하는 서비스나 카테고리에 빠르게 접근할 수 있도록 퀵링크를 제공하기 위해 사용합니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (4)ChipHomeItemchipRowChipItem↳chipRowIconItem↳ChipHomeItem

---

## ChipPage

용도What페이지 상단에 가로로 나열되며 하단 구분선이 있는 탭형 필터 칩 바입니다.Why목록·콘텐츠를 카테고리별로 탭 형태로 필터링하는 진입점을 페이지 상단에 고정하기 위해 사용합니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (2)chipRowChipItem↳chipRow

인터랙션 콜백 (1)onChipSelect(index: number) => void칩 클릭 콜백(1-based 번호)

---

## ChipFilterItem

용도What레이블 텍스트와 닫기(X) 아이콘으로 구성된 제거 가능한 필터 칩입니다.Why적용된 필터 조건을 태그로 시각화하고, X 버튼으로 개별 해제할 수 있도록 하기 위해 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

인터랙션 콜백 (1)onRemove() => void닫기(×) 클릭 콜백

사용 텍스트 스타일 (1)Body/14 medium

---

## ChipHomeItem

용도What원형 아이콘과 텍스트 레이블로 구성된 홈 화면 전용 퀵링크 칩입니다.Why홈 화면의 ChipHome에서 서비스·카테고리 진입점을 아이콘과 텍스트로 함께 표시하기 위해 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Body/14 medium

---

## ChipItem

용도What선택/미선택 상태와 크기를 가진 텍스트 전용 카테고리/필터 칩 아이템입니다.WhyChipPage·ChipContents에서 각 카테고리/필터 항목을 구성하기 위해 사용합니다.

디자인 규칙DoSize=Large는 ChipPage에, Size=Small은 ChipContents에 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## Column

배치 가능 영역Layout Frame, Card 슬롯, Accordion 슬롯, Dialog 슬롯, BottomSheet 슬롯, section-sectionslot, BottomSheetAi 슬롯, BottomSheetSelect 슬롯, cellproductitem-boxslot, CardHome 슬롯

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.BadgeItemBadgeIconItemButtonButtonTextCellRightItemCheckboxItemCheckboxLeftTextItemCheckboxRightTextItemColumnTextItemDividerInsetIconItemNumericSpinnerItemRadioItemRadioLeftTextItemSwitchItemThumbnailRectangleItemThumbnailRoundItemThumbnailSquareItem

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## ColumnTextItem

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

---

## DatePicker

용도What월별 달력 그리드(Grid)로 하루 또는 기간을 선택하고, 스크롤 휠(Wheel)로 표시할 연·월을 이동하는 컨테이너입니다.WhyBottomSheet 내에서 사용자가 날짜를 인터랙티브하게 선택할 수 있도록 하기 위해 사용합니다.When예약·조회·기간 설정 등 사용자가 특정 날짜를 직접 선택해야 하는 플로우에서 사용합니다.

선택 조건Use whenBottomSheetSlot 안에 날짜 선택 UI가 필요할 때 사용합니다.

구성 — Variant VariantsGrid월별 달력 그리드로 날짜를 선택할 때 사용합니다.Wheel표시할 연·월을 빠르게 이동할 때 사용합니다.

구성 — Variant SelectionModeSingle하루만 고르는 화면에 사용합니다.Range기간을 고르는 화면에 사용합니다.

디자인 규칙Do반드시 BottomSheetSlot 안에 배치하여 사용합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (7)ButtonIconItemDatePickerItemSheetOverlayButton↳SheetOverlayDimItem↳SheetOverlayIconItem↳ButtonIconItemButtonLoaderItem↳Button

사용 텍스트 스타일 (3)Body/14 mediumHeadline/22 regularTitle/18 semibold

---

## DatePickerItem

용도What날짜 숫자와 선택 상태를 표시하는 달력 셀 아이템입니다.Why달력 그리드에서 날짜별 선택·비활성·범위 등 상태를 시각적으로 표현하기 위해 사용합니다.

구성 — Variant VariantsDefault선택 가능한 기본 날짜 셀입니다.Current오늘 날짜입니다.Selected사용자가 선택한 날짜입니다.RangeLeft기간 선택 시 시작 날짜입니다.Range기간 선택 시 시작~종료 사이의 날짜입니다.Disabled시스템 조건상 선택할 수 없는 날짜입니다.RangeRight기간 선택 시 종료 날짜입니다.None해당 월에 속하지 않아 비어 있는 빈 셀입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Body/16 mediumBody/16 regular

---

## Dialog

용도What타이틀·설명 텍스트·슬롯 영역·액션 버튼으로 구성되어 화면 중앙에 표시되는 모달 대화상자입니다.Why작업 확인·경고·안내 등 사용자가 반드시 응답해야 하는 상황에서 화면 흐름을 중단하고 응답을 요구하기 위해 사용합니다.

배치 가능 영역템플릿 고정 영역, Page Slot

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AlertCellDescriptionCellRightTableCellSelectCellTitleColumnDatePickerDividerInset

포함하는 컴포넌트 (4)DialogButtonItemButton↳DialogButtonItemButtonLoaderItem↳ButtonIconItem↳Button

사용 텍스트 스타일 (2)Body/16 mediumTitle/20 semibold

---

## DialogButtonItem

용도WhatDialog의 액션 버튼 영역으로, 보조+주요 버튼 2개 또는 주요 버튼 1개를 가로로 배치합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (3)ButtonButtonLoaderItem↳ButtonIconItem↳Button

---

## DimItem

용도What화면 전체를 반투명하게 덮어 하단 콘텐츠를 가리는 오버레이 레이어입니다.Why모달·바텀시트 등 특정 요소에 사용자의 집중을 유도하고, 배경과의 상호작용을 차단하기 위해 사용합니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## DividerFullwidth

용도What화면 가로 전체를 가로지르는 굵은 수평 구분선입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## DividerInset

용도What좌우 여백 안쪽에 배치되는 가는 수평 구분선입니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## DividerContentsItem

용도What가로로 나열된 텍스트·태그 등 인라인 요소 사이에 배치되는 세로 구분선입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## Empty

용도What타이틀, 설명 텍스트, 액션 버튼으로 구성된 빈 상태 안내 블록입니다.Why목록·검색 결과·콘텐츠 영역에 표시할 데이터가 없을 때 사용자에게 상황을 안내하고 다음 행동을 유도하기 위해 사용합니다.

구성 — Variant VariantsLargeTitle 18px·Description 16px 크기로 구성된 기본형입니다.SmallTitle 16px·Description 15px 크기로 축소된 형태입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (3)ButtonButtonLoaderItem↳ButtonIconItem↳Button

---

## FilterBar

용도What정렬/필터 진입점을 한 줄로 묶은 필터 바입니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (3)ButtonTextDividerContentsItemIconItem↳ButtonText

사용 텍스트 스타일 (1)Caption/13 medium

---

## Footer

용도What이용약관 링크·사업자 정보·저작권·통신판매 고지 등 법적 안내 정보를 담는 하단 영역입니다.

구성 — Variant VariantsDefault일반 페이지에 사용합니다.Product상품 구매·거래 관련 법적 고지가 필요한 페이지에 사용합니다.SafeArea텍스트 없이 하단 여백만 필요할 때 사용합니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (3)ButtonTextDividerContentsItemIconItem↳ButtonText

---

## IconItem

용도What크기(사이즈 박스) 역할만 하며, 내부 글리프는 @skt/ds-icons 아이콘 메뉴에서 선택하는 아이콘 컨테이너입니다.

디자인 규칙Do글리프는 항상 아이콘 메뉴(@skt/ds-icons)에서 선택합니다.Don't등록된 Variants 사이즈(10·12·16·20·24·32·40·60) 외의 크기로 사용하지 않습니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## IndicatorItem

용도What가로로 나열된 점(IndicatorDotItem)의 집합으로, 전체 슬라이드 수와 현재 위치를 시각적으로 표시합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IndicatorDotItem

---

## IndicatorDotItem

용도What슬라이드 1개를 나타내는 원형 점으로, 현재 위치(On)와 다른 위치(Off)를 시각적으로 구분합니다.

구성 — Variant SelectionUnselected현재 위치가 아닌 슬라이드에 사용합니다.Selected현재 보고 있는 슬라이드 위치에 사용합니다.Fading더 있음을 나타내는 오버플로 점입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## Input

용도What레이블·InputItem(1~3개)·도움말 텍스트를 하나의 입력 단위로 구성한 폼 영역입니다.

구성 — Variant Variants1Input입력 필드 1개와 액션 버튼이 함께 표시됩니다.2Input입력 필드 2개가 세로로 쌓입니다.3Input입력 필드 3개가 세로로 쌓이고 첫 번째 필드에 액션 버튼이 표시됩니다.

배치 가능 영역Layout Frame, BottomSheet 슬롯, BottomSheetAi 슬롯, Column 슬롯

포함하는 컴포넌트 (12)InputHelpTextItemInputItemButton↳InputItemInputContentItem↳InputItemButtonLoaderItem↳ButtonIconItem↳ButtonInputHyphenItem↳InputContentItemInputTextItem↳InputContentItemInputCaretItem↳InputTextItemInputRightItem↳InputTextItemButtonIconItem↳InputRightItemInputClearButtonItem↳InputRightItem

사용 텍스트 스타일 (1)Body/14 medium

---

## InputCaretItem

용도What텍스트 입력 위치를 나타내는 세로 선 형태의 커서 인디케이터입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## InputClearButtonItem

용도What입력 필드의 내용을 지우는 원형 X 아이콘 버튼입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

---

## InputContentItem

용도What텍스트·주민등록번호·카드번호 등 입력 유형별 레이아웃을 표현하는 콘텐츠 영역입니다.

구성 — Variant VariantsText일반 텍스트를 입력하는 단일 필드에 사용합니다.SSN주민등록번호 입력에 사용합니다.Card카드번호 입력에 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (7)InputHyphenItemInputTextItemInputCaretItem↳InputTextItemInputRightItem↳InputTextItemButtonIconItem↳InputRightItemInputClearButtonItem↳InputRightItemIconItem↳ButtonIconItem

---

## InputHelpTextItem

용도What입력 안내(기본) 또는 오류 메시지(에러)를 표시하는 캡션 텍스트입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Caption/13 regular

---

## InputHyphenItem

용도What구분 형식 입력(주민등록번호·카드번호)에서 필드 사이에 표시되는 짧은 가로선 구분자입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## InputItem

용도What텍스트 입력 필드와 선택적 액션 버튼으로 구성된 단일 입력 행입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (10)ButtonInputContentItemButtonLoaderItem↳ButtonIconItem↳ButtonInputHyphenItem↳InputContentItemInputTextItem↳InputContentItemInputCaretItem↳InputTextItemInputRightItem↳InputTextItemButtonIconItem↳InputRightItemInputClearButtonItem↳InputRightItem

---

## InputRightItem

용도WhatInput 필드 우측 슬롯에 아이콘 버튼, 클리어 버튼, 시간 표기, 텍스트 라벨 중 하나를 전환해 보여줍니다.

배치 가능 영역미설정

포함하는 컴포넌트 (3)ButtonIconItemInputClearButtonItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/15 regular

---

## InputTextItem

용도WhatPlaceholder 또는 입력값을 표시하며 입력 진행 상태를 나타내는 텍스트 필드입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (5)InputCaretItemInputRightItemButtonIconItem↳InputRightItemInputClearButtonItem↳InputRightItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/16 medium

---

## InputArea

용도What레이블·여러 줄 입력 필드·도움말 텍스트로 구성된 텍스트 영역입니다.Why짧은 단답보다 긴 내용(메모·리뷰·설명 등)을 자유롭게 작성할 수 있도록 하기 위해 사용합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (3)InputAreaItemInputHelpTextItemInputCaretItem↳InputAreaItem

사용 텍스트 스타일 (1)Body/14 medium

---

## InputAreaItem

용도What여러 줄 텍스트를 입력할 수 있는 자유 입력 영역으로, 포커스·입력·완료·오류·비활성 상태를 표현합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)InputCaretItem

사용 텍스트 스타일 (1)Body/16 medium

---

## ListProductGrid

용도What썸네일을 상단에, 텍스트 정보를 하단에 배치하는 그리드용 세로형 카드입니다.

구성 — Variant VariantsProduct일반 상품(의류·식품 등) 그리드에 사용합니다.Movie영화·콘텐츠 그리드에 사용합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (12)TextProductGroupThumbnailRectangleItemThumbnailSquareItemBadgeGroup↳TextProductGroupButton↳TextProductGroupButtonIconItem↳TextProductGroupDividerContentsItem↳TextProductGroupIconItem↳TextProductGroupThumbnailRoundItem↳TextProductGroupToggleItem↳TextProductGroupBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## ListProductHorizontal

용도What서브타이틀·타이틀·캡션·배지 정보를 왼쪽에, 소형 정사각 썸네일을 오른쪽에 배치한 가로형 상품 카드입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (13)BadgeIconGroupTextProductGroupThumbnailRoundItemThumbnailSquareItemBadgeGroup↳TextProductGroupBadgeIconItem↳BadgeIconGroupButton↳TextProductGroupButtonIconItem↳TextProductGroupDividerContentsItem↳TextProductGroupIconItem↳TextProductGroupToggleItem↳TextProductGroupBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## NavigationBar

용도WhatAI 검색바·페이지 버튼 또는 AI 버튼·3탭 메뉴로 전환되는 하단 고정 내비게이션 바입니다.

구성 — Variant VariantsBenefit혜택 페이지에 위치할 때 사용합니다.Shopping쇼핑 페이지에 위치할 때 사용합니다.My마이 페이지에 위치할 때 사용합니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (4)NavigationButtonItemButtonIconItem↳NavigationButtonItemIconItem↳NavigationButtonItemNavigationTabItem↳NavigationButtonItem

---

## NavigationButtonItem

용도WhatAI 아이콘 원형 버튼 또는 현재 페이지 아이콘/확장형 3탭 메뉴로 동작하는 버튼입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (3)ButtonIconItemIconItemNavigationTabItem

사용 텍스트 스타일 (1)Body/16 medium

---

## NavigationTabItem

용도What아이콘과 라벨로 구성된 개별 탭 항목으로, 선택·미선택·Indeterminate 세 가지 상태를 표현합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

---

## NumericSpinnerItem

용도What감소(−)·숫자 표시·증가(+) 세 영역으로 구성된 버튼 기반 수량 입력 컨트롤입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (3)NumericSpinnerButtonItemButtonIconItem↳NumericSpinnerButtonItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/14 regular

---

## NumericSpinnerButtonItem

용도What값을 1씩 감소(Minus)하거나 증가(Plus)시키는 아이콘 버튼입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

---

## Pagination

용도WhatPaginationLeftButton, PaginationNumberItem(최대 5개), PaginationRightButton으로 구성된 페이지 탐색 바입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (5)PaginationLeftButtonPaginationNumberItemPaginationRightButtonButtonIconItem↳PaginationLeftButtonIconItem↳ButtonIconItem

---

## PaginationLeftButton

용도What이전 페이지 묶음으로 이동하는 왼쪽 화살표 버튼입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

---

## PaginationRightButton

용도What다음 페이지 묶음으로 이동하는 오른쪽 화살표 버튼입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

---

## PaginationNumberItem

용도What페이지 번호 하나를 현재 선택 여부에 따라 표시하는 페이지 번호 셀입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Body/15 mediumBody/15 semibold

---

## ProgressBar

용도What배경 트랙 위에 진행된 비율만큼 채워지는 가로 막대입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## ProgressStepper

용도What현재 단계(Count01)와 전체 단계 수(Count02)를 "1 / 99" 형식으로 표시하는 텍스트 인디케이터입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Body/14 semibold

---

## RadioItem

용도What선택(On)·비선택(Off) 상태를 원형 아이콘으로 표현하는 라디오 버튼 인디케이터입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## RadioLeftTextItem

용도What원형 라디오 버튼과 오른쪽 라벨 텍스트로 구성된 단일 라디오 선택 항목입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)RadioItem

---

## Search

용도What플레이스홀더·검색 아이콘·클리어 버튼으로 구성된 검색 입력 필드입니다.

배치 가능 영역Layout Frame, BottomSheet 슬롯, BottomSheetAi 슬롯, Column 슬롯

포함하는 컴포넌트 (4)ButtonIconItemInputCaretItemInputClearButtonItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/16 medium

---

## SearchAi

용도WhatAI 아이콘·텍스트 입력 영역·음성 입력 버튼으로 구성된 AI 전용 검색 입력 필드입니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (3)ButtonIconItemIconItemInputCaretItem

사용 텍스트 스타일 (1)Body/16 medium

---

## Select

용도What레이블·셀렉트 박스·도움말 텍스트로 구성된 선택 영역입니다.

배치 가능 영역Layout Frame, Accordion 슬롯, section-sectionslot, Column 슬롯

포함하는 컴포넌트 (3)InputHelpTextItemSelectItemIconItem↳SelectItem

사용 텍스트 스타일 (1)Body/14 medium

---

## SelectItem

용도WhatPlaceholder 또는 선택된 Value 텍스트와 드롭다운 아이콘으로 구성된 선택 박스입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Body/16 medium

---

## Skeleton

용도What로딩 중인 콘텐츠의 형태와 동일한 영역을 블록으로 미리 보여주는 자리 표시자입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## Slider

용도What트랙(Track) 위 손잡이(Handle)를 드래그해 값을 선택하는 슬라이더입니다. 손잡이 1개(단일 값) 또는 2개(범위 값) 구성을 지원합니다.

구성 — Variant VariantsSingle손잡이 1개로 단일 값 하나를 선택합니다.Range손잡이 2개로 시작값과 끝값 범위를 선택합니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (3)SliderHandleItemSliderLabelItemSliderTooltipItem↳SliderHandleItem

---

## SliderHandleItem

용도What원형 손잡이(Handle)와, 그 위에 선택적으로 표시되는 현재 값 툴팁(SliderTooltipItem)으로 구성됩니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)SliderTooltipItem

---

## SliderLabelItem

용도WhatCount(2~6)개의 텍스트로 구성된 라벨 그룹입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Caption/12 medium

---

## SliderTooltipItem

용도What현재 값(Count) 텍스트와 아래쪽을 향한 꼬리로 구성된 말풍선입니다.

구성 — Variant VariantsCenter손잡이가 트랙 중앙 부근에 있을 때 사용합니다.Left손잡이가 트랙 왼쪽 끝 근처에 있을 때 사용합니다.Right손잡이가 트랙 오른쪽 끝 근처에 있을 때 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Body/15 medium

---

## Spinner

용도What원형 트랙 위를 회전하는 인디케이터로 구성된 로딩 스피너입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (1)DimItem

---

## SwitchItem

용도What원형 핸들이 좌우로 이동하며 On/Off 상태를 전환하는 토글 스위치입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## TabFixed

용도What지정된 수(1~4개)의 탭이 화면 너비를 균등하게 나누는 탭 바입니다.

구성 — Variant Variants1Tab~4Tab탭 개수에 맞게 선택합니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (1)TabFixedItem

---

## TabScroll

용도What탭이 콘텐츠 너비로 좌측부터 나열되고, 화면 너비를 초과하면 가로 스크롤되는 탭 바입니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (3)chipRowTabScrollItemChipItem↳chipRow

---

## TabFixedItem

용도What화면 너비를 균등하게 차지하며 선택/비선택 상태를 시각적으로 구분하는 탭 아이템입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## TabScrollItem

용도What콘텐츠 너비(hug)로 표시되며 선택/비선택 상태를 시각적으로 구분하는 탭 아이템입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## TextProductGroup

용도WhatSubtitle(브랜드명·카테고리)·Title(상품명)·가격·뱃지 등을 위계에 맞게 쌓은 텍스트 묶음입니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (9)BadgeGroupButtonButtonIconItemDividerContentsItemIconItemThumbnailRoundItemToggleItemBadgeItem↳BadgeGroupButtonLoaderItem↳Button

---

## ThumbnailFull

용도What화면 가득 채우는 상품 이미지와 선택적으로 하단 인디케이터 도트를 포함하는 슬라이더 영역입니다.

구성 — Variant VariantsRectangle세로로 긴 직사각 비율의 전폭 이미지입니다.Square정사각 비율의 전폭 이미지입니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (4)chipRowIndicatorItemChipItem↳chipRowIndicatorDotItem↳IndicatorItem

---

## ThumbnailVideo

용도What영상 이미지 위에 반투명 딤 레이어와 재생 아이콘이 겹쳐진 고정 비율 영상 썸네일입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

---

## ThumbnailRectangleItem

용도What세로형 직사각형 비율로 이미지를 자르고 고정 크기로 표시하는 이미지 아이템입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## ThumbnailRoundItem

용도What원형(circle)으로 이미지를 자르고 고정 크기로 표시하는 이미지 컨테이너입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## ThumbnailSquareItem

용도What정사각형 비율로 이미지를 자르고 고정 크기로 표시하는 이미지 컨테이너입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## TitleGroupComplete

용도What상태 아이콘(체크/경고) + 제목 + 보조 캡션을 수직 중앙 정렬로 쌓은 결과 안내 타이틀 영역입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (2)DividerContentsItemIconItem

사용 텍스트 스타일 (3)Body/16 mediumCaption/13 mediumHeadline/24 medium

---

## TitleGroupPage

용도WhatHeadline 크기 제목·부제목·캡션 텍스트를 수직으로 쌓은 페이지 타이틀 영역입니다.

배치 가능 영역Page Slot, Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (3)Body/16 mediumCaption/13 mediumHeadline/24 medium

---

## TitleGroupSection

용도What제목 텍스트·선택적 인포 아이콘·우측 액션 영역으로 구성된 섹션 헤더입니다.

배치 가능 영역Layout Frame, Card 슬롯, BottomSheetAi 슬롯, BottomSheet 슬롯, Page Slot

포함하는 컴포넌트 (8)TitleGroupRightItemTitleTextRightItemBadgeItem↳TitleTextRightItemButton↳TitleGroupRightItemButtonIconItem↳TitleTextRightItemButtonText↳TitleGroupRightItemIconItem↳TitleGroupRightItemButtonLoaderItem↳Button

사용 텍스트 스타일 (2)Body/14 mediumTitle/18 medium

---

## TitleGroupRightItem

용도What타이틀 그룹 우측에 화살표·버튼·텍스트 링크 형태로 액션 또는 탐색 진입점을 제공하는 아이템입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (5)ButtonButtonIconItemButtonTextIconItemButtonLoaderItem↳Button

---

## TitleTextRightItem

용도What타이틀 텍스트 옆에 아이콘·배지·숫자 형태로 보조 정보를 표시하는 아이템입니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (3)BadgeItemButtonIconItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (1)Body/16 semibold

---

## TitleHome

용도WhatDisplay/26 regular 브랜드 컬러 텍스트 한 덩어리를 화면 폭에 맞춰 보여주는 홈 전용 타이틀입니다.

배치 가능 영역Page Slot

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Display/26 regular

---

## Toast

용도What아이콘·메시지 텍스트·선택적 액션 버튼으로 구성된 다크 플로팅 알림 바입니다.

배치 가능 영역템플릿 고정 영역, Page Slot

포함하는 컴포넌트 (2)ButtonTextIconItem

사용 텍스트 스타일 (1)Body/15 medium

---

## ToggleItem

용도What하트 아이콘과 선택적 카운트 숫자로 구성된 토글 버튼입니다.

구성 — Variant SelectionUnselected아직 좋아요를 누르지 않은 기본 상태에 사용합니다.Selected사용자가 이미 좋아요를 누른 상태에 사용합니다.

배치 가능 영역적용 대상 없음

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Caption/13 medium

---

## TooltipItem

용도What방향성 꼬리(tail)가 달린 흰색 말풍선 버블입니다.

배치 가능 영역템플릿 고정 영역

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Caption/13 medium

---

## AiAgentBottomSheet

용도What제목(+닫기 버튼)과 콘텐츠 슬롯(AiBottomSheetSlot)으로 구성된 컴팩트 글래스 패널입니다.

배치 가능 영역Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)이 슬롯에 담을 수 있는 자식(=Figma preferred values). 코드 SSOT(slotContexts.ts의 childKeys)에서 관리 — 상세·Slot·Flow 공통 소스.AiAgentBottomSheetItem

포함하는 컴포넌트 (2)ButtonIconItemIconItem↳ButtonIconItem

사용 텍스트 스타일 (2)Caption/13 mediumTitle/18 semibold

---

## AiAgentCard

용도What콘텐츠 슬롯(AiAgentCardSlot) 하나로 구성된 컴팩트 글래스 카드입니다.

배치 가능 영역Layout Frame

슬롯 자식 (담을 수 있는 컴포넌트)AccordionAlertBanner

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

---

## AiAgentMessage

용도WhatVariants=User는 우측 정렬 흰색 말풍선, Variants=Ai는 좌측 본문 텍스트로 렌더하는 대화 한 줄입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Body/14 mediumBody/15 medium (for AI)

---

## AiAgentTitle

용도WhatHeadline/22 regular 텍스트 한 덩어리(Title)를 폭에 맞춰 흘려 보여주는 블록입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Headline/22 regular

---

## AiAgentBottomSheetItem

용도What상단에 강조된 값(Value), 하단에 보조 설명(Subtext)을 세로로 쌓은 아이템입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (2)Body/16 mediumCaption/12 medium

---

## CheckboxCard

용도What체크박스·라벨·가격·설명으로 구성된 선택형 카드입니다.

구성 — Variant SelectionUnselected아직 선택되지 않은 기본 상태에 사용합니다.Selected사용자가 이 카드를 고른 상태에 사용합니다.

배치 가능 영역미설정

포함하는 컴포넌트 (2)CheckboxLeftTextItemCheckboxItem↳CheckboxLeftTextItem

사용 텍스트 스타일 (3)Body/14 regularBody/16 regularBody/16 semibold

---

## CouponDetail

용도What브랜드 썸네일·브랜드명·이벤트명·쿠폰 이름·유효기간과, 점선으로 구분된 쿠폰번호(또는 바코드) 영역을 한 장에 담은 카드입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (8)BadgeGroupbarcodeButtonDividerContentsItemThumbnailRoundItemBadgeItem↳BadgeGroupButtonLoaderItem↳ButtonIconItem↳Button

사용 텍스트 스타일 (4)Caption/11 mediumCaption/13 mediumCaption/13 semiboldTitle/20 semibold

---

## ProductDetailVisual

용도What상품 상세 비주얼 갤러리의 개별 이미지 슬라이드입니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (1)Caption/13 medium

---

## Profile

용도What원형 인물 사진 아래에 이름과 역할을 세로로 쌓은 프로필입니다.

배치 가능 영역Layout Frame

포함하는 컴포넌트 (1)ThumbnailRoundItem

사용 텍스트 스타일 (2)Caption/12 mediumCaption/13 medium

---

## RadioCard

용도What선택 시 강조 테두리·그림자로 상태를 표시하는 카드형 옵션 행입니다.

구성 — Variant SelectionSelected사용자가 이 카드를 고른 상태에 사용합니다.Unselected아직 선택되지 않은 기본 상태에 사용합니다.

배치 가능 영역미설정

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)

사용 텍스트 스타일 (3)Body/14 regularBody/16 regularBody/16 semibold

---

## RankingItem

용도What순위 번호·상품명·순위 변동 아이콘을 한 행에 나열한 랭킹 리스트 행입니다.

구성 — Variant VariantsEmphasis1~3위처럼 상위 순위를 강조해서 보여줘야 할 때 사용합니다.Default4위 이하 등 강조가 필요 없는 일반 순위를 표시할 때 사용합니다.

배치 가능 영역Layout Frame, Page Slot

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (2)Body/15 regularBody/15 semibold

---

## ButtonCardItem

용도What아이콘 위에 진입할 페이지명을 배치한 카드형 버튼입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (1)IconItem

사용 텍스트 스타일 (1)Caption/13 medium

---

## CellManageItem

용도What아이콘(선택)·제목·캡션(선택)을 좌측에, 라벨 버튼을 우측에 배치한 한 줄 리스트 셀입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (3)ButtonIconItemButtonLoaderItem↳Button

사용 텍스트 스타일 (2)Body/16 mediumCaption/12 medium

---

## SwitchManage

용도What두 옵션 중 하나를 선택하는 세그먼트 스위치입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (1)SwitchManageItem

---

## SwitchManageItem

용도What세그먼트 스위치의 선택 가능한 개별 라벨 항목입니다.

배치 가능 영역미설정

포함하는 컴포넌트 (0)다른 컴포넌트를 포함하지 않습니다 (기본 컴포넌트)
