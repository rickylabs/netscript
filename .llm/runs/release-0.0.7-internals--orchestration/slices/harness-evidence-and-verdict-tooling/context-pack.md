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
- S1 passed Tier-A re-review through `01db2bd360ea15d8bd9b53fee5fc392678321f43`; its supervisor
  sign-off is recorded in the run-artifact-only commit containing this context update.
- S2 candidate `8b4f4b509e4cb9ad6f7e9414b9b948ce9a2b7a33` is pushed with 81 passing focused
  tests and clean check/format reports; substantive Tier-A review is pending.

## Locked behavior

- Fail closed on `entries: []` with an evidence-block-specific structured failure.
- Detect zero checkbox targets before index matching and instruct removal-or-checkbox conversion.
- Accept exact bare/heading/emphasis verdict token lines; keep templates/prose excluded.
- Distinguish absent marker from emitted-but-unparseable marker.
- Emit direct removal-or-checkbox-conversion guidance for plain-bullet Acceptance targets. The
  `netscript-pr` skill remains read-only by coordinator decision, so its documentation criterion is
  not claimed as leaf-delivered.

## Required next actions

1. Obtain and answer substantive Tier-A review of the literal S2 candidate SHA, then record its
   supervisor sign-off in a run-artifact-only commit.
2. Obtain coordinator acceptance reconciliation for the denied `netscript-pr` edit versus the
   binding `Closes #1561` / `Closes #1621` claims; do not resolve it by widening scope.
3. Keep `netscript-pr` and every other undeclared product path read-only.
4. Preserve structured focused-test and final gate receipts in `receipts/`.
5. Stop after requesting Tier-A substantive review and separate opposite-family IMPL-EVAL.

No merge, ready transition, publication, release, milestone-scope, or central-cluster-state authority.
