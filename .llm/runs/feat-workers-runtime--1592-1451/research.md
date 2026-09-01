# Research — #1592 Slice 2 + #1451

## Executive finding

The issues can be planned together without forcing a single implementation commit. They share the
same boundary: project-authored policy and handler-emitted progress must cross the plugin runtime
adapter into core-owned contracts. They do not share code dependencies, so the implementation should
use three slices:

1. progress transport and durable-state consumption;
2. the missing `JobConfig` policy fields; and
3. config-aware registry generation, ordered after the schema slice.

#1592 Slice 1 is a hard prerequisite already present on the baseline, not part of this plan. Its six
execution-record declarations remain unchanged.

## Baseline and method

- Refreshed `origin/main` on 2026-08-31 and verified the plan commit is based directly on
  `9fbc2317291dbd33c325782bb33d86a99ee5a027`.
- Read the issue bodies and the Slice 1 run artifacts under
  `.llm/runs/feat-workers-execution-progress--1592/`.
- Used focused symbol searches across `packages/plugin-workers-core`, `plugins/workers`, and the
  installed registry generator host.
- Read the Archetype 3 and Archetype 5 doctrine, the Plan Gate protocol, the CLI/tooling skills, and
  the relevant public surfaces with `deno doc`.
- Ran surface-only JSR documentation scans; no product tests were necessary for a plan-only run.

## Doctrine verdict

`packages/plugin-workers-core` is Archetype 3. The planned core changes belong to the runtime
engine: message contracts, a handler context port, and config validation. The doctrine status is
**Refactor**: the plan reduces an existing split between declared protocol and runtime behavior and
does not move worker conventions into the connector.

`plugins/workers` is an affected Archetype 5 connector. It may load project config at its CLI edge,
adapt a runner's outbound messages, and wire the execution-state port. It must not own the canonical
message vocabulary, config schema, or durable state machine.

Relevant doctrine constraints:

- one canonical owner for each public concept and no parallel declaration of execution records;
- contract first, then runtime adapter, then integration proof;
- core owns runtime semantics; connectors own transport and composition;
- generated output is derived from an authored source, not a second source of truth;
- public inputs are validated at the boundary and internal ports are narrow.

## #1592 Slice 2 — verified runtime gap

### Protocol exists but has no consumer

`packages/plugin-workers-core/src/runtime/messages.ts:3-72` declares `ExecuteJobMessage`,
`JobProgressMessage`, and the `WorkerOutboundMessage` union. A focused search for those names,
`postMessage`, `onmessage`, and message-type switches found only declarations and exports. It found
no producer/consumer in either the core dispatcher/runner or plugin runner.

The concrete path confirms the absence:

| Evidence                                                                                                                           | Consequence                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `runtime/job-dispatcher.ts:69-76` resolves a handler and directly calls it with a caller-built context                             | The dispatcher does not observe outbound messages.                                            |
| `runtime/in-process-job-runner.ts:24-34` delegates directly to the dispatcher                                                      | The in-process runner does not observe outbound messages.                                     |
| `plugins/workers/worker/job-runner-pool.ts:46-64` invents a new UUID and invokes a global-style callback from `ctx.reportProgress` | Reported progress is detached from the durable execution id.                                  |
| `plugins/workers/worker/job-dispatcher.ts:74-88` creates the canonical execution record before invoking the runner                 | This outer dispatcher is the only place that can supply the correct execution id.             |
| `plugins/workers/worker/job-dispatcher.ts:141-170` starts and completes the durable execution around `executeWorkerJob`            | The progress consumer must join this same ordered state lifecycle.                            |
| `plugins/workers/worker/worker-options.ts:72-83` exposes only `create`, `start`, and `complete`                                    | The plugin's narrow execution-state port lacks the already-shipped core `progress` operation. |
| `plugins/workers/worker/worker.ts:163-165` installs a logging-only progress callback and discards the execution id                 | The currently visible behavior cannot persist progress.                                       |

### No worker-thread implementation exists

The focused search found no construction of the Web Platform `Worker`, no `postMessage`, no
`MessagePort`, and no message event handler in the workers runtime. `WorkerPoolOptions` accepts
`poolSize` and `workerUrl` at `job-runner-pool.ts:9-14`, but the constructor always creates exactly
one `InProcessJobRunner` at lines 30-35 and never reads either option. A start log describes a Web
Worker pool, but it is not backed by one.

This evidence rules out pretending that there are two current transports. Slice 2 can fully support
the shipping in-process runtime and establish a transport-neutral host consumer. Building actual
thread lifecycle, isolation, cancellation, pool sizing, and module bootstrapping is a separate
capability and is not required to persist progress from the runtime that exists today.

### Existing Slice 1 path is sufficient

The baseline already contains `KvExecutionState.progress()`. It goes through the same transition and
save path as other state mutations, and the installed mutation hook publishes the full execution
entity. Progress fields are already carried through the six existing declarations repaired after
Slice 1. The planned adapter needs only a narrow `progress(executionId, percent, message?)` port; it
must not add an event record, progress table, or execution schema.

The six constrained declaration sites are:

1. domain job definition;
2. execution state;
3. durable-stream schema;
4. durable-stream producer;
5. runtime types; and
6. registry types.

### Existing public callback is already async-capable

The domain/public job contexts accept `void | Promise<void>` callbacks
(`src/domain/job-context.ts:11`, `src/public/root.ts:137`), while the runtime duplicate at
`src/runtime/runtime-types.ts:22-31` narrows the return to `void`. Aligning the runtime context to
the canonical async-capable contract is required if a handler is to await durable progress and if
the runner is to drain unawaited reports before a terminal result.

## Progress semantics evidence

- Each Slice 1 mutation invokes the execution stream hook after state persistence. Adding
  producer-side throttling would contradict the issue's requirement that each accepted transition be
  published.
- The stream is an entity-upsert log keyed by execution id. Documentation in
  `docs/site/durable-workflows/streams.md` describes ordered data arrays, opaque resume offsets, and
  latest-value materialization per key.
- Therefore durable replay is snapshot/upsert replay, not a new progress-history API. Intermediate
  updates can be observed while replaying the log, but the supported materialized result is the
  newest full execution record.
- Multiple progress writes against one execution must be serialized. Without serialization, two
  read/merge/save transitions could race and overwrite a newer percentage with an older snapshot.

## #1451 — verified configuration gap

### Schema lags the generated definition

`packages/plugin-workers-core/src/config/job-config.ts:39-74` includes description, timeout,
maxRetries, permissions, tags, metadata, retention, and enabled. It omits four fields already
recognized by runtime job definitions and emitted by the generator:

| Missing `JobConfig` field | Canonical generated/runtime default or constraint |
| ------------------------- | ------------------------------------------------- |
| `priority`                | integer `0..100`, default `50`                    |
| `retryDelay`              | non-negative integer milliseconds, default `1000` |
| `maxConcurrency`          | non-negative integer, default `1`                 |
| `persist`                 | boolean, default `true`                           |

`runtime/runtime-types.ts:52-82` already includes all four on `JobDefinition`. The generated literal
at `plugins/workers/src/cli/runtime-registry-generator.ts:326-342` also emits all four. The config
schema, rather than the runtime definition, is the lagging contract.

### Generator has no project policy input

`GenerateRuntimeRegistriesOptions` at `runtime-registry-generator.ts:5-9` contains only
`manifestPath`, `profile`, and `projectRoot`. `appendJobDefinitions` at lines 284-350 receives only
the discovered files/plugin entries and emits generic definitions with hardcoded policy. Filesystem
discovery decides what can be statically imported, but it cannot provide project-authored metadata.

The installed generator host already launches the plugin generator as a child process with the
project's `deno.json`, working directory, project root, and read/write permissions. The workers
entry script at `generate-runtime-registries.ts:1-17` is therefore the narrow edge that can call
`loadConfig({ cwd: projectRoot })`; adding workers policy parsing to the generic CLI host would make
the host depend on one plugin's schema.

`@netscript/config` validates the root and preserves plugin-owned sections through
`NetScriptConfigSchema.passthrough()` (`netscript-config-schema.ts:122-159`). The workers connector
must then validate `config.workers` with `WorkersConfigSchema`, whose canonical ownership remains in
`plugin-workers-core`.

### Groups and legacy flat entries both exist

`WorkersConfigData` exposes both legacy `jobs[]` and topic-scoped `groups[].jobs[]`.
`WorkersConfigSchema` normalizes each grouped job's topic to the group topic. There is currently no
flattening rule for duplicates between the two collections, so a generator that merely concatenates
them would permit ambiguous policy.

The issue names `workers.groups[].jobs[]` as the authored source already used by runtime overrides;
therefore a grouped entry wholly supersedes a flat entry with the same canonical path and id. A
partial identity collision (same id at a different path or same path with a different id) is unsafe
and must fail generation.

### Entrypoint is the only honest binding key

The generator discovers physical modules and currently derives local ids from filename basenames;
plugin job ids come from imported handler exports. Config provides both `id` and `entrypoint`.

- Matching only by id can attach policy to the wrong file when a job is renamed or two paths reuse a
  basename.
- Matching only by path can emit a registry key inconsistent with the handler identity.
- A normalized project-relative entrypoint selects the discovered file. For a matched local job,
  config id becomes the registry/definition identity; for a plugin job with an intrinsic exported
  handler id, config id verifies that identity.
- Missing configured files and ambiguous id/path pairs indicate inert or misapplied policy and must
  be generation errors, not silent defaults.

Filesystem discovery remains the import/security authority. Project config becomes the policy
authority for a matched discovered job. Structural fields (`entrypoint`, source kind, plugin id, and
plugin handler id) are derived or verified; local job id and operational fields come from validated
config.

## Existing alternative compiler

`plugins/workers/src/cli/registry-compiler.ts`, used by the local runtime backend, has its own
generic defaults. It is not the installed `scaffold.runtime.json` generator named by #1451 and is
not used by the generated registries consumed by `startCombinedProcess` and workers API startup.
This plan does not silently expand into a second generator rewrite. The evaluator should decide
whether a follow-up issue is needed for parity; the implementation must document this boundary and
avoid claiming that the legacy local backend consumes project policy.

## Public-surface and JSR scan

| Command / surface                                                                         | Result                                                                       | Planning consequence                                                    |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `deno doc --filter JobConfig packages/plugin-workers-core/src/config/mod.ts`              | Success; confirms the four fields are absent                                 | Schema slice required                                                   |
| `deno doc --filter WorkerOutboundMessage packages/plugin-workers-core/src/runtime/mod.ts` | Success; union is publicly exported                                          | Reuse it; no parallel protocol                                          |
| `deno doc --filter RegisterJobInput packages/plugin-workers-core/src/domain/mod.ts`       | Success                                                                      | Generated policy must conform to the existing definition schema         |
| `deno task doc:lint --root packages/plugin-workers-core --pretty`                         | 9 carried-in private-type diagnostics; config and runtime subpaths are clean | Touched subpaths must add zero diagnostics; do not expand existing debt |
| `deno task doc:lint --root plugins/workers --pretty`                                      | 20 carried-in private-type diagnostics, already tracked under #1655          | Touched CLI/runtime surfaces must add zero diagnostics                  |

No new doctrine debt is planned. The existing connector/private-type debt remains explicit and must
not be deepened.

## Research conclusion

The cluster is coherent at planning level and should not be split into unrelated plans. The locked
architecture is shared, while the slices remain independently reviewable where dependencies permit.
The only hard ordering is schema before config-aware generation. Progress transport can land on
either side of those two slices.
