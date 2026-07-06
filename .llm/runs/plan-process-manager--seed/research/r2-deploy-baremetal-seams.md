# R2 — Deploy/bare-metal seam teardown (reuse map for the process-manager plugin)

Worktree cited throughout: `C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager`
(paths below are repo-relative to that root unless stated otherwise).

## 1. Executive summary

The shipped bare-metal deploy lane (#337-#341, closed pre-beta.5 per
`.llm/runs/plan-process-manager--seed/context/adjacent-issues.jsonl`) is **materially richer than
the prior research spec (`context/prior-deployment-architecture-spec.md`) assumed**: it already has
an OS-agnostic `OsServicePort` (Windows/servy + Linux/systemd), a canonical 7/8-op
`DeployTargetPort` contract, and four pure, target-agnostic **deploy-core conventions** — rollback +
release retention, health-gated activation, secrets reconcile, and OTEL env derivation — all living
under `packages/cli/src/kernel/domain/deploy/`. This is the single best reuse surface for a
process-manager plugin-core: it is already hexagonal, already pure/testable, and already covers
half of what pup/pm2 do (health-gated cutover, rollback, restart policy via OS delegation, secrets).

But three hard gaps separate today's lane from a real process manager, and none is close to
closing:

1. **No supervision daemon.** Every "restart on crash" behavior is delegated **entirely to the OS
   service manager** — systemd's `Restart=on-failure`/`RestartSec=` directive
   (`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:50,86-87,127-129`) or servy's own
   `MaxFailedChecks`/`MaxRestartAttempts` XML fields
   (`packages/cli/src/kernel/adapters/windows/servy/servy-xml.ts:93,95`,
   `packages/cli/src/kernel/domain/deploy/servy-config.ts:62,66`). NetScript owns **zero** lines of
   process-supervision logic; it renders unit files and shells `systemctl`/`servy-cli`. There is no
   NetScript-side long-running daemon, no PID table, no crash-loop backoff policy engine, no
   fork/cluster mode. Building the pup/pm2 concept means building this from scratch — the existing
   lane gives you the "install as an OS service" leaf, not the "supervise N app processes" trunk.
2. **The generalized bare-metal target is registered but CLI-unreachable.** The domain registry
   (`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:78-79`) registers
   `windows-service` -> `WindowsServiceDeployTarget` and `linux-service` -> `LinuxServiceDeployTarget`
   (both extending the fully-wired `ServiceDeployTarget` base with rollback/secrets/health-gate — see
   §3), but `packages/cli/src/public/features/deploy/deploy-group.ts:78-85` only mounts
   `createTargetDeployCommand` for `docker | compose | kubernetes | azure-aca | azure-app-service |
   azure-aks | cloud-run` — **never** `windows-service`/`linux-service`. Those two Archetype-7-wired
   targets exist, are unit-tested, and are dead from the CLI's perspective. Meanwhile the **legacy
   flat verbs** (`deploy start|stop|status|logs|copy|upgrade`) are the only reachable bare-metal path
   today and are **hard Windows-only** (`WindowsRequiredError` in every one of
   `packages/cli/src/public/features/deploy/{start,stop,status,logs,copy,upgrade}/*.ts`), bypassing
   the `OsServicePort`/`DeployTargetPort` abstractions entirely and calling servy directly. Only
   `deploy install`/`deploy uninstall` are OS-generic today
   (`packages/cli/src/public/features/deploy/install/install-service-deploy.ts:39-45` uses
   `detectServiceOs()` + the injected `OsServicePort`). **Net effect: Linux bare-metal is not
   reachable through any shipped CLI command today**, despite `SystemdOsServiceAdapter` existing and
   passing tests (`packages/cli/src/public/adapters/systemd-os-service_test.ts`,
   `packages/cli/src/public/adapters/os-service-factory_test.ts:24-26`). This is a drift candidate
   against the charter's "shipped bare-metal deploy lane" framing — the lane is shipped for Windows,
   half-wired for Linux at the domain layer, and unreachable for Linux at the CLI layer.
3. **No multi-process runtime model beyond a static build-time manifest.** `services.json`
   (`packages/cli/src/kernel/domain/service-manifest.ts:23-41`, written by
   `packages/cli/src/kernel/adapters/deploy/commands/manifest-command.ts`) enumerates N named
   services (`service | plugin | worker | app` — `ManifestServiceEntry.type`,
   `packages/cli/src/kernel/domain/service-manifest.ts:16`), each of which becomes its **own** OS
   service unit, installed/started/stopped independently
   (`packages/cli/src/public/features/deploy/install/install-service-deploy.ts:90-98` loops
   `serviceNames` and installs one at a time). This is the closest existing analogue to a pup/pm2
   "ecosystem file" (N named processes, each independently controllable) — but it is generated once
   at `deploy build` time from the compiled workspace and never mutated at runtime; there is no
   `pm2 start <script> --name foo` equivalent that registers a new managed process without a full
   rebuild, no live process list with PIDs/CPU/mem (status shells `servy-cli status` per name and
   string-matches the output — `packages/cli/src/public/features/deploy/status/status-deploy-command.ts:104-128`),
   and no dynamic scale/fork count per process.

## 2. Shipped seam inventory (file map)

| Concern | File(s) | Reuse verdict |
| --- | --- | --- |
| OS-agnostic service lifecycle port | `packages/cli/src/public/ports/os-service-port.ts` | **LIFT AS-IS.** 5-op (`install/start/stop/status/uninstall`) interface; clean, minimal, already the right shape for "OS unit lifecycle." |
| Windows adapter (servy-cli.exe) | `packages/cli/src/public/adapters/servy-os-service.ts` + `packages/cli/src/kernel/adapters/deploy/commands/servy-command.ts` + `packages/cli/src/kernel/adapters/windows/servy/*` | **LIFT AS-IS** for the "install this binary as a Windows service" leaf. |
| Linux adapter (systemctl) | `packages/cli/src/public/adapters/systemd-os-service.ts` + `packages/cli/src/kernel/adapters/linux/systemd/*` | **LIFT AS-IS** for the same leaf on Linux. `renderSystemdUnit` (`systemd-unit.ts:83-140`) is a clean pure unit-file renderer. |
| Canonical 8-op deploy contract | `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` | **ADAPT.** `plan/emit/up/down/status/logs/rollback/secrets` is a good shape for a deploy *target*, but a process manager needs finer verbs per managed process (`start <name>`, `restart <name>`, `scale <name>=N`) that don't map 1:1 onto this per-target contract. Reuse the *pattern* (optional-method descriptor, `operations` self-advertisement — `service-deploy-target.ts:93-98`), not the literal type. |
| Rollback + release retention (pure) | `packages/cli/src/kernel/domain/deploy/rollback-convention.ts` | **LIFT AS-IS** into plugin-core if the process manager does atomic binary-swap deploys (it should — this is exactly pup/pm2's "reload with zero downtime" need, generalized). `retainReleases`/`selectRollbackTarget` are pure and target-agnostic. |
| Health-gated activation (pure) | `packages/cli/src/kernel/domain/deploy/health-gate.ts`, `activation-convention.ts` | **LIFT AS-IS.** `runHealthGate` + `activateWithHealthGate` (`activation-convention.ts:81-126`) is a complete "probe before cutover, auto-rollback on failure" orchestrator with injected `ActivationPort`/`HealthProbePort`/`SleepFn` — ports, not concretions. Directly reusable for a process manager's own zero-downtime restart. |
| Secrets reconcile (pure) | `packages/cli/src/kernel/domain/deploy/secrets-convention.ts` | **LIFT AS-IS.** `renderSecretsEnvFile`/`reconcileSecrets` (0600 env-file convention) is orthogonal to process supervision and directly useful for per-managed-process env/secret injection. |
| OTEL env derivation (pure) | `packages/cli/src/kernel/domain/deploy/observability-convention.ts` | **LIFT AS-IS.** `observabilityEnv()` derives `OTEL_DENO`/`OTEL_SERVICE_NAME`/etc.; a process manager should inject the same map per managed process for observability parity with the cloud/container targets. |
| Deploy target registry | `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` | **STUDY THE PATTERN, DO NOT COUPLE.** Confirms `windows-service`/`linux-service` are reserved `KnownDeployTargetKey`s (`packages/cli/src/kernel/domain/deploy/deploy-target-registry-port.ts:10-19`) but unreachable (§1.2). A process-manager plugin should not depend on this registry being wired to a CLI verb; if it wants "bare-metal as a deploy target," it likely needs to **either** finish wiring `windows-service`/`linux-service` into `deploy-group.ts` itself, **or** register a *new* target key (e.g. `process-manager`) that supersedes the two dead entries — see §4 supersession list. |
| `deploy.targets.*` config contract (#337) | `packages/config/src/domain/schemas/deploy-schema.ts` | **EXTEND, DO NOT DUPLICATE.** Already shipped exactly as the charter describes: `deployTargetBaseShape` (`deploy-schema.ts:21-150`) carries `mode: compile\|script`, `activation{retain,strategy,healthGate}` (:111-129), `secrets{envFile,mode}` (:132-139), `otel{...}` (:142-149), and per-target member schemas for `windows`/`linux`/`docker`/`compose`/`deno-deploy`/`kubernetes`/`azure-*`/`cloud-run` (:163-279), composed into `DeployConfigSchema.targets` (:288-316). A process-manager plugin's own config should compose this base shape (contract-first, Operating Rule 2) rather than re-declare `activation`/`secrets`/`otel` blocks. |
| Static process manifest | `packages/cli/src/kernel/domain/service-manifest.ts`, `.../commands/manifest-command.ts` | **ADAPT.** `ServiceManifest.services: Record<string, ManifestServiceEntry>` is the closest existing "list of named processes" — but it's build-time-generated, not a live/mutable registry (§1.3). |
| `deno compile` artifact pipeline (#340) | `packages/cli/src/kernel/domain/deploy/compile-target.ts`, `packages/cli/src/public/features/deploy/build/*` | **LIFT AS-IS.** `CompileTarget`/`CompileResult`/`BuildResult` (`compile-target.ts:9-76`) already models "compile N named targets (service/plugin/worker/app) to standalone binaries" — exactly the artifact a process manager would supervise. |
| Deno Deploy unstable-API guard | `packages/cli/src/kernel/domain/deploy/unstable-api-guard.ts` | Cloud-target-specific (Deno Deploy rejects `--unstable-*`); **not directly relevant** to bare-metal process supervision, but the pure-scan pattern (inject already-read sources, no `Deno.*` I/O) is a good template for any preflight guard the process-manager core needs. |
| Aspire-driven cloud adapters | `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts`, `aspire-cloud-deploy-target.ts` | **OUT OF SCOPE** for bare-metal reuse — these wrap `aspire publish`/`aspire deploy`, a different drive path than the OS-service lane. Noted only for completeness; not read in depth for this topic. |
| Deploy doctrine archetype | *(searched, not found)* `docs/architecture/doctrine/*deploy*` — zero matches; only generic archetype doc exists. | **GAP / DRIFT CANDIDATE.** `context/prior-decision-gap-tracker.md` claims a "doctrine: deployment target-adapter archetype" stub was opened alongside the taxonomy labels — it is **not present** in this worktree. Either the doctrine entry never landed, or it landed under a name this scan missed. The process-manager epic should not assume a deploy-target archetype doc exists to extend; verify at Stage E before citing it as a dependency. |

## 3. The `ServiceDeployTarget` base — the most-reusable class in the lane

`packages/cli/src/kernel/domain/deploy/service-deploy-target.ts` is an abstract base shared by
`WindowsServiceDeployTarget` and `LinuxServiceDeployTarget` (both trivial one-liner subclasses —
`windows-service-deploy-target.ts:9-12`, `linux-service-deploy-target.ts:12-15`). Its design is
directly instructive for a process-manager plugin-core's own base class:

- Constructed with **no ports** it is a bare 6-op descriptor (`plan/emit/up/down/status/logs`,
  `SERVICE_DEPLOY_OPERATIONS` at `service-deploy-target.ts:22-29`) whose handlers just echo a
  message (`#result()` at :195-204) — useful as a registry placeholder/test double.
- Constructed **with** `ServiceDeployTargetPorts` (`activation`, `secretsStore`, `health`, `sleep`,
  `resolveActivation`, `resolveSecrets` — :41-58) the *same class* becomes a fully wired adapter:
  `operations` grows to include `rollback`/`secrets` **only when the corresponding port is present**
  (:93-98, comment calls this "LD-4: omit rather than silent no-op" — i.e. never advertise an op the
  instance can't actually perform). `up()` runs `activateWithHealthGate` when `activation`+`health`+
  `resolveActivation` are all wired (:116-131); otherwise it falls back to the bare descriptor.
- This "optional-ports promote a bare descriptor to a wired adapter, `operations` self-reports
  capability" pattern is exactly the shape a process-manager core needs for **per-managed-process**
  capability negotiation (e.g. a process gets `restart`/`scale` only when its runtime binding
  supports it) — worth carrying forward as a design precedent even though the literal
  `DeployTargetPort`/`ServiceDeployTargetPorts` types are deploy-shaped, not process-shaped.

## 4. Open-issue overlap (supersession candidates)

From `context/adjacent-issues.jsonl` (fetched at run-start snapshot, milestone `0.0.1-beta.5` /
`0.0.1-beta.8` as recorded there):

- **#345 `[Deploy-S9] Bare-metal enterprise hardening (stable): HA + secret store + signing`** —
  scope is "multi-instance / HA activation, external secret-store adapter (Vault/KMS), automated
  code signing." **Direct overlap**: a process-manager plugin's core job *is* multi-instance/HA
  process supervision; #345's "multi-instance rollout + HA activation strategy" acceptance criterion
  is arguably subsumed by (or should be redirected to depend on) the process-manager plugin rather
  than solved a second time inside the deploy lane. Flag as a supersession candidate at Stage E —
  the epic RFC should either fold #345's HA scope into the process-manager plugin or explicitly
  scope them apart (deploy-lane HA = target-level, e.g. two servers behind a VIP; process-manager
  HA = per-host multi-instance/fork of one app).
- **#346 `[Deploy-S10] Aspire Kubernetes + Azure + Docker-image providers`** — no overlap (cloud/
  container lane, not bare-metal OS-service). Listed for completeness only.
- **#348 `[Deploy-S12] One-click convergence + release-skill integration`** — scope is `netscript
  deploy <target> init|up` idempotent convergence, folded into the release skill. A process-manager
  admin console (surface A, per the charter) and CLI (surface B) both want an equivalent "init once,
  converge repeatedly" UX; #348's convergence primitive (if/when built) is a candidate dependency
  rather than something the process-manager plugin should re-invent. Depends on S5/S6/S7 (#341/#342/
  #343) per its own issue body, all closed.
- **#349/#350 (WATCH)** — RFC-14 unified-mode and Pulumi IaC. No overlap; both are serverless/IaC,
  orthogonal to bare-metal process supervision.
- **Desktop epic #451-#458** (`0.0.1-beta.8`, part of #327) — **relevant to charter surface A** (the
  Deno Desktop admin console). #451 (in-process link-mode adapter) and #454 (true single-process
  mode) define exactly the transport seam a packaged process-manager desktop console would want, so
  its own service client can talk to the local process-manager core without a loopback HTTP hop.
  #453 (tursodb single-writer relocation) is relevant if the process-manager plugin persists
  managed-process state (PID table, restart counters, logs index) in the same per-user tursodb the
  desktop epic relocates — worth a design-time check of whether process-manager state should live in
  that same single-writer store rather than a separate SQLite/file store. #456 (1-click packaging +
  release/update server) is the `deno desktop` cross-compile + auto-update pattern the charter
  implicitly flags as a reference for the bare-metal update/rollback shape; the process-manager
  plugin's own binary-update story (if it self-updates) could mirror #456's approach rather than
  reinvent it. None of E1/E2/E3/E4/E6 are **blocking** dependencies (they ship independently at
  beta.8), but a process-manager plugin targeting the Deno Desktop surface should sequence *after*
  at least #451 (in-process link mode) lands.
- **Epic #327 itself** — the process-manager plugin's final placement is explicitly "the bare-metal
  option of #327" per the charter; #327 is the umbrella all of the above hang off.

## 5. What "shipped bare-metal deploy lane" concretely gives a process-manager plugin

Reusable **as infrastructure**, not as the process-manager's own supervision logic:

1. `OsServicePort` + both adapters — the "install/start/stop/status/uninstall one OS-managed unit"
   primitive. A process-manager core can use this to register *itself* (a daemon, if it decides to
   run one) as a boot-time OS service, or to keep the "thin, no-daemon, defer restart to
   systemd/servy" architecture and simply *generate more units* — one per named managed process,
   exactly like `services.json` does today (§1.3) — rather than building a custom supervisor.
   **This is the single biggest open design fork the synthesis stage must resolve**: does the
   NetScript process manager run its own always-on supervisor daemon (the pup/pm2 model — a control
   process that owns fork/restart/backoff/logs for N children), or does it stay "thin" and simply
   template N systemd units/servy services with `Restart=`/`MaxRestartAttempts` policies and add a
   CLI/desktop **read+control** layer over `systemctl`/`servy-cli` (the current lane's model,
   scaled)? The former is what pup/pm2 actually are; the latter is what the shipped lane already
   is. The charter's "leverage 2026 state-of-the-art + NetScript standards" language does not resolve
   this — it is a genuine open decision for Stage C/D.
2. Rollback + health-gate + secrets + OTEL conventions — all four are already **process-agnostic
   pure functions with injected ports**, so whichever fork is chosen in (1), these four modules
   compose without modification: a "candidate process" release is just another `ReleaseRecord`; a
   liveness probe is just another `HealthProbePort`; per-process secrets are just another
   `SecretsBundle`.
3. `deno compile` artifact modeling (`CompileTarget`/`CompileResult`) — the shape of "N named,
   typed (service/plugin/worker/app) compiled targets" is the right level of abstraction for "N
   managed processes," and should be extended rather than re-modeled.
4. The `deploy.targets.*` config contract and its shared base shape — a process-manager target
   (if it becomes `deploy.targets['process-manager']` or supersedes `windows-service`/
   `linux-service`) should compose `deployTargetBaseShape` for `activation`/`secrets`/`otel`, adding
   only process-manager-specific fields (per-process restart policy, fork/instance count, log
   rotation target) the way `LinuxDeployTargetSchema`/`WindowsDeployTargetSchema` add their
   service-manager-specific fields today (`deploy-schema.ts:163-220`).

Not reusable — must be built fresh in a plugin-core:

- Any live process registry (add/remove/list a managed process without a full `deploy build`).
- Any daemon/control-process logic, PID tracking, crash-loop backoff **owned by NetScript** (today
  100% delegated to systemd/servy).
- Any fork/cluster mode (pm2's `-i max` equivalent) — not present anywhere in the scanned surface.
- Any live log streaming/tailing across multiple processes in one view (today's `logs` verb is
  Windows-only and single-service; see `packages/cli/src/public/features/deploy/logs/logs-deploy-command.ts:37-38`).
- The admin-console UI itself (charter surface A) — no existing UI reads `OsServicePort`/
  `DeployTargetPort` state; the desktop epic (#451-458) provides the transport seam, not the UI.

## 6. Open questions for Stage C/D

- Does the process-manager plugin **finish wiring** `windows-service`/`linux-service` into
  `deploy-group.ts` (closing the drift in §1.2), or does it **supersede** those two registry entries
  with its own richer target key, leaving the deploy-lane's bare 6-op descriptors as dead weight to
  prune? This must be decided before filing sub-issues, since it changes whether #339-family issues
  need a follow-up "wire the CLI verb" slice.
- Should `#345` (bare-metal HA + secret store + signing, stable) be re-scoped as a **dependency of**
  the process-manager plugin instead of a parallel deploy-lane hardening slice? (See §4.)
- Where does per-process state (PID table, restart counters, last-N-logs index) live: a new
  plugin-core-owned store, or the desktop epic's relocated per-user tursodb (#453)? This affects
  whether the process-manager epic has a hard dependency on `0.0.1-beta.8` desktop slices or can ship
  its CLI/core independently at an earlier milestone and add desktop-console wiring later.
- Is "restart policy" for the pup/pm2 concept meant to **replace** OS-native supervision (a real
  NetScript daemon, portable to non-systemd Linux/Windows-without-servy contexts) or to **remain a
  templating layer over** systemd/servy (thin, but then not really "the pup/pm2 concept ... done
  right," since pup/pm2's whole value proposition is *not* depending on the OS's own service
  manager)? This is the single highest-leverage open question for the epic's positioning and should
  be raised explicitly at synthesis.

## 7. Arch-debt trail corroborating the chronology

`.llm/harness/debt/arch-debt.md:1337-1359` (`cli-deploy-artifacts-missing`) independently
corroborates the shipped-order narrative used above: opened 2026-06-22 noting no deploy command
existed; updated 2026-07-03 for #339/#340 (bare-metal `deno compile` + `OsServicePort` land);
updated 2026-07-03 again for #342 (Deno Deploy target lands, `rollback`/`secrets` still
declared-unsupported pending #341); updated 2026-07-04 for #341/PR #374 (rollback/health-gate/
secrets/OTEL convention seam lands, `ServiceDeployTarget` starts advertising `rollback`/`secrets`).
This is independent, dated confirmation of the §1/§2 findings above and should be cited alongside
the issue numbers in the epic RFC's "prior art" section.
