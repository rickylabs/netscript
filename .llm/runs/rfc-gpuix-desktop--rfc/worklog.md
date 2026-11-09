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
