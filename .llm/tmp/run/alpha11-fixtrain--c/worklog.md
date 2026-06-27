# Worklog: alpha.11 Slice C — interactive init + cache feature

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `alpha11-fixtrain--c` |
| Branch | `feat/cli-cache-interactive-alpha11-c` |
| Thread | `019f09d4-4f89-7023-8979-85c98aba376b` |
| Archetype | `6 - CLI/Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript init [name] --cache [enabled] --cache-backend <redis|garnet|deno-kv>`.
- Existing `--ci` and `-y/--yes` suppress interactive prompts.

### Domain Vocabulary

- `CacheBackendChoice` — public init cache backend flag vocabulary.
- `InitOptions.cache/cacheBackend` and `ValidatedInitOptions.cache/cacheBackend` — resolved scaffold
  inputs.
- `CacheBlock` — appsettings cache entry emitted by generator.

### Ports

- `PromptPort` — consumed by init interactive resolution through the existing Cliffy adapter.

### Constants

- `CACHE_BACKEND_CHOICES` — `redis`, `garnet`, `deno-kv`.
- `SCAFFOLD_DEFAULTS.CACHE_ENABLED` — `true`.
- `SCAFFOLD_DEFAULTS.CACHE_BACKEND` — `redis`.
- `SCAFFOLD_ASPIRE_INTEGRATIONS.REDIS/GARNET/DENO_KV` — named cache integration constants.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Public init cache contract and interactive resolver | focused init tests, doc lint | `packages/cli/src/public/features/init/*`, CLI domain/options files |
| 2 | Cache scaffold emission and Aspire schema support | generator tests, Aspire schema test | `generate-appsettings.ts`, `render-ts-apphost.ts`, `generate-register-infrastructure.ts`, `packages/aspire/config.ts` |
| 3 | Gates, artifacts, PR | scoped wrappers, full scaffold.runtime E2E | `.llm/tmp/run/alpha11-fixtrain--c/*`, PR body |

### Deferred Scope

- Deno KV managed runtime/container support is deferred; the slice emits appsettings/schema support
  and a file-backed infrastructure comment only.
- CLI reference/tutorial docs are deferred to Slice D with a note in the PR body.

### Contributor Path

To add another cache backend, update `CACHE_BACKEND_CHOICES`, `buildCacheBlock()`,
`generateRegisterInfrastructure()`, and the backend emission tests.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-27 | 1 | Research | Confirmed no `CACHE_URL` convention; reused existing provider/env vocabulary. |
| 2026-06-27 | 1 | Implement | Added cache backend domain contract, prompt resolver, public dependency wiring, and init flags. |
| 2026-06-27 | 2 | Implement | Added appsettings `PrimaryCache`/`Cache`, TS AppHost cache config, register-infrastructure cache handling, and `DenoKv` schema support. |
| 2026-06-27 | 2 | Unit gates | Focused init/generator/Aspire schema tests passed. |
| 2026-06-27 | 3 | Static gates | `packages/cli` check/lint/fmt wrappers and CLI doc lint passed. |
| 2026-06-27 | 3 | Runtime gate | Full `scaffold.runtime` E2E passed, 47 passed / 0 failed. |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| CLI doc lint | `deno doc --lint packages/cli/mod.ts` | PASS | Public package surface clean. |
| CLI check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 526 files, 0 findings. |
| CLI lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx --batch-size 1000` | PASS | 526 files, 0 findings. |
| CLI fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts --batch-size 1000` | PASS | 526 files, 0 findings. |
| Aspire check/lint/fmt/doc | scoped `packages/aspire` wrapper/doc commands | PASS | Required because schema accepted `DenoKv`. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Full scaffold runtime E2E | PASS | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | Summary: passed=47 failed=0. |

## Handoff Notes

- Slice D must update CLI reference docs for `--cache` and `--cache-backend`.
- Deno KV backend status is thin: config/schema only, no managed Aspire resource.

## Merge Reconcile: origin/main 2026-06-28

Resolved PR #159 against `origin/main` after first fast-forwarding to
`origin/feat/cli-cache-interactive-alpha11-c`.

| File | Resolution |
| ---- | ---------- |
| `.llm/tmp/run/alpha11-fixtrain--c/drift.md` | Kept ours; this branch owns the Slice C run artifact. |
| `.llm/tmp/run/alpha11-fixtrain--c/plan.md` | Kept ours; this branch owns the Slice C run artifact. |
| `.llm/tmp/run/alpha11-fixtrain--c/research.md` | Kept ours; this branch owns the Slice C run artifact. |
| `packages/cli/src/kernel/domain/cache-backend.ts` | Kept ours; both sides were byte-identical cache backend vocabulary. |
| `packages/cli/src/public/features/init/init-command.ts` | Combined Slice C cache/interactive init flags with Slice A dry-run context selection via `createInitContext({ dryRun })`. |
| `packages/cli/src/public/features/root/public-command-dependencies.ts` | Preserved Slice A `DryRunFileSystemAdapter` factory and retained the existing public init dependency graph used by Slice C. |

### Merge Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| CLI check | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` exited 0; 527 files selected, 5 batches, 0 findings. |
| Root/init regression tests | PASS | `deno test --unstable-kv --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts packages/cli/src/public/features/init/init-command_test.ts` exited 0; 5 passed / 0 failed. |
| Cast check | PASS | `git diff origin/main...HEAD -- '*.ts' '*.tsx' | grep -E "as unknown|as any"` reports only the pre-existing PR test fixture cast `} as unknown as InitPipelineContext;`; no new merge-resolution casts and no `as any` additions. |
