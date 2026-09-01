# Research — feat-workers-config-registry--1451-g

## Re-baseline

- Carried-in source: `.llm/runs/feat-workers-runtime--1592-1451/plan.md`, decisions D5–D7 and Slice G.
- Re-derived against `origin/main` / branch base `1e53e731a69336d206241a9cd42314b15ca65422`
  on 2026-09-01. Local `main` is stale at `b66e52cbc`; all comparisons use the immutable base SHA.
- What changed vs the carried-in version: no product-surface contradiction. Slice C (#1861) is
  present at the base and supplies the normalized four-field policy contract.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `loadConfig({ cwd })` validates the root config while preserving plugin-owned top-level sections. | `deno doc --filter loadConfig packages/config/mod.ts`; `packages/config/src/domain/schemas/netscript-config-schema.ts` ends in `.passthrough()` |
| 2 | `WorkersConfigSchema` is the sole workers-policy validation/defaulting owner and returns `WorkersConfigData \| undefined`. | `deno doc --filter WorkersConfigSchema packages/plugin-workers-core/src/config/mod.ts` |
| 3 | Slice C normalized `priority`, `retryDelay`, `maxConcurrency`, and `persist`; zero concurrency remains valid. | `packages/plugin-workers-core/src/config/job-config.ts` |
| 4 | The workers generator currently discovers files from `scaffold.runtime.json` but emits generic definitions without project policy. | `plugins/workers/src/cli/runtime-registry-generator.ts` |
| 5 | The installed CLI host executes the plugin generator under the project `deno.json`, project cwd, and read/write permissions, then deletes its temporary manifest. | `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts` |
| 6 | Runtime startup consumes the generated `jobDefinitions` map directly. | `plugins/workers/src/runtime/generated-jobs.ts`; `plugins/workers/bin/runtime.ts` |
| 7 | Baseline installed-registry integration passes 9/9. | structured test wrapper on `installed-runtime-registry-integration_test.ts`, exit 0 |
| 8 | Baseline doc lint is 20 pre-existing private-type diagnostics for `plugins/workers` and 0 for `packages/cli`. | `deno task doc:lint --root <root> --pretty` before edits |
| 9 | `deno.lock` matches base byte-for-byte before edits. | working/base Git blob `ac2ee042566bc6b03502c40961c10d624416b061` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/workers/deno.json` exports and the `./cli` re-export of
  `GenerateRuntimeRegistriesOptions`.
- Slow-type / surface risks: the option extension must remain explicitly typed; no new export
  subpath is planned. Plugin full-export doc lint has 20 baseline private-type diagnostics, so the
  slice bar is zero new diagnostics. CLI is clean at 0.
- Publish-file risk: the new test is excluded by `publish.exclude`; generator source and README are
  already in the publish include set.

## Open questions

- None that alter the locked plan. The legacy `registry-compiler.ts` backend remains explicit
  follow-up scope per the clustered PLAN-EVAL.
