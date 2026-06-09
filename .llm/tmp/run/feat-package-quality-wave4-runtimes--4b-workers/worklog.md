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

## Readiness note

- 2026-06-08: Prepared in parallel; invariant to 4a EXCEPT `workers-core ./streams` (re-exports
  `@netscript/plugin-streams-core`). Pull 4a forward + re-measure before locking.
- 2026-06-09: Plan locked. PLAN-EVAL is the next gate. No implementation before PASS.
