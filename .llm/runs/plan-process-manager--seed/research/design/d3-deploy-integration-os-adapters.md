# D3 — Deploy-lane integration + OS adapters (design pack, DRAFT)

Tier-B design pack for seed run `plan-process-manager--seed`. Drafts only — nothing here is filed,
no board is mutated. Owner ratifies at Stage H. Paths are repo-relative to the worktree
`C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager/`.

Binding inputs: charter §"Final objective"/§"Research directives"; `research.md` Stage-C
**C1.3/C1.4** (OS supervisor of record; pm compiles the process graph to native units via the
existing renderers + `OsServicePort`; the control-plane service is one more sibling unit), **S10**
(conventions + `OsServicePort` + command layers lift as-is; the `DeployTargetPort` optional-method
"omit rather than silent no-op" pattern carried into per-process capability negotiation), **S11**
(designed-for Windows asymmetry), **OF-3** (#345 re-scope) and **OF-4** (precursor slice). Corpus:
`research/r2-deploy-baremetal-seams.md` (primary), `research/m3-servy-windows-systemd-native.md`
(primary). Doctrine: `ARCHETYPE-7-deploy-target-adapter.md`.

---

## D3.0 Position in one paragraph

The pm does **not** mint a new deploy-target key. It becomes the **richer implementation behind the
already-reserved `linux-service` / `windows-service` keys**, and it does so on top of an
independently shippable precursor slice that finishes wiring those two keys through the generic
`deploy <target>` router (they are registered but CLI-unreachable today —
`deploy-target-registry.ts:78-79` vs `deploy-group.ts:79-85`). Deploy-event verbs
(`plan/emit/up/down/status/logs/rollback/secrets`) stay on `netscript deploy`; the daily-driver ops
group (`status/logs/monitor/block`) is `netscript pm` (OF-1 (a)). The Linux differentiator is typed
opt-in knobs on the **existing** `renderSystemdUnit` (`Type=notify`+`WatchdogSec`, a hardening set,
`DynamicUser`, cgroups v2) plus a pure-Deno `sd_notify` helper — not a parallel renderer. Servy's
heartbeat/`RecoveryAction` set is the Windows ceiling; the asymmetry is documented, never papered
over (S11). All four pure conventions and both OS command layers lift as-is (S10).

---

## D3.1 Target-key taxonomy

### D3.1.1 Recommendation: implement behind `linux-service` / `windows-service`, do not add a new key

**Do not register a `process-manager` target key.** The pm supplies the *wired* form of the two
existing bare-metal keys, and adds process-graph knobs to their config members. Rationale, each
point cited:

1. **The keys already exist and are reserved.** `KnownDeployTargetKey` reserves `'windows-service'`
   and `'linux-service'` (`deploy-target-registry-port.ts:10-19`); both are registered as descriptor
   instances (`deploy-target-registry.ts:78-79`, `WINDOWS_SERVICE_DEPLOY_TARGET` /
   `LINUX_SERVICE_DEPLOY_TARGET` at :15/:18). A third key duplicates the extension axis A11 warns
   against and orphans the two reservations.
2. **The wiring seam is already the right shape.** `ServiceDeployTarget`
   (`service-deploy-target.ts:77-205`) is a bare 6-op descriptor when constructed with no ports and
   a fully wired 7/8-op adapter when constructed with `ServiceDeployTargetPorts`
   (`:41-58, :93-98`) — `operations` self-advertises `rollback`/`secrets` only when the matching
   port is injected (LD-4, `:93-98`). The pm's core supplies exactly those ports (plus process-graph
   resolution), promoting the *same* instances from descriptor to wired without a key change.
3. **A new key re-creates the OF-3 drift.** Two owners for "run this app as an OS service" is the
   precise failure OF-3 flags for multi-instance (`research.md` C3/OF-3; r2 §4). One key, one owner.
4. **Superseding the keys was explicitly rejected.** OF-4's chosen option (a) is fix-forward wiring,
   not supersede-and-prune (`research.md` C3/OF-4; r2 §6 first bullet). Keeping the keys honors that.
5. **Config stability.** Users' `deploy.targets.linux` / `deploy.targets.windows` blocks
   (`deploy-schema.ts:163-220` per r2 §2) stay valid; the pm only *adds* optional process-graph
   fields (per-process restart policy, instance count, hardening/resource knobs) that spread
   `deployTargetBaseShape` (S9), the way each member already adds its service-manager-specific
   fields.

### D3.1.2 Verb split: `netscript deploy` (events) vs `netscript pm` (ops)

- **`netscript deploy <linux-service|windows-service> <verb>`** stays the deploy-event surface,
  routed by the existing thin router (`target-deploy-command.ts:46-98`). Verbs are derived from the
  adapter's advertised `operations` (`:60-61`), so the pm-wired instance automatically exposes
  `plan/emit/up/down/status/logs/rollback/secrets`. This is the "converge a deployment" path (init /
  cutover / rollback), aligned with #348's `init|up` convergence.
- **`netscript pm <verb>`** (OF-1 (a)) is the daily-driver ops group — `status`, `logs`, `monitor`,
  `restart <name>`, `scale <name>=N` (later-milestone, OF-5), `block`/`unblock` (S7). These are
  finer-than-per-target verbs the uniform `DeployTargetPort` contract deliberately does not model
  (r2 §2 "Canonical 8-op deploy contract" row: reuse the *pattern*, not the literal type). They read
  and drive the pm control-plane service (D2), which itself drives the same `systemctl`/`servy`
  command layers.
- **No overlap, no duplication:** `deploy up` = "make the declared graph the running reality"
  (compile → render units → install/activate via health-gate); `pm restart web` = "act on one live
  managed unit now." The former is idempotent convergence; the latter is imperative ops.

### D3.1.3 Config-member vs registry-key mismatch (must fix in the OF-4 slice)

The registry keys are `windows-service` / `linux-service` but the config members are `windows` /
`linux` (`deploy-schema.ts:163-220`, r2 §2). The router resolves config by *registry key*:
`resolveTargetConfig` does `targets?.[key]` with `key = 'linux-service'`
(`target-deploy-command.ts:151-163`). Mounting `linux-service`/`windows-service` as-is would look up
`deploy.targets['linux-service']`, which does not exist, so config resolution silently returns
`undefined`. **This is a concrete acceptance criterion for the OF-4 precursor slice** (D3-S1 below):
either register the targets under the config-member key (`windows`/`linux`) or add an explicit
key→member alias in `resolveTargetConfig`. Verify the exact member names at Stage E against
`deploy-schema.ts` before locking; treat the mismatch as real until proven otherwise.

---

## D3.2 OF-4 precursor slice spec (independently shippable, BEFORE the pm epic)

**Goal:** finish wiring `windows-service`/`linux-service` through the generic router, drop the
Windows-only hard gate on reachable bare-metal verbs, and fix two stale copy sites. This is
fix-forward against #327's shipped-bare-metal claim (r2 §1.2; drift entry 3) and depends on nothing
in D1 — it can land in the current open beta window.

### D3.2.1 Scope (concrete)

1. **Mount the two targets in the router.** In `deploy-group.ts` add, alongside the cloud targets
   at `:79-85`:
   ```
   .command('linux-service',   createTargetDeployCommand('linux-service', dependencies))
   .command('windows-service', createTargetDeployCommand('windows-service', dependencies))
   ```
   The descriptor instances already advertise the 6-op subset (`service-deploy-target.ts:93-98`), so
   the router derives `plan/emit/up/down/status/logs` subcommands with no further work
   (`target-deploy-command.ts:60-61`). (`rollback`/`secrets` appear once ports are wired — that is
   the pm epic, not this slice.)
2. **Resolve the key→config-member mismatch** (D3.1.3) so `deploy linux-service plan` finds
   `deploy.targets.linux`. Add the alias in `resolveTargetConfig` (`target-deploy-command.ts:151`)
   or register under the member key; pick one and record it.
3. **Remove the Windows-only hard gate on the reachable bare-metal verbs.** Today `deploy
   start|stop|status|logs` throw `WindowsRequiredError` unconditionally
   (`start-deploy-command.ts:50`, `stop-deploy-command.ts:48`, `status-deploy-command.ts:44`,
   `logs-deploy-command.ts:38`). `deploy install`/`uninstall` are already OS-generic via
   `detectServiceOs()` + the injected `OsServicePort` (`install-service-deploy.ts:85-95`,
   `deploy-group.ts:55-75`). Route the four gated legacy verbs through the same
   `detectServiceOs()`+`OsServicePort` path (or deprecate them in favor of the router's
   `up/down/status/logs`), so Linux bare-metal is reachable. Minimum bar: no reachable bare-metal
   verb throws `WindowsRequiredError` on Linux.
4. **Fix the stale R-DEPLOY-2 doc comment.** `public-command-dependencies.ts:161-166` says the
   registry "Ships the seed `windows-service` target plus the Aspire-driven `compose`/`docker` cloud
   adapters; resolved by the thin `deploy <target>` router (R-DEPLOY-2)" — but `windows-service` is
   *not* resolved by the router today. Update the comment to state the true routed set (post-slice:
   includes `linux-service`/`windows-service`).
5. **Fix the "Windows service manager" copy in `install-deploy-command.ts`.** The description reads
   `'Register services with the Windows service manager'` (`install-deploy-command.ts:33`) though the
   implementation is OS-generic (`install-service-deploy.ts:85`). Change to OS-neutral copy (e.g.
   "Register services with the OS service manager (systemd/servy)"). Sibling cosmetic fix folded per
   C4 entry 4 / drift entry 9. Also correct the two `label: 'Install Windows services'` /
   `'Register services with the Windows service manager'` strings inside
   `install-service-deploy.ts:71` and the pipeline step `inspect` label (`:67-73`) if the same wave
   touches them.

### D3.2.2 Acceptance criteria

- `deno task check` + scoped check/lint green on `packages/cli`.
- `deploy linux-service plan|emit|up|down|status|logs` route to `LinuxServiceDeployTarget` and load
  `deploy.targets.linux` config (assert `resolveTargetConfig` returns the member, not `undefined`).
- `deploy windows-service …` symmetric for `deploy.targets.windows`.
- No reachable bare-metal verb throws `WindowsRequiredError` on a non-Windows host (unit test the
  four former gates on a simulated Linux `detectServiceOs()`).
- Router still refuses an unsupported op with the existing message
  (`target-deploy-command.ts:113-118`) — no silent no-op (LD-4 preserved).
- Grep proves zero remaining "Windows service manager" copy on the OS-generic install path.
- No new `any`, no target-specific logic added to the router (R-DEPLOY-2 stays true;
  `ARCHETYPE-7` §Rules).

### D3.2.3 Test surface

- New router-resolution unit tests mirroring the existing cloud-target parser tests (the router is
  already unit-tested for cloud keys; extend the same file with the two service keys).
- Reuse the existing adapter tests: `systemd-os-service_test.ts`,
  `os-service-factory_test.ts:24-26` (r2 §1.2) already prove the Linux adapter satisfies
  `OsServicePort`; this slice only proves *reachability*, not new adapter behavior.
- E2E: not required for this slice (no scaffold-output change); a `deploy linux-service plan`
  smoke on a Linux runner is sufficient. Do **not** trigger the full `scaffold.runtime` gate for a
  router-wiring change.

---

## D3.3 Renderer / port extensions (the Linux differentiator)

Per m3 §2/§7.2 and C1.3: extend the **existing** `renderSystemdUnit` — never add a parallel
renderer. All new fields are optional and default to today's behavior, so unset config renders the
current unit byte-for-byte.

### D3.3.1 `SystemdUnitConfig` field-by-field extension

Extending `systemd-unit.ts:19-67` (defaults added to `constants/linux.ts`). Every field renders
directly into a `[Service]`-section directive; no userland reimplementation (m3 §6 boundary).

| New field | Type | Renders | Default | Source |
| --- | --- | --- | --- | --- |
| `notifyReady` | `boolean` | flips `Type=simple`→`Type=notify` | `false` (keep `simple`, `constants/linux.ts:39`) | m3 §2.1; sd_notify(3) |
| `watchdogSec` | `number` | `WatchdogSec=<n>` (implies `Type=notify`) | omitted | m3 §2.1 |
| `hardening` | `SystemdHardeningProfile` (below) | the hardening directive block | omitted (opt-in) | m3 §2.2 |
| `dynamicUser` | `boolean` | `DynamicUser=yes` (+ pairs with `StateDirectory`/`CacheDirectory`/`LogsDirectory`) | `false` | m3 §2.5 |
| `stateDirectory` | `string` | `StateDirectory=<rel>` | omitted | m3 §2.5 |
| `logsDirectory` | `string` | `LogsDirectory=<rel>` | omitted | m3 §2.5 |
| `resources` | `SystemdResourceLimits` (below) | cgroups v2 directives | omitted | m3 §2.3 |

`SystemdHardeningProfile` (each key → one directive; a typed "sane default" preset is the value-add,
per m3 §2.2 "the plugin's value-add is a sane, typed default hardening profile, not reinventing
sandboxing"):

```
interface SystemdHardeningProfile {
  noNewPrivileges?: boolean;        // NoNewPrivileges=yes
  protectSystem?: 'full' | 'strict';// ProtectSystem=strict
  protectHome?: boolean | 'read-only';
  privateTmp?: boolean;             // PrivateTmp=yes
  privateDevices?: boolean;
  protectKernelTunables?: boolean;
  protectKernelModules?: boolean;
  protectControlGroups?: boolean;
  restrictNamespaces?: boolean;
  memoryDenyWriteExecute?: boolean;
  lockPersonality?: boolean;
  systemCallFilter?: readonly string[]; // e.g. ['@system-service']
  restrictAddressFamilies?: readonly string[];
  capabilityBoundingSet?: readonly string[];
}
```

Ship one named preset `HARDENING_BASELINE` (`NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp`,
`ProtectKernelModules/Tunables/ControlGroups`, `RestrictNamespaces`, `SystemCallFilter=@system-service`)
that a config author selects by name; validated informally against `systemd-analyze security`
scoring (m3 §2.2). Do not enable it by default — a NetScript app that binds low ports or writes
outside its state dir must opt in knowingly.

`SystemdResourceLimits`:

```
interface SystemdResourceLimits {
  cpuQuota?: string;    // 'CPUQuota=50%'
  cpuWeight?: number;   // CPUWeight=
  memoryMax?: string;   // 'MemoryMax=512M'
  memoryHigh?: string;
  memorySwapMax?: string;
  ioWeight?: number;
}
```

Rendering slots into `renderSystemdUnit` between the `Environment=` loop (`systemd-unit.ts:118-120`)
and the trailing restart/timeout block (`:126-137`), preserving field order determinism. Socket
activation (m3 §2.4) and portable services (m3 §2.5) are documented advanced options, **not** day-one
fields (Stage E may add a `.socket` companion later).

### D3.3.2 What Servy can and cannot mirror (S11 asymmetry, stated in docs)

`ServyServiceConfig` (`servy-config.ts:31-82`) already models the Windows ceiling; the pm surfaces a
*cross-platform* process spec that renders down to each platform's native fields, and documents where
Windows stops short. Field-by-field:

| pm process-spec concept | systemd render | Servy render | Asymmetry |
| --- | --- | --- | --- |
| liveness/watchdog | `Type=notify`+`WatchdogSec` + `sd_notify` (D3.4) | `enableHealthMonitoring`+`heartbeatIntervalSeconds`+`maxFailedChecks` (`servy-config.ts:59-63`) | **Windows ceiling.** Servy has no watchdog socket / `sd_notify` equivalent; heartbeat interval + max-failed-checks is the coarser Windows model (m3 §7.4). |
| restart policy | `Restart=`/`RestartSec=` (`systemd-unit.ts:50-54`) | `recoveryAction`+`maxRestartAttempts` (`servy-config.ts:64-66`) | Both expressible; Servy adds `RestartComputer` (no systemd analogue), systemd adds `on-watchdog` (no Servy analogue). |
| resource ceilings (cgroups) | `CPUQuota`/`MemoryMax`/… (D3.3.1) | **none** | **Hard asymmetry, no Windows equivalent (m3 §2.3/§6/§7.4; drift 21 → risk register, C4).** Config that sets `resources` on a Windows target renders nothing and MUST warn, not silently drop (LD-4 spirit). |
| hardening/sandbox | hardening block (D3.3.1) | `runAsLocalSystem`/`userAccount` only (`servy-config.ts:71-73`) | Windows has run-as identity but no sandbox-directive parity; document as coarser. |
| log rotation | journald (`StandardOutput=journal`, `systemd-unit.ts:131`) + `journalctlLogsArgs` | native size/date rotation fields (`servy-config.ts:52-56`) | Different mechanism, both work (m3 §1.2). |

Doctrine rule for the config layer: a knob unsupported on the resolved target **warns and omits**
(carry the `DeployTargetPort` "omit rather than silent no-op" pattern — `service-deploy-target.ts:20`
LD-4 — into per-process capability negotiation, S10). Never render a fake equivalent.

### D3.3.3 Does `OsServicePort` itself need new methods?

**Mostly no — keep it 2-method.** `OsServicePort` (`os-service-port.ts:36-45`) is `install(request)`
+ `run(op, name)` over 5 operations; it installs a *rendered config file* and runs lifecycle ops.
The renderer extensions above are entirely config-file-side and flow through `install` unchanged (the
richer unit is just a richer `configPath`). Two bounded additions, both via the
descriptor/self-advertisement pattern (S10), not by fattening the core port:

1. **Optional capability descriptor.** Add a sibling optional port
   `OsServiceCapabilityPort { capabilities(): OsServiceCapabilities }` (or an optional
   `capabilities` getter that adapters may implement), advertising per-platform support
   (`watchdog`, `cgroups`, `dynamicUser`, `hardening` on systemd; `heartbeat`, `recoveryAction`,
   `logRotation` on servy). The config layer reads this to drive D3.3.2's warn-and-omit. This mirrors
   `ServiceDeployTarget.operations` self-reporting (`service-deploy-target.ts:93-98`) rather than
   inventing a new negotiation shape.
2. **Optional `logs` operation.** The pm control plane wants aggregate log tailing.
   `journalctlLogsArgs` already exists (`systemd-command.ts:57-69`, supports `-n`/`-f`), and Servy
   writes flat files (no `follow` — another S11 asymmetry). Recommend the control plane call the
   command layers directly for streaming (they are the documented single source of truth —
   `servy-command.ts`, `systemd-command.ts`), and add `'logs'` to `OsServiceOperation` only if a
   port-level read is later required. Default: **do not** add `logs` to the core port in v1; keep the
   5-op surface and let the control-plane read path use the command builders. Record this as a
   deliberate minimalism call (A-doctrine: no premature port method).

---

## D3.4 sd_notify helper (pure-Deno)

Buildable on stock Deno with no FFI, no `--unstable`, no external binary (m3 §5). Lives in the pm
core's Linux runtime glue, exposed as an app-facing API.

### D3.4.1 Design

- **Transport:** `Deno.listenDatagram({ transport: 'unixpacket', path })` → `DatagramConn`;
  `conn.send(payload, { transport: 'unixpacket', path: NOTIFY_SOCKET })` fire-and-forget (m3 §5;
  https://docs.deno.com/api/deno/~/Deno.listenDatagram). Requires `--allow-read`/`--allow-write`, no
  `--unstable` gate as of the fetched doc state.
- **Bind quirk:** Deno's `listenDatagram` requires binding to a local `path` to construct the conn at
  all, unlike the C reference client which can send from an unnamed local address (m3 §5). The helper
  binds a short-lived temp path under `$TMPDIR` and unlinks it after use — purely to satisfy the API
  shape, not because sd_notify needs a bound local socket.
- **API (app-facing):**
  - `notifyReady()` → sends `READY=1`. No-op (returns immediately) when `NOTIFY_SOCKET` is unset,
    i.e. outside systemd / on Windows / in dev — so app code calls it unconditionally.
  - `notifyWatchdog()` → sends `WATCHDOG=1`.
  - `watchdogIntervalMs()` → reads `WATCHDOG_USEC` (systemd sets it when `WatchdogSec=` + `Type=notify`,
    m3 §2.1) and returns the interval the app must ping *more often than*; `undefined` when unset. The
    app (or a pm-provided timer helper) pings at ~half that interval, the standard safety margin.
  - Optional: `notifyStopping()` (`STOPPING=1`), `notifyStatus(text)` (`STATUS=...`) — cheap to add,
    same transport (protocol keys per sd_notify(3),
    https://www.freedesktop.org/software/systemd/man/latest/sd_notify.html).
- **Wiring:** gated behind the `Type=notify`+`WatchdogSec` units emitted by D3.3.1 — one NetScript
  API regardless of systemd / Servy / dev-fallback (m3 §7.3). On Servy and in dev the calls no-op
  (Windows has no watchdog socket — S11).

### D3.4.2 Spike task (flagged, NOT assumed)

Deno's `unixpacket` path-based API does not obviously cover systemd's abstract-namespace `@`-prefixed
`NOTIFY_SOCKET` form (m3 §5). **This is a spike, not an assumption:** the design must not claim
abstract-namespace support until proven. Ship as a bounded investigation slice — if unsupported,
document the limitation (path-based `NOTIFY_SOCKET` works; abstract-namespace requires a fallback or
is unsupported) and file a Deno upstream reference. Do not block the path-based happy path on it.

---

## D3.5 systemd `--user` + linger: DEFERRED (with rationale)

**Recommendation: out of milestone-1 scope; design note + risk-register entry only.** Rationale:

- The shipped systemd adapter is root/system-unit oriented: `SystemdUnitConfig.user` is optional and
  "Omitted → runs as root (`RunAsLocalSystem` parity)" (`systemd-unit.ts:29`); `systemctlEnableArgs`
  links a system unit path (`systemd-command.ts:35-44`); defaults install under `/opt/netscript` +
  `/run/netscript` (`constants/linux.ts:24-27`). Nothing models `~/.config/systemd/user/`,
  `systemctl --user`, `XDG_RUNTIME_DIR`, or `loginctl enable-linger` (m3 §2.7).
- Rootless/`--user` mode is real demand (m3 §7.7) but touches unit *install location*, the
  systemctl invocation (`--user` flag on every op in `systemd-command.ts`), linger enablement, and
  `XDG_RUNTIME_DIR` handling for the `NOTIFY_SOCKET` path — a coherent slice of its own, not a knob.
- It is orthogonal to the pm's core value (multi-process topology + control plane) and can land as a
  later systemd-tier slice without reworking anything above.

Carry as a **named Stage-E risk-register / later-slice candidate**: "systemd `--user` + linger
non-root install mode" — design sketch: add `scope: 'system' | 'user'` to the systemd config, thread
`--user` through `systemd-command.ts` builders, resolve unit dir + `XDG_RUNTIME_DIR`, and emit a
`loginctl enable-linger` step in `install`. Not built in v1.

---

## D3.6 Conventions wiring (S10 — lift as-is, show the seams)

All four conventions are pure, target-agnostic, port-injected (r2 §2, §5.2), so they compose onto
pm-managed units without modification. The pm's core supplies the `ServiceDeployTargetPorts`
(`service-deploy-target.ts:41-58`) that promote the bare `linux-service`/`windows-service`
descriptors to wired adapters. Call seams:

- **Rollback + release retention** — `rollback-convention.ts` (`retainReleases`, `selectRollbackTarget`,
  `ReleaseRecord`, `ActivationPort`; r2 §2). Seam: inject `activation: ActivationPort` into
  `ServiceDeployTargetPorts`; `ServiceDeployTarget.rollback` already delegates to `rollbackToPrevious`
  when `activation` is present (`service-deploy-target.ts:153-162`). A pm "candidate binary release"
  is just another `ReleaseRecord`. The pm's registry-port (D1/S3) backs `ActivationPort.current/activate/record/history/prune`.
- **Health-gated activation** — `activation-convention.ts:81-126` (`activateWithHealthGate`) +
  `health-gate.ts` (`runHealthGate`, `HealthProbePort`, `SleepFn`). Seam: inject `health`,
  `resolveActivation`, optional `sleep`; `ServiceDeployTarget.up` runs the health-gated cutover +
  automatic rollback when `activation`+`health`+`resolveActivation` are all wired
  (`service-deploy-target.ts:116-131`), else falls back to the descriptor (LD-4). The pm's
  app-level readiness (`sd_notify` READY / HTTP health) is the `HealthProbePort` implementation. This
  is the pm's zero-downtime restart, reusing the deploy lane's exact orchestrator (r2 §2 health-gate
  row).
- **Secrets (0600 env file)** — `secrets-convention.ts` (`renderSecretsEnvFile`, `reconcileSecrets`,
  `SecretsBundle`, `SecretsStorePort`; r2 §2). Seam: inject `secretsStore` + `resolveSecrets`;
  `ServiceDeployTarget.secrets` delegates to `reconcileSecrets` (`service-deploy-target.ts:169-178`).
  Per-managed-process env/secrets use the same 0600 env-file convention the systemd unit's
  `Environment=`/`EnvironmentFile=` consumes.
- **Observability (OTEL env)** — `observability-convention.ts` (`observabilityEnv()` deriving
  `OTEL_DENO`/`OTEL_SERVICE_NAME`/…; r2 §2). Seam: the pm injects the same env map per managed
  process into the rendered unit's `Environment=` lines (`systemd-unit.ts:118-120`) / Servy
  `environmentVariables` (`servy-config.ts:47`), giving OS-service-mode processes observability
  parity with cloud/container targets. Complements the pm's own `netscript.process` spans (S5, D2).

The pm adds only the *resolvers* (`resolveActivation`/`resolveSecrets` translating a pm process-graph
node into the convention's request shape) — no convention body is copied or re-implemented (R-DEPLOY-3;
`ARCHETYPE-7` §Rules).

---

## D3.7 #345 re-scope mechanics (OF-3) — DRAFT for owner ratification

r2 §4 found direct overlap between #345's "multi-instance rollout + HA activation" and the pm's
per-host multi-instance job. OF-3 recommendation (a): narrow #345, move per-host multi-instance into
the pm epic, add a dependency edge. **This is a proposed edit for Stage-H owner ratification — NOT a
filed change; zero board mutation now.**

Current #345 scope (from `context/adjacent-issues.jsonl`, #345): "multi-instance / HA activation,
external secret store integration (Vault / cloud KMS), and automated `deno compile` code signing"
(milestone `0.0.1-beta.5` at snapshot; body says STABLE / `0.0.1-stable`).

**Proposed re-scoped #345 body (draft):**

> `[Deploy-S9] Bare-metal enterprise hardening (stable): cross-host HA + external secret store +
> signing`
> Scope: **cross-host / target-level** HA activation (e.g. N hosts behind a VIP, staged rollout
> across machines), external secret-store adapters (Vault / cloud KMS) behind the shipped secrets
> port, and automated `deno compile` code signing (Windows `signtool`, macOS Developer ID +
> notarization).
> **Explicitly out of scope (moved to the process-manager epic):** *per-host* multi-instance /
> fork-of-one-app supervision — owned by the pm plugin's supervision core (OF-5 later-milestone).
> Depends on: the process-manager epic for the per-host multi-instance primitive it composes with;
> S4 (compile hook), S5 (beta baseline). Milestone: `0.0.1-stable`.

**What moves into the pm epic:** per-host multi-instance / N-copies-of-one-app (OF-5 defers the
OS-supervised port-sharing form out of milestone-1; ships `concurrencyEnvVar` self-fan-out first —
`research.md` C3/OF-5, r2 §5 note).

**Dependency edge (draft):** re-scoped #345 gains "depends on <pm-epic multi-instance slice>";
the pm epic references #345 as the cross-host consumer of its per-host primitive. Boundary line
(r2 §4): deploy-lane HA = target-level (multiple servers); pm HA = per-host multi-instance/fork.

Owner ratifies the split at Stage H; only then is #345 edited and the edge filed.

---

## D3.8 F-DEPLOY gate promotion (ledger 1) — recommend PROMOTE, conditional on the core package existing

`ARCHETYPE-7` seeds `F-DEPLOY-1` (each registered target implements the uniform 7-op contract or a
declared subset) and `F-DEPLOY-2` (deploy command surface has no target-specific logic; conventions
live in the core) as **`reviewed`**, to be promoted to **`gated`** once the deployment *packages*
(#339–#343) exist as real packages (`ARCHETYPE-7-deploy-target-adapter.md:12-16, :74-85, :122-123`;
gate matrix `:51-54`). Today deploy still lives inside `packages/cli` (Archetype 6), so the packages
the promotion waits on do not yet exist as such.

**Recommendation: this epic promotes both gates to `gated`, because it is the slice that finally
creates the Archetype-2 core package** (`packages/plugin-process-manager-core` per S1) that
`OsServicePort` + the target adapters live in — satisfying the archetype's own "until the packages
exist" precondition. Promotion requires (spec):

1. **A real Archetype-2 core package exists** — `packages/plugin-process-manager-core` owning
   `OsServicePort`, the systemd/servy adapters (moved or re-exported from `packages/cli`), the target
   registry, and the four conventions, so `F-DEPLOY-1`/`-2` have a package boundary to scan (not just
   `packages/cli` internals).
2. **All registered targets pass F-DEPLOY-1** — after the OF-4 slice (D3-S1) mounts
   `linux-service`/`windows-service`, every entry in `deploy-target-registry.ts` advertises a valid
   subset of the uniform contract; the AST + registry scan (`ARCHETYPE-7` §Fitness Gates detection)
   asserts it. The pm-wired instances advertise the full 8-op set once ports are injected
   (`service-deploy-target.ts:93-98`).
3. **Router stays thin — F-DEPLOY-2** — the import-graph + AST check confirms no target-specific
   logic in `deploy-group.ts` / `target-deploy-command.ts` and that health/OTEL/secrets/rollback
   remain in the core (R-DEPLOY-3). The OF-4 slice must not regress this (D3-S1 acceptance).
4. **Gate detection wired into the arch-check** — the `F-DEPLOY-*` detection runs in
   `deno task arch:check` (or the harness gate runner) and the matrix flips the two rows from
   `reviewed` to `gated`, with the arch-debt entry (`deployment — Archetype-7 core-centralization +
   F-DEPLOY seed`, `ARCHETYPE-7:101, :16`) updated/closed.

If the epic does **not** extract a real core package (stays inside `packages/cli`), keep the gates
`reviewed` with manual evidence (`ARCHETYPE-7:122-123` allows `reviewed` with manual evidence while
packages are unbuilt) — do not fake a promotion. Recommend the extraction, so promotion is real.

---

## D3.9 Milestone-train placement (SKETCH — Stage E re-derives against the live board, drift 1)

Note only; beta.5 was cut at baseline `317e4b50` (charter), so the concrete milestone is Stage E's
call against the live board.

| Slice | Candidate placement | Why |
| --- | --- | --- |
| D3-S1 (OF-4 precursor) | **near-term beta** (independent, no D1 dep) | fix-forward on shipped-lane drift; unblocks Linux bare-metal; shippable now |
| D3-S2 (systemd knobs) | beta | the differentiator; depends on D1 core + D5 config schema |
| D3-S3 (sd_notify) | beta (spike sub-task can trail) | pairs with D3-S2 units |
| D3-S4 (capability descriptor) | beta | small; enables warn-and-omit |
| D3-S5 (conventions wiring) | beta | pure lift; depends on D1 core + D3-S1 |
| D3-S6 (F-DEPLOY promotion) | beta, after D1 core package lands | promotion needs the package boundary |
| D3-S7 (#345 re-scope, board draft) | owner-ratified at Stage H | board mutation, draft only |
| `--user`/linger (D3.5) | **defer** (later systemd tier / stable) | orthogonal, own slice |
| cgroups depth / socket-activation | beta knobs / later depth | D3-S2 covers core cgroups; socket activation later |

---

## D3.10 Slice decomposition (candidate issues — DRAFT, `Part of #<pm-epic>`)

Dependency edges: "D1 core" = the supervision-engine + core package pack (S1); "D5 config" = the
process-graph schema pack (S9).

1. **D3-S1 — Wire `linux-service`/`windows-service` through the deploy router + drop the Windows-only
   gate (OF-4 precursor).**
   Scope: D3.2. Acceptance: D3.2.2. Tests: D3.2.3. Deps: **none** (independently shippable before the
   pm epic). Labels: `type:fix`/`type:feat`, `area:deploy`, `area:cli`.
2. **D3-S2 — systemd renderer extension: `Type=notify`+`WatchdogSec`, hardening profile, `DynamicUser`,
   cgroups v2 knobs.**
   Scope: D3.3.1. Acceptance: unset config renders today's unit byte-identically; each knob renders
   the correct directive; `HARDENING_BASELINE` preset present; Windows target warns-and-omits
   `resources`/`hardening` (D3.3.2). Deps: D1 core (hosts the config→render path), D5 config
   (process-graph fields). Labels: `type:feat`, `area:deploy`.
3. **D3-S3 — pure-Deno `sd_notify` helper (`notifyReady`/`notifyWatchdog`/`watchdogIntervalMs`) + no-op
   outside systemd.**
   Scope: D3.4.1. Acceptance: sends correct payloads to `NOTIFY_SOCKET`; no-ops when unset; reads
   `WATCHDOG_USEC`; no FFI / no `--unstable`. Sub-task **D3-S3a (spike):** abstract-namespace `@`
   `NOTIFY_SOCKET` feasibility (D3.4.2) — outcome documented, not assumed. Deps: D1 core (Linux glue
   home), D3-S2 (units that set `NOTIFY_SOCKET`). Labels: `type:feat`, `area:deploy`.
4. **D3-S4 — `OsServicePort` capability descriptor (self-advertised per-platform support) for
   warn-and-omit negotiation.**
   Scope: D3.3.3(1). Acceptance: systemd advertises `watchdog`/`cgroups`/`dynamicUser`/`hardening`;
   servy advertises `heartbeat`/`recoveryAction`/`logRotation`; config layer warns (not drops) on
   unsupported knob; core `install`/`run` surface unchanged. Deps: D1 core. Labels: `type:feat`,
   `area:deploy`.
5. **D3-S5 — Wire rollback / health-gate / secrets / observability conventions into pm-managed
   `linux-service`/`windows-service` units.**
   Scope: D3.6. Acceptance: pm supplies `ServiceDeployTargetPorts` promoting the bare descriptors to
   8-op wired adapters; `up` runs health-gated activation; `rollback`/`secrets` advertised only when
   ports present (LD-4); per-process OTEL env injected. No convention body copied (R-DEPLOY-3). Deps:
   D1 core (registry/activation port), D3-S1 (targets reachable). Labels: `type:feat`, `area:deploy`.
6. **D3-S6 — Promote `F-DEPLOY-1`/`F-DEPLOY-2` from `reviewed` to `gated`; wire detection into
   arch-check.**
   Scope: D3.8. Acceptance: core package boundary exists; AST+registry scan for F-DEPLOY-1 and
   import-graph+AST for F-DEPLOY-2 run in `arch:check`; matrix rows flipped; arch-debt entry updated.
   Deps: D1 core package landed, D3-S1, D3-S5. Labels: `type:chore`/`gate:*`, `area:deploy`.
7. **D3-S7 (board draft, owner-ratified) — Re-scope #345 to cross-host HA/secrets/signing; move
   per-host multi-instance to the pm epic; add the dependency edge.**
   Scope: D3.7. Acceptance: owner approves the split at Stage H; #345 body + edge filed only after.
   Deps: owner ratification. No code. Labels: `area:deploy`, `epic:deployment`.
   *(Deferred, not a milestone-1 slice: systemd `--user` + linger non-root install mode — D3.5.)*

---

## D3.11 Residual open questions for Stage E

1. **Config-member vs registry-key mismatch** (D3.1.3): confirm the exact member names in
   `deploy-schema.ts` (`windows`/`linux` vs `windows-service`/`linux-service`) and pick the fix
   (register under member key vs alias in `resolveTargetConfig`). Load-bearing for D3-S1.
2. **Core-package extraction scope** (D3.8): does the epic extract `OsServicePort`+adapters+registry
   into `packages/plugin-process-manager-core`, or re-export from `packages/cli`? Determines whether
   F-DEPLOY promotion is real (D3-S6) — recommend extraction.
3. **Legacy flat verbs' fate** (D3.2.1(3)): after OF-4, do `deploy start|stop|status|logs` get
   de-gated in place, or deprecated in favor of the router's `up/down/status/logs`? Both satisfy
   acceptance; Stage E picks the migration story.
4. **`sd_notify` abstract-namespace support** (D3.4.2): spike outcome (D3-S3a) may constrain the
   Linux watchdog story on hosts using `@`-prefixed `NOTIFY_SOCKET`.
5. **`logs` op on `OsServicePort`** (D3.3.3(2)): keep the 5-op core and read via command builders, or
   add an optional `logs` op later? Recommend the former for v1; revisit if the control plane needs a
   port-level read.
6. **cgroups depth vs Windows parity messaging** (D3.3.2): confirm the docs stance on the hard
   cgroups asymmetry (drift 21 → risk register) — resource limits are Linux-only; the pm must not
   imply Windows resource ceilings.
7. **Milestone train** (D3.9): Stage E re-derives all placements against the live board post-beta.5
   cut (drift 1); the sketch above is a note, not a lock.
