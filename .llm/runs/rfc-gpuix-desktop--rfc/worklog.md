# Worklog — rfc-gpuix-desktop--rfc

## Run Metadata

| Field          | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Run ID         | `rfc-gpuix-desktop--rfc`                                |
| Branch         | `docs/rfc-gpuix-native-desktop`                            |
| Tier           | `feature` (PLAN-EVAL selected)                          |
| Archetype      | RFC described: 2 (integration), 6/7 (CLI/deploy), SDK/service seams |
| Scope overlays | `SCOPE-docs` (PR is docs + run evidence only)           |

## Design checkpoint (2026-11-09)

- Upstream facts: GPUIX `0.11.0` (npm, 2026-10-20); source `main` @ `0ce4f41` is ahead (clipboard,
  notifications, generic `on*` events). PoC pins `0.11.0` and feature-detects.
- Q1 answered by experiment (compat fails at module load; native host works).
- Integration map and Fresh 2/3 analysis recorded in `research.md`.

## Slice log

| # | Slice | Evidence | Result |
| --- | --- | --- | --- |
| 1 | napi under Deno 2.9.7 | `@gpuix/native` resolves and dlopens; host glibc 2.36 < 2.39 → Ubuntu 24.04 container (`poc/bench/docker/Dockerfile`) | GPUI window + text via lavapipe under plain `deno run` |
| 1 | `preact/compat` → `@gpuix/react` | Bun 1.4.4: `TypeError … ReactSharedInternals.S` at `react-reconciler` load | Not possible |
| 2 | `gpuix-preact` adapter | `poc/packages/gpuix-preact` | Full app renders; signals work |
| 3 | PoC app | `poc/app/**`; `poc/tests/integration_test.ts` (auth bridge, typed RPC, stream delivery, KV persistence across restart) | `deno test` 1 passed; screens `evidence/screens/sheet-{light,dark}.png` (real X11 clicks) |
| 3 | SDK cookie reservation | `SDK_CONTRIBUTION_INVALID` for a `cookie` contribution | Bearer bridge; RFC 0001 bearer factory is the production path |
| 3 | Service RPC path papercut | client `/api/rpc/v1/workspace/*` 404 vs builder `/api/rpc/*` | `buildServiceRpcPath({ routerName })` |
| 4 | Baselines | `deno desktop -A --backend webview|cef` of `app/main.webview.ts` + DOM bundle | Same tree renders in WebKitGTK and CEF |
| 4 | Bench run 1 | `evidence/bench-linux-software-run1.{json,log}` | GPUIX + webview complete; CEF ×4 hung (container `/dev/shm` 1 GB) → run aborted |
| 4 | Bench run 2 | `evidence/bench-linux-software.{json,log}` (`--init`, 4 GB shm, shared runner) | GPUIX 282 MB PSS / 1 proc / idle 1.8% / active 205%; WebKitGTK 402 MB / 3 / 36.9% / 114%; CEF 412 MB / 8 / 0.1% / 15%; CEF ×4/×8 stall at startup |
| 4 | Thread breakdown | `evidence/threads-linux-software.json` | GPUIX active: lavapipe 144%, GPUI UI thread 55%, JS 4%; non-raster ≈61% vs 20% (WebKitGTK) / 15% (CEF) — main open risk |
| 5 | Webview baselines in installers + in-app bench | tarball `bench.sh --runs=1` | auto-detects baseline; numbers match container runs |
| 6 | HTML report | `poc/report/build-report.ts`; Artifact `8YpspJ3ZbE1mhpLf4ayFQH` | published (private) |
| 4 | Runtime portability | `evidence/screens/runtime-sheet.png` | Same adapter on Deno 2.9.7 / Bun 1.4.4 / Node 24 |
| 5 | Installables | `~/projects/netscript/artifacts/gpuix-poc/` + `SHA256SUMS` | Linux runs; macOS signature valid; Windows reaches DirectX init under Wine |

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| PoC type check | `deno check app/main.tsx` (poc dir) | pass |
| PoC integration test | `deno test -A tests/integration_test.ts` | 1 passed |
| Docs format | `deno fmt --check rfcs/0000-gpuix-native-desktop-renderer.md` | pass |

## Evaluation

PLAN-EVAL route: `deno task agentic:matrix --tier feature --plan-evaluator` → GLM 5.3 (provider
default); fallback Fable 5.1 skipped (same family as the Anthropic generator). Launched 2026-11-09 via
T3 `delegate_task` as `opencode-go/glm-5.3` (fleet launch 0 of `glm_5_3`), separate session, write
scope `plan-eval.md` only. Draft PR #2603, tracking issue #2602.

### PLAN-EVAL cycle 1 — GLM 5.3 — `FAIL_PLAN` (3 blocking, 5 non-blocking)

| Finding | Disposition |
| --- | --- |
| F1 install size 181 MB unreproducible | **Fixed.** Root cause: `deno compile --target` installs the target's `@gpuix/native-<triple>` into `node_modules`, and later builds embed the whole npm resolution (symlink targets included; `--exclude` ignored). `scripts/package.sh` now restores, prunes foreign platform packages and builds with `--node-modules-dir=manual`. Like-for-like Linux sizes with provenance in `evidence/install-sizes.json`: GPUIX 185, webview 112, CEF 470 MiB (the webview baseline is the smallest; RFC Drawbacks now say so). Downloads shrank to 57–94 MB. Linux tarball app, webview baseline and in-app `--bench` re-verified; Windows/macOS binaries embed only their own addon. |
| F2 CEF "~10 s" claim lacked an artifact | **Fixed.** `poc/bench/cef-concurrency.sh` → `evidence/cef-concurrent-start.log` (3 pairs: second page ≈10 s twice, never ready once; four at once: two never ready). Footnote rewritten to match. |
| F3 jsr-audit undispositioned | **Fixed.** Disposition: **N/A for this PR** (docs + run evidence; no package published). RFC § Reference-level now names the future package's constraints: JSR package over an exact-pinned npm native addon, Deno needs `nodeModulesDir` + `--allow-ffi`, per-target pruning in the packager; jsr-audit applies at implementation. |
| F4 non-raster attribution | **Fixed.** Footnotes ²/³: values come from the separate thread run; CEF marked n/a (compositor threads not separable). Report sentence matches. |
| F5 load average | **Fixed.** Caveat in RFC table note and report method text. |
| F6 milestone vocabulary | **Kept.** Milestones are themed since 2026-10-27 (#2442); only the next release is numbered. The RFC README example predates that rule; "Enterprise Deployment & Desktop" is the themed milestone that owns desktop. |
| F7 plan risk register / deferral classes | **Fixed.** `plan.md` § Risk register and § deferral classification. |
| F8 precision | **Fixed.** `useNative` (PoC `useGpuix`), ≈2.8k stars, "JS + host main-thread bucket 4%". |

### PLAN-EVAL cycle 2 — GLM 5.3 (`ollama-cloud/glm-5.3`) — `PASS`

First attempt on `opencode-go/glm-5.3` died on the OpenCode Go usage limit before doing any work
(drift D12); the identical brief was relaunched on the next fleet transport for the same model.
Verdict appended to `plan-eval.md` § Cycle 2: F1–F8 RESOLVED. In-flight repairs, both reviewed by
the supervisor and accepted: RFC Rationale "Electron / CEF … 537 MB" → "470 MB" (stale pre-pruning
size), and a blank line that detached drift row D12 from its table. Observations N2 (CEF log host
label reads `webview-deno-desktop` because `NETSCRIPT_BACKEND` defaults to webview) and N3 (≤1 MiB
rounding) need no change. IMPL-EVAL: N/A for this RFC PR (docs and evidence only); implementation of
any accepted surface carries its own IMPL-EVAL on the Codex lane.


### Decision gate 1 — real-GPU laptop benchmark (launched 2026-11-09)

Owner downloaded and extracted the Windows build on the linked T3 environment `Yoga_Book_9i`
(`415f93b9-8779-4bc9-972f-7dc7059b090f`). Laptop lane launched via T3 `delegate_task` (remote child
thread `mcp:launch:dde17c42…`), Codex GPT-6.1 Sol @ low (simple tier: execution only, nothing it
produces is evaluated as authored content). Brief: locate build + checksum, record hardware (CPU,
GPU/driver, RAM, AC/battery, power plan, WebView2, background load), smoke launch, then
`NetScript.exe --bench` (5 cold / 3 active / ×1,4,8 per host) and return the raw report JSON.

### Launch types (owner question, 2026-11-09): first launch vs relaunch

Owner tried the Windows exe and found the launch very fast; the benchmark's "cold start" always used
a fresh profile. New probe `poc/bench/first-launch.sh` (one fresh container per block: empty `/tmp`,
so no deno-compile code cache) → `evidence/first-launch-linux.log` (GPUIX, 5 containers) and
`evidence/first-launch-linux-webview.log` (webview, 3 containers). Medians, Linux + lavapipe:

| Launch | GPUIX window | GPUIX data on screen | Webview window (blank) | Webview data on screen |
| --- | --- | --- | --- | --- |
| First launch after install | 273 ms | 1.18 s | 79 ms | 0.96 s |
| Later launch, new profile (= benchmark "cold start") | 186 ms | 0.95 s | 55 ms | 0.81 s |
| Normal relaunch, existing profile | 193 ms | 0.43 s | 66 ms | 0.75 s |

Reading: the ~0.5 s between a new and an existing profile is first-run work (creating the two Deno KV
databases, demo sign-in, persisting the session). A normal relaunch shows data ~40% sooner than the
webview build; GPUIX's first window already shows the app shell, the webview's is blank until the page
loads. The first-launch extra is the V8 code cache (`/tmp/deno-compile-netscript.cache`, written
once). To fold into the RFC/report together with the laptop results.

### Gate 1 — laptop results (Yoga Book 9i, Win 11, Core Ultra 7 155U + Intel Graphics, AC/Balanced)

`evidence/bench-windows-yogabook9i.json` (build sha256 `cacab0af…` = current pruned build; the lane
brief carried the superseded hashes). Smoke: GPUIX renders on the real GPU (DirectX 11), window
"NetScript — Overview", ready 808 ms.

| Metric | GPUIX | WebView2 (same app) |
| --- | --- | --- |
| Cold start, new profile (median) | 1,075 ms | 1,000 ms (first run 3,482 ms) |
| Memory (working set, tree) | 267 MB, 1 process | 532 MB, 7 processes |
| Idle CPU | 4.8% | 0.5% |
| Active CPU, 20 events/s | 80.9% | 37.2% |
| 8 instances | 2,143 MB, all ready 4.3 s | x4 and x8 timed out (90 s) |

Reading: memory (−50% working set; RSS double-counts WebView2's shared pages, so the true gap is
smaller than 2×) and multi-instance favour GPUIX; **gate 1 as written fails** (active CPU 2.2× the
webview on a real GPU), and idle CPU is ~10× (GPUIX's 8 ms timer pump on Windows/Linux). Follow-up
probe `poc/bench/windows-probe.ps1` (pinned `a0744700`) dispatched to the laptop: launch types for
both hosts + per-thread GPUIX CPU (overview vs settings vs idle) + WebView2 per-process CPU.

### Gate 1 follow-up probe (laptop) — CPU attribution and launch types

`evidence/probe-windows-yogabook9i.json` (script `poc/bench/windows-probe.ps1` @ `a0744700`, sha256
verified on the laptop, ran clean, no edits). GPUIX at 20 events/s: overview 94.7% total (GPUI UI
thread `gpuix-ui` 88.1%, JS main 3.3%), settings 8.9% (UI 3.0%, JS 3.4%), idle 6.9%. WebView2 at
20/s: 27.0% (renderer 15.2%, GPU process 6.9%, host 2.3%). Conclusion: app JavaScript ≈3% on both
hosts; GPUIX's cost is GPUI per-frame work on large changing visible trees. Windows launch types
are noisy (outliers 7–13 s; WebView2 relaunch erratic) and recorded as indicative.

Post-PASS update: the RFC gained the "Real GPU: Windows laptop" section, gate 1 status (not met,
with a path to passing), the CPU drawback, a summary sentence and one unresolved question. This
adds measured evidence the owner requested; no proposed surface, gate definition or archetype
changed. PLAN-EVAL rounds for the feature tier are exhausted, so a re-review is the owner's call.
Report republished (v3).

### Real stack + GPUIX-first (owner follow-up, 2026-11-09)

Owner asked for a benchmark against a real stack (Garnet KV, SQLite, sagas, streams, jobs) shipped as
one artifact, and for a GPUIX-first UI. Chosen route (owner): minimal singleton in the PoC, built by
Claude in this session. Upstream single-exe packaging does not exist yet (epic #830).

- **Workspace.** Scaffolded with the JSR CLI 0.0.9 (`.llm/tmp/realstack/workspace`, gitignored):
  users service, workers/sagas/triggers/streams, SQLite, Garnet executable. Plugin schemas patched to
  migrate on SQLite (D14). Aspire run captured the exact launch graph
  (`evidence/realstack-aspire-runtime-graph.json`).
- **Supervisor** (`poc/realstack/`): graph from `appsettings.json`; reserved loopback ports; readiness
  (`/health` 200, Garnet `PING`); dependency-ordered parallel start; two-phase bounded shutdown;
  per-instance workspace copy (D20); `DENO_SERVE_ADDRESS` neutralized for `deno desktop` (D18).
- **Data path.** The embedded service is the desktop BFF; `realstack/backend.ts` reads and writes
  through typed SDK clients: users CRUD (SQLite), overview aggregated in the BFF, activity from the
  durable stream `/scaffold/users/records` (long-poll), jobs from `workers-api` (polled, D19). Load =
  `workers.triggerJob` per tick + `users.update` every third tick.
- **Bundle** (`scripts/stack-bundle.sh`): Deno 2.9.7, warmed `DENO_DIR` (`--cached-only` at runtime),
  self-contained Garnet 2.2.1 (D16), workspace, seeded DB (1,240 records). Linux 790 MB, Windows
  ~860 MB unpacked; the npm cache dominates.
- **Lean compile** (owner pointer, D17): `deno bundle` then compile from a GPUIX-only folder:
  GPUIX 172 MB, webview 90 MB.
- **GPUIX-first** (`NETSCRIPT_UI=native`): native `<virtual-list>` for records (all matches),
  250 ms live-update budget, adaptive frame pump in `gpuix-preact` (8 ms active / 50 ms idle).
- **Benchmarks** (`evidence/bench-linux-realstack.json`, three passes merged; Linux container,
  software rendering). At 20 updates/s: GPUIX 204%, GPUIX + budget 45.6%, GPUIX-first 46%, webview
  111%, webview + budget 70%. Real stack, host process only: GPUIX 73.8%, GPUIX-first 42.8%, webview
  77.9%, webview + budget 68.2%; graph ≈35% on every host. Memory: graph 1.37 GB (9 processes);
  host 299 MB (GPUIX) vs 418 MB (webview). Idle host CPU: 2.5–3.7% vs 33–37%. 8 real-stack
  instances: GPUIX 15.3 s / 12.2 GB, webview 25.5 s / 13.0 GB. Reading: the budget is the lever and
  helps GPUIX far more than the webview (GPUI redraws the window per commit; the browser compositor
  invalidates partially). With equal policy GPUIX is ~35% below the webview on this machine.
- **Upstream findings to file (owner decides):** plugins × SQLite migrations; AppHost does not wire
  streams into services; `deploy build` emits an empty graph; `workers.subscribe` silent on Garnet KV
  and leaks Zod internals in its snapshot; `deno desktop` leaks `DENO_SERVE_ADDRESS` to children.

### Real stack on the laptop (real GPU), 2026-11-09

Lane on T3 env `Yoga_Book_9i` (Codex GPT-6.1 Sol, low): fetched the portable zip over SSH (`n5-agents`),
sha256 verified, warm-up discarded, `--bench` over eight variants (`--runs=5 --parallel=1,4`), results
copied back (`evidence/bench-windows-realstack-yogabook9i.{json,md,log}`). Machine: LENOVO 83FF, Core
Ultra 7 155U, Intel Graphics 32.0.101.6881, 31.6 GB, AC/Balanced, WebView2 157, four displays.

| Variant | CPU 20/s (embedded) | Host CPU 20/s (real stack) | Host memory |
| --- | --- | --- | --- |
| GPUIX | 80.2% | 45.2% | 286 MB |
| GPUIX-first | 36.7% | 32.3% | 285 MB |
| WebView2 | 38.1% | 18.3% | 546 MB |
| WebView2 + 250 ms budget | 10.0% | 15.8% | 546 MB |

Reading: on a real GPU the budget halves GPUIX's CPU but cuts WebView2's more; under equal policy the
webview is 3.7× (embedded) / 2× (host on the real stack) cheaper. The Linux container's reversal came
from WebKitGTK software compositing. Gate 1 stays not met; it needs incremental rendering upstream.
Graph on Windows: 18 processes (conhost per deno.exe), 1.68 GB, ~100% CPU under load, ready in
10.9–12.8 s on a fresh profile (first run per variant 18–28 s; Linux 3 s), cause not yet attributed.
Four GPUIX real-stack instances started in 34–40 s; four WebView2 instances never started. RFC summary,
real-stack section, gate 1 status, drawbacks and unresolved questions updated; report republished.

### Owner acceptance and follow-ups (2026-11-10)

Owner: "the RFC is fine to ship", plus a multi-window test, upstream issues with repros, the Windows
start-time chase and an eis-chat review.

- **Upstream issues filed** (repros on this branch): #2604 workers subscribe watches the legacy kvdex
  prefix (`poc/bench/garnet-watch-repro.ts`: 46 watch messages on `kv:__watch__`, 0 kvdex keys, no
  `execution.*` events); #2605 PostgreSQL-only plugin schemas, 87 Prisma errors on SQLite
  (`poc/repro/sqlite-plugins.sh`); #2606 `deploy build` reads `dotnet/AppHost/appsettings.json`; #2607
  `DENO_SERVE_ADDRESS` inheritance; #2608 Windows crash-loop stall after relaunches; #2609 Windows start
  time. Not filed: streams service linking (by design since #2592, `--service <name>`). Corrections: D21,
  D22.
- **Windows start time** (`evidence/windows-stack-start-yogabook9i.json`): 135.9 s on the first launch
  after install (Defender first-run scans: deno.exe 5.0 s, Garnet 4.4 s, profile copy 12.4 s), 14–16 s on
  a new profile, 12–13 s on relaunch; per Deno node 1.6–5.7 s; one relaunch 71.9 s from the crash-loop
  window (CHILD_CRASH_LOOP_THRESHOLD 3 restarts / 60 s; Windows kills count as restarts). The first probe
  run stopped unrelated processes on the laptop (Ollama, a cmd.exe) via a parent-PID walk; the script now
  checks creation time and executable path, and the owner was told.
- **Garnet runtime**: the release `GarnetServer.exe` (1.1.10 and 2.2.1) is a framework-dependent
  single-file apphost (no static runtime markers); the Linux binary prints "You must install .NET".
- **Multi-window** (`evidence/bench-linux-multiwindow.json`): both hosts work. GPUIX extra windows share
  the process (64–71 ms to open, +60 MB each); webview windows are pages with their own context,
  stream and binding (+170 MB and a process each). CPU per extra window under constant updates: GPUIX
  +140%, webview +75% (software rendering).
- **eis-chat review** (`~/projects/eis-chat/runs/2026-11-10-desktop-packaging-review/review.md`): already
  bundles before compiling, strips `DENO_*`, uses LocalAppData and a Job Object; gaps: fixed ports with
  ownerless readiness, unmeasured serial start, telemetry always on, six runtimes, and Garnet 1.1.10 that
  probably needs an installed .NET despite the docs.
- **RFC accepted**: numbered `rfcs/0007-gpuix-native-desktop-renderer.md`, status Accepted; sections
  added for multi-window, the Windows start time and "Shipping the backend".
