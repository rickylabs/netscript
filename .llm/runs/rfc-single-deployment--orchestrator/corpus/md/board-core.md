# netscript board corpus digest

## #820 — RFC: single deployment — enterprise installation layer, update lifecycle, PM foundation, single-runtime composition
- state: open | milestone: Backlog / Triage | labels: status:research, priority:p1, rfc, area:deploy
- url: https://github.com/rickylabs/netscript/issues/820

Owner-mandated RFC (2026-07-17), grounded in the eis-chat POC (rickylabs/eis-chat#150, merge `aeaf2df` — "Prototype full-stack Windows singleton desktop deployment": no-Docker Windows `--singleton` around Deno Desktop, native window directly supervising the adjacent service graph, Garnet + six compiled Deno processes, Aspire sidecar telemetry, shipped as a single `.msi`).

**The POC proves feasibility. This RFC extracts what SHOULD BE BUILT as foundational layers — we learn from the POC's seams, PRs, issues, and fixes; we do not copy its scripts into NetScript.**

## Findings that motivate this RFC

1. **Process manager is the missing foundation (beta.12 / epic #510).** The POC's supervision is launch-only: if a sidecar service dies, the frontend is unaware and the only recovery is re-opening the app. Crash survival, restart policy, health propagation to the UI, and lifecycle guarantees must exist BEFORE any desktop deployment ships on NetScript. Sequencing: PM epic (beta.12) is a hard prerequisite of the desktop deployment work.
2. **Installation layer is a gap in BOTH epics.** The POC ships as a simple .NET AOT host. An enterprise-grade installation layer must handle much more (install/uninstall/repair, per-machine vs per-user, service registration, permissions/elevation, signing, first-run provisioning) and must be integrated WITHIN the Aspire stack, not bolted on outside it. Today this sits in neither the PM epic (#510) nor the desktop packaging issues (e.g. PM-32 #543) — scope it and place it.
3. **Update-management lifecycle is unanswered for the combined output.** Deno Desktop ships an update story for a single desktop output; our artifact is a combined singleton (window + supervised service graph + sidecars). How updates apply atomically/safely across that graph (staged rollout, rollback, partial-update hazards, service downtime windows) needs a designed answer.
4. **Composition with the single-runtime feature.** Prior single-runtime issues describe another packaging approach we intend to KEEP alongside the singleton desktop output. The RFC must define how the two compose (shared contracts? shared PM? divergent installers?) rather than letting them fork.

## Deliverables

- Gap analysis of epic #510 (PM) and the desktop packaging scope against the POC learnings, with concrete sub-issue adjustments (add/re-scope/re-milestone proposals for beta.12/beta.13 — proposals, owner ratifies).
- RFC design for the enterprise installation layer inside the Aspire stack.
- RFC design for update lifecycle of the combined singleton output.
- Composition contract between single-runtime and singleton-desktop approaches.

Run: `.llm/runs/rfc-single-deployment--orchestrator/` (Fable 5 · high generator, adversarial Sol · max). No implementation from this RFC; board changes are drafts until owner ratification.

Refs #510, #543, #327, #400.


## #510 — Epic: NetScript Process Manager — bare-metal supervisor + admin console (pup/pm2 done right)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, area:docs, type:umbrella, area:plugins, wave:v1, area:telemetry, status:plan, priority:p1, rfc, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/510

## Epic — NetScript Process Manager

Part of #327 (Deployment epic, bare-metal lane). **No closing keyword** — this umbrella closes by hand when its children land.

The bare-metal deployment target of #327: how NetScript apps are run, supervised, and administered on bare metal. The concept of pup + pm2, rebuilt for 2026 as a first-party NetScript plugin (`@netscript/plugin-process-manager(-core)`, CLI group `netscript pm`) at the quality bar of `workers`/`auth`.

### 1. Problem statement

Today `--no-aspire` bare-metal supervision is zero automation beyond `deno task --cwd <m> dev` run by hand in N terminals. Production restart/liveness is 100% delegated to systemd/Servy with no NetScript-owned aggregate status/logs, no runtime-mutable process list, no admin console. This epic fills that gap without re-importing pm2's god-daemon failure class.

### 2. Prior art (verdicts)

- **pup** (MIT, dormant ~19.5mo): excellent concept — declarative `pup.json`, 3 start policies, one REST control plane consumed by CLI/plugins/UI alike. Aged code: dax-sh over `Deno.Command`, deprecated `@std/io` readLines, god-object `Pup` class, bespoke polling-IPC telemetry, unfixed descendant-kill bug. We keep the concept, not the code.
- **pm2** (v7, Node/Bun): rich restart strategies worth matching; its always-on god-daemon caused repeated unbounded-RSS (150GB+) and daemon-duplication incidents — a structural warning, not a model.
- **Servy / systemd**: NetScript already ships production Servy + systemd adapters behind `OsServicePort`; extend (WatchdogSec/Type=notify/hardening/cgroups), don't replace.
- **process-compose / s6-rc / Quadlet**: the generator-to-native-supervisor precedent and the dependency-ordered graph model we converge on.

### 3. Architecture (one paragraph)

Supervision engine as a **library**: dev mode runs it foreground-attached (`netscript pm dev`, no daemon); production compiles the declarative process graph into OS-native units (systemd/Servy via the existing renderers + `OsServicePort`, extracted to **`@netscript/deploy-core`** at PM-20), and the pm's resident piece is a **control-plane service** — itself one more OS-supervised unit hosting the typed oRPC control plane, never a parent of the workload. If it dies, the workload keeps running and the OS restarts the control plane. This structurally eliminates the god-daemon failure mode.

### 4. Scope / non-scope (binding)

**In:** typed dependency-ordered process-graph contract; dev foreground engine; compile-to-OS-units; resident control-plane oRPC service; `netscript pm` CLI (pup parity floor); OTEL `netscript.process` domain; `--no-aspire` resolvers; browser-served admin console (desktop packaging deferred, PM-32); `OsServicePort` renderer extensions; `packages/deploy-core` extraction.
**Out:** re-implementing restart/liveness in production (OS owns it); a deployment/rollout system (#327 owns it); a monitoring product (OTEL export only); a production load balancer; milestone-1 N-instance clustering (OF-5 → Backlog, PM-35); macOS/launchd (OF-6). No god-daemon, no SaaS monitoring, no git+SSH deploy inside the pm, no untyped config, no fake cluster mode.

### 5. Surfaces

- **A) Admin console** — one Fresh app, three modes (OF-2): browser-served by the control-plane service ships first (PM-29); Deno-Desktop packaging second (PM-32, soft dep #456/#451); embedded `DashboardPanelContribution` panel third (PM-33, gated on CR-DDX-HOSTAGNOSTIC to #400).
- **B) Pure CLI** (`netscript pm <verb>`) — pup/pm2 parity floor, leveraging the OTEL/oRPC/deploy seams NetScript ships for free (OF-1, OF-7).

### 6. Owner forks — RATIFIED 2026-07-06

All nine forks ratified by the owner (in-session, Stage H): OF-1..OF-8 = recommendation (a); **OF-5 clustering explicitly re-homed to Backlog / Triage** (PM-35); **OF-9 hard fork resolved: milestone 1 = `0.0.1-beta.8`** (beta.7 already carries 28 open issues). PM-0 rides beta.6 as an independent fix-forward precursor.

### 7. Cross-epic dependency edges

- #327 — parent (bare-metal lane placement).
- #400 dev-dashboard — `CommandInvokePort` first-definer (dashboard-defines-first, recorded bidirectional fallback); CR-DDX-HOSTAGNOSTIC change request (gates PM-33 only); Aspire `command` kind consumed, never extended.
- #451 / #456 (desktop Tier-4) — soft deps for PM-32 only.
- #345 — re-scoped to cross-host HA/secrets/signing; per-host multi-instance moved here (PM-35).
- fresh-ui L3 `blocks/` promotion — shared dep for PM-29 (can ship on L2 + local composition if promotion lags).

### 8. Milestone train (post-ratification)

- **0.0.1-beta.6:** PM-0 (hard placement — independent fix-forward).
- **0.0.1-beta.8 (M1, per OF-9):** PM-1..PM-31 (`v1-min` cuttable floor = 21 slices) + PM-32/PM-33 (M2, soft-dep #456/#451; PM-33 slips if the #400 CR is unresolved).
- **0.0.1-stable:** PM-34 + re-scoped #345 convergence.
- **Backlog / Triage:** PM-35 (per-host multi-instance / clustering, per owner OF-5 pick).

### 9. Sub-issues

<!-- checklist filled by Stage-H filing -->
- [ ] **PM-0** #511
- [ ] **PM-1** #512
- [ ] **PM-2** #513
- [ ] **PM-3** #514
- [ ] **PM-4** #515
- [ ] **PM-5** #516
- [ ] **PM-6** #517
- [ ] **PM-7** #518
- [ ] **PM-8** #519
- [ ] **PM-9** #520
- [ ] **PM-10** #521
- [ ] **PM-11** #522
- [ ] **PM-12** #523
- [ ] **PM-13** #524
- [ ] **PM-14** #525
- [ ] **PM-15** #526
- [ ] **PM-16** #527
- [ ] **PM-17** #528
- [ ] **PM-18** #529
- [ ] **PM-19** #530
- [ ] **PM-20** #531
- [ ] **PM-21** #532
- [ ] **PM-22** #533
- [ ] **PM-23** #534
- [ ] **PM-24** #535
- [ ] **PM-25** #536
- [ ] **PM-26** #537
- [ ] **PM-27** #538
- [ ] **PM-28** #539
- [ ] **PM-29** #540
- [ ] **PM-30** #541
- [ ] **PM-31** #542
- [ ] **PM-32** #543
- [ ] **PM-33** #544
- [ ] **PM-34** #545
- [ ] **PM-35** #546

### 10. Open questions (carried from plan §9)

1. Telemetry T2 owner sign-off on E15 (mint only `netscript.process`; no `netscript.service.instance`).
2. #400's answer to CR-DDX-HOSTAGNOSTIC — gates PM-33's milestone only.
3. `followLogs` rate-cap numbers (bounded policy required by PM-13 acceptance; exact figures at implementation).
4. fresh-ui L3-blocks sequencing for PM-29.

### 11. Design source

`.llm/runs/plan-process-manager--seed/` on PR #504: `plan.md` (Stage E, amended at Stage F, PLAN-EVAL PASS) + `research/design/d1..d5-*.md` + `research.md` §C1–C7.




## #400 — epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)
- state: open | milestone: 0.0.1-beta.13 | labels: type:umbrella, area:plugins, area:aspire, wave:v1, area:fresh-ui, area:telemetry, status:plan, priority:p1, epic:dev-dashboard
- url: https://github.com/rickylabs/netscript/issues/400

## Summary

A DX-oriented dev dashboard shipping as `plugins/dashboard` + `packages/plugin-dashboard-core` on `@netscript/fresh-ui`. It is a **satellite of Aspire's control surface, not a rival** — and it is **how you drive the framework**: it renders only NetScript-domain state Aspire and Scalar cannot see, mirrors the CLI's management verbs through the UI, and deep-links back out to Aspire/Scalar for everything they already own.

**Rescoped 2026-07-06 (owner mandate, amended same day).** The pass-1 direction duplicated Aspire/Scalar surfaces. The rescope keeps three pillars from the original seed research: **Observe** (only-NetScript state), **Manage** (Appwrite-style per-capability console mirroring the CLI), **Follow** (Encore-model live seam-flow, never re-rendered OTLP).

## DX thesis

Answer the questions no existing tool can: *"is my NetScript app wired the way I declared it, what is my runtime doing right now at the primitive level, what did this request actually cause, and let me act on it without leaving the browser."*

- **Aspire owns:** resources, console/structured logs, raw traces, metrics, health, process lifecycle.
- **Scalar owns:** API reference, schemas, try-it, code samples.
- **The dashboard owns:** primitive run-state (executions/attempts, saga instances incl. `compensating`, trigger firings, stream deliveries), the runtime override/config layer **including gated write-back**, plugin-registry wiring + doctor + contribution axes, contract provenance/coverage/duality, route→contract binding, codegen/scaffold state (migrations, drift), **the per-capability management loop (create → configure(tabs) → monitor)**, and **the live request journey across framework seams (S13)**.

## Authoritative screen set (supersedes the pass-1 DDX panel list)

- **S1 Shell & Wiring Home** — #415 (v2: + quick-action strip mirroring top CLI verbs)
- **S2 Config Resolution & Topology Hand-off** — #416 (v2: + live-traffic edge overlay, Encore Flow model)
- **S3 Runtime-Config Monitor & Control** ⚑ flagship — #551 (DDX-20, new; v2: write-back gated on #556, beta.7)
- **S4 Service & Contract Catalog** — #417 (provenance/coverage/duality only; no try-it)
- **S5 Plugin Control** (dogfood centerpiece) — #420 (v2: + install/scaffold entry points, marketplace-lite)
- **S6 Run Inspector + NetScript run-overlay** — #419 (run-centric)
- **S7–S10 Workers / Sagas / Triggers / Streams consoles** — #428 #429 #430 #431 (v2: each completes the create→configure→monitor→act management loop)
- **S11 DB Migrations & Drift** — #552 (DDX-21, new; beta.6-if-cheap; migrate/seed actions)
- **S12 Dead-Letter Queues** — #553 (DDX-22, new; wave:defer, gated on thin API slices)
- **S13 Live Flow — request journey** ⚑ flagship #2 — #418 (v2 REWRITE, was pass-1 waterfall: now the seam-event causal chain — request → payload → job → saga → fan-out — with per-node Aspire out-links)

## Acceptance lines (MANDATORY, gate every slice)

1. **Non-duplication.** No dashboard screen may render, as an owned surface: an OTLP trace waterfall / span-bar gantt, a structured/console log tail, a metrics chart, a resource start/stop/restart panel, or an OpenAPI operation list / try-it console. Each is Aspire's or Scalar's job and MUST be a deep-link out. Every merged panel must pass **"why can't this just deep-link to Aspire/Scalar?"** with a NetScript-only answer recorded in its issue — only-NetScript *state*, only-NetScript *action* (CLI-mirroring), or framework-*seam semantics* raw OTLP cannot express.
2. **One generator, two callers.** Every dashboard mutation invokes the same contract route / CLI scaffolder the terminal does and renders its CLI-equivalent line (`netscript …` CodeBlock). No dashboard-only write paths, no forked codegen.
3. **Flow ≠ waterfall.** S13 renders a primitive-grouped causal chain with payloads at seams, assembled from NetScript's own seam events; the moment raw timing/span detail is needed it out-links to Aspire `/traces/detail/{id}`. No span bars, no time-proportional gantt, no log tails in S13 — ever.

## Integration seams (four seams, one URL scheme)

1. **Aspire → dashboard:** `WithUrl("NetScript Dashboard", /resource/{name})` on every scaffolded resource + two framework `withCommand`s — generator emission on #424, Seam A widening (`command`/`app` kinds) on #411, Seam B interim.
2. **Dashboard → Aspire:** correlation-only `TelemetryQueryPort` (#413) resolves a `traceId`, then out-links to `{aspireBase}/traces/detail/{id}`, `/structuredlogs?resource=`, `/consolelogs/resource/`, `/metrics/resource/`. Never re-renders OTLP. The S13 flow plane does **not** widen this port.
3. **Dashboard → Scalar:** `/api/docs` (+ operation anchor) deep-links only; `externalDocs` optional polish.
4. **Data plane:** owned `/_netscript/*` introspection (#423) over already-shipped oRPC contracts, **plus `/_netscript/flows` (SSE)**: beta.6 joins the shipped per-primitive streams on the stamped `traceparent`; co-req DDX-23 (#557) adds the unified seam-event envelope + HTTP boundary events.

## Killed / folded surfaces (documented so they don't creep back)

- Raw OTLP waterfall renderer (pass-1 #418 scope → dead; #418 rescoped to the S13 seam-flow journey, which is not a waterfall — acceptance line 3).
- Logs panel (#421 → closed; correlated strip in S6 deep-links Aspire logs).
- Resource-control panel (#422 → closed; delivered as `withCommand` contributions *inside Aspire*).
- Service `/health` panel (→ Aspire State column via a proper `withHealthCheck()` wiring fix).
- Metrics charts + GenAI conversation view (→ Aspire, link only).
- Scalar-style operation list / try-it (→ Scalar `/api/docs`; the S4 catalog is provenance-only).

## Slice map / dependencies

Plumbing: #410 (fresh-ui L3 blocks) → #412 (core scaffold, + `FlowRecord`) → #414 (thin plugin) · #411 (Seam A) · #413 (+#408 telemetry T7) · #423 (introspection + flows join) · #424 (CLI/deep-links/generator) · #427 (panel seam — the Directus-validated contribution axis).
Screens: #415, #416, #417, #418 (S13), #419, #420, #428–#431, DDX-20/21/22 (#551 #552 #553).
Management wave (beta.7): #432 elevated — "Add resource" scaffold-from-UI keystone; DDX-23 seam-event envelope #557; template-gallery create entries in S5/S7–S10.
Design pre-step: #507 (S1–S13 Claude Design prototype; duplication caught at design review). UI quality: #509.
Gate: #426 (E2E join + panel smoke; v2 adds the S13 flow-chain assertion, still no owned-waterfall assertion).
Co-requisites (wave:defer): `TriggerDlqPort` contract route #554, `queue` `DeadLetterStore` CLI/API #555. Co-requisite (beta.7): runtime-config mutation use-cases #556 (S3 write-back — surface check 2026-07-06: the store is read+watch-only today).
Deferred convergences: in-dashboard AI-on-codegen (with #238), in-app plugin marketplace beyond S5 marketplace-lite.

Refs #301 (road to stable). Co-lands with `epic:telemetry-revamp` (#399) for T4–T7 correlation fidelity.


## #327 — epic: NetScript enterprise deployment framework (cloud-agnostic + bare-metal, CLI + Aspire)
- state: open | milestone: 0.0.1-stable | labels: area:cli, type:umbrella, area:aspire, status:plan, priority:p2, area:deploy, epic:deployment
- url: https://github.com/rickylabs/netscript/issues/327

## NetScript Enterprise Deployment Framework

Turn NetScript into an **enterprise-grade, cloud-agnostic AND bare-metal-compatible deployment framework**, with **first-class support through BOTH the CLI and Aspire**. NetScript is Deno-native, so Deno deployment targets (especially the new **Deno Deploy**) are first-class strategic surface. The whole design is grounded on Aspire's publish/deploy model.

This is a **child epic of the Road-to-0.0.1-stable umbrella** and must not block it — it links in as a child once filed.

Research corpus (77 cached sources), the full architecture spec, the SERVY assessment, and the decision/gap tracker were produced under the harness run `epic-deployment-aggregation` (branch `research/deployment-aggregation`). This issue embeds the load-bearing conclusions inline.

---

### How NetScript maps onto Aspire's deploy model
- **Two-command spine**: `aspire publish` emits static artifacts (compose/Helm/Bicep) for review/GitOps; `aspire deploy` resolves params + applies. NetScript's CLI wraps both for cloud targets and drives bare-metal directly.
- **Compute-environment (compose / k8s / AKS / ACA / App Service) is orthogonal to Aspire-environment (dev/staging/prod)**.
- **Pipelines are step-graphs** (`AddStep` / `WithPipelineStepFactory`, replacing the deprecated `WithPublishingCallback`). **The TypeScript AppHost drives the full container/cloud lane today** — `addContainer('denoland/deno:2')`/`addDockerfile`, `addDockerComposeEnvironment`/`addKubernetesEnvironment`/`addAzureContainerAppEnvironment`, per-resource `publishAsDockerComposeService`/`publishAsKubernetesService`/`publishAsAzureContainerApp` callbacks, and app-level `pipeline.addStep(...)` are all TS-expressible (verified via the `?aspire-lang=typescript` doc tab). The only genuinely C#-only capability is authoring brand-new custom resource *types*, which NetScript's container lane does not need.
- **Deno app publish shape** is realized with the built-in TS container primitives above (`PublishAsNodeServer` is Node-runtime-specific and won't run Deno). The ada2a5 `AddDenoApp` + `denoland/deno:2` single-stage publish + `OTEL_DENO` is **optional DX sugar on top, not a prerequisite**.
- Deployment state is cached/idempotent (`~/.aspire/deployments/{sha}/{env}.json`); CI/CD is two-layer (outer GH-Actions/AzDO pipeline invokes the inner Aspire step-graph non-interactively).

### CLI surface (generalized beyond today's Windows-only tree)
- Evolve config `deploy.windows.*` → **`deploy.targets.*`** (multi-target).
- `netscript deploy <target> <verb>` router: cloud targets wrap `aspire publish`/`aspire deploy`; bare-metal targets drive an `OsServicePort` directly.

### Bare-metal successor (SERVY verdict: MODERNIZE)
SERVY upstream (aelassas/servy, C#/MIT, v8.5) is healthy — the rot is entirely NetScript-side (Windows-locked, doc/code divergence, no rollback/multi-instance, weak secrets, fake-only tests, dead `docker`/`script` config, `deno:2.5` pin). Reuse the sound `ProcessPort`/`WindowsServicePort` seam and **generalize `WindowsServicePort` → `OsServicePort`** with `servy` (Windows) + `systemd` (Linux) adapters, on a `deno compile` single-binary artifact, adding rollback / multi-instance / secrets / OTEL / health-gate.

---

### Per-target readiness & tier proposal

| Target | Model | Driven via | First-party Deno | Proposed tier |
| --- | --- | --- | --- | --- |
| Deno Deploy (new platform) | deno-native source build | CLI → `deno deploy` / GitHub-push | Yes (first-party) | **1 (beta)** |
| `deno compile` bare-metal (Linux/Windows) | single binary + systemd/servy | CLI → `OsServicePort` | Yes (deno-native) | **1 (beta)** |
| Docker / Compose (self-host) | image + compose | CLI → `aspire publish/deploy` (TS AppHost) | TS `addContainer`/`publishAsDockerComposeService` (ada2a5 = optional DX) | **1 (beta)** |
| Kubernetes | generated manifests/Helm | CLI → `aspire publish` (TS AppHost) | TS `addKubernetesEnvironment`/`publishAsKubernetesService` (ada2a5 = optional DX) | 2 (stable) |
| Azure ACA / App Service / AKS | Aspire compute-env | CLI → `aspire deploy` (TS AppHost) | TS `addAzureContainerAppEnvironment`/`publishAsAzureContainerApp` (ada2a5 = optional DX) | 2 (stable) |
| GCP Cloud Run / Koyeb / DigitalOcean / Render | Docker image / droplet | CLI emits; provider CLI | Docker path (no native) | 2 (stable) |
| Sevalla / Dokploy / Coolify | Docker / self-host compose | CLI emits compose | no native Deno | 3 (track) |
| Vercel / Cloudflare / AWS Lambda | unofficial runtime / isolate / container | RFC-14 Nitro unified-mode | not first-party | 3 (track) |

### Watch-item verdicts
- **`deno compile` single-binary — ADOPT NOW** (mature 5-triple cross-compile, asset embedding; the bare-metal artifact).
- **`deno desktop` — TRACK** (v2.9 VFS + `Deno.autoUpdate`; but code signing/notarization not automated).
- **Pulumi #3838 (Deno provider, 0.140) — TRACK** (0.140 milestone = intent, not shipped; real blocker is gRPC-server-in-Deno, denoland/deno#23714).
- **Nitro `deno_server` preset — TRACK** (still needs `--unstable`; central to RFC-14 unified-mode).
- **RFC-14 unified-mode — PRODUCT DECISION** (Nitro v3 + oRPC + Fresh 2, mode-parity, sagas excluded, ~3-5 months) — see open decisions.

### Critical path (corrected 2026-07-03)
**There is no upstream hard dependency on the critical path.** The earlier "the Aspire container/cloud lane is gated on the ada2a5 `AddDenoApp` seam because custom publish steps are C#-only" finding was an artifact of reading only the default C# doc tab and is **substantially false** — re-verifying the `?aspire-lang=typescript` tab shows the TS AppHost drives the whole container lane today (evidence: `sources/aspire/*--ts-tab.md`). **Phases 0-3 (config contract, bare-metal successor, Deno Deploy adapter, AND the Aspire container lane) all have no upstream blocker and can proceed in parallel.** ada2a5 `AddDenoApp` becomes an optional DX enhancement to fold in later (TRACK). The only capability that remains C#-only — authoring brand-new custom resource *types* — is not needed by this lane.

---

### Product decisions — RESOLVED (2026-07-03, delegated to epic supervisor)
The user delegated all six with a prioritize-don't-ship-everything mandate. These are calls, not questions; all reversible.

| # | Decision | Verdict | Milestone |
|---|----------|---------|-----------|
| D1 | RFC-14 unified-mode (tier-3 serverless via Nitro) | **WATCH / separate track — not v1.** 3-5mo, distinct arch, excludes sagas, `--unstable` Nitro preset; Aspire+Deno Deploy already give a strong cloud story without it. | deferred (watch) |
| D2 | Flagship one-click | **Deno Deploy = beta marquee** (deno-native, no Dockerfile, shortest path, Deno-team play); **Aspire Docker/Compose ships alongside in beta** as the cloud-agnostic proof; k8s/Azure = stable. | 0.0.1-beta |
| D3 | Bare-metal hardening line | **v1 = systemd + `deno compile` + atomic rollback + health-gated activation + `OTEL_DENO` + restricted-perm env-file secrets.** Defer multi-instance/HA + external secret store to stable. | beta / stable split |
| D4 | `deno compile` signing | **Accept manual/documented for v1; do not block.** Cross-platform signing is platform-specific scope; add a pipeline hook now, automate at stable. | beta (doc) / stable (auto) |
| D5 | `deploy.windows.*` migration | **CLEAN BREAK to `deploy.targets.*` — no back-compat alias** (user override 2026-07-03: "we're alpha, breaking changes are allowed, go production-grade directly"). Windows lane re-keyed to `deploy.targets.windows` + one-line migration note. | 0.0.1-beta |
| D6 | Pulumi IaC adapter | **PURE WATCH — not a planned lane.** #3838 is OPEN + `blocked` (gRPC-server-in-Deno `denoland/deno#23714` unshipped); Aspire already covers IaC (Bicep/Helm/compose). | deferred (watch) |

Strategic plays (informational, not blocking): Deno Deploy first-class support = Deno-team play (D2 marquee); ada2a5 `AddDenoApp` = Aspire-team play (folded into the Aspire lane as optional DX when it lands). **No `NEEDS USER:` items** — all six decided (D5 now a user-overridden clean break); D2 positioning is the most product-facing and cheaply revisitable.

### Priority ordering
**0.0.1-beta (tier-1):** `deploy.targets.*` contract (clean break, no windows alias) · deployment doctrine archetype · `OsServicePort`+`SystemdAdapter`+`deno compile`+rollback+health-gate+OTEL+basic secrets · **Deno Deploy adapter (marquee)** · Aspire Docker/Compose via TS AppHost · docs/code divergence fix.
**0.0.1-stable (tier-2):** k8s + Azure via TS AppHost · Docker-image providers (Cloud Run/Koyeb/Render/DigitalOcean) · CI/CD template gen + state/secret hardening · bare-metal HA + external secret store + signing automation · one-click convergence + release-skill.
**Watch (deliberately not v1):** RFC-14 unified-mode + Nitro preset (D1) · tier-3 serverless (Vercel/CF/Lambda) · Pulumi #3838 (D6) · exotic self-host (Sevalla/Dokploy/Coolify — generic compose emit) · ada2a5 `AddDenoApp` (optional DX fold-in) · `deno desktop` (reference only).

---

### Sub-issue slices (filed 2026-07-03 — `[Deploy-Sx]`, grouped by phase)

**0.0.1-beta.1 (tier-1):**
- [x] #337 **[S1]** `deploy.targets.*` config contract — clean break, no windows alias (Phase 0, D5) · `wave:v1-min`
- [x] #338 **[S2]** Deployment target-adapter archetype doctrine entry (Phase 0; coordinate with #305) · `wave:v1-min`
- [x] #344 **[S8]** Fix docs/code divergence (`deploy.md` + `cli-deploy-artifacts-missing`) (Phase 0) · `wave:v1-min`
- [x] #339 **[S3]** `WindowsServicePort` → `OsServicePort` + `SystemdAdapter` (Phase 1) · `wave:v1`
- [x] #340 **[S4]** `deno compile` single-binary bare-metal artifact — manual signing (Phase 1, D4) · `wave:v1`
- [x] #341 **[S5]** Bare-metal hardening (beta): rollback + health-gate + `OTEL_DENO` + basic secrets (Phase 1, D3) · `wave:v1`
- [x] #342 **[S6]** Deno Deploy tier-1 adapter — **MARQUEE** (Phase 2, D2) · `priority:p0` · `wave:v1`
- [x] #343 **[S7]** Aspire Docker/Compose lane via TS AppHost (Phase 3a; not blocked on #320) · `wave:v1`

**0.0.1-stable (tier-2):**
- [ ] #345 **[S9]** Bare-metal enterprise hardening (stable): HA + external secret store + signing automation (D3/D4)
- [ ] #346 **[S10]** Aspire Kubernetes + Azure + Docker-image providers (Cloud Run/Koyeb/Render/DO) (Phase 3b)
- [x] #347 **[S11]** CI/CD template generation + state/secret hardening (Phase 4)
- [ ] #348 **[S12]** One-click convergence + release-skill integration (Phase 5)

**Backlog / Triage (watch — deliberately not v1):**
- [ ] #349 **[S13]** WATCH: RFC-14 unified-mode + Nitro `deno_server` preset — tier-3 serverless (D1)
- [ ] #350 **[S14]** WATCH: Pulumi #3838 Deno provider — IaC adapter feasibility (D6)

---

### TIER-4 — Desktop / single-process / offline-first (NEW — milestone `0.0.1-beta.8` core, `0.0.1-stable` hardening; low priority; **ships FULLY as one tier — no single-process-early / desktop-later split**)

NetScript apps shippable to end-user devices as a 1-click, offline-first desktop package, running the backend **in-process** (true single-process) rather than as separate loopback processes. Grounded in the completed eis-chat `deno desktop` spike (`docs/DESKTOP-SHELL.md`, option (b) shipped in prod → option (c) true single-process target). This reclassifies desktop out of the earlier `deno desktop — TRACK` watch-item posture into a first-class Tier-4.

**Precursor (must land before beta.8):**
- [ ] #451 **[#E1]** `@netscript/sdk` in-process link-mode adapter (`createInProcessClientLink` + `ServiceClientTransport` switch + in-process registry). Unblocks true single-process; the server-side `ServiceApp.fetch()` mount seam already ships. *(Strikes the mis-referenced "172a-2 service-base-seam" dependency — PR #172 is merged CLI type-soundness, unrelated. See drift E1.)*

**beta.8 core (ship together):**
- [ ] #452 **[#E2]** desktop app-type in the Aspire generator (folds #375, promoted from Backlog/Triage p3) — option (b) desktop shell as a first-class generator primitive.
- [ ] #453 **[#E3]** tursodb single-writer relocation + in-process composition root — per-user data dir, `build()` in the desktop process, sole lock holder. Avoids the native-addon-in-VFS spike.
- [ ] #454 **[#E4]** true single-process mode — dashboard wired through the link-mode adapter in the packaged binary (option (c)). Deps #451 + #453.
- [ ] #455 **[#E5]** offline-first — Turso Sync (`pull`/`push`, last-push-wins + `transform`) in the single-process host.
- [ ] #456 **[#E6]** 1-click packaging + release/update server — `deno desktop` cross-compile, `latest.json` + bsdiff + Ed25519-signed manifests, Windows stages-not-applies manual-apply fallback.

**stable (hardening + gate):**
- [ ] #457 **[#E7]** desktop/single-process deploy-e2e — extends #394's bare-metal-first deploy-e2e harness to the desktop target. Foundation: #393 (compose target registration), #394 (deploy-e2e).
- [ ] #458 **[#E8]** signing automation — macOS Developer-ID + `notarytool`; Windows `signtool` (D4: manual/documented for v1, automate at stable).

**Naming hygiene:** #349 (RFC-14 tier-3 serverless + Nitro `deno_server`) remains a **WATCH sibling** here — it is a *different* "unified" sense (serverless bundling), **not** merged into the desktop single-process scope. See #371/#372 for the KV-layer "unified" sense (already solved).

---

The full phased execution plan (per-phase goals, deliverables, DAG, acceptance gates) is in the pinned **PLAN** comment below.

---

<sub>Grounded on 77 cached sources (Aspire deployment suite, Deno Deploy/sandbox, 10 providers, watch items, netscript-start POC). Full spec: `deployment-architecture-spec.md`; SERVY assessment: `servy-assessment.md`; decision/gap tracker: `decision-gap-tracker.md` — harness run `epic-deployment-aggregation`.</sub>



# Comments on #820

