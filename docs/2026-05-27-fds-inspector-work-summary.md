# 2026-05-27 FDS Inspector 작업 정리

## 목표

FDS Inspector가 Figma xbridge에 의존하지 않고, 저장된 디자인 토큰 스냅샷을 기준으로 사이트의 토큰 사용 여부를 검수할 수 있도록 개선했다. 이후 확장 프로그램 실행 시 발생하던 xbridge 안내 메시지, Chrome 응답 없음 모달, 느린 검사 문제를 줄이는 방향으로 성능 개선을 진행했다.

## 오늘 진행한 작업

### 1. 저장된 토큰 스냅샷 기반 검수

- `tokens/` 폴더의 토큰 파일을 기준 소스로 사용하도록 구성했다.
  - `tokens/0.1.primitives.json`
  - `tokens/0.2.theme.json`
  - `tokens/1.0.semantic.json`
- `snapshot-token-source.js`를 추가해 토큰 스냅샷을 검사 가능한 registry/spec 형태로 변환했다.
- alias resolve를 구현했다.
  - 예: `Color/text/primary -> light/Blue/100 -> #252d38`
  - 예: `spacing/16 -> 16px`
- 원본 Figma 컬렉션 구조인 `0.1. primitives`, `0.2.theme*`, `1.0.semantic`을 보존해 collection/mode 메타를 함께 유지한다.
- color, spacing, radius 기준을 content script가 사용할 수 있는 형태로 생성했다.
- `SNAPSHOT_TOKEN_SPECS` runtime message를 추가해 background에서 content script로 스냅샷 spec을 전달하도록 했다.

### 2. xbridge 의존도 완화

- 확장 프로그램 실행 시 xbridge가 없어도 기본 검사 툴바가 뜨도록 수정했다.
- 저장된 토큰 스냅샷이 있으면 `피그마에서 FDS xbridge를 실행하세요` 메시지를 기본 상태로 표시하지 않도록 했다.
- 확장 프로그램 실행 시 bridge polling을 시작하지 않도록 변경했다.
- 새로고침/재검사 동작이 bridge 재요청이 아니라 현재 스냅샷 기준 재검사를 수행하도록 정리했다.
- popup footer 문구를 xbridge 전용 표현에서 스냅샷 검수 기준 문구로 조정했다.

### 3. content.js 분리 및 유지보수성 개선

큰 `content.js`에서 일부 책임을 분리했다.

- `content-render.js`
  - 툴바/요약 패널 렌더링
  - 위반 항목 파싱
- `content-scan-utils.js`
  - 색상 변환
  - 이슈 분류
  - 직접 텍스트 확인
- `content-theme.js`
  - CSS 변수 적용
  - 툴바 geometry 변수 적용
- `content-state-utils.js`
  - 빈 scan data 생성
  - 필터 라벨/상태 메시지
- `content-inspection.js`
  - color/font/spacing/radius 검사 로직
- `content-scan-runner.js`
  - DOM scan 실행기
  - batch/yield 기반 비차단 검사

### 4. 검사 정확도 개선

- spacing/radius 검사에서 단순히 값이 scale에 있으면 통과시키는 대신, 아래 상태를 구분하도록 개선했다.
  - CSS token reference 사용: 정상
  - token 값과 같은 raw value 사용: 경고
  - token scale 밖의 값 사용: 위반
- bridge 기반 spec에도 `spacingTokens`, `radiusTokens` map을 추가했다.
- snapshot 기반 spec에서도 동일한 token map을 생성한다.

### 5. 성능 개선

확장 프로그램 실행 시 Chrome의 “응답 없는 페이지” 모달이 뜨는 문제를 줄이기 위해 scan 구조를 개선했다.

- 기존 문제:
  - `body *` 전체를 동기 순회
  - 각 요소마다 `getComputedStyle` 반복 호출
  - 카운트 계산용 전체 검사와 표시용 전체 검사를 별도로 실행
  - 안정화 목적의 반복 재검사
  - SVG/path/script/style 등 검사 대상이 아닌 노드까지 포함
- 개선 내용:
  - `content-scan-runner.js`에서 batch 단위로 DOM scan 수행
  - 기본 batch size: `80`
  - batch time budget: `12ms`
  - budget 초과 시 브라우저에 제어권 반환
  - 최대 검사 요소 수: `6000`
  - 초대형 DOM에서는 `truncated: true`로 진단 가능
  - script/style/svg/path 등 비검사 대상 tag 제외
  - 전체 카운트는 유지하면서 실제 이슈 엔트리는 active filter 중심으로 생성

### 6. 성능 진단 추가

scan 완료 시 콘솔에 진단 로그를 남기도록 했다.

```text
[FDS Inspector] scan metrics
```

포함되는 주요 값:

- `durationMs`
- `totalElementCount`
- `scannedElementCount`
- `skippedElementCount`
- `batchYieldCount`
- `truncated`
- `issueCount`
- `activeFilter`

content script message로도 마지막 scan metrics를 확인할 수 있게 했다.

- `PING`
- `GET_SCAN_METRICS`

### 7. 검증 fixture 추가

큰 DOM에서 scan 응답성을 확인하기 위한 fixture를 추가했다.

- `docs/verification/large-dom-scan-fixture.html`
- `docs/verification/large-dom-scan-check.md`

검증 포인트:

- Chrome 응답 없음 모달이 뜨지 않는지
- 툴바가 scan 중에도 반응 가능한지
- 콘솔에 scan metrics가 출력되는지
- 큰 fixture에서 `batchYieldCount > 0`인지
- 초대형 DOM에서 `truncated`가 올바르게 기록되는지

## 테스트 현황

현재 전체 테스트는 통과한다.

```text
npm test
```

결과:

```text
84 tests passed
0 failed
```

추가로 주요 파일의 문법 체크도 통과했다.

```text
node --check content.js
node --check content-scan-runner.js
```

## 주요 변경 파일

- `snapshot-token-source.js`
- `snapshot-token-source.test.js`
- `content-scan-runner.js`
- `content-scan-runner.test.js`
- `content-inspection.js`
- `content-inspection.test.js`
- `content-render.js`
- `content-render.test.js`
- `content-scan-utils.js`
- `content-scan-utils.test.js`
- `content-state-utils.js`
- `content-state-utils.test.js`
- `content-theme.js`
- `content-theme.test.js`
- `background.js`
- `background-logic.js`
- `background-logic.test.js`
- `content.js`
- `toolbar-state.js`
- `toolbar-state.test.js`
- `popup/popup.html`
- `manifest.json`
- `tokens/`
- `docs/verification/large-dom-scan-fixture.html`
- `docs/verification/large-dom-scan-check.md`

## 앞으로 개선이 필요한 부분

### 1. 실제 Chrome 확장 실행 검증

현재 자동 테스트는 Node 기반 로직 검증 중심이다. 실제 Chrome에서 다음을 확인해야 한다.

- 확장 프로그램 reload 후 정상 주입 여부
- xbridge 없이 스냅샷 기준 검사 동작 여부
- 실제 문제 페이지에서 응답 없음 모달 재현 여부
- 콘솔 scan metrics 수치 확인
- Windows Chrome/Edge에서 동일하게 동작하는지 확인

### 2. viewport 우선 검사 모드

현재는 최대 6000개까지 전체 DOM을 검사한다. 초대형 서비스 페이지에서는 다음 전략이 더 적합할 수 있다.

- 현재 viewport 안의 요소 우선 검사
- 스크롤 시 주변 영역 점진 검사
- summary는 전체 카운트 대신 “현재 화면 기준”과 “전체 페이지 기준”을 분리

### 3. 검사 범위 옵션화

사용자에게 검사 범위를 선택하게 하는 옵션이 필요하다.

- 현재 화면만 검사
- 전체 페이지 검사
- 선택 영역만 검사
- 특정 container 이하만 검사

### 4. scan metrics UI 노출

현재 metrics는 console 중심이다. 디버깅과 신뢰성을 위해 popup 또는 summary panel에 일부 정보를 노출할 수 있다.

- 마지막 검사 시간
- 검사한 요소 수
- 생략된 요소 수
- max element cap 도달 여부

### 5. 토큰 스냅샷 업데이트 UX

현재 `tokens/*.json`은 extension package에 포함된 정적 파일이다. 실제 운영에서는 다음 UX가 필요할 수 있다.

- 토큰 JSON import
- import한 토큰의 유효성 검사
- alias resolve 실패 목록 표시
- 현재 사용 중인 token snapshot 이름/버전 표시
- Light/Dark theme 선택

### 6. bridge와 snapshot의 역할 정리

앞으로의 구조는 아래처럼 명확히 나누는 것이 좋다.

- snapshot: 기본 검사 기준
- xbridge: 선택적 live sync / 최신 Figma 상태 확인
- bridge 실패: 검사 기능에는 영향 없음

즉 xbridge는 필수 런타임 의존성이 아니라 “선택적 업데이트 채널”로 다루는 방향이 적절하다.

### 7. content.js 추가 분리

이미 일부 분리를 진행했지만 `content.js`는 아직 크다. 다음 단위로 더 분리할 수 있다.

- scan orchestration
- summary panel state
- hover inspector card
- toolbar event binding
- bridge/snapshot state management

### 8. 성능 회귀 테스트 자동화

현재 fixture는 수동 검증용이다. 다음 단계에서는 Playwright 또는 Chrome automation으로 자동화할 수 있다.

- fixture 페이지 열기
- 확장 프로그램 주입
- scan 완료 대기
- scan metrics 수집
- `durationMs`, `batchYieldCount`, `truncated` 기준 검증

### 9. 패키징 전 점검

배포 전에는 다음을 확인해야 한다.

- `fds-design-tokens.json` 같은 실패/임시 파일 제외 여부
- `.DS_Store` 제외 여부
- `tokens/` 포함 여부
- manifest 권한 최소화 유지
- Windows 경로 문제 없음 확인

## 다음 추천 작업 순서

1. Chrome에서 `large-dom-scan-fixture.html`로 수동 성능 확인
2. 실제 문제가 발생했던 사이트에서 scan metrics 수집
3. metrics 기준으로 `MAX_SCAN_ELEMENTS`, `SCAN_BATCH_SIZE`, `SCAN_BATCH_BUDGET_MS` 조정
4. viewport 우선 검사 모드 설계
5. scan metrics를 popup 또는 summary panel에 노출
6. Playwright/Chrome 자동 회귀 테스트 추가
