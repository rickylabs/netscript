# GPUIX desktop PoC

Evidence for `rfcs/0007-gpuix-native-desktop-renderer.md`. A NetScript workspace app (overview,
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
| `realstack/` | The real NetScript graph supervised by the app: `graph.ts` (topology from the workspace's `appsettings.json`), `supervisor.ts` (ports, readiness, ordered shutdown, per-instance workspace), `clients.ts` + `backend.ts` (typed SDK clients, BFF backend over users/workers/streams), `host.ts` (bundled-resource layout), `seed.ts`, `probe.ts` |
| `scripts/stack-bundle.sh` | Offline stack folder per target: Deno 2.9.7, warmed `DENO_DIR`, self-contained Garnet, workspace, seed DB |
| `scripts/lean-compile.sh` | Bundle-then-compile helpers (`deno bundle`, GPUIX-only `node_modules`) |
| `bench/stack-starts.ts` | Sequential and concurrent graph starts with per-node readiness (stall/race diagnosis) |
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

## Real stack

`NETSCRIPT_STACK=real` (default in packages that ship `stack/`) makes the app supervise the
scaffolded NetScript 0.0.9 workspace graph instead of the simulated store: self-contained Garnet,
the users service on SQLite, the workers, sagas and triggers APIs and processors, and streams.
The embedded service becomes a BFF backed by typed SDK clients (`realstack/backend.ts`).
`NETSCRIPT_UI=native` (or `--ui=native`) selects the GPUIX-first variant: native `<virtual-list>`
for records, a 250 ms live-update budget, and an adaptive frame pump. `NETSCRIPT_LIVE_BUDGET_MS`
sets the budget on either host.

```bash
# once: scaffold + patch the workspace (see ../worklog.md), link it, seed, bundle
ln -s <workspace> realstack/workspace
deno run -A realstack/seed.ts realstack/workspace/database/sqlite/workspace.db realstack/seed/workspace.db
dotnet publish <garnet v2.2.1>/main/GarnetServer/GarnetServer.csproj -c Release -f net10.0 -r <rid> --self-contained -o build/garnet-sc/<rid>
scripts/stack-bundle.sh linux-x64          # and win-x64
bench/ctr.sh "$PWD" bash scripts/build-bench-linux.sh
bench/ctr.sh "$PWD" deno run -A bench/bench.ts --out=../evidence/bench-linux-realstack.json \
  --variants=gpuix-real,gpuix-native-real,webview-real,webview-budget-real
```
