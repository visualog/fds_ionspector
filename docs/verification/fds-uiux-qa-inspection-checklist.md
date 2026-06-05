# FDS Inspector UI/UX QA 검수 체크리스트

검수 기준일: 2026-05-29

## 목표

FDS Inspector가 단순히 위반을 찾는 데서 끝나지 않고, 사용자가 위반 의미와 위치, 영향 범위, 다음 조치를 빠르게 이해할 수 있는지 검수한다.

## 핵심 사용자 질문

- 지금 어떤 검사 결과를 보고 있는가?
- 어떤 값이나 토큰 사용이 문제인가?
- 몇 개 DOM 요소가 영향을 받는가?
- 클릭하면 실제 화면의 어디로 이동하는가?
- 오류나 빈 결과일 때 다음에 무엇을 해야 하는가?

## 필수 검수 항목

| 영역 | 체크 | 판정 기준 |
| --- | --- | --- |
| 상태 인지 | 검사 중/완료/오류 상태가 구분되는가 | 완료에는 검사 요소 수, 전체 요소 수, 시간, 일부 검사 여부가 표시된다 |
| 위반 의미 | 그룹과 상세 항목이 종류, 값, 상태를 함께 보여주는가 | `패딩`, `오른쪽 패딩`, `원시값 직접 사용`, 값이 한 줄에서 확인된다 |
| 개수 명확성 | 개수 표현이 토큰 수와 DOM 요소 수를 구분하는가 | 그룹은 `N개 요소`, 토큰 메타는 `기준 ... 토큰 N개`로 표현한다 |
| 요약 우선순위 | 큰 DOM 요소 수보다 검토 패턴을 먼저 보여주는가 | 카드의 주 숫자는 `검토 패턴`, `미등록`, `원시값`이고 요소 수는 `영향 N개 요소` 보조 문구로 표시한다 |
| 결과 탐색 | 그룹/상세 클릭 시 실제 요소로 이동하는가 | 대표 핀 또는 상세 핀이 표시되고 해당 요소로 스크롤 요청이 발생한다 |
| 텍스트 잘림 | 잘린 텍스트의 전체 의미를 복구할 수 있는가 | `title` 또는 `aria-label`에 전체 정보와 클릭 결과가 있다 |
| 컬러 탭 | 컬러 전용 탭이 적절히 노출되는가 | 컬러 검사에만 BG/Border/Text가 보이고 각 탭은 전체 접근성 이름을 가진다 |
| 오류 회복 | 오류 상태가 다음 행동을 알려주는가 | 새로고침 버튼으로 다시 검사하라는 문구가 표시된다 |
| 키보드 접근 | 버튼, 탭, 그룹, 상세 항목이 키보드 접근 가능한가 | 모두 실제 `button`이고 포커스 시 대표 요소를 미리 보여준다 |
| 대형 DOM | 큰 페이지에서 멈추지 않는가 | batch yield가 발생하고 최대 검사 수를 넘으면 일부 검사로 표시된다 |

## Fixture별 검수 시나리오

### 1. Spacing Direction Fixture

URL: `http://127.0.0.1:8765/docs/verification/spacing-direction-fixture.html`

- 간격 검사 패널에 컬러 탭이 없어야 한다.
- `패딩 14px`, `오른쪽 패딩 14px`, `마진 14px`이 서로 다른 그룹으로 보여야 한다.
- 그룹 개수는 `3개 요소`처럼 DOM 요소 단위로 읽혀야 한다.
- 그룹 클릭 시 대표 요소 핀이 표시되고 대표 요소로 이동해야 한다.
- 상세 항목 클릭 시 해당 상세 요소로 이동해야 한다.

### 2. Large DOM Fixture

URL: `http://127.0.0.1:8765/docs/verification/large-dom-scan-fixture.html`

- 검사 완료 메타가 `6,000/7,502개 요소`, 소요 시간, `일부만 검사`를 포함해야 한다.
- DevTools 로그의 `batchYieldCount`가 0보다 커야 한다.
- `truncated`가 `true`여야 한다.
- 컬러 검사에서만 BG/Border/Text 탭이 표시되어야 한다.
- 0건인 컬러 tone이 선택되어 결과가 비어 보이면 실패다.

### 3. Error State Fixture

URL: `http://127.0.0.1:8765/docs/verification/scan-error-state-fixture.html`

- 로딩 상태가 남지 않아야 한다.
- `검사 중 오류가 발생했습니다. 새로고침 버튼으로 다시 검사해 주세요.`가 표시되어야 한다.
- 이전 위반 핀이나 하이라이트가 남으면 실패다.

## Release Gate

- Node tests: `npm test` 통과
- Fixture automation: spacing, large DOM, error state 주요 텍스트와 interaction 통과
- Manual Chrome extension check: 확장 아이콘 클릭 경로에서 fixture 3개 재확인
- Real page check: LUKE에서 최소 컬러/간격/라운드 결과 클릭 1회씩 확인

## 현재 개선 반영

- 그룹 count copy를 `N곳`에서 `N개 요소`로 변경
- 그룹/상세 항목에 클릭 결과를 설명하는 `aria-label`과 `title` 추가
- 컬러 탭에 전체 의미와 count를 담은 접근성 label 추가
- 그룹 클릭 시 대표 요소로 스크롤하도록 보강
- 오류 문구에 재검사 행동 안내 추가
- 탭, 토글 카드, 닫기 버튼, 툴바 버튼에 명확한 키보드 포커스 링 추가
- 요약 카드가 큰 요소 수 대신 패턴 수를 먼저 보여주고, 영향 범위는 보조 caption과 접근성 label로 제공하도록 변경

## 2026-06-01 패턴 우선 요약 UX 검수 결과

검수 방식: 단위 렌더러 테스트로 카드 모델/마크업을 고정하고, 로컬 HTTP fixture를 Chrome에 주입해 실제 패널 텍스트와 interaction을 확인했다.

- 비컬러 요약: `검토 패턴`을 주 숫자로 표시하고 `영향 요소`를 보조 카드로 분리한다.
- 컬러 요약: `미등록`, `원시값`을 주 숫자로 표시하고 `영향 N개 요소` caption으로 실제 영향 범위를 제공한다.
- 접근성 label: 카드 label, 주 숫자, 영향 caption을 한 문장으로 읽을 수 있다.
- 대형 DOM fixture: `원시값` 카드가 `영향 1개 요소` caption을 표시하고, 원시값 그룹 자체는 목록에 계속 노출된다.
- spacing fixture: `검토 패턴`과 `영향 요소`가 동시에 표시되어 우선순위와 영향 범위를 분리한다.
- 대표 요소 카드: 추천 토큰이 있는 항목은 `대체 토큰`과 `토큰명 복사` 버튼을 제공한다.

## 2026-05-29 자동 검수 결과

검수 방식: 로컬 HTTP fixture를 열고 content script를 실제 확장 주입 순서로 실행한 뒤 `TOGGLE` 메시지로 검사 UI를 활성화했다.

### Spacing Direction Fixture

- 결과: 통과
- 표시 문구: `패딩 14px`, `오른쪽 패딩 14px`, `마진 14px`이 별도 그룹으로 표시됨
- 개수 문구: `3개 요소`, `1개 요소`로 표시됨
- 그룹 접근성 이름: `패딩 14px, 비규격, 3개 요소. 클릭하면 대표 요소로 이동하고 상세 목록을 펼칩니다.`
- 그룹 클릭 후 상세 항목: 3개 표시
- 그룹 클릭 후 대표 핀: 표시됨
- 그룹 클릭 후 스크롤 호출: 1회 확인

### Large DOM Fixture

- 결과: 통과
- 검사 메타: `6,000/7,502개 요소`, 약 `6.0초`, `일부만 검사`
- `batchYieldCount`: 225
- `truncated`: true
- 컬러 탭 접근성 이름:
  - `배경색 1개 요소`
  - `보더색 1개 요소`
  - `글자색 2001개 요소`
- 그룹 접근성 이름: `배경색 #f6f8fa, 원시값 직접 사용, 1개 요소. 클릭하면 대표 요소로 이동하고 상세 목록을 펼칩니다.`
- 그룹 클릭 후 대표 핀: 표시됨
- 그룹 클릭 후 스크롤 호출: 1회 확인

### Error State Fixture

- 결과: 통과
- 오류 문구: `검사 중 오류가 발생했습니다. 새로고침 버튼으로 다시 검사해 주세요.`
- 로딩 잔상: 없음
- 위반 그룹: 0개
- 컬러 탭 접근성 이름:
  - `배경색 0개 요소`
  - `보더색 0개 요소`
  - `글자색 0개 요소`

## 검증 명령

```bash
node --test content-render.test.js content-scan-runner.test.js
node --check content.js
node --check content-render.js
node --check content-scan-runner.js
npm test
npm run qa:uiux
```

결과:

- 관련 테스트: 28개 통과
- 전체 테스트: 109개 통과
- syntax check: 3개 통과
- UX/UI fixture QA: spacing, large DOM, error state 전체 통과

## 2026-05-29 V2 자동 검수 게이트

새 반복 검수 명령:

```bash
npm run qa:uiux
```

통과 항목:

- `spacing-direction`
  - summary panel 표시
  - viewport 내부 유지
  - metric card 접근성 label 확인
  - 컬러 전용 탭 미표시
  - 방향/전체 spacing 그룹 확인
  - `개 요소` count copy 확인
  - 그룹/상세 행 click 안내 확인
  - 그룹 click 후 상세 목록, 대표 pin, scroll 요청 확인
- `large-dom`
  - summary panel 표시
  - 6000개 scan cap 확인
  - 전체 7502개 count 확인
  - partial scan/truncated 확인
  - batch yield 확인
  - `일부만 검사` copy 확인
  - color tab 접근성 label 확인
  - nonzero primitive issue 표시 확인
  - 그룹 click 후 대표 pin, scroll 요청 확인
- `error-state`
  - summary panel 표시
  - recovery copy 확인
  - stale group 없음 확인
  - zero-count color tab label 확인
  - empty state 이해 가능성 확인
