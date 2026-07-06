# M4 — 2026 Process-Manager Landscape + Deno 2.9 Platform Facts

Market sweep of the process-supervisor space as of 2026-07, plus the exact Deno 2.9 platform
surface a NetScript-native process manager plugin would stand on. All claims below carry a
citation: a full URL (web/docs), a `deno doc`-equivalent API surface, or a repo path.

## 1. Landscape sweep — who is alive, who is dead, who is new

| Tool | Status (2026-07) | Model | Notes |
|---|---|---|---|
| `F1bonacc1/process-compose` | **Alive, actively released** — v1.116.0 shipped 2026-06-16, prior releases 2026-05-01 (v1.110.0), 2026-04-03 (v1.103.0), 2026-03-20 (v1.100.0) — monthly cadence | Compose-syntax (YAML) declarative process graph + TUI + REST API | Closest modern analog to the target plugin: declarative process definitions, dependency/readiness ordering, a terminal UI, and a control API. [Releases](https://github.com/F1bonacc1/process-compose/releases); [repo](https://github.com/F1bonacc1/process-compose); [mise-tools release timeline](https://mise-tools.jdx.dev/tools/process-compose) confirms the cadence. |
| `supervisord` (Python) | **Alive, slow-moving** — 4.3.0 changelog dated 2025-08-23; docs "last updated Jul 02, 2026"; a v9.2.1 hotfix (Oct 2025) referenced in a third-party PDF suggests a parallel v9 branch/fork exists | INI config, XML-RPC control, Python 2-era codebase | Explicitly does not run on Windows ("Supervisor will not run at all under any version of Windows" — [introduction](https://supervisord.org/introduction.html)). [Changelog](https://supervisord.org/changes.html). |
| `s6` / `s6-overlay` + `s6-rc` | **Alive** — `just-containers/s6-overlay` is an active container-focused packaging of skarnet's s6; a "next version" discussion (#358) explicitly plans a migration to `s6-rc` as the supervision tree (skarnet's dependency-aware service-manager companion to s6) | Tiny supervision primitives (`s6-svscan`/`s6-supervise`) + a separate declarative dependency-resolving layer (`s6-rc`) — the split-primitives design pup/pm2 don't have | [repo](https://github.com/just-containers/s6-overlay); [next-version discussion #358](https://github.com/just-containers/s6-overlay/issues/358); [service-dependency issue #112](https://github.com/just-containers/s6-overlay/issues/112) notes s6-overlay itself doesn't resolve init-order dependencies without s6-rc. |
| `runit` (smarden.org / voidlinux) | **Alive as a design, stagnant as a project** — canonical source still serves from smarden.org, packaged by Void Linux (default init), Artix, antiX, Debian/Ubuntu (alternative init), FreeBSD/NetBSD/OpenBSD ports | 3-stage init (`/etc/runit/{1,2,3}`) + `runsv`/`runsvdir` supervision tree, one process per supervised service, log chaining via `svlogd` | [smarden.org/runit](https://smarden.org/runit/) — distro list confirms it is still a live default (Void Linux) rather than a museum piece. |
| `overmind` / `hivemind` (DarthSim) | **Alive** — both actively maintained Procfile-based managers; `overmind` adds tmux-pane-per-process for interactive debugging | Procfile format (one line per process), signal-forwarding, per-process tmux window | [overmind](https://github.com/DarthSim/overmind); [hivemind](https://github.com/darthsim/hivemind); [Evil Martians writeup](https://evilmartians.com/opensource/overmind). Linux/FreeBSD/macOS only per hivemind's own README — no native Windows support, matching the gap this plugin should close. |
| systemd-as-process-manager (trend, not a product) | Confirmed live practice, not new in 2026 but consolidating: "Docker itself is usually run under systemd" | Native unit files, `Restart=`, cgroup-scoped resource limits, socket activation | [Deploying server apps the right way — why systemd](https://blog.stackademic.com/deploying-server-applications-the-right-way-why-and-how-systemd-quietly-powers-production-system-8a2b24d8c81c). This is the trend NetScript's existing `SystemdAdapter` (#339) already rides — see section 5. |
| Podman Quadlet | **Alive, RHEL-blessed** — documented as of 2026-03 tutorials, is the current recommended pattern for running containers under systemd | `.container`/`.volume`/`.network`/`.kube` unit files consumed by a systemd generator that emits real transient units at boot | [podman-systemd.unit(5)](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html); [Red Hat: Quadlet](https://www.redhat.com/en/blog/quadlet-podman); [2026-03 RHEL9 tutorial](https://oneuptime.com/blog/post/2026-03-04-podman-containers-systemd-quadlet-rhel-9/view). Quadlet's generator pattern (declarative file to systemd unit, not a long-running daemon of its own) is a strong architectural precedent for a "declarative process spec compiled to OS-native reconcile" design. |
| Basecamp `kamal` | **Alive, actively discussed** — deploy-adjacent (SSH + Docker orchestration for zero-downtime deploys), not itself a process supervisor; a live GitHub discussion (#1823, "recommending against Kamal right now") shows real production friction (git-HEAD-based deploys, doc gaps) | SSH-driven container lifecycle + `kamal-proxy` | [repo](https://github.com/basecamp/kamal); [critique discussion #1823](https://github.com/basecamp/kamal/discussions/1823). Relevant as a deploy-orchestration comparator, not a direct process-manager peer — NetScript's bare-metal lane is closer to process-compose/pup territory than kamal's container-SSH territory. |
| `dokku` | Not independently re-verified this pass (out of budget); treated as a known-alive PaaS-on-bare-metal reference from the owner's framing, not re-cited here to avoid a stale claim — flagged as an open question (section 7). | — | — |
| **New 2025-2026 Rust entrants** — `pmc` (theMackabu), `oxmgr` | **Both alive and newly-launched (2025-2026)** — explicitly pitched as PM2 replacements | `pmc`: Rust CLI/API, PM2-command-compatible surface (start/stop/restart/list); crates.io-published (v1.5.2) | [pmc.dev](https://pmc.dev/); [repo](https://github.com/theMackabu/pmc); [crates.io](https://crates.io/crates/pmc/1.5.2); a companion Reddit post claims "42x faster crash detection (4ms vs 167ms)" vs PM2 ([r/SideProject](https://www.reddit.com/r/SideProject/comments/1rl17w4/i_built_a_rustbased_process_manager_as_a_pm2/)) — an author benchmarking claim, not independently verified, cited only as evidence the "Rust PM2-alternative" niche is active in 2026. `oxmgr`: pitched as a "deterministic, cross-platform process manager for Node.js, Python, Go, Rust, and any executable" ([Medium writeup](https://empellio.medium.com/oxmgr-a-lightweight-pm2-alternative-written-in-rust-c4c8efa52034)). |
| `hexagon/pup` | **Confirmed by the owner as the direct concept-ancestor** — active-enough GitHub presence (open issues as recent as issue #33 on `deno task` process termination), a Reddit launch thread introducing it into beta, and a Deno-core discussion thread (#18081, "Deno run like a service") referencing pup as prior art for systemd/launchd wrapping | Cross-platform (Windows/macOS/Linux) supervisor for Deno/Node/Python/Ruby processes, single Deno-native binary | [repo](https://github.com/hexagon/pup); [Reddit intro](https://www.reddit.com/r/Deno/comments/1271ou0/introducing_pup_a_native_deno_process_manager/); [Deno discussion #18081](https://github.com/denoland/deno/discussions/18081); [issue #33 — `deno task`-spawned children can't be stopped](https://github.com/Hexagon/pup/issues/33) is a concrete Deno-`Command`-layer gotcha (see section 4) the new plugin must not repeat. No new dedicated Deno-native process-manager entrant beyond pup itself surfaced in a targeted 2025-2026 search — the Deno-native PM niche is still open, which is the market gap this epic targets. |
| PM2 itself | Alive, incumbent — explicitly documents Bun/Deno support as a compatibility mode, not a native integration | [PM2 docs: Bun, Deno & other runtimes](https://pm2.keymetrics.io/docs/usage/bun-deno/) | Confirms PM2 treats Deno as "yet another runtime to `pm2 start`", with none of Deno's native primitives (permissions, `Deno.serve` binding, OTEL_DENO, KV) wired in — the exact gap a NetScript-native plugin closes. |

Net read: no dead entrants disqualify the sweep (process-compose, overmind/hivemind, s6-overlay,
runit-via-distros, podman quadlet, kamal, pmc/oxmgr are all independently confirmed alive in 2025-2026
sources); supervisord is alive but Windows-incompatible by its own docs. The Deno-native niche pup
opened around 2023 has not been re-contested by a new entrant as of this sweep.

## 2. `deno desktop` (Deno 2.9, shipped 2026-06-25) — exact platform facts

Source of record: [Deno 2.9 release notes](https://deno.com/blog/v2.9) (dated June 25, 2026, by
Bartek Iwańczuk) and [docs.deno.com/runtime/desktop/](https://docs.deno.com/runtime/desktop/)
(last updated June 25, 2026).

- **What it is.** `deno desktop` (PR [#33441](https://github.com/denoland/deno/pull/33441)) turns a
  Deno entrypoint or a detected web-framework project into a native, self-contained desktop app: UI
  runs in a webview, business logic runs in the Deno runtime in-process, output is a single
  distributable binary built on the same machinery as `deno compile`.
- **Status: experimental in 2.9.** The docs explicitly flag: "`deno desktop` is experimental in 2.9.
  The surface described here is stabilizing and some platform features are still landing." This is
  load-bearing for risk framing — the plugin's Surface A (admin console) rides an experimental Deno
  feature, not a stable one, as of 2026-07.
- **`Deno.serve()` auto-bind.** Inside a desktop entrypoint, `Deno.serve()` automatically binds to
  the port the webview navigates to — no manual port wiring. This is the exact mechanism the plugin's
  admin console would reuse to expose its UI.
- **Framework auto-detection.** Same detection as `deno compile` (Next.js, Astro, Fresh, Remix, Nuxt,
  SvelteKit, SolidStart, TanStack Start, Vite SSR) — NetScript's Fresh-based admin UI is a supported
  target out of the box, run via `deno desktop .` or `deno desktop --hmr` in dev.
- **Native desktop APIs, no extra deps:** `Deno.BrowserWindow` (window size/position/visibility/menus/
  DevTools, `window.bind()` to expose Deno functions to page JS via a `bindings` namespace),
  `Deno.Tray` (system-tray icon + panel, itself an attachable `BrowserWindow`), `Deno.Dock` (macOS
  dock), native `prompt()`/`alert()`/`confirm()` dialogs, and `Deno.autoUpdate()` (polling
  binary-patch auto-updater).
- **Backends: `webview` (default) vs `cef`.** `webview` uses the OS's built-in engine (WebView2 on
  Windows, WebKit on macOS/Linux) — small, fast, no bundling, but rendering varies by host OS engine
  version. `cef` bundles Chromium via the Chromium Embedded Framework for byte-identical rendering
  everywhere, at a cost of tens of MB and a build-time download. Selected via `--backend`.
- **Distribution / packaging targets.** Output format follows the `--output` extension: `.app`/`.dmg`
  (macOS), `.exe`/`.msi` (Windows), `.AppImage`/`.deb`/`.rpm` (Linux). Five cross-compile targets
  match `deno compile`: `x86_64`/`arm64` Linux, `x86_64-pc-windows-msvc`, `x86_64`/`arm64` macOS — a
  single Linux CI runner (or laptop) can build all five via `--all-targets`; per-target backends are
  downloaded, not locally built. Windows `.msi` and Linux `.deb`/`.rpm` installers are authored in
  pure Rust, so no platform-specific packaging toolchain is required on the build host. `--compress`
  produces a self-extracting bundle for smaller artifacts.
- **`deno compile` asset/embedding facts feeding the same binary:**
  - `--include` (existing) resolves files through the module graph; the new `--include-as-is`
    ([PR #32417](https://github.com/denoland/deno/pull/32417)) embeds a file/dir into the compiled
    binary's virtual filesystem verbatim, no transpilation/resolution — read back at runtime via
    `Deno.readTextFileSync(import.meta.dirname + "/...")`. The two flags combine in one build.
  - **Persistent storage for compiled binaries.** A default `Deno.openKv()`, `localStorage`, and the
    `caches` API now persist to a per-app directory under the platform's app-data location instead of
    falling back to in-memory — this is new in 2.9 and directly relevant to daemon state (below).
    Storage identity is keyed by `--app-name` (defaults to the output filename); two binaries sharing
    an `--app-name` share the store, and renaming the binary no longer loses data.
  - **`--bundle` (experimental).** Runs the entrypoint through Deno's own bundler and tree-shaking
    before embedding, dramatically shrinking npm-heavy binaries (the release notes cite an 11.6 MB to
    1.5 MB lodash-hello-world reduction). Pairs with `--minify`.
  - **`--watch`** rebuilds the compiled executable on source change.
- **Comparison page exists** at [docs.deno.com/runtime/desktop/comparison/](https://docs.deno.com/runtime/desktop/comparison/)
  contrasting `deno desktop` against Electron, Tauri, Electrobun, and Dioxus (page located but not
  scraped in full this pass — flagged as an open question for the deep-dive stage, section 7).

## 3. `Deno.Command` / `Deno.ChildProcess` — the subprocess primitive

Source: [docs.deno.com/api/deno/subprocess/](https://docs.deno.com/api/deno/subprocess/) (current
stable API surface).

- **`Deno.Command`** is a builder (`allow-run`-gated): `new Deno.Command(cmd, options)`, then
  `.spawn()` (streaming `ChildProcess`), `.output()`/`.outputSync()` (buffered, waits to completion).
  `Command` is reusable as a builder but each `.spawn()`/`.output()` call starts a new subprocess.
- **`CommandOptions`** relevant to a process-manager core: `args`, `cwd`, `env`, `clearEnv` (does not
  guarantee OS-injected env vars are excluded), `uid`/`gid` (POSIX `setuid`/`setgid` — will fail the
  spawn on error), `signal: AbortSignal` (sends `SIGTERM` via the paired `AbortController`; not
  supported in `outputSync`), `stdin`/`stdout`/`stderr` as `"piped" | "inherit" | "null"` (default
  differs: `"piped"` for `.output()`/`.outputSync()`, `"inherit"` for `.spawn()`),
  `windowsRawArguments` (skip Windows arg quoting/escaping; ignored elsewhere), and `detached`
  (spawned process survives the parent's exit — requires calling `.unref()` on the child to let the
  parent actually exit, and note piped/inherited stdio streams can themselves keep the parent alive
  until closed).
- **`ChildProcess`** exposes `pid`, `status: Promise<CommandStatus>`, `stdin`/`stdout`/`stderr` as
  `WritableStream`/`SubprocessReadableStream` (each with `.text()`/`.bytes()`/`.json()`/
  `.arrayBuffer()` convenience readers), `.kill(signo?)` (defaults `SIGTERM`), `.output()` (await full
  completion and collect output), and the `ref()`/`unref()` pair controlling whether the child's
  liveness keeps the Deno event loop (and hence the parent process) alive — the load-bearing knob for
  a daemon that must supervise children without being pinned open by them, or conversely must stay
  alive exactly as long as a foreground-attached child.
- **`Deno.kill(pid, signo?)`** (top-level, `allow-run`) sends a signal to an arbitrary PID (not just
  a `Command`-spawned one) — default `SIGTERM`; negative `pid` targets a process group but throws on
  Windows (no process-group signaling equivalent there); signal `0` is the standard "test for
  existence" no-op.
- **Newer/`unstable` overloads:** `Deno.spawn`/`Deno.spawnAndWait`/`Deno.spawnAndWaitSync` exist as
  `unstable`, `allow-run`-gated free-function alternatives to `new Deno.Command(...).spawn()` — same
  capability, marked unstable in the current doc surface, so the plugin core should treat
  `Deno.Command` as the stable contract and not depend on these free functions without an explicit
  `--unstable-*` gate decision at design time.
- **Known real-world gotcha (pup's own bug):** [Hexagon/pup#33](https://github.com/Hexagon/pup/issues/33)
  — a process launched via `deno task <name>` cannot be stopped by the supervisor, because the actual
  child is a grandchild of the spawned `deno task` shim; the workaround is to have the managed command
  be the real binary (`deno run ...`) rather than a `deno task` alias. This is a direct design
  constraint: the new plugin's process spec should resolve to a concrete executable/args tuple, not a
  task-runner indirection, or must explicitly track/kill the full process-group/descendant tree.

## 4. OTEL_DENO — what's built in for subprocess/daemon observability

Source: [docs.deno.com/runtime/fundamentals/open_telemetry/](https://docs.deno.com/runtime/fundamentals/open_telemetry/).

- Enabled via `OTEL_DENO=true`; exports OTLP (`http/protobuf` default, or `http/json`, `grpc` since
  Deno 2.8, or `console` for local stderr human-readable debugging) to `localhost:4318` by default.
- **Auto-instrumented spans**: `Deno.serve` HTTP requests (span per request, ends at response-headers
  sent, not full body), outgoing `fetch`, and — new in Deno 2.9 — `node:http2` client and server
  traffic with cross-service trace-context propagation.
- **Auto-instrumented metrics** for `Deno.serve`/`Deno.serveHttp`: `http.server.request.duration`
  (histogram), `http.server.active_requests` (gauge), request/response body-size histograms — all
  tagged with method/scheme/protocol-version/server address+port/status/error-type.
- **Logs**: every `console.*` call, Deno-runtime internal logs, and any error that terminates the
  process are captured; `OTEL_DENO_CONSOLE` controls whether logs still also print to stdout/stderr
  (`capture` default, `replace`, `ignore`).
- **Permission audit to OTEL.** `DENO_AUDIT_PERMISSIONS=otel` (instead of a file path) routes the
  permission-audit log into the same OTLP pipeline as an OpenTelemetry log record, with
  `deno.permission.type`/`.value`/`.stack` attributes — directly relevant to a process manager that
  runs supervised children with scoped permissions and wants a unified audit trail.
- **No native `Deno.Command`/subprocess span type exists.** The auto-instrumentation list is
  explicitly HTTP-server/HTTP-client/HTTP2/cron-only — there is no built-in span or metric for
  child-process lifecycle (spawn, exit, restart). A live GitHub issue confirms this gap:
  [denoland/deno#32752, "OTEL deno subprocess propagation"](https://github.com/denoland/deno/issues/32752)
  proposes injecting OTEL context env vars into spawned children so trace context threads through
  process boundaries — not yet implemented as of this sweep. This means the process-manager plugin's
  own OTEL integration (spans for spawn/restart/crash/health-check, metrics for uptime/restart-count)
  is user-space work the plugin must build itself, not something `OTEL_DENO` gives for free — a
  direct, load-bearing design implication for the plugin-core's telemetry seam.
- **Known limitations** (documented, not inferred): traces support links with no attributes; metric
  exemplars unsupported; only OTLP/`console` exporters; async/observable metrics aren't flushed on
  crash (sync metrics are); several `OTEL_*_LIMIT` env vars are unenforced; `Deno.serve` HTTP-server
  spans don't get an OTel status set on handler-thrown errors.

## 5. Deno KV, unix sockets, signals — daemon-state and IPC primitives

- **Deno KV as daemon state.** Confirmed via the `deno compile`/desktop persistence facts in section
  2: a compiled binary's default `Deno.openKv()` now persists to a per-app-name directory under the
  OS app-data path (Deno 2.9, [blog](https://deno.com/blog/v2.9)) — this is the natural fit for the
  process manager's own state store (process table, restart counters, last-known health) without
  standing up an external database, and it survives binary rename via the explicit `--app-name` key.
- **Unix domain sockets.** `Deno.listen({ transport: "unix", path })` has existed since Deno 1.19
  ([Deno 1.19 release notes](https://deno.com/blog/v1.19): "Deno's HTTP server API now supports
  connections established over Unix sockets in addition to TCP"). Windows named-pipe support is a
  long-standing, still-open gap: [denoland/deno#10244, "Support for Named Pipes in Deno.connect"](https://github.com/denoland/deno/issues/10244)
  explicitly states Deno's unix-transport support does not extend to Windows named pipes — meaning a
  cross-platform control-socket design (CLI to daemon IPC) cannot rely on a single `transport: "unix"`
  code path for Windows and must fall back to a TCP loopback socket (or another IPC mechanism) on
  Windows specifically. This is a direct, load-bearing platform constraint for Surface B (CLI to
  daemon control channel).
- **Signal handling.** `Deno.addSignalListener`/`Deno.removeSignalListener` exist
  ([tutorial](https://docs.deno.com/examples/os_signals_tutorial/)), but on Windows only `"SIGINT"`
  (Ctrl+C), `"SIGBREAK"` (Ctrl+Break), `"SIGTERM"`, `"SIGQUIT"`, `"SIGHUP"`, and `"SIGWINCH"` are
  supported — per the documented note on
  [`Deno.removeSignalListener`](https://docs.deno.com/api/deno/~/Deno.removeSignalListener). A second
  behavioral gotcha: registering a signal listener suppresses Deno's own default action for that
  signal ([denoland/deno#28081](https://github.com/denoland/deno/issues/28081)) — e.g. adding a
  `SIGINT` listener means Deno no longer exits on its own on Ctrl+C; the listener becomes fully
  responsible for shutdown. A process-manager daemon that intercepts signals for graceful-shutdown
  orchestration must explicitly re-invoke exit/propagate-to-children logic it would otherwise have
  gotten for free.
- **Workers vs. subprocess.** Not separately documented as a head-to-head comparison in this sweep
  (open question, section 7) — the working assumption from the `Deno.Command` docs above is that
  `Worker` threads share the parent's process/permission boundary and are for in-process JS
  concurrency, while `Deno.Command` subprocesses are the only primitive that gives OS-level isolation
  (own PID, own permission set, own exit code, independently signal-able) — which is the isolation
  model a process manager needs for arbitrary managed processes (potentially non-Deno executables,
  per pup's and process-compose's own scope).

## 6. Re-use seams already shipped in NetScript's bare-metal lane (per charter, "Re-use/refactor")

Not independently re-verified against source in this pass (charter names these as already-shipped,
closed #337-#344): `deploy.targets.*` (#337), `OsServicePort` + `SystemdAdapter` (#339), `deno
compile` artifact production (#340), rollback/health-gate/OTEL/secrets hardening (#341). These are
flagged for the Stage C/D synthesis to verify directly against `packages/`/`plugins/` source
(`deno doc` on the relevant modules) rather than taken on the charter's word alone — this corpus
does not re-cite them as verified findings since no source read was performed this pass.

## 7. The 2026 SOTA technique list — what pup/pm2 don't do that a new tool should

Each item is sourced to something concrete found in this sweep, not asserted from general knowledge:

1. **OTEL-native process lifecycle, not just HTTP.** `OTEL_DENO` auto-instruments `Deno.serve`/
   `fetch`/`http2`/cron but has zero built-in subprocess span/metric coverage
   ([denoland/deno#32752](https://github.com/denoland/deno/issues/32752) is still open) — a 2026 PM
   should emit its own OTEL spans/metrics for spawn/restart/crash/health-check and propagate trace
   context into managed children (the exact gap #32752 identifies), something none of pup/pm2/
   supervisord/s6/runit do today.
2. **Declarative, dependency-ordered process graphs**, not flat process lists — the pattern
   `process-compose`'s compose-syntax and `s6-rc`'s dependency-aware rc layer both converge on
   independently ([process-compose repo](https://github.com/F1bonacc1/process-compose);
   [s6-overlay #358 next-version discussion](https://github.com/just-containers/s6-overlay/issues/358)),
   versus pm2's/pup's flatter per-process model.
3. **Generator-to-native-unit pattern**, not a competing supervision daemon — Podman Quadlet's model
   (declarative `.container` file to systemd generator emits a real transient unit at boot,
   [podman-systemd.unit(5)](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)) is
   evidence that "declarative spec compiled to the OS's native supervisor" out-competes "yet another
   long-running supervisor daemon" as an architecture — directly relevant since NetScript's bare-metal
   lane already ships a `SystemdAdapter` (#339) that this plugin should compose with/target rather
   than duplicate.
4. **True cross-platform parity including Windows**, closing a gap every non-Deno incumbent in this
   sweep has: supervisord explicitly refuses to run on Windows at all
   ([supervisord docs](https://supervisord.org/introduction.html)); overmind/hivemind are Linux/
   BSD/macOS-only ([hivemind repo](https://github.com/darthsim/hivemind)); s6/runit are POSIX-only by
   design. pup itself claims Windows/macOS/Linux parity
   ([hexagon/pup](https://github.com/hexagon/pup)) — a NetScript plugin should meet or exceed that,
   with the Windows IPC/signal caveats from section 5 (no unix-socket transport, restricted signal
   set) designed for explicitly rather than discovered late.
5. **TUI + web + desktop parity over one core**, not three separate rewrites —
   `process-compose` already ships a TUI + REST API from one core; `deno desktop`'s
   `Deno.serve()`-auto-bind + framework auto-detection ([deno desktop docs](https://docs.deno.com/runtime/desktop/))
   is the concrete Deno 2.9 mechanism that lets a single admin-console core also become the CLI's data
   source and the desktop app's UI backend without a second implementation.
6. **Supply-chain-safe, zero/thin-dependency core** — Deno 2.9 ships two supply-chain hardenings at
   the platform level (`min-release-age` npm-package-age gate now on-by-default with a 24h window,
   and an opt-in `no-downgrade` trust policy against stolen-maintainer-token attacks, both in the
   [2.9 release notes](https://deno.com/blog/v2.9)) — a state-of-the-art 2026 process-manager core
   should be built to need zero or near-zero npm dependencies so it inherits maximum benefit from
   these guards and is not itself a supply-chain attack surface for the processes it supervises.
7. **Persistent structured state via `Deno.openKv()` in a compiled binary**, not a bespoke file/DB —
   Deno 2.9's per-app-name persistent KV/localStorage/caches for `deno compile` output
   ([2.9 release notes](https://deno.com/blog/v2.9)) is a ready-made, dependency-free daemon-state
   store (process table, restart history, health-check results) that pup (which predates this
   feature) and pm2 (Node-based, no Deno KV) cannot use natively.
8. **Socket-activation-style on-demand start**, an established systemd pattern
   ([mgdm.net writeup](https://mgdm.net/weblog/systemd-socket-activation/);
   [RHEL 2026-03 tutorial](https://oneuptime.com/blog/post/2026-03-04-systemd-socket-activation-on-demand-services-rhel-9/view))
   that none of pup/pm2/process-compose/overmind implement — flagged as a candidate SOTA technique
   for the deep-dive stage to evaluate for NetScript's bare-metal target specifically (where
   `SystemdAdapter` composition could hand this off to systemd natively rather than reimplementing it).

## Open questions for Stage C/D synthesis

- `dokku` was named in the topic brief but not independently re-verified alive/current in this pass
  (time-boxed out) — needs a dedicated citation before any comparison-matrix claim relies on it.
- The `docs.deno.com/runtime/desktop/comparison/` page (Electron/Tauri/Electrobun/Dioxus comparison)
  was located but not scraped in full — worth a dedicated fetch in the deep-dive stage if the design
  needs to justify `deno desktop` over Tauri/Electron explicitly.
- Workers-vs-subprocess isolation semantics in Deno were not found as a dedicated doc/comparison in
  this sweep; the isolation-model claim in section 5 is an inference from the `Deno.Command` docs,
  not a directly cited comparison — flag for a targeted `deno doc`/docs.deno.com pass if the plugin
  design needs to justify subprocess-only (vs. worker-based) process isolation formally.
- NetScript's own #337-#341 bare-metal artifacts (`deploy.targets.*`, `OsServicePort`,
  `SystemdAdapter`, `deno compile` artifact step, rollback/health-gate/OTEL/secrets hardening) were
  taken from the charter's own description and not re-verified against `packages/`/`plugins/` source
  in this pass — a repo-seam-focused discovery topic should close this gap directly against source,
  not this market corpus.
- The `pmc`/`oxmgr` Rust-PM2-alternative performance claims (e.g. "42x faster crash detection") come
  from the tools' own launch posts and were not independently benchmarked — cited only as evidence
  the niche is active, not as verified performance facts.
