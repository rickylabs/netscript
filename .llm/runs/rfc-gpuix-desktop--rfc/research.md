# Research — GPUIX as NetScript's native desktop renderer

Run `rfc-gpuix-desktop--rfc` · 2026-11-09 · generator Claude Opus 5.5 · evidence under `evidence/`,
PoC under `poc/`.

## Context

- **Deno runtime end of life.** Deno's team joined Cloudflare (announced 2026-10-09); runtime
  development stops roughly one year later (≈ October 2027), Deno Deploy shuts down ≈ six months
  after the announcement, JSR continues. Owner decision: keep the Deno stack now, prepare a gradual
  migration.
- **NetScript desktop today** = `deno desktop` (Deno 2.9) with the `webview` backend: a Fresh/Preact
  frontend in the OS webview, `@netscript/fresh/desktop` binding the oRPC router to
  `Deno.BrowserWindow`, `@netscript/sdk/desktop` (MessagePort oRPC client),
  `@netscript/fresh-ui/desktop` chrome, `@netscript/sdk/auto-update` (wraps `Deno.autoUpdate`), and
  `netscript deploy desktop package|release` (wraps `deno desktop` formats). Every one of these
  depends on Deno-only desktop surfaces — the most exposed part of the stack under the EOL.
- **GPUIX** (`remorses/gpuix`, Apache-2.0, created 2026-01-29, `0.11.0` on 2026-10-20, ≈2.9k stars,
  ≈85 % of commits by one maintainer): React and Solid bindings for a pinned fork of Zed's GPUI.
  A Rust retained element tree receives batched JSON mutations (`applyBatch`) over Node-API; JS
  pumps GPUI with `renderer.tick()` (display-link wake on macOS, 8 ms timer elsewhere). Metal /
  DirectX 11 / Vulkan; browser (WebGPU) and terminal (kitty) targets exist. Platforms: macOS arm64
  (no Intel), Windows x64/arm64, Linux x64 glibc ≥ 2.39.

## Q1 — Preact through the compat layer?

**No.** `@gpuix/react` depends on `react-reconciler@0.33`, which reads React's private
`__CLIENT_INTERNALS_…` dispatcher at module load. With `react` aliased to `@preact/compat` it throws
before rendering: `TypeError: undefined is not an object (evaluating 'ReactSharedInternals.S')`
(Bun 1.4.4; `evidence` log in worklog). A compat layer cannot supply React's fiber internals.

**Yes, natively.** GPUIX exposes a framework-neutral host layer (`@gpuix/native/host`: mutation
queue, renderer state, event registry) that its Solid adapter already uses. `poc/packages/gpuix-preact`
(≈ 500 LOC) is a small DOM facade Preact diffs against (`createElementNS`/`createTextNode`,
`insertBefore`, `removeChild`, sibling pointers, `style[k]=`, `setAttribute`, `addEventListener`,
`text.data`), translated to GPUIX mutations and flushed once per Preact commit
(`options.__c`). Preact 10 needs a global `document` facade (installed only when no DOM exists);
Preact 11 uses `parentDom.ownerDocument`. `@preact/signals` works unchanged.

Adapter findings worth upstreaming:

| Finding | Consequence |
| --- | --- |
| No inline formatting context: `{a} · {b}` becomes three stacked blocks | Primitives join primitive text runs; an adapter-level text-run merge is a follow-up. |
| `display` honours only `flex`/`grid` (no `none`); `lineHeight` is absolute px | Conditional rendering instead of `display:none`; tokens carry px line heights. |
| Published 0.11.0 lacks `isUniversalProp`, generic `on*` events, clipboard and OS notifications (all on `main` after the release) | Feature-detect; pin exact versions; expect API churn per minor. |
| Event names are lowerCamel of the prop (`onMouseEnter` → `mouseEnter`) | Preact's `name.slice(2)` + lower-first maps 1:1. |

## Q2 — Connection to the NetScript ecosystem

The decisive property: **the UI, the service, the SDK client, the stream consumer and KV run in one
process.** The webview boundary — and the `@netscript/fresh/desktop` ↔ `@netscript/sdk/desktop`
MessagePort RPC built to cross it — disappears.

| NetScript surface | Status in the PoC | Notes |
| --- | --- | --- |
| `@netscript/service` (`createService().withAuthn().withRPC().withHealth().build()`) | ✅ embedded on loopback | `build()` returns a mountable `fetch` app. **Papercut:** builder default RPC path `/api/rpc` ≠ SDK default `/api/rpc/v1/<routerName>`; fixed with `buildServiceRpcPath()`. |
| `@netscript/sdk/client` (`createServiceClient` + `resolveServiceUrl` + contributions) | ✅ typed oRPC | Same client works against a remote, Aspire-hosted service. |
| `@netscript/sdk/streams/consumer` (`createFetchStreamEventSourceV1` + `bindStreamEventSourceV1`) | ✅ live activity + jobs | The DOM-free consumer from the Expo work (#2100) is exactly what a native host needs. Offset resume verified. |
| `@netscript/kv` (`DenoKvAdapter`) | ✅ settings, cookie jar, persisted mutations | Survives restart (integration test). |
| Auth (cookie sessions) | ⚠️ bridged | The SDK **reserves `cookie`** (browser forbidden-header semantics) — correct for browsers, but a non-browser host has no jar. The native host captures `Set-Cookie` and sends the session as `Authorization: Bearer`; the service accepts either. Production path: RFC 0001's `@netscript/plugin-auth-core/sdk` bearer factory + better-auth bearer plugin. |
| `@netscript/fresh/desktop`, `@netscript/sdk/desktop` | ➖ obsolete for this host | In-process calls replace window-bound RPC. |
| `@netscript/sdk/auto-update` | ⚠️ needs an adapter | Wraps `Deno.autoUpdate`, absent outside `deno desktop`. Its `NativeAutoUpdate` port is the seam; GPUIX ships `checkUpdate` (GitHub Releases). |
| `@netscript/fresh-ui` | ⚠️ tokens port, CSS does not | Token presets are data; components are CSS. A native primitives kit is required (PoC `app/ui/primitives.ts`, one tree rendering to GPUIX or DOM). |
| `netscript deploy desktop package|release` | ⚠️ needs a backend | Wraps `deno desktop` formats. PoC packages with `deno compile` + per-OS bundling (`scripts/package.sh`). |
| Fresh routes | ⚠️ pattern reusable | Fresh-3-shaped route modules (middleware → handler `{data}` → page in layout) drive the PoC's in-process router. See Fresh analysis below. |
| Telemetry, workers/sagas/triggers/streams plugins | ✅ unchanged | Server-side; the desktop consumes them through the SDK/streams. |

Runtime portability (the post-Deno story): the same `gpuix-preact` source runs unchanged on
**Deno 2.9.7, Bun 1.4.4 and Node 24** (`evidence/screens/runtime-sheet.png`). The Deno-coupled part
of a native NetScript desktop app is the *embedded service* (`Deno.serve`, Deno KV) — the same
surface the general migration must solve anyway — not the desktop UI.

## Fresh 2.x vs 3.x

- **Unchanged Fresh pages on GPUIX: not feasible in either.** Hydration is not the blocker (the
  facade can expose `childNodes`/`localName`/`nodeType`, which is all Preact's hydrate needs, and
  in-process hydration is pointless). CSS is: GPUIX has no selectors, cascade, custom properties,
  media queries, `rem`/`calc`, pseudo-elements. Running HTML+CSS natively is a browser engine
  (Blitz territory), not GPUIX.
- **Fresh 2.x:** render is inline in `ctx.render()` (`renderToString(appVNode)`); no renderer seam.
  A native target means forking or bypassing Fresh. Deno-only.
- **Fresh 3.x (alpha, `freshframework`, Vite 8 + Nitro 3, runtime-agnostic, Preact 11):** clean
  seam — generated route modules call `freshHandler(handler, page, middlewares, layouts)`; handler
  returns `{data}`; page+layouts fold into one `inner` VNode before `renderPage(inner)`. A native
  target = an alternative `renderPage` + a Vite environment. Its browser-wire features (SSR signal
  markers, `f-s`/`f-eh`, devalue-serialized handlers) are simply unnecessary in-process.
- PoC spike: `poc/app/client/router.ts` runs Fresh-3-shaped route modules (auth middleware,
  handlers, pages in a layout) into GPUIX in-process.

## Feature completeness (PoC host vs webview host)

| Capability | GPUIX host (0.11.0) | Deno Desktop webview |
| --- | --- | --- |
| Window, title, resize, min size | ✅ | ✅ |
| Native file/folder picker | ✅ `promptForPaths` | ✅ dialogs |
| Clipboard | ❌ in 0.11.0 (✅ on `main`) | ✅ |
| OS notifications | ❌ in 0.11.0 (✅ on `main`); PoC falls back to in-app toast | ✅ |
| Tray / app menu | ⚠️ app menu only (`app_menu.rs`), no tray | ✅ tray + menus |
| Auto-update | ⚠️ `checkUpdate` (GitHub Releases); NetScript adapter needed | ✅ `Deno.autoUpdate` |
| Packaging formats | ⚠️ `deno compile` binary + hand-built app/zip/NSIS (PoC); cargo-packager upstream | ✅ app/dmg/AppImage/deb/rpm/msi |
| Accessibility | ⚠️ AccessKit via GPUI, ARIA subset (no `aria-invalid/required/modal/current/haspopup`) | ✅ full platform a11y tree |
| Text input / IME / selection | ✅ native GPUI editor input | ✅ |
| CSS, HTML, third-party DOM widgets | ❌ (style objects, flex + limited grid) | ✅ |
| Embedded web content (OAuth pages, docs) | ❌ — use system browser + loopback/deep link | ✅ |
| Markdown, code highlight, diff, virtual list, motion | ✅ native elements | via libraries |
| Devtools | ⚠️ automation tree, frame overlay | ✅ (CEF) |
| HMR | ⚠️ Bun `--hot` remount only | ✅ |
| Multi-window | ⚠️ one renderer per window | ✅ |
| fetch, WebSocket, SSE-over-fetch, Web Crypto, Intl, Workers | ✅ (full runtime) | ✅ (browser) |
| Cookies | ⚠️ host-owned jar → bearer | ✅ browser jar |
| Persistent storage | ✅ Deno KV / filesystem | ✅ localStorage/IndexedDB |
| Durable streams (NetScript) | ✅ fetch consumer | ✅ |
| Runtime portability (post-Deno) | ✅ Deno / Bun / Node | ❌ Deno-only |
| Intel macOS | ❌ | ✅ |

## Benchmarks

See `evidence/bench-linux-software.json` (final run) and `-run1.json`, method in
`poc/bench/runner.ts`, per-thread CPU in `evidence/threads-linux-software.json`, and the RFC for the
interpreted table. Environment caveat: no GPU on the N5 — Xvfb + Mesa lavapipe; every host pays
software rasterization. The installable's `--bench` mode reruns the identical method on real GPUs.

## Installables

`deno compile` embeds the napi addon and cross-compiles. The platform `.node` is staged next to
`@gpuix/native`'s loader while compiling. Verification: Linux tarball runs (ready 880 ms); macOS
arm64 binary and addon carry valid ad-hoc signatures (0/48 648 page-hash mismatches after Deno's
`__SUI` injection); Windows `.exe` under Wine boots Deno, extracts the app, loads the Windows addon
and reaches `gpui_windows` — failing only at DirectX renderer creation (no D3D11 in Wine), i.e.
verified to the GPU boundary. Artifacts: `~/projects/netscript/artifacts/gpuix-poc/` (+ SHA256SUMS).
