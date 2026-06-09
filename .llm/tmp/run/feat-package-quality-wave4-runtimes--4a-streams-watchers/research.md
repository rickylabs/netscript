# Research — Wave 4 · 4a: streams + watchers

Run ID: `feat-package-quality-wave4-runtimes--4a-streams-watchers`
Branch: `feat/package-quality-wave4-runtimes-4a` (off umbrella `feat/package-quality-wave4-runtimes` @ `ee9f26b`)
Base date: 2026-06-08

## Re-baseline

- Carried-in source: umbrella `research.md` (§§0–8) + `split-strategy.md` + canonical `plan_streams.md` / `plan_plugin-streams.md` / `plan_watchers.md`
- Re-derived against current tree @ `8abdf52` (sub-wave seed)
- What changed vs carried-in:
  - `plugin-streams-core` doc-lint was "not yet measured" → **1 error** (private-type-ref), not zero
  - `plugin-streams` doc-lint was "not yet measured" → **15 errors** (private-type-ref + missing-jsdoc)
  - `watchers` doc-lint was "not yet measured" → **5 errors** (missing-jsdoc on constructors)
  - All 3 units still `publish --dry-run` PASS, 0 slow types (confirmed)
  - `plugin-streams` tests = 0 (confirmed)
  - `watchers` flat layout / no README / no docs / no tasks (confirmed)

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | `plugin-streams-core` full-export doc-lint = **1 error** | `deno doc --lint mod.ts src/telemetry/mod.ts src/testing/mod.ts` → `private-type-ref` on `createStreamTopicFixture` referencing private `StreamTopicFixtureSchema` (`src/testing/topic-fixtures.ts:22`) |
| 2 | `plugin-streams` full-export doc-lint = **15 errors** | `deno doc --lint mod.ts src/cli/composition/main.ts src/scaffolding/mod.ts src/e2e/mod.ts src/aspire/mod.ts` → 11 private-type-ref + 4 missing-jsdoc |
| 3 | `watchers` full-export doc-lint = **5 errors** | `deno doc --lint mod.ts` → 5 missing-jsdoc on constructors (`FileWatcher`, `StabilityFilter`, `GlobFilter`, `DedupFilter`, `AccessFailureTracker`) |
| 4 | All 3 units `deno publish --dry-run --allow-dirty` = **PASS, 0 slow types** | Run per unit; file lists clean |
| 5 | All 3 units `deno check --unstable-kv` over all entrypoints = **PASS** | Run per unit |
| 6 | `plugin-streams` has **0 test files** | `find plugins/streams -name "*_test.ts" -o -name "*.test.ts"` → 0 |
| 7 | `plugin-streams-core` has **2 test files** | `tests/application/durable-stream-producer_test.ts`, `tests/testing/memory-stream-producer_test.ts` |
| 8 | `watchers` has **3 test files** (flat, alongside source) | `filters/dedup_test.ts`, `filters/glob_test.ts`, `filters/stability_test.ts` |
| 9 | `plugin-streams-core` consumers = **4 plugins** (NOT zero) | `grep -r "@netscript/plugin-streams-core" plugins/` → `plugin-streams`, `plugin-sagas`, `plugin-triggers`, `plugin-workers` |
| 10 | `plugin-streams` consumers = **2 plugins + CLI test** (NOT zero) | `grep -r "@netscript/plugin-streams" plugins/ packages/cli/` → `plugin-sagas`, `plugin-workers`, `copy-official-plugin-copy_test.ts` |
| 11 | `watchers` consumers = **1 plugin** (NOT zero) | `grep -r "@netscript/watchers" plugins/` → `plugin-triggers` (`watchers-file-watcher-adapter.ts`) |
| 12 | `plugin-streams-core` `DurableStreamProducer` owns runtime behavior | `src/application/create-durable-stream.ts` — network I/O, connection lifecycle, singleton registry (`producers` Map), flush/close, AbortSignal, `console.warn` on errors |
| 13 | `watchers` `FileWatcher` owns runtime behavior | `file-watcher.ts` — async watch loop, strategy selection, filter pipeline, AbortSignal propagation, `stop()` handle |
| 14 | `plugin-streams-core` `create-durable-stream.ts` = 261 LOC (F-1 OK) | `wc -l` |
| 15 | `watchers` `file-watcher.ts` = 309 LOC (F-1 OK) | `wc -l` |
| 16 | `plugin-streams` has no `verify-plugin.ts` | `find plugins/streams -name "*verify*"` → 0 |
| 17 | `plugin-streams-core` `deno.json` `check` task only checks `mod.ts` | `"check": "deno check --unstable-kv mod.ts"` — misses `src/telemetry/mod.ts` and `src/testing/mod.ts` |
| 18 | `watchers` `deno.json` has **no tasks at all** | Confirmed |
| 19 | `watchers` `deno.json` has **no description** | Confirmed |
| 20 | `watchers` publish `include` is overly broad (`**/*.ts`) | Includes flat root files without `src/` scoping |

## jsr-audit surface scan

### `plugin-streams-core`
- Surface scanned: `mod.ts`, `src/telemetry/mod.ts`, `src/testing/mod.ts`
- Slow-type / surface risks: **none** (0 slow types, dry-run PASS)
- Doc-lint risk: 1 private-type-ref in testing entrypoint
- Publish file list: clean (README, deno.json, mod.ts, src/**/*.ts, docs/**/*.md)

### `plugin-streams`
- Surface scanned: `mod.ts`, `src/cli/composition/main.ts`, `src/scaffolding/mod.ts`, `src/e2e/mod.ts`, `src/aspire/mod.ts`
- Slow-type / surface risks: **none** (0 slow types, dry-run PASS)
- Doc-lint risk: 15 errors — primarily private-type-refs leaking upstream types (`PluginManifest`, `PluginCli`, `AspireNSPluginContribution`, `StandardSchemaV1`)
- Publish file list: clean (includes services/**/*.ts)
- Missing: `verify-plugin.ts` (A5 requirement)

### `watchers`
- Surface scanned: `mod.ts`
- Slow-type / surface risks: **none** (0 slow types, dry-run PASS)
- Doc-lint risk: 5 missing-jsdoc on constructors
- Publish file list: overly broad (`**/*.ts` includes flat root — will improve with structural lift)
- Missing: README, docs/, tasks, description

## Open questions (all resolved in plan)

| Question | Resolution |
|----------|------------|
| `plugin-streams-core` A1 vs A3? | **A3** — owns `DurableStreamProducer` runtime behavior (connection lifecycle, singleton registry, network I/O). Not a pure contract surface. Declared in `docs/architecture.md`. |
| `watchers` structural lift scope? | Full lift to `src/public/` tree + README + docs scaffold + task block. 9 slices. |
| `plugin-streams` test layer shape? | Manifest + CLI + Aspire + E2E gate tests + `verify-plugin.ts`. 4 test files. |
| Split watchers into micro sub-wave? | **No** — 23 total slices < 30 cap. Combined plan is viable. |
