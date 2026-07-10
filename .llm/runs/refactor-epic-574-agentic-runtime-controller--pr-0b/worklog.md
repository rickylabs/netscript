# Worklog: PR 0B desired-state agentic runtime controller

## Status

Research and Design are complete. Tier-A coordinator Plan-Gate review returned `PASS` under the
owner-authorized external-evaluator waiver. Tier-A requested three S1 contract remediations, then
substantively approved them at supervisor sign-off `ac71896` over implementation head `197bc51`.
S2 implementation received four Tier-A changes requested. The remediation and replacement evidence
were substantively approved in supervisor sign-off `6756a54`. S3 remediation was approved in
supervisor sign-off `83f2f5d`. S4 implementation and automated gates are complete on the same
daemon-managed thread; coordinator Tier-A review is pending and S5 has not started.

## Design

### Public Command Surface

The sole new entry is `deno task agentic:runtime <command>`. Its closed command vocabulary is:

```text
doctor | bootstrap | configure | launch | resume | smoke | fallback | restore |
status | repair codex-remote | rollback
```

Global presentation flags are `--json` and `--help`. Every mutating command accepts `--dry-run`.
Agent/session operations accept complete value-free identity flags plus prompt/message **file paths**;
there is no credential/token flag. The canonical JSON shape is `RuntimeResult` schema `1.0`.

Legacy public task names remain available for one compatibility cycle:

- `agentic:wsl-foundation doctor|bootstrap|rollback-plan`
- `agentic:launch-codex-slice`
- `agentic:codex-resume`
- `agentic:codex-status`
- `agentic:smoke-claude-remote`

`agentic:codex-watch` remains an independent wait primitive. GitHub/OpenHands, hook, and skill-sync
tasks are outside this controller.

### Archetype 6 Spine and Internal-tool Deviation

This is a functional internal Deno tool under `.llm`, not a published package or class-based CLI.
The five package spine abstracts are explicitly not introduced:

| Archetype spine | Decision |
| --- | --- |
| `CliCommand<Input, Result>` | N/A; a discriminated `RuntimeCommand` union is the exhaustive command contract. |
| `CliCommandGroup` | N/A; the command grammar has one explicit nested target, `repair codex-remote`. |
| `CliRoot` | N/A; `agentic-runtime.ts` is a <=150 LOC parser/composition edge. |
| `UseCase<Input, Result>` | N/A; pure planner functions plus a controller function provide the test seam without inheritance. |
| `Registry<TKey, TValue>` | N/A; agent kinds are a closed three-key record, not an extension ecosystem. |

No layer-2 abstract is introduced, so R-BASE-L2 has no candidate/concrete pair to justify. The
applicable Archetype constraints are thin presentation, pure planning, side effects at adapters,
finite vocabulary, semantic tests, file budgets, permissions, and no success-shaped fallback.

### Typed Command Schema

```ts
type RuntimeCommand =
  | DoctorCommand
  | BootstrapCommand
  | ConfigureCommand
  | LaunchCommand
  | ResumeCommand
  | SmokeCommand
  | FallbackCommand
  | RestoreCommand
  | StatusCommand
  | RepairCodexRemoteCommand
  | RollbackCommand;
```

Every member has `kind`, `commandId`, `mode: "inspect" | "plan" | "apply"`, and only its required
fields. Shared identity types are:

- `AgentKind = "claude" | "codex" | "gemini"`.
- `ProviderKind = "anthropic" | "openai" | "google" | "openrouter" | "custom"`; this is identity,
  not a supported-profile promise.
- `Effort = "low" | "medium" | "high" | "xhigh" | "max"` as caller-recorded vocabulary; #581 may
  change canonical policy without changing the route envelope.
- `RouteIdentity` = agent, provider, non-empty model, effort, native worktree, optional session ID,
  and `mobileRequired`.
- `SessionIdentity` = agent, opaque session/thread ID, native worktree, and turn-boundary state.
- `ContentReference` = normalized file path only. `ContentReferenceSummary` records byte count and
  fingerprint after reading; neither type records file content in state or result.

Command-specific invariants:

- `launch` requires no existing session unless the adapter explicitly supports attach; `resume`
  requires one and cannot create another.
- `fallback` requires a complete caller-selected target route and an idle/new-boundary session.
- `restore` uses the configured desired route and the same boundary proof.
- `repair codex-remote` always inspects first. `plan` emits safe intents; `apply` is blocked with
  child issue #580 until its durable adapter is integrated.
- `rollback` requires a controller checkpoint ID. It never accepts an arbitrary path.

### Result Schema

```ts
interface RuntimeResult {
  schemaVersion: "1.0";
  commandId: string;
  command: RuntimeCommandKind;
  mode: "inspect" | "plan" | "apply";
  status: RuntimeStatus;
  changed: boolean;
  desiredSummary: DesiredStateSummary | null;
  observedSummary: ObservedStateSummary;
  actions: RuntimeActionResult[];
  diagnostics: RuntimeDiagnostic[];
  route?: RouteIdentity;
  checkpoint?: CheckpointSummary;
  timing: { startedAt: string; completedAt: string; durationMs: number };
}
```

`RuntimeStatus` is `succeeded | no_change | planned | degraded | blocked | failed | rolled_back |
partially_rolled_back`. `RuntimeActionResult` exposes only action ID, adapter, effect class,
reversibility, and finite status; no argv/raw output. JSON and human output are two renderers over
this same object.

Canonical exit mapping:

| Exit | Meaning |
| --- | --- |
| 0 | `succeeded`, `no_change`, `planned`, or `rolled_back` |
| 2 | `degraded` observation/auth state |
| 3 | invalid request, invalid desired state, or policy conflict |
| 4 | safety/capability block requiring operator/child work |
| 5 | execution failure or partial rollback |

Legacy wrappers retain their current exits independently of this mapping.

### Desired and Observed State

`DesiredRuntimeState` schema `1.0` is declarative and value-free:

- required native-ext4 execution;
- desired foundation tool versions and state-directory presence;
- desired agent availability/auth route category;
- complete desired `RouteIdentity` per configured agent;
- worktree/branch/upstream/dirty constraints;
- required session identity/boundary and mobile visibility;
- controller-owned configuration references and ownership schema.

It contains no active credential, raw environment, provider-session content, prompt/message content,
or global provider default.

`ObservedRuntimeState` contains normalized facts only:

- bounded component versions/statuses and PR 0A auth categories;
- native path and worktree safety;
- configured desired-state/checkpoint schema validity;
- observed agent/session IDs and turn state;
- Codex managed/version state and Claude mobile capability;
- finite capability availability (`available | degraded | blocked | deferred`).

`planReconciliation(command, desired, observed)` is pure and returns `ReconcilePlan`. Exact equality
returns `actions: []`. Plans contain data-only `RuntimeAction` intents; they do not contain closures,
credential values, prompt content, or pre-rendered shell strings.

### Failure Taxonomy

Each diagnostic has stable `code`, `category`, `retryable`, a bounded safe `message`, and optional
non-secret `operatorAction`/`ownerIssue`.

| Category | Representative codes |
| --- | --- |
| `input` | `invalid_command`, `missing_identity`, `invalid_state_file`, `invalid_checkpoint` |
| `policy` | `route_conflict`, `non_native_worktree`, `turn_boundary_required`, `credential_argument_forbidden` |
| `authentication` | `auth_required`, `auth_conflict` |
| `compatibility` | `component_missing`, `component_outdated`, `version_skew`, `unparseable_version` |
| `safety` | `unsafe_worktree`, `ownership_conflict`, `active_session`, `duplicate_sender_risk`, `unowned_resource` |
| `provider` | `quota_exhausted`, `rate_limited`, `provider_unavailable`, `unsupported_route` |
| `transport` | `network_unavailable`, `timeout`, `mobile_disconnected` |
| `execution` | `process_failed`, `probe_failed`, `state_write_failed`, `action_failed` |
| `state` | `state_missing`, `state_corrupt`, `schema_unsupported`, `checkpoint_incomplete` |
| `rollback` | `rollback_refused`, `compensation_failed`, `partially_rolled_back` |
| `capability` | `capability_deferred`, `capability_unsupported` |
| `internal` | `unexpected_error` after bounded normalization |

Structured error/status input wins. Version-pinned text classification is allowed only behind a
tested adapter classifier; unknown text is `unexpected_error`/`provider_unavailable`, never success.

### Ports

| Port | Read/mutate boundary |
| --- | --- |
| `RuntimeInspectorPort` | Read component, auth, worktree, state, session, and mobile observations. |
| `PersistedStateReaderPort` | Read persisted controller state without exposing mutation methods. |
| `DesiredStateSourcePort` | Load/parse value-free desired state from a `ContentReference`. |
| `DesiredStateWriterPort` | Atomically write controller-owned state only in apply mode. |
| `CheckpointStorePort` | Read/write mode-0600 owned checkpoints; no provider-session access. |
| `ProcessPort` | Execute fixed binary + argv arrays with timeout/abort and bounded capture. |
| `FileContentPort` | Read prompt/message/config references; write only controller-owned state/staging in apply. |
| `AgentAdapter` | `inspect`, `planLaunch`, `launch`, `planResume`, `resume`, `planSmoke`, `smoke`. Unsupported methods return finite capability diagnostics. |
| `ProviderAdapter` | Validate route completeness/conflicts by key presence/reference only; no credential acquisition or preset selection. |
| `MobileControlAdapter` | Read mobile capability/session status; mutating repair is unavailable until #580. |
| `ClockPort` | Deterministic timestamps/durations in tests. |

Read ports and mutation ports are separate constructor fields/types. `doctor` and `status` are
inspect-only; effectful commands are plan/apply-only. The controller's inspect/plan branches are
typed without mutation-port access. `applyPlan()` is the only function receiving mutation ports.

### Adapters and Composition

- `foundation-adapter.ts` translates the PR 0A `RuntimeDoctorReport`, `BootstrapPlan`, and ownership
  manifest without breaking schema `1.0`.
- `codex-adapter.ts` reuses handoff validation, git safety, launch-log parsing, turn parsing, and
  same-thread resume. It never sends twice for one request.
- `claude-adapter.ts` normalizes static/live smoke and mobile capability; prompt content remains a
  file reference.
- `gemini-adapter.ts` normalizes installed/auth observations and reports #578 live evidence work as
  deferred.
- `provider-adapter.ts` validates caller-supplied identity and conflicting key **names**; #577 owns
  profiles and child env injection.
- `mobile-control-adapter.ts` unifies read-only Claude/Codex status; live Codex repair is deferred.
- `local-state-adapter.ts` owns atomic mode-0600 desired-state/checkpoint reads and writes.
- `agentic-runtime.ts` parses, composes these adapters, calls `runRuntimeCommand()`, renders, and
  maps the canonical exit. It contains no domain policy.

No extension registry class is justified: three agent adapters are a closed typed record consumed
by the controller. If a fourth runtime becomes real, contributor work first updates `AgentKind` and
the record exhaustiveness; a registry is introduced only if open extension becomes a requirement.

### Read-only and Dry-run Guarantees

1. `doctor` and `status` construct only read ports.
2. Any `--dry-run` parses as `mode: "plan"`; `applyPlan()` is unreachable.
3. Read-only probes may run bounded version/status commands and network metadata reads, but may not
   stage a brief, create a directory/file/checkpoint, change a symlink/config, send a turn, start a
   session, kill a process, or alter a global/default route.
4. Every plan result has `changed: false` even when it lists would-change actions.
5. Tests inject mutation spies and compare before/after state-tree hashes. Any mutation call fails.
6. `repair codex-remote --dry-run` produces data-only actions; live apply is a deliberate block.

### Rollback Semantics

- Before the first apply action, write an atomic mode-0600 checkpoint containing schema, command ID,
  owned resource IDs/fingerprints, previous link targets/value-free config, and ordered action IDs.
- Execute actions in order. On first failure, stop and compensate completed reversible actions in
  reverse order.
- Compensation never crosses the checkpoint allowlist. Provider session directories, `~/.codex`,
  arbitrary user files, Windows Claude, and unknown symlink targets are preserved/refused.
- Report `failed` after full automatic compensation, `partially_rolled_back` if any compensation
  fails, and `blocked` if rollback ownership/schema cannot be proven.
- Explicit `rollback` first plans, then applies from a checkpoint. A second completed rollback is
  `no_change`; the checkpoint remains as non-secret audit metadata rather than being silently lost.
- Non-reversible actions are not allowed in #576 apply plans. A future adapter needing one is a
  rescope, not an `--allow-force` flag.

### Constants

- `RUNTIME_SCHEMA_VERSION = "1.0"`
- `RUNTIME_COMMANDS`, `AGENT_KINDS`, `PROVIDER_KINDS`, `EFFORTS`
- `RUNTIME_STATUSES`, `FAILURE_CATEGORIES`, `ACTION_EFFECTS`, `CAPABILITY_STATES`
- `CANONICAL_EXIT_CODES` and per-wrapper `LEGACY_EXIT_CODES`
- `CONTROLLER_STATE_RELATIVE_PATH`, `CHECKPOINTS_RELATIVE_PATH`
- `MAX_DIAGNOSTIC_BYTES`, `MAX_CAPTURE_BYTES`, `DEFAULT_TIMEOUT_MS`
- `DEFERRED_CAPABILITIES` mapping exact command/agent operation to #577-#582

Finite values are `as const` arrays/records with derived union types; implementation does not repeat
string literals across parser/planner/adapters/renderers.

### Feature Catalog and File Shape

The internal tool uses a compact functional feature layout:

```text
.llm/tools/agentic/
  agentic-runtime.ts
  runtime/
    contract.ts
    state.ts
    ports.ts
    planner.ts
    controller.ts
    output.ts
    adapters/
      foundation-adapter.ts
      local-state-adapter.ts
      provider-adapter.ts
      codex-adapter.ts
      claude-adapter.ts
      gemini-adapter.ts
      mobile-control-adapter.ts
    contract_test.ts
    planner_test.ts
    controller_test.ts
    adapters_test.ts
```

There are no sub-barrels, speculative folders, templates, generated outputs, published entrypoints,
or cross-surface imports. File budgets are locked in `plan.md`; every created file traces to a
named contract/port/adapter/test here.

### Permissions and Secret Boundary

- `doctor`/`status`: read/env/run only as required for bounded probes; no write.
- Dry-run: same read permissions plus any read-only metadata network access; no write and no session
  send/process repair.
- Apply: write only controller-owned user-local state/checkpoints/staging and run only fixed adapter
  commands. Network hosts remain allowlisted by the task/adapter being used.
- Credential values are neither CLI inputs nor persisted fields. Environment adapters report
  allowlisted key presence/conflict names only. Output/checkpoints never contain raw env, raw
  provider sessions, prompt content, or full stdout/stderr.

### Semantic Test Strategy

- Exhaustiveness/round-trip tests for every command, result, status, action, diagnostic, and exit.
- Planner idempotence and deterministic action ordering.
- Mutation-spy and temp-tree equality tests for every inspect/dry-run command.
- Synthetic sentinel redaction across JSON, human output, state, checkpoints, and captured argv.
- Route/worktree/session validation matrix and same-thread/no-rival guarantees.
- Agent adapter command construction with file inputs and bounded output normalization.
- Structured-first failure classification plus unknown-output false-green tests.
- Checkpoint, reverse compensation, partial compensation, ownership refusal, and repeated rollback.
- PR 0A schema reader/migration and legacy wrapper output/exit compatibility.

### Commit Slices

| # | Introduces | Proving gate | Files |
| --- | --- | --- | --- |
| S1 | Contract/state/ports/pure planner | contract + planner tests; scoped check/lint/fmt | runtime contract/state/ports/planner + two tests + run artifacts |
| S2 | Controller/output/foundation/state/mobile adapters and canonical CLI | controller tests, doctor repeat, dry-run mutation/tree/redaction gates | canonical CLI, controller/output, three adapters, test, task/README, run artifacts |
| S3 | Claude/Codex/Gemini/provider lifecycle adapters | route/command/static-smoke/deferred-capability matrix | four adapters, adapter test, run artifacts |
| S4 | Apply/fallback/restore/checkpoint/rollback/failure behavior | transition, compensation, failure, state/lock hygiene matrix | existing planned runtime files/tests only, run artifacts |
| S5 | Thin compatibility wrappers | legacy flags/output/exits plus full scoped gate set/manual F-CLI review | five wrappers/tests, task/README, run artifacts |

### Deferred Scope

- #577 profiles/OpenRouter/child env injection.
- #578 Gemini evidence acquisition/citations.
- #579 automatic quota fallback persistence/reset probes/restoration policy.
- #580 durable sender lock and live Codex remote repair.
- #581 canonical routing/model migration.
- #582 complete rollout canaries/promotion.

### Contributor Path

- Add a command by extending `RUNTIME_COMMANDS`/`RuntimeCommand`, parser, pure planner branch,
  renderer vocabulary, and exhaustiveness tests before adding effects.
- Add an agent operation by implementing the existing `AgentAdapter` method and updating the closed
  adapter record/test matrix; never branch on raw provider text in the controller.
- Add a failure classifier in the owning adapter with a stable diagnostic code and test; unknown
  output remains failure.
- Add a reversible mutation by defining a data-only action, checkpoint ownership fields, executor,
  compensation, and repeated-rollback test together.
- Add a future open extension axis only after a real fourth variant or external registration need
  justifies a Registry; do not pre-build one.

## Planning Evidence

| Date | Phase | Result | Evidence |
| --- | --- | --- | --- |
| 2026-07-10 | bootstrap | PASS | Native WSL worktree created from foundation sign-off `9b75470` |
| 2026-07-10 | attach | PASS | Managed thread `019f4b72-2ea4-7050-917e-6d6918371265` returned `CODEX_PR0B_ATTACHED` |
| 2026-07-10 | research | COMPLETE | Live #576/#585/#577-#582 reconciliation, current-main/base comparison, PR 0A baseline artifacts, Deno docs, and focused source inventory |
| 2026-07-10 | design | READY_FOR_REVIEW | Typed contract, state, ports/adapters, effects, failures, rollback, slices, budgets, gates, and deferrals locked |
| 2026-07-10 | planning check | PASS | `git diff --check` exit 0; diff contains only the five required run artifacts and no implementation source |
| 2026-07-10 | plan-gate | PASS | `plan-eval.md`; external dispatch waived by owner; coordinator substantive review |

## Reconcile Note — Planning Slice

Issue #576 and draft PR #585 remain open at exactly one `status:plan`; labels and issue milestone are
correct. PR #585 retains `Closes #576`, `Part of #574`, and its PR #584 stack. Acceptance/DoD boxes
remain unchecked and the PR remains draft. Implementation is authorized on the same thread.

## S1 — Contract, State, Ports, and Pure Planner

### Delivered Scope

S1 created only the six locked runtime files plus these run-artifact updates:

- `runtime/contract.ts`: schema `1.0`, finite constant vocabularies with derived unions, value-free
  command/result/action/diagnostic contracts, and explicit deferred-capability ownership.
- `runtime/state.ts`: value-free desired, observed, checkpoint, and persisted-state types with
  deterministic desired-state equality.
- `runtime/ports.ts`: structurally separate read and mutation port aggregates and disjoint finite
  method vocabularies.
- `runtime/planner.ts`: pure deterministic command reconciliation returning data-only actions;
  equal desired/observed state returns no actions.
- `runtime/contract_test.ts` and `runtime/planner_test.ts`: 14 focused contract, safety,
  idempotence, ordering, deferred-intent, and rollback-planning tests.

No CLI edge, executor, renderer, adapter, compatibility wrapper, provider preset, automatic
fallback policy, live repair, provider login, dependency, or child-issue implementation was added.
Deferred capabilities are explicit blocked intents owned by #577, #578, or #580.

### S1 Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused tests | `rtk proxy deno test --no-lock .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts` | exit 0; `14 passed | 0 failed`; no permissions requested |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/runtime --ext ts --pretty` | exit 0; 6 files, 1 batch, 0 failed, 0 findings; wrapper used `--unstable-kv` |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/runtime --ext ts --pretty` | exit 0; 6 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic/runtime --ext ts --write --pretty`, then the same command without `--write` | write exit 0 after the initial check identified 5 files; final check exit 0, 6 files, 0 findings |
| Native API inspection | `deno doc --filter planReconciliation .llm/tools/agentic/runtime/planner.ts`; equivalent filters for `RuntimeCommand`, `RuntimeReadPorts`, and `RuntimeMutationPorts` | all exit 0; public signatures resolve without a dependency change |
| Secret/content boundary | `rg` scans for secret-bearing field names and string/unknown/binary prompt-content fields across the four source files | `SECRET_FIELD_SCAN=PASS`; `CONTENT_FIELD_SCAN=PASS` |
| File budgets | `wc -l` over the six S1 files, compared with the locked S1 caps | PASS: `220/220`, `151/300`, `117/220`, `348/350`, `214/450`, `232/450` |
| Lock hygiene | `git rev-parse f1dfdc9:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code f1dfdc9 -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Patch hygiene | `git diff --cached --check` | exit 0 |

### Drift, Debt, and Handoff

- Plan drift: none. S1 stayed within its six planned implementation/test files and hard LOC caps.
- Architecture debt: none introduced. S1 is functional internal tooling with no new abstraction,
  dependency, registry, or published surface.
- Lock drift: none; `deno.lock` is byte-identical to plan commit `f1dfdc9`.
- Review state: automated gates pass, but this implementation worker does not self-certify Tier-A.
- Next action: coordinator performs substantive Tier-A S1 review. Do not start S2 until that review
  is recorded and this same daemon-managed thread is resumed.

## Reconcile Note — S1

Issue #576 and draft PR #585 remain open at exactly one `status:impl`; issue milestone and taxonomy
remain correct. PR #585 retains `Closes #576`, `Part of #574`, and its PR #584 stack. The coordinator
Plan-Gate approval and S1 START comments are present, no review comment changes the locked scope,
acceptance/DoD remains unchecked, and the PR remains draft pending Tier-A S1 review.

## S1 Remediation — Tier-A Contract Findings

Tier-A posted the same three `S1 CHANGES REQUESTED` findings on PR #585 and issue #576. This
remediation changed only the existing S1 contract/state/ports/planner files, their two focused test
files, and the required run artifacts.

### Findings Addressed

1. Observation now derives `ObservedFoundationComponentId` from the complete 16-component PR 0A
   executable/policy doctor vocabulary: Node, npm, Deno, Git, Codex, Codex app-server, Claude,
   Gemini, Gemini auth policy, dotnet, Aspire, Docker, and four state-directory probes. Bootstrap
   actions separately derive `InstallableFoundationComponentId` from Node/Claude/Gemini only, so
   unsupported installs cannot be planned.
2. `RuntimeCommandBase<K>.mode` now derives from `RuntimeCommandMode<K>`: `doctor` and `status` are
   inspect-only; all effectful commands are plan/apply-only. Compile-time negative assertions reject
   `doctor/apply` and `launch/inspect`; the runtime mode guard makes a forced illegal planner input
   an `invalid_command` blocked intent rather than a success-shaped plan.
3. `configure` now requires `desiredState: ContentReference`. `DesiredStateSourcePort` loads and
   parses a value-free `DesiredRuntimeState` from that reference, while `PersistedStateReaderPort`
   remains the distinct controller-state reader. Neither persisted state nor runtime results retain
   source, prompt, message, or configuration content.

### Remediation Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused tests | `rtk proxy deno test --no-lock .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts` | exit 0; `18 passed | 0 failed`; no permissions requested |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/runtime --ext ts --pretty` | exit 0; 6 files, 1 batch, 0 failures/findings; `--unstable-kv` applied by wrapper |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/runtime --ext ts --pretty` | exit 0; 6 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic/runtime --ext ts --pretty` | exit 0; 6 files, 0 findings |
| Native API inspection | `deno doc --filter RuntimeCommand contract.ts`; filters for `ObservedRuntimeState`, `DesiredStateSourcePort`, and `planReconciliation` on their runtime modules | all exit 0; remediated public signatures resolve |
| Secret/content boundary | field scans across `contract.ts`, `state.ts`, `ports.ts`, and `planner.ts` | `SECRET_FIELD_SCAN=PASS`; `CONTENT_FIELD_SCAN=PASS` |
| File budgets | `wc -l` over all six S1 files | PASS: `220/220`, `152/300`, `123/220`, `348/350`, `257/450`, `274/450` |
| Lock hygiene | `git rev-parse 9f59ad8:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code 9f59ad8 -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Patch hygiene | `git diff --cached --check` | exit 0 |

### Remediation Drift, Debt, and Handoff

- Plan drift: none. These are in-scope corrections to the locked S1 contracts and tests.
- Architecture debt: none introduced; no dependency, adapter, CLI edge, executor, or wrapper was
  added.
- Lock drift: none; `deno.lock` remains byte-identical to S1 commit `9f59ad8`.
- Review state: automated remediation gates pass, but this worker does not self-certify Tier-A.
- Next action: coordinator performs substantive Tier-A S1 re-review. S2 remains blocked.

## Reconcile Note — S1 Remediation

PR #585 and issue #576 remain open in implementation. Their Tier-A `S1 CHANGES REQUESTED` comments
match the remediated scope exactly. PR #585 remains draft with `Closes #576`, `Part of #574`, and
its PR #584 stack; Definition-of-Done remains unchecked. No comment or label expands this turn into
S2, and no child-issue implementation was pulled forward.

## S2 — Read-only Controller, Renderers, and Foundation State Adapters

### Delivered Scope

- `.llm/tools/agentic/agentic-runtime.ts`: 150-LOC canonical S2 parser/composition edge for
  `doctor`, `status`, bootstrap/configure planning, and `repair codex-remote`; lifecycle/provider
  commands remain unavailable until S3.
- `runtime/controller.ts`: observation and planning orchestration that accepts `RuntimeReadPorts`
  only. Inspect/plan paths cannot receive mutation ports; apply remains an explicit block.
- `runtime/output.ts`: JSON/human renderers and canonical exit mapping from one `RuntimeResult`.
- `runtime/adapters/foundation-adapter.ts`: invokes the existing PR 0A doctor read-only and
  translates every schema-1.0 executable/policy probe into stable observed state.
- `runtime/adapters/local-state-adapter.ts`: strict value-free parsing, PR 0A ownership-state
  migration, content summaries, and controller-owned atomic mode-0600 state/checkpoint writes.
- `runtime/adapters/mobile-control-adapter.ts`: read-only Codex managed/version capability
  translation; live repair remains an explicit #580 block.
- `runtime/controller_test.ts`: semantic read-only, dry-run, migration, permissions, sentinel,
  output, CLI-boundary, and deferred-repair coverage.
- `deno.json` and the agentic README: canonical task registration, S2 command/permission contract,
  and explicit S3/S4 deferrals.

No Claude/Codex/Gemini/provider lifecycle adapter, provider profile, automatic fallback, durable
sender lock/repair, routing-policy migration, rollout promotion, compatibility-wrapper edit, new
dependency, or `deno.lock` change was introduced.

### Initial S2 Evidence (superseded where Tier-A found gaps)

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused S2 tests | `rtk proxy deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/controller_test.ts` | exit 0; `8 passed | 0 failed` |
| Full agentic/runtime unit set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts .llm/tools/agentic/runtime/controller_test.ts` | exit 0; `95 passed | 0 failed` |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty` | exit 0; 32 files, 1 batch, 0 failures/findings; wrapper used `--unstable-kv` |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)' --pretty` | exit 0; 20 files, 0 findings |
| Locked broad format command | Same include through `.llm/tools/run-deno-fmt.ts` | exit 1; four pre-existing findings in untouched S5 wrappers; `git diff ac71896 -- <four files>` exit 0 |
| Owned S2 format verdict | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime)' --pretty` | exit 0; 13 files, 0 findings |
| Live doctor repeat | `deno task agentic:runtime doctor --json` twice; Deno harness removed only `.timing` and compared controller-tree/repository hashes | both exit 2 (`degraded`, browser auth required); semantic equality `true`; controller tree equality `true`; repository state equality `true` |
| Dry-run mutation/tree gate | Initial focused tests and tree hashes | Tier-A rejected the mutation-call count as disconnected; replacement passed-ports proxy evidence is below |
| Secret/content sentinel | Initial focused test and field scans | Tier-A rejected the synthetic output/argv claim; real data-flow evidence and S2 argv N/A classification are below |
| PR 0A migration | Focused migration/translation tests | complete 16-probe public vocabulary retained; generated timestamp does not change observed identity; ownership paths are discarded from migrated controller state |
| File budgets | `wc -l` over the seven S2 TypeScript files | PASS: CLI `150/150`; controller `227/300`; output `56/220`; adapters `139/350`, `326/350`, `24/350`; test `384/450` |
| Native API inspection | `deno doc --filter` for `runRuntimeCommand`, `LocalRuntimeStateAdapter`, `translateFoundationReport`, and `parseRuntimeArgs` | all exit 0; isolated public signatures resolve |
| Lock hygiene | `git rev-parse ac71896:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code ac71896 -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Patch hygiene | `git diff --cached --check` | exit 0 |

### S2 Safety and Handoff

- Worktree: `/home/codex/repos/netscript-epic-574-pr0b-controller` (native ext4).
- Sole mobile-visible thread: `019f4b72-2ea4-7050-917e-6d6918371265`; no sender was launched.
- Plan/architecture drift: none. Minor gate-scope drift for the broad format include is recorded in
  `drift.md`; the four findings are untouched S5 files and the owned S2 surface is green.
- Architecture debt: none introduced. The approved functional internal-tool Archetype 6 deviation
  remains intact: thin edge, explicit ports/adapters, effects at edges, no new spine/registry.
- Next action: coordinator performs substantive Tier-A S2 review. Do not start S3.

## Reconcile Note — S2

PR #585 and issue #576 remain open in implementation. Both contain the coordinator's `S1 APPROVED /
S2 START` record naming sign-off `ac71896`, this sole thread, and this worktree. PR #585 remains
draft with `Closes #576`, `Part of #574`, and its PR #584 stack; Definition-of-Done remains
unchecked. No newer comment or label expands S2 or authorizes S3.

## S2 Tier-A Remediation

Tier-A review of `2ad1d9c` requested four corrections: restore the locked safe result summaries and
real status filters, reject unknown desired-state vocabulary, replace the disconnected mutation
spy, and exercise the sentinel through real data flow without overstating argv coverage.

### Corrections

- `RuntimeResult` now exposes bounded value-free `desiredSummary` and `observedSummary` projections.
  Doctor retains all 16 PR 0A component facts. Status filters narrow agent auth/capability/session
  facts and worktree/session identities; unmatched identities return `missing_identity` with exit 3.
- Untyped desired-state loading rejects unknown top-level, foundation-version, agent, route,
  worktree, and session keys. Persisted state/checkpoint reads are strict too. Controller-owned
  writes use a separate projection mode, preserving the prior secret/content stripping guarantee.
- The actual `RuntimeReadPorts` object passed to doctor, status, bootstrap-plan, and configure-plan
  is wrapped in an access-counting proxy whose mutation surfaces throw if resolved. Calls remain
  zero and the before/after state-tree hashes remain equal.
- The sentinel now enters untyped desired, persisted, and checkpoint JSON, then traverses the real
  parsers, controller failure path, and JSON/human renderers. Each input is rejected as
  `invalid_state_file`; the sentinel is absent from results and rendered output. Owned writer tests
  separately prove projection strips synthetic extra content. Content-bearing lifecycle process
  argv does not exist in S2, so that sub-gate is **N/A** and remains for S3.

### Remediation Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused changed tests | `rtk proxy deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/controller_test.ts` | exit 0; `16 passed | 0 failed` |
| Complete agentic/runtime unit set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts .llm/tools/agentic/runtime/controller_test.ts` | exit 0; `96 passed | 0 failed` |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty` | exit 0; 32 files, 1 batch, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)' --pretty` | exit 0; 20 files, 0 findings |
| Owned format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime)' --pretty` | exit 0; 13 files, 0 findings |
| Live doctor repeat | Deno 2.9 in-memory harness invoked `deno task agentic:runtime doctor --json` twice and removed only `.timing` | exits `2/2`, statuses `degraded/degraded`, 16 components, semantic/controller-tree/repository equality all `true` |
| Live status filters | Deno 2.9 in-memory harness invoked live `status --agent codex --json` and an unmatched `--session` | filtered exit 0 with only `codex` capability; unmatched exit 3, status `blocked`, diagnostic `missing_identity` |
| Mutation/tree proof | Focused `bootstrap and configure plans...` test passes the throwing proxy to all four read-only/plan commands | mutation-surface resolutions `0`; tree hashes equal |
| Strict input matrix | Focused contract test mutates top-level, version, agent, route, worktree, and session keys | all six rejected |
| Sentinel flow | Focused controller/writer tests plus implementation/run-artifact sentinel scan | desired/persisted/checkpoint inputs rejected; JSON/human/writes clean; lifecycle argv N/A for S2 |
| File budgets | `wc -l` over the locked CLI/runtime/adapters/tests | PASS: CLI 150; contracts/state/ports/planner/controller/output 220/293/123/348/278/57; adapters 139/340/24; tests 300/274/444 |
| Secret/content scan | `rg` over owned implementation plus an exact sentinel scan excluding tests | only fixed Deno child-process `stdout`/`stderr` pipe plumbing matched; sentinel absent from implementation/run artifacts |
| Lock hygiene | `git rev-parse 2ad1d9c:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code 2ad1d9c -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Raw scope/status | raw `git status --short`; `git diff --name-only 2ad1d9c` | only the eight permitted runtime/README files and two mandatory run artifacts; no `deno.lock`, CLI edge, wrapper, or S3 file |
| Patch hygiene | `git diff --check` | exit 0 |

No S3 lifecycle adapter, provider profile, live repair, dependency, lock/cache, root-format, or
compatibility-wrapper work was introduced. The existing broad-format scope drift entry remains
authoritative and unchanged; no new architecture debt was created.

## Reconcile Note — S2 Remediation

PR #585 and issue #576 were reread after the replacement gates. Both remain open at `status:impl`,
and both record the same four Tier-A findings against `2ad1d9c`. The implementation scope remains
aligned with #576, the draft PR still carries `Closes #576` and `Part of #574`, and no comment or
label authorizes S3. Next action is coordinator substantive Tier-A re-review of the remediation
commit; this worker does not self-certify.

## S3 Activation

- Coordinator S2 sign-off: `6756a547101a4adf4d2d76157c574edf765ccf5a` over remediation
  `a314289bbd30908a4f5dcc132f3cf4e4498fc5bb`.
- Worktree/branch: native ext4 `/home/codex/repos/netscript-epic-574-pr0b-controller` on
  `refactor/epic-574-agentic-runtime-controller`; raw local and remote heads matched at activation.
- Sole thread: `019f4b72-2ea4-7050-917e-6d6918371265`; same-thread continuation only, no sender
  launch.
- Locked scope: four agent/provider lifecycle adapters, `runtime/adapters_test.ts`, necessary typed
  S1/S2 composition changes, and mandatory run artifacts. S4 transactions/rollback and S5 wrappers
  remain blocked.

## S3 Implementation

### Scope Delivered

- `runtime/ports.ts`: value-free `AgentProcessRequest` and `AgentCommandPlan` seam; no executor or
  mutation method.
- `runtime/adapters/codex-adapter.ts`: pure launch/resume construction using content file paths,
  exact worktree/branch/thread identity, existing handoff/git-safety/launch-log/turn primitives,
  bounded capture metadata, and separate launch/resume wrapper paths.
- `runtime/adapters/claude-adapter.ts`: fixed bounded static-smoke argv using a content reference;
  launch/resume and interactive live/mobile work return finite unsupported diagnostics.
- `runtime/adapters/gemini-adapter.ts`: installed/auth normalization, bounded static probe planning,
  explicit #578 live-evidence block, and unsupported launch/resume diagnostics.
- `runtime/adapters/provider-adapter.ts`: complete route/session/native-path validation, fixed
  agent/provider pairs, allowlisted credential conflict **names** only, and #577 blocks for
  OpenRouter/custom. It does not accept credential values or select profiles/defaults.
- `runtime/adapters_test.ts`: command construction, route/worktree/session matrix, bounded parsing,
  no-rival resume, provider sentinel, child-issue, and unsupported-capability coverage.

The adapter plans are data only and are reached by focused tests. S4 remains responsible for
controller execution, checkpoints, compensation, and transactional apply; the canonical CLI and
legacy wrappers were intentionally unchanged in S3.

### S3 Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused adapter tests | `rtk proxy deno test --no-lock .llm/tools/agentic/runtime/adapters_test.ts` | exit 0; `9 passed | 0 failed`; no permissions required |
| Complete agentic/runtime unit set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts .llm/tools/agentic/runtime/controller_test.ts .llm/tools/agentic/runtime/adapters_test.ts` | exit 0; `105 passed | 0 failed` |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty` | exit 0; 37 files, 1 batch, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)' --pretty` | exit 0; 25 files, 0 findings |
| Owned format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime)' --pretty` | final exit 0; 18 files, 0 findings |
| Codex construction | Focused launch/resume tests inspect exact argv arrays, content path, cwd, worktree, branch, thread ID, timeout, and capture cap | PASS; launch and resume use their checked-in wrappers; raw content/rollout paths absent from plans/observations |
| Route/worktree matrix | Missing provider/model/effort/worktree/mobile/session; agent/provider/session conflicts; non-native, dirty, wrong-branch, and active-turn inputs | all reject with finite diagnostics before request construction |
| Claude/Gemini/provider | Static Claude fixed argv; Gemini observation/live block; OpenRouter/custom/provider-key-name matrix | PASS; #578/#577 ownership explicit; owner-only/unsupported paths return `request: null` |
| No rival/effects | Resume argv scan plus source effect scan over all four adapters | no launch wrapper or `send-message-v2` in resume; no `Deno.Command`, env/write/fetch, or sender execution in adapters |
| Secret sentinel | Sentinel enters value-free handoff inspection and credential-key-name input, then real Codex/provider planning | absent from argv, diagnostics, results, implementation, and run artifacts; state contracts remain value-free |
| Native API inspection | `deno doc` over each new adapter | exit 0; public signatures resolve and raw content/provider-session paths are not result fields |
| File budgets | `wc -l` over CLI/runtime/adapters/tests | PASS: new provider/codex/claude/gemini adapters 110/198/95/119; new test 369; ports 145/220; CLI unchanged 150/150; all touched TS <500 |
| Lock hygiene | `git rev-parse 6756a54:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code 6756a54 -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Patch/scope | `git diff --check`; raw `git status --short` and scope/effect/secret scans | exit 0; only five planned S3 files, `ports.ts`, and two mandatory run artifacts |

### S3 Safety and Handoff

- No real second sender, process execution, provider login, live Gemini prompt, Claude/mobile
  canary, network/write mutation, dependency/lock/cache change, S4 transaction, or S5 wrapper edit.
- Existing broad-format scope drift remains unchanged; final S3-owned format verdict is green.
- No new architecture debt. Functional internal-tool layering remains: contracts/ports -> pure
  adapters -> future S4 execution edge.
- Next action: coordinator substantive Tier-A S3 review. This worker does not self-certify and does
  not start S4.

## Reconcile Note — S3

PR #585 and issue #576 are open at `status:impl`; both record S2 coordinator sign-off `6756a54`.
The draft PR retains `Closes #576`, `Part of #574`, and the PR #584 stack. S3 matches the locked
plan and child boundaries #577/#578; no newer comment or label authorizes S4.

## S3 Tier-A Remediation

Tier-A review of `a0baef2` requested two fail-closed Codex corrections: pin launch construction to
the inspected Git HEAD and reject incomplete, mismatched, or failed launch observations.

### Corrections

- `planCodexCommand` now requires a non-empty inspected `git.head` and includes the exact value as
  `--expect-base <head>` in the checked-in launch-wrapper request. Missing HEAD returns
  `missing_identity` and constructs no request, closing the branch-movement TOCTOU gap.
- `observeCodexLaunch` now accepts the complete expected `RouteIdentity` and validates thread,
  worktree, model, and process result after the existing bounded parser. Missing identities return
  `missing_identity`; worktree/model mismatches return `route_conflict`; a nonzero parsed exit
  returns `process_failed`. An absent exit remains valid under the checked-in parser contract.
- Focused tests assert exact pinned argv, missing-HEAD rejection, missing worktree/model,
  mismatched worktree/model, and nonzero process exit. Resume/no-rival and content-sentinel coverage
  remain green.

### Replacement Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused adapter tests | `rtk proxy deno test --no-lock .llm/tools/agentic/runtime/adapters_test.ts` | exit 0; `9 passed | 0 failed`; no permissions |
| Complete agentic/runtime unit set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts .llm/tools/agentic/runtime/controller_test.ts .llm/tools/agentic/runtime/adapters_test.ts` | exit 0; `105 passed | 0 failed` |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty` | exit 0; 37 files, 1 batch, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)' --pretty` | exit 0; 25 files, 0 findings |
| Owned format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime)' --pretty` | exit 0; 18 files, 0 findings |
| Route/identity/process | Focused exact-argv and observation matrix over missing/mismatched identities and nonzero exit | PASS; finite expected diagnostic codes and no request on missing HEAD |
| Launcher contract | `rg -n -- '--expect-base\|expectBase'` over launcher, adapter, and focused test | launcher already consumes `--expect-base`; adapter and exact-argv test now supply it |
| No-rival/effects | `rg -n 'send-message-v2\|Deno\\.Command\|Deno\\.env\|Deno\\.write\|fetch\\(' runtime/adapters/codex-adapter.ts` plus resume focused test | no matches; resume still excludes launch wrapper and rival sender |
| Sentinel/content | Existing real planning sentinel test plus implementation/run-artifact exact scan | PASS; sentinel absent; content remains file-reference only and raw prompt/config values remain unrepresented |
| File budgets | `wc -l` over Codex adapter and focused test | PASS: adapter `219/350`; test `391/450`; all touched TypeScript remains below 500 LOC |
| Lock hygiene | `git rev-parse a0baef2:deno.lock`; `git hash-object deno.lock`; `git diff --exit-code a0baef2 -- deno.lock` | both blobs `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; diff exit 0 |
| Scope/patch | raw `git diff --name-only a0baef2`; raw `git status --short`; `git diff --check` | only Codex adapter, focused test, and mandatory run artifacts; patch check exit 0 |

No real send, provider login, dependency/lock/cache change, root format, S4 transaction, S5 wrapper,
or child-issue implementation occurred. Existing broad-format drift remains unchanged; no new
architecture debt was introduced. Next action is coordinator substantive Tier-A S3 re-review; this
worker does not self-certify or start S4.

## Reconcile Note — S3 Remediation

Issue #576 and draft PR #585 remain the authoritative S3 scope. The remediation is limited to the
two Tier-A findings against `a0baef2`, retains explicit child boundaries #577/#578, and leaves S4
unstarted. The sole thread and native worktree identities are unchanged.

## Coordinator Tier-A S3 Sign-off

Coordinator substantive review approved remediation head `d597c0846f0d57b3486972850e8bbe9d882ce14a`.
The launch plan now binds execution to the inspected Git HEAD through `--expect-base`, rejects a
missing HEAD before request construction, and normalizes bounded launch output fail-closed across
thread, worktree, model, and nonzero process exit. Independent replacement validation reproduced
`105 passed | 0 failed` plus zero scoped check, lint, and owned-format findings. Raw remote head
matched the reviewed commit, the worktree was clean, and `deno.lock` was unchanged.

S3 is complete. S4 may begin only from this approved head in the same native WSL worktree and sole
thread. S5 wrappers and child-issue capabilities remain out of scope.

## S4 — Transactional Apply, Compensation, and Rollback

### Scope Delivered

- `controller.ts` retains `runRuntimeCommand(command, readPorts)` as the mutation-inaccessible
  inspect/plan path and adds `applyRuntimeCommand(command, readPorts, mutationPorts)` as the sole
  explicit effect boundary.
- Before the first action, apply writes a value-free `prepared` checkpoint containing ordered action
  IDs, controller-owned logical resource IDs, bounded fingerprints, and null previous fingerprints.
  A checkpoint refusal returns `state_write_failed`, executes no action, and reports `changed: false`.
- Actions execute in deterministic plan order and stop at the first failure. Every completed action
  compensates in exact reverse order. Full compensation returns `failed`/`changed: false`; a failed
  compensation returns `partially_rolled_back`/`changed: true`.
- Final checkpoint transitions are `applied`, `rolled_back`, or `partial`. An applied-status write
  failure cannot return success: completed actions compensate and the retained checkpoint metadata
  is updated to the honest rollback state when possible.
- Explicit rollback reads the named strict checkpoint, accepts only `applied`, one-resource-per-action
  controller-owned reversible identities with bounded IDs/fingerprints, compensates them in reverse,
  and writes `rolled_back`/`partial`. Unknown, incomplete, duplicate, unowned, path-shaped, or
  irreversible identities refuse before mutation; repeated completed rollback is `no_change`.
- Explicit fallback keeps the caller route exactly; restore exposes the configured desired route.
  Both remain idle/new-boundary only through the pure planner. No route selection, quota detection,
  global default, or transition history was added. Live Codex repair remains #580-blocked.
- Result projection stays bounded and strips unknown summary keys. Foundation/auth/mobile failure
  projection remains normalized in the foundation adapter; raw process/provider output never enters
  the controller result.

The implementation stayed in four existing planned runtime implementation files plus the focused
controller test. No CLI edge, compatibility wrapper, dependency, new runtime file/spine/registry,
or #577-#582 implementation changed.

### S4 Evidence

| Gate | Exact command / proof | Raw outcome |
| --- | --- | --- |
| Focused S4 integration | `rtk proxy deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/controller_test.ts` | exit 0; `10 passed | 0 failed` |
| Complete agentic/runtime unit set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/contract_test.ts .llm/tools/agentic/runtime/planner_test.ts .llm/tools/agentic/runtime/controller_test.ts .llm/tools/agentic/runtime/adapters_test.ts` | exit 0; `107 passed | 0 failed` |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty` | exit 0; 37 files, 1 batch, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)' --pretty` | exit 0; 25 files, 0 findings |
| Owned format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts --include '(^|/)(runtime/|agentic-runtime)' --pretty` | exit 0; 18 files, 0 findings |
| Live doctor repeat | Deno 2.9 harness invoked `deno task agentic:runtime doctor --json` twice and removed only timing | exits `2/2`; statuses `degraded/degraded`; schema `1.0`; 16 components; semantic equality, controller-runtime tree equality, and agentic source-tree equality all `true` |
| Dry-run matrix | Focused plan test covers bootstrap/configure/launch/resume/smoke/fallback/restore/repair/rollback with mutation event log and SHA-256 temp-tree hash | all `changed: false`; mutation events `0`; before/after tree hashes equal |
| Transaction matrix | Focused apply tests cover success, prepared-checkpoint refusal, first/later failure, applied-status failure, full reverse compensation, and partial compensation | expected finite statuses/changed values; checkpoint always precedes action; final states `applied`/`rolled_back`/`partial` |
| Rollback matrix | Focused explicit rollback tests cover reverse order, repeated rollback, incomplete/unowned/path-shaped/irreversible refusal | full rollback `rolled_back`; repeat `no_change`; refusals `blocked`; mutation calls zero on refusal |
| Route/failure matrix | Existing planner/adapter route matrix plus focused fallback/restore and structured failure table | caller routes exact; active boundary blocks; auth/conflict/missing/outdated/skew/route/worktree/ownership/session/quota/rate/provider/timeout/process/action categories remain finite |
| Sentinel/state hygiene | Strict desired parser plus JSON/human projection; mode-0600 local state/checkpoint writes | synthetic sentinel absent from results/renderers/implementation/run artifacts; owned files mode `0600` |
| File budgets | `wc -l` over runtime surfaces/tests/adapters | PASS: controller `297/300`; state `299/300`; output `128/220`; foundation adapter `196/350`; controller test `450/450`; all touched TypeScript <500 |
| Lock/scope/patch | baseline/current lock blobs, raw status/name-only, effect/no-rival/global-policy/sentinel scans, `git diff --check` | `deno.lock` unchanged at `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; four runtime implementation files + focused controller test + mandatory artifacts only; patch clean |

### Manual Archetype 6 Evidence

- F-1/F-10 and F-CLI-1/2: every touched file satisfies the locked layer/test caps; exact counts are
  recorded above.
- F-2: only Web Platform/Deno primitives and existing ports are used; no helper dependency or
  platform-wrapper reinvention was added.
- F-3/F-CLI-28: controller receives read/mutation dependencies explicitly; state/output remain pure;
  the only direct process effect is the existing `Deno.Command` in the foundation adapter.
- F-5/F-9: exported S4 functions have one-line JSDoc; no permission or package/public surface was
  widened.
- F-11/F-12/F-15/F-16/F-17/F-18 and F-CLI-19/21/25: no new folder, barrel, inheritance, registry,
  upstream re-export, generic folder, or naming violation.
- F-CLI-5/15/16/23/26: no presentation-side Deno effect, `Deno.exit`, long embedded template, or new
  console call. F-CLI package spine/composition/asset gates remain N/A for the approved functional
  internal-tool deviation recorded in Design.

### S4 Safety and Handoff

- Worktree/thread remain native ext4
  `/home/codex/repos/netscript-epic-574-pr0b-controller` and sole managed thread
  `019f4b72-2ea4-7050-917e-6d6918371265`; no rival sender was launched.
- No provider login, real session send, global-default mutation, dependency/lock/cache change, root
  format, S5 wrapper edit, or child-issue implementation occurred.
- Existing broad-format S5-wrapper drift remains unchanged. No new plan/architecture drift or debt.
- Next action: coordinator substantive Tier-A S4 review. This worker does not self-certify and does
  not start S5.

## Reconcile Note — S4

Issue #576 and draft PR #585 remain open at `status:impl` with the correct `Closes #576`,
`Part of #574`, milestone, and tooling/type/wave taxonomy. Both record coordinator sign-off `83f2f5d` and the
same locked S4 scope. S5 and #577-#582 remain explicitly unstarted.

## S4 Tier-A Remediation

### Corrections

- Successful owned apply now persists the value-free `PersistedRuntimeState` through the dedicated
  writer, including the loaded configure desired state, retained checkpoint ID, and
  `lastAppliedCommandId`. A controller-state write failure compensates completed actions; an
  applied-checkpoint write failure also restores the exact prior controller state.
- Checkpoints now retain each complete data-only action, canonical SHA-256 before/after identity,
  typed previous component/directory/desired-state/route metadata, and the previous controller
  state. Compensation receives that typed metadata directly; no action-ID fingerprint or
  string-split reconstruction remains. Rollback observes each owned resource and refuses
  `ownership_conflict` before mutation when its applied fingerprint has drifted.
- Fallback and restore commands carry the caller's current route. Configure and both route actions
  have exact rollback coverage; fresh `LocalRuntimeStateAdapter` reads prove configure persistence
  and restoration across adapter instances.
- A blocked apply renders its already-prepared plan. The #580 repair case observes once, produces
  only the owning `capability_deferred` diagnostic, and executes no mutation.
- Pre-plan reads use narrow stage catches: inspector `probe_failed`, persisted state
  `state_corrupt`, rollback checkpoint `invalid_checkpoint`, and desired input
  `invalid_state_file`. Adapter action diagnostics remain unchanged. Failed automatic and explicit
  compensation action results are `failed`, with `partially_rolled_back` retained.
- The canonical S2 CLI composition adds the new local owned-resource reader in one line and remains
  `149/150` LOC. No compatibility/S5 wrapper behavior changed.

### Replacement Evidence

| Gate | Exact command / outcome |
| --- | --- |
| Focused S4 | `deno test --allow-read --allow-write --unstable-kv .llm/tools/agentic/runtime/{contract_test.ts,planner_test.ts,controller_test.ts,adapters_test.ts}` — exit 0, `36 passed`, then focused controller replacement run `8 passed` |
| Complete runtime set | `rtk proxy deno test --no-lock --allow-read --allow-write --allow-env .llm/tools/agentic/agentic-lib_test.ts .llm/tools/agentic/wsl-foundation_test.ts .llm/tools/agentic/runtime/{contract_test.ts,planner_test.ts,controller_test.ts,adapters_test.ts}` — exit 0, `105 passed | 0 failed` |
| Scoped check | First run honestly failed on the newly required CLI `ownedResourceReader` composition; after wiring that existing local adapter, the identical wrapper selected 37 files and exited 0 with zero findings |
| Scoped lint / owned format | Locked wrappers selected 25 / 18 files; both exit 0 with zero findings |
| Live doctor repeat | Deno 2.9 in-memory harness ran `deno task agentic:runtime doctor --json` twice: exits `2/2`, statuses `degraded/degraded`, schema `1.0`, 16 components, timing-normalized semantic equality plus controller-state/source tree equality all `true` |
| Dry-run/tree and round trips | Full nine-command plan matrix reports `changed:false`, zero mutation events; controller test harness exit 0 with controller-state and source-tree hashes equal. Fresh local adapter configure apply/read/rollback/read succeeds |
| Rollback/failure/safety | Exact configure/fallback/restore inverses, external-change refusal, automatic/explicit failed compensation, stage classification, and adapter-diagnostic tests all pass; secret-field scan finds only the finite diagnostic vocabulary and its negative test |
| Budgets | CLI `149/150`; contract `220/220`; ports `218/220`; state `300/300`; controller `295/300`; output `185/220`; local adapter `349/350`; focused tests all <=450 |
| Patch/lock/scope | `git diff --check` passes; baseline/current `deno.lock` blob is `8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; no dependency, cache, provider login/send, global default, S5 wrapper, or #577-#582 implementation |

No new plan or architecture drift was introduced. The existing broad-format S5-wrapper drift is
unchanged. Next action is coordinator Tier-A re-review; this worker does not self-certify or start
S5.

## 2026-07-10 Planning-Only Antigravity Reconciliation

The owner replaced the future Gemini CLI component/research lane with Google Antigravity CLI
(`agy`). Historical S1-S4 Gemini observations and tests remain truthful evidence. No runtime
implementation changed in this pass.

The planned compatibility migration covers runtime contracts/state/planner,
foundation/local-state/provider/Gemini adapters, focused tests, and README. It must preserve
`~/.gemini`, normalize or explicitly reject persisted legacy `gemini` state, and avoid a `gemini`
executable alias. Official sources verify Google Sign-In and headless `-p`, but canonical-user auth,
structured output, complete exits, quota/subscription, search/fetch/citations, and instruction-file
behavior remain acceptance canaries owned by revised #578. S4 remediation, S5, and #578 stay paused
pending scope review.

## 2026-07-10 S4 Tier-A Remediation 2 — C5-C8 COMPLETE (generator evidence)

- C5 persists per-resource `pending`/`applied`/`compensated` progress. Partial checkpoints remain
  indexed and retryable; fresh ownership reads skip compensated resources, retry only proven applied
  resources, and refuse drift. Automatic and explicit partial-then-success tests assert checkpoint
  and controller-state authority.
- C6 binds typed prior component/directory/desired/route metadata to its canonical before
  fingerprint and re-observes every successful action before checkpoint advancement. False route
  identity, no-op action, mismatch, and probe failures have finite regression coverage.
- C7 explicitly blocks launch/resume/static-smoke apply with `capability_deferred` owned by #580;
  plan mode remains data-only. Foundation and local-state owned readers use the same canonical
  shapes as checkpoint construction. This narrows the earlier S4 lifecycle-apply claim without
  implementing #580.
- C8 maps ownership probe failures to `failed` and exit `5`; policy/safety conflicts remain
  `blocked`.

### Raw replacement evidence

| Gate | Command / raw outcome |
| --- | --- |
| Focused + complete runtime | `deno test --no-lock --allow-read --allow-write --allow-env --unstable-kv ...` — exit 0, `109 passed | 0 failed`; final controller probe run exit 0, 9 passed |
| Scoped check/lint/fmt | repo wrappers selected `37/25/18` files; all exit 0, zero findings |
| Doctor repeat | `deno task agentic:runtime doctor --json` twice — exits `5/5`, statuses `failed/failed`, timing-normalized outputs equal and dirty-tree hash equal. Exact diagnostic is `state_corrupt`: the owner-managed PR 0A foundation state contains future `antigravity` vocabulary; this slice intentionally does not migrate it. |
| C5-C8 matrices | 40 focused runtime tests cover partial retry, route binding, no-op/post-action verification, lifecycle #580 blocks, real local/foundation readers, rollback ownership, and probe exit `5`; all pass |
| Budgets | CLI 147/150; ports 220/220; state 300/300; planner 350/350; controller 300/300; local/foundation adapters 343/350 and 222/350; focused tests each <=450 |

No dependency, lock, provider login/send, daemon, Antigravity migration, S5, #578, or #584 change was
made. Coordinator Tier-A re-review remains required; this generator does not self-certify.

## 2026-07-10 S4 C7 Precedence Remediation

Tier-A found that provider deferral ran before lifecycle-apply ownership. `planLifecycleAction` now
checks apply mode first, so Gemini and OpenRouter launch/resume/static-smoke apply all return the
exact `blocked` / `capability_deferred` / owner `#580` / exit `4` contract. Plan-mode OpenRouter and
Gemini-live behavior remains owned by #577/#578, and all inspect/non-lifecycle behavior is unchanged.
Exact provider × lifecycle tests cover all six combinations. Gates and delivery evidence follow in
the remediation commit comment; coordinator re-review remains required. Complete agentic/runtime
suite: `109 passed | 0 failed`; scoped check/lint/fmt: `37/25/18`, zero findings; doctor repeat:
deterministic `5/5` `state_corrupt` with tree equality (previously recorded deferred owner-state
vocabulary); planner/test budgets `350/350` and `384/450`; `deno.lock` unchanged; secret scan clean.

## 2026-07-10 Owner Inline Review — Runtime Test Versions

The pending owner thread on `planner_test.ts` is addressed with one frozen, explicitly typed and
ordered test-only fixture, `RUNTIME_TEST_COMPONENT_VERSIONS`. Desired and observed planner state,
the matching contract fixture, and owned runtime adapter probes now derive from it. A scoped search
finds the three literal versions only in that fixture; historical foundation tests remain untouched.
An assertion locks key order and runtime immutability. Focused planner: `14/0`; complete suite:
`110/0`; scoped check/lint/fmt: `38/26/19`, zero findings. Production policy and behavior unchanged.

## 2026-07-10 Final Tier-A — Legacy Schema 1.0 Checkpoint Compatibility

Exact pre-S4 checkpoint JSON remains readable when `rollbackState` and `previous.desired` are
absent. Per-resource progress is derived only from the serialized checkpoint status. A missing
desired-state inverse is represented by the bounded `legacyInverseUnavailable: true` marker;
ownership inspection returns `rollback_refused` before fingerprint reads or mutation rather than
inventing prior desired state. An unrelated status command reads the legacy checkpoint summary and
returns `no_change`. Focused S4 runtime: `42/0`; complete suite: `111/0`; scoped check/lint/fmt:
`39/27/20`, zero findings. LOC caps and schema `1.0` remain intact; no dependency or lock change.

## 2026-07-10 Antigravity Compatibility Slice

Pre-flight confirmed foundation `faefbdf` and merge `998bb099` are ancestors of HEAD;
`origin/main...HEAD` is `0 behind / 38 ahead`, so no further rebase was required. Canonical runtime
vocabulary is now Antigravity/`agy`/`google-sign-in` and matches the merged probe surface. The
static adapter constructs only `agy --version`; live auth/quota/output/research remains #578
deferred. Exact legacy persisted `gemini` state migrates only when unambiguous; mixed state is
refused. No executable alias or credential policy was introduced.

Evidence: focused runtime `46/0`; complete agentic/runtime/foundation `123/0`; scoped
check/lint/fmt `40/24/21`, all exit 0. Alias/secret scans clean; lock unchanged at
`8694862878e6f9a430bf56497a4d5bf3f8eb1f3d`; LOC caps pass.

## 2026-07-10 S5 Compatibility Wrappers and Documentation

All five legacy task names remain mapped. The four orchestration scripts carry an explicit
one-cycle deprecation/retirement boundary; foundation remains the merged canonical wrapper. No
entry point was deleted or redirected to incompatible output. The compatibility matrix locks task
paths, accepted flags, shared-primitive delegation, and retirement markers. README documents the
canonical Antigravity boundary and separately reviewed #577-#582 retirement prerequisite.

Evidence: focused compatibility `2/0`; complete suite `125/0`; scoped check/lint/source-format
`41/28/28`, all exit 0. Doctor repeat exits `0/0`, status `no_change/no_change`, 18 components,
timing-normalized semantic equality and source-tree equality. Existing controller tests cover the
nine-command dry-run mutation matrix, secret sentinel, route, checkpoint, compensation, partial
retry, and rollback refusal contracts. No lock/dependency/cache or runtime behavior change.

## Final Generator Self-Review and DoD Handoff

Substantive review found no uncommitted source defect. Remaining `gemini` production strings are
restricted to the explicit legacy reader and merged foundation ownership probe ID. No executable
alias, `agy login`, provider login, global default, sender, or child capability exists.

DoD evidence is complete for stable JSON/human results, idempotent/version-aware planning, secret
exclusion, exact route identity, transition/failure tests, and retained thin wrappers. The final
Tier-A checkbox remains open for the Claude coordinator. Applicable internal-tool F-1/2/3/5/9/10/
11/12/15/16/17/18/19 and F-CLI-1/2/5/15/16/19/21/23/25/26/28 pass via locked LOC, bounded
contracts, explicit ports/adapters/renderers, scoped tests, and folder/scope inspection. Published-
package/public/composition/asset/registry-only gates are N/A under the recorded deviation. No debt
accepted; this generator does not self-certify.
