# Drift Log: PR-C #1380

## 2026-08-12 — Acceptance-mirror notice repeated the corrected R-11 claim

- **What:** The live dry-run after PR-body evidence was posted printed that applying the label
  triggers a fresh run. `ci.yml` does not listen to `labeled`, so the mirror's own repair notice
  contradicted the corrected skill and close-gate hint.
- **Source:** `mirror-acceptance-evidence.ts` dry-run against PR #1585 at
  `c386b8593699c4ae4e52f881edcf4d733dbbddab`.
- **Expected:** Apply `status:ready-merge`, then rerun the existing CI workflow without moving head.
- **Actual:** The mirror said a labeled event triggers a fresh run.
- **Severity:** minor.
- **Action:** fix in the same R-11 slice and add an operator-message regression test; no workflow
  trigger change.
- **Evidence:** `readyLabelRepairNotice()` and `mirror-acceptance-evidence_test.ts`.
