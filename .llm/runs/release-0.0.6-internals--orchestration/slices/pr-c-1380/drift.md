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

## 2026-08-12 — Shallow-clone boundary was misreported as repository ancestry

- **What:** The implementation brief supplied the false framing that reachable history begins at
  `317e4b509` and that the two `@netscript/shared` commits are non-ancestors. This checkout is
  shallow, so the local root and ancestry probes could not establish either claim.
- **Source:** IMPL-EVAL finding F1 against PR #1585.
- **Expected:** Record that `@netscript/shared` existed in reachable history, was added at
  `0ef13de35` on 2026-06-05, and was removed at `fd8259b76`; the GitHub compare API establishes both
  commits as canonical ancestors of `main`.
- **Actual:** The doctrine described `317e4b509` as the start of reachable history and the shared
  commits as non-ancestors.
- **Severity:** correctness.
- **Action:** Correct only the shared provenance row and its executable documentation contract; add
  a diagnostic note requiring `git rev-parse --is-shallow-repository` and the compare API for
  ancestry claims from a shallow checkout.
- **Accountability:** The parent orchestrator's brief supplied the false framing. The evaluator
  caught it. The orchestrator's initial rebuttal reused the same invalid shallow-clone premise and
  was wrong.
