# FDS Inspector 검사 정확도 검증 결과

검증일: 2026-05-29

## 결론

검사 결과 표시 신뢰도를 떨어뜨리던 `상단 패딩 14px` 오표시 문제를 수정했다. 실제 CSS 박스 모델에서 상하좌우가 모두 14px인 요소는 이제 `패딩 14px`으로 표시되고, 한쪽만 다른 값인 경우에는 `오른쪽 패딩 14px`처럼 방향을 명확히 표시한다.

동일 key의 결과가 반복 집계되는 문제도 방지했다. 같은 요소의 같은 검사 결과가 여러 줄로 중복 표시되지 않도록 스캔 결과 추가 시 중복 key를 걸러낸다.

## 확인한 주요 이슈

| 구분 | 상태 | 내용 | 처리 |
| --- | --- | --- | --- |
| 방향 오판 | 해결 | 상하좌우 모두 14px인데 `상단 패딩 14px`으로 표시 | 전체값은 `패딩 14px`, 방향값은 `상단/오른쪽/하단/왼쪽 패딩`으로 분리 |
| 중복 집계 | 해결 | 같은 요소/같은 메시지가 여러 건처럼 보임 | 동일 key 중복 entry push 방지 |
| 문구 오해 | 개선 | `3곳`, `29건`이 실제 요소 수인지 중복 DOM 수인지 헷갈림 | 그룹 문구는 유지하되 중복 key 제거로 숫자 왜곡 축소 |
| 패널 혼선 | 확인 완료 | 컬러 탭이 다른 검사에도 보일 수 있다는 우려 | 컬러 검사에서만 BG/Border/Text 탭 표시 확인 |
| 라운드 복합값 | 확인 완료 | 복합 radius가 단일값처럼 보일 수 있음 | `0px 8px 8px 0px`, `8px 1px 1px 8px`처럼 복합값 표시 확인 |
| 하이라이트 | 확인 완료 | 결과 항목과 실제 요소 연결이 불명확할 수 있음 | 결과 클릭 시 화면 요소 outline 및 Inspector 카드 표시 확인 |

## 변경 요약

- `content-inspection.js`
  - padding/margin 네 방향 값을 모두 비교하도록 변경
  - 네 방향 값이 같으면 `패딩 14px`, `마진 14px`처럼 전체값으로 표시
  - 네 방향 값이 다르면 `오른쪽 패딩 14px`, `하단 마진 12px`처럼 방향값으로 표시

- `content-render.js`
  - `패딩`, `마진`, `상단 패딩`, `오른쪽 마진` 등 새 문구를 결과 그룹에서 해석하도록 보강

- `content-scan-runner.js`
  - 동일 issue key가 이미 수집된 경우 결과 목록에 다시 추가하지 않도록 수정

- 테스트/fixture 추가
  - 전체 패딩, 방향 패딩, 전체 마진, 중복 DOM 케이스를 검증하는 테스트 추가
  - `docs/verification/spacing-direction-fixture.html` 추가

## 실제 화면 검증

### Fixture

검증 URL: `http://localhost:8765/docs/verification/spacing-direction-fixture.html`

확인 결과:

- `상하좌우 패딩 14px` 요소: `패딩 14px (비규격)`으로 표시
- `오른쪽 패딩 14px` 요소: `오른쪽 패딩 14px (비규격)`으로 표시
- `상하좌우 마진 14px` 요소: `마진 14px (비규격)`으로 표시
- 간격 검사 패널에는 컬러용 BG/Border/Text 탭이 표시되지 않음

증빙 이미지: `docs/verification/fds-accuracy-spacing-fixture-after.png`

### LUKE 실제 업무 페이지

검증 URL: `https://luke.fasoo.com/main`

확인 결과:

- DevTools 계산값: `padding-top/right/bottom/left = 14px`
- FDS Inspector 표시값: `패딩 14px (비규격) 1곳`
- 이전처럼 같은 요소가 25/26/27번 등 여러 항목으로 반복 표시되는 증상은 재현되지 않음
- 간격/폰트/라운드 패널에는 컬러용 탭이 표시되지 않음
- 컬러 검사에서는 BG/Border/Text 탭이 정상 표시됨
- 라운드 검사는 단일값과 복합값을 구분해 표시함
- 대표 결과 항목 클릭 시 화면 outline과 Inspector 카드가 표시됨

증빙 이미지: `docs/verification/fds-accuracy-luke-spacing-after.png`

## 실행한 검증 명령

```bash
node --test content-inspection.test.js content-render.test.js content-scan-runner.test.js
node --check content.js
node --check content-inspection.js
node --check content-render.js
npm test
```

결과:

- 개별 테스트: 34개 통과
- 전체 테스트: 106개 통과
- syntax check 3건 통과

## 남은 리스크

- `3곳`은 현재 "같은 메시지를 가진 실제 DOM 결과 수"에 가깝다. 비개발자에게는 "화면상 같은 카드 3개"인지 "DOM 3개"인지 여전히 헷갈릴 수 있어, 다음 UI 마감 단계에서 `3개 요소` 또는 `3개 위치`처럼 표현을 더 명확히 바꾸는 것이 좋다.
- 실제 LUKE 페이지는 로그인 상태/데이터 상태에 따라 스캔 결과 수가 변할 수 있다. 배포 전에는 동일 시나리오를 한 번 더 반복 검증해야 한다.
- Chrome 자동화 백엔드는 여전히 불안정할 수 있어 이번 검증은 Computer Use 기반으로 수행했다.
