# GPUIX desktop PoC

Evidence for `rfcs/0000-gpuix-native-desktop-renderer.md`. A NetScript workspace app (overview,
records, record detail, health, design, settings, sign-in) rendered natively by GPUI through GPUIX,
with Preact, an embedded `@netscript/service`, the typed SDK client, a durable activity stream and
Deno KV in one process. The same component tree also renders as HTML for the webview baselines.

| Path | What it is |
| --- | --- |
| `packages/gpuix-preact/` | Preact host renderer for GPUIX (DOM facade → `@gpuix/native/host` mutations) |
| `app/main.tsx` | Installable entry: the app, or `--bench` |
| `app/main.gpuix.tsx` | Native host: window, embedded service, KV cookie jar → bearer bridge, native capabilities |
| `app/main.webview.ts`, `app/web/renderer.tsx` | Deno Desktop webview/CEF baseline (same tree as HTML) |
| `app/service/` | Embedded workspace service (`@netscript/service`, SSE V1 producer, KV-backed store) |
| `app/client/` | Host port, SDK client + stream consumer, signals state, Fresh-3-shaped router |
| `app/ui/` | Studio Utility tokens and cross-renderer primitives |
| `bench/` | Bench image, container runner, cross-platform probe, benchmark runner, thread breakdown |
| `scripts/package.sh` | Installables for Linux, Windows (NSIS + zip) and macOS (app zip) |
| `report/build-report.ts` | Builds the HTML evaluation report from `../evidence/` |
| `tests/integration_test.ts` | Headless client path: auth bridge, typed RPC, stream delivery, KV persistence |

## Run

The published Linux GPUIX binary needs glibc 2.39; on older hosts use the bench image
(`bench/docker/Dockerfile`, Ubuntu 24.04 + Xvfb + Mesa lavapipe) through `bench/ctr.sh`.

```bash
scripts/fetch-fonts.sh                                  # once, as root in the bench image
deno task gpuix                                          # native app (deno run)
deno test -A tests/integration_test.ts                  # headless integration test
deno bundle --platform browser --minify --output dist/renderer.js app/web/renderer.tsx
deno desktop -A --backend webview --include dist/renderer.js --include assets/fonts \
  -o build/netscript-webview app/main.webview.ts          # webview baseline
deno run -A bench/bench.ts --out=../evidence/bench-linux-software.json   # inside bench/ctr.sh
scripts/package.sh build/dist linux-x64 windows-x64 macos-arm64          # inside bench/ctr.sh
```

Demo sign-in: any email, password `netscript`. `NETSCRIPT_BENCH=1` signs in automatically and prints
`NETSCRIPT_READY` once the data-backed frame is on screen.
