## Summary

Exclude all retained harness run artifacts and transient working copies from Aspire static checks,
as explicitly directed by the owner. Preserve checks on framework source, shipped resources and
maintained docs; correct negative-guard/compatibility classification and one stale JSDoc line.

## Scope

- Area: tooling validation; package change is comment-only.
- Part of #1712. Remaining epic gates include published canary and clean-machine receipts.
- Shared exclusion policy covers parity, host-port and polling checks. Run files remain committed.
- No workflow, dependency, scaffold-output or runtime behavior change.

## Slices

- [x] Bootstrap bounded plan and ownership.
- [x] Focused negative tests and implementation.
- [x] Owner-directed transient/run exclusions and durable AGENTS.md policy.

## Validation

Baseline full phase 2 failed five paths. Now: 58 focused tests PASS (including shipped import closure); full phase 2 PASS (867 checked,
0 failures, 0 missing, fresh manifest); host-port scan PASS (966 files); selected source
check/lint/fmt PASS (10/10 processed). Independent IMPL-EVAL and current CI pending.
No runtime/scaffold-output changes; this leaf does not replace the parent release gates.

## Harness

Run: `.llm/runs/fix-aspire-parity-context--0.0.7/`.
PLAN-EVAL N/A: bounded known-context repair. Do not merge until independent review and IMPL-EVAL pass.

## Drift / Debt

Failed helper attachment recorded; coordinator co-authoring, separate evaluator, no new debt.

## Definition of Done

- [x] Focused regression and negative-control tests pass.
- [x] Both parity phases pass with fresh generated manifest at the amended head.
- [ ] Independent review/IMPL-EVAL pass; current CI and review threads clear.
