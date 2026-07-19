# Research — RFC: single deployment (issue #820)

Run `rfc-single-deployment--orchestrator` · generator Fable 5 · high · session
`7f1fada7-805f-46cb-8ac4-5eb201bdc105` · 2026-07-17

Sources: eis-chat POC @ `aeaf2df` (PR rickylabs/eis-chat#150 merge) fetched via public GitHub API
into `corpus/` (local clone was sandbox-blocked — see drift.md); netscript board issues fetched
same way (`corpus/md/*.md` digests, `corpus/files/*` raw POC files); netscript repo state read
directly from this checkout @ `f391190f`, re-baselined against `origin/main` @ `47cc2fa9` (§0).

---

## Part 0 — Re-baseline vs `origin/main` @ `47cc2fa9` (added after cycle-1 FAIL_PLAN)

The original pass baselined at `f391190f` (`feat/beta10-cli-integration`); `origin/main` is 12
commits ahead (`git log f391190f..origin/main`). Re-derived findings:

- **beta.10 is cut and on main** (`a5adb706` + the `4d438ce1` wave): the next open milestone is
  beta.11 — the plan's milestone-train assumption holds.
- **VITE discovery naming is an existing framework surface and changed in beta.10.**
  `packages/aspire/src/application/build-vite-env-var-name.ts` (touched by `4d438ce1`) now
  normalizes invalid identifier characters in the FULL form —
  `buildViteEnvVarName('workers-api')` → `VITE_services__workers_api__http__0` — instead of
  preserving hyphens; the `VITE_<NAME>_URL` shorthand is unchanged. This **supersedes** the
  POC-era statement in §1.2 that hyphenated names have no valid full-form define: the framework
  now owns that normalization; the POC's hand map predates it. Consequence: the packaged-mode
  dual-injection derives from `buildViteEnvVarName` + the generator model — a manifest compiler
  consumes existing surfaces, it invents no naming.
- **Aspire helper generators churned in beta.10** (`packages/cli/src/kernel/templates/aspire/
  helpers/register/generate-register-{apps,background,plugins,services,tools}.ts` +
  `_aspire-compat.ts.template`): maintenance — `--minimum-dependency-age=0` removed from task
  exec lines (#813/#817 lineage), `withBrowserLogs()` removed, compat widening. Confirms the
  helpers-are-generated-from-the-model premise. Additionally, `generate-register-apps.ts` already
  ships **`buildTauriBlock`** — a task-backed native-window registration precedent in-tree; a
  desktop app type (#452) extends an existing generator pattern rather than introducing one.
- **Release engineering moved**: canary channel + composed publish readiness (`47cc2fa9`, #812) —
  cite as the current release surface for any release-server design; no §C design impact.
- **Deploy spine unchanged on main**: `git diff --stat f391190f..origin/main` over
  `packages/cli/src/public/{adapters,ports,features/deploy}` is empty — §2.2's shipped-surface
  claims (deploy verbs, `OsServicePort`, `service-activation-port.ts`, rollback convention)
  re-verified against main. Caveat carried into the plan: the Windows `DirSwapActivationPort`
  strategy is explicitly **remove-then-recreate, non-atomic** (`service-activation-port.ts:16-20`)
  — any update design must treat the pointer swap as crash-interruptible, not atomic.
- **Current deployment/runtime debt** (`debt/arch-debt.md`) — the load-bearing open entries and
  what each means for this RFC:
  - `DEPLOY-ARCHETYPE-7-CORE-SEED` (open, DEBT_ACCEPTED): the deploy **conventions are already
    centralized** in `packages/cli/src/kernel/domain/deploy/` (`secrets-convention.ts`,
    `rollback-convention.ts`, `health-gate.ts`, `activation-convention.ts`,
    `observability-convention.ts`) as pure target-agnostic modules; the standalone deploy-core
    package does not exist yet; `F-DEPLOY-1/2` remain `reviewed` pending it. The entry's
    **verb-vocabulary lock** records the canonical `DeployTargetPort` mapping (`build→plan/emit`,
    `install→up`, `uninstall→down`) and the rule **"never entrench a parallel surface — expand the
    canonical contract."** Implication: (a) new manifest schemas belong beside those kernel
    conventions in beta.11 and move with them at PM-20; (b) an installer capability must extend
    `DeployTargetPort`/`OsServicePort`, not add a rival port axis.
  - `DEPLOY-BAREMETAL-PUBLIC-WIRING` (open, DEBT_ACCEPTED): the 7-op `ServiceDeployTarget` is
    proven only with injected fake ports; registry-seeded descriptors ship port-less (6-op at
    runtime); the production composition root is missing. PM-18 (#529) is the slice that wires it.
    Implication: per-machine desktop installs (which register OS units) depend on PM-18's wiring —
    an explicit SD dependency edge.
  - `cli-deploy-linux-integration-untested` (open, DEBT_ACCEPTED): the Linux systemd lane has
    never run against a live `systemctl` (Windows-only implementation host). Implication: the
    SD/e2e gates must include a real-systemd harness or Linux CI job, and any beta.11 update-e2e
    claim on Linux inherits this hole until it closes.
  - `runtime-app-wide-shutdown-orchestrator` (open, DEBT_ACCEPTED): no single `host.shutdown()`
    drains all app resources under one budget. Implication: graph-level ordered stop (PM-8 + the
    update transaction's `stopping` phase) can stop *processes* in order, but in-process drain
    quality depends on this debt; the update design must budget per-process stop timeouts rather
    than assume clean drains.
  - `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` (open): plugin install is add-only; uninstall semantics
    were deliberately deferred. Precedent: uninstall/repair is designed scope, never implied.

---

## Part 1 — POC forensics: what the singleton deployment actually does

The POC ("Prototype full-stack Windows singleton desktop deployment", eis-chat#150, merged
2026-07-16) wraps a Deno Desktop window around an adjacent supervised service graph — Garnet + six
compiled Deno processes + optional Aspire standalone dashboard — shipped as one xcopy-able
timestamped directory with two `.cmd` launchers. No Docker, no .NET runtime, no system Aspire on
the end-user machine.

### 1.1 Supervision (`corpus/files/apps__dashboard__lib__windows-singleton.ts`, 389 lines)

- **Activation:** desktop-runtime detection (`Deno.BrowserWindow !== undefined`) +
  `EISCHAT_WINDOWS_SINGLETON=1` (lines 104–107, 208–209). Same `main.ts` runs as plain web server
  under Aspire/browser; the singleton path is env-gated.
- **Reuse-if-running:** probes `eischat` + `streams`; if both respond, returns without spawning
  (line 213). This is the whole "singleton" mechanism — a port probe. A **partial** stack (2 alive,
  4 dead) is treated as "already running": nothing repairs it.
- **Sequential spawn with readiness gates:** per-sidecar `ready` mode — `http` (any response from
  `/health`, then plain fetch), `tcp` (hardcoded Garnet `6379`), `process` (still-alive-after-1s);
  120 s deadline each (lines 154–175). Startup failure ⇒ reverse-order `SIGKILL` + throw
  (367–377).
- **Teardown:** `stop()` = reverse-order `SIGTERM`, wired to the `unload` event (379–387). Graceful
  paths only — a hard kill of the window **orphans all sidecars** (no Windows Job Objects; PR #150
  status table lists "Crash restart / Windows Job Objects — Follow-up").
- **Supervision is launch-only.** There is no restart policy, no post-start monitoring loop, no
  health re-check, and no propagation of sidecar state to the UI. A sidecar that dies after startup
  leaves the app silently broken; the only recovery is re-launching the app (charter finding 1 —
  confirmed in code: nothing observes `child.status` after `waitUntilReady`).
- **Env hygiene (hard-won):** children spawn with `clearEnv: true`; the supervisor strips inherited
  `DENO_*` (incl. desktop-only `DENO_SERVE_ADDRESS`) and `NODE_CHANNEL_FD` (228–232). Requires
  Deno ≥ 2.9.3 for the Windows GUI child-process fix (denoland/deno#35994; DESKTOP-SHELL.md
  constraint list). This is a whole packaging-hazard class: desktop-runtime process state poisons
  sidecars.
- **Readiness authority weakness:** any `/health` response counts as ready because NetScript's
  aggregate health includes an unused MySQL adapter for this SQLite-only app, so response *status*
  cannot be trusted (PR #150 "Runtime/upstream findings"; DESKTOP-SHELL.md constraints). Upstream
  framework bug — no netscript issue found for it in the corpus searches.
- **Logs:** per-resource `<name>.stdout.log`/`.stderr.log`, **truncated at each start, no
  rotation** (191–202); `desktop-supervisor.log` records a non-secret env/permissions/resource
  audit (345–365) — the supervisor is the resource authority (Aspire standalone mode has no
  resource graph).

### 1.2 Discovery (`windows-singleton.ts` 3–79; `build.ts` 63–94; DESKTOP-SHELL.md)

- **One constant map** (`WINDOWS_SINGLETON_SERVICE_URLS`, fixed loopback ports 3001/4437/8091/
  8095/8096, Garnet 6379, Aspire 18888/4317/4318) generates BOTH the runtime
  `services__<name>__http__0` env contract (the same one Aspire injects in dev) and the build-time
  `VITE_services__…`/`VITE_<NAME>_URL` defines.
- **Build-time injection is mandatory** for browser code: `import.meta.env` cannot be repaired at
  launch — runtime env alone gives working server-side RPC but broken browser clients.
- **Hyphenated service names** cannot be dotted Vite define expressions ⇒ the POC used the SDK's
  `VITE_<NAME>_URL` fallback for those. *(Superseded on current main — beta.10's
  `buildViteEnvVarName` normalizes the full form's invalid characters; see Part 0.)*
- **Double-build gotcha:** `deno desktop` detects Fresh and re-runs the production build during
  bundling; the discovery env must be present for that second build too, "otherwise it silently
  replaces the correctly built client" (build.ts 77–83).
- **Ports are hand-assigned constants.** Collision with anything else on the machine = startup
  failure at the readiness deadline. No dynamic allocation, no conflict detection, no diagnostics.
- **The map duplicates the Aspire model.** `aspire/.helpers/register-*.mts` declares the same graph
  for dev; the singleton script re-declares it by hand. Two sources of truth that must not drift —
  the exact class of problem NetScript's generator exists to solve.

### 1.3 Telemetry (`windows-singleton.ts` 19–47; `build.ts`; DESKTOP-SHELL.md)

- **OTEL enablement must be present at BOTH compile and launch**: `deno compile`/`deno desktop`
  serialize `OTEL_DENO`, tracing/metrics/console-capture, and propagator activation into runtime
  metadata. Launch-only env ⇒ "a healthy but empty dashboard".
- Per-process `OTEL_SERVICE_NAME`; shared OTLP `http/protobuf` to `127.0.0.1:4318`; no JS OTel SDK
  needed for server/runtime signals (browser-side would need one — not required for the graph).
- **Aspire standalone dashboard** (Preview in 13.4) bundled as the pinned NativeAOT `Aspire.Cli`
  13.4.6 executable (~144 MB), staged with license + bounded config; anonymous loopback; started
  only by the "observed" launcher; reused if already reachable. Standalone mode has **no AppHost
  resource service** ⇒ no Resources graph/console surfaces; shipping an AppHost just for that UI
  "would replace the Deno supervisor with the Aspire orchestrator and is a distinct deployment
  design" (DESKTOP-SHELL.md).

### 1.4 Packaging (`corpus/files/scripts__windows-singleton__build.ts`, 193 lines)

Pipeline: (1) Vite/Fresh production build with VITE discovery env → (2) `deno desktop --backend
cef --no-check --allow-all` (CEF chosen after WebView2 failures — #136/#149) → (3) six
`deno compile --node-modules-dir=none --exclude-unused-npm --no-check --allow-all` sidecars with
telemetry env → (4) `dotnet tool install garnet-server@1.1.10` staged into `tools/garnet` → (5)
Aspire.Cli 13.4.6 exe staged into `tools/aspire` → (6) two `.cmd` launchers written.

- **Timestamped immutable output dir** (`dist/windows/eis-chat-singleton-<UTC>`): a running install
  can't lock the next build; mutable data lives elsewhere. A proto "update = new dir" model.
- **Hand-maintained sidecar list** with pins in the script (Aspire 13.4.6, Garnet 1.1.10, streams
  compiled from `jsr:@netscript/plugin-streams@0.0.1-beta.9/services`).
- **Synthesized entrypoints** (`entries/workers.ts`, `entries/workers-api.ts`): the workers plugin
  has no packaged service entry, so the script hand-writes one importing the generated job registry
  + `startCombinedProcess`. Streams did not need one (ships a `/services` JSR export). Plugin
  packages lacking compile-able service entrypoints is a framework gap.
- **Build machine needs the dotnet SDK** (tool staging); end user needs nothing.
- `--no-check` required (desktop synthetic entry can't resolve Vite chunks — DESKTOP-SHELL.md
  scaffold bug 1); `--allow-all` everywhere; **no signing, no artifact-hash manifest, no installer**
  — "MSI containing adjacent sidecars: Not implemented; requires a Desktop packaging hook or second
  installer pass" (PR #150 status table).

### 1.5 Storage & data plane

- All mutable data under `%LOCALAPPDATA%\eis-chat` (SQLite catalog, per-channel tursodb, streams
  data, garnet dir, logs); install dir stays read-only (`windows-singleton.ts` 110–124).
- **Single-writer constraint** drives the whole topology: the native tursodb driver holds an
  exclusive OS file lock per DB (os error 33) ⇒ only `eischat` opens the data files; dashboard and
  workers reach data over HTTP (DESKTOP-SHELL.md "the hard constraint"). Option (c) — true
  single-process — requires relocating the single writer in-process (netscript #453/#454).
- Deno Desktop's stable app identity keeps `Deno.openKv()` state across timestamped rebuilds.
- First run **idempotently creates schema** in the per-user DB — first-run provisioning exists only
  as this app-level improvisation; upgrades/migrations across versions are undesigned.

### 1.6 Fix lineage — the seams and fixes are the lessons

| PR | Failure | Lesson for NetScript |
| --- | --- | --- |
| #135 | Multi-process split-brain Deno KV: enqueue in one per-process KV, listen on another ⇒ jobs never run | Multi-process graphs need a framework-provisioned shared backing service (Garnet-as-executable + RedisAdapter); the generator silently no-oping the `DenoKv` cache engine was the root cause (→ netscript #371/#372) |
| #136 | `deno desktop` window frame opens, WebView2 surface blank ("Failed to create WebView2 environment") | Desktop rendering backend is a reliability seam; CEF became the packaged default (#149). Bare admin boxes can't assume WebView2 (echoed by PM-32's `--backend cef` choice) |
| #137 | CEF bundle crashed at launch: eager `require('./windows.js')` in the `cross-spawn→which→isexe` chain of the MCP **stdio** transport; bundler flattens top-level requires but doesn't emit the sibling file | Packaged desktop graphs must prefer HTTP transports and lazy-`import()` any process-spawning/stdio path out of the eager module graph; also: set the transport env in the Aspire helper so packaged mode never falls into the stdio branch |
| #147 | (feature PR) local/offline OCR + embeddings | Offline-first is a real desktop requirement; provider selection must not leak to cloud |
| #149 | SSR `Cycle detected` (Preact Signals under two Vite module identities); Deno Desktop scans child stdout for an undecorated Vite `Local:` URL; generated Aspire helper invoked a removed task | Pin single module identities under Deno-resolved npm (→ netscript #782); desktop dev-loop wiring belongs in the generator, not hand-edits (helper/task drift is real) |
| #150 | (the POC itself) + Windows GUI child-process spawn fix needed (denoland/deno#35994, fixed 2.9.3) | Everything in §§1.1–1.5; netscript follow-ups already filed: #782 (Vite path identity), #783 (markdown/rehype-react) |

### 1.7 Where it breaks (consolidated failure modes)

1. **Sidecar crash after startup = silently dead functionality.** No monitor, no restart, no UI
   awareness. (The charter's headline finding; confirmed in code.)
2. **Hard window kill orphans the graph** (no Job Objects / containment).
3. **Partial-stack reuse:** probe sees 2 services alive ⇒ skips spawning the other 4.
4. **Fixed-port collisions** fail startup with only a timeout as diagnostics.
5. **Readiness is "any /health response"** — aggregate-health bug makes status untrustworthy.
6. **No update mechanism for the combined output.** `Deno.autoUpdate()` bsdiff-patches ONLY the
   window's runtime dylib (`corpus/files/resources__deno-desktop__auto_update.md`): sidecar exes,
   Garnet, Aspire CLI, launchers, config are all outside it — and on Windows staged patches are
   not applied anyway. The real story today: manually fetch a new timestamped dir.
7. **No installation layer.** `.cmd` launcher in a staged dir: no install/uninstall/repair, no
   per-machine vs per-user choice, no service registration, no elevation model, no signing, no
   Start-menu/shortcut integration, first-run provisioning is app-improvised.
8. **Schema/data migration across versions undesigned** (first-run create only).

### 1.8 Script-glue vs framework-worthy

**Framework-worthy (validated needs):**

- Supervised process-graph runtime — restart policies, dependency-ordered start/stop, health
  propagation, containment: exactly the PM epic's engine (PM-4/5/6/17), and the engine-as-library
  invariant (C1) is what makes an **in-window/adjacent supervisor host** possible.
- Graph→artifact compiler: derive the packaged graph (sidecars, ports, env, tool staging) from the
  **Aspire model** the generator already owns, instead of a hand map (POC's `sidecars` list +
  `WINDOWS_SINGLETON_SERVICE_URLS` duplicate `aspire/.helpers/register-*.mts`).
- Plugin **service entrypoints** compile-able by `deno compile` (streams has one; workers needed a
  hand-synthesized entry).
- Dual runtime/build **discovery injection** (`services__*` + `VITE_*`) as a deploy/packaging
  primitive, including the double-build preservation rule.
- **Telemetry-at-compile-time** rule baked into the packaging pipeline; per-process service names.
- Aspire **standalone dashboard staging** as an optional observability add-on.
- Health contract fix (aggregate health must exclude unconfigured adapters) — readiness authority.
- **Installation layer** and **update lifecycle for a combined artifact** — nobody's scope today
  (Part 2).
- Shared-backing-service provisioning in packaged mode (Garnet staging = today's hack).

**Script-glue (stays app config or generated output):** concrete port numbers, app names, data-dir
subpaths, launcher text, tool version pins (become config the framework consumes), the
reuse-if-running probe (superseded by real singleton/instance semantics in the PM engine).

---

## Part 2 — Gap analysis vs the board

Board state (fetched 2026-07-17, `corpus/md/board-*.md`): epic #510 (PM) + PM-1..PM-33 all
`0.0.1-beta.12` (PM-34 #545 stable; PM-35 #546 backlog); #400 dev-dashboard `0.0.1-beta.13`; #327
deployment epic `0.0.1-stable`, its Tier-4 desktop sub-issues #451–#458 all **`0.0.1-beta.11`**;
#820 charter `Backlog / Triage`.

### 2.1 POC lessons the PM epic (#510, beta.12) already covers

| POC lesson | Covering PM slice |
| --- | --- |
| Restart policy + backoff (missing in POC) | PM-4 #515 (pure restart controller) |
| Spawn/kill correctness incl. descendant-tree kill | PM-5 #516 (`Deno.Command`-native runner; TRACEPARENT injection) |
| Dependency-ordered, readiness-gated startup | PM-6 #517 (supervisor loop; E14 grace-window + probe opt-in) |
| Log rotation (POC truncates, never rotates) | PM-7 #518 (multiplexer + rotating sink) |
| Ordered teardown incl. Windows signal caveat | PM-8 #519 |
| Health/state propagation to a UI | PM-9/10/13 (#520/#521/#524: 18-route contract, control-plane service, `subscribeEvents`/`followLogs`) |
| Subprocess telemetry (OTEL_DENO has zero subprocess coverage) | PM-2/14 (#513/#525: `netscript.process` domain + span catalog) |
| Platform capability asymmetry (Job Objects named as Windows manual alternative) | PM-17 #528 (capability descriptor + warn-and-omit) — *names* Job Objects in a warning; does not implement containment |
| OS-service production supervision | PM-15/16/18/19/20 (systemd/Servy renderers, sd_notify, deploy-core extraction) |

The engine-as-library architecture (C1, epic §3) is the load-bearing enabler: the same engine that
backs `pm dev` foreground and compiles to OS units can be **embedded in (or beside) a desktop
window process**. The PM epic never says so — that embedding is unowned (gap G1).

### 2.2 What already ships in netscript (repo verification @ `f391190f`)

- `deploy.targets.*` contract (#337), `OsServicePort` + systemd/Servy adapters
  (`packages/cli/src/public/ports/os-service-port.ts`, `adapters/systemd-os-service.ts`,
  `servy-os-service.ts`), `deno compile` artifact (#340).
- **Activation + rollback convention** (#341):
  `packages/cli/src/public/adapters/service-activation-port.ts` +
  `kernel/domain/deploy/rollback-convention.ts` — `releases/<id>` dirs + a `current`
  symlink/junction repointed on activation, service restart after. The pointer swap is atomic
  ONLY on the POSIX path (temp symlink + `rename`); the Windows junction strategy is
  **remove-then-recreate and explicitly non-atomic** (`service-activation-port.ts:16-20`) — any
  design building on this convention must treat the swap as crash-interruptible.
- **Deploy CLI verbs already exist**: `build · copy · deno-deploy · install · list · logs ·
  package-cli · start · status · stop · target · uninstall · upgrade`
  (`packages/cli/src/public/features/deploy/`). So "installation layer" is not greenfield — there
  is an install/uninstall/upgrade spine for **headless OS services**; what's missing is everything
  desktop/enterprise (per-machine vs per-user, elevation, signing, shortcuts, repair, combined
  artifacts) and its integration with the Aspire model.

### 2.3 The gaps (POC lessons covered NOWHERE on the board)

- **G1 — Desktop-host embedding of the PM engine.** No issue makes the PM engine supervise a
  packaged desktop graph, propagate health to the app UI, or own singleton/instance semantics and
  containment (Job Objects) for a window-anchored graph. PM-32 #543 is only "package the pm
  *console* as a desktop app". Tier-4 #452/#454 define desktop app types and single-process mode
  but reference no supervision at all. **The charter's PM-before-desktop sequencing exists nowhere
  as a dependency edge — worse, Tier-4 desktop (#451–#458) sits at beta.11, BEFORE the PM epic's
  beta.12.** The live board contradicts the owner-ratified sequencing.
- **G2 — Installation layer.** In neither epic (charter finding 2 — confirmed). #456 covers 1-click
  packaging + release/update server; #543 packages the console; #327's install verbs cover headless
  services. Nobody owns: install/uninstall/repair as a product surface, per-machine vs per-user,
  service registration for the *service-graph part* of a desktop install, elevation/UAC, signing
  beyond D4's "manual for v1" (deno desktop signs macOS only; Windows `signtool` external —
  `distribution.md`), first-run provisioning as a framework phase, MSI/deb/rpm containing
  **adjacent sidecars** (deno desktop's MSI packages only the window bundle; per-machine
  `%ProgramFiles%` only).
- **G3 — Update lifecycle for the combined output.** `Deno.autoUpdate()` covers exactly one file
  (the window dylib), per-arch bsdiff, staged-swap-on-relaunch with sentinel-file rollback — and
  does not apply on Windows. The combined singleton = window bundle + N sidecar exes + tools
  (Garnet/Aspire) + launchers + config + user data schema. Undesigned anywhere: atomic multi-
  artifact switch, rollback across window+graph, service downtime windows, schema-migration
  coordination, partial-update hazards, staged rollout. #456's release-server scope (latest.json +
  bsdiff + Ed25519) assumes the single-output story. NetScript's own `releases/<id>` + `current`
  activation convention (§2.2) is the natural foundation — no issue connects it to desktop.
- **G4 — Aspire-model-derived packaging.** #452 adds a desktop *dev resource*; nothing compiles the
  Aspire resource graph into the packaged artifact set (sidecar list, ports, env snapshot, tool
  staging, VITE define injection, OTEL-at-compile). The POC hand-rolls all of it.
- **G5 — Plugin service entrypoints.** Workers needed a hand-synthesized compile entry; no issue
  requires official plugins to ship packaged service entries.
- **G6 — Aggregate-health correctness.** Unconfigured adapters (MySQL in a SQLite app) pollute
  readiness; no issue found. Blocks trustworthy health-gated activation everywhere (PM, deploy,
  desktop).
- **G7 — Composition contract: single-runtime vs singleton-graph.** Tier-4's #451 (in-process link
  adapter), #453 (single-writer relocation), #454 (true single-process, option c) are the
  **single-runtime** approach. The POC is the **supervised-graph** approach (option a achieved via
  adjacent sidecars). Owner mandate: BOTH are kept. No document defines what they share (discovery
  env vs in-process link switch; per-user data layout; packaging pipeline; release/update server;
  first-run provisioning) vs where they legitimately diverge (process supervision & shared cache
  needed only by the graph; single-writer relocation needed only by single-runtime). Without the
  contract they fork — the charter's finding 4.
- **G8 — Frontend health awareness for end-user apps.** PM-29/PM-33 give *admin* surfaces. An
  end-user desktop app needs a lightweight SDK client widget/state ("service X restarting…") fed by
  the supervisor's control plane. Unowned; relates to #400 only via the panel-contribution seam.

### 2.4 Prior single-runtime feature issues (for the G7 contract)

`#451` (in-process link-mode adapter: `createInProcessClientLink` + `ServiceClientTransport`
switch + in-process registry — precursor), `#453` (tursodb single-writer relocation + in-process
composition root), `#454` (true single-process mode), `#455` (offline-first Turso Sync), plus
shared-with-graph: `#452` (generator desktop app type), `#456` (packaging + release/update server),
`#457` (deploy-e2e), `#458` (signing automation). All open, `status:research`, milestone beta.11,
`epic:deployment`. Related closed groundwork: #371/#372 (shared KV/Garnet generator resources —
the multi-process backend fix lineage from eis-chat#135); #375 (closed, folded into #452).

### 2.5 Open questions the plan must close

1. Where does the installation layer live architecturally — extend `deploy-core` (PM-20 extraction)
   with an `InstallerPort` family, or a new `packages/` surface? (Plan locks: extend deploy-core;
   it is the Archetype-7 core the deploy wave inherits.)
2. Supervisor placement in the packaged desktop: in-window (POC style, engine embedded in the
   window process) vs sibling control-plane process (PM C1 style) — who is the parent, who
   survives whom?
3. Update orchestration authority: who applies a staged combined update — the window (Deno
   autoUpdate model), the supervisor, or an installer-owned updater unit?
4. How far does beta.12 PM scope stretch before the desktop wave — which PM slices are the minimal
   prerequisite set for the singleton target?
5. Milestone shape: Tier-4 currently beta.11 (pre-PM) — re-milestone wholesale, or split
   PM-independent slices (#451, #453) from PM-dependent ones (#452/#454/#456/#457)?
