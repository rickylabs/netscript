# Plan — Wave 4 · 4a: streams + watchers

## Run Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `feat-package-quality-wave4-runtimes--4a-streams-watchers` |
| Branch         | `feat/package-quality-wave4-runtimes-4a`                 |
| Phase          | `plan`                                                   |
| Target         | 3 publishable units: `@netscript/plugin-streams-core`, `@netscript/plugin-streams`, `@netscript/watchers` |
| Archetype      | A3 (streams-core), A5 (plugin-streams), A3 (watchers)    |
| Scope overlays | none                                                     |

## Archetype

### `@netscript/plugin-streams-core` → **A3 — Runtime/Behavior**

Justification: The package owns `DurableStreamProducer`, a stateful runtime class with:
- Network I/O through `@durable-streams/client`
- Connection lifecycle (`#connect`, `#initPromise`)
- Singleton producer registry (`producers` Map)
- Graceful shutdown (`flush`, `close`)
- AbortSignal propagation
- Error handling with `console.warn` (AP-13 finding)

This is not a pure contract/factory surface. The canonical `plan_streams.md` labeled it A1, but that was pre-rewrite when the producer lived elsewhere. Post-`netscript-start#96`, the producer is in-core and the runtime behavior is real.

### `@netscript/plugin-streams` → **A5 — Plugin Package**

Justification: First-party `plugins/*` package. Contributes manifest, service, CLI, Aspire, E2E gates, and scaffolding to the NetScript host. Consumes `@netscript/plugin` and `@netscript/plugin-streams-core`.

### `@netscript/watchers` → **A3 — Runtime/Behavior**

Justification: `FileWatcher` owns a long-running async watch loop with strategy selection, filter pipeline composition, AbortSignal propagation, and `stop()` lifecycle. The doctrine verdict (file 10) already assigns A3.

## Current Doctrine Verdict

From `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`:

| Unit | Verdict | Headline action |
|------|---------|-----------------|
| `@netscript/plugin-streams-core` | (not individually listed; predecessor `@netscript/streams` = Keep) | Confirm archetype A3; doc-lint to zero |
| `@netscript/plugin-streams` | Keep | Doctrine-aligned shape already |
| `@netscript/watchers` | Keep | Confirm `AbortSignal` propagation; add `stop()` handle — **already done** |

## Axioms in Play

| Axiom | Why it matters |
|-------|----------------|
| A1 | Public types first — doc-lint errors are type-visibility errors |
| A4 | Base classes are stub-only contracts — `AspireNSPluginContribution` is upstream stub |
| A5 | Composition over inheritance — `StreamsAspireContribution` extends upstream base; justified |
| A7 | Web Platform and `@std/*` first — `@std/path`, `@std/fs`, `@std/async` in watchers |
| A8 | One concern per folder — watchers lift from flat root to `src/public/` |
| A9 | Archetype drives package shape — A3 ⇒ F-13 + runtime validation required |
| A13 | Crash boundaries are explicit — `DurableStreamProducer` `#connectError`, `FileWatcher` abort |
| A14 | Tests and gates preserve doctrine — F-10 test-shape for A5 plugin |

## Goal

All 3 units publish-ready at `0.0.1-alpha.0` with:
- Full-export `deno doc --lint` = 0 errors across every entrypoint
- `deno publish --dry-run --allow-dirty` = PASS, 0 slow types (already true)
- `deno check --unstable-kv` = PASS over all entrypoints (already true)
- A5 plugin (`plugin-streams`) has a real test layer (F-10) + `verify-plugin.ts`
- `watchers` has structural lift to `src/public/` + README ≥150 doctested + docs scaffold + task block
- Archetype declared in each unit's `docs/architecture.md`
- Consumer-import validation passes (no breaking changes to downstream plugins)

## Scope

- **plugin-streams-core**: Fix 1 doc-lint error; update `docs/architecture.md` to declare A3; audit `console.warn` usage (AP-13); fix `check` task to enumerate all entrypoints
- **plugin-streams**: Fix 15 doc-lint errors; add `verify-plugin.ts`; add test layer (manifest, CLI, Aspire, E2E gates); fix `check` task if needed
- **watchers**: Structural lift (flat root → `src/public/` tree); write README ≥150 doctested; scaffold `docs/`; add `deno.json` tasks + description; fix 5 doc-lint errors; add doctest
- **Cross-cutting**: Consumer-import validation for all 3 units; final publish dry-run

## Non-Scope

- No slow-type rebuild (all units already 0 slow types)
- No runtime behavior changes to `DurableStreamProducer` or `FileWatcher` (doc/test/structure only)
- No consumer-breaking renames (alpha allows it, but consumers exist — prove zero use first)
- No `plugin-streams` service runtime changes (the Hono proxy in `services/src/main.ts` is out of scope)
- No `watchers` strategy/filter logic changes (behavior is correct; structure is the gap)
- No new contribution axes (e.g. `./testing` for watchers — deferred to post-alpha)

## Hidden Scope

- `plugin-streams` private-type-ref errors leak upstream types (`PluginManifest`, `PluginCli`, `AspireNSPluginContribution`, `StandardSchemaV1`). Fixing these may require re-exporting upstream types through the public barrel or adding `@ignore` JSDoc — not just adding JSDoc.
- `watchers` structural lift is 3 transient slices (`git mv` → retarget exports → retarget imports). Intermediate states will have failing static checks; this is planned, not drift.
- `plugin-streams` `verify-plugin.ts` must validate manifest shape against `@netscript/plugin` expectations; may surface upstream contract drift.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | `plugin-streams-core` = **A3** | `DurableStreamProducer` owns runtime behavior (network I/O, lifecycle, registry). Not a pure contract surface. |
| D2 | `watchers` stays in 4a (not split to micro sub-wave) | 23 slices < 30 cap. Lift is mechanical; no new runtime work. |
| D3 | `plugin-streams` test layer = manifest + CLI + Aspire + E2E gate tests | A5 requires F-10 test-shape. These 4 files cover all public entrypoints without needing a running service. |
| D4 | No entrypoint trimming for any unit | Consumers exist for all 3 units (see research findings 9–11). Alpha allows no-shim removal, but zero-external-use is not proven. |
| D5 | `watchers` target tree = `src/public/mod.ts` + `src/strategies/`, `src/filters/`, `src/fs.ts`, `src/types.ts` | Mirrors `plugin-streams-core` pattern. Flat files lift into `src/` with public barrel. |
| D6 | `plugin-streams-core` `console.warn` stays with debt entry | AP-13 violation, but replacing with telemetry logger would add a dependency. Record debt; fix in telemetry-integration wave. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Should `watchers` export a `./testing` subpath? | **safe to defer** | No consumer demand at alpha. `MemoryStreamProducer` pattern from streams-core can be copied later. |
| Should `plugin-streams-core` F-13 runtime validation include a live `DurableStreamTestServer` start/stop? | **safe to defer** | The producer test already exercises connection failure. Full server lifecycle is A5 plugin scope (services/main.ts). |
| Should `plugin-streams` `./cli` entrypoint be tested with a spawned process? | **safe to defer** | CLI test covers class shape + command registry. Process-spawn integration is A6 scope. |
| Should `watchers` README include network-path examples? | **must resolve now** | Yes — the mod.ts already has a network-path example; README must match. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| `plugin-streams` private-type-ref fixes may require upstream type re-exports that bloat surface | Prefer `@ignore` JSDoc on leaked private types; re-export only if consumer-facing |
| `watchers` `git mv` + retarget slices cause transient check failures | Document in `drift.md`; gate only the final slice |
| `plugin-streams` `verify-plugin.ts` may fail on upstream `@netscript/plugin` contract drift | Run against current `packages/plugin/mod.ts` (Wave 3 merged, no drift confirmed) |
| Consumer gate fails on pre-existing downstream slow types | Attribute per `validation.md` lesson: diff failing file against base; byte-identical ⇒ pre-existing debt |
| Slice count creeps toward 30 | Watchers lift is mechanical (9 slices). If doc-lint debt is larger than measured, escalate. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| AP-13 (`console.*` in published runtime) | existing in `plugin-streams-core` | Record debt; `DurableStreamProducer` uses `console.warn` for connection errors. Replacing requires `@netscript/logger` dependency — deferred. |
| AP-14 (re-exporting upstream libraries) | risk in `plugin-streams` | `stream-api.ts` uses `StandardSchemaV1` from `@standard-schema/spec`. Type is re-exported in interface; fix via `@ignore` or explicit re-export. |
| AP-16 (`utils/`, `helpers/`, `common/`) | none found | Avoid creating generic folders during watchers lift. |

## Fitness Gates

### `@netscript/plugin-streams-core` (A3)

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | All src files ≤350 LOC (`create-durable-stream.ts` = 261) |
| F-2 Helper-reinvention scan | yes | No `@std/*` reinvention found |
| F-3 Layering check | yes | `domain/` → `ports/` → `application/` layering respected |
| F-4 Inheritance audit | yes | `DurableStreamProducer` implements `StreamProducerPort` port; no deep hierarchy |
| F-5 Public surface audit | yes | 3 entrypoints; curated public barrel |
| F-6 JSR publishability | yes | `publish:dry-run` PASS; `check` enumerates all entrypoints |
| F-7 Doc-score gate | yes | Full-export doc-lint = 0 |
| F-8 Workspace lib check | yes | No workspace lib leakage |
| F-9 Permission decl check | yes | README §11 documents permissions |
| F-10 Test-shape audit | yes | 2 test files exist; runtime paths exercised |
| F-11 Forbidden-folder lint | yes | No `utils/`/`helpers/`/`common/` |
| F-12 Naming-convention lint | yes | Follows naming conventions |
| F-13 Saga/runtime invariants | yes | `DurableStreamProducer` start/stop/flush lifecycle; singleton registry; AbortSignal |
| F-14 Console-log lint | yes | `console.warn` recorded as debt (AP-13) |
| F-15 Re-export-upstream lint | yes | No upstream library re-export |
| F-16 Folder-cardinality lint | yes | `src/` has ≥2 siblings per role folder |
| F-17 Abstract-derived co-location | yes | `StreamProducerPort` (port) + `DurableStreamProducer` (application) co-located in layering |
| F-18 Sub-barrel lint | yes | `src/public/mod.ts` is the only sub-barrel |
| Runtime/Aspire validation | required (A3) | `DurableStreamProducer` connection + flush + close paths exercised in tests |
| Consumer import validation | required | `plugin-streams`, `plugin-sagas`, `plugin-triggers`, `plugin-workers` compile |

### `@netscript/plugin-streams` (A5)

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | All src files ≤350 LOC (largest = `services/main.ts` = 153) |
| F-3 Layering check | yes | `src/public/`, `src/cli/`, `src/aspire/`, `src/e2e/`, `src/scaffolding/` |
| F-5 Public surface audit | yes | 5 entrypoints; manifest + CLI + Aspire + E2E + scaffolding |
| F-6 JSR publishability | yes | `publish:dry-run` PASS; `check` enumerates all entrypoints |
| F-7 Doc-score gate | yes | Full-export doc-lint = 0 |
| F-8 Workspace lib check | yes | No workspace lib leakage |
| F-9 Permission decl check | yes | README §11 documents permissions |
| F-10 Test-shape audit | yes | **4 new test files** + `verify-plugin.ts` |
| F-11 Forbidden-folder lint | yes | No forbidden folders |
| F-12 Naming-convention lint | yes | Follows conventions |
| F-13 Saga/runtime invariants | subtype | `StreamsAspireContribution` lifecycle; service health check declared |
| F-14 Console-log lint | yes | No `console.*` in plugin code |
| F-15 Re-export-upstream lint | yes | No upstream re-export |
| F-16 Folder-cardinality lint | yes | `src/` subfolders ≥2 each |
| F-17 Abstract-derived co-location | yes | `StreamsCli` extends `PluginCli`; co-located in plugin layering |
| F-18 Sub-barrel lint | yes | Each subpath has one barrel |
| Runtime/Aspire validation | required (A5) | `StreamsAspireContribution` registers service + health check; `verify-plugin.ts` passes |
| Consumer import validation | required | `plugin-sagas`, `plugin-workers`, `packages/cli` compile |

### `@netscript/watchers` (A3)

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | All src files ≤350 LOC (`file-watcher.ts` = 309) |
| F-2 Helper-reinvention scan | yes | Uses `@std/path`, `@std/fs`, `@std/async` |
| F-3 Layering check | yes | `src/public/` → `src/strategies/`, `src/filters/`, `src/fs.ts`, `src/types.ts` |
| F-4 Inheritance audit | yes | `FileWatcher` is concrete; no deep hierarchy |
| F-5 Public surface audit | yes | 1 entrypoint (`mod.ts`) after lift |
| F-6 JSR publishability | yes | `publish:dry-run` PASS; tasks block present |
| F-7 Doc-score gate | yes | Full-export doc-lint = 0; README ≥150 doctested |
| F-8 Workspace lib check | yes | No workspace lib leakage |
| F-9 Permission decl check | yes | README documents `--allow-read` for path validation |
| F-10 Test-shape audit | yes | 3 existing filter tests + 1 new doctest |
| F-11 Forbidden-folder lint | yes | No forbidden folders |
| F-12 Naming-convention lint | yes | Follows conventions |
| F-13 Saga/runtime invariants | yes | `FileWatcher` start (`watch()`), stop (`stop()`), abort, running state |
| F-14 Console-log lint | yes | `console.warn` in `fs.ts` for network paths — record as debt |
| F-15 Re-export-upstream lint | yes | No upstream re-export |
| F-16 Folder-cardinality lint | yes | `src/strategies/` (3 files), `src/filters/` (3 files) |
| F-17 Abstract-derived co-location | yes | `WatchStrategyHandler` (port) + strategies (adapters) |
| F-18 Sub-barrel lint | yes | No sub-barrels (single entrypoint) |
| Runtime/Aspire validation | required (A3) | `FileWatcher` watch/stop lifecycle exercised in tests |
| Consumer import validation | required | `plugin-triggers` compiles |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `plugin-streams-core` AP-13 `console.warn` | **create** | `DurableStreamProducer` uses `console.warn` for connection/serialization errors. Replace with structured telemetry logger when `@netscript/logger` integration is available. Closing gate: telemetry-integration wave. |
| `watchers` AP-13 `console.warn` | **create** | `fs.ts` uses `console.warn` for network path init failures. Closing gate: telemetry-integration wave. |
| `plugin-streams-core` archetype A1→A3 | **update** | Update `docs/architecture.md` to declare A3. Previous canonical doc said A1. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | Static — doc-lint | `deno doc --lint <every entrypoint>` per unit | 0 errors |
| 2 | Static — check | `deno check --unstable-kv <every entrypoint>` per unit | PASS |
| 3 | Static — publish | `deno publish --dry-run --allow-dirty` per unit | PASS, 0 slow types |
| 4 | Static — fmt | `deno fmt --check` per unit | PASS |
| 5 | Static — lint | `deno lint` per unit | PASS |
| 6 | Fitness — F-1 | `wc -l` on all src files | ≤350 |
| 7 | Fitness — F-6 | `deno.json` tasks audit | `check`, `test`, `publish:dry-run` present; `check` enumerates all entrypoints |
| 8 | Fitness — F-7 | README line count + doctest | ≥150 lines; `tests/_fixtures/docs-examples_test.ts` imports README samples |
| 9 | Fitness — F-10 | Test file count | `plugin-streams` ≥4 new tests; `watchers` ≥1 doctest |
| 10 | Runtime — A3 | `DurableStreamProducer` lifecycle test | `flush()` + `close()` pass |
| 11 | Runtime — A5 | `verify-plugin.ts` | PASS against `@netscript/plugin` |
| 12 | Consumer | `deno check --unstable-kv` on downstream plugins | `plugin-sagas`, `plugin-workers`, `plugin-triggers` PASS |
| 13 | Consumer | `deno check --unstable-kv` on `packages/cli` | PASS (or pre-existing debt attributed) |

## Commit Slices

### `@netscript/plugin-streams-core` (5 slices)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | docs(core): declare A3 archetype in architecture.md | F-5 | `packages/plugin-streams-core/docs/architecture.md` |
| 2 | fix(core): fix check task to enumerate all entrypoints | F-6 | `packages/plugin-streams-core/deno.json` |
| 3 | fix(core): resolve doc-lint private-type-ref in testing entrypoint | F-7 | `packages/plugin-streams-core/src/testing/topic-fixtures.ts`, `src/testing/mod.ts` |
| 4 | docs(core): record console.warn debt (AP-13) | F-14 | `packages/plugin-streams-core/src/application/create-durable-stream.ts` (JSDoc note), debt entry |
| 5 | test(core): add AbortSignal lifecycle test for DurableStreamProducer | F-10, F-13 | `packages/plugin-streams-core/tests/application/durable-stream-producer_test.ts` |

### `@netscript/plugin-streams` (7 slices)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 6 | fix(plugin): resolve doc-lint private-type-refs and missing-jsdoc | F-7 | `plugins/streams/src/public/mod.ts`, `src/public/stream-api.ts`, `src/cli/streams-cli.ts`, `src/aspire/streams-contribution.ts` |
| 7 | feat(plugin): add verify-plugin.ts | F-10, Runtime | `plugins/streams/verify-plugin.ts` |
| 8 | test(plugin): add manifest shape test | F-10 | `plugins/streams/tests/public/manifest_test.ts` |
| 9 | test(plugin): add CLI command registry test | F-10 | `plugins/streams/tests/cli/streams-cli_test.ts` |
| 10 | test(plugin): add Aspire contribution registration test | F-10, Runtime | `plugins/streams/tests/aspire/streams-contribution_test.ts` |
| 11 | test(plugin): add E2E gate metadata test | F-10 | `plugins/streams/tests/e2e/streams-gates_test.ts` |
| 12 | fix(plugin): ensure check task enumerates all entrypoints | F-6 | `plugins/streams/deno.json` (if needed) |

### `@netscript/watchers` (9 slices)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 13 | refactor(watchers): git mv flat files into src/ tree | F-11, F-16 | `packages/watchers/src/strategies/`, `src/filters/`, `src/fs.ts`, `src/types.ts`, `src/file-watcher.ts` |
| 14 | refactor(watchers): retarget exports and add src/public/mod.ts barrel | F-5, F-18 | `packages/watchers/mod.ts`, `src/public/mod.ts` |
| 15 | refactor(watchers): retarget imports in tests and downstream plugin | F-3, Consumer | `packages/watchers/filters/*_test.ts`, `plugins/triggers/src/runtime/watchers-file-watcher-adapter.ts` |
| 16 | docs(watchers): write README ≥150 lines with doctested examples | F-7 | `packages/watchers/README.md` |
| 17 | docs(watchers): scaffold docs/ (architecture, concepts, getting-started) | F-7 | `packages/watchers/docs/architecture.md`, `docs/concepts.md`, `docs/getting-started.md` |
| 18 | fix(watchers): add deno.json tasks, description, and tighten publish include | F-6 | `packages/watchers/deno.json` |
| 19 | fix(watchers): add JSDoc to exported constructors | F-7 | `packages/watchers/src/file-watcher.ts`, `src/filters/*.ts`, `src/fs.ts` |
| 20 | test(watchers): add doctest for README examples | F-7, F-10 | `packages/watchers/tests/_fixtures/docs-examples_test.ts` |
| 21 | test(watchers): add FileWatcher lifecycle test (watch/stop/abort) | F-10, F-13 | `packages/watchers/tests/file-watcher_test.ts` |

### Cross-cutting (2 slices)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 22 | test(consumer): validate downstream plugin compilation | Consumer | `plugins/sagas`, `plugins/workers`, `plugins/triggers` `deno check` |
| 23 | verify(publish): final dry-run and doc-lint sweep across all 3 units | F-6, F-7 | Run `deno publish --dry-run` + `deno doc --lint` per unit |

**Total: 23 slices** (< 30 cap).

## Dependencies

- `@netscript/plugin` (Wave 3 merged surface) — must remain stable for `verify-plugin.ts` and A5 plugin compilation
- `@netscript/aspire` — for `StreamsAspireContribution` tests
- `@netscript/service` — for `streams` service health check types
- `@std/assert`, `@std/async`, `@std/fs`, `@std/path` — already in `watchers` imports

## Drift Watch

- If `plugin-streams` doc-lint fixes require adding new re-exports that bloat the public surface, log in `drift.md`.
- If `watchers` `git mv` slice reveals import cycles during retarget, log in `drift.md`.
- If `verify-plugin.ts` fails due to upstream `@netscript/plugin` drift, log in `drift.md` and escalate.
- If consumer gate finds pre-existing slow types in `packages/cli`, attribute per `validation.md` lesson.
