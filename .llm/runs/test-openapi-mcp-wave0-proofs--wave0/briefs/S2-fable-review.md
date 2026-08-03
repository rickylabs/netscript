use harness

# S2 Fable review — P2 no-DB measurement and DB failure

You are the separate opposite-family slice reviewer. Work only in
`/home/codex/repos/ns005-proofs-impl`. Do not edit implementation/evidence files, run an AppHost or
scaffold, delegate, commit, push, or contact GitHub.

Read plan D3/D7/D8/D10/D12, `plan-eval.md`, issue #1128, RFC §4, the approved S1 re-review, and the
stable S2 diff. Review at minimum:

- `proofs/P2-verdict.md`
- `proofs/experiments/p2-measure-live-spec.ts`
- `proofs/evidence/P2-no-db.json`
- `proofs/evidence/P2-db-failure.json`
- `proofs/evidence/P2-runtime.json`
- `proofs/evidence/P2-attempts.md`
- the P1 evidence carried into the DB failure
- `worklog.md`, `context-pack.md`, and `drift.md`

Determine whether the explicit combined P2 `FAIL` is the only truthful D7/D12 verdict. Confirm the
unattributed P1 HTTP 200 was not reused; the no-DB spec is attributed to one owned healthy real
scaffold; all required operationId, compact-byte, discovery-row, request/response/error/all-schema,
source/dereference, error-envelope, reference, keyword, and truncation-budget observations are
measured rather than inferred; and the tool's algorithms support every claim.

Adversarially check evidence consistency, normalization under D10 (including volatile PIDs/times),
fixed-port ownership, teardown, lock/scope hygiene, static-gate claims, and whether any result could
be misread as satisfying #1128 acceptance despite the missing DB measurement. Confirm no product
or template workaround was made.

Write exactly one artifact at `reviews/S2-fable.md`; first line exactly `APPROVED` or
`CHANGES_REQUESTED`. Rank findings by severity with concrete required actions. State separately
whether #1128's acceptance box may truthfully be checked. This is advisory slice review, not
IMPL-EVAL.
