# PR-D context pack

- Branch: `fix/1549-quality-scan-provable-half`; base `eb373db29`; draft PR #1596.
- PLAN-EVAL: parent orchestration cycle 5 PASS (carried implementation brief).
- Implemented locally: shared-extractor docs scan, docs companion policy, explicit soundness
  exemption, comment-aware `explicit-any`, and deletion of two temporary doctrine allowances.
- Measured post-change allowance counts before budget wiring: repo 8, default 7.
- D-1 resolved by explicit orchestrator authorization: the three findings in
  `docs/site/reference/contracts/examples_test.ts` use typed fixture inputs and narrowing in
  `bd95998fd9d73565f0e5454559db8c536474db79`; no fourth finding surfaced.
- Landed rail commit: `5e081e8b8c9aebc6697827698a056b49055e8d58`.
- Trigger reference and executable twin are typed with `TriggerEventSubscriptionMessage`; both
  direct checking and the #1537 docs snippet gate pass.
- D-2 resolved by explicit orchestrator authorization: generated derivative-only commit
  `b82d2086eacb65552552f933c441ff8ca2e7b177` is idempotent under a second `gen:assets-barrel` run
  and leaves status empty.
- Green gate set: quality+docs tests (46/46); scans (repo 10 → 8, default 7 → 7); both doctrine
  gates; docs snippets; scoped check/lint/fmt; trigger/contracts checks; asset idempotence.
- Remaining: commit this final evidence record, rerun gates at that literal final head, update PR
  body/comment, and stop for orchestrator-owned ready/evaluation/merge.
