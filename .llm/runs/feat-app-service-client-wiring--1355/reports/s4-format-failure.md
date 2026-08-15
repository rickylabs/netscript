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

## Resume evidence amendment

The coordinator released S4 to resume from evidence commit
`ee479ea851927818404c6311dac78e07a4eef1b5` with explicit per-member configurations. This section
is append-only; it preserves the original fail-closed result above and records why the replacement
evidence is narrower and trustworthy.

### Package-quality TypeScript formatting

- CLI: PASS — `filesSelected=887`, `batches=1`, `failedBatches=0`, `findings=0`. The wrapper used
  the absolute neutral config
  `/home/codex/repos/netscript-007-features-1355/packages/runtime-config/deno.json` and
  `--batch-size 1000`, so every selected file was checked in one batch without inheriting the root
  CLI exclusion.
- Fresh: PASS — `filesSelected=201`, `batches=2`, `failedBatches=0`, `findings=0`, using the
  absolute `packages/fresh/deno.json` config.
- SDK: PASS — `filesSelected=84`, `batches=1`, `failedBatches=0`, `findings=0`, using the absolute
  `packages/sdk/deno.json` config.

The neutral runtime-config format settings are style-identical to the root settings
(`useTabs: false`, `lineWidth: 100`, `indentWidth: 2`, `semiColons: true`, `singleQuote: true`) and
do not exclude CLI. The CLI result is batching-sensitive: the same neutral config with the default
200-file batching fail-closes four of five batches despite zero findings, while a batch size greater
than the 887-file selection checks the complete selection in one passing batch. This is an observed
wrapper/Deno interaction, not a formatting defect.

The separate bare `deno fmt --check` Markdown scan reports one finding among 176 files in
`packages/cli/e2e/README.md`. That file is untouched by this leaf—
`git log 3fc0f2f92..HEAD -- packages/cli/e2e/README.md` is empty—so the finding is pre-existing and
out of scope. Per `AGENTS.md`, that broad Markdown scan is explicitly **not** used as the
package-quality formatting verdict above.
