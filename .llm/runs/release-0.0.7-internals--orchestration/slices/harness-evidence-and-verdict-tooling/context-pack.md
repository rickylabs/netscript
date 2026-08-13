# Context pack — harness-evidence-and-verdict-tooling

## Current state

- Wave 0 leaf remains at baseline `01e0960494c95ce56eb35892c211a095eb13e6ed` on
  `fix/harness-evidence-and-verdict-tooling`, with no upstream.
- Live #1561, #1563, and #1621 research is complete. The remedies are locked/mechanical and
  `PLAN-EVAL: N/A` is recorded before implementation.
- S0 bootstrap is committed at `0be658912d167da5bc46b718a862a43e33e5f4c4`, pushed by explicit
  refspec, and exposed in draft PR #1644 against `main`.
- Implementation is blocked only on exact contract clarification for the paths in `drift.md`.

## Locked behavior

- Fail closed on `entries: []` with an evidence-block-specific structured failure.
- Detect zero checkbox targets before index matching and instruct removal-or-checkbox conversion.
- Accept exact bare/heading/emphasis verdict token lines; keep templates/prose excluded.
- Distinguish absent marker from emitted-but-unparseable marker.
- Document that plain-bullet Acceptance takes no evidence block.

## Required next actions

1. Await `topic-internals-0.0.7` / coordinator clarification requested on PR #1644 comment
   `5286024710` for the exact paths in `drift.md`.
2. Do not edit an undeclared path until the coordinator clarifies the contract.
3. Implement S1–S3 RED-first with structured receipts and Tier-A review between slices.
4. Run final immutable-head gates and request separate opposite-family IMPL-EVAL; keep draft.

No merge, ready transition, publication, release, milestone-scope, or central-cluster-state authority.
