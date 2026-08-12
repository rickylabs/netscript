# PR-D context pack

- Branch: `fix/1549-quality-scan-provable-half`; rebased base
  `f542f31cbea383f28dd2ea8ebc7ac99697c147a2`; non-draft PR #1596. The orchestrator owns the
  ready-state, evaluation trigger, and merge.
- PLAN-EVAL: parent orchestration cycle 5 PASS (carried implementation brief).
- Implemented locally: shared-extractor docs scan, docs companion policy, explicit soundness
  exemption, comment-aware `explicit-any`, and deletion of two temporary doctrine allowances.
- Measured post-change allowance counts before budget wiring: repo 8, default 7.
- D-1 resolved by explicit orchestrator authorization: the three findings in
  `docs/site/reference/contracts/examples_test.ts` use typed fixture inputs and narrowing in
  `d876bfa93635ce924539f12ad236fc482f2d5815`; no fourth finding surfaced.
- Landed rail commit after rebase: `c165adeb4d0d501b500bb97107a7064ef9ceff4e`.
- Trigger reference and executable twin are typed with `TriggerEventSubscriptionMessage`; both
  direct checking and the #1537 docs snippet gate pass.
- D-2 resolved by explicit orchestrator authorization: generated derivative-only commit
  `f73fb369620e154f4c134cccf16423c9ae2f8f4c` is idempotent under a second `gen:assets-barrel` run
  and leaves status empty.
- Green gate set: quality+docs tests (46/46); scans (repo 10 → 8, default 7 → 7); both doctrine
  gates; docs snippets; scoped check/lint/fmt; trigger/contracts checks; asset idempotence.
- IMPL-EVAL on old head `7264ce6aac21eecade916ea4b0332f5a1912e0c3` returned `FAIL_FIX` because
  the embedded scanner's relative extractor import was absent from the installed bundle.
- Follow-up design: manifest schema 2 adds non-runnable `modules`; the extractor is registered,
  included in the ordered-path hash, and covered by a generic import-closure guard with a negative
  control. The existing init-agent test installs the bundle and runs every runnable tool's `--help`.
- Remaining: commit the correction, run the full follow-up gate set at the literal final head,
  update the PR without rewriting the existing seven-box acceptance mapping, and stop for the
  orchestrator-owned evaluation/merge sequence.
