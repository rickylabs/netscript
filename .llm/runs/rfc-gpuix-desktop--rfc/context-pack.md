# Context Pack: GPUIX native desktop renderer RFC

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `rfc-gpuix-desktop--rfc`                                             |
| Branch         | `docs/rfc-gpuix-native-desktop`                                      |
| Current phase  | `plan-eval`                                                          |
| Archetype      | RFC describes 2 (integration) + 6/7 (CLI/deploy) + SDK/service seams |
| Scope overlays | `SCOPE-docs`                                                         |

## Current State

Research, PoC, two benchmark runs, thread breakdown, installables (Linux/Windows/macOS, each with a
webview baseline and `--bench`), HTML report and RFC draft are complete. PLAN-EVAL (GLM 5.3,
separate session) is the next step; the owner's real-GPU laptop benchmark is decision gate 1.

## Completed

- Q1: compat impossible (react-reconciler internals); native Preact host works (`poc/packages/gpuix-preact`).
- Q2: integration map (`research.md`); papercuts: SDK `cookie` reservation, RPC path default mismatch.
- Q3: PoC app + integration test; bench `evidence/bench-linux-software.json`, threads breakdown.
- Q4: installables `~/projects/netscript/artifacts/gpuix-poc/` + `SHA256SUMS`; Linux in-app bench verified.
- Q5: `rfcs/0000-gpuix-native-desktop-renderer.md`.
- Follow-ups: Fresh 2/3 analysis; HTML report (private Artifact `https://claude.ai/artifact/8YpspJ3ZbE1mhpLf4ayFQH`, local copy in artifacts dir).

## Next Steps

1. PLAN-EVAL by GLM 5.3 (`opencode-go/glm-5.3`); fix findings; record verdict in `plan-eval.md`.
2. Owner runs `--bench` on Windows/macOS laptops; append results to `evidence/` and rebuild the report.
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
