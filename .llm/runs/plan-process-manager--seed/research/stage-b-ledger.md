# Stage-B ledger — drift candidates + open questions

Aggregated verbatim from the 8 discovery agents (workflow `wf_8ef59eb5-cd6`, 2026-07-06).
Stage C triages drift candidates (confirm → `drift.md` / charter correction; reject → note here).
Open questions feed Stage-C synthesis: each becomes a supervisor resolution, a Stage-D deep-dive
assignment, or a numbered owner-fork for Stage E.

## Drift candidates (25)

1. [r1] Archetype 7's F-DEPLOY-* gates are seeded 'reviewed' not 'gated' until the deployment
   packages exist (ARCHETYPE-7:14-15) — a process-manager epic landing before #339–#343 promote
   these gates must explicitly decide whether it triggers that promotion or stays 'reviewed' too.
2. [r1] Charter cites prior research corpus on branch `research/deployment-aggregation` at
   `.llm/tmp/run/epic-deployment-aggregation/` — path does not exist in this worktree; SERVY
   MODERNIZE verdict + gap tracker could not be re-verified from that path. (Supervisor note:
   spec + gap tracker were extracted to `context/` via `git show` at Stage A;
   `servy-assessment.md` was never committed — verdict survives only in #327's body.)
3. [r1] Charter's Deno Desktop admin-console framing (surface A) may conflict with the locked
   epic:dev-dashboard design (Aspire-hosted Fresh console, not native Desktop app) — two different
   UI delivery mechanisms needing explicit reconciliation, not silent merging.
4. [r1] #340 (compile artifact) and #341 (hardening) asserted shipped by charter but only
   verified via an observability-convention.ts filename match in r1's pass. (r2/r3 subsequently
   read the rollback/health-gate/secrets/observability convention files directly — treat as
   verified by corpus aggregate.)
5. [r2] prior-decision-gap-tracker.md claims a 'deployment target-adapter doctrine archetype' stub
   was opened alongside taxonomy labels; `docs/architecture/doctrine/` has zero files matching
   *deploy* and zero matches for 'Archetype 7'/'deploy target adapter'/'OsServicePort' — the
   doctrine entry either never landed or landed under an unfound name.
6. [r2] WindowsServiceDeployTarget and LinuxServiceDeployTarget are registered in
   DEFAULT_DEPLOY_TARGETS (deploy-target-registry.ts:78-79) with full Archetype-7
   rollback/secrets capability via ServiceDeployTarget, but deploy-group.ts never mounts
   createTargetDeployCommand for either key — the generalized bare-metal target is
   CLI-unreachable despite being domain-complete and unit-tested.
7. [r2] public-command-dependencies.ts doc comment claims the deployTargets registry 'ships the
   seed windows-service target ... resolved by the thin deploy <target> router (R-DEPLOY-2)' —
   stale/aspirational; deploy-group.ts's router never resolves windows-service.
8. [r2] The only CLI-reachable bare-metal verbs (start/stop/status/logs/copy/upgrade) hard-gate
   `Deno.build.os !== 'windows'` → WindowsRequiredError, bypassing the OS-generic
   OsServicePort/SystemdOsServiceAdapter entirely — Linux bare-metal has no reachable CLI path
   today despite the domain/adapter layer supporting it.
9. [r2] install-deploy-command.ts description still reads 'Register services with the Windows
   service manager' though installServiceDeploy is OS-generic — copy drift separate from the
   functional gate above.
10. [r3] Charter framed workers-vs-pm as an assumption to verify; code confirms it exactly (no
    long-running/restart concept in plugin-workers-core) — verification was load-bearing, not
    rubber-stamped.
11. [r3] Bare-metal deploy lane (#337–#340) already implements a large fraction of a pm's
    declarative surface (restart policy, health checks, log rotation) at OS-service-compile time —
    RFC scope must name 'live daemon control plane' as the actual net-new surface or it will
    over-scope shipped work.
12. [r3] N-instance clustering (pm2 cluster-mode equivalent) has zero existing primitive (no
    systemd instantiated units, no per-instance Servy config) — milestone-1 scope must not
    silently assume clustering is 'mostly there'.
13. [r4] docs/site/cli-reference.md (~294-296, ~327-332) claims Linux bare-metal is
    'planning-only' — directly contradicts os-service-factory.ts (SystemdOsServiceAdapter
    dispatched for all non-Windows OS) and the shipped #339. Genuine docs drift.
14. [r4] A-dashboard and E-desktop design proposals reference `apps/dashboard/...` paths that do
    not exist in netscript-framework (no apps/ dir) — resolve only in eis-chat or scaffolded
    workspaces.
15. [r4] DashboardPanelContribution seam presented as dashboard-shell-agnostic but never
    tested/described against a standalone (non-Fresh) host shell such as a deno desktop window —
    unverified assumption if reused for the pm standalone admin console.
16. [m1] Charter's "no third-party deps" framing for pup: not found in README/FAQ/docs; pup's
    deno.json shows a real dependency graph (@cross/*, @oak/oak, dax-sh, zod, croner, ...) —
    treat as unverified/misattributed.
17. [m1] Charter's "unmaintained ~2 years": verified last commit/tag 2024-11-19 = ~19.5 months —
    directionally correct; cite ~19-20 months if precision matters.
18. [m2] pm2 current stable is v7.0.3 (fetched 2026-07-06) with Node 18+ and Bun 1+ support —
    any framing of pm2 as Node-only is stale.
19. [m2] No first-party OTEL/Prometheus exporter found in pm2's docs corpus — only the closed
    SaaS @pm2/io path; re-check before asserting pm2 has zero standards-based telemetry.
20. [m3] Charter-cited `servy-assessment.md` could not be located on research/deployment-aggregation
    (only spec/tracker/worklog exist there) — same as #2; MODERNIZE verdict survives in #327 body.
21. [m3] Windows Servy has zero OS-native resource-control equivalent to systemd cgroups v2
    CPUQuota/MemoryMax — permanent cross-platform capability asymmetry; plan docs must state it,
    not imply parity.
22. [m4] `deno desktop` is explicitly experimental in Deno 2.9 — Surface A rides an experimental
    platform feature; no assumption of desktop-as-stable-ship-target.
23. [m4] OTEL_DENO has zero built-in child-process span/metric coverage (denoland/deno#32752
    open) — subprocess telemetry is plugin-authored work, not inherited "for free".
24. [m4] Deno.listen unix transport has no Windows named-pipe equivalent (denoland/deno#10244
    open) — single-code-path unix-socket IPC will not meet the Windows-parity goal.
25. [m4] Windows signals restricted to 6, and registering any Deno.addSignalListener suppresses
    Deno's default action (denoland/deno#28081) — graceful-shutdown design cannot assume POSIX
    signal parity on Windows.

## Open questions (36)

### Surfaces & command taxonomy
- [r1] CLI surface B: one more target of the existing `netscript deploy <target> <verb>`
  Archetype-7 router, or a dedicated `netscript pm <verb>` group delegating to the same core?
- [r1] Admin console (surface A): DashboardPanelContribution inside the dev-dashboard Fresh
  console, a standalone Deno Desktop native app, or both (dev panel + standalone prod app)?
- [r4] Should surface A hard-depend on #E6 deno desktop packaging/auto-update (coupling to
  desktop Tier-4 beta.8), or scope an interim non-desktop admin UI (Fresh page served by the pm's
  own service)?

### Package shape & doctrine
- [r1] process-manager-core: one fat package (workers-core analog) or core + per-OS adapter
  packages (auth-core analog) for servy/systemd/launchd?
- [r1] provider.category: reuse 'background-processor' (workers') or introduce 'infrastructure',
  and does a new category require registry/doctor changes?
- [r4] Is DashboardPanelContribution genuinely host-agnostic (Fresh shell AND deno desktop
  shell), or does it need generalizing first?

### Supervision architecture (highest-leverage fork)
- [r2] Is the pup/pm2 'restart policy' a real NetScript-owned supervisor daemon (portable beyond
  systemd/servy), or a templating layer deferring to systemd Restart=/servy MaxRestartAttempts
  (thin, but arguably not 'pup/pm2 done right')? **Highest-leverage design fork.**
- [m2] Daemon-less in dev (--no-aspire fallback) + daemon-full in prod, or a single daemon-shaped
  mechanism in both modes?
- [r4] Does the pm sit above OsServicePort (single systemd/Servy-registered entry point fanning
  out to N children), alongside it, or eventually subsume it?
- [r3] Is N-instance clustering in scope for milestone 1 given zero existing OS primitive?
- [m2] Deno-native cluster-mode design: worker-thread pool with Deno.serve reusePort, or an L4
  front-proxy owned by the core package?

### Control plane, state & IPC
- [r3] Process registry: directly in @netscript/kv, or behind a new ports/process-registry-port.ts
  (job-storage-port analog) for Postgres/Redis swap?
- [r3] Is WatchableKv.watchPrefix the sanctioned control-plane IPC transport, or does
  supportsWatch===false on non-Deno-KV backends require socket/named-pipe transport?
- [r2] Live per-process state (PID table, restart counters, log index): new plugin-core-owned
  store, or the desktop epic's relocated per-user tursodb (#453)? Determines hard dependency on
  beta.8 desktop slices.
- [m1] What is jsr:@pup/telemetry's actual wire transport? (JSR page 403'd; needs direct source
  read if the design pack cites pup's IPC precisely.)

### Deploy-lane integration & supersession
- [r2] Does the pm plugin finish wiring windows-service/linux-service into deploy-group.ts, or
  supersede those registry entries with a richer target key?
- [r3] Does the pm register its own DeployTargetPort key, or become the implementation behind the
  existing linux-service/windows-service targets? Changes the #327 target-key taxonomy.
- [r2] Should #345 (bare-metal HA + secrets + signing, stable) be re-scoped as a dependency of
  the pm plugin given direct multi-instance/HA overlap?
- [r2] Should aspire-compose/aspire-cloud deploy adapters be read in depth before Stage C? (Only
  existence confirmed this pass.)
- [r1] Should the pm consume the AspireResource[] contribution list from other plugins'
  contribute() as its bare-metal process registry, or maintain a separate declaration surface?
- [r1] Who defines the CommandInvokePort-equivalent lifecycle-action port first — dev-dashboard
  (DDX-17) or the pm epic?
- [r4] In --no-aspire mode, source the process list from scaffold.plugin.json officialSource +
  workspace deno.json task graph, or define the pm's own manifest format?

### Feature-parity policy
- [m1] Keep pup's mutually-exclusive start policies (autostart XOR cron XOR watch) or make them
  composable? Any NetScript config-convention precedent?
- [m1] Does NetScript have a cron/scheduling primitive the pm's cron start-policy should compose
  with, or does the plugin bring its own (pup brings @hexagon/croner)?
- [m2] Is @pm2/io's SaaS-only monitoring posture total, or does an unofficial OTEL/Prometheus
  bridge exist as prior art?

### OS-adapter scope
- [m3] Does Deno's unixpacket transport support abstract-namespace NOTIFY_SOCKET ('@'-prefixed)?
  Needs a hands-on spike.
- [m3] Ship systemd --user + loginctl enable-linger non-root install mode in the same wave as
  root/system-unit mode, or defer?
- [m3] Is a launchd (macOS) adapter in-scope for the bare-metal target, or dev-only/out-of-scope?
- [m3] Is Quadlet/Podman container-mode bare metal a real owner requirement or later-tier idea?
- [m3] Actual content/location of servy-assessment.md — does MODERNIZE carry specifics beyond
  what this survey captured?

### Landscape verification tails
- [m4] Is dokku still alive/current in 2026? Not verified.
- [m4] What does docs.deno.com/runtime/desktop/comparison/ actually say vs Tauri/Electron/...?
  Located, not scraped.
- [m4] Documented Deno workers-vs-subprocess isolation comparison? Current claim inferred from
  Deno.Command docs alone.
- [m4] #337/#339/#340/#341 verified against source? (Resolved by r2/r3 in this same corpus —
  yes, read directly.)
- [m4] pmc/oxmgr performance claims (e.g. 42x faster crash detection) independently benchmarked
  anywhere, or self-reported only?
- [r1] F-DEPLOY-* gate promotion question (see drift candidate 1) — plan-lock decision.
