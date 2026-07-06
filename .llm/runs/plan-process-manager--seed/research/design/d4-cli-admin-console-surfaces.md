# D4 — Surfaces: CLI + Admin Console

Stage-D design pack for `plan-process-manager--seed`. Scope: the two owner-named delivery surfaces —
**(B)** the pup/pm2-parity `netscript pm` CLI, and **(A)** the admin console (Fresh-served-in-browser
first, `deno desktop`-packaged as the thin final step). Drafts only; zero board mutation.

Binding inputs: `research.md` §C1–C7 (Stage-C synthesis), OF-1 (recommended: dedicated `netscript pm`
group) and OF-2 (recommended: standalone desktop app **and** dev-dashboard panel over ONE shared
contract). This pack consumes D1 (supervision engine/core) and D2 (control-plane + `ProcessManagerContract`)
as upstream; it does not redefine them. All non-obvious claims carry a citation (file:line, corpus §,
issue #, or URL).

---

## 0. Position in one paragraph

Both surfaces are **thin clients of the single typed oRPC control plane** defined in D2
(`ProcessManagerContract extends BasePluginContract`, S4/S2, `research.md:93,91`). The CLI is an
Archetype-6 cliffy router that mounts one verb per lifecycle action and dispatches to the contract
(OF-1(a)). The console is **one Fresh app** rendered against the same contract, served by the pm's own
control-plane service (browser-reachable on bare metal day one), then packaged via `deno desktop` as a
soft-dependent final step reusing the desktop Tier-4 `#E6` mechanics, and **additionally** contributed
into the dev-dashboard shell as a `DashboardPanelContribution` panel (OF-2(a), `research.md:109`). This
is pup's "one control surface, everything else is a client of it" insight (`m1 §1.8:157-159`) upgraded
with end-to-end types and rendered in three hosts (CLI, standalone desktop, embedded panel) from one core.

---

## 1. CLI verb set — `netscript pm <verb>` (OF-1(a))

### 1.1 The router seam this reuses (cite)

The verb group is a standard `@cliffy/command` `Command` built by a `create…Command(dependencies)`
factory, exactly like the shipped deploy group at
`packages/cli/src/public/features/deploy/deploy-group.ts:19-86`: `.name('deploy')` +
`.description(...)` + `.action(function(){ this.showHelp(); })` + one `.command('<verb>', factory(deps))`
per verb, dependencies threaded through `PublicCommandDependencies`
(`deploy-group.ts:16,19`). `netscript pm` is the identical shape — `createProcessManagerCommand(deps)`
returning a cliffy `Command` named `pm`, one `.command('<verb>', …)` per row of §1.2, each verb factory
receiving a `ProcessManagerContract` **client** (loopback oRPC by default; in-process link where
available, §3.4) rather than a direct engine handle. This keeps the router thin (Archetype-6,
`.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`) and the supervision logic in the D1 core. `pm` is
the CLI group name; `process-manager` is the plugin/package name — `pm` survives only as the CLI alias
(OF-7, `research.md:114`).

### 1.2 Parity-floor verb map (pup floor → NetScript verbs)

Parity floor from pup's dispatch table (`m1 §1.8:147-148`):
`setup, upgrade, update, version, help, run, init, token, append, remove, enable-service,
disable-service, monitor, logs, status, restart, start, stop, block, unblock, terminate`. pm2's
`reload`/`scale`/`save`/`startup` (`m2 §…`) are folded where they add value and dropped where S12 bars
them.

Legend for **Execution when control plane is DOWN**: **Local** = verb runs without the control-plane
service (reads state store / spawns directly / edits config); **CP** = requires the control-plane
service up; **Local→CP** = does local work, then best-effort notifies CP if reachable.

| Verb | Contract route (D2) | pup/pm2 origin | CP-down execution | Output (human / `--json`) |
|---|---|---|---|---|
| `pm init` | — (writes config) | pup `init` | **Local** — scaffolds the typed process-graph config (D5); no service needed | path + summary / `{configPath, processes[]}` |
| `pm add <spec>` | — (edits config) | pup `append` | **Local** — appends a process entry to the graph | diff / `{added}` (rename of pup `append`; clearer verb) |
| `pm remove <id>` | `processes` (validate) | pup `remove` | **Local** — removes entry; warns if instance live | diff / `{removed}` |
| `pm run <spec>` | — (foreground) | pup `run` | **Local** — one-shot foreground exec via the D1 engine, not persisted; Ctrl+C tears down via `ShutdownManager` (`research.md:62`) | streamed logs / n/a (attached) |
| `pm dev` | — (foreground multi) | pup `run`+ | **Local** — foreground multiplex supervisor (§2) | prefixed logs / n/a (attached) |
| `pm status [id]` | `processes`, `processById` | pup `status` | **Local (degraded)** — reads last-known state from the D1 registry store (S3, `research.md:92`); marks staleness if CP down | table (id/state/pid/uptime/↻/cpu/mem) / `{processes:[…]}` |
| `pm start <id>` | `invokeCommand{start}` | pup/pm2 `start` | **CP** in prod (drives systemctl/servy via CP, C1.4 `research.md:69-76`); **Local** in dev mode | ok line / `CommandResult` |
| `pm stop <id>` | `invokeCommand{stop}` | pup/pm2 `stop` | **CP** prod / **Local** dev | ok line / `CommandResult` |
| `pm restart <id>` | `invokeCommand{restart}` | pup/pm2 `restart` | **CP** prod / **Local** dev | ok line / `CommandResult` |
| `pm reload <id>` | `invokeCommand{reload}` | pm2 `reload` | **CP** — graceful/zero-downtime where the OS layer expresses it (`Type=notify`, D3); documented-degraded to restart where not | ok line / `CommandResult` |
| `pm block <id>` | `invokeCommand{block}` | pup `block` | **CP** (or **Local** dev) — flips auto-heal off without stopping (policy toggle, kept verbatim per S7 `research.md:96`, `m1 §1.6:118-120`) | ok line / `{blocked:true}` |
| `pm unblock <id>` | `invokeCommand{unblock}` | pup `unblock` | **CP** / **Local** dev | ok line / `{blocked:false}` |
| `pm terminate` | `invokeCommand{terminate}` | pup `terminate` | **CP** — orderly tear-down of the whole graph (reverse dependency order, D1/D5) | progress / `{terminated:[…]}` |
| `pm logs [id]` | `logs` (paged) | pup `logs` | **Local (degraded)** — tails the pm log sink files directly if CP down; **CP** for merged/filtered/follow | lines / NDJSON stream |
| `pm monitor` | `logs?follow` + `processes` | pup `monitor` | **CP** — live TUI-lite dashboard (multiplexed follow + status refresh); **Local** falls back to file-tail of one id | live TUI / NDJSON stream |
| `pm enable-service` | — (`OsServicePort`) | pup `enable-service` | **Local** — registers the pm control plane itself as one OS-supervised unit via the existing `OsServicePort` (systemd/servy, D3, `research.md:69-76`) | unit path / `{unit}` |
| `pm disable-service` | — (`OsServicePort`) | pup `disable-service` | **Local** — unregisters the CP unit | ok / `{removed}` |
| `pm token <consumer>` | — (auth mint) | pup `token` | **Local** — mints/rotates a control-plane bearer token (D2 token auth, S4 `research.md:93`); revocation list in config | token / `{token, expiresAt}` |
| `pm doctor` | `describe` | (NetScript-native) | **Local** — plugin-health check mirroring existing `verify-plugin.ts` convention; probes CP reachability, config validity, OS-adapter availability | checks / `{checks:[…]}` |

**Deliberately dropped pm2-isms (S12, `research.md:101`):**

- `pm2 deploy` (git+SSH rollout inside the PM) — **dropped**; deploy lane #327 owns rollout, the pm
  consumes artifacts (`research.md:101`, scope-guard C7.2 `research.md:177`).
- `pm2 link` / `@pm2/io` SaaS monitoring — **dropped**; OTEL export is the only remote-observability
  path (S12, `research.md:101,180`).
- `pm2 save` / `pm2 resurrect` (imperative snapshot of live state) — **dropped as a first-class verb**;
  the typed process-graph config *is* the source of truth (S9 `research.md:98`, S12 "no untyped
  config"). State persistence is the D1 registry store (S3), not a `dump.pm2` snapshot.
- `pm2 startup` (generate OS boot integration) — **folded into `pm enable-service`**, delegated to the
  shipped `OsServicePort` renderers rather than pm-owned boot-script generation (`m1 §1.9:170-177`,
  D3).
- `pm2 scale` (N-instance) — **deferred out of milestone 1** (OF-5, `research.md:112`); no `pm scale`
  verb ships in v1. When N-instance lands it becomes `pm scale <id> <n>` over an OS-supervised
  instantiated-units mechanism, designed in a later-milestone D1 pack.

`pm setup`/`pm upgrade`/`pm update`/`pm version` from pup's table are **absorbed by NetScript's own CLI
lifecycle** (`netscript plugin install/update`, `netscript --version`) — the pm plugin does not
re-implement self-update, unlike pup which shipped its own `upgrade` verb (`m1 §1.8:147`).

### 1.3 Output-format convention

Every read verb emits a human table by default and a machine object under `--json`, matching the
existing CLI convention (deploy `status`/`logs` already do this via `packages/cli/src/public/features/
deploy/{status,logs}` — `deploy-group.ts:63-66`). The `--json` payloads are **the contract's own output
schemas** (D2 `StandardSchema` outputs), so CLI JSON == console API responses == third-party responses
byte-for-byte — this is the "one seam, three surfaces" property (`m4 §7.5:230-234`) made literal.
`--json` on streaming verbs (`logs`/`monitor`) emits NDJSON (one JSON record per line) so it composes
with `jq`.

---

## 2. `netscript pm dev` — the `--no-aspire` foreground supervisor

### 2.1 What it is (scope-honest)

The dev fallback is the one place userland supervision is by-design correct (C1.2 `research.md:60-62`).
`pm dev` runs the D1 engine **foreground-attached** — no daemon, no OS services, Ctrl+C tears the whole
process tree down via the reused `ShutdownManager` (`research.md:62`). Shape is process-compose /
overmind / hivemind (`m4 §1:15`, `m4 §7.5`): a single terminal owning N child processes.

This directly fills the documented gap: today `--no-aspire` dev is "one `deno task --cwd <member> dev`
per process, run by hand in separate terminals, zero supervision" (`r4 §5b:330-341`,
`docs/site/how-to/deploy.md:239-242`). No `appsettings.json` exists in that mode
(`r4 §2.1:107`, `plan-init.ts:196`), so `pm dev` sources its process list from the typed process-graph
config (D5) or, absent one, each installed plugin's `scaffold.plugin.json` `officialSource` block plus
the workspace `deno.json` task graph (`r4 §2.3:150-159`) — D5 owns those resolvers.

### 2.2 UX — honest scope

**In (milestone 1):**

- **Multiplexed, prefixed logs** — each child's stdout/stderr line-prefixed with its id and a stable
  color (overmind/hivemind convention, `m4 §1:15`). Log draining uses native streams
  (`ReadableStream.pipeThrough(TextDecoderStream).pipeThrough(TextLineStream)`), **not** pup's
  deprecated `@std/io` `readLines` (`m1 §3:253` — the clearest "aged badly" finding).
- **Dependency-ordered startup** — respects the process-graph's declared order (D5/S9,
  `research.md:98`; process-compose/s6-rc convergence `m4 §7.2:210`), e.g. streams → workers →
  sagas/triggers → auth-api (`r4 §1.1:33`).
- **Restart-on-crash in-loop** — the D1 restart-policy state machine (exp-backoff + windowed budget,
  S7 `research.md:96`) runs live in dev; this is the richer-remainder the OS layer can't express and
  the engine enforces only in dev/attached mode (C1, `research.md:80-81`).
- **Descendant-tree kill** — concrete argv, never `deno task` indirection; the engine tracks/kills the
  full tree (S6 `research.md:95`, pup's own unfixed bug Hexagon/pup#33 `m4 §3:116-121`).
- **`Ctrl+C` graceful shutdown** — with the Windows caveat that registering a signal listener
  suppresses Deno's own default action, so the listener must re-invoke exit/child-propagation itself
  (`m4 §5:172-182`, denoland/deno#28081).

**Out (deliberately, keep scope honest):**

- **No interactive TUI keybindings in `pm dev`** (no tmux-pane-per-process like overmind's
  `overmind connect`, `m4 §1:15). `pm dev` is a log multiplexer + supervisor, not a full TUI. The
  richer live TUI is `pm monitor` (§1.2), which talks to the control plane, not the dev loop. Splitting
  these keeps `pm dev` a small, testable foreground loop and avoids a terminal-UI dependency in the
  hot path.
- **No connect-to-a-running-process shell.** Attaching to a child's stdin interactively is a later
  consideration, flagged as a residual question (§9).

---

## 3. Admin console architecture (OF-2(a))

### 3.1 One Fresh app, three delivery modes over one contract

The console is **one Fresh app** (`plugins/process-manager` `ui/` routes+islands, built on
`@netscript/fresh-ui`) rendered against the D2 `ProcessManagerContract`. It ships in three modes from
one codebase (the "one contract, N hosts" pattern the desktop Tier-4 design already validates for
services, `r4 §4.1:314-321`):

1. **Browser-served (always-works path, ships FIRST).** The pm's own control-plane service serves the
   Fresh UI + the oRPC routes on its loopback/bound port. On bare metal this is browser-reachable day
   one with **no Aspire and no desktop packaging** (`research.md:109`, OF-2 rationale). This de-risks
   the experimental `deno desktop` dependency (§6) — the console is fully functional before any desktop
   work exists.
2. **Desktop-packaged (thin final step, soft dep on #E6).** The **same** Fresh app packaged via
   `deno desktop` into a native binary (§3.3). Soft dependency, not hard (§3.4).
3. **Embedded dev-dashboard panel (nearly free).** The same contract + a `DashboardPanelContribution`
   renders a "Process Control" section inside the #400 dev-dashboard shell when both are installed
   (§4). Contract/panel shape shared; host shell differs.

Archetype note: the **console** (read/command surface over the core) matches the `streams`/`dashboard`
read-surface shape, but the pm **core** itself matches `workers`/`plugin-workers-core` because it owns
real background runtime state — do not default the whole plugin to the dashboard's read-only archetype
just because it ships a UI (`r4 §4.1:428-431`, `research.md` S1). Contract-first: the console defines
nothing the D2 contract doesn't already expose.

### 3.2 Data source — its own core, not `/api/telemetry/*`

The bare-metal console **cannot** be an Aspire-dependent dashboard panel for its primary use case:
Aspire is dev-only (`docs/site/how-to/deploy-local-aspire.md:158-164`, `r4 §5a:299-311`) and the
charter's surface A is explicitly a bare-metal component that must work with no Aspire present
(`charter.md:27,45-47`). So the console's data source is the pm's **own** control plane (D2), not the
dashboard's Aspire OTLP `/api/telemetry/*` surface (`r4 §5a:305-311`). This is the structural reason
OF-2 rejects "dashboard panel only" (option c).

### 3.3 Desktop packaging via #E6 mechanics (verified platform facts)

When the desktop mode is built, it **reuses the desktop Tier-4 `#E6` packaging + signed-auto-update
mechanism rather than re-inventing `deno desktop` packaging** (`r4 §3.2:204-207`, the named re-use
seam). Concrete platform facts it inherits (`m4 §2:29-81`, verification tail §7a):

- `deno desktop` (Deno 2.9, shipped 2026-06-25) wraps a detected Fresh project into a native app;
  `Deno.serve()` auto-binds to the webview's port (`m4 §2:43-48`) — the exact mechanism the console's
  UI server reuses with zero manual port wiring.
- **Backend: force `--backend cef`** for the packaged console. WebView2 is documented broken on
  Windows bare metal in the E-desktop proposal; CEF bundles Chromium for byte-identical rendering at
  ~150 MB vs ~40 MB webview (`m4 §2:56-57`, §7a comparison-page confirmation, E-desktop
  proposal.md:323-344 via `r4 §3.2:214-219`). Bare-metal admin boxes are exactly where WebView2
  cannot be assumed, so CEF is the correct default here.
- **Cross-compile all five targets from one runner** (`--target`/`--all-targets`: x86_64/arm64 Linux,
  x86_64 windows-msvc, x86_64/arm64 macOS; installers authored in pure Rust, no per-OS toolchain)
  (`m4 §2:60-64`, §7a "Yes (`--target`)").
- **Auto-update: native bsdiff + Ed25519 + manifest polling in one API** (`Deno.autoUpdate()`,
  `m4 §2:53`, §7a). **Documented gap: Windows auto-update stages-but-does-not-apply** (§7a, E-desktop
  proposal via `r4 §3.2:214-219`) — the console inherits this constraint verbatim, not a
  pm-specific finding.
- **Daemon/console state** rides Deno 2.9's per-`--app-name` persistent `Deno.openKv()` for compiled
  binaries (`m4 §2:70-74`, S3 `research.md:92`) — no external DB, and **not** tursodb #453 (S3 avoids
  a hard beta.8 desktop dependency).

### 3.4 In-process link (#E1) — optional optimization, soft dep

If the packaged desktop console talks to the pm core **in the same process**, it can mount the D2
contract via the desktop Tier-4 in-process oRPC link (`#E1`,
`packages/sdk/src/client/in-process-client-link.ts`, `r4 §3.1:176`, `r4 §3.2:210-213`) instead of
opening a loopback HTTP port to talk to itself. This is a **soft** optimization edge, not a
requirement: the default transport is loopback oRPC (D2/S4 `research.md:93`), which works identically in
all three modes. **Fallback if #E6/#E1 slip:** the browser-served mode (§3.1.1) is the always-ships
path — the desktop binary is pure upside layered on top. The plan must record the desktop mode as a
**soft** dependency on `#E6` (packaging) and an **optional** edge on `#E1` (in-process link), never a
milestone-1 blocker (OF-2, `research.md:109`; risk posture §6).

---

## 4. `DashboardPanelContribution` host-agnosticism check (#400 dependency)

### 4.1 The seam and what the #400 pack actually specifies

`DashboardPanelContribution` is a contract owned by `plugin-dashboard-core/contracts/v1`, shape
`{ id, title, icon, capability, component, slots{options,sidebar,actions}, setup(), commands }`,
discovered the same way `AspireNSPluginContribution` is — a plugin depending on
`@netscript/plugin-dashboard-core` exports a contribution the registry-generation step collects, keeping
`@netscript/plugin` dashboard-agnostic (A-dashboard `proposal.md:532-544`, DDX-17
`epic-and-issues.md:298-313`). The pm plugin contributing a "Process Control" section is the textbook
consumer (`r1 §7:294-303`, following the create→configure(tabs)→monitor loop DDX-18 specifies for
workers/sagas/triggers/streams).

### 4.2 Host-agnosticism verdict: UNVERIFIED — spec a minimal change request to #400

r4 flagged this as never tested (`r4 §5a:322-327`): "The dashboard proposal does not address
standalone-desktop rendering of its own contributed panels." Reading the DDX-17 acceptance criteria
directly (`epic-and-issues.md:301-313`) confirms the gap — **every** rendering clause is written against
the dashboard's own shell: *"The dashboard shell (DDX-5) renders contributed sections at the DDX-10 host
mount point."* There is **no** clause asserting a contribution can render outside that shell, and the
`setup()` data-source wiring binds to the **dashboard core's** ports (`TelemetryQueryPort`/
`CommandInvokePort` over Aspire `/api/telemetry/*`, `proposal.md:83-88`, `r4 §5a:305-311`). A component
authored to DDX-17 as specified is therefore presumptively **coupled to the Fresh dashboard shell + its
Aspire-backed setup context**, not host-agnostic.

**This is a real cross-pack gap, not assume-away-able** (`r4 §5a:326-327`). Minimal change request to
#400 (record as a dependency note in the pm plan, Stage E; do not mutate #400 in this run):

> **CR-DDX-HOSTAGNOSTIC (to `epic:dev-dashboard` DDX-17):** Split the `DashboardPanelContribution`
> contract so `{ id, title, icon, capability, component, slots, commands }` (the *panel descriptor*) is
> host-neutral and `setup()` receives a **host-provided context** (data-source ports + mount services)
> rather than reaching into dashboard-core's Aspire-coupled ports directly. A contributed `component`
> must render given (a) the dashboard shell + its context, OR (b) any host shell that supplies a
> conformant context — e.g. the pm's standalone `deno desktop` console supplying the
> `ProcessManagerContract` client as the data source. Acceptance: one contribution renders in two host
> shells in a test; `@netscript/plugin` stays dashboard-agnostic (unchanged from DDX-17).

If #400 declines or slips, the fallback is fully covered: the pm ships its **standalone** console
(§3.1.1/§3.3) with **no** dependency on DDX-17 at all, and the embedded panel becomes a later,
best-effort nicety. The pm's milestone-1 console must therefore be built against the **pm's own**
contract/host context, and the DDX-17 contribution authored as an *adapter* over that — so the standalone
path never blocks on the dashboard.

---

## 5. `CommandInvokePort` / DDX-17 reconciliation — first-definer + shared shape

### 5.1 The collision (verified)

Two epics independently propose a structurally identical "invoke a lifecycle action on a supervised
thing" port: the dashboard's `CommandInvokePort` (`plugin-dashboard-core` ports, `proposal.md:82,88,247`
— `CommandInvokePort → Aspire ResourceCommandService`, drives `withCommand` actions
restart/clear/migrate/seed) and the pm's own start/stop/restart/reload/block/unblock lifecycle port
(D1/D2 `ProcessSupervisorPort`/`invokeCommand` route, `r1 §7:322-329`, §1.2 above). r1 recorded this as
a concrete cross-epic edge: *"Whichever lands first should define the port that the other reuses"*
(`r1 §7:327-328`).

### 5.2 Recommended dependency direction: dashboard defines it first; pm depends on it

**Recommendation: `plugin-dashboard-core` (#400) is the first-definer of the shared `CommandInvokePort`
shape; the pm epic depends on it and implements/extends it.** Rationale:

1. **Timeline.** #400 is milestone `0.0.1-beta.6` (`r1 §7:284-286`); the pm epic's milestone is
   re-derived at Stage E off baseline `317e4b50` (`charter.md:56-61`) and is realistically
   **later** (its OS-adapter and desktop-packaging deps push it toward beta.7+/beta.8). The earlier
   epic should own the shared contract so the later one consumes a landed seam rather than a planned one.
2. **Precedent symmetry.** This mirrors the dashboard epic's own recorded cross-epic edge with #238
   (DDX-19 ⇄ `epic:@netscript/plugin-ai`, `epic-and-issues.md:334-336`) — the pm→dashboard edge is the
   same shape and should be recorded identically in the pm plan.
3. **Layering stays clean.** `CommandInvokePort` lives in a **core** package
   (`plugin-dashboard-core/ports`), not in a plugin; the pm core depending on it does not violate the
   thinness law (core-depends-on-core is allowed; MEMORY plugin-core-depends-on-primitives).

**Contingency if the pm lands first / #400 slips:** the pm defines the port in its own core, and #400
reuses it — the direction inverts but the *shared shape* below is the contract either way. The plan
records this as a **bidirectional first-definer edge with a default direction**, so neither epic blocks
on the other's exact schedule.

### 5.3 The shared shape (proposed, minimal)

```ts
// Home: whichever core lands first (default: plugin-dashboard-core/ports/command-invoke-port.ts)
interface CommandInvokePort {
  // name: 'start' | 'stop' | 'restart' | 'reload' | 'block' | 'unblock' | 'clear' | 'migrate' | ...
  invoke(target: CommandTargetRef, name: string, args?: CommandArgs): Promise<CommandResult>;
  list(target: CommandTargetRef): Promise<CommandDescriptor[]>; // capability negotiation (S10 "omit, not no-op")
}
```

- `CommandResult` is the shared output schema the dashboard's `invokeCommand` route already returns
  (`CommandResultSchema`, `proposal.md:145`) and the pm's `invokeCommand` route reuses verbatim (§1.2).
- `CommandTargetRef` is host-neutral (a resource id in the dashboard's Aspire context; a process id in
  the pm's context) — the port doesn't know whether the target is an Aspire resource or a pm-supervised
  process; the **adapter** binds it (dashboard: `→ Aspire ResourceCommandService`, `proposal.md:88`;
  pm: `→ ProcessSupervisorPort` driving systemctl/servy, C1.4 `research.md:69-76`).
- `list()` carries the `DeployTargetPort` optional-method-descriptor discipline (S10 "omit rather than
  silent no-op", `research.md:99`) into per-target capability negotiation — a Windows process omits
  `reload` where the OS can't express it (S11 `research.md:100`).

This is the **same "one seam, three surfaces" (UI action = CLI verb = MCP tool)** the dashboard's
`command`-kind extension is built for (`proposal.md:196-204`, `r4 §4.2:278-288`). The pm's
start/stop/restart is the textbook case (`r4 §4.2:284-286`) — it must register through this shared port,
**not** invent a parallel command-invocation mechanism (`r1 §6:271-274`).

### 5.4 `AspireResourceKind` `command`/`app` extension — the pm is a consumer, not an extender

The pm does **not** need new `AspireResourceKind` values for bare-metal supervision — it consumes the
existing `deno-service`/`deno-background` shape as an *input* to its process graph (`r1 §6:267-274`, S9
`research.md:98`). It only inherits the dashboard epic's `command` kind (if it wants
dashboard-triggerable lifecycle commands), never extends the union itself (`r1 §6:271-274`). Record as a
one-way consume edge: `epic:dev-dashboard` (`command` kind) → pm console, no reciprocal framework
change owed by the pm.

---

## 6. Experimental-feature risk posture (`deno desktop`, ledger 22)

`deno desktop` is **experimental in Deno 2.9** — the docs explicitly flag "experimental in 2.9. The
surface described here is stabilizing and some platform features are still landing" (`m4 §2:39-42`,
verification tail §7a; ledger 22 = design constraint, not drift, `research.md:126`). Mitigation posture:

1. **The browser-served console is the always-works path and ships FIRST** (§3.1.1). It rides only
   stable primitives: `Deno.serve` + Fresh + the D2 oRPC contract. No experimental feature is on the
   critical path to a functional bare-metal admin console. This is the single most important risk
   control and it is architectural, not a flag.
2. **Desktop packaging is feature-flagged and soft-dependent** (§3.4). It layers on `#E6` (itself
   milestone beta.8, `r4 §3:167`); if `deno desktop` stabilization or `#E6` slips, milestone 1 still
   delivers surfaces A (browser) + B (CLI) complete. Follows the E-desktop precedent of shipping the
   desktop app-type behind an `Enabled:false` opt-in (`#E2`, `r4 §3.1:180`).
3. **Windows-specific desktop gaps are documented, not discovered late** — CEF forced over WebView2,
   auto-update stages-but-doesn't-apply on Windows (§3.3, §7a); these are inherited constraints the
   plan cites rather than re-derives (`r4 §3.2:216-219`).
4. **The other platform-experimental risks bind D1/D2/D3, not D4** (OTEL subprocess gap #32752 → D2
   telemetry; Windows no-unix-socket #10244 → D2 uses TCP loopback; Windows signal set #28081 → D1/dev
   loop). D4's surfaces inherit them but do not own their mitigation (ledger 23/24/25 = design
   constraints, `research.md:126-127`).

---

## 7. Landscape verification tails (cite-or-drop)

Per C5's rule (`research.md:158`): verify before the RFC repeats these, else drop.

### (a) Official `deno desktop` docs / comparison page — VERIFIED, CITE

Fetched `https://docs.deno.com/runtime/desktop/comparison/` (2026-07-06). Confirms and adds detail to
`m4 §2`:
- **Binary size:** ~40 MB (WebView) to ~150 MB (CEF), between Tauri (~2–10 MB) and Electron (~100 MB+).
- **Backends:** default system WebView; bundled CEF/WebView option for consistent cross-platform
  rendering.
- **Cross-compile:** "Yes (`--target`)" from a single machine — an advantage over Tauri/Dioxus (need
  target OS locally) and Electrobun (needs each target platform).
- **Auto-update:** native bsdiff, "no separate updater binary, automatic rollback, manifest polling all
  in one API."
- **Documented gaps:** Windows auto-update unsupported; no iOS/Android targets; installer-format /
  notarization automation acknowledged as incomplete; overall positioned as **stabilizing/experimental**.

These are load-bearing for §3.3 (CEF default, cross-compile, Windows auto-update caveat) and §6 (risk).
Source: <https://docs.deno.com/runtime/desktop/comparison/>.

### (b) dokku relevance — VERIFIED, DROP from direct comparison (tangential)

Fetched via search (2026-07-06): dokku is **actively maintained** (latest stable 0.38.20), a
**Docker-powered** bare-metal PaaS with Procfile/nginx-routed process management and app scaling
(<https://github.com/dokku/dokku>, <https://dokku.com/docs/processes/process-management/>). Verdict:
**relevant only as a container-PaaS comparator, not a peer** — dokku supervises *containers* via Docker,
whereas the pm supervises *processes* on bare metal without a container runtime, closer to
process-compose/pup territory than dokku's Docker-SSH-PaaS territory (same distinction m4 draws for
kamal, `m4 §1:18`). **Drop dokku from the head-to-head comparison matrix**; if cited at all in the RFC,
cite it once as "container-PaaS, out of scope" so no comparison claim rests on it (closes the m4 §7 open
question, `m4:255-256`).

### (c) pmc / oxmgr claims — VERIFIED (self-reported), CITE WITH CAVEAT

Fetched via search (2026-07-06):
- **pmc** (theMackabu, Rust, crates.io v1.5.2): PM2-compatible verb surface (start/stop/restart/list),
  **explicitly "no windows support yet"** (<https://github.com/theMackabu/pmc>, <https://pmc.dev/>).
- **oxmgr** (Vladimir-Urik, Rust): cross-platform incl. **Windows/macOS/Linux**, language-agnostic,
  PM2 `ecosystem.config` compat, scheduled health-checks with auto-restart-after-N-failures
  (<https://github.com/Vladimir-Urik/OxMgr>,
  <https://oxmgr.empellio.com/blog/process-manager-comparison>).

Confirms `m4 §1:20`'s "Rust PM2-alternative niche is active in 2026" and, critically, that **the
Deno-native niche is still uncontested**: both live entrants are Rust, PM2-config-shaped, and neither is
OTEL-native, Deno-permission-aware, nor NetScript-integrated (`m4 §1:21-27`). Performance claims (pmc's
"42x faster crash detection") remain **self-reported, not independently benchmarked** — cite only as
niche-activity evidence, never as a verified perf fact (`m4 §7:269-271`). pmc's Windows gap + oxmgr's
PM2-lift positioning together validate S11's "true Windows parity is the differentiator" thesis
(`research.md:100`, `m4 §7.4:222-229`).

---

## 8. Slice decomposition (candidate issues — drafts, `Part of #<pm-epic>`)

Surface-layer slices only (D4 owns CLI + console; core/contract/deploy/config are D1/D2/D3/D5). Naming
placeholder `PMS-*` (process-manager surfaces); epic/milestone re-derived at Stage E. Labels follow
netscript-pr taxonomy; every non-epic references `#<epic>` without a closing keyword until acceptance.

| # | Title | Scope | Acceptance sketch | Dep edges |
|---|---|---|---|---|
| **PMS-1** | `netscript pm` CLI router + read verbs | Cliffy Archetype-6 group (`createProcessManagerCommand(deps)`) mounting `status`/`logs`/`doctor`/`init`/`add`/`remove` over the D2 client; human+`--json` output | `pm status/logs --json` == contract output schemas; router shape mirrors `deploy-group.ts`; degraded-local read from registry store when CP down; arch:check green | D2 (contract client), D1 (registry store S3); `area:cli` |
| **PMS-2** | `netscript pm` lifecycle verbs | `start`/`stop`/`restart`/`reload`/`block`/`unblock`/`terminate`/`token` over `invokeCommand` | verbs dispatch to shared `CommandInvokePort`; CP-mode drives OS layer, dev-mode drives engine; `block`/`unblock` toggle auto-heal without stopping | PMS-1, D2, **§5 CommandInvokePort** (dashboard #400 or pm-core), D3 (OS drive); `area:cli` |
| **PMS-3** | `netscript pm dev` foreground supervisor | Multiplexed prefixed logs, dependency-ordered start, in-loop restart-policy, descendant-tree kill, Ctrl+C teardown; native-streams log drain | `pm dev` supervises the `--no-aspire` graph in one terminal; no daemon; Ctrl+C tears tree down; Windows signal caveat handled | D1 (engine, restart policy, ShutdownManager), D5 (`--no-aspire` resolvers); `area:cli` |
| **PMS-4** | `pm monitor` live TUI-lite | Live status refresh + multiplexed follow over `logs?follow`+`processes`; degraded file-tail fallback | streams live; `--json` NDJSON; falls back to single-id file tail when CP down | PMS-1, D2 (`logs?follow`); `area:cli` |
| **PMS-5** | Admin console — Fresh app (browser-served) | `plugins/process-manager/ui/` Fresh routes+islands on `@netscript/fresh-ui` over D2 contract; served by the pm control-plane service | browser-reachable on bare metal with NO Aspire/desktop; list/status/logs/lifecycle actions; contract-first (no new routes) | D2 (contract), **`@netscript/fresh-ui` L3 blocks** (shared dep, `r4 §6:396-402`); `area:fresh`, `area:plugins` |
| **PMS-6** | Admin console — `deno desktop` packaging | Package PMS-5 via `#E6` mechanics: `--backend cef`, 5-target cross-compile, Ed25519 auto-update; feature-flagged/opt-in | packaged binary launches console; CEF forced; Windows auto-update caveat documented; **soft dep** — does not block M1 | PMS-5, **`#E6` (SOFT, beta.8)**, optional `#E1` in-process link; `area:desktop`, `area:plugins` |
| **PMS-7** | `DashboardPanelContribution` "Process Control" panel | Author a pm contribution (id/title/icon/capability/component/slots/setup/commands) rendering the console as a dev-dashboard section | panel renders inside #400 shell when both installed; dogfoods DDX-17; standalone path unaffected if this slips | **DDX-17 (#400, host-agnostic CR §4.2)**, PMS-5; `area:fresh`, `area:plugins` |
| **PMS-8** | CLI + console reference docs | `cli-reference.md` `pm` verb table + capability page cross-links (coordinated with D5's docs slice) | `pm` verbs documented; no compounding of the stale Linux "planning-only" drift (S13, fixed in same wave) | D5 (docs plan), PMS-1/2/3; `area:docs` |

Dependency-edge summary: **hard on D1/D2** (all surface slices); **hard on D3** for lifecycle verbs that
drive the OS layer (PMS-2); **cross-epic hard on #400** for the shared `CommandInvokePort` (PMS-2) and
the DDX-17 host-agnostic CR (PMS-7); **soft on #E6/#E1** for desktop packaging (PMS-6, non-blocking);
**shared dep on `@netscript/fresh-ui` L3-blocks promotion** (PMS-5, not pm-scope, `r4 §6:396-402`).
PMS-1→PMS-5 constitute the milestone-1 surface floor; PMS-6/PMS-7 are soft/cross-epic follow-ons.

---

## 9. Residual open questions for Stage E

1. **CommandInvokePort first-definer, final call.** §5.2 recommends dashboard-defines-first with a
   bidirectional fallback. Stage E must set the default direction once the pm epic's milestone is
   re-derived off `317e4b50` (`charter.md:56-61`) — if the pm somehow precedes beta.6, invert. Needs an
   owner/roadmap ack, not just a design call.
2. **DDX-17 host-agnostic CR acceptance by #400.** §4.2's CR-DDX-HOSTAGNOSTIC is a *request* to another
   epic. Does #400's owner accept the split (host-provided setup context), or does the pm carry the full
   standalone burden and treat the embedded panel as pure stretch? Decision gates whether PMS-7 is
   milestone-1-adjacent or deferred.
3. **`fresh-ui` L3-blocks dependency ordering.** The console (PMS-5) needs the promoted L3 `blocks/`
   layer the dashboard also depends on (`r4 §6:396-402`, dashboard "D-NSONE" precursor). Is the pm
   console blocked until that lands, or does it ship on L2 `registry/components/ui` + local composition?
   Shared-dep sequencing question for Stage E.
4. **`pm monitor` TUI depth.** §2.2 keeps `pm dev` a plain multiplexer and routes the rich live view to
   `pm monitor` (control-plane-backed). Is a terminal TUI library acceptable in the CLI dependency graph
   (S12 near-zero-dep posture, `research.md:101`), or should `pm monitor` stay a scrolling NDJSON stream
   and the "rich" live view live only in the web console? Scope/dep-budget call.
5. **Interactive attach-to-child.** Deferred in §2.2 (no `overmind connect`-style stdin attach). Confirm
   out-of-scope for v1 or spec a minimal `pm attach <id>` later-milestone shape.
6. **Console auth in browser-served bare-metal mode.** D2 owns token auth (S4), but the console's
   browser session flow (cookie vs bearer, bind-to-loopback vs LAN-reachable, TLS on bare metal) is a
   surface-specific security decision D4 surfaces to Stage E rather than resolving unilaterally.
7. **`pm run` vs `pm dev` overlap.** Both are foreground; §1.2 scopes `pm run` = single one-shot,
   `pm dev` = multi-process graph. Confirm the split is worth two verbs or whether `pm dev` subsumes
   `pm run <single>`.

---

*Pack D4 complete. Consumes D1 (engine/core) + D2 (contract/control plane); hands Stage E: 8 candidate
surface slices (PMS-1..8), one cross-epic CR to #400 (host-agnostic panel), one first-definer
recommendation for the shared `CommandInvokePort`, and 7 residual questions. Drafts only — zero board
mutation.*
