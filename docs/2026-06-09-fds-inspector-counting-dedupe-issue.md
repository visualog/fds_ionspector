# FDS Inspector Counting/Dedupe Issue Note

작성일: 2026-06-09

## 요약

LUKE 화면에서 카드형 요소들이 동일한 `border: 1px solid rgb(233, 236, 239)` 원시값을 사용하고 있었지만, FDS Inspector의 보더색 위반 목록에는 `2개 요소`만 표시되는 문제가 확인되었다.

원인은 특정 클래스명(`jqGymV`)에 대한 예외 처리가 아니라, 반복 DOM 요소를 식별하는 공통 signature가 너무 넓게 중복 처리한 데 있었다.

## 증상

- `Border` 탭에서 `보더색 #e9ecef (원시값 직접 사용)` 그룹이 표시되었다.
- 실제 페이지에는 동일한 카드형 요소가 더 많이 있었지만, 요약/목록 카운트는 `2개 요소`로 표시되었다.
- DevTools에서 확인한 반복 카드형 요소 예:
  - `div.sc-guDLey.jqGymV.css-0`
  - 동일 클래스의 여러 카드가 `border: 1px solid rgb(233, 236, 239)`를 사용

## 원인

기존 `getElementIssueSignature(element)`는 이슈 중복 제거 key를 만들 때 아래 정보만 사용했다.

```text
tagName + id + first 3 classes + direct text
```

카드 wrapper는 직접 텍스트가 거의 없고, 같은 컴포넌트 인스턴스는 class 조합도 반복된다. 이 때문에 서로 다른 DOM 인스턴스가 같은 signature를 갖게 되었고, `content-scan-runner.js`의 중복 제거에서 같은 이슈로 접혔다.

즉, 문제는 보더 검사 자체가 `jqGymV`를 놓친 것이 아니라, 실제 요소 여러 개를 같은 issue entry로 dedupe한 것이다.

## 수정 내용

주요 파일:

- `content-scan-utils.js`
- `content-scan-utils.test.js`

수정:

- `getElementIssueSignature()`에 DOM sibling path를 포함하도록 변경했다.
- 같은 tag/class/text를 가진 반복 요소라도 DOM 내 위치가 다르면 별도 요소로 식별된다.
- 특정 클래스명 하드코딩은 없다.

예상 signature 형태:

```text
div.sc-guDLey.jqGymV.css-0::section[0]>div[0]
div.sc-guDLey.jqGymV.css-0::section[0]>div[1]
```

## 영향 범위

이번 변경으로 아래 카운터들이 실제 반복 요소 수를 더 정확히 반영한다.

- toolbar badge count
- color subtab count
- summary metric caption의 `영향 N개 요소`
- summary group row의 `N개 요소`
- 펼친 상세 목록의 child row 수

패턴 수는 의도대로 유지된다. 예를 들어 `보더색 #e9ecef`는 하나의 패턴으로 묶이고, 그 안의 영향 요소 수만 실제 DOM 인스턴스 수에 맞게 증가한다.

## 검증

추가한 테스트:

- `content-scan-utils.test.js`
  - 같은 class 조합을 가진 반복 카드 두 개가 서로 다른 issue signature를 갖는지 확인

실행한 검증:

```bash
node --test content-scan-utils.test.js content-scan-runner.test.js content-summary-model.test.js toolbar-state.test.js
npm run check:all
```

최종 결과:

- `npm run check:all` 통과
- 211 tests
- 211 pass

## 후속 확인

LUKE에서 extension reload 후 다시 검사하면 `jqGymV` 반복 카드의 `보더색 #e9ecef` 그룹 count가 실제 영향 요소 수에 맞게 증가해야 한다.

추가로 볼 수 있는 지점:

- `toolbar-state.js`의 `countViolationsByFilter()`에는 `scanData.counts`가 없을 때만 쓰는 legacy fallback이 있다.
- 현재 실사용 scan data는 `counts`를 항상 갖기 때문에 이번 문제의 live 원인은 아니지만, 오래된 fallback은 문자열 `Set` 기반 dedupe를 유지한다.
- 필요하면 후속 정리에서 fallback 의미를 `pattern count`로 명시하거나 제거할 수 있다.
