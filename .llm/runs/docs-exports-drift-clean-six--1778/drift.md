# Drift Log: adopt six clean package references

Drift is append-only. Record facts that diverge from the plan, issue, doctrine, or current-state
documentation.

## 2026-08-30 — Bootstrap baseline

- **What:** No implementation drift discovered during re-baseline and policy probes.
- **Source:** Issues #1778/#1777, six package export maps, six reference pages, and live `checkDrift` probes.
- **Expected:** All six pass `entrypoints-only`; coverage mode still requires page-by-page judgment.
- **Actual:** All six pass `entrypoints-only`; only `cron` also passes `complete`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` and `worklog.md`.
