# D1 — Supervision Engine + Core Package Design

> Stage-D design pack for `plan-process-manager--seed`. Tier-B author (Opus 4.8), drafts only —
> nothing filed before Stage H. Binding inputs: `research.md` §C1–C7 (Stage-C synthesis), corpus
> `research/r3-runtime-process-seams.md` (primary), `research/r1-plugin-architecture-seams.md` §9,
> `research/m1-pup-teardown.md` §2/§4, `research/m2-pm2-teardown.md` §4/§13. Citations are
> repo-relative to the worktree `C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager`
> unless marked corpus-§ or URL. Owner-forks OF-1..7 are OPEN; this pack designs for the Stage-C
> recommended option and flags deltas.

## D1.0 Scope of this pack

Owns the **supervision engine and its host core package** (S1): package/folder layout, the domain
model (process spec + state machine), the restart-policy contract (S7), the start policies (S8),
the process-registry port (S3), descendant-tree kill (S6), the dev-mode foreground loop, the
workers reuse map, the capability-category recommendation, and a bounded clustering **sketch**
(OF-5). The control-plane contract/oRPC/telemetry catalog is D2; deploy-lane OS-adapter wiring
(WatchdogSec/Type=notify/sd_notify/#345 rescope) is D3; CLI verbs + admin console are D4; the config
schema + scaffold manifest + docs are D5. Where this pack touches those seams it defines the
**engine-side contract** and hands the surface to the sibling pack.

---

## D1.1 Package layout

Two packages, per S1 (workers-core analog, not the auth-style adapter fan-out — the OS-service
adapters are already thin single-file wrappers in `packages/cli`, not substantial enough to warrant
separate packages; r1 §9 item 2).

### `packages/plugin-process-manager-core/` — FAT (Archetype 7 core = Archetype 2 integration + Archetype 3 runtime/state)

Naming follows the `plugin-workers-core` / `plugin-dashboard-core` convention (S1, OF-7a). Layering
per doctrine file 05 (`domain` → `ports` → `application` → `adapters`; `presentation` N/A here — the
UI is D4's Fresh app). Folder sketch, refined from r1 §9:

```
packages/plugin-process-manager-core/
  deno.json                      # @netscript/plugin-process-manager-core
  mod.ts                         # public surface (A1/A2 — types first)
  README.md
  src/
    domain/                      # no impl imports (A8); pure types + pure state-machine fns
      process-spec.ts            #   ProcessSpec, ResolvedProcessInvocation (argv tuple, S6)
      process-state.ts           #   ProcessState, InstanceState, transitions (the state machine)
      restart-policy.ts          #   RestartPolicy, BackoffState, RestartBudget, SkipExitCodes (S7)
      start-policy.ts            #   StartPolicy = Autostart | Cron | Watch (composable set, S8)
      health.ts                  #   HealthProbeSpec, HealthState (app-level semantics only)
      log.ts                     #   LogLine, LogStreamKind, LogRingBufferSpec
      process-graph.ts           #   ProcessGraph (dependency-ordered node set — D5 owns the schema;
                                 #     domain owns the resolved in-memory shape)
      errors.ts                  #   ProcessManagerError (tagged, mirrors TriggersError)
    ports/
      process-registry-port.ts   #   ProcessRegistryPort (kv-job-registry analog, S3)
      process-runner-port.ts     #   ProcessRunnerPort (spawn one resolved invocation; Deno.Command)
      kill-strategy-port.ts      #   KillStrategyPort (descendant-tree kill, per-OS, S6)
      log-sink-port.ts           #   LogSinkPort (persist/rotate/tail)
      health-probe-port.ts       #   HealthProbePort (HTTP/exec/tcp liveness)
      clock-port.ts              #   ClockPort (injectable time — testable backoff/budget)
    application/                 # imports domain + ports only (no adapters)
      supervisor.ts              #   Supervisor: the engine (per-process control loops)
      restart-controller.ts      #   backoff + budget + skip-codes decision fn (pure over BackoffState)
      start-policy-runtime.ts    #   wires cron/watch/autostart triggers to supervisor.start()
      log-multiplexer.ts         #   fan-in of N child streams -> tagged unified stream
      shutdown.ts                #   builds a ShutdownManager fan-out over live instances
    adapters/
      os-native/                 #   Deno.Command runner + POSIX/Windows kill + ring-buffer log sink
        deno-command-runner.ts   #     ProcessRunnerPort impl (the dev-mode + control-plane spawner)
        posix-kill-strategy.ts   #     KillStrategyPort (pgrep/-P tree walk)
        windows-kill-strategy.ts #     KillStrategyPort (taskkill /T /F)
        file-log-sink.ts         #     LogSinkPort with size/date rotation
      systemd/                   #   THIN: compiles ProcessSpec -> systemd knobs, delegates to the
                                 #     EXISTING packages/cli OsServicePort systemd adapter (D3 owns
                                 #     the WatchdogSec/Type=notify/hardening extension)
      servy/                     #   THIN: ProcessSpec -> Servy config, delegates to the existing
                                 #     ServyOsServiceAdapter (D3)
      aspire-resource/           #   reads AspireResource[] a host's plugins declared -> ProcessGraph
                                 #     nodes (dev-mode visibility; --no-aspire resolver is D5's)
      kv-process-registry.ts     #   ProcessRegistryPort impl over @netscript/kv (S3 default)
    telemetry/                   #   ProcessInstrumentationLike facade (S5; catalog owned by D2)
    contracts/v1/                #   ProcessManagerContract types re-exported for the plugin (D2 body)
    testing/                     #   in-memory registry + fake clock + fake runner for consumers
  tests/
    contracts/process-manager-contract-base-seam_test.ts   # soundness test (mirrors workers-core)
    application/restart-controller_test.ts                  # backoff/budget algorithm (fake clock)
    application/supervisor_test.ts                          # state-machine transitions
```

Rationale notes:

- `restart-controller.ts` is a **pure function over `BackoffState`** so the backoff/budget algorithm
  is unit-testable against a `ClockPort` fake with zero real time — the pm2 exp-backoff curve (S7)
  must be provably correct, and A12 ("durable workflows are state machines") applies to the restart
  loop directly.
- `os-native/` is the only adapter dir that owns real supervision behavior; `systemd/`+`servy/` are
  thin compilers-to-OS-units that **delegate to the already-shipped `OsServicePort` adapters** rather
  than reimplementing systemctl/servy argv (r3 §6; `packages/cli/src/public/ports/os-service-port.ts:9-45`,
  `packages/cli/src/public/adapters/systemd-os-service.ts:48-81`). This keeps the thinness law
  (r1 §2) intact: the convention-bearing supervision engine lives in the core, the OS-unit rendering
  reuses `packages/cli`.
- `aspire-resource/` is an **input adapter** (reads the declared resource list into a `ProcessGraph`),
  not the registry itself — per Stage-C's routing of "AspireResource[] as an input to the process
  graph, not the registry" (research.md C5).

### `plugins/process-manager/` — THIN (Archetype 5)

Matches r1 §9's thin sketch; the plugin is wiring only. Full body (verb set, admin service, scaffold
manifest, dashboard panel) is D4/D5 — D1 only fixes the **composition-root axes** the engine needs:

```
plugins/process-manager/
  mod.ts  deno.json  README.md  verify-plugin.ts  scaffold.ts  scaffold.plugin.json
  contracts/v1/mod.ts            # re-export from core — never redefine (thinness law, r1 §2)
  src/public/mod.ts              # definePlugin(...)
                                 #   .withType('background-processor')     <- capability category (D1.9)
                                 #   .withBackgroundProcessor(...)         <- the dev-mode engine
                                 #   .withService(...)                     <- control-plane oRPC (D2)
                                 #   .withTelemetry(...)                   <- PROCESS domain (D2)
                                 #   .withRuntimeConfigTopic(...)          <- restart/backoff defaults
                                 #   .build()
```

`.withBackgroundProcessor` is the axis `workers` itself declares
(`plugins/workers/src/public/mod.ts:56`, `.withType('background-processor')`); reusing it is the
zero-new-axes finding (S2) and needs no CLI-core change (r1 §8.1).

---

## D1.2 Domain model

### D1.2.1 ProcessSpec resolves to a concrete argv tuple (S6, binding)

The declarative process spec (D5 owns the on-disk schema) **must resolve to an executable+args tuple
before spawn** — never a `deno task <name>` indirection. This is the single hardest lesson from the
market study: pup's own unfixed bug Hexagon/pup#33 is a descendant-orphan caused precisely by
spawning through a task/shell wrapper that forks the real workload as a grandchild the supervisor's
tracked pid does not own (m4 §3; research.md S6). Resolution reuses the workers `RuntimeCommandSpec`
contract verbatim:

```ts
// domain/process-spec.ts (sketch)
export type ResolvedProcessInvocation = Readonly<{
  command: string;                    // absolute or PATH-resolved executable, never "deno task"
  args: readonly string[];
  env: Readonly<Record<string, string>>;
  cwd?: string;
  permissions?: WorkerTaskPermissions; // reuse the workers vocabulary verbatim (D1.8)
}>;
```

`{ command, args, env }` is exactly `RuntimeCommandSpec`
(`packages/plugin-workers-core/src/executor/adapters/command-spec.ts:9-13`). A `deno`-runtime spec
resolves to `command: <denoBinPath>`, `args: ['run', ...permFlags, entrypoint]` using the same
per-runtime `RuntimeAdapterBase.build()` closures the workers stack already owns
(`packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts:18-38`). The pm core
reuses those adapters as the "how to build argv" half and adds the "keep it alive" half on top
(r3 §1 verdict, r3 §6).

### D1.2.2 Process vs Instance

Two nouns, deliberately separated (pup conflates them; pm2 separates via cluster instances):

- **Process** — a declared managed unit (one `ProcessSpec` + its policies). Identity: `processId`
  (1–64 char `^[a-z0-9@._\-]+$`, copied from pup's `id` pattern, m1 §1.1). This is the *desired
  state* record.
- **Instance** — one running (or restarting) incarnation of a process. Identity:
  `instanceId = processId + '#' + ordinal`. A non-clustered process has exactly one instance
  (`#0`); clustering (OF-5) is "N instances of one process." This split is what makes the later
  clustering sketch a data-model extension rather than a rewrite (D1.10).

### D1.2.3 State machine (states + transitions; persisted vs derived)

Per A12 (state machines) and A13 (explicit crash boundaries). The **instance** carries the lifecycle
state; the **process** carries only desired-state + policy.

Instance states:

```
                 start()
   idle ────────────────────────▶ starting
     ▲                               │ spawned + (readiness probe or grace window)
     │ budget exhausted /            ▼
     │ block() while stopped      running ──── health probe fails (dev mode) ──▶ unhealthy
     │                               │  │                                          │
     │                               │  │ unexpected exit (crash boundary, A13)    │ (info only in
     │                     stop()    │  ▼                                          │  OS mode; OS
     │                     ┌─────────┘  crashed ──▶ backoff-wait ──restart()──▶ starting
     │                     ▼               (RestartController decides: backoff/budget/skip-codes)
     └──────────────── stopping ──▶ stopped ── clean exit (autorestart off / stop_exit_code) ──▶ idle
                                       │
                              blocked (auto-heal suspended; pup block/unblock, S7)
```

- `starting → running`: transition fires on **readiness**, not spawn. Readiness = either an explicit
  health probe passing, an `sd_notify` READY=1 (Linux prod, D3), or a configurable stable-uptime
  grace window (dev default). Until then a crash counts against the restart budget.
- `crashed → backoff-wait → starting`: the `RestartController` (D1.3) owns this edge; `backoff-wait`
  is pm2's surfaced `waiting restart` status (m2 §4).
- `blocked`: pup's `block`/`unblock` verb — auto-heal suspended without changing running state
  (S7; m1 §1.6). Distinct from `stopped`.
- `unhealthy`: app-level health-probe failure. In **dev/attached mode** the engine may act on it
  (restart per policy). In **OS-service mode** it is derived/observational only — systemd
  `WatchdogSec`/Servy health monitoring is supervisor of record (C1.3; research.md C7 guard 1).

**Persisted vs derived state (S3 backing):**

| Field | Persisted in registry | Derived at runtime |
| --- | --- | --- |
| `processId`, `ProcessSpec`, policies, desired-state (`enabled`/`blocked`) | ✅ persisted | |
| `instanceId`, ordinal | ✅ persisted (survives control-plane restart) | |
| last-known `state`, `pid`, `startedAt`, `restartCount`, `lastExitCode`, `BackoffState` | ✅ persisted (checkpointed) | |
| live liveness (is `pid` actually alive **now**) | | derived (probe on read) |
| CPU/RSS sample | | derived (polled, D1.3 memory-threshold) |
| tailed log lines | | derived (ring buffer + LogSinkPort) |

The persisted set is what lets the control-plane service restart (C1.4) and re-attach to
still-running sibling OS services without losing the process list — the god-daemon failure mode is
avoided precisely because desired-state lives in KV, not in the daemon's heap (contrast pm2's
in-heap god-process, m2 §2).

---

## D1.3 Restart-policy contract (S7)

pm2's full strategy set is the **floor** (m2 §4), pup's `block`/`unblock` is kept verbatim (m1 §1.6).
The contract:

```ts
// domain/restart-policy.ts (sketch)
export type RestartPolicy = Readonly<{
  mode: 'always' | 'on-failure' | 'never';          // pup restart enum superset (m1 §1.1)
  backoff: BackoffPolicy;                             // exp-backoff, below
  budget?: RestartBudget;                             // windowed budget, below
  skipExitCodes?: readonly number[];                  // pm2 stop_exit_codes (m2 §4)
  memoryThresholdBytes?: number;                      // pm2 max_memory_restart (m2 §4)
  memoryPollIntervalMs?: number;                      // documented latency knob (default 30_000)
}>;

export type BackoffPolicy = Readonly<{
  baseMs: number;        // pm2 exp_backoff_restart_delay start (default 100)
  capMs: number;         // hard cap (pm2 fixes 15_000; we make it configurable, default 15_000)
  factor: number;        // doubling factor (default 2)
  resetAfterStableMs: number; // reset delay to 0 after N ms stable uptime (pm2 fixes 30_000)
}>;

export type RestartBudget = Readonly<{
  maxRestarts: number;   // e.g. 10
  windowMs: number;      // e.g. 60_000  -> "no more than 10 restarts per minute"
}>;
```

### D1.3.1 Exponential-backoff algorithm (specified, pm2-parity)

`restart-controller.ts` is a pure function `nextDelay(state, policy, clock) -> { delayMs, nextState }`:

1. On `starting → running` that stays up for `>= resetAfterStableMs` (measured via `ClockPort`),
   reset `state.currentDelayMs = 0` and `state.consecutiveFailures = 0` (pm2's "resets to 0ms after
   30s of stable uptime", m2 §4).
2. On an unexpected exit whose code is **not** in `skipExitCodes`:
   - if `state.currentDelayMs === 0` → `delayMs = policy.backoff.baseMs`;
   - else → `delayMs = min(state.currentDelayMs * policy.backoff.factor, policy.backoff.capMs)`
     (pm2's "doubles-ish up to a hard cap of 15000ms", m2 §4);
   - increment `state.consecutiveFailures`; set the instance to `backoff-wait` for `delayMs`
     (pm2's surfaced `waiting restart` status).
3. Before the restart fires, check the **windowed budget**: if the number of restarts inside the
   trailing `windowMs` (a ring of timestamps in `BackoffState`) would exceed `maxRestarts`, the
   instance goes to `stopped` with reason `budget-exhausted` and the engine stops auto-healing
   (this is the guard pm2's flat model lacks and pup lacks entirely — m1 §1.3, m2 §4).
4. An exit code in `skipExitCodes` (default includes `0` when `mode === 'on-failure'`) → clean
   `stopped`/`idle`, no restart (pm2 `stop_exit_codes`, m2 §4).

`BackoffState` (`currentDelayMs`, `consecutiveFailures`, `restartTimestamps: number[]`,
`lastStableAt`) is persisted (D1.2.3) so backoff survives a control-plane restart rather than
resetting to base on every daemon bounce.

### D1.3.2 Memory-threshold restart (documented latency)

Polled, not real-time. A `memoryPollIntervalMs`-driven sampler reads per-instance RSS; on
`rss > memoryThresholdBytes` the instance is restarted through the same controller. The **30s blind
spot is documented as a first-class property**, matching pm2's own honesty (m2 §4, critique 3): the
docs (D5) state "memory-threshold restart has a detection latency of up to `memoryPollIntervalMs`."
RSS sampling is a `ProcessRunnerPort`/OS concern: Deno exposes no cross-platform RSS API, so
`os-native` samples via `/proc/<pid>/statm` (Linux) and a `tasklist`/`Get-Process` probe (Windows) —
this asymmetry is stated per S11.

### D1.3.3 What compiles to the OS vs what the engine enforces

Per C1.3 (OS supervisor of record in prod) and research.md C7 guard 1:

| Policy element | OS-service mode (prod) | Dev/attached mode |
| --- | --- | --- |
| `mode: always/on-failure` | compiles to systemd `Restart=always`/`on-failure` (`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:127-128`) / Servy `recoveryAction` (`packages/cli/src/kernel/adapters/windows/servy/servy-config.ts:100-101`) | engine-enforced |
| fixed `RestartSec` delay | compiles to systemd `RestartSec` / Servy retry delay | engine-enforced |
| **exp-backoff curve** | **not expressible** in systemd/Servy → best-effort map to a single `RestartSec`; the richer curve is a **dev/attached-only** guarantee (S7) | engine-enforced (full curve) |
| **windowed budget** | partially: systemd `StartLimitIntervalSec`/`StartLimitBurst` covers the *shape* (D3 wires it); engine budget is authoritative only in dev | engine-enforced |
| `skipExitCodes` | systemd `SuccessExitStatus` / `RestartPreventExitStatus` (D3) | engine-enforced |
| memory threshold | systemd `MemoryMax` (cgroups, kill-not-restart semantics — different!) / Servy has no equivalent | engine-enforced (restart semantics) |
| `block`/`unblock` | maps to `systemctl disable`-without-stop is imperfect; realistically the control plane holds the block flag and refrains from issuing OS restarts | engine-enforced |

The honest framing (S11, C1.3): in prod the OS owns *mechanism*; the pm's richer policy is a
**dev-mode and control-plane-advisory** layer, never a claim that systemd is doing pm2-exact backoff.
D3 owns the exact systemd/Servy knob mapping.

---

## D1.4 Start policies (S8) — composable, and the cron decision

Three policies, **explicitly composable** (not pup's pick-one; m1 §1.2, S8):

```ts
// domain/start-policy.ts (sketch)
export type StartPolicy = Readonly<{
  autostart?: boolean;                 // start with the supervisor / on boot
  cron?: readonly CronStartRule[];     // scheduled (re)start
  watch?: WatchStartRule;              // file-triggered (re)start
}>;
```

A process may declare `autostart: true` **and** `watch` **and** `cron` simultaneously; the
`start-policy-runtime.ts` composes them (autostart fires once at supervisor init; cron rules arm
schedules; watch arms a debounced file watcher that issues `restart()`).

### D1.4.1 Cron primitive — VERIFIED: reuse `@netscript/cron`, not the workers scheduler, not a bespoke eval

Stage-C left this open ("Cron composes with the workers scheduler primitive if Stage D verifies fit;
otherwise a minimal core-owned cron eval", S8). **Decision, with evidence: neither the workers
scheduler nor a new eval — reuse the standalone `@netscript/cron` package.**

Evidence:

1. The workers `SchedulerPort` is **not a cron evaluator**. It is a job enqueue/dispatch contract
   (`schedule(job)`, `enqueue(message)`, `stop()`) with no cron expression, no next-fire
   computation, no timezone (`packages/plugin-workers-core/src/ports/scheduler-port.ts:1-9`); the
   `JobScheduler` abstract is `tick()`/`enqueue()`/`dispatch()` over `JobDefinition`
   (`packages/plugin-workers-core/src/abstracts/job-scheduler.ts:14-23`). It would not fit a
   process start-policy without wrapping it in a cron layer anyway.
2. The workers `domain/cron.ts` is **only a cron-string builder + a 5-field validator**, not a
   scheduler — `cron.daily()`/`cron.custom()`/`cron.validate()` return/validate strings and nothing
   fires them (`packages/plugin-workers-core/src/domain/cron.ts:46-108`).
3. A **real, standalone cron scheduler already exists as its own package**: `@netscript/cron`
   exposes `createScheduler(options) -> CronScheduler` with `schedule(id, cronExpr, handler,
   opts) -> { nextRun, enabled }`, `unschedule`, `disable`/`enable`, `trigger`, `stop`, provider
   auto-detection (Deno `Deno.cron` in prod, in-memory tick for tests), and timezone support
   (`packages/cron/mod.ts:99-129`, `packages/cron/mod.ts:134-150`). It is already consumed exactly
   this way by triggers-core's `CronTriggerSchedulerAdapter`, which wraps `createScheduler()` and
   maps fired jobs to domain events (`packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter.ts:82-130`).

**Design:** the pm core's `start-policy-runtime.ts` composes `@netscript/cron`'s `createScheduler()`
the same way triggers-core does — one schedule per `CronStartRule`, the handler calls
`supervisor.start(processId)` (or `restart` if `overrun: false` and already running — pup's `overrun`
flag, m1 §1.1). This is wrap-don't-reinvent (AGENTS rule 3, A7): zero new cron code, zero new
dependency beyond an internal `@netscript/*` package, and it inherits the Deno-native `Deno.cron`
provider for prod durability. Note one caveat carried to D3/D5: triggers-core disallows
`persistent` cron until Deno persistent-cron support lands
(`cron-trigger-scheduler-adapter.ts:105-110`) — the pm inherits the same limit; a control-plane
restart re-arms schedules from the persisted registry rather than relying on persistent cron.

The `watch` policy reuses pup's clean `Deno.watchFs` debounce pattern conceptually (m1 §2.4) — a
small `WatchStartRule { paths, exts, debounceMs, skip }` driving `restart()`; this is engine-owned
(no existing repo primitive to reuse for file-watch → process-restart specifically).

---

## D1.5 Registry port (S3)

Modeled on the kv-job-registry pattern (r3 §5). Shape:

```ts
// ports/process-registry-port.ts (sketch)
export interface ProcessRegistryPort {
  readonly id: string;
  // desired state
  register(spec: ProcessSpec): Promise<ProcessRecord>;
  deregister(processId: string): Promise<boolean>;
  get(processId: string): Promise<ProcessRecord | undefined>;
  list(filter?: ProcessFilter): Promise<readonly ProcessRecord[]>;
  setDesired(processId: string, patch: DesiredStatePatch): Promise<void>; // enabled/blocked
  // instance/runtime checkpoint
  putInstance(instance: InstanceRecord): Promise<void>;    // pid/state/restartCount/BackoffState
  getInstance(instanceId: string): Promise<InstanceRecord | undefined>;
  listInstances(processId?: string): Promise<readonly InstanceRecord[]>;
}
```

- **Default adapter = `@netscript/kv`** (`kv-process-registry.ts`), keyed under prefixes
  `['pm', 'processes', id]` / `['pm', 'instances', id]` — the exact durable-state pattern
  `KvJobRegistry` uses (`packages/plugin-workers-core/src/registry/kv-job-registry.ts:12-13,43-44`;
  prefixes `['workers','jobs']`/`['workers','executions']`). The port abstraction lets Postgres/Redis
  back it later without touching the engine (r3 open-question 1).
- **Compiled-binary persistence via Deno 2.9 per-app-name KV** (S3): a `deno compile`d pm control
  binary opens its persistent `Deno.openKv()` scoped by the binary's app name — the zero-dependency
  daemon-state backing that survives restart of the control-plane service (research.md S3; m4 §5/§7.7).
  Explicitly **not** tursodb (#453) so the core carries no hard beta.8 desktop dependency (S3, S12
  supply-chain posture).
- The registry is the **single source of desired state**; the supervisor loop reconciles live
  instances against it. This is the structural anti-god-daemon move (C1.4): losing the process the
  control plane runs in does not lose the process list.

`WatchableKv.watchPrefix(['pm','processes'])` (`packages/kv/types/watchable-kv.ts:37-101`) is the
**subscribe/notify convenience** where `supportsWatch` (S4) — e.g. the admin console live-refreshing
its list — but it is **not** the command bus (the oRPC loopback contract is, per D2/S4); on
`supportsWatch === false` backends it degrades to poll.

---

## D1.6 Descendant-tree kill (S6) — Windows + POSIX

The problem has two layers; S6's argv resolution (D1.2.1) removes the common case, a `KillStrategyPort`
handles the residue.

**Layer 1 — eliminate the orphan by construction.** Because the spec resolves to concrete argv
(no `deno task`/shell wrapper), the tracked `Deno.ChildProcess.pid` is the **actual workload**, not a
launcher that forks a grandchild — this is the direct fix for the pup#33 class (m4 §3, S6). Most
supervised NetScript entrypoints (a `deno run` server, a compiled binary) are single-process and
`child.kill('SIGTERM')` on the tracked pid is sufficient.

**Layer 2 — genuine descendant trees** (a process that itself spawns children). Deno does not expose
process-group creation on `Deno.Command` (no `detached`/`setsid` option) and cannot `kill(-pgid)`
portably, and Windows exposes only a restricted signal set with listener-suppresses-default semantics
(denoland/deno#28081; m3 §7.4, m4 §5, S11). So descendant kill is an **OS-adapter concern**:

```ts
// ports/kill-strategy-port.ts (sketch)
export interface KillStrategyPort {
  // graceful: SIGTERM the tree, wait graceMs, then force
  terminateTree(pid: number, opts: { graceMs: number; signal?: Deno.Signal }): Promise<void>;
}
```

- **POSIX (`posix-kill-strategy.ts`)**: send `SIGTERM` to the tracked pid; enumerate descendants
  best-effort via `pgrep -P <pid>` recursively (or `/proc/<pid>/task/*/children`); after `graceMs`,
  `SIGKILL` any survivors. This mirrors pup's grace/timeout window (`terminateGracePeriod`/
  `terminateTimeout`, m1 §1.1) but adds real descendant reaping pup lacked.
- **Windows (`windows-kill-strategy.ts`)**: `Deno.ChildProcess.kill()` maps to `TerminateProcess` on
  the single pid and leaves children orphaned; the correct primitive is spawning
  `taskkill /T /F /PID <pid>` (`/T` = tree). Deno's 6-signal limit and the absence of Job-Object
  exposure make `taskkill /T` the pragmatic tree-kill (S11; m4 §5). Graceful-first is best-effort on
  Windows: attempt `taskkill /PID <pid> /T` (no `/F`) → wait `graceMs` → `taskkill /F /T`.

The asymmetry (POSIX signals + tree walk vs Windows `taskkill /T`) is **stated in docs, never
implied as parity** (S11; D5 owns the doc callout). In OS-service mode the tree-kill is systemd's
(`KillMode=control-group` via cgroups) or Servy's job — the engine's `KillStrategyPort` is the
**dev/attached-mode** authority (C1.3).

---

## D1.7 Dev-mode foreground loop (`netscript pm dev`)

The `--no-aspire` fallback and the local dev umbrella. Today `--no-aspire` scaffolds ship exactly one
foreground `deno task dev` and no way to co-supervise a worker/service (r3 §2;
`packages/cli/src/kernel/templates/workspace/generate-readme.ts:75-78`). `netscript pm dev` runs the
engine **foreground-attached** (overmind/process-compose shape, m4 §1; C1.2): no daemon, no OS
services, Ctrl+C tears the whole tree down.

### D1.7.1 Runner decision — build a lean `Deno.Command`-native runner, do NOT reuse `DaxProcessRunner`

Stage-D-assigned decision. **Decision: the pm core builds its own `deno-command-runner.ts`
(`ProcessRunnerPort` impl) spawning via `Deno.Command` directly, and does NOT reuse the workers
`DaxProcessRunner`.** Rationale (evidence-weighted):

1. `DaxProcessRunner` spawns through **dax** (`$` command templates), not raw `Deno.Command`
   (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:52-70`). m1's clearest
   "code aged badly" finding is pup doing exactly this — dax's shell-templating layer sits between
   the manager and the process and is unnecessary for a manager that already parses its own argv
   (m1 §2.3, §3 table row 1). Reusing dax re-imports the abstraction S6 exists to avoid.
2. dax builds a **shell command string**, reintroducing the shell-wrapper indirection that causes the
   descendant-orphan class (D1.6, pup#33). A `ProcessRunnerPort` fed a resolved argv tuple
   (D1.2.1) must spawn that tuple directly — `new Deno.Command(command, { args, env, cwd,
   stdout:'piped', stderr:'piped' }).spawn()` — to keep the tracked pid == the workload.
3. `DaxProcessRunner` is built for **one-shot execution returning a terminal `TaskResult`** (r3 §1
   verdict; `runtime-adapter-base.ts:62-79`) — it has no keep-alive/restart concept; the pm needs a
   long-lived handle (`Deno.ChildProcess` with `.status`, `.pid`, `.kill()`) it holds across
   restarts, which is a different object lifecycle than dax's run-to-completion.

**What the runner DOES reuse** (so this is not reinvention, A7/r3 §1):

- the `RuntimeCommandSpec` `{command,args,env}` contract and the per-runtime `RuntimeAdapterBase`
  argv-building closures (D1.2.1) — the "how to build argv" half is shared;
- the **env-injection convention** `buildEnvironment()` including
  `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` W3C trace-context propagation to children
  (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-98`) — copied as a
  pure helper so supervised children inherit trace context for free (D1.8, S5);
- stream draining upgraded to the modern idiom the workers runner predates:
  `stream.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())` from current
  `@std/streams` (m1 §3 table row 2) rather than dax's callback pipes;
- the **log severity classifier** concept (`log-classifier.ts`, referenced r3 §1) for stdout/stderr
  tagging.

### D1.7.2 Log multiplexing

`log-multiplexer.ts` fans in N child `TextLineStream`s into one unified stream, each line tagged with
`{ instanceId, stream: 'out'|'err', ts }` (pm2's structured record shape `message`/`timestamp`/
`type`/`process_id`/`app_name`, m2 §6). In dev the multiplexer writes colorized prefixed lines to the
terminal (overmind shape); in prod the same lines go through `LogSinkPort` (`file-log-sink.ts` with
size/date rotation mirroring Servy's shipped rotation, `servy-config.ts:89-93`) and/or journald.

### D1.7.3 Teardown via `ShutdownManager` reuse

Ctrl+C (SIGINT) / SIGTERM drives `shutdown.ts`, which builds a `ShutdownManager`
(`packages/plugin-workers-core/src/shutdown/shutdown-manager.ts:33-136`) registering each live
instance as a `{ id: instanceId, priority, stop() }` resource (`ShutdownResource`,
`shutdown-manager.ts:5-12`). `stop()` invokes `KillStrategyPort.terminateTree()` (D1.6) with the
grace window; the manager races `Promise.all(stop)` against `timeoutMs` and returns a `ShutdownReport`
(`stopped`/`failed`/`timedOut`, `shutdown-manager.ts:20-30`). Priority ordering lets dependents stop
before their dependencies (dependency-ordered graph, D5). This is a **direct reuse** — the
`ShutdownManager` is already the in-process priority-ordered stop-fanout primitive a pm daemon needs
(r3 §1).

---

## D1.8 Reuse map (workers seams, file:line)

| Reused seam | What it gives the pm engine | Citation | Reuse kind |
| --- | --- | --- | --- |
| `RuntimeCommandSpec` `{command,args,env}` | the argv contract the ProcessRunner consumes (D1.2.1) | `packages/plugin-workers-core/src/executor/adapters/command-spec.ts:9-13` | direct |
| `RuntimeAdapterBase.build()` (7 runtime adapters) | per-runtime argv building (deno/python/shell/…) | `.../executor/adapters/runtime-adapter-base.ts:18-38`; `.../multi-runtime-task-executor.ts:196-204` | direct (wrap) |
| `WorkerTaskPermissions` | permission vocabulary for supervised Deno entrypoints — do not invent a new one | `.../executor/executor-types.ts:33-41` | direct (verbatim) |
| `buildEnvironment()` TRACEPARENT/TRACESTATE/CORRELATION_ID injection | W3C trace-context to children for free (S5/TC-12) | `.../executor/adapters/dax-process-runner.ts:89-98` | copy as pure helper |
| `ShutdownManager` / `ShutdownResource` / `ShutdownReport` | priority-ordered graceful stop-fanout for dev teardown (D1.7.3) | `.../shutdown/shutdown-manager.ts:5-12,20-30,33-136` | direct |
| `KvJobRegistry` prefix-keyed KV pattern | the ProcessRegistryPort default adapter shape (D1.5) | `.../registry/kv-job-registry.ts:12-13,27-55` | pattern analog |
| `@netscript/cron` `createScheduler()` | the cron start-policy scheduler (D1.4.1) | `packages/cron/mod.ts:99-129`; usage `packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter.ts:82-130` | direct |
| `TaskInstrumentationLike` facade pattern | build `ProcessInstrumentationLike` the same way (S5/TC-13) | r3 §3; `.../telemetry/instrumentation.ts` | pattern analog |
| `OsServicePort` + systemd/Servy adapters | OS-unit install/start/stop delegation (systemd/servy adapter dirs) — D3 owns extension | `packages/cli/src/public/ports/os-service-port.ts:9-45`; `.../adapters/systemd-os-service.ts:48-81` | direct (delegate) |
| `.withBackgroundProcessor` / `.withService` axes | composition-root axes (no new axis; S2) | `plugins/workers/src/public/mod.ts:56` | direct |

**Not reused (deliberate):** `DaxProcessRunner`'s dax spawn (D1.7.1) and `MultiRuntimeTaskExecutor`'s
one-shot run-once loop (r3 §1) — the pm needs supervise-forever, not run-once.

---

## D1.9 Capability category — recommendation

**Recommend: reuse the existing `background-processor` provider category (with `.withService` for
the control plane) — do NOT introduce a new `infrastructure` provider category.**

Doctrine + evidence:

- **Zero-new-axes finding (S2, r1 §5/§8).** The existing contribution axes cover everything: the
  dev-mode engine is a `background-processor`, the control plane is a `service`, plus `telemetry` and
  `runtimeConfigTopic`. Adding a provider category is a new axis the doctrine says to avoid (A11 —
  "name extension axes before abstraction"; the finding is that no new axis is needed).
- **The CLI installer's category enum does not include `infrastructure`.** `parseScaffoldedPluginType`
  accepts only `background-processor` and `utility`
  (`packages/cli/src/public/features/plugins/install/install-plugin.ts:463-467`); the live category
  values are `plugin` / `background-processor`
  (`.../install/install-plugin.ts:327,351,428`;
  `.../kernel/adapters/plugin/scaffolder.ts:66,98,195-197`). `infrastructure` exists in the codebase
  only as a **dependency descriptor** (`infrastructureRequires`/`infrastructureOptionalDeps` = which
  of kv/db the plugin needs, `install-plugin.ts:414-442`) and a `plugin.infrastructure?.port` display
  field (`.../list/list-plugins-command.ts:59`) — **not** a provider category. Inventing an
  `infrastructure` category would force a CLI-core change to the category enum and installer routing,
  contradicting the "no CLI core change" reuse guarantee (r1 §8.1) and the thinness law.
- The pm **declares** `infrastructureRequires: ['kv']` (it needs KV for the registry, D1.5) — that is
  the correct, existing use of the `infrastructure*` vocabulary, orthogonal to the provider category.

So: `scaffold.plugin.json` → `category: 'background-processor'`, `pluginType:
'background-processor'`, `infrastructureRequires: ['kv']`. If a future need for a distinct
`infrastructure` *category* emerges (e.g. the pm should not install into the `BackgroundProcessors`
config section but a new `Infrastructure` one), that is a **cross-cutting CLI change to raise as its
own slice/debt**, not a pm-epic assumption — flagged as residual Q-D1-3.

---

## D1.10 Clustering — later-milestone SKETCH ONLY (OF-5 defers it)

Per OF-5(a) and research.md C7 guard 5, N-instance OS-supervised clustering is **out of milestone 1**.
Milestone 1 ships the existing `concurrencyEnvVar` self-fan-out (a process reads its concurrency env
and spawns N workers *in-process*; `packages/cli/src/kernel/adapters/deploy/compile/compile-targets.ts:117-138`,
r3 §6). This sketch is design-only, not scoped into any D1 slice:

- **Data-model readiness.** The Process/Instance split (D1.2.2) already expresses "N instances of one
  process" — `instanceId = processId#ordinal`. Clustering is a registry/supervisor extension
  (spawn/track ordinals `#0..#N-1`), not a domain rewrite. This is the reason for the split now.
- **OS-supervised instances (prod).** The gap is real: there is **no** systemd instantiated-unit
  (`@.service` + `%i`) or per-instance Servy generation anywhere in the repo (r3 §6, confirmed by an
  empty grep for `Instance`/template-unit syntax). The later design compiles a clustered process to a
  systemd **template unit** `pm-<proc>@.service` enabled as `pm-<proc>@0..N` (Quadlet/instantiated-unit
  precedent, m4 §7.3), and to N discrete Servy services on Windows. This is the honest OS-native
  cluster, not a fake.
- **Port sharing (Deno-native).** Deno has **no** Node-`cluster` fd-passing/master-router equivalent
  (m2 §3, critique 1). The Deno-native path is `Deno.serve({ port, reusePort: true })` — each instance
  binds the same port with `SO_REUSEPORT`, the kernel load-balances connections. Documented caveats:
  `reusePort` is Linux-effective (kernel-level LB), on Windows/macOS `SO_REUSEPORT` semantics differ
  (last-binder-wins or unsupported) — so on non-Linux the fallback is an **L4 loopback proxy** (a
  small round-robin/least-conn TCP forwarder, pup's `loadbalancer.ts` shape, m1 §1.4) scoped
  **explicitly as a dev/small-app convenience, not a production LB** (pup's own honesty boundary,
  m1 §1.4; research.md C7 guard 4). No `ip-hash`/sticky is promised in the sketch.
- **Anti-feature guard (S12).** Whatever ships must be a real OS-supervised or reusePort cluster;
  shipping a Node-cluster-shaped fake violates S12 and is explicitly rejected.

---

## D1.11 Slice decomposition (candidate implementation issues)

D1-owned slices. Titles are draft; each is `Part of #<epic>` (no closing keyword on the epic, per
netscript-pr). Dependency edges reference sibling packs D2–D5. Ordering respects doctrine layering
(domain → ports → application → adapters).

| # | Title (draft) | Scope (2–3 sentences) | Acceptance sketch | Depends on |
| --- | --- | --- | --- | --- |
| **D1-S1** | `plugin-process-manager-core` package scaffold + domain types | Create the fat core package (deno.json, mod.ts, layering dirs) and the pure `domain/` types: `ProcessSpec`, `ResolvedProcessInvocation`, `ProcessState`/`InstanceState` + transition table, `RestartPolicy`/`BackoffPolicy`/`RestartBudget`, `StartPolicy`, `errors.ts`. No impl imports in `domain/`. | `deno check`/`lint`/`publish:dry-run` green on the new package; domain has zero adapter imports (arch:check); a base-seam soundness test compiles. | none (foundation) |
| **D1-S2** | Ports layer: registry, runner, kill, log-sink, health, clock | Define `ProcessRegistryPort`, `ProcessRunnerPort`, `KillStrategyPort`, `LogSinkPort`, `HealthProbePort`, `ClockPort` importing `domain/` only. | Ports typecheck; layering gate passes (`ports` imports `domain` only); each port has a doc comment naming its default adapter. | D1-S1 |
| **D1-S3** | RestartController algorithm (pure) + tests | Implement `restart-controller.ts` exp-backoff (double-to-cap, reset-after-stable), windowed budget, skip-exit-codes as a pure fn over `BackoffState`/`ClockPort`. | Unit tests with a fake clock prove: base→cap doubling, reset after stable uptime, budget exhaustion → `stopped(budget-exhausted)`, skip-code → clean stop (pm2-parity per m2 §4). | D1-S1 |
| **D1-S4** | `Deno.Command`-native ProcessRunner + trace-env + streams | Implement `os-native/deno-command-runner.ts` (`ProcessRunnerPort`): spawn resolved argv via `Deno.Command`, hold `Deno.ChildProcess`, drain via `TextLineStream`, inject `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` (copied helper). Explicitly not dax. | Spawns a fixture process, captures tagged stdout/stderr lines, child inherits trace-context env; no dax dependency in the graph. | D1-S2 |
| **D1-S5** | Descendant-tree kill (POSIX + Windows) | Implement `posix-kill-strategy.ts` (SIGTERM + `pgrep -P` tree walk + SIGKILL after grace) and `windows-kill-strategy.ts` (`taskkill /T [/F]`). | Fixture that spawns a child-of-child is fully reaped on both OSes (or POSIX-only in CI with a documented Windows manual-verify); grace→force window honored. | D1-S2, D1-S4 |
| **D1-S6** | KV process registry adapter | Implement `kv-process-registry.ts` over `@netscript/kv` (prefix-keyed like `KvJobRegistry`), desired-state + instance-checkpoint methods; per-app-name KV note for compiled binaries. | Register/list/get/deregister + instance checkpoint round-trip against a KV fake and a real `Deno.openKv`; survives a simulated process restart (state re-read). | D1-S2 |
| **D1-S7** | Supervisor engine + start-policy runtime (cron/watch/autostart) | Wire `supervisor.ts` (per-instance control loops over runner+controller+registry), `start-policy-runtime.ts` composing `@netscript/cron` `createScheduler()` + `Deno.watchFs` watcher + autostart. Composable policies. | State-machine test: crash→backoff→restart, block/unblock suspends auto-heal, cron rule fires `start()`, watch triggers `restart()`; autostart+watch+cron coexist on one process. | D1-S3, D1-S4, D1-S5, D1-S6 |
| **D1-S8** | Log multiplexer + file log sink (rotation) | `log-multiplexer.ts` (N streams → tagged unified) + `os-native/file-log-sink.ts` (size/date rotation mirroring Servy defaults). | Two fixtures' logs interleave with correct `{instanceId,stream,ts}` tags; rotation triggers at size/date threshold. | D1-S4 |
| **D1-S9** | Dev-mode foreground loop + ShutdownManager teardown | `shutdown.ts` builds a `ShutdownManager` over live instances; the `netscript pm dev` engine entrypoint runs foreground-attached; SIGINT tears the tree down via `KillStrategyPort` in priority order. | `pm dev` on a 2-process fixture graph starts both, Ctrl+C returns a clean `ShutdownReport` (all `stopped`), no orphaned pids. | D1-S5, D1-S7, D1-S8 |
| **D1-S10** | Telemetry facade (`ProcessInstrumentationLike`) | Engine-side instrumentation facade + span/metric emission points (spawn/restart/crash/health, uptime/restart-count). Catalog + `NetScriptAttributeDomains.PROCESS` addition is D2; this slice provides the injection seam. | Supervisor emits spans through an injected facade (verified with a fake); no direct `getTracer()` calls in the engine (TC-13). | D1-S7, **D2** (domain constant) |
| **D1-S11** | Thin systemd/servy compile adapters (delegate) | `systemd/` + `servy/` adapters that compile a `ProcessSpec` to OS-unit knobs and delegate to the existing `OsServicePort` adapters. WatchdogSec/Type=notify/hardening extension is **D3**. | A `ProcessSpec` compiles to a systemd unit + Servy config that installs via the existing `OsServicePort` without reimplementing systemctl/servy argv. | D1-S1, **D3** (renderer extensions) |

Cross-pack edges: D1-S10 needs D2's `PROCESS` telemetry domain constant; D1-S11 rides D3's renderer
extensions; the plugin composition root (`.withBackgroundProcessor` wiring the engine) is a D5/plugin
slice consuming D1-S7/S9; the control-plane service (`.withService`) that calls the engine's
list/start/stop is D2.

---

## D1.12 Residual open questions (for Stage E)

- **Q-D1-1 (readiness signal default).** In OS-service prod mode, is `sd_notify` READY=1 the default
  readiness signal on Linux (requires `Type=notify`, D3), with the stable-uptime grace window as the
  Windows/dev fallback? Confirm the default per-mode readiness contract with D3 (sd_notify helper is
  D3-owned; m3 §5).
- **Q-D1-2 (block/unblock in OS mode).** `block` has no clean systemd/Servy equivalent (D1.3.3). Is
  the accepted semantics "the control-plane service holds the block flag and refrains from issuing OS
  restarts, but the OS unit's own `Restart=` still applies on crash"? If so, `block` is only fully
  honored in dev/attached mode — state this limit explicitly (S11 honesty). Owner call at Stage E.
- **Q-D1-3 (infrastructure category).** D1.9 recommends reusing `background-processor`. If the owner
  wants the pm surfaced under a distinct `Infrastructure` config section rather than
  `BackgroundProcessors`, that is a separate cross-cutting CLI change (category enum + installer
  routing) to raise as its own slice/debt — not a pm-epic assumption. Confirm the config-section
  placement at Stage E.
- **Q-D1-4 (memory-poll RSS on Windows).** RSS sampling asymmetry (`/proc/<pid>/statm` vs
  `tasklist`/`Get-Process`) has a per-OS cost/latency profile; confirm the default
  `memoryPollIntervalMs` (30s pm2-parity) is acceptable on Windows given the heavier probe, or make
  the Windows default larger and document it (S11).
- **Q-D1-5 (persistent cron limit).** The pm inherits triggers-core's "no persistent cron until Deno
  persistent-cron lands" limit (`cron-trigger-scheduler-adapter.ts:105-110`). Milestone-1 re-arms
  schedules from the persisted registry on control-plane restart. Confirm that is sufficient, or
  whether a cron-checkpoint (last-fire timestamp in the registry) is needed to avoid double/skip
  fires across a restart — routes to D2 (registry shape) + D5 (config).
- **Q-D1-6 (clustering trigger for the split now).** The Process/Instance split (D1.2.2) is carried in
  milestone 1 purely to make OF-5 a later extension. Confirm the owner wants the `instanceId#ordinal`
  data model present from milestone 1 (small cost, big later payoff) rather than added when clustering
  ships.

---

### Confirmation

Written to:
`C:\Dev\repos\netscript-framework\.llm\tmp\wt-process-manager\.llm\runs\plan-process-manager--seed\research\design\d1-supervision-engine-core.md`
