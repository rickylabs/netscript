# PM sub-issues #512–#545

## #512 — [process-manager PM-1] Process-graph contract v1 (ProcessGraphShape/ProcessSpecShape + state vocabulary + restart policies)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:config, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/512

## Summary
The typed foundation of the epic: `ProcessGraphShape`/`ProcessSpecShape` Zod schemas (exported as Standard Schema, JSON Schema derived — E11), the canonical state vocabulary (E2: engine FSM canonical, wire enum a projection with an explicit mapping table), and restart/start-policy sub-schemas with S7 pm2-floor defaults (E3: backoff double-to-cap-15000ms, reset-after-30000ms).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` `contracts/v1` (Archetype 2)
- Part of #510
- Depends on: — · Blocks: most of the DAG
- **Includes precursor:** re-export `WorkerTaskPermissions` (+ schema) from `@netscript/plugin-workers-core` `mod.ts` (today internal-only at `src/executor/executor-types.ts:33-41`; doctrine 02 bars internal-path imports, 09 bars duplication)

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §1 + `d1-supervision-engine-core.md` (state machine) · `plan.md` §4 PM-1, E2/E3/E11

## Acceptance criteria
- [ ] gate: schemas Zod-authored, Standard Schema exported, JSON Schema derived (not hand-maintained)
- [ ] gate: one state vocabulary — wire `ProcessState` defined once in `contracts/v1` as a projection of the engine FSM with a mapping table
- [ ] gate: restart defaults are D1 controller constants (15000/30000), not D5's stale 30000/10000
- [ ] gate: `WorkerTaskPermissions` re-exported from workers-core `mod.ts`; pm imports it from the public surface
- [ ] gate: `deno doc --lint` clean on the full export map; public surface ≤ 20 per mod.ts
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- No `instances > 1` semantics (E9 hard-errors — PM-35 owns clustering); no deploy-facing target schema (PM-21).

## Drift / Debt
- none



## #513 — [process-manager PM-2] Telemetry: netscript.process domain + ProcessInstrumentationLike facade
- state: open | milestone: 0.0.1-beta.12 | labels: type:feat, area:telemetry, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/513

## Summary
Mint the `PROCESS: 'netscript.process'` telemetry domain and the `ProcessInstrumentationLike` facade (+ no-op) in `packages/telemetry`, per the T1/T2 conventions. E15: reuse OTEL semconv identity keys verbatim; no `netscript.service.instance` (confirm with telemetry T2 owner during implementation — carried note, not a blocker).

## Scope
- Archetype / area: `packages/telemetry`
- Part of #510
- Depends on: — · Blocks: PM-14

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S10) + `d2-control-plane-contract.md` §7.1 · `plan.md` §4 PM-2, E15

## Acceptance criteria
- [ ] gate: `netscript.process` domain constant + facade + no-op land in `packages/telemetry` following the T1 convention
- [ ] gate: no new attribute keys where OTEL semconv already defines them
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Span/metric catalog wiring is PM-14; no engine code here.

## Drift / Debt
- none



## #514 — [process-manager PM-3] Core package scaffold: ports + KV registry adapter
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:kv, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/514

## Summary
Scaffold `packages/plugin-process-manager-core` (Archetype 2, workers-core analog): `ProcessRegistryPort` + runner port definitions, and the KV registry adapter on Deno 2.9 per-app-name persistent KV (`['pm', …]` key space).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` ports + adapters
- Part of #510
- Depends on: #512 · Blocks: PM-6, PM-17, PM-18

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S2 + D1-S6) · `plan.md` §4 PM-3

## Acceptance criteria
- [ ] gate: package scaffolded per doctrine (mod.ts export map, README, JSR-ready deno.json)
- [ ] gate: KV adapter uses `@netscript/kv` conventions; keys under `['pm', …]`
- [ ] gate: ports are real contracts (no phantom typing — type-soundness law, only the 2 accepted casts)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- No supervisor loop (PM-6); no OS-service ports (PM-17).

## Drift / Debt
- none



## #515 — [process-manager PM-4] Restart controller: pure nextDelay(state, policy, clock)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/515

## Summary
Pure restart-decision function `nextDelay(state, policy, clock)`: S7 numbers locked (E3 — exp backoff double-to-cap-15000ms, reset-after-30000ms stable), windowed restart budget, skip-exit-codes, and poll-based memory threshold with **default `pollIntervalMs: 5000`, configurable per policy** (latency explicit).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` engine
- Part of #510
- Depends on: #512 · Blocks: PM-6

## Design source
- `research/design/d1-supervision-engine-core.md` (restart controller) · `plan.md` §4 PM-4, E3

## Acceptance criteria
- [ ] gate: pure function — deterministic under injected clock; unit tests cover backoff/reset/budget/skip-exit-codes
- [ ] gate: memory threshold is poll-based with configurable `pollIntervalMs` (default 5000) — never marketed as a watchdog (R10)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Process spawning (PM-5); OS watchdogs (systemd `WatchdogSec` is PM-15/16).

## Drift / Debt
- none



## #516 — [process-manager PM-5] Process runner: Deno.Command-native spawn + descendant-tree kill
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/516

## Summary
Lean `Deno.Command`-native process runner (no dax): `RuntimeCommandSpec` + argv builders, `buildEnvironment()` trace injection (TRACEPARENT), `TextLineStream` output handling, and a correct descendant-tree kill (POSIX process-tree walk / Windows `taskkill /T`) — fixing pup's unfixed descendant-kill bug class.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` engine
- Part of #510
- Depends on: #512 · Blocks: PM-6, PM-7

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S4 + D1-S5) · `plan.md` §4 PM-5

## Acceptance criteria
- [ ] gate: spawn/stream/kill covered by tests incl. a descendant-tree kill test on both platforms' code paths
- [ ] gate: no dax / no `@std/io` deprecated APIs — Web Platform + `Deno.*` only
- [ ] gate: TRACEPARENT env injection present and tested
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Restart policy (PM-4); log persistence (PM-7).

## Drift / Debt
- none



## #517 — [process-manager PM-6] Supervisor loop + composable start policies (autostart/cron/watch)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/517

## Summary
The supervision engine loop composing PM-3/4/5, with the three start policies: autostart, cron via `@netscript/cron` `createScheduler()`, and watch via `Deno.watchFs`. Dependency-ordered graph startup.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` engine
- Part of #510
- Depends on: #514, #515, #516 · Blocks: PM-8, PM-10, PM-35

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S7) · `plan.md` §4 PM-6

## Acceptance criteria
- [ ] gate: start policies composable per process; cron reuses `@netscript/cron` (wrap-don't-reinvent)
- [ ] gate: dependency-ordered startup with readiness gating (E14 grace-window default; `sd_notify`/HTTP probe opt-in)
- [ ] gate: engine is a library — zero daemon assumptions (C1)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Control plane (PM-10); dev CLI (PM-27).

## Drift / Debt
- none



## #518 — [process-manager PM-7] Log multiplexer + persistent sink (rotation)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, wave:v1, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/518

## Summary
Log multiplexer over runner output streams + persistent sink with rotation; journald/Servy interplay documented (who owns persistence per mode).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` engine
- Part of #510
- Depends on: #516 · Blocks: PM-13 (follow-logs source)

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S8) · `plan.md` §4 PM-7

## Acceptance criteria
- [ ] gate: rotation policy tested (size/count bounds); no unbounded growth
- [ ] gate: docs state the journald/Servy interplay per mode (dev vs OS-supervised)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Log streaming over the wire (PM-13).

## Drift / Debt
- none



## #519 — [process-manager PM-8] Dev loop + ShutdownManager integration (engine side of pm dev)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/519

## Summary
The foreground dev loop (engine side of `netscript pm dev`): `ShutdownManager` integration, ordered teardown, Windows signal caveat (denoland/deno#28081 — listener suppresses default action; re-invoke exit/teardown explicitly).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` engine
- Part of #510
- Depends on: #517 · Blocks: PM-27

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S9) · `plan.md` §4 PM-8, R5

## Acceptance criteria
- [ ] gate: Ctrl+C teardown kills the whole graph in dependency order on POSIX and Windows code paths
- [ ] gate: Windows 6-signal caveat handled and tested (explicit exit re-invocation)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- CLI UX/multiplexed output rendering (PM-27).

## Drift / Debt
- none



## #520 — [process-manager PM-9] ProcessManagerContract v1: the 18-route table
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/520

## Summary
The typed oRPC contract: exactly the normative 18-route table (E4/F-2) — `describe · listProcesses · getProcess · status · health · getState · logs · followLogs · start · stop · restart · block · unblock · terminate · applyGraph · subscribeEvents · mintToken · revokeToken` — with Zod schemas, spreading `BASE_PLUGIN_CONTRACT_ROUTES`, `satisfies`, no erasure cast.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` `contracts/v1`
- Part of #510
- Depends on: #512 · Blocks: PM-10, PM-13, PM-25, PM-29

## Design source
- `research/design/d2-control-plane-contract.md` §1.3 (normative) · `plan.md` §4 PM-9, E4

## Acceptance criteria
- [ ] gate: exactly the 18 routes — no hidden routes minted; CLI-only verbs (`reload`, `enable-service`, `disable-service`) map in PM-26, never here
- [ ] gate: extends the base plugin contract seam (`BASE_PLUGIN_CONTRACT_ROUTES` spread + `satisfies`; only the 2 accepted casts)
- [ ] gate: lifecycle actions are accepted-style async (`ActionResult {id, action, accepted, state, correlationId}`)
- [ ] gate: `deno doc --lint` clean on the full export map
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Handlers (PM-10); transport (PM-11); auth (PM-12).

## Drift / Debt
- none



## #521 — [process-manager PM-10] Control-plane oRPC service (PluginServiceContribution)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/521

## Summary
The resident control-plane service: `PluginServiceContribution` (`axis:'service'`) hosting the PM-9 contract over the engine, with async `accepted`-style lifecycle handlers. One more OS-supervised sibling unit — never a parent of the workload (C1).

## Scope
- Archetype / area: `plugins/process-manager` service contribution + core service impl
- Part of #510
- Depends on: #520, #517 · Blocks: PM-11, PM-12, PM-13, PM-14

## Design source
- `research/design/d2-control-plane-contract.md` §2 (D2-S3) · `plan.md` §4 PM-10

## Acceptance criteria
- [ ] gate: service extends the base service seam (contract/service base — no phantom typing)
- [ ] gate: lifecycle handlers return `accepted` immediately; state transitions observable via `getState`/events
- [ ] gate: control-plane death does not touch workload processes (sibling-unit invariant asserted in tests)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Transport/discovery (PM-11); token auth (PM-12).

## Drift / Debt
- none



## #522 — [process-manager PM-11] Loopback transport + address-descriptor discovery + CLI degraded mode
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/522

## Summary
Loopback TCP oRPC transport (single canonical transport, E6 unix-socket deferred) + address-descriptor discovery (KV + file) + the CLI degraded-mode fallback seam (OS-layer reads when the control plane is down).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` transport/discovery
- Part of #510
- Depends on: #521 · Blocks: PM-25
- **Acceptance documents that the control plane is network-reachable on 127.0.0.1** (TCP-only until E6's unix-socket upgrade) so token auth (PM-12) is understood as load-bearing, not defense-in-depth (F-5)

## Design source
- `research/design/d2-control-plane-contract.md` §4 (D2-S4) · `plan.md` §4 PM-11, E6, R4

## Acceptance criteria
- [ ] gate: address descriptor written to KV + file with 0o600 perms; discovery precedence tested
- [ ] gate: docs/README state the 127.0.0.1 reachability + token-auth-is-load-bearing posture explicitly
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Unix sockets (deferred, E6); remote/non-loopback bind (deny-remote default is PM-12).

## Drift / Debt
- none



## #523 — [process-manager PM-12] Token auth: opaque bearer + 0o600 secrets + deny-remote default
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/523

## Summary
Control-plane auth per E7: opaque high-entropy bearer tokens (Web Crypto), hashed at rest, KV revocation set, secrets-convention 0o600 storage, deny-remote default. Zero-dep — no JWT unless cross-host federation (a non-goal) ever lands.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` auth
- Part of #510
- Depends on: #521 · Blocks: PM-26

## Design source
- `research/design/d2-control-plane-contract.md` §3.1(a) (D2-S5) · `plan.md` §4 PM-12, E7

## Acceptance criteria
- [ ] gate: tokens hashed at rest; revocation via KV set; `mintToken`/`revokeToken` routes wired
- [ ] gate: token file 0o600 via the secrets convention; deny-remote default asserted in tests
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- JWT/federation; UI auth flows (console reuses the same bearer).

## Drift / Debt
- none



## #524 — [process-manager PM-13] Event stream + follow-logs (eventIterator, live-only v1)
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, wave:v1, type:feat, status:plan, priority:p2, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/524

## Summary
`subscribeEvents` + `followLogs` over oRPC `eventIterator`; KV-watch stays server-internal; live-only in v1 (E8) — reconnecting clients re-sync via `status`/`getState`.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` streaming
- Part of #510
- Depends on: #520, #521 · Blocks: PM-28

## Design source
- `research/design/d2-control-plane-contract.md` §5 (D2-S6) · `plan.md` §4 PM-13, E8

## Acceptance criteria
- [ ] gate: `followLogs` carries a bounded rate-cap policy (exact figures at implementation — plan §9 residual 3)
- [ ] gate: live-only semantics documented; reconnect re-sync path tested
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Replayable KV event cursor (deferred, E8).

## Drift / Debt
- none



## #525 — [process-manager PM-14] Telemetry wiring: span/metric catalog + 14-point checklist
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, wave:v1, type:feat, area:telemetry, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/525

## Summary
Wire the `netscript.process` span/metric catalog through engine + control plane, including the `netscript.process.control_plane.rss.bytes` NFR gauge (the anti-god-daemon self-watch). All 14 telemetry-checklist points asserted.

## Scope
- Archetype / area: `packages/plugin-process-manager-core` + `plugins/process-manager`
- Part of #510
- Depends on: #513, #521 · Blocks: —

## Design source
- `research/design/d2-control-plane-contract.md` §7 (D2-S7) · `plan.md` §4 PM-14, R3

## Acceptance criteria
- [ ] gate: 14-point telemetry checklist green (D2 §7.5 mapping)
- [ ] gate: pm authors its own subprocess spans (OTEL_DENO has zero subprocess coverage — R3); TRACEPARENT reuse verified
- [ ] gate: no-op fallback (TC-12) when telemetry is off
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- New telemetry domains (PM-2 owns the mint).

## Drift / Debt
- none



## #526 — [process-manager PM-15] systemd renderer knobs: Type=notify, WatchdogSec, hardening, cgroups v2
- state: open | milestone: 0.0.1-beta.12 | labels: wave:v1, type:feat, status:plan, priority:p2, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/526

## Summary
Extend the shipped systemd renderer: `Type=notify`/`WatchdogSec`, `HARDENING_BASELINE` profile, `DynamicUser`, cgroups v2 resource limits — with **byte-identical rendering when the new knobs are unset** (no regression for shipped users).

## Scope
- Archetype / area: systemd renderer (today `packages/cli`; moves to `packages/deploy-core` at PM-20)
- Part of #510
- Depends on: #512 · Blocks: PM-16, PM-19

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.3 (D3-S2) · `plan.md` §4 PM-15

## Acceptance criteria
- [ ] gate: byte-identical render check — unset config renders today's unit byte-for-byte
- [ ] gate: each knob covered by a render test; hardening profile opt-in
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- sd_notify client helper (PM-16); Servy parity where no equivalent exists (warn-and-omit via PM-17).

## Drift / Debt
- none



## #527 — [process-manager PM-16] Pure-Deno sd_notify helper (+ abstract-namespace spike)
- state: open | milestone: 0.0.1-beta.12 | labels: wave:v1, type:feat, status:plan, priority:p2, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/527

## Summary
Pure-Deno `sd_notify` client: `notifyReady`/`notifyWatchdog`/`watchdogIntervalMs`, no-op outside systemd. Includes a **bounded spike sub-task**: `@`-abstract-namespace `NOTIFY_SOCKET` support in Deno `unixpacket` (R6 — the path-based happy path never blocks on it).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` (runtime helper consumed by supervised apps)
- Part of #510
- Depends on: #526 · Blocks: —

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.3a (D3-S3) · `plan.md` §4 PM-16, R6

## Acceptance criteria
- [ ] gate: path-based `NOTIFY_SOCKET` happy path tested; no-op outside systemd
- [ ] gate: spike outcome recorded (abstract-namespace supported / not) — either way the slice ships
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Watchdog re-implementation (systemd owns it).

## Drift / Debt
- none



## #528 — [process-manager PM-17] OsServicePort capability descriptor + warn-and-omit
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, wave:v1, type:feat, status:plan, priority:p2, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/528

## Summary
Capability descriptor on `OsServicePort` (systemd advertises watchdog/cgroups/hardening; Servy advertises heartbeat/recoveryAction) feeding config-layer **warn-and-omit**: a knob the target can't honor warns and is omitted, never silently dropped. Windows cgroups warning names the manual alternatives (Job Objects, processor affinity) with a Microsoft-docs link (R1/F-11).

## Scope
- Archetype / area: `OsServicePort` + adapters (moves to `packages/deploy-core` at PM-20)
- Part of #510
- Depends on: #514 · Blocks: PM-18

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.4 (D3-S4) · `plan.md` §4 PM-17, R1

## Acceptance criteria
- [ ] gate: capability sets accurate per adapter; warn-and-omit tested for an unsupported knob on each platform
- [ ] gate: Windows resource-limit warning text names Job Objects/processor affinity + MS-docs link
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- New OS backends (launchd out — OF-6).

## Drift / Debt
- none



## #529 — [process-manager PM-18] Conventions wiring: ServiceDeployTargetPorts → wired 8-op adapters
- state: open | milestone: 0.0.1-beta.12 | labels: type:feat, wave:v1-min, status:plan, priority:p1, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/529

## Summary
The pm supplies `ServiceDeployTargetPorts` (activation/health/secrets/observability), promoting the bare `linux-service`/`windows-service` descriptors to wired 8-op adapters; health-gated `up` = zero-downtime restart.

## Scope
- Archetype / area: deploy conventions + target adapters
- Part of #510
- Depends on: #511, #514 · Blocks: PM-20, PM-26

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.6 (D3-S5) · `plan.md` §4 PM-18

## Acceptance criteria
- [ ] gate: both targets advertise the full 8-op set with ports injected (`service-deploy-target.ts` seam)
- [ ] gate: health-gated `up` demonstrated (unit restart waits on readiness before old instance teardown)
- [ ] gate: `deno task arch:check` green
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- F-DEPLOY gate promotion (PM-20 — needs the real package boundary).

## Drift / Debt
- none



## #530 — [process-manager PM-19] Compile adapters: ProcessSpec → systemd/Servy unit configs
- state: open | milestone: 0.0.1-beta.12 | labels: area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/530

## Summary
Compile `ProcessSpec` graphs into systemd/Servy unit configs in the core — **calls the existing renderers, never a parallel renderer** (wrap-don't-reinvent).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` compile layer
- Part of #510
- Depends on: #512, #526 · Blocks: PM-20

## Design source
- `research/design/d1-supervision-engine-core.md` (D1-S11) · `plan.md` §4 PM-19

## Acceptance criteria
- [ ] gate: one renderer code path — compile adapters delegate to the shipped renderers (import-graph asserted)
- [ ] gate: round-trip test: graph → units → the OS layer can start/stop them (mocked adapters)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Renderer feature work (PM-15).

## Drift / Debt
- none



## #531 — [process-manager PM-20] Extract packages/deploy-core (@netscript/deploy-core) + promote F-DEPLOY gates
- state: open | milestone: 0.0.1-beta.12 | labels: wave:v1, type:refactor, status:plan, priority:p2, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/531

## Summary
The largest structural move in the epic (E5 as amended at Stage-F triage F-3): create **`packages/deploy-core`** (`@netscript/deploy-core`) — the package ARCHETYPE-7 anticipates ("the core is extracted in a later wave") — and move the OS-service layer into it: `OsServicePort` + systemd/Servy adapters + renderers + the four conventions + the target registry. `plugin-process-manager-core` **depends on** deploy-core; `packages/cli` re-exports so existing imports stay stable. The future deploy wave inherits — never imports from — pm.

## Scope
- Archetype / area: new `packages/deploy-core` (Archetype 7 core) + `packages/cli` re-exports
- Part of #510
- Depends on: #529, #530 · Blocks: PM-31 (publish set)
- **Acceptance includes** promoting `F-DEPLOY-1`/`F-DEPLOY-2` `reviewed`→`gated` in arch:check **in this slice** — the real package boundary the promotion has been waiting on now exists (F-3/F-14)

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.8 · `plan.md` §4 PM-20, E5 (amended), R9

## Acceptance criteria
- [ ] gate: `packages/deploy-core` JSR-ready (doc-lint clean, export map, README); pm-core + cli import from it
- [ ] gate: `packages/cli` re-exports keep all existing imports compiling (no downstream churn)
- [ ] gate: `F-DEPLOY-1`/`-2` flipped `reviewed`→`gated`; `deno task arch:check` green with the new boundary scanned
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- New deploy features — pure extraction + re-export. Escape hatch (R9/F-12): if unwieldy mid-slice, split — `OsServicePort` + renderers first; conventions + registry in a sibling slice.

## Drift / Debt
- none



## #532 — [process-manager PM-21] Deploy-facing schema: process-graph knobs on deploy.targets.linux/.windows
- state: open | milestone: 0.0.1-beta.12 | labels: type:feat, wave:v1-min, status:plan, priority:p1, area:config, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/532

## Summary
Per E1 (**no new deploy-target key**): add process-graph knobs to the existing `deploy.targets.linux`/`.windows` members (+ a shared pm sub-shape), spreading `deployTargetBaseShape` — no re-declares. Includes the `graph` pointer to `pm.config.ts` and control-plane placement config.

## Scope
- Archetype / area: `packages/config` deploy section
- Part of #510
- Depends on: #512, #511 · Blocks: PM-22, PM-25

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §1.4 as amended by E1 (D3 §D3.1.1 authoritative) · `plan.md` §4 PM-21, E1/E10

## Acceptance criteria
- [ ] gate: no new target key — knobs land on the existing members (`config-section-types.ts` `windows`/`linux`)
- [ ] gate: `deployTargetBaseShape` spread (no field re-declares); schema round-trips through config load
- [ ] gate: `deno task arch:check` green
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- `pm.config.ts` authoring surface (PM-24 scaffolds it; contract is PM-1's).

## Drift / Debt
- none



## #533 — [process-manager PM-22] --no-aspire resolvers + pm explain provenance
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, area:plugins, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/533

## Summary
Resolvers that seed a process graph for `--no-aspire` scaffolds: `scaffold.plugin` `officialSource` + workspace `deno.json` task graph (concrete argv per S6), with `pm explain` provenance (every resolved process says where it came from).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` resolvers + CLI surface
- Part of #510
- Depends on: #512 · Blocks: PM-24, PM-27

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §3 (D5-3) · `plan.md` §4 PM-22

## Acceptance criteria
- [ ] gate: resolver precedence tested (explicit config > manifest > task graph)
- [ ] gate: `pm explain` prints provenance per process
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Aspire-mode resolution (PM-23).

## Drift / Debt
- none



## #534 — [process-manager PM-23] AspireResource[] resolver (manifest-wins precedence)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, area:aspire, wave:v1, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/534

## Summary
Resolver over `AspireResource[]`: manifest-wins precedence; the Aspire `command`-kind edge is **consumed, not owned** (the kind belongs to the dashboard/Aspire seam).

## Scope
- Archetype / area: `packages/plugin-process-manager-core` resolvers
- Part of #510
- Depends on: #512 · Blocks: —

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §2 (D5-4) · `plan.md` §4 PM-23

## Acceptance criteria
- [ ] gate: manifest-wins precedence tested against a live-shaped `AspireResource[]` fixture
- [ ] gate: no `AspireResourceKind` extension (consumed only)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Owning/extending Aspire kinds.

## Drift / Debt
- none



## #535 — [process-manager PM-24] pm scaffold.plugin.json + plugin add typed glue (pm.config.ts)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, area:plugins, wave:v1, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/535

## Summary
The pm plugin's `scaffold.plugin.json` + `plugin add process-manager` typed glue: emits `pm.config.ts` via `defineProcessGraph(...)` (E10), pre-seeded by the PM-22 resolvers. **Typesafe codegen only — no vendored source** (#157 law).

## Scope
- Archetype / area: `plugins/process-manager` scaffold manifest + CLI glue
- Part of #510
- Depends on: #512, #533 · Blocks: —

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §4 (D5-5) · `plan.md` §4 PM-24, E10

## Acceptance criteria
- [ ] gate: `plugin add` emits only typesafe userland glue (factory/AST — never string templates/copies)
- [ ] gate: `scaffold.plugins` e2e green with the pm plugin added
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- JSR publish of `plugins/process-manager` (workspace-only per doctrine 05 — installs via `plugin add`).

## Drift / Debt
- none



## #536 — [process-manager PM-25] netscript pm CLI router + read verbs (+ degraded-local reads)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/536

## Summary
The `netscript pm` CLI group (OF-1): router + read verbs — `status`/`logs`/`doctor`/`init`/`add`/`remove`/`explain` — human + `--json` output equal to the contract schemas. **Degraded-local reads defined (F-9):** control plane unreachable → read verbs fall back to `OsServicePort` status/journal reads + KV registry snapshot, clearly marked `source: os-layer (degraded)`; mutations refuse with a pointer at `pm dev`/service start — never silently stale.

## Scope
- Archetype / area: `packages/cli` pm command group (Archetype 6)
- Part of #510
- Depends on: #520, #522 · Blocks: PM-26, PM-28, PM-30

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §1 (PMS-1) · `plan.md` §4 PM-25

## Acceptance criteria
- [ ] gate: `--json` output validates against the contract schemas (same shapes, no CLI-only dialect)
- [ ] gate: degraded mode tested: reads work marked `source: os-layer (degraded)`; mutations refuse with guidance
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Lifecycle verbs (PM-26); monitor (PM-28).

## Drift / Debt
- none



## #537 — [process-manager PM-26] Lifecycle verbs via the shared CommandInvokePort shape
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/537

## Summary
Lifecycle verbs — `start`/`stop`/`restart`/`reload`/`block`/`unblock`/`terminate`/`token`/`enable-service`/`disable-service` — via the shared `CommandInvokePort` shape (E4). Verbs that are not contract routes (`reload`, `enable-service`, `disable-service`) map onto contract routes or `OsServicePort` ops — **never mint hidden routes**.

## Scope
- Archetype / area: `packages/cli` pm command group
- Part of #510
- Depends on: #536, #523, #529 · Blocks: PM-30

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §1.2 + §5.3 (PMS-2) · `plan.md` §4 PM-26, E4

## Acceptance criteria
- [ ] gate: verb→route/OsServicePort mapping table implemented exactly as E4 records it
- [ ] gate: mutations require the bearer token (PM-12) — anonymous mutation refused in tests
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Dashboard `CommandInvokePort` first-definition (#400 owns it by default — bidirectional edge recorded).

## Drift / Debt
- none



## #538 — [process-manager PM-27] pm dev: foreground multiplexer over the engine dev loop
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, type:feat, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/538

## Summary
`netscript pm dev`: foreground multiplexer over the PM-8 engine dev loop — prefixed logs, dependency-order startup, in-loop restart, Ctrl+C teardown. The `--no-aspire` dev fallback story.

## Scope
- Archetype / area: `packages/cli` pm command group
- Part of #510
- Depends on: #519, #533 · Blocks: PM-30

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §1.3 (PMS-3) · `plan.md` §4 PM-27, E13

## Acceptance criteria
- [ ] gate: `pm run` (one-shot single spec) and `pm dev` (supervised graph) both ship (E13)
- [ ] gate: prefixed multiplexed output; Ctrl+C tears the graph down in order on both platforms
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Daemonization (dev is foreground by design — C1).

## Drift / Debt
- none



## #539 — [process-manager PM-28] pm monitor: live status + follow stream (no TUI lib)
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, wave:v1, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/539

## Summary
`netscript pm monitor`: live scrolling status + log stream over PM-13's event stream. No terminal-TUI library dependency (E12 — near-zero-dep; the rich live view belongs to the web console). NDJSON under `--json`.

## Scope
- Archetype / area: `packages/cli` pm command group
- Part of #510
- Depends on: #536, #524 · Blocks: —

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §1.4 (PMS-4) · `plan.md` §4 PM-28, E12

## Acceptance criteria
- [ ] gate: live stream renders without a TUI dependency; NDJSON mode validates against contract event schemas
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Charts/dashboards (PM-29).

## Drift / Debt
- none



## #540 — [process-manager PM-29] Admin console: Fresh app, browser-served by the control plane
- state: open | milestone: 0.0.1-beta.12 | labels: wave:v1, area:fresh-ui, type:feat, status:plan, priority:p2, area:service, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/540

## Summary
The admin console as a Fresh app served by the control-plane service (`@netscript/fresh-ui`), contract-first over the PM-9 routes — **no new routes minted for the UI**. Browser-served mode is the always-ships path (OF-2); desktop packaging (PM-32) and dashboard panel (PM-33) layer on top.

## Scope
- Archetype / area: console app under `plugins/process-manager` (SCOPE-frontend)
- Part of #510
- Depends on: #520, #521, #522, #523, #524 · Blocks: PM-32, PM-33

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §3 (PMS-5) · `plan.md` §4 PM-29

## Acceptance criteria
- [ ] gate: console consumes only the 18 contract routes via the typed client (no bespoke endpoints)
- [ ] gate: auth = the same bearer token (PM-12); no separate UI auth
- [ ] gate: ships on fresh-ui L2 + local composition if the L3 `blocks/` promotion lags (plan §9 residual 4)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Desktop packaging (PM-32); `DashboardPanelContribution` (PM-33).

## Drift / Debt
- none



## #541 — [process-manager PM-30] Docs wave: 7 pages + cli-reference staleness fix
- state: open | milestone: 0.0.1-beta.12 | labels: area:docs, type:docs, wave:v1-min, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/541

## Summary
The pm docs wave (D5 §5): 7 pages (concept, quickstart dev, production bare-metal guide, config reference, CLI reference, console guide, troubleshooting) including the **same-wave `cli-reference.md` staleness fix** + the `pm` verb table.

## Scope
- Archetype / area: docs site (SCOPE-docs)
- Part of #510
- Depends on: #536, #537, #538 · Blocks: PM-31 (merge-readiness)

## Design source
- `research/design/d5-config-scaffold-docs-rfc.md` §5 (D5-6 + PMS-8) · `plan.md` §4 PM-30

## Acceptance criteria
- [ ] gate: docs link-check + Lume build green; no compounding of the cli-reference staleness
- [ ] gate: Windows/Linux capability asymmetry stated plainly (R1)
- [ ] gate: journald/Servy log-ownership interplay documented (PM-7)

## Non-scope
- Marketing/positioning pages (docs-cut epic owns those).

## Drift / Debt
- none



## #542 — [process-manager PM-31] Merge-readiness e2e: scaffold suites + JSR-scoped publish dry-run
- state: open | milestone: 0.0.1-beta.12 | labels: area:cli, gate:e2e, wave:v1-min, type:test, status:plan, priority:p1, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/542

## Summary
The epic's merge-readiness gate: `scaffold.plugins` + `scaffold.runtime` e2e + publish dry-run scoped to the **JSR-published packages only** — `@netscript/deploy-core` + `@netscript/plugin-process-manager-core` (`plugins/process-manager` is workspace-only per doctrine 05; installs via `plugin add`, not JSR — F-8).

## Scope
- Archetype / area: e2e suites + publish surface
- Part of #510
- Depends on: all v1-min slices (PM-0..6, 8–12, 18–19, 21–22, 25–27, 30) · Blocks: epic close
- Run once per epic branch wave, not per slice (expensive gate)

## Design source
- `plan.md` §4 PM-31 + §7 gate matrix

## Acceptance criteria
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green with the pm plugin in the add set
- [ ] gate: `scaffold.plugins` green
- [ ] gate: publish dry-run green for deploy-core + plugin-process-manager-core (JSR set only)

## Non-scope
- Publishing `plugins/process-manager` to JSR (doctrine 05).

## Drift / Debt
- none



## #543 — [process-manager PM-32] Desktop packaging of the console (deno desktop, 5-target cross-compile)
- state: open | milestone: 0.0.1-beta.12 | labels: wave:defer, area:fresh-ui, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/543

## Summary
Package the PM-29 console as a Deno 2.9 Desktop app via the #456 mechanics: `--backend cef` (bare-metal admin boxes can't assume WebView2), 5-target cross-compile, per-app-name persistent KV. **Documented gap inherited verbatim:** Windows auto-update stages-but-does-not-apply. Optional #451 in-process oRPC link as a soft optimization.

## Scope
- Archetype / area: console packaging (SCOPE-frontend)
- Part of #510
- Depends on: #540 · Soft deps: #456 (packaging), #451 (in-process link) — never M1 blockers
- Slips to a later milestone if #456 slips (R8); browser-served mode is the always-ships path

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §3.2–3.4 (PMS-6) · `plan.md` §4 PM-32, R2

## Acceptance criteria
- [ ] gate: packaged binary serves the console with the loopback (or in-process) client on all 5 targets
- [ ] gate: Windows auto-update caveat documented in the console guide
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- New console features — packaging only.

## Drift / Debt
- none



## #544 — [process-manager PM-33] DashboardPanelContribution "Process Control" panel
- state: open | milestone: 0.0.1-beta.12 | labels: wave:defer, area:fresh-ui, type:feat, status:plan, priority:p2, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/544

## Summary
The embedded "Process Control" panel via `DashboardPanelContribution` — **gated on CR-DDX-HOSTAGNOSTIC** (the change request to #400 asking that panel contributions be host-agnostic: descriptor host-neutral, `setup()` receives a host-provided context). Authored as an *adapter* over the pm's own console components, so the standalone path never blocks on #400.

## Scope
- Archetype / area: dashboard panel contribution (SCOPE-frontend)
- Part of #510
- Depends on: #540 + #400 CR resolution · **Slips if the CR is declined/unresolved** (R8)

## Design source
- `research/design/d4-cli-admin-console-surfaces.md` §4 (PMS-7) · `plan.md` §4 PM-33

## Acceptance criteria
- [ ] gate: one contribution renders in two host shells (dashboard + pm console) per the CR acceptance
- [ ] gate: panel consumes the `ProcessManagerContract` client as its data source via the host context
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Redefining DDX-17 (#400 owns the contract change).

## Drift / Debt
- none



## #545 — [process-manager PM-34] systemd --user + linger non-root install mode
- state: open | milestone: 0.0.1-stable | labels: wave:defer, type:feat, status:plan, priority:p3, area:deploy, epic:process-manager
- url: https://github.com/rickylabs/netscript/issues/545

## Summary
Non-root install mode: systemd `--user` units + `loginctl enable-linger` — the unprivileged bare-metal story.

## Scope
- Archetype / area: deploy-core systemd adapter
- Part of #510
- Depends on: #529, #531

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.5 · `plan.md` §4 PM-34

## Acceptance criteria
- [ ] gate: `--user` + linger install path tested end-to-end on a systemd host
- [ ] gate: capability descriptor reflects user-mode limitations (no `DynamicUser`, etc.)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- Windows equivalent (Servy already runs per-user).

## Drift / Debt
- none


