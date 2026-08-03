# Prior-run distillation — plan-unified-runtime--seed as evidence base

Source: full read of `/home/codex/repos/wt-g8-seed/.llm/runs/plan-unified-runtime--seed/`
(branch `plan/unified-runtime`, worktree wt-g8-seed) by an Opus 4.8 research sub-agent of this run,
2026-07-18. All paths below are relative to that run dir unless repo-rooted. The supervisor
(Fable 5) additionally read `adversarial-nitro-vs-own.md` and `nitro-vs-own-synthesis.md` directly.

**Orientation.** The prior run (#824) designed a Nitro-v3-hosted "unified runtime" board
(UR-0…UR-12 + DD-RESEARCH), passed Stage-G PLAN-EVAL (`plan-eval.md:63` `PASS`), but was
drafts-only, never filed (`supervisor.md:28-34`, `plan-eval.md:47`). A later adversarial
nitro-vs-own pair proposed pivoting away from Nitro-as-host toward NetScript-owned provider
adapters behind a new `@netscript/deploy` package — the seed of the owner's ratified deploy-plugin
direction. The canonical UR bodies were never re-branched for that pivot
(`adversarial-nitro-vs-own.md:43-49`; `nitro-vs-own-synthesis.md:30-32`).

## 1. What UR proposed (per canonical doc + slot-map)

13 UR slots (UR-0…UR-12) + non-slot successor DD-RESEARCH; all at milestone `0.0.1-beta.13`
(`slot-map.md:11-28,68-73`). Owning packs: D1 composition-host, D2 capability-matrix, D3
board-mechanics.

- **UR-0 — Hostable-service lifecycle contract.** NEW prerequisite (Stage-F F5). `build`/`start`/
  `stop` surface (or `[Symbol.asyncDispose]` handle) a host drives without owning a listener;
  reuses shipped `ServiceShutdownCoordinator` policy (idempotency, `AbortController`,
  `DEFAULT_DRAIN_TIMEOUT_MS = 30_000`, LIFO teardown, `ShutdownReport`) (`UR-0.md:31-44`; cites
  `packages/service/src/builder/service-builder-impl.ts:423-432,501-521`, `service-shutdown.ts`).
  **REUSABLE** — host-neutral lifecycle; only the "Nitro `close` hook drives stop" framing is
  Nitro-tied (`UR-0.md:42-44,61`).
- **UR-1 — Single logical composition root / no application-created loopback** (`UR-1.md:3,17-24`).
  Universal invariant = "logical graph identity — one composition root"; physical single-process is
  a per-preset capability; cross-preset rule = "no application-created loopback" (in-process Fetch
  delegation, never a socket back to the host listener). **REUSABLE verbatim**
  (`research/nitro-vs-own-rev2.md:168`).
- **UR-2 — Nitro owns listener/lifecycle; single-shot `close` disposal** (`UR-2.md:3,18-26`).
  "Nitro owns process startup, the single listener, top-level `error` observation, and shutdown."
  **DEAD-SHAPE / must be REPLACED** — the load-bearing "Nitro is the host" card; rev1/rev2 replace
  it with a NetScript host-runtime port + optional `NitroHostAdapter`
  (`research/nitro-vs-own.md:104`; `research/nitro-vs-own-rev2.md:169`).
- **UR-3 — Mount Fresh via `app.handler()`** (`UR-3.md:19-27`). Fresh as an opaque Fetch delegate,
  never `app.listen()`; disjoint route spaces (RPC / health / Fresh-UI / static); F-5 static-asset
  ownership fork. **REUSABLE if generalized** to a host-neutral Fetch/static contract.
- **UR-4 — In-process oRPC host bridge over `ServiceApp.fetch`** (`UR-4.md:19-40`). Web `Request`
  into `ServiceApp.fetch` / oRPC `RPCHandler` (`packages/service/src/primitives/handlers.ts:115-143`);
  "invocation placement over a stable Fetch/RPC contract — 'no socket loopback' is the requirement;
  a second codec is not." Host-side bridge ONLY — subset of #451's SDK transport surface, no
  `Closes #451`. Forks F-7 (SDK↔service dependency direction), F-4 (WebSocket scope). **REUSABLE**.
- **UR-5 — Capability manifest + build-time rejection compiler + per-preset sagas**
  (`UR-5.md:19-38`). Machine-readable manifest per cell: per-capability
  `lossless | partial | unsupported` + saga declaration + writer/offline flags; a composition
  compiler cross-checks the app's logical-graph requirements and **fails the build** (never
  runtime, never silent downgrade) on `unsupported`, warns on `partial`. Sagas rule:
  `sagas: supported | externalized | rejected` per cell. **REUSABLE but rename** preset→target
  capability manifest (`research/nitro-vs-own.md:102`; `research/nitro-vs-own-rev2.md:170`).
- **UR-6 — Runtime-cell columns: three v1 cells + conformance suite** (`UR-6.md:22-54`). v1 = C1
  `deno_server` (Node-built, `deno run --unstable`), C3 `node_server`, C4 `cloudflare_module`.
  `deno_deploy` (C2) WITHDRAWN from v1 (Classic/deployctl sunset 2026-07-20; new platform lacks
  Deno queues) → DD-RESEARCH. Pins exact Nitro version + compatibility-date + upgrade-drift gate.
  **DEAD-SHAPE for a plugin** — cells are Nitro presets; rev2 replaces preset columns with
  emitter/provider cells (`research/nitro-vs-own-rev2.md:171`).
- **UR-7 — Writer-ownership & exclusive-lock database capability** (`UR-7.md:19-32`). Long-lived
  cells may hold an exclusive lock; bounded-window cells mark it `unsupported in-cell`. "Default
  embedded" (single-writer Turso) must not silently override topology. KEEP #453. **REUSABLE**.
- **UR-8 — Offline-sync as a database-target capability/profile** (`UR-8.md:19-30`). Turso Sync as
  `profile`/`n/a` per cell, not a runtime invariant. KEEP #455. **REUSABLE**.
- **UR-9 — KV/queue/cache ownership + durability behind NetScript ports** (`UR-9.md:19-34`).
  `KvStore`, `MessageQueue`, `DatabaseAdapter` stay authoritative; Nitro unstorage/db0/task/ocache
  are host bindings behind the ports, never exposed to app code. "volatility is removed from the
  definition of 'in-process'." **REUSABLE** — core leaf-port ownership
  (`research/nitro-vs-own-rev2.md:109-119`).
- **UR-10 — Single-process realization capability** (`UR-10.md:19-33`). One-OS-process /
  zero-loopback guarantee only for cells declaring `process: in-process`; cloud/serverless
  guarantee logical composition only. KEEP #454. **REUSABLE**.
- **UR-11 — Architecture contracts** (`UR-11.md:18-45`). NEW prerequisite (Stage-F F14): package/
  file ownership + JSR export map for the host package; archetype selection + per-package
  fitness/JSR/E2E gate matrix; composition-compiler requirement/manifest types + build/CLI seam;
  naming normalize to `@netscript/database` (retire `@netscript/data`); migration/JSR text-import
  policy. Blocks UR-1/UR-4/UR-5. **HIGHLY REUSABLE** — where a plugin package boundary would be
  named; rev2 expands it to decide/extract `@netscript/deploy` + dependency direction +
  emitter/provisioner separation (`research/nitro-vs-own-rev2.md:172`).
- **UR-12 — Epic acceptance + supersession reconciliation** (`UR-12.md:19-30`). Three-cell matrix
  green; #451/#453/#454/#455 KEEP-open. Acceptance wording Nitro-tied; rev2 rewrites to "prove the
  three cells and that Nitro is absent from the public composition/leaf contracts; optional
  emitters must be droppable" (`research/nitro-vs-own-rev2.md:173`).
- **DD-RESEARCH — new-platform Deno Deploy probe** (`DD-RESEARCH.md:19-41`). `0.0.1-stable`;
  depends on the conformance harness; must prove a real build+deploy+conformance on `deno deploy`
  (not deployctl) with external queue/DB bindings before `deno_deploy` re-enters. **REUSABLE as a
  probe card** regardless of host shape.

**Reusable-vs-dead summary:** REUSABLE = UR-0, UR-1, UR-4, UR-5, UR-7, UR-8, UR-9, UR-10, UR-11,
DD-RESEARCH (rev2:168 lists UR-0/1/3/4/7/8/9/10 as "survive in intent"). DEAD "giant unified
package + Nitro-host" shape = UR-2 (Nitro-owns-listener), UR-6 (Nitro-preset cells), and the
Nitro-specific acceptance wording in UR-3/UR-12.

## 2. Nitro v3 facts (`research/nitro-v3.md`, `evidence/nitro-v3-live-2026-07-18.md`)

- **Maturity:** public beta with intentional breaking changes; migration guide a "living beta
  document" (`research/nitro-v3.md:20`). Built on Web Standards, Rolldown, Vite 8, Node.js 20
  minimum toolchain (`evidence/nitro-v3-live-2026-07-18.md:9-11`). Verdict: "a credible
  host/output substrate, but not yet a production-grade replacement for NetScript's durable
  adapters" (`research/nitro-v3.md:7-8`). No explicit license text captured in corpus.
- **Build:** Rolldown/Vite backend build — route compilation, splitting, tree shaking, HMR,
  normalized `.output` directory. Nitro's real value = "backend build plus changing provider
  artifact/event conventions" (`research/nitro-vs-own.md:36-38`).
- **Presets:** default production output is a Node server; dev is always `nitro-dev` (Node/ESM
  worker) (`research/nitro-v3.md:23`). Preset via `NITRO_PRESET`/config; compatibility dates pin
  provider behavior. Auto-detected: AWS Amplify, Azure, Cloudflare, Firebase, Netlify, StormKit,
  Vercel, Zeabur (`research/nitro-v3.md:40-41`).
- **Deno support:** `deno_server` preset is **built using Node.js**, then launched
  `deno run --unstable ... .output/server/index.ts` — "'Deno preset' does not mean a Deno-only
  build pipeline or stable-API-only artifact" (`research/nitro-v3.md:21`). `deno_deploy` preset
  targets Classic (sunset).
- **Runtime surface maturity** (`research/nitro-v3.md:27-34`): db0 SQL layer experimental; KV
  default mount in-memory (loses data on restart); ocache GET/HEAD-only cache "Nitro-native win"
  but distinct from durable KV; tasks experimental — "not, by itself, a durable queue, retry
  ledger, workflow engine, or saga store"; static files run before middleware/routes; plugin
  registration synchronous.
- **Integration conclusion:** rev1 HYBRID: "NetScript owns the composition root, runtime
  contracts, and deploy-target port; Nitro is an optional, replaceable output-emitter/host
  adapter" (`research/nitro-vs-own.md:9-11`). Decision rule: "own the semantics; rent the volatile
  provider translation" (`research/nitro-vs-own.md:122`). Nitro never enters the composition
  contract or leaf ports (`nitro-vs-own-synthesis.md:11-13`).

## 3. Adapter-limit findings — why true cloud-agnosticism fails

- **General principle:** provider primitives are capability-scoped backings at most; each is "a
  FEASIBILITY question, not a mapping exercise" (`nitro-vs-own-synthesis.md:15-17`). Master
  Nitro↔NetScript-port L/P/U grid: `research/adapter-mapping.md:17-33`; adapter boundary at
  `:37-42`.
- **Cloudflare Workers KV:** eventually consistent, "explicitly unsuitable for atomic
  operations/transactions"; cannot back CAS-dependent saga/trigger/idempotency state → rejected by
  capability (`adversarial-nitro-vs-own.md:23`; `research/nitro-vs-own-rev2.md:78`).
- **Cloudflare Queues:** guaranteed delivery, batching, retries, delays, DLQ, pull consumers
  (`evidence/nitro-vs-own-rev2-live-2026-07-18.md:45-46`) — close to `MessageQueue`, BUT push
  consumer is an invocation-time `queue(batch)` handler vs `MessageQueue.listen()`'s caller-owned
  long-running loop with drain/stop/`AbortSignal`; batch retry redelivers successful records
  unless individually acked (`adversarial-nitro-vs-own.md:23`).
- **Cloudflare Durable Objects:** strongly-consistent attached storage + alarms, but storage is
  private to one object instance while `SagaStorePort` needs optimistic saves, transition history,
  cross-instance correlation index (`packages/plugin-sagas-core/src/ports/saga-store-port.ts:22-48`)
  → dedicated adapter + saga-store proof, not a generic KvStore substitution.
- **AWS Lambda:** [BLOCKER] Lambda Web Adapter proves only an HTTP sidecar + raw-event tunnel
  ("merely POSTs the raw Lambda event JSON to a local `/events` HTTP endpoint", "no runtime
  hooks"); no SQS polling, `ReportBatchItemFailures`, per-record ack/nack, visibility-timeout, or
  any `MessageQueue`/saga port (`adversarial-nitro-vs-own.md:7`). SQS is at-least-once with
  duplicates; partial-batch reporting required (`evidence/nitro-vs-own-rev2-live-2026-07-18.md:56-59`).
- **Nitro tasks:** no attempt ledgers, backoff, ack/nack, DLQ; "Nitro is execution plumbing;
  NetScript remains the durability/control plane" (`research/adapter-mapping.md:25`).
- **Net:** per-provider standards (KV consistency, queue consumer model, saga storage) cannot be
  flattened into one agnostic adapter → capability negotiation + build-time rejection (UR-5
  mechanism) rather than a universal backing.

## 4. Deno Deploy (new) facts (`research/deno-deploy-new.md`, `evidence/deno-deploy-new-live-2026-07-18.md`)

- Classic (`dash.deno.com`) + subhosting v1 shut down **2026-07-20**; projects not
  auto-transferred; new platform at `console.deno.com`, Deno 2.0 environment + new
  application/build model (`evidence/deno-deploy-new-live-2026-07-18.md:10-12,24`).
- `deployctl` sunset; supported path is `deno deploy` / `deno deploy create`
  (`evidence:13,43`).
- Runtime requires built-in `Deno.serve()`; legacy std `serve()` fails warmup (`evidence:14`).
- **Queues UNSUPPORTED**: `Deno.Kv.enqueue()`/`listenQueue()` unavailable; official alternative =
  external MQ or DB-backed job queue (`evidence:15`) — cannot satisfy `MessageQueue` natively
  (`research/deno-deploy-new.md:50-58`, cites `packages/queue/ports/message-queue.ts:39-133`).
- DB/KV supported: assigned Deno KV (`Deno.openKv()`), managed Prisma Postgres, or linked external
  DB; `Deno.cron()` remains supported (`evidence:18,53-58`).
- Build contract: one app = one web service + one build config; install/build → artifact → warmup
  request → route revision (`evidence:37-44`). **GitHub monorepos not yet supported** — this repo
  is a monorepo (`research/deno-deploy-new.md:43-47`).
- Verdict: "C2 is not provable for v1 from current evidence" (`research/deno-deploy-new.md:94-96`).

## 5. Market landscape (`research/market.md`, `evidence/market-frameworks-live-2026-07-18.md`)

Cross-market pattern: "one source/application model, multiple target adapters, and a generated
artifact whose topology may differ by target" — target translation lives at an adapter/preset
boundary, not in app routes (`research/market.md:19-27`).

- **Nuxt/Nitro:** named presets; boring default `.output/server/index.mjs`; escape hatch
  `node_cluster` (`research/market.md:10`).
- **Next.js standalone:** `output: "standalone"` → minimal `server.js` + output-file-traced deps;
  monorepos need `outputFileTracingRoot` (`research/market.md:11`). Lesson: self-describing
  minimal artifact via dependency tracing.
- **React Router 7:** adapter contract = host request → Web Fetch `Request` → framework handler →
  `Response`; official adapters Node, Express, Cloudflare (`research/market.md:12`). Lesson: thin,
  independently-testable Web Request/Response adapters.
- **SvelteKit:** small build adapters per target (`adapter-node`, adapter-auto);
  env/proxy-trust/graceful-shutdown explicit operator inputs (`research/market.md:13`). Lesson:
  provider selection at the build boundary + generic-server fallback.
- **Redwood:** static web vs API separated; Docker path runs web and API as distinct units.
- **Wasp:** production = Node server + static client + PostgreSQL, separately deployable;
  generates a server Dockerfile.

Four steal-able rules (`research/market.md:29-49`): (1) stable Fetch handler boundary (shipped
`FetchHandler`, `packages/service/src/types.ts:206-212`); (2) target presets = pure declarations
of capabilities/artifact-shape/ops requirements; (3) emit a manifest (entrypoints, assets, traced
deps, migrations, durable resources, schedules, sidecars, shutdown/health); (4) "single" and
"multi" = two realizations of one logical graph. NetScript differentiator = a "capability-checked
composition graph" (`research/market.md:52-68`).

## 6. Sagas constraint (`research/sagas-constraint.md`)

- `SagaDefinition` is not "a background function": durability tier, initial state, handled message
  types, correlation rules, handlers, compensations, signal/query handlers, retry, concurrency,
  optional schedule (`research/sagas-constraint.md:31-33`). Ports: `SagaStorePort`,
  `SagaTransportPort`, `SagaOutboxPort`, `SagaIdempotencyPort` (`:37-45`).
- Verdict: "STALE as a categorical exclusion; VALID as a 'Nitro does not implement saga semantics'
  warning" (`:53`). Long-running targets can mount the shipped saga runtime in-process; naive
  substitution by tasks discards correlation/transitions/compensation/retry/idempotency/outbox
  (`:60-64`).
- Deploy constraint: preset-conditional — serverless/isolate outputs must prove activation,
  execution window, storage/transport connectors, and shutdown satisfy the chosen
  `SagaDurabilityTier`, else **reject at build time** or route to a macro-service (`:66-71`).
  Board rule (`:74-87`): in-process only via the NetScript saga runtime; each target declares
  `sagas: supported | externalized | rejected` and proves it; "externalized" = macro-service split
  of the same app model, never a silent downgrade.

## 7. Adversarial verdicts

**Round A — Stage-F review of the UR board** (`adversarial-findings.md`: 17 findings, 9 BLOCKER /
6 MAJOR / 2 MINOR; all ACCEPTED). Load-bearing: F1 `deno_deploy` cell validates a shutting-down
platform → C2 withdrawn; F2 folding #451 into UR-4 would falsely close #451 → host-bridge-only;
F3 preserve #453/#454 desktop realization contracts; F4 #455 offline-sync KEEP; F5 "the proposed
Nitro host path bypasses shipped service startup/shutdown semantics" → UR-0 created reusing
`ServiceShutdownCoordinator`. Recheck: 13/17 RESOLVED; PLAN-EVAL `PASS` (`plan-eval.md:51-63`).

**Round B — nitro-vs-own pair** (Sol·max: 3 BLOCKER / 3 MAJOR / 1 MINOR — ALL ACCEPTED):

- F1 [BLOCKER] AWS citation proves an HTTP sidecar and raw-event tunnel, not a native AWS provider
  family.
- F2 [MAJOR] "Official Cloudflare tooling is Deno-compatible" ≠ cheap Deno-native build path —
  it is provider-owned Node tooling callable from Deno; Miniflare fidelity limits omitted.
- F3 [BLOCKER] Provider primitives do not satisfy queue/saga contracts at claimed depth.
- F4 [MAJOR] Estimates are arithmetic assertions without work breakdown; exclude live-target
  conformance their own acceptance rule requires.
- F5 [MAJOR] `@netscript/deploy` specified as both neutral core and cross-domain god-object;
  `ResourceBindingResolverPort` / `ActivationRouterPort` absorb leaf concerns; dependency-cycle
  risk; conflicts with doctrine AP-3/AP-9 (`adversarial-nitro-vs-own.md:35-41`).
- F6 [BLOCKER] Rev2's UR delta table is not a filable branch — canonical bodies Nitro-specific
  throughout; provider-native HYBRID needs a full canonical re-branch + new adversarial/PLAN-EVAL.
- F7 [MINOR] vercel-deno is research-only (20 commits / 11 stars / no releases at review).

**Stable ground surviving all rounds (`nitro-vs-own-synthesis.md:8-19`):** (1) owner decision RULE
ratified: "per target, the provider-native wrapper wins over a Nitro preset iff it passes the same
conformance suite, exposes every required native binding/event/config surface, and costs less to
maintain"; Nitro never enters the composition contract or leaf ports; whatever emits, emits behind
the NetScript-owned deploy/emitter port. (2) NetScript ports authoritative; provider primitives
capability-scoped backings. (3) Docker-image long tail (Koyeb/Sevalla/Coolify/Dokploy/Fly.io) =
thin adapters on the existing Aspire/Docker lane (#346 lineage).

**Unresolved owner fork N1** (`nitro-vs-own-synthesis.md:34-51`): N1-A file locked board + probe
cards (CF-PROBE, AWS-PROBE, DEPLOY-ARCH); N1-B full provider-native re-branch. The owner instead
ratified the deploy-plugin direction — effectively N1-B formalized as a plugin (this run).

## 8. Already-plugin-shaped material

`research/nitro-vs-own-rev2.md §3` "Proposed `@netscript/deploy`" (`:100-146`) anticipates the
plugin decomposition:

- Move deploy domain out of CLI into a callable Archetype-2/7 core; CLI stays the Archetype-6
  presentation router — "one stable port, one adapter per target, and a thin CLI router"
  (`:20-23,124-127`, citing `docs/architecture/doctrine/06-archetypes.md:257-299`).
- Suggested surface (`:130-141`): `DeploymentPlan`/`DeploymentCell` (declarative physical
  topology); `CapabilityRequirement`/`CapabilityManifest` (reuses UR-5); `DeployTargetPort`
  (`plan/emit/up/down/status/logs/rollback/secrets` — extracts shipped
  `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:1-128`); `ArtifactEmitterPort`;
  `ResourceBindingResolverPort`; `ProvisionerPort`; `ActivationRouterPort`;
  `DeployTargetRegistry` (extracts `packages/cli/src/kernel/extension-points.ts:23-37`).
- Dependency direction (`:143-146`): "leaf packages define semantic ports; provider adapter
  packages depend on those ports; `@netscript/deploy` composes adapters and resource declarations;
  CLI depends on deploy. `@netscript/deploy` must not absorb KV/queue/saga behavior or become a
  cloud god-object." ⚠ Adversarial F5 flagged this exact surface as a potential god-object with a
  cycle risk — the plugin redesign must supply the explicit package/import graph the rev2 sketch
  lacked.
- Leaf ownership (`:109-119`): `@netscript/kv`, `@netscript/queue`, `@netscript/database`,
  workers/sagas/triggers/streams cores, service/Fresh/oRPC one Fetch host contract. "The provider
  name is an extension axis, not a replacement domain" (`:98`).
- Per-cloud capability sketches: Cloudflare table (`:76-81`), AWS narrative (`:84-93`); per-target
  v1 recommendation table (`:150-159`). N1-A feasibility cards (CF-PROBE / AWS-PROBE /
  DEPLOY-ARCH) are pre-drafted plugin-work cards (`nitro-vs-own-synthesis.md:40-44`).
- Doctrine anchors: `06-archetypes.md:119-145,257-299`; `07-composition-and-extension.md:15-37,70-76`;
  `08-runtime-state-failure.md:17-25`; `02-public-surface.md` + `09-anti-patterns...md` AP-3/AP-9.

## 9. Evidence freshness

All corpus research/evidence dated **2026-07-18** (same day as this run). Deno Deploy Classic
sunset 2026-07-20. Prior-run baseline `origin/main @ 56cf84b5`; PR #822 frame at head
`49bd014f...`. Committed evidence extracts under `evidence/` with `SHA256SUMS` (verified in the
prior run's PLAN-EVAL): nitro-v3, deno-deploy-new, market-frameworks, orpc-fresh (oRPC v2 beta
banner; repo pins `^1.14.6`), netscript-deno-doc (11 `deno doc --filter` runs), pr822-frame,
nitro-vs-own live + rev2 live (Cloudflare Workers/Wrangler/Vite/Miniflare/Queues/DO/KV docs, AWS
Lambda Web Adapter, SQS docs, lowlighter/vercel-deno, Denoflare, Vercel Build Output API).
Freshness caveats: Nitro v3 / oRPC / Fresh are mutable beta URLs.

## Key load-bearing quotes for reuse

- "logical graph identity — one composition root" + "no application-created loopback"
  (`UR-1.md:20-24`).
- "invocation placement over a stable Fetch/RPC contract" (`UR-4.md:23`).
- Owner rule: "the provider-native wrapper wins over a Nitro preset iff it passes the same
  conformance suite, exposes every required native binding/event/config surface, and costs less to
  maintain" (`nitro-vs-own-synthesis.md:9-13`).
- "own the semantics; rent the volatile provider translation" (`research/nitro-vs-own.md:122`).
- "`@netscript/deploy` must not absorb KV/queue/saga behavior or become a cloud god-object"
  (`research/nitro-vs-own-rev2.md:145-146`).
