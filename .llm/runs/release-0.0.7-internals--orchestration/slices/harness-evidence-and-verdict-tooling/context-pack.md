# Context pack — harness-evidence-and-verdict-tooling

## Current state

- Wave 0 leaf remains at baseline `01e0960494c95ce56eb35892c211a095eb13e6ed` on
  `fix/harness-evidence-and-verdict-tooling`, with no upstream.
- Live #1561, #1563, and #1621 research is complete. The remedies are locked/mechanical and
  `PLAN-EVAL: N/A` is recorded before implementation.
- S0 bootstrap is committed at `0be658912d167da5bc46b718a862a43e33e5f4c4`, pushed by explicit
  refspec, and exposed in draft PR #1644 against `main`.
- Coordinator clarification is recorded on PR #1644 comment `5286066438`: the five exact source/test
  peers in `drift.md` are authorized; `netscript-pr` is read/use only and no further product path is
  admitted.
- S1 candidate `a4a3010427afa43a36ac1c477b854e067162464a` received Tier-A
  `CHANGES_REQUESTED`; the one required mirror-boundary fixture is now green with replacement
  receipts and awaits a follow-up candidate commit/re-review.
- S2 is implemented separately in the working tree; 81 focused agentic/workflow tests pass, but it
  has not been committed, pushed, or submitted for Tier-A review yet.

## Locked behavior

- Fail closed on `entries: []` with an evidence-block-specific structured failure.
- Detect zero checkbox targets before index matching and instruct removal-or-checkbox conversion.
- Accept exact bare/heading/emphasis verdict token lines; keep templates/prose excluded.
- Distinguish absent marker from emitted-but-unparseable marker.
- Emit direct removal-or-checkbox-conversion guidance for plain-bullet Acceptance targets. The
  `netscript-pr` skill remains read-only by coordinator decision, so its documentation criterion is
  not claimed as leaf-delivered.

## Required next actions

1. Commit/push the isolated S1 Tier-A fix and request re-review of its literal SHA.
2. Commit/push the isolated S2 candidate and request substantive Tier-A review.
3. Obtain coordinator acceptance reconciliation for the denied `netscript-pr` edit versus the
   binding `Closes #1561` / `Closes #1621` claims; do not resolve it by widening scope.
4. Keep `netscript-pr` and every other undeclared product path read-only.
5. Preserve structured focused-test and final gate receipts in `receipts/`.
6. Stop after requesting Tier-A substantive review and separate opposite-family IMPL-EVAL.

No merge, ready transition, publication, release, milestone-scope, or central-cluster-state authority.
