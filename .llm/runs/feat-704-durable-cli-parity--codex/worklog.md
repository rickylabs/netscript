# Worklog: #704 durable CLI parity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-704-durable-cli-parity--codex` |
| Branch | `feat/704-durable-cli-parity` |
| Baseline | `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` |
| Agent lane | WSL Codex implementation lane under orchestrator `09e5ae68` |
| Archetype | 6 — CLI / Tooling (folding the existing first-party plugin shape) |
| Scope overlays | Docs |

## Plan

PLAN-EVAL is owner-waived for this slice (carried drift D1 in the owner brief). The issue acceptance
boxes remain the contract; this lane will not self-certify IMPL-EVAL or execute the orchestrator-owned
`scaffold.runtime` gate.

1. Extend the shared project-file edge with deletion, then implement workers runtime HTTP commands,
   local task execution, metadata-aware list/show/update/remove, and automatic registry regeneration.
2. Implement sagas publish/list/runtime inspect plus syntax-aware update/remove and automatic registry
   regeneration.
3. Replace the documented curl/manual-executor flows with the CLI verbs and add scaffold-runtime gate
   code that exercises the new durable command seams. Run scoped checks, lint, format, and targeted
   tests; commit and push each proven slice.

### Locked decisions

- Runtime-backed commands call the existing OpenAPI projections at `/api/v1/workers` and
  `/api/v1/sagas`; no duplicate runtime or queue abstraction is introduced.
- `run` remains as a compatibility alias but is changed to the durable trigger path; `trigger` is the
  explicit new verb required by #704.
- `run-task` uses `createDefaultTaskExecutor` and forwards argv/env/timeout plus stdout/stderr
  callbacks. It does not enqueue jobs or dynamic-import a job handler.
- Local update/remove operations regenerate the relevant static registry before returning success.
- Saga config edits use a syntax-aware fluent-call editor that ignores strings/comments and edits only
  calls in the builder chain; no regex-only source replacement.
- Existing exports remain stable. New public CLI symbols receive explicit types/JSDoc and are covered by
  the plugin export-map doc-lint/dry-run gates where time permits.

### Open-decision sweep

- Definition versioning is unsafe to fold into this slice and is explicitly deferred to item 7.
- The orchestrator owns runtime E2E execution and separate-session IMPL-EVAL; safe to defer from this
  implementation lane because the brief explicitly reserves those gates.
- No other decision that would force implementation rework is left open.

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Runtime JSON/error shapes differ from happy-path examples | Central JSON clients preserve HTTP status/body in structured errors; mock route tests assert paths and bodies. |
| Source rewrites touch comments or payload strings | Syntax-aware call scanning plus adversarial tests containing lookalike method text. |
| Task runtime and entrypoint drift | Infer legacy metadata from file extensions, persist generated metadata, and test Python/shell definitions through an injected executor. |
| Shared `ProjectFiles` change breaks fakes | Add the method to every structural fake and run the shared package plus both plugin test suites. |
| Existing doctrine debt is deepened | Keep new files focused, avoid new base classes/registries, and record any unavoidable divergence honestly. |

## Design

### Public Surface

- Workers commands: `executions`, `trigger`, durable `run`, `run-task`, `show-job`, `show-task`,
  `update-job`, `update-task`, `remove-job`, `remove-task`; list commands add `--json` and honor filters.
- Sagas commands: `publish`, `list`, runtime-aware `inspect`, `update-saga`, `remove-saga`; list adds
  `--json` and honors instance status/saga filters.
- `ProjectFiles.removeFile(path)` is the consumed filesystem capability required by remove verbs.

### Domain Vocabulary

- `RuntimeApiClient` — injected JSON HTTP seam for each plugin CLI.
- `WorkerResourceMetadata` — local job/task metadata used for list/show/update/run-task.
- `TaskExecutionInput` — parsed argv/env/timeout passed to the existing task executor.
- `SagaConfigUpdate` — durability/topic/tags/description edits applied to builder calls.

### Ports

- `ProjectFiles` — read/write/list/remove and path resolution.
- Existing `TaskExecutor` — multi-runtime process dispatch and streaming callbacks.
- Plugin-local runtime API clients — HTTP test seam; the fetch implementation is the edge adapter.

### Constants

- `WORKERS_CLI_COMMANDS` / `SAGAS_CLI_COMMANDS` remain the canonical finite command vocabularies.
- Default runtime URLs are `http://127.0.0.1:8091/api/v1/workers` and
  `http://127.0.0.1:8092/api/v1/sagas`.
- Output format remains structured `PluginCliResult.data`; `--json` is explicit command metadata.

### Archetype 6 checkpoint

- No new spine or layer-2 abstract is introduced; therefore there are no new abstract/concrete pairs.
- Existing plugin CLIs do not use the greenfield five-spine `@netscript/cli` layout; this slice works
  within their existing `WorkersCommand`/plain-command wrappers and does not expand that known
  migration concern.
- Vertical catalogs are the existing workers and sagas CLI folders. New HTTP effects live in dedicated
  adapter files; composition remains in each CLI composition/root module.
- No new extension registry is introduced. Existing job/saga static registry generators remain the
  single regeneration points.
- Contributor path: add command metadata in `command-types.ts`/`commands.ts`, dispatch in the local
  backend, add a focused helper only for a real IO/source-edit seam, then add semantic CLI tests.

### Commit Slices

| # | Slice | Proving gates | Expected roots |
| --- | --- | --- | --- |
| 1 | Shared delete seam + workers durable/local parity | package/plugin scoped check/lint/fmt; workers and plugin targeted tests | `packages/plugin`, `plugins/workers`, worklog |
| 2 | Sagas runtime/file parity | sagas scoped check/lint/fmt and targeted tests | `plugins/sagas`, worklog |
| 3 | CLI-first docs + orchestrator-owned E2E coverage code | docs source alignment; CLI E2E targeted tests/check; final scoped gates | `docs/site`, `packages/cli/e2e`, worklog |

### Deferred Scope

- Item 7: saga definition versioning (`.version()`, versioned registry key, migration scaffold) is a
  separate framework slice by explicit owner direction.
- Running `deno task e2e:cli` / `scaffold.runtime`, opening a PR, and separate-session IMPL-EVAL are
  orchestrator-owned and will be reported as not run by this lane.

## JSR Surface Scan

The planned change adds CLI classes/types beneath existing published `./cli` export maps and one method
to the existing published `ProjectFiles` interface. Risks are explicit return annotations,
symbol/module documentation, and slow types from inferred exported objects. Mitigation: annotate and
document every new export, run scoped check/lint/fmt, targeted `deno doc --lint` for touched export
maps, and publish dry-run only if it can run without lock churn. No dependency changes are planned.

## Progress and Evidence

Gate evidence, commit hashes, push results, reconciliation notes, and any drift are appended below as
the slices land. No acceptance box is considered proven until its named test/gate is recorded here.

### Slice 1 — workers durable/local parity

- Implemented the shared `ProjectFiles.removeFile()` edge and updated every structural fake.
- Added durable `executions`/`trigger` routing; the legacy `run` verb now aliases the HTTP trigger
  instead of importing and invoking a job handler in-process.
- Added `run-task` over `createDefaultTaskExecutor`, forwarding JSON argv/env/timeout and streaming
  callbacks. Generated Python/shell/PowerShell stubs now consume argv (and environment where
  applicable), not stdin.
- Added embedded resource metadata for list/show/filter/update/remove, fixed `--entrypoint`, and made
  add/update/remove regenerate the static workers registry.

| Evidence | Result |
| --- | --- |
| Targeted package/plugin tests | PASS — 20 passed, 0 failed (`packages/plugin/tests/cli`, workers CLI/resource tests) |
| Scoped check — `packages/plugin` | PASS — 151 files, 0 diagnostics, `--unstable-kv` wrapper |
| Scoped check — `plugins/workers` | PASS — 93 files, 0 diagnostics, `--unstable-kv` wrapper |
| Scoped lint — both roots | PASS — 0 findings |
| Scoped format — both roots | PASS — 0 findings |
| Touched workers CLI doc-lint | PASS — `src/cli/composition/main.ts`, 0 diagnostics |
| Full workers export-map doc-lint | BASELINE DEBT — 18 pre-existing `private-type-ref`; touched CLI entrypoint is clean |
| `deno.lock` | UNCHANGED |

Reconcile note: issue/PR state and per-slice PR comments are orchestrator-owned because this lane was
explicitly told not to open a PR. Tier-A substantive review remains pending after this implementation
commit; this lane does not self-certify it.

- Commit/push: `9b6a4859` pushed to `origin/feat/704-durable-cli-parity`.

### Slice 2 — sagas runtime/file parity

- Added contract-backed `publish` and `list` commands, including registered/instance selection and
  instance `--status`/`--saga` query filters. `inspect` now queries runtime metadata first and falls
  back to local source inspection only when the service is unavailable.
- Added `update saga`/`remove saga` normalization and standalone CLI execution. Update edits
  durability in the definition and topic/tags/description in the config through a syntax-aware
  fluent-call editor; remove deletes both generated files.
- Add/update/remove regenerate the static registry. Registry generation now excludes `.config.ts`
  modules so only real `SagaDefinition` modules are imported.

| Evidence | Result |
| --- | --- |
| Targeted sagas CLI/resource tests | PASS — 11 passed, 0 failed |
| Runtime route/body tests | PASS — publish body, instance status/saga query, runtime inspect route |
| Syntax-aware rewrite tests | PASS — strings/comments ignored; nested call arguments replaced as one span |
| Scoped check — `plugins/sagas` | PASS — 69 files, 0 diagnostics, `--unstable-kv` wrapper |
| Scoped lint | PASS — 0 findings |
| Scoped format | PASS — 0 findings |
| Touched sagas CLI doc-lint | PASS — `src/cli/mod.ts`, 0 diagnostics |
| Full sagas export-map doc-lint | BASELINE DEBT — 12 pre-existing `private-type-ref`; touched CLI entrypoint is clean |
| `deno.lock` | UNCHANGED |

Reconcile note: no PR was opened or commented per the lane brief. Tier-A slice review and
separate-session IMPL-EVAL remain orchestrator-owned.

- Commit/push: `725b8db2` pushed to `origin/feat/704-durable-cli-parity`.

### Slice 3 — acceptance coverage and CLI-first docs

- Replaced the documented raw workers trigger/executions and sagas publish/list flows with the new
  CLI verbs. The polyglot guide now uses `ns-workers run-task` instead of requiring a hand-written
  executor module.
- Added `behavior.durable-cli-parity` to the existing `scaffold.runtime` behavior phase. Its command
  gate triggers the generated `health-check` job, polls executions, publishes the generated starter
  saga's `user.registered` message, and polls instances by `correlationKey`.
- Added a real subprocess test which scaffolds a shell task, runs it with quoted argv through the
  default `MultiRuntimeTaskExecutor`, observes streamed output, and asserts the parsed `TaskResult`.
  This test exposed and fixed two edge cases: absent resource directories are now empty scans rather
  than errors, and script metadata/JSON escaping now produces executable shell stubs.
- Corrected `--correlation-key` to the contract's `correlationKey` field (not `correlationId`) and
  asserted the exact publish body in the runtime-client test.

| Evidence | Result |
| --- | --- |
| Final workers targeted tests | PASS — 13 passed, 0 failed, including a real shell subprocess |
| Shared `packages/plugin` tests | PASS — 11 passed, 0 failed |
| Final sagas CLI tests | PASS — 7 passed, 0 failed (route/body, rewrite, registry, composition) |
| CLI E2E gate builder tests | PASS — 6 passed, 0 failed |
| Targeted durable gate check | PASS — `deno check --unstable-kv` |
| Scoped checks | PASS — package/plugin 151, workers 93, sagas 69, CLI E2E 87 files; 0 diagnostics |
| Scoped lint and TypeScript format | PASS — all four touched code roots, 0 findings |
| Documentation links | PASS — 96 documents, 0 broken links or anchors |
| Full `scaffold.runtime` execution | NOT RUN — explicitly reserved for the orchestrator |
| `deno.lock` | UNCHANGED |

### Acceptance reconciliation

| Acceptance contract | Implementation-lane verdict |
| --- | --- |
| Workers durable executions/trigger | IMPLEMENTED; exact route/query/body tests pass. Live service proof is deferred to the wired orchestrator gate. |
| Multi-runtime `run-task` | PROVEN locally with a generated shell subprocess, streamed output, quoted argv, and parsed `TaskResult`; injected-executor tests also prove env/timeout forwarding. |
| Worker/saga update/remove and add regeneration | PROVEN by semantic file/registry tests. |
| Saga publish then list instance | IMPLEMENTED; exact publish/list contract tests pass. End-to-end running-service proof is deferred to the wired orchestrator gate. |
| Filters and JSON | PROVEN by command metadata and semantic route/local-filter tests for worker topic/enabled/type and saga status/saga filters. |
| CLI-first documentation | PROVEN by source review and the 96-document link gate. |
| Saga definition versioning | DEFERRED — item 7 is the explicitly separate framework follow-up. |

Reconcile note: this lane wrote the required full-runtime coverage but did not execute it, exactly as
directed. Therefore live workers/sagas service behavior is honestly recorded as unproven here until
the orchestrator runs `scaffold.runtime`. No PR was opened, and IMPL-EVAL remains a separate-session
orchestrator responsibility.

### Drift

| ID | Severity | Detail |
| --- | --- | --- |
| D1 | significant, owner-approved | PLAN-EVAL was explicitly waived in the slice brief; short plan/design recorded here before implementation. |
| D2 | minor | Full workers export-map doc-lint has 18 pre-existing private-type references. The newly touched CLI entrypoint was brought to 0; unrelated baseline findings were not expanded into this slice. |
| D3 | minor | Full sagas export-map doc-lint has 12 pre-existing private-type references. The touched CLI entrypoint is clean; unrelated runtime/contracts findings remain outside #704. |
