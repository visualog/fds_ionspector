# Large DOM Scan Check

Use this fixture to verify that FDS Inspector no longer blocks Chrome while scanning large pages.

1. Reload the extension in `chrome://extensions`.
2. Open `docs/verification/large-dom-scan-fixture.html` in Chrome.
3. Click the extension action to enable FDS Inspector.
4. Open DevTools console and check for:

```text
[FDS Inspector] scan metrics
```

Expected:

- No Chrome "page unresponsive" modal.
- The toolbar remains interactive during scan.
- `batchYieldCount` is greater than `0` on the large fixture.
- `durationMs`, `totalElementCount`, `scannedElementCount`, and `truncated` are present.

If a page has more than `6000` scannable elements, the scan is capped and `truncated: true` is logged. This prevents a single scan from monopolizing the page main thread.
