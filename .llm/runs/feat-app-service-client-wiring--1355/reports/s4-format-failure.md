# S4 formatting-gate failure and attribution

## Candidate-head result

- Head: `1df8a5274d2adc7657eb785a37266aa0f1f7540d`
- Command:
  `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --root packages/fresh --root packages/sdk --ext ts,tsx`
- Exit: `2`
- Structured summary: `filesSelected=1172`, `batches=6`, `failedBatches=3`, `findings=0`,
  `ignoredFindings=0`.
- Fail-closed reason: three selected batches were excluded by Deno, so the wrapper refused a
  false-green verdict.

The repository-root `fmt` configuration explicitly excludes `packages/cli/` (`deno.json` under
`fmt.exclude`). The combined three-root wrapper invocation therefore selected CLI files which Deno
then excluded. This is a command/configuration mismatch, not a reported formatting difference.

## Earlier-commit attribution

The exact command was measured in a temporary local clone detached at the pre-implementation
PLAN-EVAL verdict commit `c53726c69b98a35bf293b89aeece12279f470be3`:

- Exit: `2`
- Structured summary: `filesSelected=1163`, `batches=6`, `failedBatches=3`, `findings=0`,
  `ignoredFindings=0`.
- Fail-closed reason: the same three selected batches were excluded by Deno.

Classification: **pre-existing invocation/configuration failure**. The nine-file selection delta
between the two commits does not change the failure shape. No product defect is attributed to this
leaf by this result.

## Stop boundary

Per the S4 dispatch, the slice stopped at the first red ordered gate. Lint, asset freshness,
per-member audits, isolated-declaration/publish dry-runs, and all four binding gates were not run.
No receipt was created or edited.

Exact four-receipt sufficiency at this stop is **INSUFFICIENT** because each contracted file is
absent:

1. `receipts/s4-check.json` — missing / NOT_RUN.
2. `receipts/s4-test.json` — missing / NOT_RUN.
3. `receipts/s4-publish-dry-run.json` — missing / NOT_RUN.
4. `receipts/s4-arch-check.json` — missing / NOT_RUN.
