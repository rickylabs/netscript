# Research — fix-workers-registry-compiler-parity--1875

## Re-baseline

- Carried-in source: issue #1875 and `implement.md`.
- Re-derived against `main` at `82a2527e27aa91baabf35e4b001ed8b6266308e6` on 2026-09-01.
- The worktree, local `main`, and `origin/main` all resolve to the requested baseline. The excluded
  files owned by PR #1872 and issue #1874 are untouched.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `JobConfigZodSchema` is the core-owned normalized contract and exposes its own object keys at runtime. | `packages/plugin-workers-core/src/config/job-config.ts` |
| 2 | The compiler emits a literal `RegisterJobInput` object that is not mechanically tied to those schema keys. | `plugins/workers/src/cli/registry-compiler.ts` |
| 3 | A live gap exists: `description`, `schedule`, `permissions`, `metadata`, and `retention` are schema keys but are absent from the emitted object. | Compare the schema object with `createLocalJobDefinition()` |
| 4 | The existing byte-golden test pins today's source but cannot notice a new schema key unless the expected source is manually updated. | `plugins/workers/tests/cli/registry-compiler-golden_test.ts` |
| 5 | The public `JobConfigSchema` value remains the underlying Zod object at runtime even though its exported TypeScript type is the narrower `ConfigSchema<JobConfig>`. An `instanceof z.ZodObject` guard can safely expose `.shape` in the test without changing the public API. | `packages/plugin-workers-core/src/config/mod.ts`; `job-config.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/workers/deno.json` exports and the existing `compileWorkersRegistry`
  export through `src/cli/mod.ts`.
- Planned surface impact: none. The compiler signature and package exports remain unchanged; the
  new schema-derived assertion is test-only.
- Slow-type / surface risks: none introduced. Existing plugin public-surface debt
  `workers-private-type-ref-1655` is unrelated and remains owned by issue #1655 / milestone 0.0.8.

## Open questions

- None. The issue supplies the direction, scope, exclusions, and gate restrictions.
