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
- S2 passed Tier-A review at `8b4f4b509e4cb9ad6f7e9414b9b948ce9a2b7a33`; its supervisor
  sign-off is recorded in the run-artifact-only commit containing this context update.
- The contract's durable `check`, `test`, and `quality-job` gates passed at signed-off
  implementation head `b21424c44bf43077b4caf5702ef58b3e1d0c00b1`; tracked JSON receipts are
  preserved under `receipts/pre-guidance/` as historical pre-guidance evidence. The quality job
  emitted existing non-blocking dependency-catalog warnings and did not mutate `deno.lock` or source
  files.
- Coordinator control head `33626b1f4752b3a0e53ea21407ff1ddb6af0fcfb` and PR comment
  `5286507468` supersede the read/use-only restriction for exactly
  `.agents/skills/netscript-pr/SKILL.md`. The acceptance-complete leaf surface is now nine files;
  no tenth source, workflow, tool, test, or skill path is authorized.

## Locked behavior

- Fail closed on `entries: []` with an evidence-block-specific structured failure.
- Detect zero checkbox targets before index matching and instruct removal-or-checkbox conversion.
- Accept exact bare/heading/emphasis verdict token lines; keep templates/prose excluded.
- Distinguish absent marker from emitted-but-unparseable marker.
- Emit direct removal-or-checkbox-conversion guidance for plain-bullet Acceptance targets, and state
  in the canonical `netscript-pr` machine convention that only markdown checkboxes are close-gated
  and mirrorable, so a plain-bullet `Acceptance` section takes no `acceptance-evidence` block.

## Handoff state

1. Commit and push the acceptance-complete guidance plus this run-artifact reconciliation.
2. Run exactly one final structured `check`, `test`, and `quality-job` cycle at that literal
   implementation head. Package/plugin `quality:gate` and JSR audit remain N/A.
3. Package the new receipts plus the implementation-parent/evidence-child relationship in one
   evidence-only commit; do not rerun merely because that receipt-only commit changes HEAD.
4. Keep draft PR #1644 at `status:impl`, with S3/its DoD row checked only after the guidance commit
   exists and the IMPL-EVAL row unchecked.
5. Stop at the native opposite-family IMPL-EVAL handoff. The evaluator is held until Saturday
   2026-08-15 00:00 Europe/Zurich; no substitute route is authorized.

No merge, ready transition, publication, release, milestone-scope, or central-cluster-state authority.
