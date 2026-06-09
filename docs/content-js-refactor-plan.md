# content.js 정리 계획

> **분석 일자**: 2026-06-09  
> **대상 파일**: `content.js` (2,716줄)  
> **목표**: 불필요 코드 제거 + 중복 제거 + 모듈 분리로 라인 수 감소

---

## 📊 요약

| 카테고리 | 항목 수 | 예상 감소 라인 |
|---------|---------|-------------|
| ❌ 브릿지 기능 전체 제거 | ~20곳 | **~200줄** |
| 🔴 중복 코드 제거 | 4곳 | ~75줄 |
| 🟡 불필요/개선 코드 정리 | 5곳 | ~20줄 |
| 🟢 모듈 분리 | 6개 모듈 | ~915줄 |
| **합계** | | **~1,210줄 감소** |

**예상 결과**: 2,716줄 → **~1,500줄** (약 45% 감소)

### 작업 우선순위
1. ❌ **브릿지 코드 제거** — 기능이 없으므로 리스크 없음
2. 🔴🟡 **중복/불필요 코드 정리** — 단순 리팩터링
3. 🟢 **모듈 분리** — 효과 가장 크나 `manifest.json` 수정 필요

---

## 0. ❌ 제거 대상 — 브릿지 연결 기능 (Bridge Feature)

브릿지 기능이 완전히 제거되었으므로 아래 코드는 전부 삭제 가능합니다.

### 전역 변수 선언 (~15줄)

| 라인 | 변수 |
|------|------|
| L31 | `const { createContentBridgeSpecs } = globalThis.FDSContentBridgeSpecs` |
| L38 | `const BRIDGE_POLL_INTERVAL_MS = 3000` |
| L39 | `const BRIDGE_DISCONNECT_GRACE_SAMPLES = 3` |
| L151 | `let isFigmaConnected = false` |
| L154 | `let previousConnectionState = null` |
| L155 | `let connectedMessageTimer = null` |
| L156 | `let bridgePollIntervalId = null` |
| L157 | `let bridgeCheckInFlight = false` |
| L177 | `let bridgeConnectionTier = 'offline'` |
| L178 | `let bridgeConnectionSummary = '브리지 연결 안 됨'` |
| L179 | `let bridgeConnectionDetail = '...'` |
| L180 | `let bridgeDisconnectStreak = 0` |
| L183 | `let activeBridgePluginId = null` |
| L184 | `let bridgeInspectorSpecOverrides = null` |
| L185 | `let bridgeColorTokenRegistry = { colors: {}, meta: {...} }` |
| L186 | `let bridgeTokenFileName = null` |
| L187 | `let bridgeTokenPageName = null` |

---

### 브릿지 전용 함수 — 전체 삭제 (~164줄)

| 함수 | 위치 | 라인 수 |
|------|------|--------|
| `createContentBridgeSpecs(...)` 초기화 블록 | L384–391 | 8줄 |
| `getBridgeSpecStateSignature()` | L394–402 | 9줄 |
| `refreshBridgeInspectorSpecs()` | L405–430 | 26줄 |
| `getBridgeTokenContextLabel()` | L448–458 | 11줄 |
| `clearConnectedMessageTimer()` | L519–523 | 5줄 |
| `stopBridgePolling()` | L711–715 | 5줄 |
| `startBridgePolling()` | L718–723 | 6줄 |
| `checkBridgeConnection()` | L1787–1853 | **67줄** |
| `updateConnectionUI()` | L1855–1881 | 27줄 |

---

### 다른 함수 내부의 브릿지 의존 코드 조각 (~20줄)

| 위치 | 제거할 내용 |
|------|-----------|
| L303–304 | `handleExtensionContextInvalid()` 내 `clearConnectedMessageTimer()`, `stopBridgePolling()` |
| L353–355 | `getKnownColorTokens()` 내 `bridgeTokens` 조회 및 병합 로직 |
| L363 | `getKnownColorTokens()` 반환값에서 `bridgeTokens` 제거 |
| L367 | `getActiveInspectorSpecs()` 내 `bridgeInspectorSpecOverrides` 참조 |
| L686–687 | `ensureVisibleInspectorUI()` 내 `clearConnectedMessageTimer()`, `stopBridgePolling()` |
| L1690–1691 | `dismissToolbar()` 내 `clearConnectedMessageTimer()`, `stopBridgePolling()` |
| L1713 | `getToolbarModel()` 내 `isFigmaConnected` 파라미터 전달 |
| L2723–2724 | TOGGLE 핸들러 내 `clearConnectedMessageTimer()`, `stopBridgePolling()` |
| L2737–2738 | TOGGLE 핸들러 내 동일 패턴 |

---

### 브릿지 제거 후 수정이 필요한 함수

| 함수 | 현재 역할 | 제거 후 처리 |
|------|----------|------------|
| `getKnownColorTokens()` | bridge + snapshot + source + builtin 4개 병합 | bridge 제거 → 3개만 병합 |
| `getActiveInspectorSpecs()` | bridgeInspectorSpecOverrides OR snapshotInspectorSpecOverrides | bridge 제거 → snapshot만 사용 |
| `handleExtensionContextInvalid()` | bridge polling 중단 포함 | 해당 줄만 제거 |
| `dismissToolbar()` | bridge polling 중단 포함 | 해당 줄만 제거 |
| `ensureVisibleInspectorUI()` | bridge polling 중단 포함 | 해당 줄만 제거 |

**브릿지 제거 총 예상 감소: ~200줄**

---

## 1. 🔴 중복 코드 (Duplicate Code)

### 1-1. `loadTokenSourceFromStorage` → `refreshSnapshotInspectorSpecs` → `scan` 체인 — 3~4곳 중복

**위치**: L1993–1996, L2687–2695, L2700–2713, L2744–2756

```js
// 동일한 구조가 3~4곳에서 반복됨
void loadTokenSourceFromStorage().then(() => {
  void refreshSnapshotInspectorSpecs().catch(() => {
    snapshotInspectorSpecOverrides = null;
  }).finally(() => {
    void scan('...');
    if (isSummaryPanelVisible()) updateSummaryUI();
  });
});
```

**해결**: `reloadAndRescan(reason)` 유틸 함수로 추출  
**예상 감소**: ~25줄

---

### 1-2. `scheduleViolationPinPositionUpdate` vs `scheduleInspectorPreviewPositionUpdate` — 구조 동일

**위치**: L1217–1232, L1250–1265

```js
// frameRef 변수명만 다르고 구조가 100% 동일
function scheduleViolationPinPositionUpdate() {
  if (violationPinPositionFrame !== null) return;
  const update = () => { violationPinPositionFrame = null; positionViolationPin(); };
  violationPinPositionFrame = requestAnimationFrame?.(update) ?? setTimeout(update, 16);
}

function scheduleInspectorPreviewPositionUpdate() {
  if (inspectorPreviewPositionFrame !== null) return;
  const update = () => { inspectorPreviewPositionFrame = null; refreshActiveInspectorPreviewPosition(); };
  inspectorPreviewPositionFrame = requestAnimationFrame?.(update) ?? setTimeout(update, 16);
}
```

**해결**: `scheduleRafUpdate(frameRef, callback)` 공통 헬퍼로 통합  
**예상 감소**: ~20줄

---

### 1-3. DOM 클래스 정리 패턴 — 3곳 반복

**위치**: L904–910 (`applyVisibleIssueHighlights`), L2253–2260 (`clearInspectionMarks`), L2116 (`markElementScanResult`)

```js
// 동일한 패턴이 3곳에서 반복
el.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning', 'fds-hover-target');
el.removeAttribute('data-fds-msg');
el.removeAttribute('data-fds-type');
el.removeAttribute('data-fds-issue-keys');
clearElementSpacingHighlightMetadata(el);
```

**해결**: `clearElementViolationState(el)` 헬퍼 함수로 추출  
**예상 감소**: ~15줄

---

### 1-4. `.fds-list-item.is-pin-active` 클래스 제거 패턴 — 2곳

**위치**: L1387–1389, L2563–2566

```js
panel.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
  activeItem.classList.remove('is-pin-active');
});
```

**해결**: `clearActivePinItems(panel)` 함수로 추출  
**예상 감소**: ~6줄

---

## 2. 🟡 불필요/개선 가능한 코드

### 2-1. `updateToolbarIndicators()` — 분기 내부 중복 로직

**위치**: L1769–1778

```js
function updateToolbarIndicators() {
  const root = document.getElementById('fds-root');
  if (!root) return;
  if (toolbarMode === TOOLBAR_MODES.DEFAULT) {
    syncToolbar();           // ← 두 분기 모두 syncToolbar() 호출
  } else {
    root.dataset.toolbarMode = toolbarMode;
    syncToolbar();           // ← 중복
  }
}
```

**해결**: `root.dataset.toolbarMode` 설정을 항상 실행 후 `syncToolbar()` 1회 호출  
**예상 감소**: ~5줄

---

### 2-2. `updateSummaryUI()` 들여쓰기 불일치 — 버그 위험

**위치**: L2267

```js
  function updateSummaryUI() {  // ← 2칸 들여쓰기 잘못됨 (글로벌 스코프여야 함)
    const panel = ...;
    ...
  const sCount = ...;           // ← 갑자기 0칸으로 복귀
```

**해결**: 들여쓰기 정규화 (기능 변경 없음)

---

### 2-3. `FILTER_LABELS` 상수와 `filterLabelMap` — 동일 데이터 2곳 정의

**위치**: L201–206 (전역), L2276–2281 (`updateSummaryUI` 내부)

```js
// L201 전역 상수
const FILTER_LABELS = Object.freeze({ color: '컬러', font: '폰트', spacing: '스페이싱', radius: '모서리 라운드' });

// L2276 updateSummaryUI 내부에서 동일하게 재정의
const filterLabelMap = { color: '컬러', font: '폰트', spacing: '스페이싱', radius: '모서리 라운드' };
```

**해결**: `filterLabelMap` → `FILTER_LABELS`로 교체  
**예상 감소**: ~6줄

---

### 2-4. `summaryMotion?.kind === 'tab'` 이중 체크

**위치**: L2589–2595

```js
if (summaryMotion?.kind === 'tab') {
  const motionKind = summaryMotion.kind || summaryMotion;
  if (motionKind === 'tab') {   // ← 위에서 이미 확인한 조건을 재확인
    ...
  }
}
```

**해결**: 내부 `if (motionKind === 'tab')` 제거  
**예상 감소**: ~4줄

---

### 2-5. `inspectorPreviewPositionFrame` 전역 변수 선언 누락

**위치**: L1251에서 사용하지만 L150–199 전역 변수 블록에 선언 없음

**해결**: 전역 변수 선언 추가 (`let inspectorPreviewPositionFrame = null;`)  
또는 `violationPinPositionFrame`과 통합 검토 (1-2 항목과 연계)

---

## 3. 🟢 분리 가능한 모듈

> 분리 시 `globalThis.FDS*` 패턴으로 export하고, `manifest.json`의 `content_scripts` 로드 순서 업데이트 필요

---

### 3-1. `content-spacing-highlight.js` (신규)

**담당 함수** (L805–932):

| 함수 | 역할 |
|------|------|
| `clearElementSpacingHighlightMetadata(el)` | 스페이싱 하이라이트 속성 초기화 |
| `getSpacingIssueMetadata(entries)` | 스페이싱 이슈 메타데이터 추출 |
| `getSpacingAreaValue(styles, kind, side)` | 스페이싱 영역 값 계산 |
| `applyElementSpacingAreaVariables(el, meta)` | CSS 변수 적용 |
| `applyElementSpacingHighlightMetadata(el, entries)` | 스페이싱 하이라이트 전체 적용 |
| `applyVisibleIssueHighlights(entries)` | 화면에 위반 하이라이트 렌더링 |

**예상 분리**: ~130줄

---

### 3-2. `content-inspector-card.js` (신규)

**담당 함수** (L970–1115):

| 함수 | 역할 |
|------|------|
| `getInspectorCardTitle(entries)` | 카드 타이틀 텍스트 생성 |
| `getInspectorIssueDisplay(entry)` | 이슈 표시 데이터 구성 |
| `showInspectorCardForEntries(target, entries)` | 인스펙터 카드 표시 |
| `hideInspectorCard()` | 카드 숨기기 |
| `isInspectorCardVisible()` | 카드 가시성 확인 |
| `deferInspectorCardClear()` | 지연 카드 숨김 |
| `clearTransientInspectorPreview()` | 임시 미리보기 초기화 |
| `scheduleTransientInspectorPreviewClear()` | 임시 미리보기 타이머 예약 |

**예상 분리**: ~145줄

---

### 3-3. `content-violation-pin.js` (신규)

**담당 함수** (L769, L1116–1265):

| 함수 | 역할 |
|------|------|
| `clearViolationPins()` | 핀 레이어 초기화 |
| `renderViolationPin(entry)` | 단일 핀 렌더링 |
| `renderViolationPins(entries)` | 복수 핀 렌더링 |
| `getPinnedIssueEntries()` | 현재 핀된 이슈 목록 |
| `escapeIssueKeySelector(value)` | CSS 선택자 이스케이프 |
| `getInspectorCardIssueEntries()` | 카드의 이슈 목록 |
| `positionViolationPin(entry, opts)` | 핀 위치 계산 및 적용 |
| `scheduleViolationPinPositionUpdate()` | 핀 위치 업데이트 예약 |
| `scheduleInspectorPreviewPositionUpdate()` | 프리뷰 위치 업데이트 예약 |
| `setActiveViolationPin(entry, opts)` | 단일 핀 활성화 |
| `setActiveViolationPins(entries, opts)` | 복수 핀 활성화 |
| `restoreLockedViolationPin(visibleEntries)` | 잠긴 핀 복원 |

**예상 분리**: ~160줄

---

### 3-4. `content-panel-interaction.js` (신규)

**담당 함수** (L1400–1596):

| 함수 | 역할 |
|------|------|
| `stopSummaryPanelDrag()` | 패널 드래그 종료 |
| `beginSummaryPanelDrag(event)` | 패널 드래그 시작 |
| `moveSummaryPanelDrag(event)` | 패널 드래그 이동 |
| `clampSummaryPanelHeight(height, top)` | 패널 높이 범위 제한 |
| `applyCustomSummaryPanelHeight(panel)` | 커스텀 높이 적용 |
| `beginSummaryPanelResize(event)` | 패널 리사이즈 시작 |
| `moveSummaryPanelResize(event)` | 패널 리사이즈 이동 |
| `stopSummaryPanelResize()` | 패널 리사이즈 종료 |
| `saveCustomSummaryPanelPosition()` | 패널 위치 저장 |
| `applyCustomSummaryPanelPosition()` | 커스텀 위치 적용 |
| `restoreExpandedToolbarAndPanelPosition(opts)` | 툴바·패널 위치 복원 |
| `positionDockedSummaryPanel(toolbarRect)` | 도킹 상태 패널 위치 계산 |
| `dockCollapsedToolbarAndPanel()` | 축소 툴바+패널 도킹 |

**예상 분리**: ~200줄

---

### 3-5. `content-message-handler.js` (신규)

**담당**: `chrome.runtime.onMessage` 리스너 (L2670–2766)

| 메시지 액션 | 처리 내용 |
|------------|---------|
| `PING` | 확장 상태 응답 |
| `GET_SCAN_METRICS` | 스캔 메트릭 반환 |
| `RESCAN` | 토큰 재로드 후 재스캔 |
| `TOKEN_SOURCE_UPDATED` | 토큰 업데이트 후 재스캔 |
| `TOGGLE` | 확장 표시/숨기기 토글 |

**예상 분리**: ~100줄

---

### 3-6. `content-scan.js` 보강 (기존 `content-scan-runner.js`와 통합)

`content-scan-runner.js`가 이미 분리되어 있으나, `content.js` 내에 스캔 관련 함수가 잔존합니다.

| 함수 | 위치 |
|------|------|
| `getPageScanElements()` | L2083–2085 |
| `isScannableElement(el)` | L2087–2092 |
| `markElementScanResult({...})` | L2094–2121 |
| `markScannedElementsFromEntries()` | L2123–2139 |
| `runSingleScanPass()` | L2141–2181 |
| `scan(reason)` | L2183–2237 |
| `refreshActiveScanBreakdown()` | L2239–2250 |
| `clearInspectionMarks()` | L2252–2261 |
| `getPreferredViolationFilter(counts)` | L2263–2265 |

**예상 분리**: ~180줄

---

## 📝 작업 시 주의사항

### 브릿지 제거 체크리스트
- [ ] 전역 변수 17개 삭제
- [ ] 브릿지 전용 함수 9개 삭제
- [ ] `getKnownColorTokens()` — `bridgeTokens` 조회/병합 제거
- [ ] `getActiveInspectorSpecs()` — `bridgeInspectorSpecOverrides` 참조 제거
- [ ] `handleExtensionContextInvalid()` — bridge polling 중단 라인 제거
- [ ] `dismissToolbar()` — bridge polling 중단 라인 제거
- [ ] `ensureVisibleInspectorUI()` — bridge polling 중단 라인 제거
- [ ] TOGGLE 핸들러 내 bridge polling 중단 라인 제거
- [ ] `overlay.css`에서 `.fds-disconnected`, `#fds-btn-plug` 관련 스타일 제거

### 모듈 분리 체크리스트
- [ ] 각 신규 파일에 `globalThis.FDS*` 네임스페이스로 export 추가
- [ ] `manifest.json` `content_scripts` 배열에 새 파일 추가 (로드 순서 주의)
- [ ] 분리된 함수가 참조하는 전역 상태 변수 접근 방식 확인
- [ ] 각 모듈 분리 후 `npm test`로 기존 테스트 통과 여부 확인
