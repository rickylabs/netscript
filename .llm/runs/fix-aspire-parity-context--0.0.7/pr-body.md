## Summary

Repair five full-phase Aspire parity findings without rewriting historical guidance or weakening
current-version enforcement. Preserve legitimate minimum-version/negative-test context and correct
one stale JSDoc line.

## Scope

- Area: tooling validation; package change is comment-only.
- Part of #1712. Remaining epic gates include published canary and clean-machine receipts.

## Slices

- [x] Bootstrap bounded plan and ownership.
- [ ] Focused negative tests and implementation.

## Validation

Baseline full phase 2 fails five paths. Implementation gates and independent IMPL-EVAL pending.
No runtime/scaffold-output changes; this leaf does not replace the parent release gates.

## Harness

Run: `.llm/runs/fix-aspire-parity-context--0.0.7/`.
PLAN-EVAL N/A: bounded known-context repair. Do not merge until independent review and IMPL-EVAL pass.

## Drift / Debt

Failed helper attachment recorded; coordinator co-authoring, separate evaluator, no new debt.

## Definition of Done

- [ ] Focused regression and negative-control tests pass.
- [ ] Both parity phases pass with fresh generated manifest.
- [ ] Independent review/IMPL-EVAL pass; current CI and review threads clear.

