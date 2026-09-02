# Drift Log: dev probe startup budget

## 2026-09-02 — Hosted Vite readiness banner is ANSI-colored

- **What:** The original `Local:` scan consumed raw decoded output and did not match hosted Vite's `\x1b[1mLocal\x1b[22m:` banner.
- **Source:** OpenHands `FAIL_FIX` at `bdbaec12c`; hosted Actions run `33562257540`.
- **Expected:** The Vite readiness marker would begin the separate HTTP-readiness budget on hosted CI.
- **Actual:** Both hosted runtime lanes exhausted the 180,000 ms startup budget despite Vite being ready.
- **Severity:** significant
- **Action:** fix — strip ANSI only in the scan path, preserve mirrored bytes, set `NO_COLOR=1`, and add exact ANSI/plain real-entry-point regressions.
- **Evidence:** `b9b2e9f0a` RED; worklog FAIL_FIX rows. Local runtime remains `NOT_RUN`; no hosted green is claimed.
