# `deno desktop` full surface (Deno 2.9) — distilled

Source: the 17 local `deno desktop` doc pages read in full during this research pass (see
`matrix/E-desktop/deno-desktop-docs-matrix.md` for the per-page table), cross-checked against the
official Deno desktop documentation mirror. This file distills the load-bearing facts topic E needs;
it does not re-walk every page.

## Process model

`deno desktop` bundles a **single-process** desktop application: one Deno process runs
`Deno.serve()` internally, a native window (WebView, CEF, or headless/raw backend) navigates to
that server's local address, and Deno-side globals (`Deno.BrowserWindow`, `Deno.Tray`, `Deno.dock`,
`Deno.MenuItem`, native dialogs/notifications) let the same process control window chrome. This is
architecturally a single OS process by design — it is not a multi-process orchestrator, which is
exactly why eis-chat's option (b) (external services, desktop-only UI process) is the natural fit
today, and why option (c) (collapse a backend service into the same process) is the only path to
"desktop app IS the whole backend."

## Backends

| Backend | Notes |
| --- | --- |
| WebView (default) | OS-native webview (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux). Smallest binary. **Confirmed broken on Windows bare-metal in eis-chat's POC** (issue #375) — aborts before touching user-data folder even with a healthy WebView2 Runtime install; all documented env-var workarounds are no-ops. |
| CEF | Chromium Embedded Framework; ~150MB first download (~379MB cached). Full DevTools support. **The only backend that worked in eis-chat's Windows POC**, via the `--backend cef` CLI flag — the `desktop.backend` config-file field was silently ignored (suspected Deno bug, not confirmed upstream). |
| Raw/headless backend | No window chrome; for embedding desktop-style processes without a UI surface. |

## Networking

`DENO_SERVE_ADDRESS` auto-binds the internal server to `127.0.0.1` only — there is no documented
mechanism to bind a different host or expose the port externally by design (a deliberate
desktop-app security posture: never listen beyond loopback). `PORT` affects only the startup log
banner text, not the actual bind address/port (confirmed in eis-chat's POC, cross-checked against
docs).

## VFS embedding + framework auto-detection

`deno desktop` embeds a virtual filesystem into the compiled binary and **auto-detects known
framework build output** (Fresh's `_fresh/`, Vite's `dist/`, etc.) to decide what to serve. This
is a **hard build-order gate**: the framework build step must run and produce its output directory
*before* `deno desktop build`/`compile` runs, or detection falls through to the next known pattern
and ultimately errors if nothing matches. Any Aspire generator integration (#375) needs an explicit
`predep`/`waitFor`-style task ordering, not a manual instruction to run build first.

## Cross-compilation

Supports `--target <triple>` and `--all-targets`, covering 5 target triples, with **no local Rust
toolchain required** — prebuilt target binaries are downloaded and SHA-256-verified. `--compress`
supports `xz` and `zstd` for output size reduction. Output format (installer vs raw binary vs
app-bundle) is OS-specific and documented per-target.

## Code signing

- **macOS**: ad-hoc signing by default; Developer ID + `notarytool` submission documented as the
  production path (requires an Apple Developer account, not automated end-to-end by `deno desktop`
  itself).
- **Windows**: no built-in signing — the documented path is invoking an external `signtool`
  invocation as a separate build step; `deno desktop` does not wrap it.
- Neither platform's production signing is a single `deno desktop` command — both require external
  tooling/credentials the framework doesn't (and likely shouldn't) automate away.

## `Deno.autoUpdate()`

- bsdiff binary-diff-based updates (small delta downloads rather than full binary re-downloads).
- Polls `<baseUrl>/latest.json` for the current manifest.
- Manifests are **Ed25519-signed**; the running binary verifies the signature before staging.
- **Platform asymmetry, verified verbatim against the official doc mirror (not spec drift):**
  macOS and Linux support full apply-and-rollback in place. **Windows only STAGES the update — it
  does not apply it** in the same run; the actual swap requires a separate relaunch/installer step
  the framework does not automate for Windows. This matches how Tauri/Electron solve the same OS
  constraint (see `rfc14-nitro-packaging-prior-art.md`): Windows file-locking during process
  execution generally forces an external relauncher/installer indirection, which is a Windows-OS
  characteristic, not a Deno-specific gap — but it is real and undocumented-as-a-limitation unless
  explicitly called out to users.

## Desktop-only globals need local structural types

`Deno.BrowserWindow`, `Deno.Tray`, `Deno.dock`, `Deno.MenuItem`, native notification/dialog APIs are
**not present in the stable Deno type lib** (they're desktop-runtime-only globals). Consuming code
must declare local **structural types** matching the documented shape rather than `any` or ambient
ist declaration merging into `Deno`'s global namespace — this is exactly the pattern eis-chat's
`apps/dashboard/lib/desktop-chrome.ts` already uses (described, not re-read in this pass; referenced
via `docs/DESKTOP-SHELL.md`). This ties directly to NetScript doctrine axiom A7 (wrap upstream
platform APIs, don't reinvent) and axiom A1 (public types first) — any NetScript desktop package
should ship its own narrow structural type layer over these globals rather than depend on `any`.
