# 2026-05-29 커밋 전 검증 및 개선 필요 항목

## 배경

- 프로젝트: FDS Inspector Chrome 확장
- 브랜치: `codex/token-source-20260416`
- 목적: 커밋 전 현재 미커밋 변경사항을 확인하고, Computer Use로 실제 Chrome UI 동작까지 검증한다.
- 테스트 fixture: `http://localhost:8765/docs/verification/large-dom-scan-fixture.html`

## 검증 요약

| 항목 | 결과 | 메모 |
| --- | --- | --- |
| Node 테스트 | 통과 | `npm test` 결과 87개 통과, 실패 0개 |
| 문법 확인 | 통과 | `node --check content.js`, `node --check background.js` 모두 출력 없이 통과 |
| Chrome UI 주입 | 통과 | 고정된 `FDS Inspector DEV 20260410` 확장 버튼 클릭 시 로컬 HTTP fixture에 툴바가 주입됨 |
| 스냅샷 토큰 소스 | 통과 | 요약 패널에 `tokens/*.json`이 표시되어 xbridge 없이 스냅샷 경로가 활성화된 것을 확인 |
| 대형 DOM 응답성 | 관찰 기준 통과 | 대형 fixture에서 툴바와 요약 패널 렌더링 중 페이지가 계속 반응했고 Chrome 응답 없음 모달은 뜨지 않음 |
| 요약 그룹핑 | 통과 | 반복 이슈가 값/상태 기준으로 그룹화됨. 예: `배경색 #f6f8fa ... 2000곳` |
| 카테고리 전환 | 통과 | 컬러, 폰트, 간격, 라운드 버튼 전환과 badge 갱신 확인 |

## 실행한 명령

```sh
npm test
node --check content.js
node --check background.js
python3 -m http.server 8765
```

첫 로컬 HTTP 서버 실행은 sandbox에서 `PermissionError: [Errno 1] Operation not permitted`로 실패했다. 이후 로컬 fixture 서빙을 위해 권한 승인을 받아 실행했다.

## Computer Use 수동 검증

1. Computer Use로 Google Chrome을 열었다.
2. 프로젝트 디렉터리에서 서빙한 large DOM fixture로 이동했다.
3. 고정된 `FDS Inspector DEV 20260410` 확장 버튼을 클릭했다.
4. 페이지에 move, color, font, spacing, radius, close 컨트롤을 가진 툴바가 표시되는지 확인했다.
5. 컬러 요약을 열었다.
   - Toolbar badge: `7999`
   - Header source: `tokens/*.json`
   - Raw value group: `배경색 #f6f8fa ... 2000곳`
   - 그룹 확장 시 번호가 붙은 상세 row와 element preview tooltip이 표시됨
6. 폰트 요약으로 전환했다.
   - Toolbar badge: `3999`
   - 표시 그룹: `서체 Arial (차단) 3999곳`
7. 간격 요약으로 전환했다.
   - Toolbar badge: `2001`
   - 표시 그룹:
     - `상단 패딩 13px (비규격) 2000곳`
     - `상단 패딩 24px (원시값 직접 사용: spacing.24) 1곳`
8. 라운드 요약으로 전환했다.
   - Toolbar badge: `2000`
   - 표시 그룹: `라운드 7px (미준수) 2000곳`

## 커밋 전 개선 필요 항목

### 1. 요약 패널 metric label 명확화

요약 패널 header는 현재 다음처럼 보인다.

```text
tokens/*.json · 컬러 539 · 간격 18 · 라운드 10
```

수동 검증 중에는 이 숫자가 위반 개수처럼 읽혔다. 실제로는 token/spec 개수로 보인다. 사용자가 "사용 가능한 토큰 수"와 "검출된 이슈 수"를 구분할 수 있게 label을 바꾸거나 위치를 분리하는 편이 좋다.

제안:

- `토큰: 컬러 539 · 간격 18 · 라운드 10`
- 이슈 총합은 metric card 또는 toolbar badge에 유지

### 2. `위반 요소` metric 수정 또는 이름 변경

폰트, 간격, 라운드 요약에서 metric card가 다음처럼 표시됐다.

```text
위반 요소: 15999
```

하지만 현재 활성 카테고리 badge 값과 맞지 않았다.

- Font: `3999`
- Spacing: `2001`
- Radius: `2000`

`15999`가 전체 카테고리의 모든 검출 이슈 수라면 label을 명확히 바꿔야 한다. 반대로 현재 패널이 활성 카테고리만 요약하는 의도라면 이 값은 버그일 가능성이 높다.

제안:

- 활성 카테고리 패널에서는 활성 카테고리 총합을 표시
- 전체 합계가 필요하면 `전체 위반`처럼 명시적인 label 사용

### 3. Summary metric 정합성 자동 테스트 추가

현재 테스트는 grouping과 scan runner 동작을 커버하지만, 수동 검증에서 드러난 metric label/값 불일치 가능성은 회귀하기 쉽다.

제안 테스트:

- Font summary metric이 font issue count와 일치하는지
- Spacing summary metric이 spacing issue count와 일치하는지
- Radius summary metric이 radius issue count와 일치하는지
- Header token/spec count가 violation count로 오해되지 않도록 렌더링되는지

### 4. 수동 체크리스트에 runtime scan metrics 캡처 추가

이번 검증에서 UI 응답성은 확인했지만, 다음 콘솔 로그 값은 캡처하지 못했다.

```text
[FDS Inspector] scan metrics
```

성능 관련 변경을 커밋하기 전에는 최소 1회 metrics sample을 캡처해 검증 문서에 붙이는 것이 좋다.

- `durationMs`
- `totalElementCount`
- `scannedElementCount`
- `batchYieldCount`
- `truncated`
- `issueCount`
- `activeFilter`

### 5. 설치된 확장 source path 확인

Chrome UI는 현재 코드와 일치하는 동작을 보였지만, 이번 수동 검증에서는 `chrome://extensions`에서 unpacked extension source path가 현재 작업 디렉터리인지 직접 확인하지 않았다.

최종 커밋 또는 handoff 전 loaded extension source path가 다음인지 확인하는 것이 좋다.

```text
/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector
```

### 6. 커밋 범위 정리

현재 변경 범위는 넓고 여러 관심사가 섞여 있다.

- xbridge dependency reduction
- snapshot token source
- content script module extraction
- large DOM scan performance
- summary grouping
- manifest permission/injection changes
- verification docs and fixtures

리뷰 가능성을 높이려면 둘 중 하나가 필요하다.

- 관심사별로 여러 커밋으로 분리
- 하나의 커밋으로 유지하되 commit message에서 변경을 기능/동작별로 명확히 그룹화

## 현재 권장 판단

아직 바로 커밋하지 않는 편이 좋다. 자동 테스트는 통과했고 실제 Chrome fixture smoke test도 긍정적이지만, summary metric label/count 동작은 사용자에게 직접 보이는 영역이다. 이 부분을 명확히 정리한 뒤 커밋하는 것이 안전하다.
