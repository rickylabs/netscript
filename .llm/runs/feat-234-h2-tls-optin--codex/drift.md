# Drift Log: #234 Phase 0/1 TLS opt-in

## 2026-07-12 — D1: PLAN-EVAL owner waiver

- **What:** Implementation may proceed after a short worklog plan without PLAN-EVAL.
- **Source:** Owner slice brief: “PLAN-EVAL owner-waived (carried drift D1).”
- **Expected:** Harness normally requires a separate-session PLAN-EVAL PASS.
- **Actual:** Owner explicitly waived that gate for this carried slice.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `worklog.md` short plan and `supervisor.md` override.

## 2026-07-12 — D2: Phase 0/1 already merged into baseline

- **What:** The requested TLS option, listener branch, HTTPS banner, plain HTTP fallback, and unit
  test already exist at the pinned baseline.
- **Source:** Git history and focused source/test inspection.
- **Expected:** Slice brief describes the listener as plain HTTP-only and asks this branch to add
  opt-in TLS.
- **Actual:** Ancestor `9c9efb6b43b721f2bcb79e9fa00f4ee466a6ba99` is titled
  `feat(service): opt-in TLS/HTTP2 on service listener (#234) (#293)` and contains the requested code.
- **Severity:** significant
- **Action:** accept; do not duplicate or revert approved implementation; produce fresh proof.
- **Evidence:** `git log --all -- packages/service/src/builder/service-listener.ts` and
  `git show --stat 9c9efb6b`.
