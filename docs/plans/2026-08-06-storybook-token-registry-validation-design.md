# Storybook Token Registry Validation Design

## Goal

FDS Inspector가 임의의 CSS 사용자 정의 속성을 토큰으로 신뢰하지 않고, Storybook에서 배포하는 FDS 변수와 일치하는 경우에만 해당 속성의 컬러·간격·라운드 검사를 통과시킨다.

## Decision

등록된 FDS/Storybook 변수는 통과한다. 등록되지 않은 CSS 변수는 검사 회피 수단이 될 수 있으므로 위반으로 분류한다. 다만 Figma 브리지나 저장된 토큰 스냅샷이 연결되지 않은 오프라인 상태에서는 기존의 보수적 동작을 유지해, 토큰 목록 부재만으로 대량 오탐을 만들지 않는다.

## Alternatives considered

1. 모든 `var(--*)`를 토큰으로 신뢰한다. 현재 동작이며 호환성은 높지만 임의 변수를 FDS 토큰처럼 통과시킨다.
2. 계산된 hex 값만 FDS 레지스트리와 대조한다. 같은 색을 직접 쓴 경우와 변수 사용을 구별하지 못해 원시값 사용 경고를 유지할 수 없다.
3. **선택: 변수명과 계산값을 함께 대조한다.** Figma/스냅샷의 토큰 경로에서 Storybook CSS 변수명을 만들고, 작성 CSS의 `var(...)` 참조가 이 허용 목록에 있는지 확인한다. 이 방법은 Storybook 사용은 통과시키면서 임의 변수를 잡아낸다.

## Data flow

```text
Figma variable / token snapshot
  -> token path normalization
  -> Storybook CSS variable registry
  -> authored CSS var(--...) references
  -> FDS Inspector verdict
```

변수명은 Figma 경로를 소문자 kebab-case로 정규화한다. 예를 들어 `Color/text/primary`는 `--color-text-primary`, `spacing/16`은 `--spacing-16`, `radius/circle`은 `--radius-circle` 후보가 된다. 기존 컬러 hex 레지스트리는 대체 토큰 제안과 원시값 판정에 그대로 사용한다.

## Scope

- `style-token-detection.js`는 적용된 선언의 `var(...)` 참조를 수집하고, 허용 레지스트리와 대조하는 API를 제공한다.
- `bridge-token-source.js`와 `snapshot-token-source.js`는 컬러·간격·라운드 Figma 토큰에서 CSS 변수 허용 목록을 생성한다.
- `content.js`는 브리지·스냅샷 레지스트리를 합쳐 검사기에 전달한다.
- `content-inspection.js`는 등록 변수만 토큰 사용으로 처리한다. 허용 목록이 없을 때는 기존 동작을 유지한다.
- 인스펙터 메시지는 미등록 CSS 변수를 원시값 사용으로 위장하지 않고, `등록되지 않은 CSS 변수`로 구분한다.

## Non-goals

- Tailwind 클래스 문자열 자체를 해석하지 않는다. 생성된 CSS 선언의 `var(...)` 참조를 검사한다.
- Typography의 크기·행간·굵기, elevation, breakpoint, icon 검사를 이번 변경에 추가하지 않는다.
- 외부 라이브러리의 CSS 변수를 자동 허용하지 않는다.

## Verification

1. Storybook 변수(`--color-text-primary`, `--spacing-16`, `--radius-4`)는 통과한다.
2. 임의 변수(`--custom-color`, `--brand-gap`)는 레지스트리 연결 상태에서 위반으로 분류된다.
3. 직접 hex/px 사용의 기존 원시값·미등록 판정이 유지된다.
4. 레지스트리가 없는 오프라인 상태는 기존 `var(...)` 호환 동작을 유지한다.
5. 전체 단위 테스트, 확장 빌드, Chrome UI/UX fixture QA를 통과한다.
