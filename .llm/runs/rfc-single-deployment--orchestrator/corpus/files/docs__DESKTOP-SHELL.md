# Desktop shell — `deno desktop` window + packaging (#118)

Current status (PR #150, `agent/windows-singleton-desktop`): **full-stack Windows singleton staged
and smoke-tested · adjacent sidecars launched directly by Deno Desktop · Aspire standalone telemetry
verified · MSI assembly still open**.

This is the build/run/distribute reference for wrapping eis-chat as a native desktop app with
`deno desktop` (Deno 2.9+). The original Phase-1 dashboard-only investigation is retained below as
historical context. Its decision has been superseded by the verified `windows-singleton` experiment,
documented in the final section, which stages and supervises the complete process graph without
PowerShell or Docker.

---

## Historical Phase-1 architecture decision (superseded for `windows-singleton`)

### The problem

`deno desktop` wraps a **single Fresh project** (`apps/dashboard`) into a native binary: it runs the
framework's production server as one `Deno.serve()` handler inside one Deno process, with an OS
webview pointed at it (`resources/deno-desktop/frameworks.md`, `index.md`, `comparison.md`). It has
**no official multi-process / sidecar story** — `comparison.md` lists it as "process group
(WebView)", explicitly contrasted against Electron's main+renderer+IPC model, and none of the 18
desktop doc pages mention spawning or bundling a second service process.

But eis-chat today is a **multi-process Aspire orchestration**. The dashboard reaches its backend
**only over HTTP** (there is no in-process/link mode in `@netscript/sdk` — `createServiceClient`
always returns an HTTP RPC client resolved from Aspire service-discovery env vars). At runtime the
dashboard depends on:

| Process               | Port  | Role                                                                                                                          | Core-chat critical? |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **eischat**           | 3001  | oRPC service. **Sole writer** of the SQLite catalog + per-channel tursodb files. Chat history, channels, sessions, KB search. | **Yes**             |
| **streams**           | 4437  | Durable-streams runtime — live KB status + sharing registry (`useLiveQuery`).                                                 | No (degrades)       |
| **workers**           | (bg)  | KB embedding / image transcription jobs.                                                                                      | No (KB ingest only) |
| **workers-api**       | 8091  | Job enqueue (called by eischat, not the dashboard directly).                                                                  | No (KB ingest only) |
| **legacy-archeo-mcp** | 8095  | Estate-analytics MCP tools. Falls back to stdio subprocess if no URL.                                                         | No (optional)       |
| **excalidraw-mcp**    | 8096  | Diagram widget MCP. Falls back to stdio subprocess.                                                                           | No (optional)       |
| LiteLLM gateway       | (ext) | Sole LLM entry (`LITELLM_BASE_URL`).                                                                                          | **Yes**             |

**The hard constraint** (`services/eischat/src/channel-client.ts`): the native tursodb driver holds
an **exclusive OS file lock per DB** (os error 33 on double-open). eis-chat is therefore a
**single-writer architecture** — _only_ eischat opens `data/channels/<id>.db` and the SQLite
catalog; everything else (dashboard, workers) reaches the data plane through eischat over HTTP. **A
dashboard-only desktop wrap cannot own the data plane; it must reach a running eischat.**

### Options evaluated

- **(a) Desktop binary bundles + spawns all NS services.** Highest fidelity, but `deno desktop`'s
  single-entry bundler only statically analyses the one entry module; extra entrypoints/worker mains
  need explicit `--include`, and **native-addon npm packages are unverified through the VFS
  self-extraction** — this directly hits `@tursodatabase/database` (native driver) and Prisma's
  native query engine. No doc confirms native `.node`/FFI addons survive embedding. High risk, needs
  a dedicated spike. `Deno.Command` itself is _not_ documented as blocked (the binary inherits
  `--allow-run`), so spawning sidecars from bundled/adjacent source is plausible but unproven.
- **(b) Dashboard-only desktop that connects to a separately-run services process.** Matches
  `deno desktop`'s documented single-process model exactly. The desktop binary is the dashboard; the
  eischat service (+ streams/workers) run as a separate process the binary reaches over
  `127.0.0.1:<port>` (outbound `fetch` is unrestricted). Lowest risk, ships now.
- **(c) In-process/embedded subset.** Would require refactoring eischat's oRPC router to export a
  fetch handler the dashboard mounts in-process (and moving the tursodb single-writer into the
  dashboard process). A genuine architecture change + upstream `@netscript/sdk` link-mode feature.
  Out of scope for Phase 1.

### Historical decision (Phase-1 MVP)

**Phase 1 adopted (b), with a path to (a).** The `windows-singleton` experiment later completed that
path by compiling and staging adjacent sidecars; this paragraph records the earlier decision, not
the current deployment status.

- **S2–S4 target:** a launchable native dashboard binary in `dist/` that renders the app and talks
  to a **separately-launched services process** over localhost (the same `services__*__http__0`
  env-var contract Aspire already injects — set them when launching the packaged app, or point at a
  running dev stack). Native chrome (tray/window) gated so the _same_ `main.ts` still runs as a
  plain web server for the Aspire/web build.
- **S5 target:** prove the data plane works when eischat runs alongside the packaged app (SQLite
  catalog + per-channel tursodb under a per-user data dir), and document the run flow.
- **Spun into follow-up sub-issues (not Phase 1):**
  - **Bundled/managed services** — desktop binary spawns eischat (+ streams/workers) as a sidecar
    via `Deno.Command`, resolving the **native-addon-in-VFS** question for tursodb + Prisma. This is
    the (a)→ upgrade and needs a spike. _(sub-issue)_
  - **Single-binary / in-process eischat** — option (c), export eischat's router as a mountable
    fetch handler + move the tursodb single-writer in-process. Larger refactor. _(sub-issue)_
  - **Windows auto-update** — `Deno.autoUpdate()` **stages but does not apply** updates on Windows
    yet (only macOS/Linux). Since this is a Windows-first target, ship a manual-update fallback and
    track upstream; stand up the release server (`latest.json` + bsdiff + signing) to activate the
    gated `initDesktopChrome()` auto-update. _(sub-issue)_
  - **Aspire live demo** — stage the `register-apps.mts` desktop resource (`Enabled:false` → opt-in)
    and capture the window rendering inside a running `aspire run` dev stack. _(coordinator /user
    step — see the Aspire section + `aspire/PROPOSED-desktop-resource.md`)_

### Why (b) and not (a) now

The whole risk in (a) is native code surviving `deno desktop`'s VFS embedding — and eis-chat's data
plane is _entirely_ native (tursodb driver + Prisma engine). Nothing in the docs confirms or denies
it, so it is a spike, not a slice. (b) ships a verifiable desktop app this phase and leaves (a) as a
clean, well-scoped upgrade once the native-bundling question is answered.

---

## Build / run / distribute (verified pieces marked ✅)

### Prerequisites

- Deno **2.9.0+** (`deno desktop` subcommand). ✅ confirmed installed (`x86_64-pc-windows-msvc`).
- Deps installed with the age-floor disabled once to bake `deno.lock`:
  `deno install --allow-scripts --minimum-dependency-age=0` (see the deno-best-practice skill). ✅

### Build the web output (S2 prerequisite) ✅

```powershell
deno task --cwd apps/dashboard build     # → apps/dashboard/_fresh/ (server.js + client/ + server/)
```

`deno desktop` detects Fresh via the `_fresh/` directory and imports `_fresh/server.js` in release
mode (`resources/deno-desktop/frameworks.md`). It does **not** run the build for you — build first.

### Package the desktop binary (S2) ✅ VERIFIED

```powershell
deno task --cwd apps/dashboard desktop:build
#   = deno task build && deno desktop --no-check -o ../../dist/windows/eis-chat .
```

Produces (verified on `x86_64-pc-windows-msvc`, ~88 MB):

```
dist/windows/eis-chat/
  eis-chat.bat           # launcher
  eis-chat.dll           # compiled entry + Deno runtime + embedded _fresh/ (9.49MB) VFS
  laufey_webview.exe     # the WebView backend (laufey v0.4.0, auto-downloaded)
  AppIcon.ico            # from static/favicon.ico
```

Two scaffold bugs were fixed to get here:

1. **`--no-check` is required.** Without it `deno desktop` runs `deno check` on its synthetic entry,
   which imports the Vite-built `_fresh/server/server-entry.mjs`, and fails with
   `TS2307: Cannot find module '_fresh/server/html_renderer'` (a Vite chunk `deno check` can't
   resolve). The build "still might work correctly" per Deno's own hint — `--no-check` skips the
   check and the bundle is fine. The workspace gate (`deno task check`) still type-checks the real
   source graph; only this desktop-synthetic-entry check is skipped.

2. **`desktop.output` is not honored (Deno 2.9.0) → use explicit `-o`.** The original task's
   `-o ../../dist/` (a bare dir) produced a synthetic-named `.deno_desktop_entry-XXXX` bundle, and
   even with the `-o` dropped, the `desktop.output.windows` block in `deno.json` was **ignored** —
   the build fell back to `<cwd>/dashboard/`. The reliable, predictable path is an **explicit
   `-o ../../dist/windows/eis-chat`**, which yields the correctly-named `eis-chat.*` bundle in the
   right place. The `desktop.output` block was therefore removed from `deno.json` to avoid implying
   a behavior that does not occur. For macOS/Linux, swap the `-o` path
   (`-o ../../dist/macos/eis-chat.app`, `-o ../../dist/linux/eis-chat`) — cross-compile with
   `--target` per `resources/deno-desktop/distribution.md`.

Icons: `deno desktop` auto-detects `static/favicon.ico` (a real 16/32px multi-res `.ico`) and uses
it as `AppIcon.ico`; `desktop.app.icons` in `deno.json` also points there explicitly, so the app
ships a real icon (not the generic Deno one).

### Launch evidence (S3) ✅ runtime loads + starts

The packaged app's launcher is `eis-chat.bat` → `laufey_webview.exe --runtime "eis-chat.dll"`.
Launched headlessly in this environment, it produces:

```
Runtime loaded successfully from: eis-chat.dll
Runtime started
Failed to create WebView2 environment
```

So the **Deno runtime + embedded `_fresh/` app load and start from the bundle** (the first two
lines). The third line is expected here: creating a WebView2 environment needs an **interactive
desktop session** — this box's WebView2 runtime is present (v149.x confirmed via registry) but there
is no attached desktop to host a visible window in the non-interactive shell. `deno desktop`'s
webview drives the `Deno.serve` bind on navigation, so no `[dashboard]` server banner prints before
the webview init — that ordering is by design.

**Final visual confirmation** (the window renders the app + chat/KB/skills/MCP) is an interactive
**coordinator/user step** — run `deno task --cwd apps/dashboard desktop:dev` (HMR) or launch
`dist/windows/eis-chat/eis-chat.bat` on a machine with an interactive desktop session, with a
services process reachable (below).

### Run the packaged app (S3, target (b))

The binary is the dashboard; point it at a running services process via the same env contract Aspire
uses:

```
services__eischat__http__0=http://127.0.0.1:3001
services__streams__http__0=http://127.0.0.1:4437   # optional; UI degrades without it
LITELLM_BASE_URL=...   LITELLM_MASTER_KEY=...       # required for chat
```

Start eischat (+ streams/workers) separately for the MVP — e.g. the dev Aspire stack, or a launcher
script (tracked in the bundled-services sub-issue).

### `desktop:dev` (HMR)

```powershell
deno task --cwd apps/dashboard desktop:dev    # = deno desktop --hmr .
```

Runs the Vite dev server inside the desktop runtime with fast-refresh (`frameworks.md`, `hmr.md`).
Dev-only — never ship an `--hmr` binary.

### Per-user data directory (S5)

There is **no `Deno.desktopDataDir()`**, and the packaged binary's cwd is the user's _launch_ cwd
(unreliable — do not write DBs relative to it). Resolve an app-data root yourself and point
`CHANNEL_DATA_DIR` / the SQLite `DATABASE_URL` at it:

- Windows: `%APPDATA%\eis-chat` (`Deno.env.get("APPDATA")`)
- macOS: `~/Library/Application Support/eis-chat`
- Linux: `$XDG_DATA_HOME/eis-chat` or `~/.local/share/eis-chat`

Since eischat is the sole DB owner (target (b)), eischat resolves and owns these paths; the desktop
dashboard never touches the files directly.

---

## Native chrome (S4) ✅ IMPLEMENTED — tray + auto-update, gated

The same `main.ts` must run as a plain web server (Aspire/browser) **and** add native chrome only
under `deno desktop`. Implemented in **`apps/dashboard/lib/desktop-chrome.ts`**, called from
`main.ts`:

```ts
// main.ts — after defineFreshApp()
import { initDesktopChrome } from '@app/lib/desktop-chrome.ts';
initDesktopChrome(); // no-op under `deno task dev` / Aspire
```

`initDesktopChrome()` feature-detects the desktop runtime and installs a tray (tooltip + Quit) and
optional auto-update:

```ts
// gate on a desktop-only global (the documented idiom, notifications.md)
const isDesktop = typeof Deno.BrowserWindow !== 'undefined';
if (isDesktop && Deno.Tray) {
  const tray = new Deno.Tray();
  if (tray.trayId !== 0) { // 0 = platform couldn't create it → bail
    tray.setTooltip('eis-chat');
    tray.setMenu([/* about (disabled), separator, Quit ⌘Q */]);
    tray.addEventListener('menuclick', (e) => {
      if (e.detail.id === 'quit') Deno.exit(0);
    });
  }
  // Deno.autoUpdate({ url }) only if EISCHAT_RELEASE_BASE_URL is set.
}
```

**Why a helper module, not inline:** the desktop-only globals (`Deno.BrowserWindow`, `Deno.Tray`,
`Deno.autoUpdate`, `Deno.desktopVersion`) are **not in the stable Deno type lib**, so referencing
them raw would fail `deno check`/lint in the web build. `desktop-chrome.ts` describes just the slice
it uses via a local structural type and reads it off `Deno` through that — **no `any`, no ambient
global augmentation**, gate stays lint-clean and the module is a cheap no-op everywhere but a
packaged binary. Verified: `deno check` + `deno lint` clean; `desktop:build` still produces the
binary with the tray import embedded.

`Deno.desktopVersion` is `string` in a packaged build, `null` under `deno run` (auto-update is a
no-op when null). **Auto-update on Windows STAGES but does not APPLY (macOS/Linux only)** — leaving
the call in is safe; it just won't self-update on Windows. Only wire `EISCHAT_RELEASE_BASE_URL` +
`desktop.release.baseUrl` + a signed `latest.json` once a release server exists (follow-up
sub-issue). API shapes: `resources/deno-desktop/tray_and_dock.md`, `auto_update.md`.

---

## Aspire dev-stack integration (POC — the headline deliverable)

The reframed goal: prove a `deno desktop` window runs **inside our Aspire TS apphost as a dev-stack
resource**, so `aspire run` launches the native window alongside dashboard / eischat / streams /
workers, wired to them via the same `services__{name}__http__0` discovery env vars. Once proven here
it lifts upstream into NetScript (`@netscript/cli`).

### The pattern (from the working .NET reference)

`rickylabs/netscript-start` → `NetScriptAppRegistrationExtensions.AddNetScriptApps` registers a Deno
app with a custom task / watch mode via `AddTaskBackedApp` → `AddDenoTask(name, root, taskName)` →
`addExecutable('deno', ['task', <taskName>])`, then injects service discovery
(`WithConfiguredHttpReferences`). Its `AddTauriApp` is exactly that **plus** a `WithReference` to a
remote app — i.e. a native-window resource is a task-backed executable with discovery env but **no
HTTP endpoint of its own**. Our TS apphost already mirrors this: `register-apps.mts` registers
`dashboard` as `builder.addExecutable('dashboard','deno',workdir,['task','dev'])` +
`withEnvironment` discovery injection. The desktop resource is a sibling that runs
`['task','desktop:dev']`.

### Proposed wiring (staged by the supervisor — `aspire/.helpers/*` is generator-owned)

Full proposal + copy-paste snippet: **`aspire/PROPOSED-desktop-resource.md`**. In short:

- **appsettings `NetScript.Apps.desktop`**:
  `{ Enabled:false, Runtime:"deno", Type:"app",
  TaskName:"desktop:dev", Workdir:"apps/dashboard", ServiceReferences:["eischat"],
  PluginReferences:["streams"] }`
  — no `Port` (the window binds its own internal `Deno.serve` port), `Enabled:false` so headless/CI
  `aspire run` is unaffected until a dev opts in.
- **`register-apps.mts`**: a `desktop` block = the `dashboard` block minus `withHttpEndpoint`,
  running `['task','desktop:dev']`, reusing the identical `services__eischat__http__0` /
  `services__streams__http__0` (+ MCP URL) `withEnvironment` injection.

This keeps S1 option (b) — the window is the dashboard binary; eischat/streams run as their own
Aspire resources; the window reaches them over `127.0.0.1`. The apphost simply becomes the thing
that spawns the window in dev.

> Not staged into the running apphost by this PR (coordinator owns `aspire/.helpers/*` + the
> generator template). Flagged for staging; the proposal file carries the exact diff.

---

## References (local)

`resources/deno-desktop/{index,frameworks,serving,configuration,backends,distribution,tray_and_dock,auto_update,hmr,comparison}.md`
· `docs/PHASE-1-FOUNDATION.md` · `docs/BUILD-PLAN.md` · `services/eischat/src/channel-client.ts`
(single-writer note) · `apps/dashboard/lib/channel-service.ts` (HTTP-only SDK client) ·
`aspire/.helpers/register-apps.mts` (`services__*__http__0` discovery env).

---

## Experimental `windows-singleton` deployment target

The repository now carries the first experiment for a future NetScript
`deploy.targets.windows.singleton` option. It stages a Deno Desktop application, Garnet, and the
compiled service process graph needed by the chat, streams, workers, and MCP surfaces. The desktop
process supervises every sidecar and waits for readiness before serving UI requests.

```powershell
deno task deploy:windows-singleton
dist\windows\eis-chat-singleton-<UTC timestamp>\eis-chat-singleton.cmd
```

Builds are placed in a new Temporal-generated timestamped directory so a running or inspected
desktop build cannot lock the next release. Automation may set
`EISCHAT_WINDOWS_SINGLETON_OUTPUT_DIR` to an explicit child of `dist/windows`.

The generated launcher sets `EISCHAT_WINDOWS_SINGLETON=1`. Normal browser, Aspire, and existing
desktop builds do not start a sidecar. Singleton data is placed under `%LOCALAPPDATA%\eis-chat`
(`%APPDATA%` fallback), including the SQLite catalog and channel files; the installation directory
remains read-only.

Supervisor diagnostics and debug sidecar output are written to `%LOCALAPPDATA%\eis-chat\logs`
(`desktop-supervisor.log` plus `<resource>.stdout.log` / `<resource>.stderr.log`). Deno Desktop's
app-scoped `Deno.openKv()` storage uses the stable `eis-chat` application identity and therefore
survives timestamped rebuilds.

The packager injects the complete fixed loopback graph twice from one source of truth:
`services__<name>__http__0` (plus compatibility aliases) for the Fresh server and sidecars, and
`VITE_services__<name>__http__0` / `VITE_<NAME>_URL` while Vite builds browser islands. Hyphenated
names use the short form (for example `VITE_WORKERS_API_URL`) because Vite define expressions cannot
contain a hyphenated dotted property. Runtime environment assignment alone is too late for
`import.meta.env`; without the build-time form, browser-side typed clients fail even though
server-side RPC works. The supervisor records the non-secret service-discovery and OTLP environment
in `desktop-supervisor.log` for auditing.

The staged graph contains:

- Garnet on 6379;
- durable streams on 4437;
- workers API on 8091 and the background workers process;
- the core `eischat` service on 3001 with SQLite data under the per-user directory;
- legacy-archeology and Excalidraw MCP HTTP services on 8095 and 8096.

Run `eis-chat-singleton-observed.cmd` to also start the bundled Aspire 13.4.6 standalone dashboard
on 18888 with anonymous local access and OTLP receivers on 4317/4318. The packager stages the pinned
NativeAOT `Aspire.Cli` executable, its MIT license and third-party notices, and a bounded telemetry
configuration under `eis-chat/tools/aspire`; the installed application therefore needs neither
Docker, a .NET runtime, nor a system Aspire installation. If a dashboard is already reachable, the
supervisor reuses it instead of competing for the ports. Open `http://127.0.0.1:18888` to inspect
structured logs, traces, and metrics.

This is Aspire's documented **standalone** mode and the `aspire dashboard` command remains Preview
in 13.4. It intentionally has no AppHost resource service, so the resource list, resource graph, and
AppHost console-log surfaces are unavailable; those require an AppHost-provided
`ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL`. The singleton supervisor remains the resource authority and
writes its complete non-secret resource/environment audit to `desktop-supervisor.log`. Shipping an
AppHost resource service solely for that UI would replace the Deno supervisor with the Aspire
orchestrator and is a distinct deployment design, not another dashboard setting.

The packager supplies Deno's OpenTelemetry enablement variables during **both build and launch**.
This is essential for standalone executables: `deno compile` and `deno desktop` serialize tracing,
metrics, console-capture, and propagator enablement into their runtime metadata. Supplying
`OTEL_DENO=true` only to the finished executable is too late and produces a healthy but empty
dashboard. Runtime configuration then gives every process its own `OTEL_SERVICE_NAME` and the shared
`OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318` with `http/protobuf`; Deno appends the standard
signal paths. A compiled control executable exported both its console log and `fetch` span to the
bundled dashboard with this setup, without a JavaScript OTel SDK.

The dashboard process receives the corresponding documented Aspire variables for its frontend,
OTLP/gRPC and OTLP/HTTP listeners, anonymous local access, config path, and standalone browser CORS.
Browser-originated telemetry still requires an OpenTelemetry JavaScript SDK in the Fresh client;
that is separate from Deno's built-in server/runtime instrumentation and is not required for the
singleton services to populate logs, traces, and metrics.

### Fresh/Vite production module identity

Fresh 2.3's Vite integration correctly owns React-compat aliases and disables dependency discovery,
which prevents the pre-bundling duplicate described in its release notes. A clean Windows production
build on current stable Fresh 2.3.3 / `@fresh/plugin-vite` 1.1.2 nevertheless resolves the same
installed `preact/hooks` and Signals files through both `C:/...` and `C:\...` IDs. Rollup then emits
two hook runtimes; the second patches the same Preact options object and hydration fails.

`resolve.dedupe`, import-map pins, browser conditions, and declarative aliases were each retested
without the application resolver and did not merge those final resolved IDs. The Vite config
therefore retains one narrow temporary resolver that delegates normal resolution and applies Vite's
`normalizePath()` only to Preact IDs. It is not a Babel pass or a custom bundle transform. The
framework-level fix and reproduction are tracked in
[NetScript #782](https://github.com/rickylabs/netscript/issues/782); once final Deno-resolved IDs
are canonicalized upstream, the Preact ID resolver can be removed from this app. The generic
versioned-`npm:` aliases cover a separate cold Deno-resolution case seen by Linux CI.

The chat renderer no longer uses `react-markdown`. Markdown is parsed through the existing unified
pipeline and rendered directly by `rehype-react` with Preact's JSX runtime. This removes the React
wrapper and its dependency surface while keeping the rehype plugin ecosystem; the framework
follow-up is [NetScript #783](https://github.com/rickylabs/netscript/issues/783).

Image ingestion and semantic retrieval are separate settings. The default offline Tesseract OCR
still produces searchable text chunks, but the default embedding provider is `disabled`; in that
mode the KB is intentionally keyword-only. A generic question such as “what is in this image?” may
not match OCR text even though the document is `ready`. Select an embedding provider in Settings for
semantic retrieval, or query for terms visible in the image to verify the offline OCR path.

Current experiment constraints:

- Deno sidecars are compiled with `--node-modules-dir=none --exclude-unused-npm`; this avoids
  inheriting Deno Desktop's npm process-state handles. The experimental `--bundle` mode remains
  unsuitable for the libSQL sidecar because it cannot resolve the dynamically selected
  `@libsql/win32-x64-msvc` native package.
- Garnet is staged from the pinned `garnet-server` .NET tool package; Docker is not required.
- The observed launcher adds the pinned Aspire 13.4.6 NativeAOT CLI (~144 MB) to provide the
  official zero-container standalone dashboard path. Normal launches do not start it.
- The target stages an application directory. Producing an MSI containing the adjacent sidecars
  needs a packaging hook in `deno desktop` or a second installer pass over the staged directory.
- Deno 2.9.3 or newer is required for denoland/deno#36005. The desktop supervisor removes inherited
  `DENO_*` runtime variables, including the desktop-only `DENO_SERVE_ADDRESS`, before starting the
  independently listening sidecar.
- First run idempotently creates the catalog's `Channel`, `ExampleRecord`, and unique-slug schema in
  the per-user SQLite database.
- The supervisor treats any response from HTTP `/health` as listener readiness, uses a TCP probe for
  Garnet, and terminates children in reverse order during normal desktop teardown. NetScript beta.9
  currently includes an unused MySQL adapter in aggregate health for this SQLite-only app, so the
  response status cannot yet be the readiness authority. Fixing that upstream, crash restart, and
  Windows Job Object containment are follow-ups.
