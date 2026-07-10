# Plan: PR 0B desired-state agentic runtime controller

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-epic-574-agentic-runtime-controller--pr-0b` |
| Issue / PR | #576 / draft #585 |
| Branch | `refactor/epic-574-agentic-runtime-controller` |
| Base | PR #584 sign-off `9b75470` |
| Phase | Plan-Gate passed; implementation authorized |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Plan-Gate Status

The owner waived external evaluator dispatch. Tier-A coordinator review passed every Plan-Gate item
and is recorded in `plan-eval.md`; implementation may proceed on the existing thread.

## Goal

Implement `deno task agentic:runtime <command>` as the single typed, idempotent, secret-safe
desired-state control surface over the existing WSL foundation and agent lifecycle tools. Preserve
existing commands as compatibility wrappers, make inspection/dry-run mechanically read-only, and
return explicit blocked/deferred results where child issues own live policy or reliability work.

## Scope

- Versioned discriminated unions for all #576 commands and one stable result envelope.
- A pure observe -> normalize -> plan pipeline over explicit desired and observed state.
- Ports/adapters for local state, process execution, the PR 0A foundation, Claude, Codex, Gemini,
  provider route validation, and mobile-control observation.
- Safe apply orchestration for capabilities #576 owns, with ownership-scoped checkpoints,
  compensation, explicit rollback, and stable failure classification.
- Human and JSON rendering from the same result object.
- Thin compatibility wrappers for foundation doctor/bootstrap/rollback-plan, Codex launch/resume/
  status, and Claude smoke.
- Unit/integration coverage for parsing, route identity, command construction, idempotence,
  read-only/dry-run behavior, redaction, state transitions, failures, compatibility, and rollback.

## Explicit Non-Scope / Child Boundaries

| Issue | Deferred capability | PR 0B boundary |
| --- | --- | --- |
| #577 | Native/OpenRouter profiles, presets, child-process credential injection, compatibility canaries | Validate a caller-supplied `RouteIdentity`; ship no provider preset/model matrix and accept no credential value. |
| #578 | Gemini 3.5 Flash grounded evidence acquisition and persisted citations | Inspect Gemini availability/auth only; generic launch/smoke capability reports `capability_deferred` until the evidence adapter lands. |
| #579 | Automatic quota detection, fallback selection/history, reset probes, and restoration policy | Support explicit caller-selected fallback/restore at a turn boundary without global-default mutation; no automatic policy or transition history. |
| #580 | Durable per-worktree sender ownership, safe daemon repair, reconnect reliability matrix | Expose `repair codex-remote` preflight and dry-run plan; live repair returns `capability_deferred` until #580 supplies the durable adapter. |
| #581 | Canonical lane/model policy, launcher enforcement, skill/template migration | Record and validate route identity structurally; do not encode canonical model values or rewrite harness docs. |
| #582 | Full WSL/provider/mobile/fallback/rollback canary campaign and promotion | Run PR 0B semantic smokes only; no universal rollout or promotion claim. |

GitHub/OpenHands lifecycle tools, Claude skill synchronization/hooks, Codex event waiting, provider
login, Windows mutation, and changes outside `.llm/tools/agentic`, `deno.json`, the agentic README,
and this run directory are excluded.

## Locked Architecture Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The canonical entry is `deno task agentic:runtime <command> [--json] [--dry-run]`; `repair codex-remote` is the only two-token command. | Matches #576 and gives one discoverable surface. |
| D2 | Commands are a closed discriminated union; results use controller schema `1.0`. | Exhaustive dispatch and stable machine parsing. |
| D3 | `DesiredRuntimeState`, `ObservedRuntimeState`, and `ReconcilePlan` are distinct types. | Prevents observed facts, desired policy, and mutation intent from collapsing into imperative code. |
| D4 | Planning is pure. Only `applyPlan()` receives mutation ports, and it is unreachable for inspection or `--dry-run`. | Makes read-only guarantees testable, not conventional. |
| D5 | `doctor` and `status` are always read-only; `--dry-run` forces `mode: plan`, `changed: false`, and zero mutation-port calls for every mutating command. | Direct owner requirement and closes current launch dry-run staging drift. |
| D6 | Controller state is machine-local, mode `0600`, value-free, atomically written, and schema-migrated from PR 0A ownership state. | Preserves rollback authority without exposing secrets or corrupting state. |
| D7 | CLI accepts identifiers and file paths, never credential/token values. Prompt/resume content uses files on the new surface; results record byte counts/fingerprints, not content. | Keeps secrets and sensitive prompts out of argv/logs/results. |
| D8 | Every adapter returns normalized finite observations/outcomes. Raw stdout/stderr is bounded, redacted, and never embedded wholesale in `RuntimeResult`. | Stable diagnostics and secret safety. |
| D9 | Route identity is explicit: agent, provider, model, effort, native worktree, and session/thread identity where applicable. Missing or contradictory fields are rejected before launch. | Meets #576 acceptance without pre-empting #577/#581 policy values. |
| D10 | No global provider/model defaults are mutated. Explicit fallback/restore occurs only at a new turn/session boundary. | Preserves #579 boundary and prevents opportunistic route drift. |
| D11 | Apply is transactional per owned action: checkpoint before mutation, execute in order, compensate reversible completed actions in reverse on failure, then report exact rollback outcome. | Safe failure and rerun semantics. |
| D12 | Rollback touches only resources named in a controller checkpoint/ownership manifest. Provider sessions, `~/.codex`, unknown files, and Windows Claude are never deletion targets. | Extends the proven PR 0A boundary. |
| D13 | Existing task names, accepted flags, JSON/human shapes, and exit codes remain stable through wrappers for one deprecation cycle. | Enables incremental migration and avoids breaking current supervisors. |
| D14 | Deferred live capabilities return `blocked` with `capability_deferred` and the owner issue. They never return success, mutate, or silently fall back. | Prevents false-done behavior while preserving the complete command schema. |
| D15 | Use Deno/Web Platform/existing agentic helpers only; add no dependency and do not change `deno.lock`. | Wrap, do not reinvent; no dependency need was found. |

## Command Contract

| Command | Required typed input | Effect owned in #576 |
| --- | --- | --- |
| `doctor` | optional agent/component filter | Read observations, compatibility, auth category, ownership-state validity, and capability availability. |
| `bootstrap` | optional desired foundation versions; otherwise PR 0A resolver | Plan/apply the existing user-local foundation idempotently. |
| `configure` | complete value-free desired-state file | Validate and atomically persist controller-owned desired state; never provider credentials. |
| `launch` | agent, `RouteIdentity`, worktree, prompt file, optional existing session rule | Validate route/worktree/handoff, then call the agent adapter if that capability is implemented. |
| `resume` | agent, route/session identity, worktree, message file | Resume the named session; never infer or create a rival session. |
| `smoke` | agent, route, static/live mode, optional prompt file | Run bounded capability checks; unsupported child capability blocks explicitly. |
| `fallback` | current session plus complete caller-selected fallback route | Start/resume only at a turn boundary; do not choose policy or change global defaults. |
| `restore` | configured desired route plus current session boundary proof | Restore explicitly at a new boundary; no automatic reset probe/history. |
| `status` | optional agent/worktree/session filter | Read controller state, observed routes, worktree, session, and mobile status. |
| `repair codex-remote` | worktree/session plus `--dry-run` or live | Read-only preflight and plan in PR 0B; live execution blocked on #580. |
| `rollback` | checkpoint ID; optional `--dry-run` | Reverse only controller-owned reversible actions; idempotent when already restored. |

All mutating commands support `--dry-run`. `doctor`/`status` reject `--dry-run` as redundant rather
than changing behavior. `--json` writes one JSON object to stdout; human diagnostics derive from the
same object. Usage errors and diagnostics go through the result contract once parsing can identify a
command; pre-parse syntax errors use a bounded usage message.

## Result and Failure Contract

`RuntimeResult` contains: `schemaVersion`, `commandId`, normalized `command`, `mode`, `status`,
`changed`, `desiredSummary`, `observedSummary`, `actions`, `diagnostics`, optional `route`, optional
`checkpoint`, and `timing`. It never contains credential values, prompt/message content, full env,
or unbounded raw process output.

Finite status values are `succeeded`, `no_change`, `planned`, `degraded`, `blocked`, `failed`,
`rolled_back`, and `partially_rolled_back`. Failure categories are locked in the Design checkpoint;
each diagnostic includes a stable code, category, retryability, bounded safe message, and optional
non-secret operator action. Compatibility wrappers map the new result back to their legacy exits;
the canonical entry uses `0` success/no-change/planned, `2` degraded, `3` invalid request/policy,
`4` blocked, and `5` execution/rollback failure.

## Desired-State and Rollback Semantics

- Desired state is value-free and declarative: foundation versions, required native path, agent
  readiness, explicit route identities, worktree/session constraints, mobile requirement, and owned
  configuration references.
- Observed state records normalized versions/statuses, route/session IDs, managed/mobile state,
  worktree safety, and ownership/checkpoint validity.
- Reconciliation compares typed values and emits ordered `RuntimeAction` intents. Equal state emits
  no actions. Planning never embeds executable closures or secret-bearing argv.
- Before apply, the state adapter atomically writes a checkpoint describing only owned resources,
  previous link targets/value-free config, action IDs, and fingerprints. No checkpoint exists for a
  dry-run.
- A failed action stops the plan. Completed reversible actions compensate in reverse order. The
  result distinguishes full rollback, partial rollback, and rollback refusal.
- Explicit rollback validates checkpoint schema and ownership, plans first, then applies. Repeating
  a completed rollback returns `no_change`. Unknown/unowned/irreversible resources block safely.

## Compatibility Strategy

1. Add the controller without changing legacy entrypoints.
2. Prove canonical results and adapter behavior.
3. Convert each owned legacy script to a thin parser/translator/renderer around the controller while
   preserving flags, JSON/human output, and exit codes.
4. Mark wrappers deprecated in the README only after compatibility tests pass.
5. Do not delete a wrapper in #576. Retirement occurs only after child policy/reliability work and
   rollout #582 confirm no callers remain.

## File and Scope Budgets

| Surface | Hard budget |
| --- | --- |
| `agentic-runtime.ts` CLI edge | <= 150 LOC |
| `runtime/contract.ts`, `runtime/ports.ts`, `runtime/output.ts` | <= 220 LOC each |
| `runtime/state.ts`, `runtime/controller.ts` | <= 300 LOC each |
| `runtime/planner.ts` | <= 350 LOC |
| each `runtime/adapters/*-adapter.ts` | <= 350 LOC |
| each new test file | <= 450 LOC |
| any touched TypeScript file | Archetype hard cap 500 LOC; if a legacy wrapper already reaches the cap, extraction must reduce it rather than deepen it. |

Implementation is limited to at most 18 new runtime TypeScript files, the five named compatibility
wrappers, their existing tests, `deno.json`, the agentic README, and mandatory run artifacts. More
than 25 touched implementation files, any new dependency, any edit outside the listed roots, or any
need to implement #577-#582 policy/reliability is a rescope stop.

## Commit Slices

| # | Slice | Proves | Exact gate | Planned files |
| --- | --- | --- | --- | --- |
| S1 | Contract, state, ports, and pure planner | Every command/result/failure/action/state is exhaustive; equal state plans no actions; secret-bearing fields are unrepresentable | focused runtime contract/planner tests + scoped check/lint/fmt | `runtime/{contract,state,ports,planner}.ts`, `runtime/{contract,planner}_test.ts`, run artifacts |
| S2 | Controller, renderers, foundation/local-state adapters, and read-only surface | `doctor`, `status`, bootstrap/configure dry-runs are stable and call zero mutation ports; PR 0A schema migrates safely | focused controller/adapter tests; doctor twice; dry-run state-tree equality; secret sentinel scan | `agentic-runtime.ts`, `runtime/{controller,output}.ts`, `runtime/adapters/{foundation,local-state,mobile-control}-adapter.ts`, `runtime/controller_test.ts`, `deno.json`, README, run artifacts |
| S3 | Agent/provider lifecycle adapters | Caller route identity is enforced; Codex launch/resume and Claude smoke use files; Gemini/provider/deferred capabilities block honestly | command-construction tests, worktree/route matrix, bounded static smokes, no second sender | `runtime/adapters/{codex,claude,gemini,provider}-adapter.ts`, `runtime/adapters_test.ts`, run artifacts |
| S4 | Transactional apply, explicit fallback/restore, rollback, and failure taxonomy | Owned actions checkpoint/compensate/idempotently roll back; deferred repair is read-only/blocked; every failure maps deterministically | state-transition/failure/rollback integration tests; synthetic-failure compensation matrix; lock/state hygiene | runtime controller/planner/state/adapters tests and only the files above, run artifacts |
| S5 | Compatibility wrappers and documentation | Existing command names/flags/output/exits remain usable while canonical task is primary | legacy compatibility matrix + full scoped/static/unit gate set + manual F-CLI review | `wsl-foundation.ts`, `launch-codex-slice.ts`, `codex-resume.ts`, `codex-status.ts`, `claude-remote-smoke.ts`, their tests, README, `deno.json`, run artifacts |

Five slices are ordered and below the harness limit. Every slice updates `worklog.md` and
`context-pack.md`, receives Tier-A substantive review before its sign-off commit, then is explicitly
pushed and commented before the next slice.

## Exact Gate Set

### Every implementation slice

1. Focused new/changed tests with `deno test --no-lock` and only required permissions.
2. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts --pretty`
3. Scoped lint wrapper over new runtime files and touched wrappers:
   `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts --include "(^|/)(runtime/|agentic-runtime|wsl-foundation|launch-codex-slice|codex-resume|codex-status|claude-remote-smoke)" --pretty`
4. The same include set through `.llm/tools/run-deno-fmt.ts` in check mode.
5. `git diff --check` and raw `git status --short`; `deno.lock` must be unchanged.

### Semantic controller gates before Tier-A handoff

- Full focused unit set: existing `agentic-lib_test.ts`, `wsl-foundation_test.ts`, and every
  `runtime/*_test.ts` file.
- `agentic:runtime doctor --json` twice: schema parses, observations remain semantically stable after
  removing timing, and repository/controller state is unchanged.
- Dry-run matrix for `bootstrap`, `configure`, `launch`, `resume`, `smoke`, `fallback`, `restore`,
  `repair codex-remote`, and `rollback`: mutation spy count `0`, `changed: false`, and before/after
  temp-state tree hashes equal.
- Secret-safety canary with synthetic sentinel values: sentinel absent from JSON, human output,
  diagnostics, checkpoint, and captured command arguments.
- Route matrix: missing provider/model/effort/worktree/session, conflicting identity, non-native
  worktree, dirty/wrong branch, and resume-without-thread all reject before execution.
- Failure/rollback matrix: auth required/conflict, unavailable/version skew, policy conflict,
  unsafe worktree, ownership conflict, active session, quota/rate-limit classification, timeout,
  process failure, corrupt state, deferred capability, full compensation, partial compensation, and
  repeated rollback.
- Compatibility matrix for each migrated legacy command: accepted flags, JSON/human required fields,
  and legacy exit codes.
- Manual Archetype 6 evidence for applicable F-1/F-2/F-3/F-5/F-9/F-10/F-11/F-12/F-15/F-16/F-17/
  F-18/F-19 and F-CLI-1/2/5/15/16/19/21/23/25/26/28. Non-applicable package/public/composition/
  asset/registry gates are recorded N/A with the internal-tool reason.

No root `deno fmt`, dependency-version query, publish/JSR gate, scaffold runtime E2E, provider login,
host sleep/network mutation, or child-issue rollout canary belongs to PR 0B.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A generic controller becomes another monolith. | Pure contract/planner first, named adapter files, exact LOC/touched-file budgets, rescope triggers. |
| Compatibility wrappers change behavior accidentally. | Golden semantic compatibility tests and one-cycle no-delete policy. |
| Dry-run performs staging or state writes. | Type-separated inspect/plan/apply path plus mutation spies and before/after tree hashes. |
| Raw provider/process output leaks secrets. | No credential CLI fields, bounded normalization, synthetic sentinel tests, no raw output in result/state. |
| Route validation encodes policy owned by #577/#581. | Validate completeness/consistency only; no built-in provider/model presets. |
| Fallback/restore expands into #579. | Explicit caller-selected turn-boundary operations only; no quota detection, default mutation, history, or automatic probes. |
| Repair expands into #580 or interrupts this thread. | PR 0B live repair is blocked; only preflight/dry-run contract ships. Never repair during this run. |
| Rollback removes user/provider data. | Ownership manifest/checkpoint allowlist; unknown paths block; session roots and Windows Claude excluded. |
| Controller schema breaks PR 0A callers. | Versioned compatibility reader, legacy wrappers, no removal, schema migration tests. |
| Existing 498-LOC foundation edge deepens AP-1. | Wrapper extraction must reduce it; any touched file >500 or adapter >350 fails the slice. |

## Open-Decision Sweep

| Decision | Status | Resolution |
| --- | --- | --- |
| Exact canonical provider/model presets | safe to defer | #577/#581; caller supplies a complete identity. |
| Gemini grounded evidence output | safe to defer | #578; adapter reports deferred capability for that operation. |
| Automatic fallback/reset policy and durable history | safe to defer | #579; PR 0B supports explicit turn-boundary commands only. |
| Live Codex repair implementation | safe to defer | #580; preflight/dry-run only, live blocked. |
| Universal rollout/promotion | safe to defer | #582. |
| Whether this plan is approved | resolved | Coordinator substantive Plan-Gate `PASS`; `plan-eval.md`. |

## Debt Implications and Rescope Triggers

No architecture debt is accepted by this plan. The internal-tool Archetype 6 deviation (functional
CLI, no published package/class spine) is inherited from PR 0A and explicitly documented, not a
claim that package gates passed. Stop and request rescope if implementation requires a dependency,
credential-bearing CLI option, global provider defaults, live daemon repair, automatic fallback
policy, provider login, more than 25 touched implementation files, any file above 500 LOC, or any
edit outside the owned roots.
