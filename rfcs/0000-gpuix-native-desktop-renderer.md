---
rfc: 0000
title: Native GPU desktop renderer (GPUIX + Preact) for NetScript desktop apps
status: Draft
authors: ['@rickylabs']
created: 2026-11-09
tracking-issue: https://github.com/rickylabs/netscript/issues/2602
target-milestone: Enterprise Deployment & Desktop
---

# Native GPU desktop renderer (GPUIX + Preact) for NetScript desktop apps

## Summary

Add an **opt-in, incubating native desktop track** in which a NetScript app renders its Preact
component tree directly to the GPU through [GPUIX](https://gpuix.dev) (React/Solid bindings for
Zed's GPUI), with the NetScript service, typed SDK client, durable streams and KV running **in the
same process** — no webview. The track ships as a Preact host renderer, a token-driven primitives
kit that renders to either GPUIX or the DOM, two small SDK/service seams, an auto-update adapter and
a packaging backend. `deno desktop` with the webview backend remains the default desktop path until
the decision gates below pass.

Measured on a real GPU (a Windows laptop), GPUIX uses half the memory of the webview build, runs as
one process instead of seven, and starts many instances where the Chromium-based hosts stall. It
also uses 2.2× the webview's CPU when the screen updates often. That cost sits in GPUI's UI thread,
not in Preact, NetScript or the runtime, and reducing it is the first incubation work item.

With the real NetScript backend shipped in the same installer and supervised by the app, the backend
dominates the footprint (1.37 GB across nine processes), and a 250 ms live-update budget cuts
GPUIX's CPU by more than four times, to about 35% below the webview under the same budget on Linux.
Gate 1 now hinges on confirming that on real GPUs.

This RFC is backed by a working proof of concept (PoC), benchmarks on Linux and on a Windows laptop,
and installable builds: `.llm/runs/rfc-gpuix-desktop--rfc/` (research, evidence, PoC source).

## Motivation

1. **Deno runtime end of life.** Deno's team joined Cloudflare (2026-10-09) and runtime development
   ends about a year later. NetScript keeps Deno for now and prepares a gradual migration. The
   desktop offering is the most exposed part of the stack: `deno desktop`, `Deno.BrowserWindow`,
   `Deno.autoUpdate` and the laufey webview/CEF backends are Deno-only surfaces with no drop-in
   replacement, and every NetScript desktop package wraps them (`@netscript/fresh/desktop`,
   `@netscript/sdk/desktop`, `@netscript/sdk/auto-update`, `netscript deploy desktop`).
2. **A runtime-agnostic native option exists.** GPUIX loads through Node-API. The PoC proves the
   same Preact renderer source runs unchanged on **Deno 2.9.7, Bun 1.4.4 and Node 24**. A
   GPUIX-based desktop path survives the runtime migration; a `deno desktop`-based one does not.
3. **Measured resource gains.** One process instead of three (WebKitGTK), seven (WebView2) or eight
   (CEF), 30–50% less memory per instance, and many concurrent instances where the Chromium-based
   hosts stall at startup (see the benchmarks below). The measured cost is CPU under frequent
   updates.
4. **Simpler architecture.** In one process the window-bound oRPC transport (`bindDesktopRpcWindow`
   ↔ `createDesktopServiceClient`, MessagePort framing) disappears: the UI calls the service through
   the ordinary SDK client, or in-process.

Cost of not doing this: when Deno development stops, NetScript desktop apps either freeze on an
unmaintained desktop runtime or need an unplanned rewrite.

## Findings that shape the design

### Preact: not through compat, yes as a native host

`@gpuix/react` is built on `react-reconciler@0.33`, which reads React's private shared internals at
module load. With `react` aliased to `preact/compat` it throws before the first render
(`TypeError: … ReactSharedInternals.S`). A compat layer cannot provide React's fiber engine.

GPUIX also exposes a framework-neutral host layer (`@gpuix/native/host`: batched mutation queue,
renderer state, event registry), which its Solid adapter uses. The PoC's `gpuix-preact` (about 500
lines) is a small DOM facade that Preact diffs against, translated into that mutation protocol and
flushed once per Preact commit. Preact 10 and `@preact/signals` work unchanged, and the Preact 11
path (`ownerDocument`) is supported. The full PoC app renders through it on Linux (light and dark,
six screens, real input).

### Integration with the NetScript ecosystem

| Surface                                              | Result                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/service`                                 | Embedded via `createService().withAuthn().withRPC().withHealth().build()` on loopback.                                   |
| `@netscript/sdk/client`                              | Typed oRPC client, `resolveServiceUrl` injection; same code targets a remote service.                                    |
| `@netscript/sdk/streams/consumer`                    | The DOM-free fetch consumer from the Expo work drives the live feed, with offset resume.                                 |
| `@netscript/kv`                                      | Settings, cookie jar and persisted mutations (verified across restart).                                                  |
| Cookie sessions                                      | The SDK reserves the `cookie` header (correct for browsers). Native hosts bridge the session to `Authorization: Bearer`. |
| `@netscript/sdk/auto-update`                         | Wraps `Deno.autoUpdate`, which is absent outside `deno desktop`; needs an adapter at its `NativeAutoUpdate` port.        |
| `@netscript/fresh-ui`                                | Token presets are data and port; CSS components do not.                                                                  |
| `netscript deploy desktop`                           | Wraps `deno desktop` formats; needs a packaging backend.                                                                 |
| `@netscript/fresh/desktop`, `@netscript/sdk/desktop` | Unnecessary for this host.                                                                                               |

Two papercuts surfaced and should be fixed independently of this RFC:

- `createService().withRPC()` defaults to `/api/rpc`, but `createServiceClient()` calls
  `/api/rpc/v1/<routerName>`. The PoC uses `buildServiceRpcPath({ routerName })`.
- The SDK's reserved-header list is undocumented at the contribution API; a `cookie` contribution
  fails only at construction with `SDK_CONTRIBUTION_INVALID`.

### Fresh

- **Unchanged Fresh pages cannot run on GPUIX** (2.x or 3.x). Hydration is not the obstacle; CSS is.
  GPUIX styles are inline objects (Taffy flexbox, limited grid, px numbers) with no selectors,
  cascade, custom properties or media queries.
- **Fresh 2.x** renders inline in `ctx.render()` with `renderToString`, so there is no renderer
  seam. A native target would require a fork.
- **Fresh 3.x** (alpha, runtime-agnostic through Vite + Nitro) has a clean seam: route modules fold
  handler data, page and layouts into one VNode before `renderPage()`. A native target would replace
  only that call. The PoC's in-process router already uses the Fresh 3 route-module shape
  (middleware → handler `{ data }` → page in a layout).

## Benchmark

<!-- bench-table:start -->

| Host                            | Cold start (median, range) | Memory / instance (PSS) | Processes | Idle CPU | Active CPU (non-raster) | 8 instances (total PSS) | Install⁴ |
| ------------------------------- | -------------------------- | ----------------------- | --------- | -------- | ----------------------- | ----------------------- | -------- |
| GPUIX + Preact (`deno compile`) | 949 ms (916–1457)          | 282 MB                  | 1         | 1.8%     | 204.7% (≈61%²)          | 1,443 MB                | 185 MB   |
| GPUIX + Preact (`deno run`)     | 792 ms (773–834)           | 247 MB                  | 1         | 1.6%     | 200.4%                  | 1,531 MB                | —        |
| Deno Desktop · WebKitGTK        | 831 ms (744–998)           | 402 MB                  | 3         | 36.9%    | 114.3% (≈20%²)          | 2,237 MB                | 112 MB   |
| Deno Desktop · CEF              | 697 ms (662–1259)          | 412 MB                  | 8         | 0.1%     | 14.8% (n/a³)            | did not start¹          | 470 MB   |

Linux x86_64, 16 CPUs, Xvfb + Mesa lavapipe, 5 cold runs and 3 active runs per host; active load is
20 events/s. The host is shared: its load average was 4–7 during the runs (recorded in the JSON), so
medians of repeated runs limit that noise rather than remove it. Raw data:
`.llm/runs/rfc-gpuix-desktop--rfc/evidence/bench-linux-software.json` and
`threads-linux-software.json`.

² "Non-raster" removes software-rasterizer threads (lavapipe/llvmpipe), which a GPU takes over. It
comes from a separate per-thread run of 10 s (totals 205% and 112%), not from the medians beside it.

³ CEF's compositing runs on its own viz and compositor threads, which thread names do not separate
from other work, so its 15% total already includes its rendering.

⁴ Linux builds as shipped, each carrying only its own host and platform binaries
(`evidence/install-sizes.json`). GPUIX is 133 MB on Windows and 123 MB on macOS, where the addon is
23–24 MB instead of 50 MB.

¹ Concurrent launches of the same CEF app stall at startup here. In three trials of two simultaneous
launches, the second page waited about 10 s twice and never became ready once (120 s budget); with
four, two never became ready (`evidence/cef-concurrent-start.log`). The cause was not isolated.

**What the numbers say.** GPUIX uses one process, about 30% less memory per instance than either web
host, and roughly 35% less total memory with eight instances open than WebKitGTK. Its idle CPU is
low (the 8 ms frame pump). Under load, rasterization dominates on lavapipe (144 of 205%). Even
without it, GPUIX spent about 61%, against about 20% for WebKitGTK and 15% in total (rendering
included) for CEF. Almost all of GPUIX's share is GPUI's UI thread (layout, scene rebuild, and here
software presentation); the JavaScript and host main-thread bucket was 4%. GPUI redraws the whole
window on change, while Chromium repaints damaged regions. This is the main open risk, and gate 1
exists to settle it on real GPUs. Cold start is the one metric where the compiled GPUIX build is
slowest (949 ms against 831 and 697 ms); `deno compile` adds about 150 ms over `deno run`.

<!-- bench-table:end -->

**Reading the numbers.** The container has no GPU. Every host runs on Xvfb with software rendering:
GPUI uses Mesa lavapipe (software Vulkan), and WebKitGTK and CEF use software compositing. That
makes **active CPU** the least representative metric. GPUI redraws the full window when anything
changes, which is its design point on a GPU but expensive on lavapipe. The per-thread breakdown
attributes that cost (see the table note). Memory, process count, idle CPU, parallel scaling and
cold start are much less sensitive to the renderer. The installable's `--bench` mode reran the same
method on a real GPU; see the next section.

### Real GPU: Windows laptop

Lenovo Yoga Book 9i: Windows 11 (build 26300), Intel Core Ultra 7 155U, Intel Graphics (driver
32.0.101.6881), 32 GB, on AC with the Balanced plan, WebView2 157. Same app, same method, run by the
installable's `--bench` mode (`evidence/bench-windows-yogabook9i.json`).

| Metric                             | GPUIX                        | WebView2 (same app)           |
| ---------------------------------- | ---------------------------- | ----------------------------- |
| Cold start, new profile (median)   | 1,075 ms                     | 1,000 ms (first run 3,482 ms) |
| Memory (working set, process tree) | 267 MB, 1 process            | 532 MB, 7 processes           |
| Idle CPU                           | 4.8%                         | 0.5%                          |
| Active CPU, 20 updates/s           | 80.9%                        | 37.2%                         |
| 8 instances                        | 2,143 MB, all ready in 4.3 s | 4 and 8 never started (90 s)  |

Windows reports working sets, which count pages shared between WebView2's processes once per
process, so the real memory gap is smaller than 2×.

A follow-up probe (`poc/bench/windows-probe.ps1`, `evidence/probe-windows-yogabook9i.json`)
attributed the CPU by named thread (GPUIX) and by process type (WebView2) over 10 s:

| Host and screen                   | Total CPU | Where it goes                                                |
| --------------------------------- | --------- | ------------------------------------------------------------ |
| GPUIX · overview, 20 updates/s    | 94.7%     | GPUI UI thread 88.1%, JavaScript main thread 3.3%            |
| GPUIX · settings, 20 updates/s    | 8.9%      | GPUI UI thread 3.0%, JavaScript main thread 3.4%             |
| GPUIX · overview, idle            | 6.9%      | GPUI UI thread 3.1%, JavaScript 2.0%, vsync 1.7%             |
| WebView2 · overview, 20 updates/s | 27.0%     | renderer 15.2%, GPU process 6.9%, host (Deno + service) 2.3% |

Launch types, median of three (window on screen / data on screen). Linux runs one fresh container
per sample (`evidence/first-launch-linux*.log`); Windows uses the same probe.

| Launch                                 | GPUIX Linux    | Webview Linux | GPUIX Windows    | WebView2 Windows  |
| -------------------------------------- | -------------- | ------------- | ---------------- | ----------------- |
| First launch (no code cache, new data) | 273 / 1,179 ms | 79⁶ / 960 ms  | 792 / 1,277 ms   | 2,126 / 2,312 ms  |
| Relaunch with existing data            | 193 / 427 ms   | 66⁶ / 749 ms  | 694 / 1,107 ms   | 3,725 / 4,249 ms⁷ |
| New data, code cache warm              | 186 / 954 ms   | 55⁶ / 814 ms  | 1,211 / 1,794 ms | 971 / 1,277 ms    |

⁶ The webview's native window maps early but stays blank until the page loads; GPUIX's first window
already shows the app shell.

⁷ WebView2 relaunches were slow and erratic in this run (3.3–13.2 s). The probe force-kills every
instance, and individual launches on this machine (four displays, background browser) varied from
under 1 s to 13 s, so treat Windows launch numbers as indicative.

**What the real GPU changes.** The memory, process-count and multi-instance advantages hold on
Windows. Gate 1 fails as written: under 20 updates/s GPUIX used 2.2× the webview's CPU. The probe
locates the cost: app JavaScript (Preact, the service and the SDK) is about 3% on either host, and
GPUI's UI thread accounts for the rest. That thread used 88% on the busy overview and 3% on the
quiet settings screen at the same event rate, so the cost is GPUI's per-frame work when large
visible areas keep changing. Idle CPU (5–7%) comes from GPUIX's 8 ms frame pump on Windows and
Linux; macOS uses display-link wakes and has not been measured yet.

### Real stack: the backend in the box

The numbers above use an in-process service with simulated workers. A second PoC build ships the
real NetScript graph in the same installer and lets the app supervise it, without Aspire: the
scaffolded 0.0.9 workspace (users service on SQLite, workers, sagas, triggers and streams, Garnet).
The app starts the nine processes in dependency order on loopback ports, waits for their health
endpoints, projects discovery (`services__<name>__http__0`) and stops them on exit. Its embedded
service becomes a BFF over typed SDK clients; activity comes from the durable stream and job state
from `workers-api`. The load generator issues real writes and job runs (`users.update`,
`workers.triggerJob`). Everything runs offline from a bundled Deno runtime, a warmed `DENO_DIR` and
a self-contained Garnet (`poc/realstack/`, `poc/scripts/stack-bundle.sh`).

A **GPUIX-first** variant of the same app adds three changes: a native `<virtual-list>` for long
lists, a live-update budget (stream changes committed at most every 250 ms) and an adaptive frame
pump (8 ms while active, 50 ms when idle). The budget is renderer-agnostic, so the webview was also
measured with it.

Linux container, software rendering, medians (`evidence/bench-linux-realstack.json`):

| Variant                 | CPU at 20 updates/s | Host CPU (real stack) | Host idle CPU | Host memory |
| ----------------------- | ------------------- | --------------------- | ------------- | ----------- |
| GPUIX                   | 204%                | 73.8%                 | 3.7%          | 299 MB      |
| GPUIX + 250 ms budget   | 45.6%               | —                     | 1.7%⁸         | 280 MB⁸     |
| GPUIX-first             | 46.0%               | 42.8%                 | 2.5%          | 301 MB      |
| Webview (WebKitGTK)     | 111%                | 77.9%                 | 36.5%         | 418 MB      |
| Webview + 250 ms budget | 70.0%               | 68.2%                 | 33.2%         | 417 MB      |

⁸ Embedded build (no real stack).

"CPU at 20 updates/s" is the embedded build; "Host" columns split the real-stack process tree into
the desktop host (UI, BFF and renderer processes) and the supervised graph. The graph itself costs
the same on every host: 1.37 GB across nine processes, about 35% CPU under this load and 7% idle,
and it is ready 2.7–3.0 s after launch (data on screen at 3.5–3.8 s). Eight real-stack instances
start in 15.3 s with GPUIX and 25.5 s with the webview (12.2 and 13.0 GB).

**What the real stack changes.** The backend, not the renderer, dominates a full NetScript desktop
app's footprint: the renderer choice moves memory by about 120 MB out of 1.7 GB. The update budget
is the CPU lever, and it helps GPUIX far more than the webview, because GPUI redraws the window for
every commit while the browser compositor invalidates only what changed. With the same budget, GPUIX
used about 35% less host CPU than the webview here. Whether that holds on a real GPU decides gate 1;
the laptop rerun is pending.

Upstream findings from this work: the 0.0.9 workers, sagas and triggers schemas do not migrate on
SQLite; the AppHost wires no plugin references into services, so the scaffold's record-activity
publisher never gets the streams URL; `workers.subscribe` on a Garnet KV sends only its initial
snapshots; `netscript deploy build` emitted an empty graph; and processes started by a
`deno desktop` app inherit `DENO_SERVE_ADDRESS` and bind the window's port.

## Guide-level explanation

A desktop app opts in with one entry point and keeps its contracts, service and SDK code:

```tsx
// desktop/main.tsx
import { render } from '@netscript/desktop-native';
import { createNativeHost } from '@netscript/desktop-native/host';
import { startWorkspaceService } from '../services/workspace/embedded.ts';
import { App } from '../ui/app.tsx';

const host = await createNativeHost({ appId: 'dev.acme.studio' }); // data dir, KV, credentials
const service = await startWorkspaceService({ kvPath: host.dataPath('service.kv') });
render(<App host={host.connect(service.url)} />, {
  title: 'Acme Studio',
  width: 1320,
  height: 860,
});
```

Views use the shared primitives (`Box`, `Text`, `Button`, `TextInput`, `Badge`, `Progress`,
`Scroll`) from a fresh-ui native collection. The same tree renders to GPUIX natively and to the DOM
in a browser or webview, so a team can keep one component layer for web and desktop:

```bash
netscript ui:add native --app studio           # primitives + token data
netscript deploy desktop package --renderer gpuix --target all
```

Data access is unchanged: `createServiceClient` for typed calls, `createFetchStreamEventSourceV1`
for durable streams, `@netscript/kv` for local state. The host supplies credentials as a bearer
contribution, because there is no browser cookie jar.

## Reference-level explanation

| Proposed surface            | Placement / archetype                                               | Content                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/desktop-native` | New package, Archetype 2 (integration)                              | Preact host renderer over `@gpuix/native/host` (from the PoC adapter), `render`/`createRoot`/`useNative` (the PoC's `useGpuix`), the `NativeHost` port (fetch + credentials, settings over `@netscript/kv`, native capabilities with feature detection), exact-pinned `@gpuix/native`. |
| fresh-ui native collection  | `@netscript/fresh-ui` registry collection                           | Primitives that render to GPUIX or DOM from token data; the CSS-to-style translation stays in the DOM branch. Tokens are emitted as values as well as CSS variables.                                                                                                                   |
| Native credentials          | `@netscript/plugin-auth-core/sdk` (RFC 0001 bearer factory)         | Adopt the existing bearer contribution for native hosts; better-auth bearer plugin server-side. No new SDK surface.                                                                                                                                                                    |
| Auto-update adapter         | `@netscript/sdk/auto-update`                                        | A `NativeAutoUpdate` implementation for non-`deno desktop` hosts (NetScript release server and GitHub Releases; ed25519 verification reused).                                                                                                                                          |
| Packaging backend           | `netscript deploy desktop package --renderer gpuix` (Archetype 6/7) | `deno compile` per target with the platform addon staged, then app/dmg, NSIS/MSI, AppImage/deb bundling (PoC: `scripts/package.sh`). `cargo-packager` is the alternative to evaluate.                                                                                                  |
| Service seams               | `@netscript/service`                                                | Align the builder's default RPC path with the SDK, and document the reserved headers.                                                                                                                                                                                                  |

The embedded service keeps the runtime choice local: on Deno it uses `Deno.serve` and Deno KV, and
it migrates with the rest of NetScript. The renderer package must not import Deno-only APIs.

**Publishing and consumer constraints.** `@netscript/desktop-native` would be a JSR package that
depends on an exact-pinned npm package (`@gpuix/native`), whose per-platform binaries arrive as
optional npm dependencies. JSR carries no native code, and upstream types are re-exported through
package-owned structural types, as `@netscript/service` already does for Hono and oRPC, so the JSR
surface stays plain TypeScript. These constraints follow:

- On Deno, consumers need a local `node_modules` (`nodeModulesDir: "auto"`) and FFI permission
  (`--allow-ffi`), because Deno loads Node-API addons only from a `node_modules` directory. On Bun
  and Node it is an ordinary npm dependency.
- `deno compile --target` installs the target platform's binary into `node_modules`, and every later
  build embeds the whole npm resolution (`--exclude` does not remove it). The packaging backend must
  therefore prune the other platforms' binaries before each target build. The PoC's
  `scripts/package.sh` does this.
- The jsr-audit gate applies when the package is implemented. This RFC publishes nothing.

## Drawbacks

- **Upstream maturity.** GPUIX is pre-1.0 (0.11.0, about nine months old) with a single principal
  maintainer, and it renders through a pinned GPUI fork. The PoC hit API drift between the release
  and `main` (`isUniversalProp`, event naming, clipboard, notifications).
- **Views must be rewritten.** There is no HTML or CSS, so fresh-ui components and third-party DOM
  widgets don't carry over, and GPUI has no inline text formatting. Logic, state, contracts and data
  access carry over.
- **No embedded web content.** OAuth and documentation pages need the system browser plus a loopback
  or deep-link callback.
- **Platform gaps.** No Intel macOS. Linux binaries need glibc 2.39. Accessibility is an ARIA subset
  over AccessKit. There is no tray, and 0.11.0 has no clipboard or notifications.
- **CPU under frequent updates.** On a real GPU, GPUIX used 2.2× the webview's CPU at 20 updates/s,
  almost all on GPUI's UI thread, and 5–7% at idle on Windows from its frame pump. VMs, RDP and CI
  without a GPU also pay software rasterization on top.
- **Binary size.** GPUIX is larger than the webview build: 172 MB on Linux (the Deno runtime plus a
  50 MB addon) against 90 MB for the webview build, and smaller than CEF at 470 MB. Both require
  bundling before compiling: `deno compile` embeds the project's whole npm resolution, which reached
  915 MB once the plugin contracts were imported. Shipping the real backend adds a Deno runtime, a
  dependency cache and Garnet (about 0.8 GB unpacked, mostly the npm cache).

## Rationale and alternatives

- **Keep `deno desktop` only:** best feature coverage today, but tied to the Deno EOL. Retained as
  the default during incubation.
- **Electron / CEF:** Chromium per app (8 processes, 470 MB here); Node-hosted, with a heavy
  footprint.
- **Tauri / Electrobun:** the webview stays, the UI stays in a separate process with IPC, and Tauri
  adds a Rust shell.
- **`preact/compat` + `@gpuix/react`:** impossible (React internals). **`@gpuix/solid`:** a
  different component model from the rest of NetScript.
- **Blitz (HTML/CSS on the GPU):** would keep Fresh markup, but it is a browser-engine project at an
  earlier stage.
- **Fresh 3 native render target:** desirable later, but blocked on Fresh 3 stability; listed under
  future possibilities.

## Breaking changes and migration

None: the track is additive and opt-in. Apps that adopt it move their views onto the primitives
collection, replace window-bound RPC with direct SDK calls, and switch desktop credentials to the
bearer contribution.

## Prior art

Zed (GPUI), React Native and NativeWind (non-DOM renderers, class-to-style compilation), Hyperview
(server-driven native UI), NetScript's Expo work (#2100: the DOM-free stream consumer) and RFC 0001
(typed SDK client contributions).

## Decision gates (incubating → recommended)

1. A real-GPU benchmark (`NetScript --bench`) on Windows and macOS laptops shows active CPU at or
   below the webview baseline, and that memory and parallel-instance gains hold. **Status:** memory
   and multi-instance gains hold on one Windows laptop; active CPU does not (81% against 37%). The
   path to passing is: coalesce data-driven UI updates to a frame budget in the runtime (live feeds
   rarely need more than 10 Hz), virtualize long lists, and upstream two GPUIX changes, namely
   incremental rendering of unchanged subtrees and an event-driven frame pump on Windows and Linux.
   Then re-measure on Windows and Apple Silicon. The PoC's GPUIX-first variant implements the first
   two plus an adaptive pump in the host renderer; on Linux it brings GPUIX below the webview under
   the same budget (46% against 70%; with the real stack 43% against 68% host CPU). The real-GPU
   rerun decides the gate.
2. GPUIX publishes a release that includes clipboard and notifications, and the project agrees an
   upgrade policy (exact pins; vendor or fork if upstream stalls).
3. Accessibility reaches an agreed bar: keyboard navigation and screen-reader smoke tests on macOS
   and Windows.
4. The packaging backend reaches parity for signing and notarization, plus auto-update.

## Unresolved questions

- Should production native apps host on Bun (GPUIX's primary runtime, `bun build --compile`) or on
  Deno until the migration?
- `deno compile` or `cargo-packager` for packaging?
- How far should NetScript go in owning a GPUI fork if upstream stalls?
- Can GPUIX render unchanged subtrees incrementally, or must apps budget their update rate? This
  decides whether gate 1 is an upstream fix or a framework convention.
- Should the primitives collection become the default component layer for web as well?
- Should the live-update budget be a framework default (SDK stream consumer or signals layer) for
  every host, given that it also lowers the webview's CPU?
- How should a desktop app ship its backend: a supervised graph of processes as in the PoC, the
  single-executable packaging tracked by epic #830, or each node bundled with `deno bundle` and run
  by one shared runtime (which would drop most of the dependency cache)?

## Future possibilities

A Fresh 3 native render target (route modules rendered in-process), multi-window hosts, the GPUIX
browser (WebGPU) and terminal targets for the same primitives, and Rust custom elements
(`register_custom_element`) for charts or canvases.
