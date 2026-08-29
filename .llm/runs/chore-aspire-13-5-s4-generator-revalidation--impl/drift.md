# Drift Log: Aspire 13.5 generator re-validation (S4)

Drift is append-only.

## 2026-08-30 — #1371 already closed before S4

- **What:** Issue #1716 and epic #1712 still assign #1371 closure to S4.
- **Source:** GitHub issues #1716/#1712 versus closed #1371 and baseline commit `8b1e42f72` (#1728).
- **Expected:** S4 would add/fix the background service-reference injection and close #1371.
- **Actual:** #1728 already landed the emitted-module positive/negative coverage and closed #1371.
- **Severity:** minor
- **Action:** accept; S4 verifies the named coverage and uses no closing reference to #1371.
- **Evidence:**
  `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-background_test.ts`.

## 2026-08-30 — Owner-selected Fable supervisor route

- **What:** The owner named a Fable 5 session as supervisor.
- **Source:** S4 implementation brief.
- **Expected:** `lane-policy.md` defaults long-running orchestration to Opus 5.
- **Actual:** Fable 5 supervises this bounded epic slice; GPT-5.6 Sol implements.
- **Severity:** minor
- **Action:** accept as owner-authorized route override; preserve separate-session IMPL-EVAL.
- **Evidence:** `supervisor.md`.
