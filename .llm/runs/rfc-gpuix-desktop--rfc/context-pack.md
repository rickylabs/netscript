# Context Pack: GPUIX native desktop renderer RFC

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `rfc-gpuix-desktop--rfc`                                             |
| Branch         | `docs/rfc-gpuix-native-desktop`                                      |
| Current phase  | `accepted` — RFC 0007, merge of PR #2603                              |
| Archetype      | RFC describes 2 (integration) + 6/7 (CLI/deploy) + SDK/service seams |
| Scope overlays | `SCOPE-docs`                                                         |

## Current State

Research, PoC, two benchmark runs, thread breakdown, installables (Linux/Windows/macOS, each with a
webview baseline and `--bench`), HTML report and RFC draft are complete. PLAN-EVAL: cycle 1
FAIL_PLAN (F1–F8 addressed), cycle 2 PASS. Gate 1 measured on the owner's Windows laptop: memory and
multi-instance gains hold, CPU under load does not (81% vs 37%; GPUI UI thread). The RFC awaits owner
disposition.

## Real-stack follow-up (2026-11-09)

The app can supervise the scaffolded 0.0.9 workspace graph (Garnet, SQLite users, workers, sagas,
triggers, streams) from an offline bundle; GPUIX-first variant; bundle-then-compile packaging;
Linux real-stack benchmarks (`evidence/bench-linux-realstack.json`); installers with the stack in
`~/projects/netscript/artifacts/gpuix-poc/realstack/`. See worklog "Real stack + GPUIX-first" and
drift D13–D20. Laptop real-GPU run done (`evidence/bench-windows-realstack-yogabook9i.json`): under the
same 250 ms budget WebView2 stays 2–3.7× cheaper than GPUIX, so gate 1 stays not met and needs
upstream incremental rendering. Open: why the graph takes 11–13 s to start on Windows (3 s Linux).

## Completed

- Q1: compat impossible (react-reconciler internals); native Preact host works (`poc/packages/gpuix-preact`).
- Q2: integration map (`research.md`); papercuts: SDK `cookie` reservation, RPC path default mismatch.
- Q3: PoC app + integration test; bench `evidence/bench-linux-software.json`, threads breakdown.
- Q4: installables `~/projects/netscript/artifacts/gpuix-poc/` + `SHA256SUMS`; Linux in-app bench verified.
- Q5: `rfcs/0007-gpuix-native-desktop-renderer.md`.
- Follow-ups: Fresh 2/3 analysis; HTML report (private Artifact `https://claude.ai/artifact/8YpspJ3ZbE1mhpLf4ayFQH`, local copy in artifacts dir).

## Next Steps

1. Owner reviews PR #2603 and decides the RFC disposition (discussion → FCP).
2. Optional: Apple Silicon `--bench`; a perf spike on update budgeting and GPUIX incremental rendering.
3. If accepted: number the RFC, open implementation issues (desktop-native package, fresh-ui native
   collection, auto-update adapter, packager backend, service RPC-path papercut) on the Codex lane.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Incubate, don't replace | RFC | Webview stays default until four gates pass |
| Same tree on every host | plan D4 | Isolates renderer cost |
| Bearer for native credentials | RFC 0001 bearer factory | SDK reserves `cookie` |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | `deno check app/main.tsx`; `deno fmt --check` RFC |
| Runtime | pass (software rendering) | screens, bench, integration test, tarball `--bench` |
| Consumer | partial | Windows verified to DirectX init under Wine; macOS signature verified; real hardware pending |

## Open Questions

- Real-GPU active CPU (gate 1); Bun vs Deno host for production; `deno compile` vs `cargo-packager`.
