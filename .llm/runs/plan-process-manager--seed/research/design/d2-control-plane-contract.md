# D2 — Control Plane + Contract (design proposal, draft)

Tier-B design pack for `plan-process-manager--seed`. Scope per Stage-C C6/D2: the
`ProcessManagerContract extends BasePluginContract` route table, the oRPC-over-loopback transport,
token auth, per-platform IPC, the event surface, the `netscript.process` telemetry catalog graded
against the 14-point checklist, the pm2-OTEL re-check (ledger 19), a slice decomposition, and
residual questions for Stage E. Nothing here is filed; drafts only until Stage H.

Binding inputs: `research.md` §C1 (mode-split hybrid — the pm's resident production component is a
**control-plane service**, an OS-supervised sibling unit, never a parent of the workload), S4 (oRPC
over HTTP loopback = the one canonical transport; unix sockets disqualified as primary by
denoland/deno#10244; `WatchableKv` = subscribe convenience only; `unixpacket` only for `sd_notify`),
S5 (new `netscript.process` domain; pm authors its own subprocess spans — OTEL_DENO gap
denoland/deno#32752), S11 (Windows asymmetry), S12 (anti-god-daemon, own-RSS NFR). Every non-obvious
claim is cited to `file:line`, a corpus doc §, or a URL.

---

## 1. Contract — `ProcessManagerContract extends BasePluginContract`

### 1.1 The seam (cited)

Every NetScript feature plugin contract converges on one seam: an object that spreads
`BASE_PLUGIN_CONTRACT_ROUTES` (the mandatory typed `describe` route returning a `PluginCapabilities`
document) and is declared `... satisfies BasePluginContract`
(`packages/plugin/src/contract-base/domain/base-contract.ts:76-81,109-122`). There is **no runtime
inheritance in oRPC** — contracts compose by object spread and conform by TypeScript `satisfies`
(same file, module doc `:1-23`). The workers contract is the reference implementation to model on:
it declares `interface WorkersContractDefinition extends BasePluginContract`, builds a shared
`baseContract = oc.errors({ ...BASE_PLUGIN_ERRORS } as unknown as ...)`
(`packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:44-46,357-398`), a
`Route<TIn, TOut>` alias (`:65-70`), spreads `...BASE_PLUGIN_CONTRACT_ROUTES` into the definition
object (`:414`), and hands the whole object to `implement()` with **no erasure cast** (`:545-547`).
Streaming routes are built via `oc.route(...).output(eventIterator(<schema>))` — the workers
`subscribe` route is exactly this (`:511-514`, type alias `:332-343`). `ProcessManagerContract`
follows this pattern verbatim; the type sketches below use the same idioms.

The dashboard pack already established the precedent that a UI-serving process plugin defines
`ProcessManagerContract extends BasePluginContract` with `processes`/`processById`/`logs (?follow)`/
`invokeCommand` routes mirroring the dashboard route table shape (r4 §4.1, `:251-258`). D2 makes that
concrete.

### 1.2 Domain types (owned by D1's core; contract imports them)

The contract references core-owned domain types (D1 owns `plugin-process-manager-core`; the process
state machine, registry, restart policy). D2 depends on these type names existing — a **dependency
edge D2 → D1** (§8). Sketch (Zod schemas live beside the contract; TS shapes shown for clarity):

```ts
// Lifecycle state — the observable state machine D1 owns.
type ProcessState =
  | 'pending'      // known in the graph, not yet started
  | 'starting'     // spawn issued, not yet confirmed running
  | 'running'      // healthy/alive
  | 'degraded'     // running but failing health probes
  | 'restarting'   // in a backoff window between exits
  | 'blocked'      // auto-heal suppressed (pup block/unblock, m1 §1.6) — may be running or stopped
  | 'stopped'      // intentionally stopped, no auto-restart
  | 'exited'       // terminated; terminal unless restart policy re-arms
  | 'crash-looped' // restart budget exhausted (S7 windowed budget)

type StartPolicy = 'autostart' | 'cron' | 'watch';        // composable, not pick-one (S8, m1 §1.2)
type SupervisionMode = 'dev-attached' | 'os-service';      // C1.2 vs C1.3

interface ProcessSummary {
  id: string;                    // 1–64 char [a-z0-9@._-], pup's id pattern (m1 §1.1)
  name: string;
  state: ProcessState;
  mode: SupervisionMode;
  pid: number | null;            // null when not running / OS-service-owned
  instanceIndex: number | null;  // cluster instance (OF-5, later milestone); null = singleton
  restartCount: number;
  uptimeSeconds: number | null;
  health: HealthState;           // see §1.4
  blocked: boolean;              // auto-heal suppressed
  startedAt: string | null;      // ISO-8601
}

interface ProcessDetail extends ProcessSummary {
  argv: readonly string[];       // resolved concrete executable+args, never a `deno task` alias (S6, m4 §3)
  cwd: string;
  env: Readonly<Record<string, string>>; // secret VALUES redacted before this crosses the wire (TC-8)
  startPolicies: readonly StartPolicy[];
  restartPolicy: RestartPolicySnapshot;   // D1-owned: backoff cap, windowed budget, skipExitCodes, memThreshold (S7)
  lastExit: { code: number | null; signal: string | null; at: string } | null;
  rssBytes: number | null;       // last sampled RSS (Windows heartbeat ceiling, S11)
  osServiceName: string | null;  // the OsServicePort unit name in os-service mode (r3 §6)
}
```

### 1.3 Route table (full, typed)

`baseContract` carries the shared `BASE_PLUGIN_ERRORS` vocabulary (`NOT_FOUND`, `VALIDATION_ERROR`,
`INTERNAL`) exactly as workers converges on it
(`.../workers.contract-definition.ts:35-46`). Routes below are grouped; every one is a real oRPC
`ContractProcedure`. Query/observation routes are `GET`; mutations are `POST`; streaming routes use
`eventIterator`.

```ts
interface ProcessManagerContractDefinition extends BasePluginContract {
  // ---- Base seam (mandatory) --------------------------------------------------
  readonly describe: BasePluginDescribeRoute;                 // GET /describe -> PluginCapabilities

  // ---- Read / observe ---------------------------------------------------------
  readonly listProcesses: Route<typeof listProcessesInput, typeof listProcessesOutput>;
  // GET /processes            -> { processes: ProcessSummary[], total } ; filter by state/name/mode
  readonly getProcess: Route<typeof idInput, typeof ProcessDetailSchema>;
  // GET /processes/{id}       -> ProcessDetail
  readonly status: Route<typeof emptyOptionalInput, typeof AggregateStatusSchema>;
  // GET /status               -> aggregate: counts by state, worstHealth, controlPlane self-report (pup GET /state, m1 §1.6)
  readonly health: Route<typeof healthInput, typeof HealthReportSchema>;
  // GET /health               -> whole-instance health ; GET /health?id=… -> one process's probe result
  readonly getState: Route<typeof idInput, typeof ProcessStateSnapshotSchema>;
  // GET /processes/{id}/state -> fine-grained state snapshot (fsm state + transitions + restart budget remaining)

  // ---- Logs -------------------------------------------------------------------
  readonly logs: Route<typeof logsQueryInput, typeof logsPageOutput>;
  // GET /processes/{id}/logs  -> historical, filterable, paginated (severity/since/until/limit/offset)
  readonly followLogs: FollowLogsRoute;
  // GET /processes/{id}/logs/follow -> eventIterator(LogLineSchema)  (tail -f; see §1.5 mechanism)

  // ---- Lifecycle actions ------------------------------------------------------
  readonly start: Route<typeof idInput, typeof ActionResultSchema>;      // POST /processes/{id}/start
  readonly stop: Route<typeof stopInput, typeof ActionResultSchema>;     // POST /processes/{id}/stop   (grace/timeout override)
  readonly restart: Route<typeof idInput, typeof ActionResultSchema>;    // POST /processes/{id}/restart
  readonly block: Route<typeof idInput, typeof ActionResultSchema>;      // POST /processes/{id}/block   (suppress auto-heal — policy toggle, NOT a stop)
  readonly unblock: Route<typeof idInput, typeof ActionResultSchema>;    // POST /processes/{id}/unblock
  readonly terminate: Route<typeof terminateInput, typeof ActionResultSchema>;
  // POST /terminate           -> orderly teardown of the whole supervised graph (pup POST /terminate, m1 §1.6)

  // ---- Config / graph reconcile (thin; D5 owns the config schema) -------------
  readonly applyGraph: Route<typeof applyGraphInput, typeof applyGraphOutput>;
  // POST /graph/apply         -> reconcile the declarative process graph (add/remove/update). Capability-gated.

  // ---- Events -----------------------------------------------------------------
  readonly subscribeEvents: SubscribeEventsRoute;
  // GET /events               -> eventIterator(ProcessEventSchema)  (lifecycle event stream; see §5)

  // ---- Auth (token lifecycle; see §3) -----------------------------------------
  readonly mintToken: Route<typeof mintTokenInput, typeof mintTokenOutput>; // POST /tokens
  readonly revokeToken: Route<typeof revokeTokenInput, typeof ActionResultSchema>; // DELETE /tokens/{id}
}
```

Supporting streaming-route + result sketches (modeled on the workers `SubscribeRoute`,
`.../workers.contract-definition.ts:332-343`):

```ts
type FollowLogsRoute = ContractProcedureBuilderWithInputOutput<
  typeof followLogsInput, ReturnType<typeof eventIterator<LogLineIn, LogLineOut>>,
  Record<never, never>, Record<never, never>>;

type SubscribeEventsRoute = ContractProcedureBuilderWithInputOutput<
  typeof subscribeEventsInput, ReturnType<typeof eventIterator<ProcessEventIn, ProcessEventOut>>,
  Record<never, never>, Record<never, never>>;

interface ActionResult {          // uniform lifecycle-action envelope
  id: string;
  action: 'start' | 'stop' | 'restart' | 'block' | 'unblock' | 'terminate';
  accepted: boolean;              // command accepted (async); state transition observed via events/status
  state: ProcessState;            // best-known state immediately after acceptance
  correlationId: string;          // netscript.correlation.id — threads to the emitted span (TC-7)
}
```

**Design calls in the route table:**

1. **Lifecycle actions are `accepted`-style (async), not synchronous.** `start`/`restart` return once
   the command is accepted; the caller observes the actual transition via `subscribeEvents`/`status`.
   This matches how the OS layer behaves in os-service mode (systemctl/servy commands are issued, the
   unit transitions asynchronously — `OsServicePort.run(op, name)`,
   `packages/cli/src/public/ports/os-service-port.ts:36-45`) and avoids a handler that blocks on a
   backoff window. Every `ActionResult` carries a `correlationId` so the emitted span (`§7`) and the
   resulting event correlate (TC-7).
2. **`block`/`unblock` is a first-class verb distinct from stop/start**, kept verbatim from pup as a
   named concept — it flips whether the supervisor may auto-restart, independent of running state
   (m1 §1.6, §1.8; concept-checklist item 4, m1 §4). It is the "pause auto-heal without stopping"
   control an operator wants during triage.
3. **`terminate` is instance-scoped teardown**, not a per-process stop — it fans out through the
   core's `ShutdownManager` priority-ordered stop (reused from
   `packages/plugin-workers-core/src/shutdown/shutdown-manager.ts:33-136`, r3 §1) and, in os-service
   mode, is the control-plane service's own graceful-shutdown path.
4. **`applyGraph` is the single mutation entrypoint for "what should be supervised."** Ad-hoc
   `append`/`remove` (pup m1 §1.8) is modeled as a graph reconcile rather than imperative add/remove
   so the declarative config (D5) stays authoritative; runtime add/remove is a **capability-gated**
   extension (`describe`'s `PluginCapabilities` advertises whether the active backend supports live
   reconcile — the `DeployTargetPort` "omit rather than silent no-op" optional-method pattern,
   S10/r2 §3). In os-service mode a reconcile compiles to OS-unit generation (D3); in dev-attached
   mode it mutates the live registry.
5. **`describe` advertises capabilities per active mode.** `supportsWatch` (KV), `supportsLiveReconcile`,
   `supportsCluster` (OF-5 → false in milestone 1), `platform` (windows/linux), and
   `mode` (dev-attached/os-service) are surfaced in the `PluginCapabilities` document so CLI/console
   degrade correctly instead of calling routes the backend can't honor.

---

## 2. Transport — oRPC over HTTP loopback

### 2.1 Position (S4, cited)

The typed oRPC contract **over HTTP loopback**, served by the pm's control-plane service, is the one
canonical transport for all four consumer classes: CLI, desktop console, dashboard panel, third
parties (research.md S4, C1.4; pup's "one control surface, everything else is a client of it"
upgraded with end-to-end types — m1 §1.6-1.8, concept-checklist item 7). The service is declared as a
`PluginServiceContribution` (`axis:'service'`, `name`, `entrypoint` exporting the oRPC service —
`packages/plugin/src/abstracts/plugin-service-contribution.ts:4-11`), exactly how workers/sagas/
triggers expose their routers (r3 §4). The control-plane service is itself one more OS-supervised
sibling unit registered through `OsServicePort` (C1.4) — if it dies, the workload keeps running and
systemd/Servy restart the control plane; managed processes are **never its children** (S12).

Raw unix-socket IPC is **disqualified as the primary channel** because Deno's `transport:'unix'` has
no Windows named-pipe support (denoland/deno#10244, m4 §5; ledger 24). `WatchableKv` is a
subscribe/notify convenience where `supportsWatch`, never the command bus (S4; §5 below).
`unixpacket` appears **only** in the Linux `sd_notify` helper (S4, m3 §5; §4 below).

### 2.2 Bind / port / discovery

- **Bind address: loopback only by default** (`127.0.0.1`, and `::1` where present) — local-only
  posture (§3.3). Never binds `0.0.0.0` without an explicit, documented opt-in; a process supervisor's
  control plane is a privileged surface.
- **Port strategy: fixed default with ephemeral fallback + an address file.** The service tries a
  fixed default port (e.g. `44710`, in the same private range as the streams service `4437`,
  `plugins/streams/scaffold.plugin.json:49-66`, r4 §2.3); on collision it binds an ephemeral port.
  Either way it writes an **address descriptor** — `{ host, port, pid, token-fingerprint, startedAt }`
  — to a well-known per-app location so clients discover it without configuration.
- **Discovery: two-source, KV-first.** The descriptor lives in (a) the daemon's persistent
  `Deno.openKv()` under `['pm','control-plane','address']` (Deno 2.9's per-`--app-name` persistent KV
  for compiled binaries — the zero-dependency daemon-state backing, S3/m4 §5,§7.7), and (b) a plain
  address file under the platform app-data dir as the bootstrap fallback the CLI reads before it even
  opens KV. The CLI/console resolve the descriptor, then open an oRPC client over loopback HTTP.
- **Multi-instance hosts** (several NetScript apps on one box) key the descriptor by `--app-name`, so
  each app's control plane is independently discoverable; this rides Deno 2.9's `--app-name`-keyed
  store identity that survives binary rename (m4 §5, §7.7).

### 2.3 Behavior when the control plane is down (CLI degraded mode)

When no live descriptor resolves, or the loopback connection is refused, the CLI enters **degraded
mode** and reads the OS layer directly rather than failing:

- `status`/`list` degrade to querying `OsServicePort.run('status', name)` per known unit name
  (`os-service-port.ts:36-45`, r3 §6) — single-target only, no aggregate, no live RSS/uptime, but
  honest. The CLI labels the output "control plane unavailable — showing OS-service view."
- `logs` degrade to journald (systemd `StandardOutput=journal`,
  `packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:131-132`, r3 §6) or the Servy
  `stdoutPath`/`stderrPath` rotated files
  (`packages/cli/src/kernel/adapters/windows/servy/servy-config.ts:89-93`, r3 §6). No `follow` stream
  in degraded mode (no control plane to hold the tail); the CLI points the operator at
  `journalctl -f`/the Servy log path.
- Lifecycle actions degrade to `OsServicePort.run('start'|'stop', name)` where a unit exists; ad-hoc
  actions on dev-attached processes are simply unavailable (there is no daemon to talk to — correct,
  since in dev-attached mode there is no resident process anyway, C1.2).
- The control-plane service is registered as an OS-supervised unit, so in production its own
  down-state is transient: systemd/Servy restart it (C1.4); degraded mode is the window before that
  restart lands, not a steady state.

This degraded fallback is the direct payoff of the C1 hybrid: because the OS layer is supervisor of
record, the CLI always has a lower-level truth to read even when NetScript's control plane is absent.

---

## 3. AuthN / Z

### 3.1 Token model (pup's revocable JWT as prior art)

pup mints per-consumer JWTs via `pup token --consumer <name>` with expiry, revocable per-token via an
`api.revoked` list in config; requests carry `Authorization: Bearer <jwt>` (m1 §1.6, §1.7 —
`refreshApiToken()` drives rotation). The pm keeps this **shape** — named, expiring, individually
revocable tokens — because it is the right model for third-party/plugin consumers that should be
independently revocable. Contract routes: `mintToken` (`POST /tokens`, returns `{ id, token, expiresAt }`)
and `revokeToken` (`DELETE /tokens/{id}`), plus a persisted revocation set in KV under
`['pm','tokens','revoked']`.

**Fork, flagged for Stage E (§9):** a full JWT implementation pulls a signing dependency, which rubs
against S12's "core stays zero/near-zero npm deps" posture (m4 §7.6). Two options:
- **(a) Opaque high-entropy bearer tokens** (Web Crypto `crypto.getRandomValues`, hashed at rest),
  no JWT library — zero-dep, revocation is a KV set membership check, no expiry-claim self-description
  but the daemon owns the token table anyway. **Supervisor lean: (a)** — it preserves the zero-dep
  posture and loses nothing for a local-only control plane (the JWT's self-describing claims matter
  for stateless multi-server verification, which a single-host control plane does not have).
- **(b) JWT** for wire-compatibility with pup-ecosystem expectations. Only justified if cross-host
  federation (a Stage-E non-goal, C7) ever lands.

### 3.2 Where the secret lives (secrets-convention reuse)

The control-plane's token-signing/hashing material and any minted tokens are persisted through the
**deploy secrets-convention** already shipped: `reconcileSecrets` renders a restricted-permission env
file (`0o600`, owner read/write only — `RESTRICTED_SECRET_FILE_MODE`,
`packages/cli/src/kernel/domain/deploy/secrets-convention.ts:1-25,44-59`) behind an injected
`SecretsStorePort` (S10, r2 §2). The pm does not invent a key store; its control-plane secret is one
more `SecretRef` in the target's `SecretsBundle` (`secrets-convention.ts:27-41`). On bare-metal that
is the env-file store (`packages/cli/src/kernel/adapters/secrets/env-file-secrets-store.ts`); the pm's
token secret is reconciled the same restricted-mode way as `DATABASE_URL`.

### 3.3 Local-only default posture

Default deny-remote: loopback bind (§2.2), tokens required for every route except `describe` (which
returns only capability metadata, no process data). In dev-attached mode (`netscript pm dev`, C1.2)
the control plane is short-lived and loopback-bound; a single auto-minted session token is handed to
the launching CLI so the operator is not prompted. In os-service mode the token is provisioned once at
install (through the secrets-convention) and shared with the CLI/console via the address descriptor's
token fingerprint + the secrets file. Remote administration is an explicit, documented opt-in
(bind-address + a real token), never a default — consistent with S11's "never imply parity/openness we
did not design for."

---

## 4. Per-platform IPC notes (S4 / S11)

- **Windows: TCP loopback is the control channel, full stop.** No unix-socket/named-pipe transport
  exists (denoland/deno#10244, m4 §5), so `127.0.0.1:<port>` oRPC-over-HTTP is the only cross-platform
  code path and is therefore the primary everywhere (S4). Windows also has a restricted signal set
  (`SIGINT`/`SIGBREAK`/`SIGTERM`/`SIGQUIT`/`SIGHUP`/`SIGWINCH` only) and "registering a listener
  suppresses Deno's default action" (denoland/deno#28081, m4 §5; ledger 25) — so the control-plane
  service's own graceful-shutdown handler must re-invoke exit/child-teardown it would otherwise get
  for free. Windows resource signals are heartbeat fields (RSS sampling), not a watchdog socket — the
  Servy `heartbeatIntervalSeconds`/`maxFailedChecks` ceiling (S11, m3 §7.4;
  `servy-config.ts:95-98`, r3 §6).
- **Linux: an optional unix-socket listener MAY be offered as a same-host latency/permission
  convenience, but never as the only channel.** The oRPC-over-loopback contract remains authoritative
  and identical; a unix-socket listener is a bind-address variant of the same oRPC service (filesystem
  permissions on the socket path give an extra local-only guard). This is optional because it buys
  little over loopback TCP for a local control plane and doubles the transport surface — recommend
  **defer to a later milestone** unless a concrete latency/permission need appears (Stage E, §9).
- **`sd_notify` stays a separate, Linux-only channel — by design, not oversight.** Readiness/watchdog
  notification to systemd uses `Deno.listenDatagram({ transport:'unixpacket' })` writing to
  `$NOTIFY_SOCKET` (buildable in pure Deno, no FFI — m3 §5,§7.2). It is a **one-way datagram to the
  OS supervisor**, semantically unrelated to the bidirectional typed control plane: it exists so the
  control-plane service (a `Type=notify` unit, D3) can tell systemd "I am ready / still alive," which
  is what lets systemd own liveness enforcement (C1.3). Folding it into the oRPC channel would conflate
  "the OS supervises me" with "clients command me" — two different trust directions. The abstract-
  namespace `@`-prefixed `$NOTIFY_SOCKET` support spike is routed to D3 (research.md C5).

---

## 5. Event surface

### 5.1 Event catalog (pup's `.on()` set as prior art)

pup emits a fixed lifecycle event set consumers subscribe to via `.on()`: `log`, `init`, `watchdog`,
`process_status_changed`, `process_scheduled`, `process_watch`, `terminating`, `ipc` (m1 §1.7). The
pm generalizes this into a typed discriminated union, `ProcessEvent`, mapped onto NetScript naming and
the `netscript.process` domain (§7):

```ts
type ProcessEvent =
  | { type: 'process.spawned';        id: string; pid: number; at: string; correlationId: string }
  | { type: 'process.exited';         id: string; code: number | null; signal: string | null; at: string }
  | { type: 'process.restart-scheduled'; id: string; attempt: number; delayMs: number; reason: string; at: string }
  | { type: 'process.status-changed'; id: string; from: ProcessState; to: ProcessState; at: string }
  | { type: 'process.health-changed'; id: string; health: HealthState; at: string }
  | { type: 'process.blocked';        id: string; at: string }      // auto-heal suppressed
  | { type: 'process.unblocked';      id: string; at: string }
  | { type: 'process.scheduled';      id: string; policy: StartPolicy; nextRunAt: string | null; at: string }
  | { type: 'control-plane.ready';    at: string }                  // pup `init`
  | { type: 'control-plane.terminating'; at: string }               // pup `terminating`
  | { type: 'graph.reconciled';       added: string[]; removed: string[]; at: string };
```

(`process.crash-looped` is surfaced as a `status-changed` to `crash-looped`, keeping the union flat.)

### 5.2 How consumers subscribe — mechanism choice, justified

**Two mechanisms, one authoritative:**

1. **oRPC `subscribeEvents` → `eventIterator(ProcessEventSchema)` is the canonical, cross-consumer
   subscription** (built exactly like the workers `subscribe` route,
   `.../workers.contract-definition.ts:511-514`; `eventIterator` from `@orpc/server`, `:8`). It rides
   the same loopback-HTTP oRPC channel already serving commands (one transport, S4), is typed
   end-to-end, works identically for CLI/console/dashboard/third-parties on every platform (Windows
   included, since it needs no unix socket), and gives ordered, backpressured delivery. This is the
   default and the only mechanism a third party ever needs.
2. **`WatchableKv.watchPrefix(['pm','events'])` is an in-daemon/co-located subscribe convenience,
   never the third-party bus.** Where the KV adapter reports `supportsWatch === true` (native
   `Deno.Kv.watch()`, `packages/kv/types/watchable-kv.ts:37-101,109`), the control-plane service uses
   `watchPrefix` internally as its own change-notification source (the daemon writes an event record
   to KV, its own subscribers wake) and a co-located dashboard panel MAY read it directly. This is the
   "primitive exists, wire it" opportunity r3 §5 identifies.

**The load-bearing fallback when KV lacks watch:** on adapters where `supportsWatch === false` (Redis
and other poll-only backends — `watchable-kv.ts:109`, `isWatchable()` guard `:118-124`), the daemon
**does not** expose a degraded KV watch to clients. Instead the **server-side** falls back to its own
internal polling loop (or an in-process EventTarget fed by the supervision loop directly, bypassing KV
entirely for notification), and every external client continues to use the **oRPC `eventIterator`
stream unchanged** — the client holds exactly one HTTP stream regardless of backend. In other words:
KV-watch capability is a server-internal optimization; the client contract (`subscribeEvents`) is
invariant across backends. This keeps the "one transport" invariant (S4) and means no consumer code
branches on `supportsWatch`.

### 5.3 Follow-logs mechanism (why oRPC eventIterator, not KV watch)

`followLogs` (`GET /processes/{id}/logs/follow`) uses `eventIterator(LogLineSchema)`, **not**
`WatchableKv`. Justification: log lines are high-frequency, append-only, strictly ordered, and lossy
coalescing is unacceptable (you must not drop lines). `WatchableKv.watch` yields
debounced/coalesced snapshot-diffs (its own docs describe watch as change-observation with a debounce,
and `watchPrefix` as "native watch + periodic polling" — `watchable-kv.ts:65-101`), which is
last-value-wins per key and wrong for an ordered line stream. The live log primitive already exists as
a callback stream in the workers dax runner (`onLog`/`onStdout`/`onStderr`,
`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:140-149`, r3 §1) — the pm
core wraps that same stream and re-emits each classified line through the `followLogs` event iterator.
Historical `logs` (paginated query) reads the persisted log store; `followLogs` streams live tail.
pup shipped neither pagination nor rate-limiting on `/logs` (m1 §1.6) — the pm adds both (a bounded
`limit`/`offset` on `logs`, a documented backpressure/rate policy on `followLogs`), flagged §9.

---

## 6. pm2 OTEL re-check (ledger 19)

**Claim under test:** the RFC's "typed OTEL-native control plane is the differentiator" (m2) is safe
only if pm2 has no first-party OTEL/Prometheus exporter. **Verdict: SAFE — cite, do not soften.**

Targeted web check (2026-07-06): pm2's own first-party monitoring is **`@pm2/io` / `pm2-io-apm`, a
proprietary paid product** (PM2 Plus / PM2 Enterprise, push-based to Keymetrics' backend). There is
**no first-party OpenTelemetry exporter** and **no first-party open Prometheus scrape endpoint** —
Prometheus support is exclusively **third-party community modules** (`pm2-metrics` / community
`pm2-prometheus-exporter` on port 9209, `pm2-prom-module` on 9988), and PM2 Enterprise's only
Prometheus tie is a push-based gateway that "currently only the alerting system works with" (PM2
Enterprise docs). This matches m2's anti-feature finding (SaaS-only monitoring via `@pm2/io`, reject —
m2 §13.1/anti-feature list). So a NetScript pm that emits **first-party OTLP spans + metrics** for
spawn/restart/crash/health (via OTEL_DENO's exporter, §7) is a genuine differentiator over both pm2
(paid SaaS + third-party Prometheus glue) and pup (bespoke polling-IPC `PupTelemetry`, m1 §1.5, §3
table). The RFC may assert this without hedging.

Sources:
- [PM2 Enterprise — Prometheus Integration](https://pm2.io/docs/enterprise/collector/prometheus/)
- [community pm2-prometheus-exporter](https://github.com/saikatharryc/pm2-prometheus-exporter)
- [pm2-metrics (npm, community)](https://www.npmjs.com/package/pm2-metrics)

---

## 7. Telemetry catalog (S5)

### 7.1 Attribute domain — add `netscript.process`, reuse OTEL semconv where it exists

`NetScriptAttributeDomains` today enumerates JOB…KV with **no `PROCESS` entry**
(`packages/telemetry/src/domain/telemetry-convention.ts:30-46`). Add:

```ts
PROCESS: 'netscript.process',   // supervision-specific proprietary attributes
```

**Refinement over S5's parenthetical "(+ likely SERVICE_INSTANCE)": do NOT mint a
`netscript.service.instance` domain by default.** TC-5 requires OpenTelemetry semantic-convention keys
verbatim where they exist (`telemetry-convention.ts:77`), and OTEL already standardizes the identity
attributes a process manager needs: `process.pid`, `process.command_args`, `process.executable.name`,
`process.runtime.name`, `service.instance.id`, `service.name`. Those are used **verbatim** (TC-5).
`netscript.process.*` is reserved strictly for supervision concepts OTEL does not model:

| Attribute | Purpose |
| --- | --- |
| `netscript.process.id` | pm's stable process id (distinct from OS `process.pid`) |
| `netscript.process.state` | fsm state (`running`/`restarting`/`blocked`/`crash-looped`…) |
| `netscript.process.mode` | `dev-attached` \| `os-service` |
| `netscript.process.start_policy` | `autostart`/`cron`/`watch` (composable set) |
| `netscript.process.restart_policy` | policy name (backoff/windowed-budget snapshot) |
| `netscript.process.restart_count` | restarts observed this supervision session |
| `netscript.process.restart_reason` | `crash` \| `health-fail` \| `manual` \| `watch-trigger` |
| `netscript.process.block_state` | auto-heal suppressed (bool) |
| `netscript.process.health_status` | `healthy`/`degraded`/`unknown` |
| `netscript.process.instance_index` | cluster instance (OF-5; absent in milestone 1) |

Every correlated span also carries the cross-domain floor `netscript.correlation.id`
(`NetScriptCorrelationAttributes`, `telemetry-convention.ts:51-53`) — TC-7.

### 7.2 Span catalog

Spans authored by the pm itself (OTEL_DENO has **zero** subprocess span coverage — auto-instrumented
list is HTTP-server/HTTP-client/HTTP2/cron only; denoland/deno#32752 open — m4 §4; S5). Names use the
central `<domain>.<operation>` hierarchy (TC-1):

| Span | When | SpanKind | Notes |
| --- | --- | --- | --- |
| `netscript.process.spawn` | each `Deno.Command` spawn | `INTERNAL` | records `process.pid`, `process.command_args` (argv, secret args redacted TC-8), OK/ERROR status TC-3 |
| `netscript.process.restart` | a restart within a backoff window | `INTERNAL` | span events (TC-4) for each attempt: `attempt`, `delayMs`, `restart_reason`; no child span per breadcrumb |
| `netscript.process.crash` | unexpected exit (non-zero / signal, not in skip-codes) | `INTERNAL` | ERROR status + exception; `exit.code`/`signal` |
| `netscript.process.health-probe` | each health check | `CLIENT` (HTTP probe) or `INTERNAL` (pid/heartbeat) | `CLIENT` when it does an outbound `fetch` to `healthCheckUrl` (servy-config health URL shape, r3 §6) |
| `netscript.process.lifecycle-action` | a control-plane action handler runs | `SERVER` | the oRPC handler span; child `INTERNAL` for the actual OS/engine action; carries `correlationId` from `ActionResult` (TC-7, §1.3) |

Fan-in (e.g. `terminate` fanning out to N stops) uses **span links at creation time**, not
parent-child edges (TC-14). W3C context is extracted on ingress (the oRPC request) and injected on
egress into children (TC-9, §7.4).

### 7.3 Metrics

Per-domain instruments behind the shared telemetry layer (TC-11), authored by the pm (OTEL_DENO gives
none for subprocesses):

| Metric | Instrument | Notes |
| --- | --- | --- |
| `netscript.process.uptime` | gauge (seconds) | per supervised process |
| `netscript.process.restart.count` | counter | monotonic per process; drives crash-loop detection |
| `netscript.process.rss.bytes` | observable gauge | per managed process; Windows path is heartbeat-sampled (S11) |
| `netscript.process.health.failures` | counter | consecutive failed probes (maps to Servy `maxFailedChecks`, r3 §6) |
| **`netscript.process.control_plane.rss.bytes`** | **observable gauge (NFR)** | **the control-plane service's OWN RSS** |

The **control-plane's own RSS is an explicit NFR metric** (S12/m2/m2 §2): pm2's defining failure class
is the shared always-on god-daemon's unbounded RSS (150GB+ incidents across three major versions —
m2 §2, anti-feature 13.1). The pm's control plane is deliberately **not** a parent of the workload
(C1.4), and this metric is the guard that proves it: the RFC sets a documented RSS ceiling for the
control-plane service and the metric makes a regression toward god-daemon bloat observable. Async/
observable metrics are not flushed on crash in Deno's OTEL (documented limitation, m4 §4) — the
control-plane RSS gauge is sampled on a timer and also recorded as a sync counter checkpoint so a
crash still leaves a last-known value.

### 7.4 Child trace-context injection (cite the workers seam)

The pm reuses the **existing** subprocess trace-context injection convention verbatim (TC-10):
`DaxProcessRunner.buildEnvironment()` already injects `TRACEPARENT`, `TRACESTATE`, and
`CORRELATION_ID` into a spawned child's env when present on the resolved options
(`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-98`, r3 §3). Because the
pm core wraps the same `RuntimeCommandSpec`/process-runner seam as workers (r3 §1, C1.1), a supervised
child inherits W3C context for free, so the child's own spans thread to the pm's
`netscript.process.spawn` span across the process boundary — exactly the propagation
denoland/deno#32752 asks the runtime for but which the pm must (and does) implement in user space
(m4 §4).

### 7.5 The 14-point checklist as the grading rubric

`TelemetryConventionChecklist` (`telemetry-convention.ts:58-115`) is the literal rubric the pm's
telemetry is graded against. Mapping:

| TC | How the pm satisfies it |
| --- | --- |
| TC-1 span names use `<domain>.<operation>` | `netscript.process.{spawn,restart,crash,health-probe,lifecycle-action}` (§7.2) |
| TC-2 correct SpanKind | table §7.2 assigns INTERNAL/CLIENT/SERVER per span |
| TC-3 OK/ERROR + exceptions | crash/health-probe/action spans record status + exception |
| TC-4 breadcrumbs = span events | restart attempts are span events, not extra spans |
| TC-5 OTEL semconv verbatim | `process.pid`/`process.command_args`/`service.instance.id` reused; no re-mint (§7.1) |
| TC-6 proprietary keys under `netscript.*` | new `netscript.process` domain (§7.1) |
| TC-7 identity/correlation/outcome/retry floor | every span carries `netscript.correlation.id` + id/outcome/restart_count |
| TC-8 redact/hash sensitive content | argv/env secret values redacted before spans and before `ProcessDetail.env` crosses the wire (§1.2) |
| TC-9 extract on ingress, inject on egress | oRPC request context extracted; injected into children (§7.4) |
| TC-10 subprocess propagation env keys | reuse `DaxProcessRunner` TRACEPARENT/TRACESTATE/CORRELATION_ID (§7.4) |
| TC-11 per-domain instruments behind shared layer | metrics via a `ProcessInstrumentationLike` facade (below) |
| TC-12 enablement decoupled from OTEL_DENO, no-op fallback | pm authors spans regardless of OTEL_DENO (it covers no subprocesses anyway, m4 §4); no-op when telemetry disabled |
| TC-13 consume shared facade, not private tracers | `ProcessInstrumentationLike` mirrors `TaskInstrumentationLike` (r3 §3), passed into the supervisor — no scattered `getTracer()` |
| TC-14 fan-in via span links | `terminate` fan-out uses links, not parent-child |

Instrumentation is a small composable facade (`ProcessInstrumentationLike`) mirroring the workers
`TaskInstrumentationLike` pattern (`packages/telemetry/src/instrumentation/worker.ts`,
`multi-runtime-task-executor.ts:137-157`, r3 §3), injected into the supervision loop — never a private
tracer (TC-13).

---

## 8. Slice decomposition (candidate implementation issues, drafts)

Titles are `Part of #<epic>` style (netscript-pr conformant; no closing keyword on epic children).
Dependency edges name D1 (core/engine), D3 (OS adapters/`sd_notify`), D4 (CLI + console), D5 (config).

| # | Title (draft) | Scope | Acceptance sketch | Depends on |
| --- | --- | --- | --- | --- |
| D2-S1 | `feat(telemetry): netscript.process domain + ProcessInstrumentation facade` | Add `PROCESS: 'netscript.process'` to `NetScriptAttributeDomains`; keep OTEL semconv keys for identity; author `ProcessInstrumentationLike` facade + no-op impl mirroring the worker facade | Domain constant present; facade unit-tested; TC-5/TC-6/TC-13 asserted; no private `getTracer()` | telemetry pkg only (no D1) |
| D2-S2 | `feat(process-manager): ProcessManagerContract v1 (contract + schemas)` | `ProcessManagerContractDefinition extends BasePluginContract`; Zod schemas; spread `BASE_PLUGIN_CONTRACT_ROUTES`; `implement()` with no erasure cast | `satisfies BasePluginContract` compiles; `deno doc --lint` clean (isolated-declarations); route table §1.3 present | **D1** (domain types: ProcessState/Summary/Detail) |
| D2-S3 | `feat(process-manager): control-plane oRPC service (PluginServiceContribution)` | `PluginServiceContribution` hosting the contract over the core registry/engine; handlers for read/action/graph routes | Service registers under `axis:'service'`; each handler typed against the contract; actions return `ActionResult` | D2-S2, **D1** (engine/registry) |
| D2-S4 | `feat(process-manager): loopback transport + discovery + CLI degraded mode` | Loopback bind, fixed-port+ephemeral fallback, address descriptor (KV + file), CLI degraded read of `OsServicePort`/journald/Servy logs | Descriptor discoverable; degraded mode returns OS-service view when daemon down (§2.3) | D2-S3, **D3** (OsServicePort reuse) |
| D2-S5 | `feat(process-manager): control-plane token auth + local-only posture` | `mintToken`/`revokeToken`; opaque-token option (§3.1a); secret via secrets-convention `0o600`; loopback deny-remote default | Unauthorized route call rejected; token revocation effective; secret file mode `0o600` asserted | D2-S3, secrets-convention (r2 §2) |
| D2-S6 | `feat(process-manager): event stream + follow-logs (oRPC eventIterator)` | `subscribeEvents` + `followLogs` event iterators; server-side KV-watch optimization where `supportsWatch`; poll/EventTarget fallback; client contract invariant | Ordered event delivery; follow-logs streams live lines; `supportsWatch===false` path keeps one client stream (§5.2) | D2-S2, D2-S3 |
| D2-S7 | `feat(process-manager): telemetry spans/metrics incl. control-plane RSS NFR` | Wire `ProcessInstrumentation` into spawn/restart/crash/health/lifecycle-action; metrics incl. `netscript.process.control_plane.rss.bytes` NFR gauge | 14-point checklist green (§7.5); control-plane RSS metric emitted with documented ceiling | D2-S1, **D1** (engine), D2-S3 |

Cross-pack edges (for Stage E's dependency graph): **D4 → D2-S2** (CLI `netscript pm` verbs, OF-1, and
the desktop/dashboard console consume the contract client; console may use the in-process link #E1 —
r4 §3.2, OF-2). **D5 → D2-S2** (`applyGraph` input schema is the D5 process-graph contract, extending
`deployTargetBaseShape`, S9). **D3 → D2-S4** (degraded mode + os-service-mode actions drive
`OsServicePort`; `sd_notify` datagram helper is D3's, consumed by the control-plane `Type=notify`
unit). **D2-S1 → D1** (the engine emits through the facade D2-S1 defines).

---

## 9. Residual open questions for Stage E

1. **Token model fork (§3.1):** opaque zero-dep bearer tokens (supervisor lean) vs pup-style JWT.
   Resolve against S12's zero-dep posture; JWT only if cross-host federation (a C7 non-goal) is ever
   in scope.
2. **Port/discovery collision policy (§2.2):** fixed default port vs ephemeral-only; how many
   NetScript apps per host is a supported topology, and whether the address descriptor needs a lock to
   prevent two control planes claiming one `--app-name`.
3. **Event stream durability (§5):** is `subscribeEvents` an ephemeral live stream only, or is the KV
   event record an authoritative, replayable log (client can request "events since cursor")? Replay
   semantics affect whether a reconnecting console misses transitions.
4. **Desktop console transport (OF-2, r4 §3.2):** in-process oRPC link (#E1 `createInProcessClientLink`)
   vs loopback HTTP for the standalone desktop admin console — timing depends on desktop Tier-4 #E1/#E6
   landing (soft dependency). Affects whether D2 must special-case an in-process link mode.
5. **Optional Linux unix-socket listener (§4):** ship in milestone 1 or defer? Recommend defer unless a
   concrete latency/permission need appears; loopback TCP is sufficient and single-surface.
6. **`followLogs` backpressure/rate policy (§5.3):** pup shipped no pagination/rate-limit on `/logs`
   (m1 §1.6). Decide the cap (max lines/sec, drop-vs-block policy) so a chatty process can't overwhelm
   a follower — and whether `logs` persistence has its own retention (Servy already rotates; journald
   owns Linux — r3 §6).
7. **`SERVICE_INSTANCE` domain (§7.1):** this pack recommends **not** minting `netscript.service.instance`
   (reuse OTEL `service.instance.id` per TC-5), refining S5's parenthetical. Confirm with the telemetry
   T2 owner that no proprietary per-instance attribute forces the domain later.
8. **`applyGraph` capability negotiation (§1.3):** which backends advertise `supportsLiveReconcile`?
   os-service mode reconcile = OS-unit regeneration (D3); dev-attached = live registry mutation. The
   `describe` capability matrix must be authored jointly with D3/D5.

---

*Pack D2 complete. Draft only — no board mutation. Feeds Stage-E plan.md (route table, transport,
telemetry domain, 7 slices) and Stage-H owner ratification.*
