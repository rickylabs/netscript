# Context pack — quality-scan-allowance-rail

## Current gate state

- Formal opposite-family PLAN-EVAL cycle 2 returned `PASS` and is committed at
  `c694cfb311d378f4796280649042c8c275c828ed`; implementation is authorized.
- Slice 1 is signed off at `3c398528996a715da8daebe04969e6aba90263e9` (PR comment `5299297798`). Its
  seven-record registration, R-1 fail-closed resolver, R-2 `Backlog / Triage` acceptance, and
  landed-head budget attestation do not need to be repeated.
- Slice 2 implements the checked-in local export/re-export graph and token-aware `public-any`
  enforcement in the scanner and focused test only. RED-first, focused 25/25, scoped
  check/lint/format, `quality:scan`, `quality:scan:repo`, and `quality:gate` receipts are under
  `receipts/slice-2/`; Slice 2 is signed off at `f9acdb426d5438935ae75bee7dda987dbfe3d4cb` (PR
  comment `5299457083`).
- Slice 3 regenerated the embedded consumer scanner through the checked-in generator, proved a clean
  second run, and completed the planned per-member JSR evidence. CLI full-export lint is green
  across 3 targets. Workers full-export lint remains the exact expected baseline of 20
  `private-type-ref` diagnostics across 13 targets, with zero other classes; the authorized debt
  entry binds it to open #1655 in milestone 0.0.8. Both scoped publish dry-runs, the generated-file
  check, and `quality:gate` exit 0. Receipts are under `receipts/slice-3/` at the signed Slice 2
  parent; none names a stash or non-history commit-ish.
- **Stop state:** Slice 3 now awaits substantive Tier-A review. Do not begin Slice 4 or create a
  supervisor sign-off commit from the author lane.
- Draft PR #1653 directly targets `main`, remains draft, and retains exactly `status:impl`.
- Branch: `chore/quality-scan-allowance-rail`, no upstream. Base:
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- This branch was not rebased and does not absorb or mutate #1644.
- The only debt-registry change is the authorized #1655 strict no-increase entry. No lock-file
  change, runtime lease, merge, publication, ready transition, or central-state mutation occurred.

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
`b6c48f02-cb56-4dae-abfd-e46bdec05bd5` and returned `PASS`. The canonical verdict is `plan-eval.md`;
the evaluator artifact commit is `c694cfb311d378f4796280649042c8c275c828ed` and the verdict comment
is `5299133651`.

Next action: the topic orchestrator performs substantive Tier-A review of Slice 3 using the author
commit and `receipts/slice-3/`. This author thread remains stopped before Slice 4. The final
IMPL-EVAL remains a separate opposite-family session after all four slices and supervisor reviews.
