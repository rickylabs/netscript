# Plan — GPUIX desktop renderer evaluation and RFC

## Owner request (2026-11-09, verbatim intent)

1. Can GPUIX run with Preact through a compat layer?
2. Either way, how would it connect to the NetScript ecosystem (cf. the Expo work)?
3. A working PoC scaffolding a surface similar to the NetScript app, integrated with the ecosystem
   as far as possible, with an analysis of what must be rewritten/ported/adapted, and a real
   benchmark: performance, cold start, parallel instances, RAM, CPU, feature completeness (NetScript
   and web: durable streams, KV, auth/cookies…).
4. An installable build to test on the owner's laptop.
5. Depending on the outcome, a complete RFC following the harness.
6. (Follow-ups) Consider Fresh 2.x and 3.x separately; produce a complete HTML report.

## Locked decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Tier `feature`; PLAN-EVAL selected (public-contract, multi-package, unresolved design) | No privileged-row authorization; RFC shapes future surfaces. |
| D2 | PoC lives in this run dir (`poc/`), not `packages/` | Evidence, not framework source; implementation of any accepted surface goes to the Codex lane. |
| D3 | Consume published JSR `@netscript/*@0.0.9` | Measures what a consumer gets, not workspace internals. |
| D4 | Benchmark the *same* Preact tree on every host (GPUIX vs Deno Desktop webview vs CEF) | Isolates the renderer/host; primitives render to GPUIX or DOM. |
| D5 | Linux container with Xvfb + lavapipe; ship `--bench` in the installable for real-GPU numbers | No GPU on the N5; the method must be portable. |
| D6 | RFC proposes an opt-in incubating track, not a replacement | Pre-1.0 upstream, single maintainer, no real-GPU numbers yet. |

## Slices

1. Feasibility spikes: napi load under Deno; GPUI window under Xvfb; `preact/compat` + `@gpuix/react`.
2. `gpuix-preact` adapter.
3. PoC app: embedded `@netscript/service`, SDK client, durable stream, KV, auth, Fresh-shaped routes,
   six screens in light/dark; headless integration test.
4. Webview + CEF baselines from the same tree; benchmark runner (container + in-app).
5. Installables (Linux tar.gz, Windows NSIS + portable zip, macOS app zip) + verification.
6. RFC `rfcs/0000-gpuix-native-desktop-renderer.md`, HTML report, draft PR, PLAN-EVAL.

## Risk register

| Risk | Likelihood / impact | Mitigation in this run | Residual (owner decision) |
| --- | --- | --- | --- |
| Software rendering misrepresents CPU | High / high | Per-thread breakdown separates rasterizer threads; caveat on every surface | Real-GPU `--bench` (gate 1) |
| Shared host noise (load 4–7) | Medium / medium | 5 cold + 3 active runs, medians, two full runs that agree | Laptop rerun |
| GPUIX API churn (0.11.0 vs `main`) | High / medium | Exact pins, feature detection | Upgrade policy (gate 2) |
| Cross-built Windows/macOS binaries untested on hardware | Medium / high | Linux run, macOS signature verification, Windows to DirectX init under Wine | Owner laptop test |
| Packaging embeds foreign platform binaries | Found / medium | Per-target prune + `--node-modules-dir=manual` | Packager backend design |

## Unresolved questions: deferral classification

| Question | Classification | Why |
| --- | --- | --- |
| Bun vs Deno as production host | Safe to defer | Renderer is runtime-agnostic (proven on 3 runtimes); only the packager default changes. |
| `deno compile` vs `cargo-packager` | Safe to defer | Same `netscript deploy desktop --renderer gpuix` surface either way. |
| Depth of owning a GPUI fork | Safe to defer | Gated by decision gate 2. |
| Primitives as the default web component layer | Safe to defer | Explicitly future scope. |
| Real-GPU active CPU | Must resolve before "recommended" | It is decision gate 1; incubation can start without it. |

