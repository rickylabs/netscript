# Plan — plan-process-manager--seed (Stage E lock)

> **⚠️ AUTHORITY (Stage H, 2026-07-06): FILED — GitHub is now the single source of truth.**
> Epic **#510**, children **#511–#546** (PM-0..PM-35 → see `FILING-LOG.md` for the map and the
> ratified OF picks, incl. OF-9 = beta.8 and OF-5 → Backlog for PM-35). This document is frozen
> design rationale; scope changes happen on the issues, not here.

Seed run, planning-only. This document locks the plan that Stage F (adversarial) attacks, Stage G
(PLAN-EVAL) grades, and Stage H (owner) ratifies before the one-shot filing. Drafts only — zero
board mutation until Stage H in-turn ratification.

**Binding upstream:** `charter.md` · `research.md` §C1–C7 (architecture position, S1–S13, OF-1..7,
scope guards) · `research/design/d1..d5-*.md` (five reviewed packs, slice review gate A1 passed —
worklog Stage-D) · `drift.md` entries 1–5.

---

## 1. Locked architecture (recap, one paragraph)

Mode-split hybrid (C1): the supervision engine is a **library** in a fat Archetype-2 core
(`packages/plugin-process-manager-core`) behind a thin plugin (`plugins/process-manager`); dev
(`--no-aspire`) runs it foreground-attached (`netscript pm dev`, no daemon); production keeps the OS
supervisor (systemd/Servy) as supervisor of record via generated native units through the existing
renderers + `OsServicePort` (extracted to `@netscript/deploy-core` at PM-20 — E5 as amended at
Stage-F triage); the pm's resident production component is a **control-plane service** —
one more OS-supervised sibling unit hosting the typed oRPC surface, never a parent of the workload.
Structurally eliminates the pm2 god-daemon failure class. Full rationale: `research.md` §C1.

## 2. Stage-E resolved decisions (E1–E16)

Supervisor-resolved at plan lock. Each cites the pack evidence; Stage F may attack any of them.

| # | Decision | Resolution | Source |
| --- | --- | --- | --- |
| E1 | **Deploy target key (D3↔D5 conflict)** | **No new key.** The pm is the wired implementation behind reserved `linux-service`/`windows-service`; process-graph knobs are added to the existing `deploy.targets.linux`/`.windows` members (+ a shared pm sub-shape), spreading what `deployTargetBaseShape` already owns. D5 §1.4's separate `process-manager` key is **superseded** by D3 §D3.1.1 and is no longer valid design input (F-16); D5-2's slice is amended accordingly. Stage-F corroborating citation: member names also verified at `packages/config/src/domain/config-section-types.ts:574,580` (F-1). | D3 §D3.1.1 (owns taxonomy per §C5); D5 residual q2 |
| E2 | **Process-state vocabulary** | D1's instance FSM is canonical (engine-internal); D2's wire `ProcessState` enum is a **projection** of it, defined once in `contracts/v1` with an explicit mapping table. No two vocabularies drift independently. | D1 §state machine; D2 §1.2 |
| E3 | **Restart-policy defaults** | S7 pm2 floor locked: exp backoff double-to-cap-**15000ms**, reset-after-**30000ms** stable; D5's schema defaults (30000/10000) corrected to follow D1's controller constants. | S7; D1 restart-controller; D5 §1.3 |
| E4 | **Route naming (D2↔D4)** | D2's explicit contract routes are the contract — the normative v1 route table is D2 §1.3, all 18 routes (F-2): `describe` · `listProcesses` · `getProcess` · `status` · `health` · `getState` · `logs` · `followLogs` · `start` · `stop` · `restart` · `block` · `unblock` · `terminate` · `applyGraph` · `subscribeEvents` · `mintToken` · `revokeToken`. PM-9/PM-10 acceptance = exactly this set. CLI verbs that are not contract routes (`reload`, `enable-service`, `disable-service`) map onto contract routes or `OsServicePort` ops in PM-26 — they never mint hidden routes. The shared `CommandInvokePort` (D4 §5.3) is the port-level adapter shape both epics bind; D4's `invokeCommand{...}` notation reads as "the matching explicit route via the shared port". | D2 §1.3; D4 §5 |
| E5 | **Core-package extraction scope** — *amended at Stage-F triage (F-3)* | Extract the OS-service layer (`OsServicePort` + systemd/servy adapters + renderers + the four conventions + target registry) into **`packages/deploy-core`** (`@netscript/deploy-core`) — the package ARCHETYPE-7 already anticipates ("the core is extracted in a later wave") — **not** into `plugin-process-manager-core`. Rationale: parking deploy-owned artifacts inside a pm-named package would invert the doctrine's expected ownership and force the future deploy-core wave to import from a pm package (Stage-F F-3). `plugin-process-manager-core` **depends on** `@netscript/deploy-core`; `packages/cli` re-exports from it so existing imports stay stable. This is still what makes the F-DEPLOY gate promotion real (D3 §D3.8 precondition) — the promotion now lands with the deploy-core package boundary in PM-20. Filed under this epic because the bare-metal target is what forces the extraction; the deploy lane (#339–#343 successors) inherits a correctly-named home. Largest structural move in the epic. | D3 §D3.8, residual q2; ARCHETYPE-7 §"extracted in a later wave"; Stage-F F-3 |
| E6 | **Linux unix-socket listener** | Deferred. Loopback TCP oRPC is the single control transport in milestone 1. | D2 §4 rec |
| E7 | **Token model** | Opaque high-entropy bearer tokens (Web Crypto, hashed at rest, KV revocation set) — zero-dep. JWT only if cross-host federation (a C7 non-goal) ever lands. | D2 §3.1 (a) |
| E8 | **Event-stream durability** | v1 = live `eventIterator` stream only; reconnecting clients re-sync via `status`/`getState`. Replayable KV event cursor deferred. | D2 residual q3 |
| E9 | **`instances` placeholder** | Hard validation error on `>1` in v1, message pointing at the OF-5 later-milestone design. No fake cluster (S12). | D5 §1.3/q4 |
| E10 | **Config file** | One `pm.config.ts` at workspace root, exported via `defineProcessGraph(...)`; the deploy targets reference it via a `graph` pointer — one file, two consumers. | D5 q5 |
| E11 | **Schema authoring** | Zod-authored, exported as Standard Schema; JSON Schema derived (not hand-maintained — the pup anti-pattern). | D5 §1.1 |
| E12 | **`pm monitor` depth** | v1 = live scrolling status+log stream, no terminal-TUI library dependency (S12 near-zero-dep). Rich live view belongs to the web console. | D4 q4 |
| E13 | **`pm run` vs `pm dev`** | Both kept: `pm run` = one-shot foreground single spec; `pm dev` = supervised multi-process graph. | D4 §1.2/q7 |
| E14 | **Readiness default** | Default = grace-window (spawn + configurable delay → `running`); `sd_notify READY=1` and HTTP probe are opt-in upgrades per process. | D1 q1 |
| E15 | **Telemetry domain refinement** | D2's refinement accepted: mint only `netscript.process`; reuse OTEL semconv identity keys verbatim; no `netscript.service.instance`. Confirm with telemetry T2 owner during implementation (carried note, not a blocker). | D2 §7.1/q7 |
| E16 | **Legacy flat deploy verbs** | PM-0 de-gates them in place (no `WindowsRequiredError` on Linux) and marks them deprecated in help text in favor of the router's `up/down/status/logs`; removal deferred to stable. | D3 q3 |

## 3. Owner-fork sweep (ratify at Stage H)

Numbered forks with supervisor recommendations (full rationale `research.md` §C3). The owner picks
per fork; recommendations are defaults, not decisions.

| Fork | Question | Recommendation |
| --- | --- | --- |
| OF-1 | CLI taxonomy | **(a)** dedicated `netscript pm` group (deploy keeps convergence verbs) |
| OF-2 | Console delivery | **(a)** one Fresh app, three modes: browser-served ships first; desktop packaging soft-dep #E6; embedded dashboard panel third |
| OF-3 | #345 overlap | **(a)** narrow #345 to cross-host HA/secrets/signing; per-host multi-instance moves to this epic (draft body: D3 §D3.7) |
| OF-4 | Dead targets | **(a)** finish-wiring precursor slice (PM-0) — independently shippable before the epic |
| OF-5 | Clustering | **(a)** deferred out of milestone 1; `concurrencyEnvVar` self-fan-out ships; `instances` reserved (E9) |
| OF-6 | launchd | **(a)** out of scope v1 |
| OF-7 | Naming | **(a)** `plugins/process-manager` + `@netscript/plugin-process-manager(-core)`; `pm` = CLI group alias only |
| OF-8 *(new)* | CR-DDX-HOSTAGNOSTIC | Submit the change request to #400 (D4 §4.2 text) as a dependency note; pm standalone path never blocks on it. Owner ack needed because it asks another epic to change |
| OF-9 *(new)* | Milestone loading — **hard fork (F-17): owner must choose at Stage H, no default** | Proposed train (§5) puts M1 on beta.7 which already carries 28 open issues (28 + ~31 pm children = 60+ items if nothing moves). The owner picks **beta.7 or beta.8** for M1 explicitly at ratification; the DAG is milestone-agnostic either way |

## 4. Consolidated slice DAG

39 pack candidates → **36 slices** after merges (D1-S1+D5-1 → PM-1; D1-S10+D2-S1 → PM-2;
D1-S4+D1-S5 → PM-6; D5-6+PMS-8 → PM-30) and extraction of board-drafts to Stage-H items:
**32 milestone-1 slices (PM-0..PM-31) + 4 deferred (PM-32..PM-35)** — counts corrected at Stage-F
triage (F-7). IDs are final; children are filed from these rows via the ISSUE-DRAFT template
(D5 §9). `Wave`: `v1-min` = the cuttable core path (**21 slices**, enumerated in §5); `v1` =
milestone-1 full scope; `defer` = later milestone.

### W0 — Precursor (independent, fix-forward; proposed **hard** beta.6 placement — F-15, owner confirms at Stage H)

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-0 | Wire `linux-service`/`windows-service` through the deploy router; fix `resolveTargetConfig` key→member mismatch (drift 5); de-gate Windows-only flat verbs (E16); fix stale R-DEPLOY-2 comment + "Windows service manager" copy (drift 3/4b) | D3-S1 §D3.2 | — | v1-min |

### W1 — Contract + engine core (`packages/plugin-process-manager-core`)

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-1 | Process-graph contract v1: `ProcessGraphShape`/`ProcessSpecShape` + canonical state vocabulary (E2) + restart/start-policy sub-schemas (E3) + JSON-Schema derivation; reuses `WorkerTaskPermissions` — **includes precursor: re-export `WorkerTaskPermissions` (+ schema) from `@netscript/plugin-workers-core` `mod.ts`** (today it is internal-only, `src/executor/executor-types.ts:33-41`; doctrine 02 bars internal-path imports and 09 bars duplication — Stage-F F-4) | D5-1 + D1-S1 | — | v1-min |
| PM-2 | Telemetry: `PROCESS: 'netscript.process'` domain + `ProcessInstrumentationLike` facade (+ no-op) in `packages/telemetry` | D1-S10 + D2-S1 | — | v1-min |
| PM-3 | Core package scaffold: ports (`ProcessRegistryPort`, runner port) + KV registry adapter (Deno 2.9 per-app-name persistent KV; `['pm',…]` keys) | D1-S2 + D1-S6 | PM-1 | v1-min |
| PM-4 | Restart controller: pure `nextDelay(state, policy, clock)` — S7 numbers locked (E3), windowed budget, skip-exit-codes, memory threshold poll-based with **default `pollIntervalMs: 5000`, configurable per policy** (latency explicit, not just "documented" — F-10) | D1-S3 | PM-1 | v1-min |
| PM-5 | Process runner: lean `Deno.Command`-native (no dax), `RuntimeCommandSpec` + argv builders + `buildEnvironment()` trace injection + `TextLineStream`; descendant-tree kill (POSIX tree walk / `taskkill /T`) | D1-S4 + D1-S5 | PM-1 | v1-min |
| PM-6 | Supervisor loop + composable start policies (autostart / cron via `@netscript/cron` `createScheduler()` / watch via `Deno.watchFs`) | D1-S7 | PM-3..5 | v1-min |
| PM-7 | Log multiplexer + persistent sink (rotation; journald/Servy interplay documented) | D1-S8 | PM-5 | v1 |
| PM-8 | Dev loop + `ShutdownManager` integration (engine side of `pm dev`; Windows signal caveat #28081 handled) | D1-S9 | PM-6 | v1-min |

### W2 — Control plane

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-9 | `ProcessManagerContract` v1: route table + Zod schemas, spread `BASE_PLUGIN_CONTRACT_ROUTES`, `satisfies`, no erasure cast | D2-S2 | PM-1 | v1-min |
| PM-10 | Control-plane oRPC service (`PluginServiceContribution`, `axis:'service'`); async `accepted`-style lifecycle handlers | D2-S3 | PM-9, PM-6 | v1-min |
| PM-11 | Loopback transport + address-descriptor discovery (KV + file) + CLI degraded mode (OS-layer fallback reads); acceptance documents that the control plane is **network-reachable on 127.0.0.1** (TCP-only until E6's unix-socket upgrade) so token auth (PM-12) is understood as load-bearing, not defense-in-depth (F-5) | D2-S4 | PM-10 | v1-min |
| PM-12 | Token auth (opaque bearer, E7) + secrets-convention 0o600 storage + deny-remote default | D2-S5 | PM-10 | v1-min |
| PM-13 | Event stream + follow-logs (`eventIterator`; KV-watch server-internal only; live-only v1 per E8) | D2-S6 | PM-9, PM-10 | v1 |
| PM-14 | Telemetry wiring: span/metric catalog incl. `netscript.process.control_plane.rss.bytes` NFR gauge; 14-point checklist green | D2-S7 | PM-2, PM-10 | v1 |

### W3 — Deploy lane + OS adapters

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-15 | systemd renderer knobs: `Type=notify`/`WatchdogSec`, `HARDENING_BASELINE` profile, `DynamicUser`, cgroups v2 limits — byte-identical rendering when unset | D3-S2 | PM-1 | v1 |
| PM-16 | Pure-Deno `sd_notify` helper (`notifyReady`/`notifyWatchdog`/`watchdogIntervalMs`, no-op outside systemd) + **spike sub-task**: `@`-abstract-namespace `NOTIFY_SOCKET` | D3-S3(+a) | PM-15 | v1 |
| PM-17 | `OsServicePort` capability descriptor (sibling port; systemd advertises watchdog/cgroups/hardening; servy heartbeat/recoveryAction) → config-layer warn-and-omit | D3-S4 | PM-3 | v1 |
| PM-18 | Conventions wiring: pm supplies `ServiceDeployTargetPorts` (activation/health/secrets/observability) promoting the bare descriptors to wired 8-op adapters; health-gated `up` = zero-downtime restart | D3-S5 | PM-0, PM-3 | v1-min |
| PM-19 | Compile adapters: `ProcessSpec` → systemd/servy unit configs in the core (calls the renderers; never a parallel renderer) | D1-S11 | PM-1, PM-15 | v1-min |
| PM-20 | Deploy-core extraction (E5, amended): create **`packages/deploy-core`** and move the OS-service layer + conventions + target registry into it; pm-core depends on it; `packages/cli` re-exports (imports stay stable); **acceptance includes** promoting `F-DEPLOY-1`/`-2` `reviewed`→`gated` in arch:check **in this slice** — the real package boundary this promotion has been waiting on now exists (F-3/F-14) | D3-S6 | PM-18, PM-19 | v1 |

### W4 — Config + scaffold

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-21 | Deploy-facing schema per E1: process-graph knobs on `deploy.targets.linux`/`.windows` members (spread `deployTargetBaseShape`, no re-declares; `graph` pointer + control-plane placement) | D5-2 (amended) | PM-1, PM-0 | v1-min |
| PM-22 | `--no-aspire` resolvers (scaffold.plugin `officialSource` + workspace tasks; concrete argv per S6) + `pm explain` provenance | D5-3 | PM-1 | v1-min |
| PM-23 | `AspireResource[]` resolver (manifest-wins precedence; `command`-kind edge consumed, not owned) | D5-4 | PM-1 | v1 |
| PM-24 | pm `scaffold.plugin.json` + `plugin add` typed glue: `pm.config.ts` via `defineProcessGraph` pre-seeded by resolvers; no vendored source (#157 law) | D5-5 | PM-1, PM-22 | v1 |

### W5 — Surfaces

| ID | Slice | Source | Deps | Wave |
| --- | --- | --- | --- | --- |
| PM-25 | `netscript pm` CLI router + read verbs (`status`/`logs`/`doctor`/`init`/`add`/`remove`/`explain`); human + `--json` == contract schemas; degraded-local reads **defined** (F-9): control plane unreachable → read verbs fall back to `OsServicePort` status/journal reads + KV registry snapshot, clearly marked `source: os-layer (degraded)`, mutations refuse with a pointer at `pm dev`/service start — never silently stale | PMS-1 | PM-9, PM-11 | v1-min |
| PM-26 | Lifecycle verbs (`start`/`stop`/`restart`/`reload`/`block`/`unblock`/`terminate`/`token`/`enable-service`/`disable-service`) via the shared `CommandInvokePort` shape (E4) | PMS-2 | PM-25, PM-12, PM-18 | v1-min |
| PM-27 | `pm dev` CLI: foreground multiplexer over the engine dev loop (prefixed logs, dependency order, in-loop restart, Ctrl+C teardown) | PMS-3 | PM-8, PM-22 | v1-min |
| PM-28 | `pm monitor`: live status+follow stream (no TUI lib, E12; NDJSON under `--json`) | PMS-4 | PM-25, PM-13 | v1 |
| PM-29 | Admin console — Fresh app, browser-served by the control-plane service (`@netscript/fresh-ui`; contract-first, no new routes) | PMS-5 | PM-9..13 | v1 |
| PM-30 | Docs wave: 7 pages (D5 §5) incl. same-wave `cli-reference.md` staleness fix + `pm` verb table | D5-6 + PMS-8 | PM-25..27 | v1-min |
| PM-31 | Merge-readiness e2e: `scaffold.plugins` + `scaffold.runtime` + publish dry-run for the **JSR-published packages only** (`@netscript/deploy-core`, `@netscript/plugin-process-manager-core`); `plugins/process-manager` is workspace-only per doctrine 05 — plugins install via `plugin add`, not JSR (F-8) | epic skeleton §9 | all v1-min | v1-min |

### Deferred (labeled at filing, not milestone-1)

| ID | Slice | Source | Milestone |
| --- | --- | --- | --- |
| PM-32 | Desktop packaging of the console via #E6 mechanics (`--backend cef`, 5-target cross-compile; Windows auto-update caveat documented) | PMS-6 | beta.8 (soft dep #E6/#E1) |
| PM-33 | `DashboardPanelContribution` "Process Control" panel (gated on CR-DDX-HOSTAGNOSTIC / #400) | PMS-7 | beta.8+ |
| PM-34 | systemd `--user` + linger non-root install mode | D3 §D3.5 | stable |
| PM-35 | Per-host multi-instance / clustering (OF-5; template units + reusePort sketch in D1) | D1 sketch | stable (converges with re-scoped #345) |

**Board drafts (Stage H, no code):** #345 re-scope edit (D3 §D3.7 text) · CR-DDX-HOSTAGNOSTIC
comment on #400 (D4 §4.2 text) · `CommandInvokePort` first-definer ack on #400.

## 5. Milestone train (re-derived against the live board, 2026-07-06)

Live facts (WSL `gh`, this session): #327 = OPEN, milestone **0.0.1-stable**. #400 = beta.6 (41
open). Desktop #451(#E1)/#456(#E6) = beta.8 (6 open). #345/#346/#348/#458 = stable. #349/#350 =
Backlog/Triage. beta.7 currently carries 28 open issues. Drift entry 1 resolved: the pm epic hangs
off #327 (`Part of #327`, no closing keyword) but takes its **own** milestones per child.

| Milestone | Content | Notes |
| --- | --- | --- |
| **0.0.1-beta.6** (proposed, hard — F-15) | PM-0 | Independent fix-forward; if it slips, that is a train update at Stage H, not a PM-0 re-scope |
| **0.0.1-beta.7 or beta.8** (M1 — owner picks at Stage H, OF-9 hard fork) | PM-1..PM-31 (`v1-min` floor = 21 slices: PM-0..6, 8–12, 18–19, 21–22, 25–27, 30–31) | beta.7 already carries 28 open issues; the DAG is milestone-agnostic either way |
| **0.0.1-beta.8** (M2) | PM-32, PM-33 | Soft-dep #E6/#E1 (both beta.8); CR to #400 resolved by then or PM-33 slips |
| **0.0.1-stable** (M3) | PM-34, PM-35 + re-scoped #345 convergence | Cross-host HA composes with per-host primitive |

Timeline sanity: #400 (beta.6) precedes M1 (beta.7) → the `CommandInvokePort`
dashboard-defines-first default holds (D4 §5.2); if #400 slips past M1, the direction inverts per
the recorded bidirectional edge.

## 6. Risk register

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | cgroups resource limits have no Windows equivalent (ledger 21) | Warn-and-omit (PM-17); per-field JSDoc asymmetry (S11); docs state it plainly and the Windows warning names the manual alternatives (Job Objects, processor affinity) with a Microsoft-docs link (F-11) |
| R2 | `deno desktop` experimental in 2.9 (ledger 22) | Browser-served console ships first (PM-29); desktop = PM-32, soft-dep, feature-flagged |
| R3 | OTEL_DENO has zero subprocess span coverage (denoland/deno#32752, ledger 23) | pm authors its own spans (PM-14); TRACEPARENT env injection reused; TC-12 no-op fallback |
| R4 | No unix sockets on Windows (denoland/deno#10244, ledger 24) | Loopback TCP oRPC is the single canonical transport (S4/E6) |
| R5 | Windows signals: 6-signal set + listener suppresses default action (denoland/deno#28081, ledger 25) | Dev-loop + control-plane shutdown handlers re-invoke exit/teardown explicitly (PM-8/PM-10) |
| R6 | `sd_notify` abstract-namespace (`@`) support in Deno `unixpacket` unknown | Bounded spike (PM-16 sub-task); path-based happy path never blocks on it |
| R7 | beta.7 already carries 28 open issues | OF-9 owner fork: slide M1; `v1-min` wave marks the cuttable floor |
| R8 | Cross-epic slips: #400 CR declined / #E6 slips | PM-33/PM-32 degrade to later milestones; standalone console + CLI are self-sufficient by design |
| R9 | E5 extraction (OS-service layer → `deploy-core`) destabilizes the shipped deploy lane | Extraction slice (PM-20) is late in the DAG, behind wired conventions (PM-18), with re-exports keeping `packages/cli` imports stable. Stage-F F-3 resolved the ownership inversion: the artifacts land in `@netscript/deploy-core` (the ARCHETYPE-7-anticipated package), not a pm-named package, so the future deploy wave inherits — never imports from — pm. Escape hatch (F-12): if the extraction proves unwieldy mid-PM-20, split it — deploy-core takes only `OsServicePort` + renderers first; conventions + registry follow in a sibling slice |
| R10 | Memory-threshold restart is poll-based (latency vs a real watchdog) | Documented poll interval (S7/D1); never marketed as a watchdog; systemd `WatchdogSec` is the real one where available |

## 7. Gate matrix

Archetypes/overlays: **ARCHETYPE-2** (core package) + **ARCHETYPE-5** (plugin) + **ARCHETYPE-6**
(CLI group) + **ARCHETYPE-7** (deploy-target integration) + SCOPE-service (control plane) +
SCOPE-frontend (console) + SCOPE-docs (docs wave).

| Gate | Applies to | Bar |
| --- | --- | --- |
| Scoped check/lint/fmt (wrappers, `--ext ts,tsx`) | every slice | green before slice sign-off |
| `deno doc --lint` (publish bar, full export map) | PM-1, PM-9, core/public surface slices | clean |
| `deno task arch:check` (+ F-DEPLOY detection once PM-20 lands) | PM-18..21 | green; F-DEPLOY rows flip `reviewed`→`gated` only with a real package boundary |
| Type-soundness law | all | only the 2 accepted casts; no new `any` |
| `scaffold.plugins` e2e | PM-24 | green |
| `scaffold.runtime` + publish dry-run (merge-readiness) | PM-31 (once per epic branch wave, not per slice) | green |
| Byte-identical render check | PM-15 | unset config renders today's unit byte-for-byte |
| 14-point telemetry checklist | PM-14 | all TC rows asserted (D2 §7.5 mapping) |
| Docs link-check + Lume build | PM-30 | green; no compounding of the cli-reference staleness |

## 8. Cross-epic dependency edges (recorded once)

- **#327** — parent (`Part of #327`, no closing keyword; epic closes by hand).
- **#400 dev-dashboard** — (a) `CommandInvokePort` first-definer, default dashboard-defines-first
  with recorded bidirectional fallback; (b) CR-DDX-HOSTAGNOSTIC change request (OF-8); (c) Aspire
  `command` `AspireResourceKind` kind consumed, never extended by the pm.
- **#451 (#E1) / #456 (#E6)** — soft deps for PM-32 only (in-process link optional; packaging).
- **#345** — OF-3 re-scope: cross-host HA stays; per-host multi-instance moves here (PM-35).
- **fresh-ui L3 `blocks/` promotion** — shared dep for PM-29 (sequencing question carried to the
  epic body; PM-29 can ship on L2 + local composition if promotion lags).

## 9. Residual questions still open after Stage E

Carried into the epic body's open-questions section (everything else from the packs' 34 was
resolved by E1–E16 or absorbed into slice acceptance):

1. Telemetry T2 owner sign-off on E15 (no `netscript.service.instance`).
2. #400's answer to CR-DDX-HOSTAGNOSTIC (OF-8) — gates PM-33's milestone only.
3. `followLogs` rate-cap numbers (bounded policy required by PM-13 acceptance; exact figures at
   implementation).
4. Fresh-ui L3-blocks sequencing for PM-29 (§8).

## 10. Stage-H filing plan (one-shot, after ratification)

1. File the epic from D5 §8's skeleton (title, labels incl. `type:umbrella` + `epic:process-manager`,
   milestone per §5, `Part of #327`, no closing keyword), sub-issue checklist enumerating PM-0..PM-35.
2. File 32 + 4 = **36 children** (PM-0..PM-35, count fixed at Stage-F triage F-7) from the D5 §9
   ISSUE-DRAFT template — each `status:plan`, exactly one
   `status:`, `type:`/`area:`/`priority:`/`wave:` labels, milestone mapped from wave, `Part of
   #<epic>`, depends/blocks edges from §4.
3. Post the #345 re-scope edit (D3 §D3.7) and the two #400 comments (CR + first-definer ack).
4. Link the epic as a child under #327.
5. Update PR #504 body with the filed issue numbers; Stage I hands off implementation briefs.
