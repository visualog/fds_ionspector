# FDS Inspector Motion Interaction RAG Notes

작성일: 2026-06-01

## 목적

FDS Inspector의 모션은 장식이 아니라 사용자가 검사 흐름을 더 정확하게 이해하도록 돕는 피드백이어야 한다. 이번 개선은 다음 사용 순간에만 모션을 적용한다.

- 패널이 열릴 때: 현재 선택한 검사 결과가 나타났음을 알려준다.
- 탭/요약/목록이 바뀔 때: 결과 맥락이 바뀌었음을 부드럽게 연결한다.
- 위반 그룹을 hover/click할 때: 목록과 실제 화면 요소의 관계를 보여준다.
- 인스펙터 카드가 뜰 때: 대표 요소와 수정 단서를 연결한다.
- 토큰 복사 후: 사용자가 다음 수정 행동으로 넘어갈 수 있게 성공 피드백을 준다.

## 참조 자료

### GSAP official docs

URL: https://gsap.com/docs/v3/

적용 판단:

- GSAP는 transform/opacity 중심의 짧은 UI 상태 전환을 안정적으로 제어하기 위해 사용한다.
- 반복 호출되는 UI 피드백은 `killTweensOf`, `fromTo`, `timeline`으로 이전 tween과 충돌하지 않게 처리한다.
- `quickTo`는 고빈도 포인터 추적에 유용하지만, 이번 범위에서는 패널/카드/핀의 상태 전환이 중심이라 timeline과 fromTo를 우선 사용한다.

### web.dev reduced motion guidance

URL: https://web.dev/learn/design/accessibility/

적용 판단:

- 사용자가 reduced motion을 선호하면 JS 모션을 실행하지 않는다.
- CSS transition/animation도 `@media (prefers-reduced-motion: reduce)`에서 거의 즉시 종료되도록 한다.
- 색상/opacity 수준의 정보 전달은 유지하되, 이동감이 큰 전환은 줄인다.

### Material Design motion duration/easing

URL: https://m1.material.io/motion/duration-easing.html

적용 판단:

- desktop extension overlay는 사용자가 반복해서 보는 도구이므로 150-220ms 중심의 짧은 duration을 사용한다.
- 패널/카드 등장에는 deceleration 계열 easing을 사용해 빠르게 반응하고 부드럽게 멈추게 한다.
- 긴 장식성 모션은 검사 작업 속도를 늦추므로 넣지 않는다.

### Chrome extension CSP

URL: https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy

적용 판단:

- MV3 확장에서는 원격 코드 실행을 피해야 하므로 GSAP CDN 로딩은 사용하지 않는다.
- `vendor/gsap.min.js`를 확장 패키지 안에 포함하고 `chrome.scripting.executeScript` 파일 목록에 넣어 주입한다.

## 구현 원칙

- 모션 대상은 `transform`, `opacity` 중심으로 제한한다.
- 스캔 루프, DOM 수집, 검사 계산에는 모션 로직을 섞지 않는다.
- 모션 레이어는 `content-motion.js`로 분리하고, GSAP가 없거나 reduced motion이면 안전하게 no-op 처리한다.
- hover 카드와 토큰 복사 버튼은 사용자가 마우스를 옮기는 동안 닫히지 않아야 한다.
- 자동 QA는 GSAP와 `FDSMotion`이 실제 fixture 주입 환경에 존재하는지 확인한다.
