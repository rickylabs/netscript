# Context pack — quality-scan-allowance-rail

## Current gate state

- Formal opposite-family PLAN-EVAL cycle 2 returned `PASS` and is committed at
  `c694cfb311d378f4796280649042c8c275c828ed`; implementation is authorized.
- Slice 1 registers and verifies the seven allowances, sets both budgets to 7, updates the scanner
  permissions, and regenerates the consumer bundle. It is stopped for substantive Tier-A review;
  do not start Slice 2 or create a supervisor sign-off commit before that review.
- Draft PR #1653 directly targets `main`, remains draft, and retains exactly `status:impl`.
- Branch: `chore/quality-scan-allowance-rail`, no upstream. Base:
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Fetched `origin/main` advanced to `dd472102d` only through merged #1644. No authorized leaf
  surface overlaps that commit; this branch was not rebased and does not absorb #1644.
- No debt-registry or lock-file change has started. No runtime lease, merge, publication, ready
  transition, or central-state mutation occurred.

## Coordinator authority locked

Authority is public in PR #1653 comment `5286261678` and central commit
`874eacc0d179901cc4c7e9e784ec5176f19ade82`:

1. All seven source allowances bind to open, milestoned #1276 T3 and retain their specific reasons.
   Live #1545 now states the measured seven and may close; it is not a durable source link.
2. The only added leaf surfaces are:
   - `.llm/tools/quality/scan-code-quality_test.ts`;
   - `.llm/tools/consumer-tools.json`;
   - `packages/cli/src/kernel/assets/agent-tools.generated.ts`;
   - `.llm/harness/debt/arch-debt.md`.
3. #1655 in milestone 0.0.8 owns removal of the 20 pre-existing Workers `private-type-ref`
   diagnostics across 13 export targets. During implementation this leaf may add a `DEBT_ACCEPTED`
   no-increase record, but may not claim full-export lint green or absorb the repair.

No other surface widening is authorized. The debt registry is an authorized future implementation
surface and was deliberately not edited during plan repair.

## Advisory evaluator provenance

- Historical session: `977b0618-1b0c-4957-8369-698d3c5274c6` (Claude Code transport using OpenRouter
  `minimax/minimax-m3`, high) after native `fable-5`/medium returned `model_not_found`.
- Evaluated head: `c573beda9e6f1508e9263062c425641da7f35d44`; artifact commit:
  `8a4709afe4271833dad2eff9752115634552b7ba`.
- Historical output: `FAIL_PLAN` identifying D-2, D-3, and D-4.
- Coordinator disposition: advisory evidence only because this Claude-compatible OpenRouter launch
  occurred after the owner hold. Its findings informed the decisions above but it is not the current
  formal Plan-Gate verdict.
- `plan-eval.md` preserves that history and marks the formal gate unsatisfied. The two untracked
  prompt files and failed self-referential transport JSONL were removed rather than committed.

## Formal PLAN-EVAL result and next action

Native Claude Opus 5 cycle 2 evaluated repaired head `09dfb092d` in separate session
`b6c48f02-cb56-4dae-abfd-e46bdec05bd5` and returned `PASS`. The canonical verdict is
`plan-eval.md`; the evaluator artifact commit is `c694cfb311d378f4796280649042c8c275c828ed` and
the verdict comment is `5299133651`.

Next action: the topic orchestrator performs substantive Tier-A review of Slice 1. This author
thread remains stopped before Slice 2. The final IMPL-EVAL remains a separate opposite-family
session after all four slices and supervisor reviews.
