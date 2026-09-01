# Context pack — Slice C `JobConfig` policy completion

## Current state

- Branch: `feat/workers-job-config-schema`
- Base: `main` `78be0e032624f12bcb30535d40e3a948b08b9784`
- PLAN-EVAL: separate-session `PASS` in `plan-eval.md`
- Phase: Slice C implementation and required gates complete; draft PR handoff follows this commit
- Issue relation: contract half only; merging leaves #1451 open for Slice G

## Landed scope

Only the two approved product files changed:

1. `packages/plugin-workers-core/src/config/job-config.ts`
2. `packages/plugin-workers-core/tests/config/workers-config_test.ts`

`JobConfig` now models `priority`, `retryDelay`, `maxConcurrency`, and `persist` with the exact
constraints/defaults already used by the canonical job-definition schema and generated
`RegisterJobInput` literal. The generator is intentionally unchanged.

## Evidence summary

- Focused structured check/lint/fmt: 2 files selected, 0 findings/diagnostics; every wrapper emitted
  non-empty output.
- Focused structured test: 5 passed, 0 failed, with non-empty output.
- `deno doc` renders the four fields; config-subpath doc lint exits 0.
- Full package doc lint remains at the carried 9 diagnostics, with the config entrypoint at 0 before
  and after.
- Core publish dry-run passes; its receipt records 15,945 stderr bytes, the correct verdict stream.
- JSR audit, `quality:scan`, and `arch:check` pass with carried warnings only.
- `deno.lock` remains byte-identical to `main` (`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`).
- No runtime/Aspire/Docker/browser/E2E gate ran.

## Handoff constraints

- One commit for Slice C, including the inherited plan/PLAN-EVAL artifacts and this updated run
  context.
- Push by explicit refspec and open a draft PR with `Refs #1451`; do not apply labels or add an
  issue-closing keyword.
- Do not dispatch or cancel an evaluator and do not merge.
- Slice G follows this contract and owns config-aware registry generation.
