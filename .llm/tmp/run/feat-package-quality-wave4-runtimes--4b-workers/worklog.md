# Worklog — feat-package-quality-wave4-runtimes--4b-workers

Sub-branch: `feat/package-quality-wave4-runtimes-4b`
Base: umbrella `feat/package-quality-wave4-runtimes` @ `ee9f26b` (carries merged Wave 3)

## Design

### Public surface

**4b-core (`@netscript/plugin-workers-core`):**
- 16 entrypoints (17→16 after folding `./contracts` into `./contracts/v1`)
- Root: `defineJob`, `defineTask`, `defineWorkflow`, `cron`, `permissions`, `defineJobHandler`, `createWorkersRuntime`, `createFailureResult`, `createSuccessResult`, `startWorkers`, `inspectJob`, `inspectTask`, `inspectWorkflow`, `JobId`, `TaskId`, `CronHelpers`, `PermissionPresets`, builder types, definition types
- Subpaths: builders, contracts/v1, registry, state, executor, workflow, streams, presets, shutdown, schemas, telemetry, abstracts, testing, config, runtime

**4b-plugin (`@netscript/plugin-workers`):**
- 9 entrypoints
- Root: `workersPlugin`, `inspectWorkers`, manifest types
- Subpaths: aspire, cli, contracts, scaffolding, services, streams, streams/server, worker

### Domain vocabulary

- `JobDefinition`, `TaskDefinition`, `WorkflowDefinition` — core definition objects
- `JobHandler`, `TaskHandler` — handler function types
- `JobDispatcher`, `TaskExecutor`, `WorkflowExecutor` — runtime executors
- `KvJobRegistry`, `KvTaskRegistry`, `KvExecutionState` — stateful KV-backed stores
- `WorkersPluginManifest`, `WorkersPluginContributions` — A5 plugin manifest shapes
- `WorkersCommandDefinition`, `WorkersItemScaffolder` — plugin CLI/scaffold abstractions

### Ports

- `JobRegistryPort`, `TaskRegistryPort` — consumed by runtime, implemented by KV/memory
- `ExecutionStatePort` — consumed by executor, implemented by KV
- `TaskRuntimeAdapter` — consumed by executor, implemented by per-runtime adapters
- `StreamTopicContribution` — consumed by plugin manifest, provided by streams plugin

### Constants

- `DEFAULT_TOPIC` — default stream topic for worker messages
- `WORKERS_SERVICE_PERMISSIONS` — Deno permission flags for workers service
- Plugin version: `0.0.1-alpha.0` (fixing current `0.1.0` mismatch)

### Commit slices

**4b-core (14 slices):**
1. Declare A3 archetype in `docs/architecture.md`
2. F-6: `check` task enumerates all 16 entrypoints
3. Fold `./contracts` → `./contracts/v1`, update consumer, fix version
4. ptr-fix: builders (14) + config (22) + contracts/v1 (23)
5. ptr-fix: executor (29) + registry (11) + runtime (33)
6. ptr-fix: abstracts (12) + testing (24) + workflow (10)
7. ptr-fix: domain/public-schema Zod leaks (75)
8. ptr-fix: remaining (streams 7, state 5, telemetry 1, presets 2)
9. jsdoc: registry (45) + abstracts (45)
10. jsdoc: testing (32) + executor (29) + workflow (21)
11. jsdoc: state (18) + contracts/v1 (19) + telemetry (15) + shutdown (8)
12. F-1: concept-split `workers.contract.ts`
13. README + module docs for all entrypoints
14. Validate: deno check all + dry-run + doc-lint sweep

**4b-plugin (13 slices):**
1. F-6: add `publish:dry-run`, `check` enumerates all 9 entrypoints
2. ptr-fix: contracts/v1 (38) + cli (13)
3. ptr-fix: worker (10) + aspire (6) + scaffolding (8)
4. ptr-fix: streams (5) + streams/server (7) + services (1)
5. jsdoc: scaffolding (21) + contracts/v1 (19)
6. jsdoc: cli (11) + worker (9)
7. F-1: concept-split `scheduler.ts`
8. Test layer: `verify-plugin.ts` + manifest test
9. Test layer: CLI contribution test
10. Test layer: Aspire contribution test
11. Test layer: E2E gate test
12. README + module docs for all entrypoints
13. Validate: deno check all + dry-run + doc-lint sweep

### Deferred scope

- Zero-consumer entrypoint trim post-alpha
- Plugin manifest type cast fix (requires `@netscript/plugin` change)
- Prisma generated-DB artifacts (environment, not package debt)
- `unanalyzable-dynamic-import` resolution

### Contributor path

1. Read `docs/architecture.md` for archetype context
2. Read `mod.ts` for root API
3. Read entrypoint barrels for subpath APIs
4. Read `tests/` for usage patterns
5. Add features by extending builders, runtime, or adapters

## Phase log

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
| 2026-06-08 | Bootstrap + pre-research | supervisor | Sub-branch + worktree off the umbrella (prepared in parallel, user-approved). Seed (`context-pack.md`) + measured `pre-research.md` (doc-lint core 460 / plugin 143; both dry-run PASS). Draft PR → umbrella. |
| 2026-06-09 | **Pull-forward DONE** | supervisor | 4a merged (umbrella `2c24662`, IMPL-EVAL PASS). Supervisor base-synced 4b onto the umbrella (merge `173357c`, merge-base now `2c24662`) — settles `workers-core ./streams` (re-exports `@netscript/plugin-streams-core`, which went doc-lint 1→0 + A1→A3 in 4a). **Base is current; generator may proceed to Research/MEASURE-FIRST.** |
| 2026-06-09 | **Research + Plan & Design** | generator | MEASURE-FIRST: full-export doc-lint per entrypoint (core 460 / plugin 143), dry-run PASS both, deno check PASS both, consumer scan, #96 triage. Plan locked: A3 core, A5 plugin, 4b-core/4b-plugin split, 27 slices total. New tool `.llm/tools/run-deno-doc-lint.ts` promoted. |
| | PLAN-EVAL | evaluator | (pending) Separate session. Hard stop. Option A. |
| | Implement | generator | (pending) Sliced; one commit + paired doc-record per slice. |
| | Gate | generator | (pending) Archetype gates + F-13/Runtime+Aspire (A3/A5) + F-10 (A5) + consumer-import + F-1 + F-6. |
| | IMPL-EVAL | evaluator | (pending) Separate session. |
| | Close | supervisor | (pending) 4b → umbrella after IMPL-EVAL PASS. 4c forks off the 4b-merged umbrella. |

## Implementation slices

| Slice | Unit | Archetype | Subject | Gate(s) | Result | Commit |
|-------|------|-----------|---------|---------|--------|--------|
| 1/27 | `@netscript/plugin-workers-core` | A3 | Declare runtime archetype in `docs/architecture.md` | `deno check --unstable-kv mod.ts`; declaration grep | PASS — raw check exit 0; A3, Runtime/Aspire, and consumer-import text present | `0eec3df` |
| 2/27 | `@netscript/plugin-workers-core` | A3 | Enumerate retained entrypoints in `check` task | `deno task check`; raw `deno check --unstable-kv <16 entrypoints>` | PASS — both commands exited 0 and checked all retained root/subpath entrypoint files | `3f01a2d` |
| 3/27 | `@netscript/plugin-workers-core` + `@netscript/plugin-workers` consumer | A3/A5 | Fold `./contracts` to `./contracts/v1`; align workers plugin version | raw core check; raw plugin consumer check; raw CLI copier test check; export-map assertion | PASS — core 16-entrypoint check exit 0; plugin `contracts*`, root, public, Aspire check exit 0; CLI copier test file check exit 0; export map has 16 entries with no `./contracts` alias | `7a738d5` |
| 4/27 | `@netscript/plugin-workers-core` | A3 | ptr-fix builders, config, and contracts/v1 by type origin | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; full core 16-entrypoint check exit 0 | `92bf266` |
| 5/27 | `@netscript/plugin-workers-core` | A3 | ptr-fix executor, registry, and runtime by type origin | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; full core 16-entrypoint check exit 0 | `7b7bcaa` |
| 6/27 | `@netscript/plugin-workers-core` | A3 | ptr-fix abstracts, testing, and workflow by type origin | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalPrivateTypeRef=0` with `totalMissingJSDoc=74` deferred to locked JSDoc slices; full core 16-entrypoint check exit 0 | `969212b` |
| 7/27 | `@netscript/plugin-workers-core` | A3 | ptr-fix domain public-schema Zod leaks | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; full core 16-entrypoint check exit 0 | `ea24869` |
| 8/27 | `@netscript/plugin-workers-core` | A3 | ptr-fix remaining streams, state, telemetry, presets, shutdown | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalPrivateTypeRef=0` with `totalMissingJSDoc=47` deferred to locked JSDoc slices; full core 16-entrypoint check exit 0 | `08ca137` |
| 9/27 | `@netscript/plugin-workers-core` | A3 | JSDoc registry and abstracts | `run-deno-doc-lint.ts` targeted; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; full core 16-entrypoint check exit 0 | `5d03ac8` |
| 10/27 | `@netscript/plugin-workers-core` | A3 | JSDoc testing, executor, and workflow | `run-deno-doc-lint.ts` targeted; raw targeted check; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; targeted testing/executor/workflow check exit 0; full core 16-entrypoint check exit 0 | `941b21a` |
| 11/27 | `@netscript/plugin-workers-core` | A3 | JSDoc state, contracts/v1, telemetry, and shutdown | `run-deno-doc-lint.ts` targeted; raw targeted check; raw `deno check --unstable-kv <16 entrypoints>` | PASS — targeted doc-lint summary `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; targeted state/contracts/v1/telemetry/shutdown check exit 0; full core 16-entrypoint check exit 0 | `2c601c6` |
| 12/27 | `@netscript/plugin-workers-core` | A3 | F-1 concept-split `workers.contract.ts` | line-count gate; `run-deno-doc-lint.ts` targeted; scoped fmt check; raw targeted check; raw `deno check --unstable-kv <16 entrypoints>` | PASS — split files at `42/105/246/251` lines; targeted doc-lint 0/0/0; scoped format check clean; targeted contracts/v1 check exit 0; full core 16-entrypoint check exit 0 | `f8051e5` |
| 13/27 | `@netscript/plugin-workers-core` | A3 | README + module docs for all entrypoints | full-export `run-deno-doc-lint.ts`; touched-file fmt check; raw targeted check; raw `deno check --unstable-kv <16 entrypoints>` | PASS — full-export doc-lint across 16 entrypoints `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; touched-file format check clean; root/streams targeted check exit 0; full core 16-entrypoint check exit 0 | `55f162b` |
| 14/27 | `@netscript/plugin-workers-core` | A3 | Validate core gates and consumer-import | raw `deno publish --dry-run --allow-dirty`; full-export `run-deno-doc-lint.ts`; raw 16-entrypoint `deno check --unstable-kv`; `deno lint`; `deno fmt --check`; `deno task test`; live runtime smoke; raw consumer checks for triggers/sagas/workers/CLI | PASS — dry-run exit 0 with 0 slow-type warnings and known `unanalyzable-dynamic-import`; doc-lint `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`; full check exit 0; lint checked 102 files; fmt checked 112 files; tests 16 passed/0 failed; runtime smoke returned `{"ok":true,"runtime":"workers-runtime","job":"c14.runtime"}`; consumer-import checks exited 0 for all four consumers | `e2670ce` |

## Readiness note

- 2026-06-08: Prepared in parallel; invariant to 4a EXCEPT `workers-core ./streams` (re-exports
  `@netscript/plugin-streams-core`). Pull 4a forward + re-measure before locking.
- 2026-06-09: Plan locked. PLAN-EVAL is the next gate. No implementation before PASS.
