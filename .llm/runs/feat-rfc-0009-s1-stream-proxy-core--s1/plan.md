# Plan: RFC 0009 Slice 1 — Core stream endpoint contract & revocable SSE proxy runtime (#2677)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s1-stream-proxy-core--s1` |
| Branch | `feat/rfc-0009-s1-stream-proxy-core` |
| Phase | `impl` |
| Target | `packages/contracts`, `packages/plugin-streams-core` |
| Archetype | Archetype 1 (`@netscript/contracts`) + Archetype 3 (`@netscript/plugin-streams-core`) |
| Scope overlays | `none` |
| Issue | `#2677` (`Closes #2677`, `Part of #2146`, milestone `0.0.10`) |

## Archetype & Doctrine Verdict

- `@netscript/contracts`: Archetype 1 — Small Contract, doctrine verdict `Keep`.
- `@netscript/plugin-streams-core`: Archetype 3 — Runtime/Behavior, doctrine verdict `Keep`.
- No new packages and no new third-party dependencies.

## PLAN-EVAL Disposition

- `PLAN-EVAL: N/A` — Accepted RFC 0009 (`rfcs/0009-authorizing-stream-proxy.md`, merged at `af5107b8d` after three independent PLAN-EVAL rounds ending with `PLAN-EVAL: APPROVED` at `ab1ef854f6966168c66e93629c813d677d10e4f7`) already locks the full public surface, security invariants, resource bounds, and acceptance gates for Stage 1.

## Goal

Land Stage 1 of RFC 0009: runtime-free stream endpoint contracts and canonical offset validation in `@netscript/contracts/streams`, and the revocable authorizing SSE stream proxy runtime in `@netscript/plugin-streams-core/proxy`, verified by the full revocation, fencing, expiry, bounded-parser, reader-cap, security, redaction, and 32-reader soak conformance gates under Deno sanitizers.

## Scope

- `@netscript/contracts/streams`: `STREAM_OFFSET_MAX_BYTES`, `isValidStreamOffset`, `defineStreamEndpoint`, `buildStreamEndpointUrl`, and contract types (`StreamEndpointClientAuthMode`, `StreamEndpointProtocol`, `StreamEndpointDefinition`, `StreamEndpointContract`, `StreamEndpointUrlInput`).
- `@netscript/plugin-streams-core/proxy`: `createNetScriptStreamProxy`, `StreamProxyClockPort`, `StreamProxyRevocationSource`, `StreamProxyOptions`, `StreamProxyHandler`, and domain decision/lifecycle types.
- Package-internal modules under `packages/plugin-streams-core/src/application/proxy/`:
  - `headers.ts` (static + dynamic `Connection` hop-by-hop stripping, 3-tier response header ownership, reserved header validation, upstream allowlist, redacted error responses)
  - `credentials.ts` (RFC 6750 §2.1 Bearer grammar, deterministic `clientAuth` selection, Cookie Origin & Fetch Metadata guard with `trustProxy` + `remoteAddr` effective-origin resolution)
  - `sse-parser.ts` (byte-bounded incremental UTF-8 SSE parser with `maxPendingBatchBytes`, `STREAM_SSE_CONTRACT_V1.schemas.control` + `isValidStreamOffset` validation, premature EOF protection)
  - `reader-session.ts` (monotonic `invalidationEpoch` fencing, `highWaterMark: 0` pull-driven delivery, single-budget `expiresAtMs + policyTimeoutMs` expiry contention, `recheckEveryMs` idle checks, wake coalescing, decoupled synchronous `closeOnce`)
  - `create-stream-proxy.ts` (construction validation, `maxActiveReaders` 503 + `maxReadersPerKey` 429 caps with `Retry-After`, `abortSetupOnce(...)` early-exit cleanup, `'post-subscribe'` catch-up, pre-`200` epoch fence, late-result disposal)
- Conformance & type-fixture tests covering RFC 0009 Gates #1–#6 (core runtime), #8 (backpressure/policy errors), #9 (caps, wake-storm, 32-reader soak), and #10 (`deno doc --json` `@orpc` non-leakage, static/JSR/doctrine gates).

## Non-Scope

- `@netscript/service` mounting, `bindStreamProxy`, contract authorizer/overlay binding, and pre-drain `shutdownSignal` (Stage 2, `#2678`).
- `bindStreamEventSourceV1` `readyState`, `@netscript/sdk/streams/consumer`, and `@netscript/fresh/streams` `proxyUrl` (Stage 3, `#2679`).
- `@netscript/fresh/ai` `createNetScriptChatStreamProxy` opt-in delegation (Stage 4, `#2680`).
- Docs site edits under `docs/site/**` (owned by `#2650`).

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| S1-1 | Root subpath files `packages/contracts/streams.ts` and `packages/plugin-streams-core/proxy.ts` | Mirrors `./commands` and `./admin`, avoids breaching `packages/plugin-streams-core/src/` F-16 12-child cap. |
| S1-2 | Keep header-hygiene, credential-guard, and parser helpers package-internal under `src/application/proxy/` | RFC 0009 § Public export justification explicitly defers public sanitizer exports. |
| S1-3 | Structural `StreamProxyRequestContext` in S1 matching S2's `StreamProxyMountContext` | Keeps Stage 1 strictly scoped to `packages/contracts` and `packages/plugin-streams-core`; Stage 2 wires the identical type from `@netscript/service`. |
| S1-4 | Byte-level incremental SSE line/block parser with pause-on-unit cursor | Preserves lossless wire bytes across 1-byte chunks/UTF-8, enforces `maxPendingBatchBytes` before retaining bytes, and avoids speculative buffering across multiple blocks in one chunk. |

## Validation Plan

| Order | Gate | Command | Expected result |
| --- | --- | --- | --- |
| 1 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/contracts --root packages/plugin-streams-core --ext ts` | Exit 0 |
| 2 | Unit + conformance + soak tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/contracts/tests packages/plugin-streams-core/tests` | Exit 0, zero sanitizer bypasses |
| 3 | Lint + format | `run-deno-lint.ts` & `run-deno-fmt.ts` on both packages | Exit 0 |
| 4 | Quality + doctrine + JSR | `deno task quality:gate`, `deno task doc:lint`, `deno task publish:dry-run`, `deno task check:netscript-jsr-specifiers`, `deno task check:mcp-export-corpus` | Exit 0 |
