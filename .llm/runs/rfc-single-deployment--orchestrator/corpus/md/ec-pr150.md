# eis-chat POC lineage digest

## PR #150 — Prototype full-stack Windows singleton desktop deployment
- state: closed, merged: 2026-07-16T12:14:42Z, base: master, head: 8cdedd307a646cfb217e9e2b1928fac8467dc405
- url: https://github.com/rickylabs/eis-chat/pull/150

## Outcome

This draft proves a complete no-Docker Windows `--singleton` deployment around Deno Desktop. The native window directly supervises the adjacent service graph—no PowerShell trampoline—and the packaged app has been exercised through chat streaming, persistence, knowledge ingestion, offline image OCR, and Aspire telemetry.

The experiment is intended as an executable companion to the NetScript deployment work: it identifies which behavior belongs in a future `deploy.targets.windows.singleton` implementation and which remaining fixes belong in Fresh/NetScript.

## Current status

| Area | Status |
| --- | --- |
| Deno Desktop window | Working on Deno 2.9.3+ |
| Direct sidecar launch | Working; no PowerShell and no Docker |
| Full service graph | Working; Garnet plus six compiled Deno processes |
| Browser/server service discovery | Working; runtime and `VITE_*` values derive from one map |
| Persistent storage | Working under `%LOCALAPPDATA%\eis-chat` |
| Chat stream/hydration | Working after Markdown and Preact identity fixes |
| Text KB ingestion | Working |
| Offline Tesseract image OCR | Working; semantic retrieval still requires an embedding provider |
| Aspire logs/traces/metrics | Working over OTLP HTTP/protobuf |
| Timestamped output | Working through Temporal |
| MSI containing adjacent sidecars | Not implemented; requires a Desktop packaging hook or second installer pass |
| Crash restart / Windows Job Objects | Follow-up |

## Packaged graph

| Resource | Endpoint | Packaging/readiness |
| --- | --- | --- |
| Deno Desktop dashboard | dynamic loopback port | CEF desktop output |
| Garnet | `127.0.0.1:6379` | pinned `garnet-server` tool, TCP probe |
| streams | `127.0.0.1:4437` | compiled Deno sidecar, HTTP readiness |
| workers API | `127.0.0.1:8091` | compiled Deno sidecar, HTTP readiness |
| workers | background process | compiled Deno sidecar, process readiness |
| eischat | `127.0.0.1:3001` | compiled Deno sidecar, HTTP readiness |
| legacy-archeology MCP | `127.0.0.1:8095` | compiled Deno sidecar, HTTP readiness |
| Excalidraw MCP | `127.0.0.1:8096` | compiled Deno sidecar, HTTP readiness |
| optional Aspire dashboard | `127.0.0.1:18888` | bundled Aspire CLI 13.4.6; OTLP on 4317/4318 |

The supervisor strips inherited Desktop-only `DENO_*` process state, writes per-resource stdout/stderr plus a non-secret environment audit, waits for readiness, and terminates children in reverse order.

## Packaging, discovery, and storage

- `deno task deploy:windows-singleton` creates `dist/windows/eis-chat-singleton-YYYYMMDDTHHMMSSZ`; Temporal supplies the UTC timestamp.
- `EISCHAT_WINDOWS_SINGLETON_OUTPUT_DIR` may select an explicit child of `dist/windows` for automation.
- Runtime `services__<name>__http__0` values and browser `VITE_services__...` / `VITE_<NAME>_URL` values come from one service map. Build-time injection is required because `import.meta.env` cannot be repaired at launch.
- SQLite is the persistent catalog and per-channel data store. Deno Desktop uses its stable app identity for `Deno.openKv()` provider settings. Garnet is the Redis-compatible cache/runtime dependency; it is not the primary database and does not hold provider keys.
- All mutable data and logs live below `%LOCALAPPDATA%\eis-chat`; timestamped application directories remain read-only and replaceable.

## Aspire telemetry

`eis-chat-singleton-observed.cmd` starts the bundled NativeAOT Aspire CLI 13.4.6 dashboard with its documented frontend, OTLP/gRPC, OTLP/HTTP, anonymous-local, config-path, and browser-CORS variables. The package needs neither Docker, an installed .NET runtime, nor a system Aspire installation.

Deno telemetry activation is supplied during both `deno compile` / `deno desktop` and launch. This matters because compiled executables serialize `OTEL_DENO`, tracing, metrics, console capture, and propagator activation into runtime metadata. Each process receives its own `OTEL_SERVICE_NAME` and exports to `http://127.0.0.1:4318` using `http/protobuf`. Logs, metrics, and correlated traces were observed from the desktop and every Deno sidecar without a JavaScript OTel SDK.

This is Aspire standalone mode. It provides logs, traces, and metrics but intentionally has no AppHost resource service, so the Resources graph and AppHost console surfaces are unavailable. The singleton supervisor remains the process authority and records the graph in `desktop-supervisor.log`.

## Markdown improvement

The chat renderer no longer uses `react-markdown`. It drives the existing unified/remark/rehype pipeline directly and renders with `rehype-react` configured for Preact's JSX runtime.

- preserves streaming, GFM, math/KaTeX, highlighting, citations, URL filtering, and sanitization
- removes the React wrapper and compat boundary
- reduced the client Markdown chunk from 200,151 to 176,118 raw bytes (24,033 bytes, about 12%)

Framework follow-up: https://github.com/rickylabs/netscript/issues/783

## Fresh/Vite production identity finding

Fresh 2.3.3 / `@fresh/plugin-vite` 1.1.2 already owns React-compat aliases and disables dependency discovery, so the Fresh 2.3 pre-bundling fix is active. A clean Windows production build still resolves the same installed `preact/hooks` and Signals files through both `C:/...` and `C:\...` final IDs. Rollup then emits two hook runtimes and hydration fails with `TypeError: options.__ is not a function`.

Configuration-only variants were retested: `resolve.dedupe`, import-map pins, browser conditions, and declarative aliases did not merge the final slash variants. The working build therefore retains one narrow temporary resolver that delegates normal resolution and applies Vite `normalizePath()` only to Preact IDs. There are no custom Babel/CJS passes or Markdown bundle transforms. The clean failure and the removable framework-level fix are tracked in:

- https://github.com/rickylabs/netscript/issues/782
- related Vite path report: https://github.com/vitejs/vite/issues/22264

The generic versioned-`npm:` aliases are a separate cold Deno-resolution compatibility requirement found by Linux CI.

## Runtime/upstream findings

- Deno 2.9.3+ contains the merged Windows GUI child-process fix required for direct sidecars: https://github.com/denoland/deno/issues/35994
- sidecars use `--node-modules-dir=none --exclude-unused-npm`; experimental bundling cannot currently resolve the dynamically selected libSQL native package
- Garnet is staged from `garnet-server` 1.1.10; Docker Desktop is not required
- producing one MSI containing the adjacent sidecars remains installer work
- NetScript aggregate health currently includes an unused MySQL adapter for this SQLite app, so listener readiness is used pending an upstream health fix

## Verification

- full `deno task test`: **144 passed, 0 failed**
- targeted `deno check apps/dashboard/vite.config.ts`: passed
- local aggregate `deno task check`: blocked on Windows by command-line length (`os error 206`); the same repository check runs in Linux CI
- clean Fresh/Vite client + SSR production build: passed (1,380 client and 3,212 SSR modules)
- emitted client graph: exactly one `hooks.module.mjs` and one `signals.module.mjs`
- timestamped packaged output: `eis-chat-singleton-20260716T105913Z`
- packaged service health: Garnet listening; all six HTTP endpoints returned 200
- packaged browser smoke: chat streamed without hard refresh; KB page and image OCR completed; zero console errors
- Aspire smoke: dashboard HTTP 200 and telemetry present for `eis-chat-desktop`, `streams`, `workers-api`, `workers`, `eischat`, and both MCP services
- head CI: **all gates passed** on Deno 2.9.3, including formatting, dashboard/workspace type checks, 144 tests, and the cold Linux Vite client+SSR build ([run 29496352343](https://github.com/rickylabs/eis-chat/actions/runs/29496352343))

## References

- [Fresh 2.3 Vite changes](https://deno.com/blog/fresh-2.3)
- [Deno OpenTelemetry configuration](https://docs.deno.com/runtime/fundamentals/open_telemetry/#configuration)
- [Aspire standalone dashboard](https://aspire.dev/dashboard/standalone/)
- [Aspire dashboard configuration](https://aspire.dev/dashboard/configuration)
- [Aspire standalone limitations](https://aspire.dev/dashboard/standalone/#unavailable-features-when-standalone)
- [Aspire 13.4](https://aspire.dev/whats-new/aspire-13-4/)

## PR #150 commits

- faf85e9b prototype windows singleton desktop deployment
- c46f8b69 work around desktop sidecar spawn handles
- 0c363915 document deno 2.9.3 sidecar retest
- 0d7ddcd0 capture windows singleton diagnostics
- 232a13f6 run windows singleton without powershell
- fa23bf0e complete windows singleton stack and fix markdown hydration
- 11f0125a fix singleton discovery and bundle Aspire dashboard
- 4853b0e9 fix compiled singleton telemetry and CI
- 92ced5ad normalize Deno npm specifiers in Vite
- f325a1d7 resolve durable streams export in cold Vite builds
- bc44f266 cover versioned durable streams imports
- cf8887a4 normalize versioned Deno npm imports
- 8cdedd30 document verified singleton integration limits

## PR #150 files

- modified .github/workflows/ci.yml (+1/-1)
- modified apps/dashboard/components/ui/markdown.tsx (+40/-25)
- added apps/dashboard/lib/windows-singleton.test.ts (+66/-0)
- added apps/dashboard/lib/windows-singleton.ts (+389/-0)
- modified apps/dashboard/main.ts (+5/-0)
- modified apps/dashboard/package.json (+3/-1)
- modified apps/dashboard/vite.config.ts (+34/-11)
- added database/sqlite/mod.test.ts (+34/-0)
- modified database/sqlite/mod.ts (+24/-0)
- modified deno.json (+1/-0)
- modified deno.lock (+20/-24)
- modified docs/DESKTOP-SHELL.md (+138/-7)
- modified package.json (+6/-2)
- added scripts/windows-singleton/assets/ASPIRE-LICENSE.TXT (+23/-0)
- added scripts/windows-singleton/assets/aspire-dashboard.json (+13/-0)
- added scripts/windows-singleton/build.ts (+193/-0)
- added scripts/windows-singleton/entries/workers-api.ts (+4/-0)
- added scripts/windows-singleton/entries/workers.ts (+21/-0)
- modified services/eischat/src/main.ts (+3/-1)

## PR #150 issue comments



## PR #150 review comments

