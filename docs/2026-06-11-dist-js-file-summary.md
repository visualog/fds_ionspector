# FDS Inspector dist JS 파일 역할 요약

- 작성일: 2026-06-11
- 기준 경로: `dist/fds-inspector`
- 기준 빌드: `npm run build:extension` 산출물
- JS 파일 수: 26개
- 참고: `dist/`는 배포 산출물 경로이며, 실제 원본 코드는 프로젝트 루트의 동일 이름 파일 및 `popup/` 하위 파일입니다.

## 런타임 구성 개요

`dist/fds-inspector`의 JS 파일은 크게 4개 영역으로 나뉩니다.

1. **Background 서비스 워커**
   - `background.js`가 MV3 서비스 워커 진입점입니다.
   - `background-logic.js`, `bridge-token-source.js`, `snapshot-token-source.js`를 모듈로 가져와 탭 주입, 브리지 상태 확인, 토큰 스펙 전달을 처리합니다.

2. **Content Script 주입 모듈**
   - `background-logic.js`의 `CONTENT_SCRIPT_FILES` 순서대로 페이지에 주입됩니다.
   - `vendor/gsap.min.js`와 여러 helper 파일을 먼저 로드한 뒤, 마지막에 `content.js`가 전체 기능을 조립합니다.

3. **Popup UI**
   - `popup/popup.js`가 확장 팝업 화면의 연결 상태, 수동 재스캔, 토큰 소스 저장/초기화를 담당합니다.

4. **Token/Design/Rendering Helper**
   - 토큰 파싱, 스캔 규칙, 요약 모델, 툴바 UI, 플로팅 카드, 애니메이션 등을 작은 파일로 분리해 `content.js`가 의존합니다.

## JS 파일별 요약

| 파일 | 라인 수 | 영역 | 역할 및 주요 내용 |
| --- | ---: | --- | --- |
| `background.js` | 302 | Background | MV3 서비스 워커 진입점입니다. 활성 탭 상태를 관리하고, CSS/Content Script를 주입하며, 확장 아이콘 클릭 시 인스펙터를 토글합니다. 브리지 `/health` 확인, 브리지 토큰 스펙 전달, 스냅샷 토큰 로드, `SET_ACTIVE`, `BRIDGE_HEALTH`, `BRIDGE_TOKEN_SPECS`, `SNAPSHOT_TOKEN_SPECS` 메시지를 처리합니다. |
| `background-logic.js` | 221 | Background helper | Background에서 쓰는 순수 helper 모음입니다. Content Script 주입 파일 목록과 CSS 목록을 정의하고, 브리지 health payload를 연결 상태로 해석합니다. URL 주입 가능 여부, 배지 문구, 무시 가능한 토글 에러 판정도 포함합니다. |
| `bridge-token-source.js` | 232 | Token source | live bridge에서 받은 토큰 payload를 FDS Inspector가 사용할 수 있는 registry/spec 형태로 정규화합니다. 색상 토큰, spacing/radius override, bridge 검색 결과 값 정규화 등을 담당합니다. |
| `snapshot-token-source.js` | 304 | Token source | 번들에 포함된 snapshot token JSON을 읽어 alias를 해석하고, inspector용 color/spacing/radius spec을 구성합니다. 브리지 연결이 없거나 기본 토큰 세트가 필요할 때 사용하는 정적 토큰 소스입니다. |
| `vendor/gsap.min.js` | 10 | Vendor | `content-motion.js`에서 사용하는 GSAP 애니메이션 라이브러리의 minified 번들입니다. 패널, 카드, 핀, 리스트 전환 애니메이션에 사용됩니다. |
| `toolbar-state.js` | 441 | Content helper | 툴바 상태 모델과 버튼 정의를 담습니다. 툴바 모드, 필터, 카운트 배지, collapsed/default 표시 모델, 네비게이션 상태 계산 등 툴바의 데이터 구조를 제공합니다. |
| `toolbar-drag.js` | 57 | Content helper | 툴바와 패널 드래그에 필요한 좌표 계산 helper입니다. 화면 밖으로 벗어나지 않도록 위치를 clamp하고, 드래그 임계값과 스크롤 이동 목표를 계산합니다. |
| `style-token-detection.js` | 71 | Scan helper | CSS stylesheet 또는 inline style에서 작성자가 사용한 token reference를 탐지합니다. 실제 값이 raw처럼 계산되더라도 토큰 기반 값인지 판단하는 데 사용됩니다. |
| `token-source.js` | 80 | Token source | 활성 토큰 스펙에서 색상 토큰 registry를 구성합니다. 토큰 이름과 resolved value를 매핑해 스캔/추천 로직이 동일한 registry를 사용할 수 있게 합니다. |
| `design-variables.js` | 178 | Design data | FDS Inspector의 정적 design variable/spec 정의입니다. CSS variable map, 허용 spacing/radius/color scale, 툴바 UI spec 등 기본 디자인 기준값을 제공합니다. |
| `html-utils.js` | 18 | Utility | HTML 문자열 생성 시 사용하는 `escapeHtml` helper입니다. 요약 패널과 카드 렌더링에서 텍스트 삽입 안전성을 보조합니다. |
| `content-render.js` | 393 | Renderer | Content UI 마크업 생성 helper입니다. 아이콘, 툴바, 요약 탭, 그룹, 리스트 항목, 위반 메시지, 토큰 context label 등을 렌더링하는 함수를 제공합니다. |
| `content-scan-utils.js` | 117 | Scan helper | 스캔 결과 처리 공통 helper입니다. issue signature 생성, 직접 텍스트 추출, issue category/tone/color part 계산, RGB/RGBA to HEX 변환 등을 담당합니다. |
| `content-theme.js` | 53 | Content helper | 인스펙터 UI의 CSS custom property를 문서 루트에 적용합니다. 툴바 위치, 크기, variant, geometry 값을 CSS 변수로 반영합니다. |
| `content-state-utils.js` | 47 | Content helper | 빈 scan data 구조와 상태 문구를 생성합니다. 활성 필터, 로딩 상태, 표시 label 등 UI state 초기화에 사용됩니다. |
| `content-inspection.js` | 231 | Scan rules | 실제 DOM 검사 규칙을 담습니다. 색상, 폰트, spacing, radius 값을 검사하고, raw/missing token 위반을 판정합니다. padding/margin/gap 위반의 종류와 side/value metadata도 생성합니다. |
| `content-summary-model.js` | 212 | Summary model | scan data를 요약 패널에 표시 가능한 모델로 변환합니다. visible issue entry 계산, tone count, 그룹핑, 중복 제거, detail render key, color subtab 데이터를 구성합니다. |
| `content-summary-panel.js` | 150 | Summary panel | 요약 패널 DOM 상태 helper입니다. 패널 표시/숨김, 드래그 상태, 위치 적용, 자연 높이/목표 높이 측정 등 패널 shell 동작을 담당합니다. |
| `content-toolbar-ui.js` | 343 | Toolbar UI | 툴바 UI helper factory입니다. 툴바 shell 완성도 확인, root 표시/숨김, 위치 리셋, collapsed model 반영, 이벤트 바인딩, 필터 명령 액션 해석을 담당합니다. |
| `content-bridge-specs.js` | 183 | Bridge specs | bridge/snapshot token spec 갱신 상태를 계산합니다. spec signature, context label, token source summary, 다음 refresh state를 만들어 content orchestration에 전달합니다. |
| `content-token-suggestions.js` | 101 | Suggestions | raw 값 위반에 대한 대체 토큰 추천 helper입니다. 색상, spacing, radius 값에 대해 후보 토큰을 추출하고 우선순위를 계산합니다. |
| `content-floating-inspector.js` | 202 | Inspector card | 플로팅 위반 카드와 핀의 위치 계산 helper입니다. viewport clamp, 타깃 겹침 회피, pin label formatting, 타깃 표시 여부, hide timer를 다룹니다. |
| `content-scan-runner.js` | 138 | Scan runner | 비동기 DOM 스캔 실행기입니다. batch 단위로 요소를 검사하고, 필터별 count, inactive/visible 필터 처리, issue metadata forwarding, excluded/skipped meta를 관리합니다. |
| `content-motion.js` | 504 | Motion | GSAP 기반 애니메이션 레이어입니다. 패널, 카드, 핀, 복사 피드백, 리스트 전환 애니메이션을 처리하며, reduced motion 또는 GSAP 미로드 환경의 fallback도 포함합니다. |
| `content.js` | 3866 | Content orchestrator | 페이지에 주입되는 핵심 orchestrator입니다. UI 생성, 상태 관리, DOM 스캔 실행, 요약 패널 렌더링, 위반 카드/핀/오버레이 표시, bridge/snapshot spec 갱신, 툴바/필터 명령, 페이지 interaction shield, runtime message 처리를 모두 조립합니다. |
| `popup/popup.js` | 188 | Popup | 확장 팝업 UI 로직입니다. 활성 탭과 content script 연결 상태를 확인하고, 수동 재스캔/하이라이트 토글을 보냅니다. JSON 파일 또는 URL 기반 토큰 소스를 저장/초기화하고 활성 탭에 `TOKEN_SOURCE_UPDATED`를 알립니다. |

## 주입 순서

Content Script는 다음 순서로 페이지에 주입됩니다.

```text
vendor/gsap.min.js
toolbar-state.js
toolbar-drag.js
style-token-detection.js
token-source.js
bridge-token-source.js
snapshot-token-source.js
design-variables.js
html-utils.js
content-render.js
content-scan-utils.js
content-theme.js
content-state-utils.js
content-inspection.js
content-summary-model.js
content-summary-panel.js
content-toolbar-ui.js
content-bridge-specs.js
content-token-suggestions.js
content-floating-inspector.js
content-scan-runner.js
content-motion.js
content.js
```

이 순서 때문에 helper 모듈들은 대부분 `globalThis.FDS...` 형태로 API를 먼저 등록하고, 마지막의 `content.js`가 해당 API들을 읽어 전체 인스펙터 기능을 실행합니다.

## 정리 메모

- `content.js`는 아직 가장 큰 파일이며, 현재는 orchestration, overlay, runtime message, UI 연결 로직이 집중되어 있습니다.
- 검사 규칙, 요약 모델, 툴바, 플로팅 카드, 모션, 토큰 추천, 브리지 스펙 계산은 이미 별도 helper 파일로 분리되어 있습니다.
- `dist/fds-inspector`의 JS 파일은 배포 검증용으로 확인할 수 있지만, 수정은 원본 파일에서 진행한 뒤 `npm run build:extension`으로 다시 생성하는 흐름이 안전합니다.
