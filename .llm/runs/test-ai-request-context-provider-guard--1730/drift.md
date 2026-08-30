# Drift Log: #1730 provider-invisibility regression guard

Drift is append-only. Record facts that diverge from the locked plan, issue, doctrine, or current
state here before expanding scope.

## 2026-08-30 — No drift at S1

- **What:** Research confirmed the issue's product behavior, field list, and scope; no divergence.
- **Source:** Issue #1730; current loop, bridge, adapter, port, and test code; base gate census.
- **Expected:** Test/support-only regression net with no product behavior change.
- **Actual:** Same.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md`, `plan.md`, `worklog.md`

## 2026-08-30 — Main advanced during draft-PR creation

- **What:** Live `main` advanced from `f8b4f804` to `952cc106` after the first S1 push.
- **Source:** Draft PR base SHA and `git fetch origin main`.
- **Expected:** The locked plan and candidate census use current `origin/main`.
- **Actual:** The intervening commit changed Aspire documentation/generated carriers only; it did
  not touch `packages/ai`, harness tooling, or gate runners.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Rebased S1; clean detached-base rerun at `952cc106` reproduced every gate
  classification (focused 9/9, full AI 147/147, check/lint/fmt/quality/JSR/publish green,
  doc-lint base-red at 128 private refs and 0 missing JSDoc).
