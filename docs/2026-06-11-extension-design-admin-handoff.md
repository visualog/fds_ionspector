# FDS Inspector Design Admin Handoff

- 작성일: 2026-06-11
- 상태: Done
- 범위: FDS Inspector 운영 대시보드용 side project 생성

## 생성 위치

`admin/` 아래에 extension runtime과 분리된 Vite + React + TypeScript 앱을 생성했다.

```text
admin/
  package.json
  package-lock.json
  index.html
  vite.config.ts
  tsconfig.json
  src/
    App.tsx
    main.tsx
    styles.css
    components/
    data/
    types/
```

## 실행 명령

```bash
cd admin
npm install
npm run dev
npm run build
```

## 현재 기능

- Dashboard 첫 화면
- Token Registry: `tokens/0.1.primitives.json`, `tokens/0.2.theme.json`, `tokens/1.0.semantic.json`
- Inspection Rules: color, text, spacing, radius 규칙과 관련 runtime/test 파일
- Overlay & Interaction: toolbar, summary panel, floating card, motion 관련 파일
- Build & Release: `npm run build:extension`, `dist/fds-inspector`, `dist/fds-inspector.zip`
- QA Documents: verification, plan, refactor-report 문서 허브
- Module Map: `docs/2026-06-11-dist-js-file-summary.md` 기준 runtime 역할 요약

## 데이터 제한

1단계 앱은 브라우저에서 repo 파일을 직접 읽지 않는다. 화면 데이터는 `admin/src/data/*.ts`의 curated metadata로 관리한다.

실제 repo 상태 자동 반영은 2단계에서 Node script 또는 local API로 `admin/public/generated/*.json`을 생성하는 방향이 적합하다.

## Extension Build Boundary

`scripts/build-extension.test.js`에 `BUILD_FILES`가 `admin/` 경로를 포함하지 않는지 확인하는 테스트를 추가했다. `scripts/build-extension.mjs`는 명시된 runtime file list만 복사하므로 admin 앱은 extension zip에 포함되지 않아야 한다.

## 검증 기록

```bash
cd admin && npm run build
cd ..
npm test
npm run build:extension
```

- `cd admin && npm run build`: PASS. TypeScript build and Vite production bundle succeeded.
- Browser smoke test: PASS. `http://127.0.0.1:4175/` rendered Dashboard, 7 navigation items, 4 status panels, and 6 dashboard sections.
- Mobile layout smoke test: PASS. 390px viewport had no horizontal overflow.
- `npm test`: PASS. 234 tests passed, including `extension build does not include admin app files`.
- `npm run build:extension`: PASS. Extension directory and zip were created; `admin/` files were absent from `dist/fds-inspector`.

## 다음 단계 후보

- `admin/public/generated/*.json` 생성 스크립트 추가
- snapshot token과 bridge token export의 diff view 추가
- QA checklist와 screenshot evidence registry 추가
- local Node API를 통한 build command runner 추가
