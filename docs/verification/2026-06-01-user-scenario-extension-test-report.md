# FDS Inspector 사용자 시나리오 실제 테스트 결과 보고서

검수일: 2026-06-01
검수 환경: macOS, Google Chrome, `FDS Inspector DEV 20260410`, 로컬 fixture 서버 `127.0.0.1:8765`
기준 문서: `docs/plans/2026-06-01-user-scenario-extension-test-plan.md`

## 결론

FDS Inspector는 로컬 fixture 기준의 핵심 사용자 흐름에서 실제 Chrome 확장 실행, 검사 결과 표시, 그룹 탐색, 대표 요소 이동, 오류 안내를 정상적으로 수행했다. 자동 검수도 모두 통과했다.

검수 중 발견된 오류 상태 오인 가능성, 큰 숫자 badge, 목록 라벨 말줄임, 닫기 아이콘 접근성 문제는 같은 날 수정 후 재검증했다. 수정 후 기준으로는 fixture 기반 릴리즈 게이트를 통과한다. 실제 업무 페이지, 작은 viewport, 키보드-only 흐름은 별도 환경에서 추가 검수가 필요하다.

## 검수 범위

### 실제 테스트한 범위

- 로컬 fixture 3종을 실제 Chrome 탭에서 열고, 브라우저 툴바의 확장 아이콘으로 FDS Inspector를 실행했다.
- Large DOM fixture에서 컬러 검사, 탭, 요약 카드, 위반 그룹, 대표 요소 이동을 확인했다.
- Spacing fixture에서 간격 검사, 방향별 그룹, 검토 패턴/영향 요소, 그룹 클릭과 상세 목록을 확인했다.
- Error fixture에서 검사 오류 문구, zero-count 탭, 빈 목록 상태를 확인했다.
- 자동 검수로 hover inspector card의 토큰 복사 흐름을 확인했다.

### 이번에 제외한 범위

- 실제 LUKE 업무 페이지 검수는 현재 이 세션에서 접근할 구체 URL/화면이 제공되지 않아 수행하지 않았다.
- 키보드만으로 전체 흐름을 조작하는 수동 테스트는 수행하지 않았다. 포커스 스타일은 자동/소스 테스트로만 확인했다.
- 작은 viewport 드래그 검수는 이번 실제 Chrome 수동 검수에서는 제외했다.
- 토큰 기준 소스 변경/브리지 연결 상태 변화는 별도 환경 세팅이 필요해 제외했다.

## 검증 명령 결과

```bash
node --check content.js
node --check content-render.js
node --check content-scan-runner.js
npm test
npm run qa:uiux
```

결과:

- 문법 검사: 통과
- `npm test`: 114개 통과, 실패 0개
- `npm run qa:uiux`: spacing-direction, large-dom, error-state 전체 통과

자동 QA 주요 통과 항목:

- Spacing: 패턴 우선 요약, 영향 요소 표시, 방향별 그룹, 그룹 클릭 후 상세 목록/핀/스크롤 요청
- Large DOM: 6,000개 scan cap, 7,502개 total count, partial/truncated, batch yield, 컬러 탭 접근성 label, hover card 토큰 복사
- Error state: 오류 복구 문구, stale group 제거, zero-count 탭 label, 오류 전용 summary/list 상태

## 수동 Chrome 확장 검수 결과

### S01. 처음 켜서 현재 상태를 이해한다

결과: 부분 통과

관찰:

- 각 fixture에서 확장 아이콘 클릭 시 툴바가 실제 페이지 위에 표시됐다.
- 검사 중 상태가 토스트/상태 문구로 보였고, 완료 후 버튼 count가 표시됐다.
- 툴바 버튼은 컬러, 폰트, 간격, 라운드의 첫 행동을 제공했다.

개선 필요:

- Large DOM에서 툴바 컬러 badge가 `2003`처럼 그대로 표시된다. 현재 화면에서는 크게 깨지지 않았지만, 더 큰 숫자에서 버튼 균형과 인지성이 나빠질 수 있다.

### S02. 컬러 위반을 확인하고 우선순위를 판단한다

결과: 통과

관찰:

- Large DOM fixture에서 컬러 검사 패널이 열렸다.
- 시각 탭은 `BG`, `Border`, `Text`만 표시하고, 접근성 tree에는 `배경색 1개 요소`, `보더색 1개 요소`, `글자색 2,001개 요소`가 제공됐다.
- `미등록`은 0, `원시값`은 1로 표시되어 0건 항목 때문에 결과가 비어 보이는 문제는 재현되지 않았다.
- 목록에 `배경색`, `원시값 직접 사용`, `1개 요소`, `#f6f8fa`가 함께 표시됐다.

사용자가 얻은 도움:

- 사용자는 색상 위반이 미등록이 아니라 원시값 직접 사용이며, `#f6f8fa`를 토큰으로 대체해야 한다는 점을 바로 알 수 있다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-actual-large-dom-color.png`

### S03. 간격 위반의 방향과 범위를 구분한다

결과: 통과

관찰:

- Spacing fixture에서 `검토 패턴 6`, `영향 요소 8`이 분리되어 표시됐다.
- 목록에 `패딩 14px`, `오른쪽 패딩 14px`, `마진 14px`, `상단 마진 21px`, `하단 마진 21px`, `패딩 8px 원시값 직접 사용: spacing.8`이 별도 그룹으로 표시됐다.
- 네 방향 패딩과 방향 패딩이 구분되어, 사용자가 어느 CSS 속성을 봐야 하는지 이해할 수 있었다.

개선 필요:

- 패널 폭이 좁아 실제 화면에서는 `오른쪽 패딩 비...`, `상단 마진 비...`처럼 일부 라벨이 말줄임된다. 접근성 이름은 전체 정보를 제공하지만, 시각 사용자도 전체 문구를 쉽게 확인할 수 있는 보조 장치가 있으면 좋다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-actual-spacing-direction.png`

### S04. 위반 목록에서 실제 화면 요소를 찾는다

결과: 통과

관찰:

- Large DOM에서 `배경색 #f6f8fa` 그룹 클릭 시 페이지가 대표 요소로 이동하고 핀 `1`과 파란 outline이 표시됐다.
- Spacing에서 `패딩 14px` 그룹 클릭 시 상세 항목 3개가 펼쳐지고, 대표 요소에 핀과 인스펙터 카드가 표시됐다.
- 상세 항목에는 `section.all-padding`, `section.duplicate-shell`, `div.duplicate-inner`처럼 실제 DOM 단서가 표시됐다.

사용자가 얻은 도움:

- 사용자는 목록의 위반이 화면의 어느 요소인지 확인하고, 수정 범위를 대표 요소 또는 상세 DOM 기준으로 좁힐 수 있다.

### S05. 추천 토큰을 확인하고 복사한다

결과: 자동 검수 통과, 수동 검수 일부 제한

관찰:

- 자동 QA에서 hover inspector card가 목록에서 카드로 이동해도 유지되고, `토큰명 복사` 클릭 후 `복사됨` 피드백이 표시되는 것을 확인했다.
- Computer Use 도구가 hover 이동을 정밀하게 수행하기 어려워 실제 Chrome 수동 클릭으로는 복사 버튼까지의 전체 흐름을 재현하지 않았다.

사용자가 얻은 도움:

- 자동 검수 기준으로는 사용자가 원시값 위반에서 대체 토큰 후보를 복사해 수정 행동으로 넘어갈 수 있다.

### S06. 빈 결과를 확인하고 다음 행동을 결정한다

결과: 부분 통과

관찰:

- Error fixture의 컬러 검사에서 위반 목록은 `컬러 위반 항목이 없습니다.`로 표시됐다.
- zero-count 컬러 탭은 `배경색 0개 요소`, `보더색 0개 요소`, `글자색 0개 요소`로 접근성 이름을 제공했다.

개선 필요:

- 오류 상태와 빈 결과가 동시에 표시되므로, 실제 오류 상황에서는 빈 결과가 정상적인 0건처럼 읽히지 않도록 문구 우선순위를 조정해야 한다.

### S07. 스캔 오류에서 복구한다

결과: 주요 안내 통과, 상태 표현 개선 필요

관찰:

- Error fixture에서 `검사 중 오류가 발생했습니다. 새로고침 버튼으로 다시 검사해 주세요.` 문구가 표시됐다.
- 이전 위반 그룹이나 핀은 남지 않았다.
- 다만 같은 패널 안에 `위반 없음: 0, 검사 완료` 카드가 함께 표시됐다.

발견 문제:

- 오류 상태에서 `검사 완료`라는 성공성 문구가 같이 표시되는 것은 사용자가 오류를 정상 완료로 오해하게 만들 수 있다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-actual-error-state.png`

### S08. 큰 페이지에서도 업무를 계속할 수 있다

결과: 통과

관찰:

- Large DOM fixture에서 실제 Chrome이 멈추지 않고 검사 결과를 표시했다.
- 자동 QA에서 `scannedElementCount = 6000`, `totalElementCount = 7502`, `truncated = true`, `batchYieldCount > 0`을 확인했다.
- UI는 큰 DOM 개수보다 `미등록`, `원시값`, 영향 요소를 먼저 보여주었다.

사용자가 얻은 도움:

- 사용자는 큰 페이지에서도 브라우저 응답성을 유지하며, 일부 검사 상태를 고려해 결과를 해석할 수 있다.

### S09. 작은 화면과 패널 이동을 확인한다

결과: 이번 수동 검수 제외

자동 QA는 패널이 viewport 내부에 머무는지 확인하지만, 작은 viewport와 패널 드래그 수동 검수는 별도 반복이 필요하다.

### S10. 키보드만으로 주요 검수를 수행한다

결과: 이번 수동 검수 제외

포커스 스타일은 소스/자동 테스트로 확인됐지만, 실제 키보드만으로 S01-S07을 수행하는 검수는 별도 진행이 필요하다.

### S11. 실제 업무 페이지에서 수정 우선순위를 정한다

결과: 이번 수동 검수 제외

실제 업무 페이지 URL과 로그인 상태가 제공되면, 컬러/간격/라운드 중 영향 요소가 큰 그룹을 기준으로 수정 우선순위를 판단해야 한다.

### S12. 토큰 기준 소스가 바뀌거나 없을 때 이해한다

결과: 이번 수동 검수 제외

브리지 연결/토큰 스냅샷 제거/갱신 시나리오는 별도 환경 조작이 필요하다.

## 발견된 문제점

아래 문제는 최초 실제 Chrome 검수에서 발견한 항목이다. `2026-06-01` 수정 반영 후 상태는 다음 섹션의 "수정 반영 및 재검증 결과"에 별도로 기록한다.

### P1. 오류 상태에서 `검사 완료` 카드가 함께 표시됨

심각도: P1
관련 시나리오: S06, S07

현상:

- Error fixture에서 오류 안내는 정상적으로 표시되지만, 같은 패널에 `위반 없음: 0, 검사 완료` 카드도 표시된다.

사용자 영향:

- 사용자가 검사 실패 상태를 "위반이 없는 정상 완료"로 오해할 수 있다.
- 릴리즈 전 검수에서 오류를 놓치고 정상 통과로 판단할 위험이 있다.

개선 제안:

- `scanErrorText`가 있을 때는 성공/빈 결과 metric card를 숨긴다.
- 대신 `검사 실패`, `다시 검사 필요` 같은 오류 전용 카드 또는 상태를 표시한다.
- 빈 목록 문구도 `오류로 인해 결과를 표시할 수 없습니다.`처럼 오류 맥락에 맞춘다.

### P2. 툴바 badge 큰 숫자 표시 정책 재검토

심각도: P2
관련 시나리오: S01, S08

현상:

- Large DOM에서 툴바 컬러 버튼 badge가 `2003`으로 표시된다.

사용자 영향:

- 숫자를 축약하면 버튼은 안정적이지만, 사용자는 툴바에서 즉시 전체 위반 수를 확인하기 어렵다.
- 사용자가 툴바를 빠른 현황판으로 보는 흐름에서는 기존처럼 숫자를 그대로 보여주는 편이 더 직접적이다.

개선 제안:

- 툴바 badge는 기존처럼 원문 숫자를 표시한다.
- 전체 의미는 `aria-label` 또는 `title`에 `컬러 검사 2,003개 위반 요소`처럼 보존한다.
- 상세 패널에서는 큰 숫자보다 패턴과 다음 행동을 먼저 보여준다.

### P2. 목록 라벨의 시각적 말줄임이 일부 정보 인지를 늦춤

심각도: P2
관련 시나리오: S03, S04

현상:

- Spacing panel에서 `오른쪽 패딩 비...`, `상단 마진 비...`처럼 일부 상태 라벨이 시각적으로 잘린다.
- 접근성 이름에는 전체 정보가 있지만, 마우스 사용자에게는 즉시 보이지 않는다.

사용자 영향:

- 사용자가 목록을 빠르게 스캔할 때 `비규격`인지 `원시값 직접 사용`인지 확인하는 데 한 번 더 추론이 필요하다.

개선 제안:

- status 라벨의 최소 폭을 확보하거나, chip/value 배치를 조정한다.
- hover/focus 시 전체 문구 tooltip을 제공한다.
- 패널 폭이 좁을 때는 상태를 아이콘+짧은 라벨로 줄이고 전체 문구는 보조 텍스트로 제공한다.

### P3. 닫기 이미지 접근성 표현이 불완전함

심각도: P3
관련 시나리오: S01, S09, S10

현상:

- 접근성 tree에서 닫기 버튼 안 이미지가 `라벨이 없는 이미지 닫기`처럼 노출된다.
- 버튼 자체는 `close` 또는 `닫기` 역할을 가지지만, 내부 이미지 alt 처리가 깔끔하지 않다.

사용자 영향:

- 스크린리더나 접근성 검사에서 불필요한 경고가 발생할 수 있다.

개선 제안:

- 장식용 close `img`는 `alt=""`와 `aria-hidden="true"`로 숨긴다.
- 실제 버튼에는 `aria-label="패널 닫기"` 또는 `aria-label="FDS Inspector 닫기"`를 명확히 제공한다.

## 개선 우선순위

1. 오류 상태 전용 summary UI 적용
2. 툴바 badge 숫자 직접 표시 및 전체 count 접근성 label 제공
3. 목록 행의 상태/값 말줄임 개선
4. close icon 접근성 정리
5. 실제 업무 페이지 S11 검수 추가
6. 작은 viewport/키보드-only 수동 검수 추가

## 수정 반영 및 재검증 결과

수정일: 2026-06-01
수정 목표: 사용자가 검사 결과를 정상/오류/부분 검사 상태로 정확히 구분하고, 큰 숫자보다 패턴과 다음 행동을 먼저 이해하게 만든다.

### R1. 오류 상태 전용 summary/list UI

상태: 수정 완료, 재검증 통과
대상: P1, S06, S07

반영 내용:

- `scanErrorText`가 있는 경우 성공성 metric card를 표시하지 않도록 변경했다.
- 오류 상태에서는 `검사 실패`, `다시 검사 필요`를 표시한다.
- 목록 영역은 `오류로 인해 결과를 표시할 수 없습니다. 새로고침 버튼으로 다시 검사해 주세요.`로 표시한다.
- 실제 Chrome 재검수에서 `위반 없음`, `검사 완료`가 오류 패널에 함께 표시되지 않는 것을 확인했다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-fixed-error-state.png`

### R2. 툴바 badge 숫자 직접 표시 복원

상태: 수정 완료, 재검증 통과
대상: P2, S01, S08

반영 내용:

- 툴바 badge는 사용자가 요청한 기존 방식대로 `2003`처럼 숫자를 직접 표시한다.
- 전체 count는 버튼 접근성 이름과 tooltip에 `컬러 검사 2,003개 위반 요소`처럼 보존했다.
- 상세 패널은 숫자보다 `미등록`, `원시값`, `검토 패턴`, `영향 요소`를 우선 노출해 다음 행동을 유지한다.
- 자동 QA에서 Large DOM 컬러 버튼의 `data-badge-count="2003"`과 `data-badge-full-count="2,003"`을 확인한다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-fixed-large-dom-badge.png`

### R3. 목록 라벨 가독성 개선

상태: 개선 완료, 재검증 통과
대상: P2, S03, S04

반영 내용:

- 목록 행 grid 폭을 조정해 상태 라벨인 `비규격`이 잘리지 않도록 했다.
- chip/status/value에 `title`을 제공해 hover/focus 보조 확인이 가능하게 했다.
- 실제 Chrome 재검수에서 Spacing 목록의 `패딩 비규격`, `오른쪽 패딩 비규격`, `상단 마진 비규격` 상태가 시각적으로 읽히는 것을 확인했다.

증빙:

- `docs/verification/uiux-captures/2026-06-01-fixed-spacing-labels.png`

### R4. 닫기 아이콘 접근성 정리

상태: 수정 완료, 자동 재검증 통과
대상: P3, S01, S09, S10

반영 내용:

- 장식용 close 이미지는 `alt=""`, `aria-hidden="true"`로 숨겼다.
- 실제 조작 대상인 패널 닫기 버튼에는 `aria-label="패널 닫기"`와 `title="패널 닫기"`를 제공했다.
- `content-render.test.js`에서 close icon이 장식용으로 렌더링되는 회귀 테스트를 추가했다.

### R5. GSAP 기반 UX 인터랙션 개선

상태: 구현 완료, 자동 재검증 통과
대상: S01, S04, S05, S08, S09, S10

반영 내용:

- `vendor/gsap.min.js`를 확장 패키지에 포함하고 content script 주입 순서에 추가했다.
- `content-motion.js`를 추가해 패널 등장, 요약/목록 갱신, 인스펙터 카드 등장, 위반 핀, 토큰 복사 성공 피드백을 GSAP로 처리한다.
- 모션은 `transform`, `opacity` 중심으로 제한하고 검사/스캔 루프에는 관여하지 않는다.
- `prefers-reduced-motion: reduce`에서는 JS 모션을 실행하지 않고, CSS transition/animation도 거의 즉시 종료되도록 했다.
- 자동 QA에서 실제 fixture 주입 환경에 `window.gsap`와 `window.FDSMotion`이 존재하는지 확인한다.

사용자 경험 효과:

- 패널이 갑자기 생기는 대신 현재 검사 결과가 열렸다는 전환감을 준다.
- 목록 갱신과 그룹 펼침이 부드러워져 사용자가 “방금 선택한 조건의 결과”를 놓치지 않는다.
- 대표 요소 핀과 인스펙터 카드가 짧게 들어와 목록 항목과 실제 화면 요소의 연결이 더 분명하다.
- 토큰 복사 후 짧은 피드백으로 수정 행동으로 넘어갈 확신을 준다.

참조:

- `docs/verification/2026-06-01-motion-interaction-rag.md`

### R6. 사소하지만 체감 큰 UX 보강

상태: 구현 완료, 자동 재검증 통과
대상: S02, S04, S05, S09, S10

반영 내용:

- 상세 패널의 탭 이동에도 `animateTabSwitch` GSAP 모션을 적용했다.
- hover 인스펙터 카드의 hide delay를 700ms로 늘리고, 카드 자체를 pointer interaction 대상으로 바꿔 `토큰명 복사` 버튼을 실제로 클릭할 수 있게 했다.
- 카드 진입 시 `pointerenter`에서도 닫힘 timer를 취소한다.
- 인스펙터 카드의 대체 토큰 텍스트는 말줄임 대신 줄바꿈과 `overflow-wrap: anywhere`를 사용해 긴 토큰 후보를 확인할 수 있게 했다.
- 목록 행은 밀도 유지를 위해 한 줄 스캔 구조를 유지하되, group/list 행에는 `title`과 `aria-label`로 전체 의미를 보존한다.

기능 향상 검토:

- 현재 목적에 가장 직접적으로 맞는 추가 기능은 "문제 발견 후 수정 행동으로 연결"이다. 그래서 이번 범위에서는 별도 대형 기능보다 토큰 복사 안정성, 긴 토큰 후보 표시, 탭 전환 피드백을 우선 적용했다.
- 후속 후보는 선택 그룹의 전체 상세 항목 일괄 복사, 현재 필터 결과 JSON 내보내기, 실제 업무 페이지용 "수정 우선순위 메모" 생성이다. 이들은 별도 UX 설계와 실제 업무 페이지 검수가 필요하다.

## 재검증 명령 결과

```bash
node --test toolbar-state.test.js
node --test content-render.test.js
node --test content-scan-runner.test.js
node --check content.js && node --check content-render.js && node --check toolbar-state.js && node --check scripts/run-uiux-fixture-qa.mjs
node --check content-motion.js && node --check background-logic.js
npm test
npm run qa:uiux
```

결과:

- `toolbar-state.test.js`: 25개 통과
- `content-render.test.js`: 17개 통과
- `content-scan-runner.test.js`: 22개 통과
- `content-motion.test.js`: 4개 통과
- 문법 검사: 통과
- `npm test`: 123개 통과, 실패 0개
- `npm run qa:uiux`: spacing-direction, large-dom, error-state 전체 통과

실제 Chrome 재검수:

- Error fixture: 오류 상태가 성공 완료 상태로 오해되지 않음
- Large DOM fixture: 툴바 count badge가 숫자를 직접 표시하고 전체 count 접근성 정보 유지
- Spacing fixture: 상태 라벨과 영향 요소 정보가 목록에서 읽힘
- Fixture 자동 QA: GSAP와 FDSMotion 모션 레이어가 실제 주입 환경에서 사용 가능함
- Large DOM fixture: 상세 패널 탭 이동이 GSAP motion event를 발생시킴
- Large DOM fixture: hover 인스펙터 카드가 pointer interaction을 받고 토큰 복사 가능

## 최종 판정

현재 fixture 기반 핵심 사용자 흐름은 수정 반영 후 통과로 볼 수 있다. 사용자는 위반 종류, 영향 범위, 실제 위치, 다음 행동을 fixture 기준으로 이해할 수 있고, 오류 상태도 정상 완료로 오해하지 않도록 정리됐다.

릴리즈 게이트 관점:

- 자동 테스트: 통과
- fixture 실제 확장 검수: 주요 흐름 통과, 발견 항목 수정 후 재검증 통과
- UX/UI 인터랙션 개선: GSAP 모션 적용, reduced motion 대응, 자동 QA 반영
- P0: 발견 없음
- P1: 발견 1건, 수정 완료
- P2: 발견 2건, 수정/개선 완료
- P3: 발견 1건, 수정 완료
- 실제 업무 페이지 검수: 미수행, 후속 필요
