# PR-D context pack

- Branch: `fix/1549-quality-scan-provable-half`; base `eb373db29`; draft PR #1596.
- PLAN-EVAL: parent orchestration cycle 5 PASS (carried implementation brief).
- Implemented locally: shared-extractor docs scan, docs companion policy, explicit soundness
  exemption, comment-aware `explicit-any`, and deletion of two temporary doctrine allowances.
- Measured post-change allowance counts before budget wiring: repo 8, default 7.
- Open escalation D-1: three pre-existing findings in
  `docs/site/reference/contracts/examples_test.ts` are outside ownership, while final scans are
  required green. Continue unblocked work; do not fix or suppress them without direction.
- Remaining: diff budget predicate/workflow step, max ceilings and overflow fixture, trigger typing,
  full gates, commits/push/comments/body evidence.
