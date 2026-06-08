# Worklog — feat-package-quality-wave4-runtimes--4a-streams-watchers

Sub-branch: `feat/package-quality-wave4-runtimes-4a`
Base: umbrella `feat/package-quality-wave4-runtimes` @ `ee9f26b` (carries merged Wave 3 `@netscript/plugin`)

## Phase log

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
| 2026-06-08 | Bootstrap | supervisor | Sub-branch + worktree `.worktrees/wave4-runtimes-4a` off the track-synced umbrella. Seed (`context-pack.md`) + this log. Draft PR → umbrella. |
| 2026-06-08 | Research | generator | MEASURE-FIRST complete. Full-export doc-lint: streams-core 1, plugin-streams 15, watchers 5. Dry-run PASS 0 slow types. Check PASS. Consumer scan confirms non-zero use for all 3 units. |
| 2026-06-08 | Plan & Design | generator | Archetype locked: streams-core **A3** (runtime behavior), plugin-streams **A5**, watchers **A3**. 23 slices < 30 cap. Plan.md + research.md written. |
| 2026-06-08 | PLAN-EVAL | supervisor (inline, user-directed) | **PASS WITH ADJUSTMENTS** (see `plan.md` §PLAN-EVAL Verdict). One adjustment locked: private-type-ref fix split by type origin (first-party `@netscript/plugin` → type re-export; third-party `StandardSchemaV1` → package-owned structural type, Wave 3 LD-8). 3 items carried to IMPL-EVAL. Cleared to implement. |
| | Implement | generator | (pending) — proceed all 23 slices without interruption; structured PR summary after each slice. |
| | Gate | generator | (pending) |
| | IMPL-EVAL | evaluator | (pending) Separate session. |
| | Close | supervisor | (pending) 4a → umbrella via Draft PR after IMPL-EVAL PASS. |

---

## Design

### Public Surface

#### `@netscript/plugin-streams-core` (A3)
- Root `./mod.ts` — `defineStreamSchema`, `createDurableStream`, `DurableStreamProducer`, URL helpers, diagnostics types
- `./telemetry` — `streamsInstrumentation`, span names, attribute keys
- `./testing` — `MemoryStreamProducer`, `createStreamTopicFixture`

#### `@netscript/plugin-streams` (A5)
- Root `./mod.ts` — `streamsPlugin`, `StreamsPluginManifest`, stream helper definitions
- `./cli` — `StreamsCli` composition root
- `./scaffolding` — `streamsScaffolder`
- `./e2e` — `getStreamsE2eGates`, probe metadata
- `./aspire` — `StreamsAspireContribution`

#### `@netscript/watchers` (A3)
- Root `./mod.ts` — `createWatcher`, `FileWatcher`, types, strategies, filters, fs utilities

### Domain Vocabulary

- `StreamStateDefinition` — schema shape for durable stream collections
- `StateSchema<TDef>` — typed schema produced by `defineStreamSchema`
- `DurableStreamProducer` — runtime producer with connection lifecycle
- `StreamProducerPort` — port interface for producer implementations
- `FileWatcher` — runtime file-watching pipeline
- `WatchStrategyHandler` — port for watch strategies
- `WatchFilter` — port for event filters
- `WatcherOptions` — configuration for `FileWatcher`

### Ports

- `StreamProducerPort` — consumed by `DurableStreamProducer` (application) and `MemoryStreamProducer` (testing adapter)
- `WatchStrategyHandler` — consumed by `FileWatcher` (application); implemented by `PollingStrategy`, `HybridStrategy`, `NativeStrategy` (adapters)
- `WatchFilter` — consumed by `FileWatcher`; implemented by `GlobFilter`, `StabilityFilter`, `DedupFilter`

### Constants

- `STREAMS_SERVICE_PERMISSIONS` — `['--allow-net', '--allow-env', '--allow-read', '--allow-write', '--allow-sys', '--allow-ffi']`
- `KnownEventKind` — `'create' | 'modify' | 'remove'`
- `KnownWatchStrategy` — `'native' | 'polling' | 'hybrid'`

### Commit Slices

See `plan.md` §"Commit Slices" for the full 23-slice list. Summary:
- S1–S5: `plugin-streams-core` (archetype declaration, check task, doc-lint, debt, lifecycle test)
- S6–S12: `plugin-streams` (doc-lint, verify-plugin, 4 test files, check task)
- S13–S21: `watchers` (git mv, retarget exports, retarget imports, README, docs scaffold, tasks, JSDoc, doctest, lifecycle test)
- S22–S23: Cross-cutting (consumer validation, final publish/doc-lint sweep)

### Deferred Scope

- `watchers` `./testing` subpath — no consumer demand at alpha
- `plugin-streams-core` live `DurableStreamTestServer` start/stop validation — A5 plugin scope
- `plugin-streams` CLI process-spawn integration test — A6 scope
- `plugin-streams` service runtime changes (Hono proxy) — out of scope for package-quality wave

### Contributor Path

**Adding a new stream schema collection:**
1. Add type definition in `packages/plugin-streams-core/src/domain/stream-schema.ts`
2. Export through `src/public/mod.ts` if consumer-facing
3. Add unit test in `packages/plugin-streams-core/tests/domain/`
4. Run `deno check --unstable-kv mod.ts` + `deno test`

**Adding a new watcher filter:**
1. Implement `WatchFilter` in `packages/watchers/src/filters/<name>.ts`
2. Export through `src/public/mod.ts`
3. Add unit test in `packages/watchers/tests/filters/<name>_test.ts`
4. Add example to README
5. Run `deno check --unstable-kv mod.ts` + `deno test`

**Adding a new plugin contribution axis:**
1. Define contribution interface in `plugins/streams/src/public/mod.ts`
2. Wire into manifest builder in `src/public/mod.ts`
3. Add test in `plugins/streams/tests/public/`
4. Update `verify-plugin.ts` if manifest shape changed
5. Run `deno check --unstable-kv` over all entrypoints

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| 2026-06-08 | Research | MEASURE-FIRST | Doc-lint per entrypoint measured. Dry-run confirmed PASS. Check confirmed PASS. Consumer scan completed. |
| 2026-06-08 | S1 | Implement + gate | Updated `packages/plugin-streams-core/docs/architecture.md` to declare A3 runtime/behavior. Gate: `deno fmt --check packages/plugin-streams-core/docs/architecture.md` PASS, 1 file checked. Implementation commit `935415e`. |
| 2026-06-08 | S2 | Implement + gate | Updated `packages/plugin-streams-core/deno.json` `check` task to enumerate `.`, `./telemetry`, and `./testing`. Gate: `rtk proxy deno task check` from `packages/plugin-streams-core` PASS, command ran `deno check --unstable-kv mod.ts src/telemetry/mod.ts src/testing/mod.ts`. Implementation commit `0af7e86`. |
| 2026-06-08 | S3 | Implement + gate | Exported `StreamTopicFixtureSchema` from `packages/plugin-streams-core/src/testing/mod.ts` to resolve the testing private-type-ref. Gates: `deno doc --lint mod.ts src/telemetry/mod.ts src/testing/mod.ts` PASS, 3 files checked; `rtk proxy deno task check` PASS, 3 entrypoints checked. Implementation commit `905480e`. |
| 2026-06-08 | S4 | Implement + gate | Added `DurableStreamProducer` JSDoc note for alpha `console.warn` reporting and recorded AP-13 debt in `.llm/harness/debt/arch-debt.md`. Gates: `Select-String` found 7 textual `console.warn` matches (6 runtime calls + 1 JSDoc note) and the debt entry; `deno doc --lint ...` PASS, 3 files checked; `rtk proxy deno task check` PASS. Implementation commit `bb6450b`. |
| 2026-06-08 | S5 | Implement + gate | Added an aborted-connection close lifecycle test for `DurableStreamProducer`. Gates: `deno test --allow-env --allow-net tests/application/durable-stream-producer_test.ts` PASS, 2 tests passed / 0 failed; `rtk proxy deno task check` PASS. Implementation commit `a38c6f9`. |
| 2026-06-08 | S6 | Implement + gate | Resolved `plugin-streams` private-type-refs and missing JSDoc: first-party host/CLI/Aspire types are re-exported through plugin barrels; third-party `StandardSchemaV1` was replaced by package-owned `StreamPayloadSchema`. Gates: `deno doc --lint mod.ts src/cli/composition/main.ts src/scaffolding/mod.ts src/e2e/mod.ts src/aspire/mod.ts` PASS, 5 files checked / 0 errors; `rtk proxy deno task check` PASS; `Select-String` found no `@standard-schema` or `StandardSchemaV1` reference in `stream-api.ts`. Implementation commit `c5e7ece`. |
| 2026-06-08 | S7 | Implement + gate | Added `plugins/streams/verify-plugin.ts` manifest verifier. Gates: `deno run verify-plugin.ts` PASS with `ok: true`, 4 contribution groups, 0 findings; `deno check --unstable-kv verify-plugin.ts` PASS; `rtk proxy deno task check` PASS. Implementation commit `e7ad68f`. |
| 2026-06-08 | S8 | Implement + gate | Added `plugins/streams/tests/public/manifest_test.ts` covering manifest contribution axes and verifier success. Gates: `deno test tests/public/manifest_test.ts` PASS, 1 test passed / 0 failed; `rtk proxy deno task check` PASS. Implementation commit `cca1d64`. |
| 2026-06-08 | S9 | Implement + gate | Added `plugins/streams/tests/cli/streams-cli_test.ts` covering command registry and default CLI instance. Gates: `deno test tests/cli/streams-cli_test.ts` PASS, 2 tests passed / 0 failed; `rtk proxy deno task check` PASS. Implementation commit `e3c76b1`. |
| 2026-06-08 | S10 | Implement + gate | Added `plugins/streams/tests/aspire/streams-contribution_test.ts` covering streams service registration, env declaration, and health check declaration. Gates: `deno test tests/aspire/streams-contribution_test.ts` PASS, 1 test passed / 0 failed; `rtk proxy deno task check` PASS. Implementation commit `7112ce5`. |
| 2026-06-08 | S11 | Implement + gate | Added `plugins/streams/tests/e2e/streams-gates_test.ts` covering E2E gate IDs and probe commands. Gates: `deno test tests/e2e/streams-gates_test.ts` PASS, 1 test passed / 0 failed; `rtk proxy deno task check` PASS. Implementation commit `33ac977`. |
| 2026-06-08 | S12 | Implement + gate | Updated `plugins/streams/deno.json` check task to include `verify-plugin.ts` with the exported entrypoints, probes, and service entrypoint. Gates: `rtk proxy deno task check` PASS, command checked 11 targets including `verify-plugin.ts`; `deno doc --lint ...` PASS, 5 files checked. Implementation commit `494f9ea`. |
| 2026-06-08 | S13 | Implement + gate | Moved watchers source files into `src/`, `src/filters/`, and `src/strategies/` with Git renames; tests intentionally remain for S15 retarget. Gate: tree/cardinality evidence PASS (`src`: 3 files, `src/filters`: 3, `src/strategies`: 3). Static checks intentionally deferred until S15. Implementation commit `57fdbd8`. |
| 2026-06-08 | S14 | Implement + gate | Added `packages/watchers/src/public/mod.ts` and retargeted root `mod.ts` to the curated public barrel. Gates: `deno check --unstable-kv mod.ts` PASS; sub-barrel evidence found only `src/public/mod.ts` under `src`. Implementation commit `9a09b10`. |
| 2026-06-08 | S15 | Implement + gate | Retargeted watcher filter tests to `src/filters` and `src/types`; `plugin-triggers` already used the stable `@netscript/watchers` barrel so no downstream file edit was needed. Gates: `deno check --unstable-kv mod.ts` PASS; `deno test --allow-read --allow-write --allow-env filters` PASS, 13 tests passed / 0 failed; `rtk proxy deno task check` in `plugins/triggers` PASS. Implementation commit `4666b44`. |
| 2026-06-08 | S16 | Implement + gate | Added `packages/watchers/README.md` with permissions, runtime model, network path, stop semantics, and doctestable examples. Gates: `deno fmt README.md` PASS, 1 file checked; README line count = 224; `deno check --unstable-kv mod.ts` PASS. Implementation commit `5eab77a`. |
| 2026-06-08 | S17 | Implement + gate | Added `packages/watchers/docs/{architecture,concepts,getting-started}.md`. Gates: `deno fmt docs/architecture.md docs/concepts.md docs/getting-started.md` PASS, 3 files checked; docs listing found 3 files; `deno check --unstable-kv mod.ts` PASS. Implementation commit `f7612c4`. |
| 2026-06-08 | S18 | Implement + gate | Added watchers description, local tasks, and tightened publish include list. Gates: `rtk proxy deno task check` PASS; `rtk proxy deno task test` PASS, 13 tests passed / 0 failed; `rtk proxy deno task publish:dry-run` PASS, 16 published files, 0 slow-type errors. Implementation commit `fe3c30a`. |
| 2026-06-08 | S19 | Implement + gate | Added JSDoc to exported constructors in `FileWatcher`, filters, and `AccessFailureTracker`. Gates: `deno doc --lint mod.ts` PASS, 1 file checked / 0 errors; `rtk proxy deno task check` PASS. Implementation commit `a4df3eb`. |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| streams-core = A3 | `DurableStreamProducer` owns runtime behavior | research finding #12 + doctrine A9 |
| watchers stays in 4a | 23 slices < 30 cap | plan slice count |
| No entrypoint trimming | Consumers exist for all units | research findings 9–11 |
| console.warn stays with debt | Replacing requires `@netscript/logger` dependency | plan D6 |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|-------------------|
| streams-core archetype A1→A3 | architectural | yes |
| streams-core console.warn (AP-13) | minor | yes |
| watchers console.warn (AP-13) | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|------------------|--------|-------|
| doc-lint streams-core | `deno doc --lint mod.ts src/telemetry/mod.ts src/testing/mod.ts` | FAIL (1) | private-type-ref |
| doc-lint plugin-streams | `deno doc --lint mod.ts src/cli/composition/main.ts src/scaffolding/mod.ts src/e2e/mod.ts src/aspire/mod.ts` | FAIL (15) | 11 private-type-ref + 4 missing-jsdoc |
| doc-lint watchers | `deno doc --lint mod.ts` | FAIL (5) | missing-jsdoc on constructors |
| publish dry-run streams-core | `deno publish --dry-run --allow-dirty` | PASS | 0 slow types |
| publish dry-run plugin-streams | `deno publish --dry-run --allow-dirty` | PASS | 0 slow types |
| publish dry-run watchers | `deno publish --dry-run --allow-dirty` | PASS | 0 slow types |
| check streams-core | `deno check --unstable-kv mod.ts src/telemetry/mod.ts src/testing/mod.ts` | PASS | — |
| check plugin-streams | `deno check --unstable-kv mod.ts src/cli/composition/main.ts src/scaffolding/mod.ts src/e2e/mod.ts src/aspire/mod.ts` | PASS | — |
| check watchers | `deno check --unstable-kv mod.ts` | PASS | — |

### Fitness Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| F-1 | PENDING_SCRIPT | `wc -l` shows all files ≤350 | manual evidence |
| F-5 | PENDING_SCRIPT | 3/5/1 entrypoints respectively | manual evidence |
| F-6 | PENDING_SCRIPT | watchers has no tasks | finding #18 |
| F-7 | FAIL | doc-lint errors above | to be resolved in implementation |
| F-10 | PENDING_SCRIPT | plugin-streams has 0 tests | finding #6 |
| F-13 | PENDING_SCRIPT | runtime paths not yet fully exercised | to be resolved in implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| A3 runtime (streams-core) | NOT_RUN | — | planned in slice 5 |
| A5 runtime (plugin-streams) | NOT_RUN | — | planned in slice 7 |
| A3 runtime (watchers) | NOT_RUN | — | planned in slice 21 |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
|----------|--------|----------|-------|
| plugin-sagas | PASS (compile) | `deno check` passes at base | imports streams-core + plugin-streams |
| plugin-workers | PASS (compile) | `deno check` passes at base | imports streams-core + plugin-streams |
| plugin-triggers | PASS (compile) | `deno check` passes at base | imports streams-core + watchers |
| packages/cli | PASS (compile) | `deno check` passes at base | test references plugin-streams |

## Handoff Notes

- PLAN-EVAL must verify the A3 archetype decision for streams-core against the canonical `plan_streams.md` A1 claim.
- PLAN-EVAL must confirm 23 slices < 30 cap and that watchers lift does not need a micro sub-wave split.
- PLAN-EVAL must verify consumer-import findings (non-zero use for all units) against any proposal to trim entrypoints.
