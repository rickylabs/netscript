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

This RFC is backed by a working proof of concept (PoC), a benchmark, and installable builds:
`.llm/runs/rfc-gpuix-desktop--rfc/` (research, evidence, PoC source).

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
3. **Measured resource gains.** One process instead of three (WebKitGTK) or eight (CEF), about 30%
   less memory per instance, and better parallel-instance scaling (see the benchmark below).
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
cold start are much less sensitive to the renderer. The installable's `--bench` mode reruns the same
method on real hardware, and those results are a decision gate.

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
- **Software-rendering cost.** VMs, RDP and CI without a GPU pay full-frame rasterization on every
  update (see the active-CPU result).
- **Binary size.** GPUIX is larger than the webview build: 185 MB on Linux (the Deno runtime plus a
  50 MB addon; 133 MB on Windows, 123 MB on macOS) against 112 MB for the webview build, and smaller
  than CEF at 470 MB. Downloads with both hosts are 57–94 MB.

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
   below the webview baseline, and that memory and parallel-instance gains hold.
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
- Should the primitives collection become the default component layer for web as well?

## Future possibilities

A Fresh 3 native render target (route modules rendered in-process), multi-window hosts, the GPUIX
browser (WebGPU) and terminal targets for the same primitives, and Rust custom elements
(`register_custom_element`) for charts or canvases.
