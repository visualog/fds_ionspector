# Extension Design Admin Design

## Goal

FDS Inspector 익스텐션의 디자인 토큰, 검사 규칙, 배포 산출물, QA 문서를 한 화면에서 관리하는 로컬 운영 대시보드를 만든다.

## Recommended Direction

사이드 프로젝트는 같은 repo 안의 `admin/` 디렉토리에 둔다.

```text
FDS_inspector/
  admin/
    package.json
    src/
    public/
    vite.config.js
  docs/
  tokens/
  dist/
  content.js
  manifest.json
```

이 구조는 익스텐션 런타임과 관리 시스템을 분리하면서도 같은 Git 히스토리에서 토큰, 문서, 배포 산출물을 함께 관리할 수 있게 한다. 현재 `scripts/build-extension.mjs`는 배포 대상 파일을 명시적으로 복사하므로, `admin/`은 익스텐션 zip에 포함되지 않는다.

## Scope

1단계는 실제 편집/저장 기능보다 **운영 상태를 한눈에 보는 read-first 관리 화면**에 집중한다.

- 토큰 현황: `tokens/0.1.primitives.json`, `tokens/0.2.theme.json`, `tokens/1.0.semantic.json`
- 검사 규칙 현황: color, text, spacing, radius 검사 영역과 관련 JS 파일
- 배포 현황: `dist/fds-inspector`, `dist/fds-inspector.zip`, runtime file list
- QA/검증 현황: `docs/verification`, `docs/plans`, 최근 handoff 문서 링크
- 모듈 현황: `content.js`와 helper JS 파일의 역할 요약

## Non-goals

1단계에서는 다음을 하지 않는다.

- 토큰 JSON 직접 수정/저장
- 익스텐션 빌드 자동 실행
- Chrome Extension 내부 options page 통합
- 원격 DB 또는 로그인 기능
- 다중 프로젝트 관리

이 기능들은 admin 화면이 유용하다는 것이 확인된 뒤 2단계 이후로 확장한다.

## Product Shape

첫 화면은 랜딩 페이지가 아니라 바로 운영 대시보드로 진입한다.

권장 IA:

```text
Dashboard
Token Registry
Inspection Rules
Overlay & Interaction
Build & Release
QA Documents
Module Map
```

## Dashboard

대시보드는 4개의 핵심 상태를 보여준다.

- Token status: token JSON 존재 여부, 색상/spacing/radius spec 요약
- Rule status: 검사 영역별 관련 파일과 테스트 존재 여부
- Build status: dist 디렉토리와 zip 존재 여부, runtime file count
- QA status: verification 문서와 handoff 문서 링크

## Token Registry

토큰 페이지는 1단계에서 읽기 전용으로 구성한다.

- primitive/theme/semantic token 파일 목록
- 각 JSON 파일의 최상위 collection 또는 token group 요약
- bridge token과 snapshot token의 관계 설명
- 추후 편집 기능을 붙일 수 있는 export/import 위치

## Inspection Rules

검사 규칙 페이지는 사용자 관점의 위반 타입과 코드 위치를 연결한다.

- Color: `style-token-detection.js`, `token-source.js`, `content-inspection.js`
- Text: `content-inspection.js`, `content-scan-utils.js`
- Spacing: `content-inspection.js`, `content.js`, `overlay.css`
- Radius: `content-inspection.js`, `content-token-suggestions.js`

각 항목은 "무엇을 검사하는지", "어떤 파일이 담당하는지", "테스트 파일이 무엇인지"를 표시한다.

## Build & Release

배포 페이지는 `scripts/build-extension.mjs`와 `dist/` 상태를 표시한다.

- build command: `npm run build:extension`
- output directory: `dist/fds-inspector`
- output zip: `dist/fds-inspector.zip`
- runtime file list
- 배포 handoff 문서 링크

1단계에서는 버튼으로 빌드를 실행하지 않고, 명령어와 현재 산출물 상태만 표시한다.

## QA Documents

QA 페이지는 문서 링크 허브로 시작한다.

- `docs/verification/*.md`
- `docs/plans/*.md`
- `docs/refactor-reports/*.md`
- 최신 handoff 문서

나중에 체크리스트 완료 상태나 스크린샷 증거를 UI에서 관리할 수 있다.

## Module Map

모듈 맵은 `dist/fds-inspector`의 JS 요약 문서와 연결한다.

- Background
- Content orchestrator
- Content helpers
- Token sources
- Popup
- Vendor

초기 데이터는 `docs/2026-06-11-dist-js-file-summary.md`를 기준으로 수동 curated data를 만든다.

## Architecture

권장 기술 스택:

- Vite
- React
- TypeScript
- CSS Modules 또는 단일 CSS
- lucide-react

관리 시스템은 브라우저에서 동작하는 정적 웹앱으로 시작한다. repo 파일을 직접 읽어오는 기능은 브라우저 보안 제약 때문에 1단계에서는 넣지 않고, 필요한 요약 데이터는 `admin/src/data/*.ts`의 curated data로 둔다.

2단계에서 Node 기반 local API 또는 script-generated JSON을 붙이면 실제 repo 상태를 자동으로 반영할 수 있다.

## Data Flow

1단계 데이터 흐름:

```text
repo docs/tokens/scripts
  -> 개발자가 확인
  -> admin/src/data/*.ts curated metadata
  -> React dashboard rendering
```

2단계 후보 데이터 흐름:

```text
repo files
  -> node script scans metadata
  -> admin/public/generated/*.json
  -> React dashboard rendering
```

## Testing

1단계 테스트는 가볍게 시작한다.

- `npm run build`로 admin 앱 빌드 확인
- 주요 data module unit test
- Playwright 또는 browser smoke test는 2단계 후보

기존 익스텐션 테스트인 `npm test`와 `npm run build:extension`은 admin 추가 후에도 통과해야 한다.

## Risks

- repo 파일을 브라우저에서 직접 읽을 수 없으므로, 1단계는 curated data 기반으로 시작해야 한다.
- 관리 페이지가 익스텐션 배포 대상에 섞이면 안 된다.
- admin 앱 의존성이 루트 package와 섞이면 기존 Node test 환경이 복잡해질 수 있다.

따라서 `admin/package.json`을 별도로 두고 루트 빌드/테스트와 분리한다.

## Approval State

사용자는 통합 운영 대시보드 중심의 C안을 선호했다. 위치는 같은 repo 안의 분리 디렉토리 `admin/`이 적합한 방향으로 합의했다.
