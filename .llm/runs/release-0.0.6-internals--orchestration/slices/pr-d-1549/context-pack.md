# PR-D context pack

- Branch: `fix/1549-quality-scan-provable-half`; base `eb373db29`; draft PR #1596.
- PLAN-EVAL: parent orchestration cycle 5 PASS (carried implementation brief).
- Implemented locally: shared-extractor docs scan, docs companion policy, explicit soundness
  exemption, comment-aware `explicit-any`, and deletion of two temporary doctrine allowances.
- Measured post-change allowance counts before budget wiring: repo 8, default 7.
- Open escalation D-1: three pre-existing findings in
  `docs/site/reference/contracts/examples_test.ts` are outside ownership, while final scans are
  required green. Continue unblocked work; do not fix or suppress them without direction.
- Landed rail commit: `5e081e8b8c9aebc6697827698a056b49055e8d58`.
- Trigger reference and executable twin are typed with `TriggerEventSubscriptionMessage`; both
  direct checking and the #1537 docs snippet gate pass.
- Final-head green gates: quality+docs tests (46/46), both doctrine gates, scoped check/lint/fmt,
  docs snippets, and trigger twin check.
- Open escalations: D-1 blocks both scan gates on three pre-existing docs-companion findings; D-2
  blocks asset freshness because regeneration changes an explicitly out-of-bound package file.
- Remaining: orchestrator resolution of D-1/D-2, final artifact commit/push/comment/body evidence.
