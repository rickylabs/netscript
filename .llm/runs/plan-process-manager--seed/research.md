# Research — plan-process-manager--seed

Stage-B discovery corpus index. Full corpus lives in `research/` (one doc per topic, every claim
cited: file:line, saved artifact, or URL). Drift candidates + open questions aggregated in
`research/stage-b-ledger.md`. Stage-C synthesis appends below the corpus index.

## Corpus index (workflow `wf_8ef59eb5-cd6`, 8/8 topics, 0 errors, 2026-07-06)

| Doc | Bytes | Headline |
| --- | ---: | --- |
| `research/r1-plugin-architecture-seams.md` | 37,988 | Process-manager = Archetype 5 (thin plugin) wrapping an Archetype 7 (deploy-target-adapter) core; Archetype 7's status note says the deploy core "is not built yet, lives in packages/cli" — this plugin is literally the missing bare-metal adapter that archetype anticipated. Existing contribution axes cover everything (zero new axes). Dev-dashboard pack (DDX-0..19) already solved admin-UI-as-plugin-panel; two shared dependency edges (AspireResourceKind extension, CommandInvokePort-shaped lifecycle port) must be reconciled, not duplicated. "Deno Desktop app" vs Aspire-hosted Fresh dashboard = explicit owner-fork. |
| `research/r2-deploy-baremetal-seams.md` | 22,416 | Reusable trunk: OsServicePort (servy+systemd), DeployTargetPort, 4 pure conventions (rollback, health-gate, secrets, OTEL env). Three hard gaps: zero NetScript-owned supervision/restart logic (100% delegated to systemd/servy); generalized windows-service/linux-service targets registered but never wired into any CLI command (reachable bare-metal verbs are hard Windows-only); services.json is a static build-time list (no live add/remove, no PID/CPU/mem, no cluster). #345 = supersession candidate. |
| `research/r3-runtime-process-seams.md` | 28,722 | Workers stack = one-shot job execution only (terminal TaskResult, never keep-alive-restart) — pm slots beside workers without duplication. Deploy-compile path already generates static restart/health/log-rotation config. Genuinely missing: live daemon, mutable process registry, runtime-tunable restart/backoff, aggregate status/logs, N-instance clustering, admin UI, netscript.process telemetry domain. WatchableKv (Deno.Kv.watch) = unused-but-ready IPC primitive. --no-aspire = one foreground task, zero supervision. |
| `research/r4-docs-scaffold-desktop-surface.md` | 33,445 | --no-aspire fallback today = zero automation (no appsettings.json at all). Desktop Tier-4 (#451–458) = app-shipping mechanism, not a supervisor. Dev-dashboard (#400) is Aspire-dependent/dev-only → pm bare-metal console must be a standalone deno-desktop-packaged app sharing the panel/contract shape. Genuine docs drift: cli-reference.md claims Linux bare-metal "planning-only" vs shipped SystemdOsServiceAdapter. |
| `research/m1-pup-teardown.md` | 25,336 | pup (MIT, dormant ~19.5 mo, not archived): excellent concept — declarative pup.json, 3 start policies (autostart/cron/watch), single REST control plane consumed identically by CLI/plugins/UI, cluster+LB, service installers. Real smells: dax-sh instead of Deno.Command, deprecated @std/io readLines, god-object Pup class, bespoke slow-polling IPC telemetry. "No third-party deps" framing unverified (real dep graph exists). |
| `research/m2-pm2-teardown.md` | 28,526 | pm2's top lesson is architectural: the shared always-on god-daemon (private axon RPC) caused repeated unbounded-RSS (150GB+) and daemon-duplication incidents — a structural cost of the pattern pup/pm2 framing implicitly proposes. Feature surface (restart strategies, graceful shutdown, startup generation, pm2-runtime, monit) worth matching; anti-features to reject: SaaS-only monitoring (@pm2/io), git+SSH deploy baked into the PM, AGPL, untyped config. Differentiator: typed oRPC lifecycle surface. |
| `research/m3-servy-windows-systemd-native.md` | 25,334 | NetScript already ships production-quality Servy+systemd adapters behind OsServicePort — extend, not replace. Biggest gap: shipped systemd unit renderer has no WatchdogSec/Type=notify, no hardening directives, no cgroups resource control. sd_notify/watchdog buildable in pure Deno via Deno.listenDatagram unixpacket (no FFI). Servy remains correct Windows choice vs NSSM/WinSW. launchd/Quadlet = later-tier. |
| `research/m4-2026-landscape-deno-desktop.md` | 29,048 | Deno-native PM niche still uncontested in 2026 (only Rust pm2-alikes pmc/oxmgr + the process-compose/s6/overmind/supervisord/quadlet field, all lacking Windows parity or OTEL-native subprocess telemetry). Deno 2.9 ships `deno desktop` (experimental) + hardened `deno compile`. Load-bearing platform gaps: OTEL_DENO has zero subprocess coverage (#32752); no unix-socket transport on Windows (#10244); restricted Windows signal set (#28081). |

## Ledger

- 25 drift candidates + 36 open questions: `research/stage-b-ledger.md` (triage at Stage C).
- Prior-run context extracts: `context/prior-deployment-architecture-spec.md`,
  `context/prior-decision-gap-tracker.md`, `context/adjacent-issues.jsonl`.

---

# Stage C — Synthesis (2026-07-06, Tier-A supervisor, full-corpus read)

The supervisor read all eight corpus docs in full. This section resolves the supervisor-delegated
decisions, poses the numbered owner-forks for Stage E/H, triages the 25 drift candidates, routes
the 36 open questions, and names the Stage-D deep-dive packs. Positions below cite the corpus
(`r1`–`r4`, `m1`–`m4`) rather than re-citing file:line — the corpus docs carry the primary
citations.

## C1. Architecture position — the highest-leverage fork, resolved

**Fork:** real always-on NetScript supervisor daemon (pup/pm2 model) vs thin templating of OS-native
units (current deploy-lane model, scaled). Posed by r2 §5 as the single biggest design decision;
m2's daemon-fragility evidence and m4's Quadlet finding bear directly on it.

**Position: a mode-split hybrid — "supervision engine as a library, OS supervisor of record in
production."** Neither pole survives the evidence:

- A pure pup/pm2-style resident god-daemon re-imports pm2's worst documented failure class
  (unbounded-RSS incidents across three major versions, daemon duplication/orphaning — m2 §2,
  anti-feature 13.1) and duplicates restart mechanics systemd/Servy already do better (m3 §6).
- Pure templating is not "pup/pm2 done right": it cannot provide aggregate status/logs across N
  processes, runtime-mutable process lists, app-level health semantics, an admin console, or any
  `--no-aspire` dev fallback (r2 §1 gaps, r3 missing-primitives list) — the exact features the
  charter asks for.

The hybrid, concretely:

1. **The core package owns a supervision engine as a composable library** (spawn via
   `Deno.Command`, restart-policy state machine with exp-backoff + windowed budget, process
   registry, log multiplexing, health probing). It reuses workers' `RuntimeCommandSpec`/
   process-runner seam, permission vocabulary, trace-context env injection, and `ShutdownManager`
   (r3 §1) — it does not duplicate command-building.
2. **Dev mode (`--no-aspire` fallback): the engine runs foreground-attached** (`netscript pm dev`,
   overmind/process-compose shape — m4 §1): no daemon, no OS services; Ctrl+C tears the tree down
   via `ShutdownManager`. This answers m2's daemon-less-in-dev question directly.
3. **Production bare-metal mode: the OS supervisor stays supervisor of record.** The pm compiles
   the declarative process graph into OS-native units — systemd units upgraded with
   `Type=notify`/`WatchdogSec`/hardening/cgroups knobs, Servy XML as shipped (m3 §2, §7.2) — via
   the existing renderers and `OsServicePort`. Quadlet's generator-to-native pattern is the
   architectural precedent (m4 §7.3): a declarative spec compiled to the OS's native supervisor
   out-competes "yet another supervisor daemon."
4. **The pm's resident production component is a control-plane service, not a parent process.**
   It is itself just one more OS-supervised unit (registered through `OsServicePort` like its
   siblings) hosting the typed oRPC control plane: aggregate list/status/logs, lifecycle actions
   (executed by driving the same systemctl/servy command layers), app-level health semantics,
   `sd_notify` readiness/watchdog glue, and the admin console's data source. Managed processes are
   **sibling OS services, never its children** — if the control-plane service dies, the workload
   keeps running and systemd/Servy restart the control plane itself. This structurally eliminates
   the god-daemon failure mode instead of mitigating it.

This division follows m3 §6's wrap-don't-reinvent boundary verbatim: OS layer owns restart
mechanics/liveness enforcement/resource ceilings/boot activation; the pm layer owns multi-process
topology, app-level health semantics, admin surfaces, cross-platform config generation, and the
dev-fallback loop (the one place userland supervision is by-design correct).

## C2. Supervisor-resolved decisions

These are delegated (architecture/doctrine-mechanical) calls the supervisor resolves now; Stage-D
packs elaborate, Stage-F/G adversarial+eval can still challenge them.

| # | Decision | Position | Basis |
| --- | --- | --- | --- |
| S1 | Package shape | Thin `plugins/process-manager` (Archetype 5) + single fat `packages/plugin-process-manager-core` (workers-core analog, naming per `plugin-workers-core`/`plugin-dashboard-core` convention), OS adapters as internal `adapters/{systemd,servy,aspire-resource,os-native}` dirs. Split into adapter packages only if launchd/Quadlet tiers land later. | r1 §9 default; m3 shows adapters are thin; auth-style fan-out is premature with 2 OSes |
| S2 | Contribution axes | Zero new axes. `.withBackgroundProcessor` (dev-mode engine) + `.withService` (control plane) + `.withTelemetry` + `.withRuntimeConfigTopic`; contract = `ProcessManagerContract extends BasePluginContract` (dashboard pattern). | r1 (zero-new-axes finding), r4 §4.1 |
| S3 | State store | New `ports/process-registry-port.ts` in the core (job-storage-port analog), default adapter = `@netscript/kv`; Deno 2.9's per-app-name persistent KV for compiled binaries is the zero-dependency daemon-state backing. **Not** tursodb #453 — avoids a hard beta.8 desktop dependency. | r3 §5, m4 §5/§7.7 |
| S4 | Control-plane IPC | The typed oRPC contract over HTTP loopback is the one canonical transport (CLI, desktop console, dashboard panel, third parties — pup's "one control surface" insight upgraded with types, m1 §4.7). Raw unix-socket IPC is disqualified as the primary channel by Windows (denoland/deno#10244); `WatchableKv` is a subscribe/notify convenience where `supportsWatch`, never the command bus; `unixpacket` is used only for the Linux `sd_notify` helper (m3 §5). Token auth per pup's model — details in Stage D. | m1 §1.6-1.8, m4 §5, r3 §5 |
| S5 | Telemetry | Add `NetScriptAttributeDomains.PROCESS` (+ likely `SERVICE_INSTANCE`) under `netscript.*`; pm authors its own spawn/restart/crash/health spans + uptime/restart-count metrics (OTEL_DENO has zero subprocess coverage — denoland/deno#32752); child trace-context via the existing TRACEPARENT/TRACESTATE/CORRELATION_ID env-injection convention. | r3 §3, m4 §4 |
| S6 | Process spec resolves to concrete argv | The process spec resolves to an executable+args tuple (never a `deno task` indirection) and the engine tracks/kills the descendant tree — pup's own unfixed bug (Hexagon/pup#33) is the cautionary citation. | m4 §3 |
| S7 | Restart policy contract | pm2's full strategy set as the floor (exp-backoff with cap + stable-uptime reset copied as an algorithm; windowed budget; skip-exit-codes; memory-threshold with documented polling latency), pup's `block`/`unblock` policy toggle kept verbatim as a named concept. In OS-service mode these compile into `Restart=`/`RecoveryAction` where expressible; the engine enforces the richer remainder only in dev/attached mode. | m2 §4, m1 §4.3-4.4 |
| S8 | Start policies | autostart / cron / watch, explicitly composable (not pup's pick-one). Cron composes with the workers scheduler primitive if Stage D verifies fit; otherwise a minimal core-owned cron eval (decision recorded there). | m1 §4.2, ledger |
| S9 | Config contract | Typed Standard-Schema process-graph contract, dependency-ordered (process-compose/s6-rc convergence, m4 §7.2); deploy-facing config **extends `deployTargetBaseShape`** (never re-declares mode/activation/secrets/otel); reuses `WorkerTaskPermissions` vocabulary and the `ResolvedBackgroundProcessorConfig`/`CompileTarget` resolution path as input sources. | r2 §2, r3 §1/§4, m2 anti-feature 13.4 |
| S10 | Conventions reuse | rollback-convention, health-gate/activation-convention, secrets-convention, observability-convention lift as-is (pure, target-agnostic); `OsServicePort` + servy/systemd command layers lift as-is; `DeployTargetPort` optional-method descriptor pattern ("omit rather than silent no-op") carried into per-process capability negotiation. | r2 §2-3 |
| S11 | Windows parity posture | Designed-for asymmetry, stated in docs: no cgroups equivalent, 6-signal set + listener-suppresses-default (denoland/deno#28081), no watchdog socket (heartbeat fields are the Windows ceiling), TCP-loopback control channel. Never implied parity. | m3 §7.4, m4 §5, ledger 21/24/25 |
| S12 | Anti-feature list (binding) | No god-daemon parenting the workload; no SaaS monitoring (OTEL-only export); no git+SSH deploy inside the pm (deploy lane #327 owns rollout; pm consumes artifacts); no untyped config; no Node-cluster-shaped fake cluster mode; core stays zero/near-zero npm deps (supply-chain posture, m4 §7.6). | m2 §13 |
| S13 | Docs scope | New capability page + how-to (supervise-bare-metal-processes) + reference dir per r4 §5c ranking; the stale `cli-reference.md` Linux "planning-only" section is fixed in the same wave the pm docs land (never compounded). | r4 §1.3/§5c |

## C3. Owner-forks (numbered — Stage E carries these into plan.md; Stage H ratifies)

| # | Fork | Options | Supervisor recommendation |
| --- | --- | --- | --- |
| OF-1 | CLI surface for lifecycle verbs | (a) dedicated `netscript pm <verb>` group (thin Archetype-6 router over the core) + deploy verbs stay under `netscript deploy` · (b) everything under the deploy router only | **(a)** — ops verbs (`status`/`logs`/`monitor`/`block`) are daily-driver ergonomics, not deploy events; matches pup/pm2 muscle memory; deploy target taxonomy stays clean |
| OF-2 | Admin console (surface A) delivery | (a) standalone Deno-Desktop app **and** a contributed dev-dashboard panel over the same contract · (b) desktop app only · (c) dashboard panel only | **(a)** — charter names the desktop app; r4 §5a shows the bare-metal console cannot be Aspire-dependent, while the shared-contract panel is nearly free. Built as a Fresh app served by the pm's own service first (browser-reachable, de-risks experimental `deno desktop`), desktop packaging as the thin final step reusing #E6 mechanics — a soft, not hard, dependency on desktop Tier-4 |
| OF-3 | #345 re-scope | (a) narrow #345 to cross-host HA/secrets/signing; per-host multi-instance moves into the pm epic, #345 gains a dependency edge on it · (b) leave #345 untouched, pm epic avoids multi-instance | **(a)** — r2 §4 found direct overlap; two owners for "run N copies" guarantees drift |
| OF-4 | Dead targets (`windows-service`/`linux-service`, CLI-unreachable — drift entry 3) | (a) small precursor slice finishes wiring the generic router now (unblocks Linux bare-metal, fixes the stale R-DEPLOY-2 comment), pm target then builds on it · (b) supersede the registry keys directly with the pm's target | **(a)** — fix-forward, honest against #327's shipped claim, independently shippable before the pm epic |
| OF-5 | N-instance clustering (pm2 cluster equivalent) | (a) defer OS-supervised N-instance + port-sharing out of milestone 1 (ship existing `concurrencyEnvVar` self-fan-out; design instantiated-units/`reusePort` in a later-milestone pack) · (b) force into milestone 1 | **(a)** — zero existing primitive (r3 §6, drift 12); Deno has no Node-cluster fd-passing equivalent (m2 §3); shipping a fake would violate S12 |
| OF-6 | macOS/launchd | (a) out of scope for the bare-metal target v1 (parity notes only; dev fallback still runs on macOS since it's plain Deno) · (b) launchd adapter in v1 | **(a)** — m3 §4/§7.6; no shipped adapter, no charter demand |
| OF-7 | Plugin/package naming | (a) `plugins/process-manager` + `@netscript/plugin-process-manager(-core)`, CLI group `netscript pm` · (b) shorter plugin name (`pm`) | **(a)** — explicit name for the board/JSR; `pm` survives as the CLI alias only |

## C4. Drift-candidate triage (25 → verdicts)

- **Confirmed, already folded into `drift.md`:** 2/20 (servy-assessment.md never committed — entry
  2), 13 (cli-reference.md Linux "planning-only" — entry 2), 6/7/8 (CLI-unreachable targets +
  stale R-DEPLOY-2 comment — entry 3), 16/17 (charter imprecisions — entry 2).
- **Confirmed, new fold (entry 4):** 5 (gap-tracker claims a deploy doctrine archetype stub under
  `docs/architecture/doctrine/` that does not exist there — the archetype lives only in
  `.llm/harness/archetypes/ARCHETYPE-7`) + 9 (install-deploy-command description copy still
  Windows-only though the implementation is OS-generic — cosmetic sibling of entry 3).
- **Not drift — design constraints, carried to the Stage-E risk register:** 21 (no Windows cgroups
  equivalent), 22 (`deno desktop` experimental), 23 (OTEL_DENO no subprocess coverage), 24 (no
  Windows unix sockets), 25 (Windows signal restrictions). All five already bind C1/C2 positions.
- **Not drift — plan-lock decisions:** 1 (F-DEPLOY-* gate promotion — Stage E decides whether this
  epic promotes the seeded-'reviewed' gates), 3 (desktop vs dashboard console → resolved as OF-2).
- **Not drift — verified findings:** 4 (#340/#341 verified by r2/r3 direct reads), 10
  (workers-vs-pm framing confirmed load-bearing), 11 (net-new surface = live control plane — now
  the C1 scope guard), 12 (clustering has zero primitive → OF-5), 18 (pm2 v7.0.3, Bun+Node), 19
  (pm2 OTEL posture needs one re-check before the RFC asserts "zero standards-based export" —
  routed to Stage D).
- **Noted, no action:** 14 (`apps/` paths in prior proposals resolve only in eis-chat/scaffolds —
  citation-clarity note for Stage-D authors).

## C5. Open-question routing (36)

Every ledger question is now one of: **resolved** (C2 position), **owner-fork** (C3), or
**Stage-D assignment** (pack named).

- Resolved by C1/C2: supervision fork (C1); daemon-less dev vs prod (C1); pm sits *behind*
  `OsServicePort` as one more registered unit + *above* the OS layer as control plane (C1.4);
  registry port + KV (S3); WatchableKv-vs-socket (S4); state store not tursodb (S3); package shape
  (S1); process-list sources in `--no-aspire` (S9 — `scaffold.plugin.json` officialSource +
  workspace task graph as resolvers into the typed graph, D5 details); composable start policies
  (S8); AspireResource[] as *an input* to the process graph, not the registry itself (S9/D1).
- Owner-forks: CLI taxonomy (OF-1), console delivery + #E6 coupling (OF-2), #345 (OF-3),
  finish-wiring vs supersede (OF-4), clustering scope (OF-5), launchd (OF-6), naming (OF-7).
- Stage-D assignments: capability category (`background-processor` vs `infrastructure`) → D1;
  target-key taxonomy + F-DEPLOY gate promotion mechanics → D3; DashboardPanelContribution
  host-agnosticism + CommandInvokePort first-definer reconciliation with DDX-17 → D4; systemd
  `--user`/linger mode → D3; Deno-native port-sharing design (later-milestone shape) → D1
  (bounded: design sketch only, per OF-5); workers-scheduler fit for cron policy → D1;
  `unixpacket` abstract-namespace `@` support spike note → D3; pup telemetry wire transport
  (curiosity-tier, only if cited) → D2; pm2 OTEL-bridge re-check → D2; desktop comparison page +
  dokku/pmc/oxmgr verification tails → D4 (cite-or-drop rule: verify before the RFC repeats them).

## C6. Stage-D deep-dive design packs (Tier B — Opus 4.8, drafts only)

| Pack | Scope | Key inputs |
| --- | --- | --- |
| **D1 — Supervision engine + core package** | Core package layout (S1), process/state machine, restart-policy contract (S7), start policies (S8), registry port (S3), descendant-tree kill (S6), dev-mode foreground loop, workers-seam reuse map, capability category, clustering later-milestone sketch (OF-5 bound) | r3, m1 §2, m2 §4, r1 §9 |
| **D2 — Control plane + contract** | `ProcessManagerContract extends BasePluginContract` route table, oRPC-over-loopback transport + token auth, per-platform IPC notes (S4/S11), telemetry domain + span/metric catalog (S5), event surface (pup's `.on()` set as prior art) | r4 §4.1, m1 §1.5-1.8, m4 §4-5 |
| **D3 — Deploy-lane integration + OS adapters** | Target-key taxonomy + OF-4 precursor slice spec, `OsServicePort`/renderer extensions (WatchdogSec/Type=notify/hardening/cgroups typed knobs), `sd_notify` helper, systemd `--user` mode, conventions-reuse wiring (S10), #345 re-scope mechanics (OF-3), F-DEPLOY gate promotion, milestone-train placement | r2, m3 |
| **D4 — Surfaces: CLI + admin console** | `netscript pm` verb set (pup parity floor, m1 §4.12), Fresh admin app over the contract, desktop packaging via #E6 mechanics (soft dep), dashboard panel + host-agnosticism check, DDX-17/CommandInvokePort reconciliation, landscape verification tails | r4, m1 §1.8, m4 §2 |
| **D5 — Config contract + scaffold + docs** | Typed dependency-ordered process-graph schema (S9), `deployTargetBaseShape` extension, `--no-aspire` resolvers, scaffold.plugin.json manifest shape, docs plan incl. cli-reference fix (S13), issue-draft skeletons (netscript-pr conformant, `Part of #<epic>`) | r4 §2/§5c, r2 §2, m1 §1.1 |

Each pack returns a proposal doc + draft issue skeletons; nothing is filed before Stage H. Packs
run under the harness skill set (`netscript-harness`, `netscript-doctrine`, `netscript-pr` for
draft conformance).

## C7. What this epic is NOT (scope guards, binding on Stage D/E)

1. Not a re-implementation of restart/liveness mechanics in production — systemd/Servy remain
   supervisor of record (C1.3).
2. Not a deployment/rollout system — #327's lane owns provisioning, artifacts, rollback; the pm
   consumes them (S12).
3. Not a monitoring product — OTEL export is the only remote-observability path (S12).
4. Not a production load balancer — any built-in balancing is explicitly scoped as a dev/small-app
   convenience, copying pup's own stated boundary (m1 §1.4).
5. Not a milestone-1 cluster orchestrator (OF-5) and not a macOS service manager (OF-6).
