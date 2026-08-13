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

## Locked behavior

- Fail closed on `entries: []` with an evidence-block-specific structured failure.
- Detect zero checkbox targets before index matching and instruct removal-or-checkbox conversion.
- Accept exact bare/heading/emphasis verdict token lines; keep templates/prose excluded.
- Distinguish absent marker from emitted-but-unparseable marker.
- Emit direct removal-or-checkbox-conversion guidance for plain-bullet Acceptance targets. The
  `netscript-pr` skill remains read-only by coordinator decision, so its documentation criterion is
  not claimed as leaf-delivered.

## Required next actions

1. Implement S1/S2 RED-first inside the exact eight-file implementation/test boundary.
2. Keep `netscript-pr` and every other undeclared product path read-only.
3. Preserve structured focused-test and final gate receipts in `receipts/`.
4. Move draft PR #1644 to `status:impl` only after real implementation lands.
5. Stop after requesting Tier-A substantive review and separate opposite-family IMPL-EVAL.

No merge, ready transition, publication, release, milestone-scope, or central-cluster-state authority.
