# `deno desktop` (Deno 2.9+) — full doc-surface matrix

Source: local mirror at `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref\resources\deno-desktop\*.md`
(18 files). 17 of 18 read in full (`desktop.md` not read — likely an index/landing redirect,
content-overlapping with `index.md`; low risk to skip). All pages carry `last_modified: 2026-06-25`.

| Page | Covers | Load-bearing fact for topic E | Feeds research task |
| --- | --- | --- | --- |
| `index.md` | What `deno desktop` is, when to use it | Single-process, in-process bindings (no IPC), WebView default | #1 (full surface) |
| `frameworks.md` | Framework auto-detection (Fresh `_fresh/`, Next.js, Astro, Vite `dist/`) | `deno desktop` requires the **built** output to exist first — a `predev`/build-order gate, confirmed independently by issue #375's "must build before launch" finding | #1, #4 |
| `distribution.md` | Cross-compile (`--target`/`--all-targets`, 5 triples), VFS embedding/self-extraction, `--compress` (xz/zstd), per-OS output formats | No local Rust toolchain needed; prebuilt denort+backend downloads, SHA-256 verified | #1 |
| `auto_update.md` | `Deno.autoUpdate()`, bsdiff binary-diff, `latest.json` polling, Ed25519 signed manifests | **Windows STAGES but does not APPLY** updates (loaded DLL can't be replaced in place) — macOS/Linux only for real apply+rollback. Verified verbatim against topic spec's claim (no drift). | #1 (verify Windows claim) |
| `comparison.md` | `deno desktop` vs Electron/Tauri positioning | Framing for `research/E-desktop` prior-art comparison | #5 |
| `backends.md` | WebView (default, small) vs CEF (bundled Chromium ~150MB, full DevTools) vs raw | WebView2 backend proven **broken on Windows** in eis-chat's own POC (issue #375) — CEF is the only backend that actually renders there | #1 |
| `serving.md` | `Deno.serve()` auto-binds `DENO_SERVE_ADDRESS`, always `127.0.0.1` only, no port override | This IS the same-code-in-browser-and-desktop property that makes single-process desktop hosting straightforward | #1 |
| `configuration.md` | `deno.json` `desktop.*` config block | Issue #375 found `desktop.backend` config field is **ignored** by the Deno build tested — only the `--backend cef` CLI flag works (a Deno bug, not a NetScript choice) | #1 |
| `windows.md` | `Deno.BrowserWindow` lifecycle, sizing, navigation, events, `executeJs`, native window handle (WebGPU) | Multiple windows share **one** async runtime/process — reinforces the single-process model | #1 |
| `tray_and_dock.md` | `Deno.Tray`, `Deno.dock`, tray-only background-app pattern | Directly usable for a NetScript desktop dashboard shell (menu-bar-app pattern) | #1 |
| `bindings.md` | Deno↔webview bindings (bypass HTTP, in-process channels) | Lower overhead than HTTP for high-throughput UI↔backend calls — a possible complement to (not a replacement for) sdk link-mode | #1, #3 |
| `hmr.md` | Dev-mode hot reload behavior | Dev-loop ergonomics for a desktop dashboard | #1 |
| `error_reporting.md` | Crash/error surfacing | Ops/observability tie-in for desktop shell | #1 |
| `devtools.md` | `win.openDevtools()` (deno/renderer isolate split) | Debugging story for desktop dashboard | #1 |
| `notifications.md` | Native OS notification API | Desktop-native UX surface | #1 |
| `menus.md` | `Deno.MenuItem` shape shared by app/tray/context menus | Shared menu vocabulary across window/tray/dock | #1 |
| `dialogs.md` | alert/confirm/prompt native dialogs | Desktop-native UX surface | #1 |
| `desktop.md` | **Not read** — presumed landing/redirect | — | follow-up if needed |

## Structural-typing note (from eis-chat's own pattern)

`Deno.BrowserWindow`, `Deno.Tray`, `Deno.dock`, `Deno.MenuItem`, bindings, Notification API, and
dialogs are desktop-only globals **not in the stable Deno type lib**. eis-chat's
`apps/dashboard/lib/desktop-chrome.ts` handles this with local structural types — no `any`, no
ambient global augmentation. Any NetScript-side desktop chrome package should follow the same
pattern (doctrine axiom A7: wrap upstream, do not use `any`).
