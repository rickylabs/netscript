# Context Pack — Wave 2b Data Adapters

Run ID: `feat-package-quality-wave2-adapters-2b--data` Branch:
`feat/package-quality-wave2-adapters-2b` Role: GENERATOR only. Do not treat this file as an
IMPL-EVAL.

## Scope

Implemented locked Wave 2b data-adapter slices for:

- `packages/kv`
- `packages/database`
- `packages/prisma-adapter-mysql`

Out of scope and not intentionally changed:

- Wave 2a units: logger, telemetry, aspire
- Wave 2c units: queue, cron
- S2/S3 CI, versioning, publishing, OIDC, and umbrella merge-readiness

## Implementation Commits

- `5774c18`: `feat(kv): align data adapter package quality`
- `8cab1d7`: `feat(database): align data adapter package quality`
- `9ceb9c7`: `feat(prisma-adapter-mysql): align package quality gates`

## Key Decisions

- `@netscript/kv`: consolidated bridge-role files under `adapters/`, renamed shared orchestration to
  `application/`, added `./testing`, docs, README, and package gates while preserving existing
  public runtime subpaths.
- `@netscript/database`: renamed `interfaces/` to `ports/` with no compatibility alias, added
  `./testing`, package metadata, docs, README, adapter-contract tests, and explicit public types to
  remove slow-type output.
- `@netscript/database`: removed the root `PrismaPg` re-export because `deno doc --lint` followed
  upstream private/undocumented types and internal package/plugin consumer search found no consumers
  of that re-export.
- `@netscript/prisma-adapter-mysql`: removed `skipLibCheck`, added package-root `mod.ts`, docs,
  README, tests, publish excludes for examples/tests, and narrowed the root public surface to
  package-owned adapter/factory/capability types.
- Runtime `console.*` was removed from touched package source surfaces; example scripts may still
  use console and are excluded from publish where relevant.

## Gate Evidence

- KV: package check PASS, all export doc-lint PASS, docs fixture test PASS, publish dry-run PASS
  with 0 slow types, scoped fmt/lint PASS.
- Database: package check PASS, all export doc-lint PASS with upstream npm type-resolution warnings
  only, adapter/docs tests PASS, publish dry-run PASS with 0 slow types, scoped fmt/lint PASS.
- Prisma MySQL: package check PASS, root doc-lint PASS, tests PASS, publish dry-run PASS with 0 slow
  types, scoped fmt/lint PASS.
- Consumer gate: CLI, sagas, streams, triggers, and workers package/plugin checks PASS.
- Scoped doctrine checks: `packages/kv`, `packages/database`, and `packages/prisma-adapter-mysql`
  all exit 0 with FAIL=0.

## Residuals For Evaluator

- Repo-wide `rtk proxy deno task arch:check` failed with 57 FAIL / 89 WARN / 1 INFO on out-of-scope
  existing doctrine debt. See `drift.md`.
- Scoped doctrine still reports WARN-only residuals in target packages: large files, existing `any`
  in Kvdex exported declarations, database script `Deno.exit`, database default export, and Prisma
  MySQL adapter file size.
- No generator-side IMPL-EVAL was run. A separate evaluator session must decide PASS/FAIL for Wave
  2b.
