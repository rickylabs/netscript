# #184 Plugin RE-ARCHITECTURE v2 — research.md

Run-id: `chore-plugin-rearch-v2--184`. Base: clean `alpha.16` (`fc911ba1`,
`@netscript/plugin@0.0.1-alpha.16`). Issue: **#191**. Archetype: ARCHETYPE-5 (5 converged plugins)
+ feeders (`@netscript/plugin`, `packages/cli`, `@netscript/service`, `@netscript/aspire`,
`@netscript/kv`).

Provenance: the per-plugin analysis was produced by the #184 Claude analysis Workflow
(`wf_4d8ee812-f88`, 11 agents, ~14 min, 1.32M tokens): PHASE-1 5 parallel analyzers (1/plugin),
PHASE-2 5 adversarial doctrine/thinness critics (1/report), PHASE-3 1 synthesizer. Per CLAUDE.md the
Workflow is **analysis/planning ONLY** — it wrote no framework source and does not self-certify;
this is the supervisor-written artifact set, PLAN-EVAL-gated before any implementation.

## BASE-TRUTH CORRECTION (supersedes the synthesizer's "ground-truth note")

The synthesizer agent emitted a **blocking base-divergence alarm (its Q1)** claiming the live
`@netscript/plugin` was alpha.5 and exported only
`. ./abstracts ./config ./cli ./loader ./sdk ./testing ./templates` with **no**
`./service`/`./contract-base`/`./adapter`/`./scaffold` and no `createPluginService`/
`BASE_PLUGIN_CONTRACT_ROUTES`/`createPluginAdapter`. **That note is WRONG** — it was produced by the
synthesizer inspecting its OWN stale worktree (`chore/agentic-watch-turn-mode` @ alpha.5), not the
alpha.16 base the 5 analyzers read (`…/worktrees/plugin-rearch-v2/...`). This is the
`workflow-subagent-worktree-pin` / `audit-baseline-must-be-origin-main` landmine.

Supervisor-verified live base (`worktrees/plugin-rearch-v2`, HEAD `fc911ba1`,
`packages/plugin/deno.json`):

| `@netscript/plugin` subpath | target | status |
|---|---|---|
| `.` | root | exists |
| `./abstracts` | — | exists |
| `./adapter` | `./src/adapter/mod.ts` | **exists** (`createPluginAdapter` home) |
| `./config` | — | exists (generic `PluginManifest`/`*Contribution`/`inspectPlugin`) |
| `./cli` | — | exists (`PluginCli`) |
| `./loader` | — | exists |
| `./protocol` | `./src/protocol/mod.ts` | **exists** (runtime-launch contract, #183) |
| `./sdk` | — | exists |
| `./testing` | — | exists |
| `./templates` | — | exists (README template home) |
| `./contract-base` | `./src/contract-base/mod.ts` | **exists** (`BASE_PLUGIN_CONTRACT_ROUTES`) |
| `./service` | `./src/service/mod.ts` | **exists** (`createPluginService`) |
| `./scaffold` | — | **ABSENT — the one genuinely net-new subpath** |

**Resolution of the synthesizer's blocking questions:**
- **Q1 (base divergence) → RESOLVED.** Implementation base = `plugin-rearch-v2` @ alpha.16. The
  critiques (which saw alpha.16) were authoritative; the reports' alpha.5 framing is stale where it
  conflicts. Nearly all centralized seams already exist; the conformance work is mostly **deleting
  connector duplication and pointing at the existing seams**, plus building `./scaffold`.
- **Q2 (service-seam home) → RESOLVED.** `@netscript/plugin/service` physically exists and is the
  canonical home for `createPluginService`. (Whether it internally wraps `@netscript/service` is an
  impl detail the implementer confirms; the seam the connectors consume is `@netscript/plugin`.)
- **Q3 (contract-base symbol name) → RESOLVED.** Canonical name = **`BASE_PLUGIN_CONTRACT_ROUTES`**
  (+ `BASE_PLUGIN_ERRORS`), exported from `./contract-base`. Do not ship `BASE_PLUGIN_ROUTES`.

Net effect on scope: the genuinely NEW framework work is (1) **`@netscript/plugin/scaffold`**
typesafe-codegen subpath (D2), (2) tightening `definePlugin().build()` to return `PluginManifest`
(kills the per-connector `as unknown as *PluginManifest` cast), (3) `createPluginService` owning
**annotated router assembly + a contract-handler binder** (kills `AnyRouter` + the per-connector
`router-context`/`v1-types` split). Everything else is conformance = removing connector fat that
duplicates already-centralized machinery.

## Per-plugin confirmed smells (critique-survived)

### workers (FEATURE / Decision C — the FATTEST connector, the reference seam)
- **CRITICAL split engine**: the queue-backed engine (`class Worker` importing `@netscript/queue`+
  `@netscript/telemetry`, `class Scheduler` + scheduler-* splits, `job-dispatcher`,
  `job-runner-pool`, `queue-consumer`, `listener-supervisor`, `worker-idempotency-*`) lives in
  connector `worker/` (~2.3k LOC), exported as `./worker`. The engine must live in `-core`.
- `bin/{runtime,combined,worker,scheduler}.ts` re-implement start/registration orchestration that
  duplicates `-core` composition → become one-line `import.meta.main` shims bound to `./protocol`.
- Full oRPC router assembly + `AnyRouter` casts in `services/src/router.ts` + 8 per-route files.
- connector `streams/{server,factory}.ts` duplicate a streams layer; `src/cli/` (~1.65k LOC) holds
  command framework + registry codegen that is convention; `src/cli/composition/main.ts` convenience
  barrel; stray root `contracts.ts`, `test-api.ts`. The contract SEAM is already right — the failure
  is THINNESS, not seams.

### sagas (FEATURE / Decision C + B — evolved -core contract already adopted)
- **Base-reconcile first**: the sagas REPORT claims 6 missing files + a store layer-inversion; the
  CRITIQUE verified all six EXIST and stores are correctly in `-core` (no inversion). Implementer
  must confirm against live base; do NOT plan repairs for files that exist.
- Real smells: `src/runtime/mod.ts` ~110-line convenience barrel; `create-durable-saga-runtime`/
  `saga-runner`/`saga-supervisor` → `-core/application/durable`; `HttpSagaPublisher` →
  `-core/adapters/publisher`; `src/cli/**` + codemod + registry-generator → centralize;
  `services/src/saga-registry.ts` parallel KV `['saga','registry']` side-store → delete, read core
  runtime registry. KEEP connector `streams/{producer,factory}.ts` (host wiring) — report over-reached.

### triggers (FEATURE + proxy hybrid / Decision C + one raw HMAC route)
- ~13 `Triggers*` manifest types + `as TriggersPluginManifest` downcast → consume `PluginManifest`;
  `src/runtime/mod.ts` ~85-line barrel; `src/cli/**` codegen → core; embedded `streams/**` carries
  2 unsanctioned casts (`as never`, `as unknown as TriggersStreamDB`) → remove.
- **Aspire**: extend `@netscript/aspire` `AspireNSPluginContribution` — NOT a new `@netscript/plugin`
  aspire-contract (the report's single biggest error; critique-confirmed `@netscript/aspire` owns it).
- **Contract A11 trim (in `-core`)**: the 6 routes that throw `PENDING_BACKING`
  (`fireTrigger`/`testWebhook`/`previewSchedule`/`enableTrigger`/`disableTrigger`/`subscribeEvents`)
  — **see coordination with #181 below**; keep `describe`+`listTriggers`/`getTrigger`/`listEvents`/
  `getEvent`. Orphan scaffold samples (`generic-webhook.ts`, `webhook-validate-data.ts`, `jobs/`,
  `database/triggers.prisma`) are referenced by `scaffold.runtime.json` → MOVE into the core
  scaffolder, do NOT plain-delete (would red e2e). Keep exactly ONE raw HMAC route via `rawRoutes`.

### streams (PROXY/INFRA / Decision A — base-meta ONLY, NO served oRPC contract)
- **DELETE**: `src/adapter/resources/**` (fabricated 'notifications' scaffolder — A11/D2 violation);
  `src/public/stream-api.ts` (dead throw-only `defineStreamTopic/Producer/Consumer`) + the methods
  welded onto the manifest; `src/cli/**` (5 not-implemented commands); ~24 `@netscript/plugin` type
  pass-throughs + `PLUGIN_TYPES` re-export; local `Streams*Contribution`/`StreamsPluginManifest`;
  unused `StreamSchemaError` in `-core`.
- **DO NOT** add `contracts/v1` and **DO NOT** serve `BASE_PLUGIN_CONTRACT_ROUTES`: a `serveRpc:false`
  passive proxy cannot serve the oRPC describe route. The report's "blocked on missing base-seam" +
  "health hand-wired / info absent" claims are FALSE per critique:
  `createPluginService({serveRpc:false, healthChecks, rawRoutes, onShutdown})` ALREADY bakes
  `withHealth`+`withServiceInfo` (mounts `/health`, `/health/live`, `/health/ready`, `/` info without
  oRPC). KEEP `services/src/main.ts` largely as-is (CORS lists, upstream spawn, fetch-proxy are
  legitimately specific). Fix `scaffold.plugin.json` `capabilities.hasRoutes:false`; single-source
  port 4437.

### auth (FEATURE / Decision C — swappable-backend reference, thinnest on the engine axis)
- DELETE bespoke `services/src/routers/health.ts` (duplicates factory base-meta); fold
  `router-context`/`v1`/`v1-types`/`v1-helpers` into the core handler-binder; update doctor
  `/auth/health`→`/health` in lockstep.
- `backend-registry.ts` (~300 LOC): keep only `resolveActiveBackendName(env)`; push per-backend env
  construction into the 3 sibling packages as `create*BackendFromEnv(ctx)` so connector `backend.ts`
  is `siblings[name](ctx)`. **This widens 3 sibling packages — a breaking lockstep wave (see Q4).**
- Remove 8 hand-authored manifest types + `inspectAuth()` + the `AuthPluginManifest`
  precision-downgrade annotation; `streams/schema.ts` re-declarations of `AuthSession`/
  `AUTH_STREAM_EVENT_TYPES` (re-export core). KEEP `./adapter-cli`/`cli.ts` (marketplace dispatch
  #167 depends on it). The auth contract (named-annotated Zod, single sanctioned cast, no `any`) is
  EXEMPLARY — the model for the 2-cast/no-`any` rule; the `-core` curated root barrel is consistent
  with workers-core, trimming it is OPTIONAL/cosmetic and risks the README doctest.

## Coordination with #181 (Triggers feature-backing) — CRITICAL

#184's triggers report wants to A11-**remove** the 6 deferred routes from the `-core` contract;
#181 wants to **back** them with net-new `-core` runtime. These are directly opposed on the same
file (`packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts`). **Locked sequencing
(#181 L12 + this run):** #181 lands FIRST and backs the 6 routes; #184's triggers-conform slice then
runs against the post-#181 contract and does **NOT** remove the (now-backed) routes — it only applies
the thinness/manifest/Aspire/streams-cast deltas. The "remove the 6 fabricated routes" instruction is
**void** once #181 backs them; PLAN-EVAL must confirm this ordering. No concurrent open PRs touching
the 4 hot triggers files.

## Open questions carried to PLAN-EVAL (defaults locked by supervisor, overridable)

- **Q4 (auth sibling-widening) → DEFAULT: DEFER.** The breaking 3-sibling lockstep wave
  (`create*BackendFromEnv`) is split to a separately-gated follow-up sub-wave so connector-thinning
  lands first; recorded as new debt `AUTH-BACKEND-ENV-CENTRALIZATION`. (Lower-risk; the synthesis
  offered this as the explicit alternative.)
- **Q5 (skeleton retirement) → DEFAULT: YES.** `plugin new` (S9) on `@netscript/plugin/scaffold`
  typesafe codegen fully supersedes and DELETES `packages/plugin/src/templates/skeleton/*.template`
  (D2 bans string templates for the scaffold surface). Both must not coexist.
- **Q6 (domain-stream client home) → DEFAULT: connector-private, schema single-sourced in `-core`.**
  The browser StreamDB producer/factory stay connector-side (core cannot depend on host DB/client
  wiring); only the stream SCHEMA is single-sourced in the relevant `-core`. Do NOT lift producers
  into `@netscript/streams`.
- **Q7 (impl lane) → LOCKED.** Whole conformance program runs via WSL Codex daemon-attached slices;
  OpenHands is the separate PLAN-EVAL (minimax-M3) / IMPL-EVAL (qwen3.7-max) evaluator. (CLAUDE.md:
  framework source is never the Claude workflow.)

## References
Issue #191 (binding spec). Workflow output: `tasks/wwsdtnw9d.output` (full reports+critiques+
synthesis). Live base: `worktrees/plugin-rearch-v2/packages/plugin/deno.json`. #181 run:
`feat-triggers-feature-backing--181` (PR #192). Debt registry `.llm/harness/debt/arch-debt.md`.
