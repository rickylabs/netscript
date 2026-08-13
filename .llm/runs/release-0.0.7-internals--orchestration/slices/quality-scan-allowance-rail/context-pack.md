# Context pack — quality-scan-allowance-rail

## Current gate state

- **BLOCKED:** do not launch any evaluator, Claude/Claude-compatible OpenRouter process, product
  implementation, runtime lease, merge, or publication before the Saturday 2026-08-15 00:00
  Europe/Zurich allowance reset.
- A fresh formal opposite-family PLAN-EVAL remains mandatory after the reset. This Codex author
  thread cannot evaluate its own repaired plan.
- Draft PR #1653 directly targets `main`, remains draft, and must retain exactly `status:plan-eval`.
- Branch: `chore/quality-scan-allowance-rail`, no upstream. Base:
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- No product, generated, debt-registry, or lock-file implementation has started.

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

## After-reset formal PLAN-EVAL request — do not dispatch early

After 2026-08-15 00:00 Europe/Zurich, the topic orchestrator may launch one fresh bounded evaluator
session on the opposite-family route selected by the then-current lane policy. The evaluator must:

1. read `.llm/harness/gates/plan-gate.md` and `.llm/harness/evaluator/plan-protocol.md`;
2. evaluate the repaired branch head, not historical `c573beda9`;
3. verify the coordinator authority against comment `5286261678` and central commit `874eacc0d`;
4. audit public reachability, fail-closed issue state, the seven-count budget, exact amended
   surfaces, generated-asset freshness, #1655 no-increase debt handling, JSR/publish evidence,
   slices, gates, and exclusions;
5. replace/update `plan-eval.md` with a fresh formal `PASS` or `FAIL_PLAN` verdict.

Implementation remains prohibited until that fresh formal verdict is `PASS`.
