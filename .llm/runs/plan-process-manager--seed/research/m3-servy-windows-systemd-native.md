# M3 — Servy/Windows + systemd-native: OS-level supervision the plugin must WRAP, not reinvent

## 1. What NetScript already ships (repo-side baseline)

NetScript's bare-metal deploy lane (epic #327, slices #337-#341, all CLOSED per charter) already
generates OS-native service registrations for two platforms. This is the floor the process-manager
plugin composes with — it must not re-derive this surface, only front it with a unified port and
richer app-level orchestration.

### 1.1 Windows: Servy adapter (shipped)

- `ServyServiceConfig` domain type
  (`packages/cli/src/kernel/domain/deploy/servy-config.ts:31-82`) models a single Windows service:
  identity, executable/args, startup type/priority, env vars, log paths + rotation
  (`enableSizeRotation`/`rotationSizeMB`/`enableDateRotation`/`dateRotationType`/`maxRotations`),
  health monitoring (`enableHealthMonitoring`, `healthCheckUrl`, `heartbeatIntervalSeconds`,
  `maxFailedChecks`), failure recovery (`recoveryAction`: `None`/`RestartService`/
  `RestartProcess`/`RestartComputer`, `maxRestartAttempts`), service dependency ordering, run-as
  identity, and pre/post-launch hooks.
- `generateServyXml()` (`packages/cli/src/kernel/adapters/windows/servy/servy-xml.ts:40-143`)
  renders this into the `<ServiceDto>` XML Servy's CLI imports; every field above is emitted
  (health-check URL is emitted only as an XML comment — Servy's schema has no native "hit this URL"
  probe, so today's config only turns heartbeat monitoring flags on/off, it does not wire an actual
  HTTP health check contract from NetScript's side).
- `writeServyConfigs()` (`packages/cli/src/kernel/adapters/windows/servy/servy-writer.ts:19-37`)
  batches XML generation over `CompileTarget[]` into `.deploy/windows/config/`.
- Command layer: `servyInstallArgs`/`servyLifecycleArgs`/`fullServiceName`/`resolveServyCli`
  (`packages/cli/src/kernel/adapters/deploy/commands/servy-command.ts:16-99`) are the single source
  of truth for `servy-cli.exe` invocation (`install -n <name> -c <configPath> -q [--force]`,
  `start|stop|status|uninstall -n <name> -q`), reused byte-identically by both the command layer and
  the port adapter (documented in-file at
  `packages/cli/src/kernel/adapters/deploy/commands/servy-command.ts:60-64`).
- Port adapter: `ServyOsServiceAdapter implements OsServicePort`
  (`packages/cli/src/public/adapters/servy-os-service.ts:32-63`) shells out to `servy-cli.exe` via
  `ProcessPort.exec` and normalizes stdout/stderr/exit-code into `OsServiceCommandResult`.
- Upstream project: Servy is an actively-developed open-source Windows service wrapper —
  https://github.com/aelassas/servy. NetScript's prior research corpus (charter's "prior research
  corpus" pointer, branch `research/deployment-aggregation`) recorded a SERVY verdict of MODERNIZE;
  that branch's `deployment-architecture-spec.md` and `decision-gap-tracker.md`
  (checked via `git show research/deployment-aggregation:.llm/tmp/run/epic-deployment-aggregation/*.md`)
  do not themselves contain Servy-specific assessment text in the current tree — drift candidate:
  the charter references a `servy-assessment.md` that could not be located by path or content grep
  across `research/deployment-aggregation` (nor across the visible commit history within the time
  budget of this survey). Treat the MODERNIZE verdict as directionally accurate (matches what's
  shipped: NetScript generates config + drives lifecycle, does not touch Servy's own service-host
  binary) but re-verify the source doc at Stage C/E.

### 1.2 Linux: systemd adapter (shipped, deliberately minimal)

- `SystemdUnitConfig` (`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:19-67`) and
  `renderSystemdUnit()` (same file, lines 82-140) emit a `.service` unit with: `Description`,
  `ExecStart`, `WorkingDirectory`, optional `User`/`Group`, `Environment=` lines (escaped per
  `escapeEnvValue()`, lines 75-80, handling backslash, double-quote, and newlines — correct per
  systemd's `Environment=` quoting rules), `After=`/`Wants=` ordering, `RuntimeDirectory`, and a
  fixed `[Service]` block: `Type=simple` (default), `Restart=on-failure` (default),
  `RestartSec=5` (default), `TimeoutStartSec=30`/`TimeoutStopSec=30` (defaults), and
  `StandardOutput=journal`/`StandardError=journal` (always-on, not configurable). Defaults live in
  `packages/cli/src/kernel/constants/linux.ts:30-51`.
  - Gap vs. 2026 state of the art (see §2 below): no `WatchdogSec=`, no `Type=notify` option, no
    hardening directives (`NoNewPrivileges=`, `ProtectSystem=`, `ProtectHome=`, `PrivateTmp=`,
    `ProtectKernelModules=`, etc.), no `DynamicUser=`, no `CPUQuota=`/`MemoryMax=` resource control.
    `healthCheckUrl` is accepted but only emitted as a unit comment
    (`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:99-101`), matching the Windows
    side's comment-only treatment — health-check wiring is explicitly NOT an OS-layer concern today
    on either platform, which is the correct boundary (see §6).
- Command layer: `systemctlLifecycleArgs`/`systemctlEnableArgs`/`systemctlDisableArgs`/
  `systemctlDaemonReloadArgs`/`journalctlLogsArgs`
  (`packages/cli/src/kernel/adapters/linux/systemd/systemd-command.ts:12-69`) — the systemd analogue
  of the servy-command module, explicitly documented as such in-file (lines 1-8). Notably
  `journalctlLogsArgs` gives structured log-tailing (`-u <unit> [-n <lines>] [-f]`) — a capability
  Windows/Servy has no equivalent for (Servy writes to flat files instead; NetScript's log-rotation
  fields exist only in the Servy config, confirming journald log capture was chosen as the
  Linux-native substitute rather than reimplementing Servy-style file rotation on Linux).
- `OsServicePort` (`packages/cli/src/public/ports/os-service-port.ts:36-45`) is the shared,
  OS-agnostic seam: `install(request)` and `run(operation, serviceName)`, satisfied by both
  `ServyOsServiceAdapter` and a `SystemdOsServiceAdapter` at
  `packages/cli/src/public/adapters/systemd-os-service.ts` (present in the tree, same-shape sibling
  test file `systemd-os-service_test.ts` confirms it satisfies the same port contract).

### 1.3 The reuse seam for this run

The `OsServicePort` contract is exactly the seam the process-manager plugin's OS-native supervision
tier should sit behind — it already abstracts "install" and "run a lifecycle op" across Windows and
Linux. What it does not cover, and what the pm plugin adds on top: app-level process topology
(multiple app processes per deployment, not just one service per compile target), structured
health/readiness semantics beyond a comment string, an admin UI, and the dev-fallback (`--no-aspire`)
in-process supervisor loop that isn't backed by an OS service manager at all.

## 2. systemd state of the art (2026) the plugin should target, not reinvent

Everything in this section is OS-layer capability NetScript should emit config for, never
reimplement in userland Deno code.

### 2.1 Restart policy and liveness

- `Restart=` (`no`, `on-success`, `on-failure`, `on-abnormal`, `on-watchdog`, `on-abort`, `always`)
  and `RestartSec=` govern crash-restart behavior — already partially modeled (`Restart=on-failure`,
  `RestartSec=5` defaults in NetScript today).
- `Type=notify` + `WatchdogSec=` is the systemd-native liveness contract: the service tells systemd
  it's ready via `sd_notify(READY=1)`, and if `WatchdogSec=` is set the service must keep calling
  `sd_notify(WATCHDOG=1)` more often than that interval or systemd kills and restarts it. This is
  systemd's answer to pm2's `--wait-ready`/heartbeat and pup's health-check polling — but pushed into
  the supervisor itself rather than a userland poller.
  Source: sd_notify(3) man page —
  https://www.freedesktop.org/software/systemd/man/latest/sd_notify.html (documents the `READY=1`,
  `RELOADING=1`, `STOPPING=1`, `STATUS=...`, `ERRNO=...`, `MAINPID=...`, `WATCHDOG=1`,
  `WATCHDOG=trigger` protocol keys and the `NOTIFY_SOCKET` env var contract).
- `sd_watchdog_enabled()`/`WATCHDOG_USEC` env var tells the process how often it must ping —
  systemd sets `WATCHDOG_USEC` when `WatchdogSec=` is configured and the unit uses `Type=notify` (or
  `notify-reload`), so the app-side runtime reads that env var rather than hardcoding an interval.

### 2.2 Hardening directives (sandboxing a unit)

Standard 2026-era systemd hardening surface (all `[Service]`-section directives `systemd-analyze
security` scores against): `NoNewPrivileges=yes`, `ProtectSystem=strict|full`, `ProtectHome=yes|read-only`,
`PrivateTmp=yes`, `PrivateDevices=yes`, `ProtectKernelTunables=yes`, `ProtectKernelModules=yes`,
`ProtectControlGroups=yes`, `RestrictAddressFamilies=...`, `RestrictNamespaces=yes`,
`MemoryDenyWriteExecute=yes`, `LockPersonality=yes`, `CapabilityBoundingSet=`,
`SystemCallFilter=@system-service`. None of these appear in NetScript's `renderSystemdUnit()`
today (confirmed by full read of
`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts`) — a legitimate gap for a
"2026 state-of-the-art, not a dumb copy" bare-metal target, and a natural opt-in hardening tier for
the process-manager plugin to add as config knobs that render into these directives (the plugin's
value-add is a sane, typed default hardening profile, not reinventing sandboxing itself).

### 2.3 Resource control (cgroups v2)

`CPUQuota=` (percentage of one CPU, e.g. `CPUQuota=50%`), `CPUWeight=` (relative share),
`MemoryMax=` (hard cap, OOM-kills over), `MemoryHigh=` (soft throttle), `MemorySwapMax=`,
`IOWeight=`, `IOReadBandwidthMax=`/`IOWriteBandwidthMax=` are systemd's direct cgroups v2 exposure —
per-unit resource control with zero container runtime involved. `systemd-cgtop` gives live monitoring
per-slice. Source: https://oneuptime.com/blog/post/2026-03-04-configure-resource-limits-systemd-cgroups-rhel-9/view
(2026-03-04, cgroups v2 resource-limit walkthrough covering exactly these directives plus slice units
and `systemctl set-property` for live changes without restart). This is squarely OS-layer: the pm
plugin should expose typed config fields that render straight into these directives, not implement
its own userland CPU/memory throttling for OS-service-mode deployments.

### 2.4 Socket activation

`.socket` units let systemd own the listening socket and hand it to the service on first connection
(`Accept=no` for the common single-process case), enabling on-demand start and zero-downtime restart
(the socket stays open across a service restart because systemd — not the app — owns the fd). This
is a systemd-native alternative to pm2/pup-style "keep a process warm" and to the `deno compile`
artifact's own listener; relevant for the pm plugin's Linux tier as a documented advanced option, not
a default (most NetScript app processes hold long-lived listeners already, so socket activation is
mainly valuable for scale-to-zero or fast-restart topologies).

### 2.5 DynamicUser and portable services

`DynamicUser=yes` allocates a transient UID/GID for the unit's lifetime (no shared service account,
no manual `useradd`), pairing naturally with `ProtectSystem=strict` + `StateDirectory=`/`CacheDirectory=`/
`LogsDirectory=` (systemd creates and chowns these under the dynamic UID automatically). systemd
portable services (`portablectl attach/enable`) package a unit + its rootfs (an image or directory)
so it can be moved between hosts as a single artifact — conceptually adjacent to what `deno compile`
already gives NetScript (a single-file artifact, per slice #340), suggesting portable services are a
plausible *later* Linux packaging tier rather than a day-one requirement.

### 2.6 Quadlet (Podman + systemd)

Quadlet is Podman's systemd generator: declarative `.container`/`.pod`/`.volume`/`.network` unit
files (same INI shape as `.service` units, with a Podman-specific section like `[Container]`) that
`podman-system-generator` expands into transient systemd units at boot, so containers get full
`systemctl start/stop/status`, `Restart=`, and journald integration for free. Sources:
https://www.redhat.com/en/blog/quadlet-podman ("Make systemd better for Podman with Quadlet") and
https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html (`podman-systemd.unit(5)`
reference) and https://docs.podman.io/en/latest/markdown/podman-generate-systemd.1.html (the older
imperative `podman generate systemd` path Quadlet supersedes). Relevance: if/when NetScript's
bare-metal target needs a containerized deployment mode alongside the `deno compile` binary mode,
Quadlet is the "wrap don't reinvent" answer — emit `.container` unit files, not a custom container
supervisor.

### 2.7 User services + lingering

Systemd supports user services (`systemctl --user`, units under `~/.config/systemd/user/`) for
non-root process supervision — relevant for NetScript's non-privileged bare-metal deploys. By
default a user's services stop when their last session ends; `loginctl enable-linger <user>` keeps
the user's systemd instance (and its services) running independent of login sessions, which is the
standard way to run persistent user-mode services (including rootless Podman containers) on boot.
Source: https://oneuptime.com/blog/post/2026-03-17-use-loginctl-enable-linger-rootless-podman/view
(2026-03-17 walkthrough of `loginctl enable-linger`, `XDG_RUNTIME_DIR` pitfalls, and verifying
persistence across logout). This is directly relevant to a non-root install mode for the pm plugin
(today's `OsServicePort`/systemd adapter appears root/system-unit-oriented; a `--user` mode is an
open design question for Stage D, not yet modeled in `SystemdUnitConfig`).

## 3. Windows alternatives to Servy (comparison matrix)

| Tool | License / maintenance | Config format | Health/recovery model | Log handling | Fit for NetScript |
|---|---|---|---|---|---|
| Servy (shipped adapter) | MIT, actively maintained — https://github.com/aelassas/servy | XML per service (`<ServiceDto>`) | Native: `EnableHealthMonitoring`, heartbeat interval, max failed checks, `RecoveryAction` enum (`RestartService`/`RestartProcess`/`RestartComputer`), pre/post-launch hooks | Native size + date-based rotation fields | Already generating this exact XML (`servy-xml.ts`); richest native recovery model of the three, closest fit to NetScript's own `ServyServiceConfig` shape |
| NSSM (nssm.cc) | Public-domain-style freeware, low-activity upstream | CLI flags / registry (`nssm set <svc> <param> <value>`), no declarative file | Basic: restart-on-exit-code throttling (`AppExit`, `AppRestartDelay`), no built-in HTTP health probe | Stdout/stderr redirect to file, no built-in rotation (needs external log rotation) | Simpler, extremely widely deployed, but no declarative config artifact to check into `.deploy/` the way Servy's XML or a WinSW XML can be — weaker fit for NetScript's "generate a config file per compile target" model |
| WinSW (github.com/winsw/winsw) | Apache-2.0, actively maintained (part of Jenkins ecosystem) | Declarative XML (or YAML in newer versions), .NET-based wrapper | Restart policy (`onfailure` actions with delay), no native health-URL probe (would need a companion healthcheck extension) | Built-in log rotation (`rotate`/`roll-by-size`/`roll-by-time` handlers), redirects stdout/stderr | Config-file-first like Servy, mature and widely used for wrapping arbitrary executables as Windows services; a credible second-source/fallback adapter if Servy's upstream health ever regresses, but does not surpass Servy's native health-monitoring fields today |

Verdict for this run: no reason to replace the shipped Servy adapter. WinSW is the documented
fallback option if Servy's upstream health changes; NSSM is not a good fit because it has no
declarative config artifact, which breaks NetScript's "one generated config file per compile target,
checked into `.deploy/`" pattern used identically for both Servy XML and systemd units.

## 4. macOS: launchd basics (for parity notes only — not a shipped adapter)

launchd is macOS's single init/service-manager combining what systemd splits across
system/user instances. Property-list (`.plist`) job definitions live in `/Library/LaunchDaemons`
(system-wide, root) or `~/Library/LaunchAgents` (per-user), loaded via `launchctl load`/
`launchctl bootstrap`. Key keys: `RunAtLoad`, `KeepAlive` (bool or dict form with
`SuccessfulExit`/`Crashed`/`NetworkState` sub-keys for conditional restart), `ThrottleInterval`
(minimum seconds between restarts, launchd's `RestartSec` analogue), `StandardOutPath`/
`StandardErrorPath` for log redirection (no native rotation — same gap as NSSM, typically paired with
`newsyslog`-style external rotation), and `WatchPaths`/`StartInterval` for filesystem-triggered or
periodic activation. There is no direct launchd equivalent of `sd_notify`/`WATCHDOG=1` — the closest
analogue is `KeepAlive.SuccessfulExit=false` (restart unless process exits 0) combined with the app
itself managing readiness. Given the charter's platform scope (Windows via Servy, Linux via systemd)
macOS/launchd is parity-notes only for this run — flag as an open question for Stage E whether a
launchd adapter belongs on the bare-metal roadmap or stays out-of-scope (dev-only, not a deploy
target).

## 5. sd_notify / watchdog integration from Deno — feasibility

Answer: feasible without FFI, using Deno's native unix-datagram support.

- `Deno.listenDatagram({ path, transport: "unixpacket" })` returns a `DatagramConn` bound to a Unix
  domain socket of type `SOCK_DGRAM`. Per Deno's own network API reference
  (https://docs.deno.com/api/deno/~/Deno.listenDatagram, fetched 2026-07 for this doc): the
  `unixpacket` transport requires `--allow-read`/`--allow-write` permission (no separate `--unstable`
  flag gate as of the fetched doc state), and `conn.send(data, addr)` sends a datagram to an arbitrary
  destination `Addr` — exactly the `{ transport: "unixpacket", path: <dest> }` shape needed to target
  systemd's `NOTIFY_SOCKET`.
- The sd_notify protocol itself (per
  https://www.freedesktop.org/software/systemd/man/latest/sd_notify.html) is transport-trivial: read
  `NOTIFY_SOCKET` from the environment (path, optionally `@`-prefixed for Linux abstract-namespace
  sockets — note: Deno's `unixpacket` path-based API as documented does not obviously cover the
  abstract-namespace `@` form, which is an open feasibility question to close in the design pack, not
  this survey), then send a newline-separated `KEY=VALUE` payload such as `READY=1` or `WATCHDOG=1`.
  No response is read back — it is fire-and-forget.
- Reference prior art for exactly this pattern without libsystemd: Python's `sdnotify`/`cysystemd`
  packages and Go's `github.com/coreos/go-systemd/daemon` package both implement sd_notify as "open
  an ephemeral local unix dgram socket, send to the `NOTIFY_SOCKET` path" — no socket needs to be
  bound to a fixed local path first in the C reference client (an unnamed local address is fine for a
  send-only use), but Deno's `listenDatagram` API requires binding to a `path` to construct a
  `DatagramConn` at all, so a NetScript sd_notify helper would bind to a short-lived temp path (e.g.
  under `$TMPDIR`, deleted after use) purely to satisfy the API shape, not because sd_notify itself
  needs a bound local socket.
- Prior Deno unix-socket history worth noting for the design pack: unix-socket support was originally
  requested/tracked at https://github.com/denoland/deno/issues/4115 ("Support for unix sockets" —
  stream-mode unix sockets, closed via PR #4176) and bidirectional-communication nuances were
  discussed at https://github.com/denoland/deno/discussions/15363; `unixpacket` (datagram-mode, what
  sd_notify needs) is the API surface documented at docs.deno.com/api/deno/network/ and is distinct
  from the stream-mode `unix` transport used for e.g. HTTP-over-unix-socket serving.
- Net feasibility verdict: a small `@netscript/plugin-process-manager`-owned helper (`notifyReady()`,
  `notifyWatchdog()`, reading `WATCHDOG_USEC` to size an internal interval timer) is buildable on
  stock Deno APIs with no native bindings, no `--unstable-*` flag, and no external binary — this
  belongs in the plugin's Linux-tier runtime glue, wired into `Type=notify` + `WatchdogSec=` units the
  systemd adapter emits, closing the gap noted in §2.1/§2.2.

## 6. The wrap-don't-reinvent boundary

Explicit division of responsibility for the process-manager plugin's design pack (Stage D):

OS layer (servy / systemd / launchd) owns:
- Process start/stop/restart mechanics and exit-code-driven restart policy
  (`Restart=`/`RecoveryAction`/`KeepAlive`).
- Liveness/watchdog enforcement once the app opts in (`WatchdogSec=` + `sd_notify`, Servy's heartbeat
  fields, launchd's `ThrottleInterval`).
- Privilege/sandbox enforcement (hardening directives, `DynamicUser=`, Servy's run-as-user).
- Resource ceilings (`CPUQuota=`/`MemoryMax=` via cgroups v2 — there is no Windows-Servy equivalent
  today, a real platform-parity gap to record, not solve, at this research stage).
- Boot-time activation, socket ownership (socket activation), and OS-level log capture (journald,
  Servy's file rotation, launchd's stdout redirect).

NetScript process-manager layer owns:
- Multi-process topology: NetScript apps can have more than one logical process per deployment
  (e.g. web + worker + scheduler) where `OsServicePort` today models one service per compile target —
  the pm plugin's core package is where "N app processes, 1 deployment unit" orchestration lives.
- Application-level health semantics: what "ready" and "healthy" mean for a NetScript app (HTTP
  health endpoint contract, OTEL-derived liveness, oRPC readiness) — the OS layer only ever sees a
  binary ready/not-ready or a periodic ping; translating app semantics into that ping is pm-plugin
  code (e.g. the `notifyReady()`/`notifyWatchdog()` helper from §5), never systemd/Servy's job.
- Admin UI and CLI surfaces (the run's two delivery surfaces, A and B): visualizing/aggregating
  state across all managed processes, cross-platform, is inherently outside any single OS service
  manager's scope — pm2/pup's dashboard-and-CLI value-add, reimagined with NetScript's own OTEL/API
  stack per the charter.
- Cross-platform config generation: emitting the right OS-native artifact (Servy XML vs. systemd
  unit vs., later, a launchd plist) from one NetScript-native process/topology definition — this is
  exactly what `writeServyConfigs`/`renderSystemdUnit` already do per-target; the pm plugin's job is
  to be the single upstream source of truth those renderers consume, extended with hardening/
  resource-control/watchdog knobs identified in §2.
- Dev-mode fallback (`--no-aspire`, charter's nice-to-have #4): in dev, none of Servy/systemd is
  present or desired — the pm plugin's core process-supervision logic (spawn, restart-on-crash,
  readiness polling) must also run standalone in userland Deno, which is the one place the plugin
  does reimplement OS-supervisor-like logic, by design, because there is no OS service manager to
  wrap in a local dev loop.

## 7. Relevance to the NetScript process-manager plugin

1. Do not replace the shipped `OsServicePort`/Servy/systemd adapters — extend them. The comparison
   in §3 confirms Servy remains the right Windows choice; WinSW is a credible fallback, NSSM is not
   a good fit given NetScript's declarative-config-per-target pattern.
2. Close the systemd hardening/watchdog gap (§2.1-2.3) as new typed fields on
   `SystemdUnitConfig`/`renderSystemdUnit()`, with sane opt-in defaults — this is the single biggest
   "2026 state of the art, not a dumb pm2 copy" differentiator available on the Linux tier, and it
   reuses the exact renderer already shipped rather than adding a parallel one.
3. `sd_notify`/watchdog is buildable in pure Deno (§5) — plan a small runtime helper in the plugin's
   Linux adapter package, gated behind `Type=notify` + `WatchdogSec=` unit generation, and surfaced
   to app code as the pm plugin's own readiness/heartbeat API (so app authors call one NetScript API
   regardless of whether they're under systemd, Servy, or the dev-mode fallback).
4. Servy's health-monitoring/recovery fields are the Windows-side ceiling — there is no Windows
   watchdog-socket equivalent, so Windows health semantics stay coarser (heartbeat interval + max
   failed checks + recovery action) than Linux's watchdog-ping model; document this as a known,
   deliberate cross-platform capability asymmetry rather than a gap to paper over.
5. Quadlet (§2.6) and portable services (§2.5) are plausible later Linux packaging tiers, not
   day-one scope — flag for Stage C/E as a possible "container-mode bare metal" follow-on once the
   process-based tier ships.
6. launchd (§4) is parity-notes only — no shipped macOS adapter exists today; Stage E should
   explicitly decide in/out of scope rather than let it default in by omission.
7. User-mode (`systemctl --user` + `loginctl enable-linger`, §2.7) is an open design question:
   today's systemd adapter reads as system-unit/root-oriented; a non-root install mode is real
   demand (rootless deploys) but not yet modeled anywhere in `SystemdUnitConfig`.
