# fix(plugins): every declareHealthChecks returns only the API resource — a crash-looping background child leaves the declared health surface green — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-02 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:fix` `area:plugins` `area:aspire` `area:cli` `priority:p1` `status:triage` ·
**Depends on:** T4-06 (health URLs must resolve real allocated ports), T4-08 (the gate that consumes
this contract)

## Summary

Each first-party plugin contributes an API resource **and** a background child, but every
`declareHealthChecks()` implementation returns exactly one entry — always the API resource. The
background children (`workers-combined`, `sagas-runner`, `trigger-processor`) contribute no health
signal at all, and the liveness state that already exists in-process (`Worker.healthStatus`, the
listener supervisor's `restartCount`/`lastError`, the saga supervisor snapshot) is wired to nothing
Aspire, `plugin doctor`, MCP, or the dashboard reads. The consequence is the framework's most
expensive failure mode: a child that crash-loops on every start leaves the entire declared health
surface green. NetScript needs one declared child-liveness contract before any of that state can be
surfaced.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §5.1/§5.2 ("Highest leverage item in the audit:
  it is the *detector* whose absence lets the other defects ship"), §1.2, §3.2;
  `research/repo-audit/observability-aspire.md` §1.8, GAP-5; `SYNTHESIS.md` §1.4, §6 (T4 pack,
  "plugin child liveness" — no existing owner).
- `plugins/workers/src/aspire/workers-contribution.ts:77-86` — `declareHealthChecks()` returns one
  entry for `WORKERS_API_RESOURCE`. The background child is registered at `:55-61`
  (`addDenoBackground(WORKERS_COMBINED_RESOURCE, …)`) and has none.
- `plugins/sagas/src/aspire/sagas-contribution.ts:145-153` — one entry, `sagas-api`. The runner is
  registered at `:122-128` with none.
- `plugins/triggers/src/aspire/triggers-contribution.ts:147-155` — one entry, triggers API. The
  processor has none.
- `plugins/streams/src/aspire/streams-contribution.ts:48-55` — one entry at a hardcoded
  `http://localhost:4437/health`.
- Liveness state that exists and is unread: `plugins/workers/worker/worker.ts:140`
  (`get healthStatus()`), `plugins/workers/worker/listener-supervisor.ts:75-83` (`snapshot()` with
  `status`, `healthy`, `restartCount`, `lastError`).
- Asymmetric child health today: the **sagas** glue stub serves `/health` mapping the supervisor
  snapshot to 200/503
  (`plugins/sagas/src/adapter/resources/glue/runtime.stub.ts:19-30`) and the generated AppHost does
  probe it (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:79-86`,
  `isSagasBackgroundResource`). The **triggers** and **workers** glue stubs are bare
  `await startCombinedProcess();` shims with no HTTP surface at all
  (`plugins/triggers/src/adapter/resources/glue/runtime.stub.ts:16,19`;
  `plugins/workers/src/adapter/resources/glue/runtime.stub.ts:21,24`), and
  `generate-register-background.ts:90` special-cases triggers for something other than health.
- The declaration seam itself is unread in production: `composeAppHost` calls only
  `contribution.contribute(...)` (`packages/aspire/src/application/compose-apphost.ts:47`), and
  `composeAppHost` has no production caller — the real wiring is the CLI pipeline at
  `packages/cli/src/public/features/plugins/install/install-plugin.ts:502-512`.
- Adjacent: #1325 (triggers crash-loop that this blindness let ship), #1280 (`status:blocked`).

## Current surface

Three sources of truth, none joined. (a) `declareHealthChecks()` — declarative, API-only, and read
by nothing outside tests. (b) The generated AppHost — probes app/service resources via
`withHttpHealthCheck` and, for sagas only, the background child. (c) In-process supervisor state —
accurate, structured, and never leaves the process. `netscript plugin doctor`, the MCP tool surface,
and the dashboard therefore all report "the API answered", which is orthogonal to whether the child
that does the work is alive.

## Target contract

1. **A declared child state vocabulary.** Every plugin background child reports one of a closed set
   (proposed: `starting | ready | degraded | crash-looping | stopped | failed`) with, at minimum:
   process/child state, **registry readiness** (the generated registry module loaded and every entry
   registered), **dependency readiness** (KV/DB/upstream API reachable), `restartCount`, and
   `lastFatalError` (message + timestamp, redacted of secrets).
2. **One transport, generated.** Every KV-backed first-party background runtime serves the contract
   over the same route shape the sagas glue already uses, and the AppHost generator probes each
   child by rule — not by an `isSagasBackgroundResource`-style name special case.
3. **`declareHealthChecks()` becomes truthful or is removed.** Either the declaration seam is read
   by the production pipeline (and then declares children too), or it is deleted so plugin authors
   scaffolded from `new-plugin-use-case.ts:524-529` stop writing declarations nothing consumes. One
   source of truth, decided explicitly.
4. **Crash-loop and wrapper-alive/child-dead are explicit, not inferred.** `netscript plugin doctor`,
   the MCP health/doctor tools, and the dashboard each render a distinct, named state for
   "API resource healthy, background child dead" and for "child restarting above threshold" — never
   a single aggregate green.

## Acceptance

- [ ] Every first-party plugin background child reports the declared child state vocabulary.
- [ ] The AppHost generator probes every background child by rule, with no per-plugin name special
      case.
- [ ] Child readiness includes registry load and dependency reachability, not just process
      liveness.
- [ ] `restartCount` and the last fatal error are exposed on the child health payload.
- [ ] `plugin doctor`, the MCP health surface, and the dashboard each render "child dead, API alive"
      as its own state.
- [ ] A crash-looping child moves to a `crash-looping` state within a documented threshold rather
      than flapping between ready and failed.
- [ ] `declareHealthChecks()` is either consumed by the production pipeline or removed, and the
      plugin-authoring scaffold matches that decision.
- [ ] A negative test proves a deliberately crash-looping background child turns the health surface
      red.
- [ ] A negative test proves an API resource healthy with its child stopped is reported as degraded,
      not healthy.
- [ ] Tests cover startup race, registry load failure, dependency-unavailable, restart storm, and
      clean shutdown.

## Boundaries

- **#1280 is a different problem and is blocked upstream.** It covers *backing* services (Postgres,
  Redis/Garnet, Deno KV) whose images serve no health route and for which Aspire's TypeScript
  AppHost cannot register custom checks. This issue covers **NetScript-authored plugin children**,
  which run our own Deno entrypoint and can serve whatever route we generate. Do not re-litigate
  #1280, do not mark it satisfied by this work, and do not propose generated probes against backing
  images here.
- **#1325** owns the triggers KV-adapter omission itself (the defect); this issue owns the detector
  contract. **T4-08** owns wiring the E2E gate to that contract. Neither substitutes for the other.
- **#828 / #512 / #937** (process-manager PM-B supervised-child helper, PM-1 process-graph state
  vocabulary, doctor frontend five-state taxonomy) own bare-metal supervision and the frontend
  doctor taxonomy. Reuse their vocabulary where it fits, but do not re-file their scope or block on
  the process-manager epic — this contract must ship under Aspire-hosted plugins first.
- **#734 / #429-#431** (dashboard panel contributions) consume this surface; they do not define it.
- Backing-service health, plugin discovery of third-party factories (#1093), and the streams
  durability decision (T4-03) are out of scope.

## Docs/consumer proof

`docs/site/orchestration-runtime/**` gains one page describing the child state vocabulary and what
each state means operationally, generated from the exported type rather than hand-written. Consumer
proof: on a scaffolded project, stopping a background child makes `netscript plugin doctor` exit
non-zero and names the child — reproducible in the installed-consumer smoke (#1343) without reading
container logs.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. All code claims re-verified
against worktree baseline `fac9e339042c`; the sagas-child-probes-but-others-do-not asymmetry was
found during this verification and is newer than the Stage-B audit text.
