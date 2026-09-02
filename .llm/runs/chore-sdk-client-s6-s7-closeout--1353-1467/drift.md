# Drift Log — SDK client S6/S7 closeout

## 2026-09-02 — disabled propagation still injects a CLIENT trace header

- **What:** `createHttpClientLink` creates a CLIENT span and unconditionally injects its context into
  the final request even when `propagateTraceContext` is false.
- **Source:** `packages/sdk/src/client/http-client-link.ts` final `fetch` wrapper; the pre-#1921
  observability test also explicitly expected a `traceparent` with the switch false.
- **Expected:** #1353 acceptance box 5 requires disabled propagation to emit neither trace header.
- **Actual:** A sampled CLIENT span emits `traceparent`; `tracestate` may also be emitted by the
  active propagator.
- **Severity:** significant
- **Action:** fixed
- **Evidence:** Gate only `injectContext()` and `Headers.set()` with the existing boolean; add a
  focused disabled-wire assertion while retaining the CLIENT-span assertion. Final focused SDK
  run: 44 passed / 0 failed / 0 ignored; full SDK run: 237 / 0 / 0.

## 2026-09-02 — owner-directed non-draft closeout

- **What:** The PR must open non-draft with all metadata in the opening action.
- **Source:** Owner brief.
- **Expected:** Generic harness guidance opens a draft PR at the first commit.
- **Actual:** This closeout opens once its fixed audit and gates are complete, non-draft at
  `status:impl`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` records the owner override; the supervisor still owns final
  evaluation and `status:ready-merge`.
