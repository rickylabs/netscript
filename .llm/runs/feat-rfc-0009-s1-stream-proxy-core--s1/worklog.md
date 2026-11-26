# Worklog: RFC 0009 Slice 1 — Core stream endpoint contract & revocable SSE proxy runtime (#2677)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s1-stream-proxy-core--s1` |
| Branch | `feat/rfc-0009-s1-stream-proxy-core` |
| Issue | `#2677` (`Part of #2146`, milestone `0.0.10`) |
| Archetype | Archetype 1 (`@netscript/contracts`) + Archetype 3 (`@netscript/plugin-streams-core`) |
| Scope overlays | `none` |

## Owner Direction (2026-11-25, verbatim)

> "Then all merged RFC Ready for start implementation should be launched in separate main lanes with Neon and Fable 5.2 as reviewer (sub lane of it) + hydrogen on subsequent pass (where needed)"
>
> "Make sure relevant issues are assigned to milestone 0.0.10"
>
> "Merge all what is ready to merge as it lands"

### PLAN-EVAL Disposition

- `PLAN-EVAL: N/A` — governed directly by accepted RFC 0009 (`rfcs/0009-authorizing-stream-proxy.md`, merged at `af5107b8d` after `PLAN-EVAL: APPROVED` at `ab1ef854f6966168c66e93629c813d677d10e4f7`).

## Design

### Public Surface

- `@netscript/contracts/streams` (`packages/contracts/streams.ts`):
  - `STREAM_OFFSET_MAX_BYTES`, `isValidStreamOffset`, `defineStreamEndpoint`, `buildStreamEndpointUrl`
  - Types: `StreamEndpointClientAuthMode`, `StreamEndpointProtocol`, `StreamEndpointDefinition`, `StreamEndpointContract`, `StreamEndpointUrlInput`
- `@netscript/plugin-streams-core/proxy` (`packages/plugin-streams-core/proxy.ts`):
  - `createNetScriptStreamProxy`
  - Types: `StreamProxyClockPort`, `StreamProxyCredentialMode`, `StreamProxyAuthDecision`, `StreamProxyRecheckReason`, `StreamProxyRecheckDecision`, `StreamProxyAdmissionContext`, `StreamProxyRecheckContext`, `StreamProxyRevocationSignal`, `StreamProxyRevocationSource`, `StreamProxyCloseReason`, `StreamProxyCloseEvent`, `StreamProxyRequestContext`, `StreamProxyOptions`, `StreamProxyHandler`

### Domain Vocabulary

- `StreamEndpointContract` — frozen runtime-free parameterized SSE route contract
- `StreamProxyCredentialMode` — `'bearer' | 'cookie'`
- `StreamProxyRecheckReason` — `'post-subscribe' | 'before-delivery' | 'idle-interval' | 'expiry' | 'revocation-signal'`
- `StreamProxyCloseReason` — `'completed' | 'revoked' | 'expired' | 'client-cancelled' | 'shutdown' | 'upstream-error' | 'policy-error' | 'frame-limit-exceeded'`
- `DeliveryUnit` (internal) — atomic validated `event: data[]` + committing `event: control` bytes

### Ports

- `StreamProxyClockPort` — deterministic epoch time and cancelable timer scheduling for expiry, idle interval, policy timeout, and upstream connect timeout
- `StreamProxyRevocationSource<TGrant>` — application-supplied cross-gateway revocation subscription seam

### Constants

- `STREAM_OFFSET_MAX_BYTES = 512`
- `STREAM_ENDPOINT_PROTOCOL_V1`, `STREAM_ENDPOINT_CLIENT_AUTH_MODES`, `RESERVED_STREAM_QUERY_PARAMS`
- `STREAM_PROXY_CREDENTIAL_MODES`, `STREAM_PROXY_RECHECK_REASONS`, `STREAM_PROXY_CLOSE_REASONS`
- `DEFAULT_STREAM_PROXY_RECHECK_EVERY_MS = 30_000`, `DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS = 5_000`, `DEFAULT_STREAM_PROXY_UPSTREAM_CONNECT_TIMEOUT_MS = 15_000`, `DEFAULT_STREAM_PROXY_MAX_PENDING_BATCH_BYTES = 4 * 1024 * 1024`, `DEFAULT_STREAM_PROXY_MAX_ACTIVE_READERS = 1_000`, `DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS = 8`

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | `@netscript/contracts/streams` contract + canonical offset grammar + independence & behavior tests | `deno test --allow-all packages/contracts/tests` + `deno doc --json` `@orpc` check | `packages/contracts/streams.ts`, `src/domain/stream-endpoint.ts`, `src/application/stream-endpoint.ts`, `deno.json`, `README.md`, `tests/stream-endpoint_test.ts` |
| 2 | `@netscript/plugin-streams-core/proxy` revocable SSE proxy runtime + full conformance & 32-reader soak gates | `deno test --allow-all packages/plugin-streams-core/tests` + `quality:gate` + `doc:lint` + `publish:dry-run` | `packages/plugin-streams-core/proxy.ts`, `src/domain/stream-proxy-contract.ts`, `src/ports/stream-proxy-ports.ts`, `src/adapters/system-stream-proxy-clock.ts`, `src/application/proxy/*.ts`, `deno.json`, `README.md`, `tests/proxy/*_test.ts` |

### Deferred Scope

- `@netscript/service` mount, `bindStreamProxy`, and pre-drain `shutdownSignal` → Slice 2 (`#2678`).
- Consumer bindings & Fresh `proxyUrl` → Slice 3 (`#2679`).
- Chat proxy opt-in delegation → Slice 4 (`#2680`).

### Contributor Path

Read `packages/contracts/streams.ts` for endpoint declaration and canonical offset rules, then `packages/plugin-streams-core/proxy.ts` and `src/application/proxy/` (`credentials.ts`, `headers.ts`, `sse-parser.ts`, `reader-session.ts`, `create-stream-proxy.ts`) for the revocable proxy pipeline.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-11-25 | S0 | issues | Created native sub-issues `#2677`, `#2678`, `#2679`, `#2680` under `#2146` with milestone `0.0.10` and `blockedBy` dependencies (`2677 -> 2678 -> 2679 -> 2680`); moved `#2146` to `status:impl`. |
| 2026-11-25 | S1 | bootstrap | Created branch `feat/rfc-0009-s1-stream-proxy-core` from `origin/main` (`af5107b8d`) and initialized run artifacts. |
| 2026-11-25 | S1 | implement | Implemented `@netscript/contracts/streams` (`STREAM_OFFSET_MAX_BYTES`, `isValidStreamOffset`, `defineStreamEndpoint`, `buildStreamEndpointUrl`) and `@netscript/plugin-streams-core/proxy` (`createNetScriptStreamProxy` with fail-closed admission, credential + Origin/Fetch-Metadata/`trustProxy` guard, 3-tier response headers, bounded incremental SSE parser, monotonic `invalidationEpoch` fencing, single-budget expiry contention, `abortSetupOnce`, reader caps 503/429 + `Retry-After`, redaction). |
| 2026-11-25 | S1 | verify | Verified 116-file `deno check` (0 errors), 134/134 tests under Deno sanitizers (including 32-reader soak and real `DurableStreamTestServer` revocation/multi-gateway gates), `deno lint` (0 errors), `deno fmt --check` (0 findings), `deno doc --lint` on `streams.ts` & `proxy.ts` (0 errors), `check-doctrine` (0 FAIL, 0 new WARN), `quality:gate`, `check:netscript-jsr-specifiers`, `docs:jsdoc-examples`, `docs:readme-fences`, `check:mcp-export-corpus`, `check:publish-assets`, `publish:dry-run` on both packages, and zero `deno.lock` churn. |
| 2026-11-25 | S1 | docs-fix | Fixed CI `docs:exports-drift` & `docs:accuracy` failures by documenting `@netscript/contracts/streams` (all 12 new symbols) in `docs/site/reference/contracts/index.md` and `@netscript/plugin-streams-core/proxy` in `docs/site/reference/plugin-streams-core/index.md`, regenerated `agent-docs-prose.generated.ts` and `publish-assets.generated.ts`, and verified `docs:exports-drift`, `docs:accuracy`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:assets-barrel`, `check:publish-assets`, `docs:links`, `docs:jsdoc-examples`, `docs:readme-fences`, `quality:gate`, and `publish:dry-run` all PASS. |
| 2026-11-26 | S1 | review-fix | Addressed all 6 Round-1 IMPL-EVAL findings (`#issuecomment-7201980238`) on PR `#2683`: (1) RFC 3986 `pchar` minus `%`/`*` literal segment check in `defineStreamEndpoint`; (2) native `Headers` ByteString/name admission check + pre-handoff `buildStreamProxySseResponseHeaders`, exception-safe single-read decision snapshotters (`snapshotAuthDecision`/`snapshotRecheckDecision`), `try/catch` around `trustProxy`, and validated HTTP(S)-only no-userinfo/no-query/no-fragment upstream `baseUrl` composition; (3) synchronous pre-`200` `checkPre200Sync` loop with zero awaits before handoff, `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` keeping stream-start-only BOM strip, and chunked long-delay system clock (`scheduleChunkedDelay`); (4) removable `closeListeners` Set replacing long-lived `closedSignalPromise` + outer setup `try/catch`; (5) `stopDurableStreamTestServerCleanly` fixing `@durable-streams/server@0.3.9` `cancelAllWaits()` splice-skip timer leak under `--sanitize-ops --sanitize-resources`, real `DurableStreamTestServer` Barrier 2 (Gateway 1 + Gateway 2 push `recheck`), and paced 1 update/s 32-reader real-server soak with mid-run revocations & offset-resume reconnects; (6) corrected `STREAM_ENDPOINT_PROTOCOL_V1`/`StreamEndpointProtocol` docs to `{ family: 'netscript.durable-stream-sse', major: 1 }` and regenerated docs/MCP bundles. |

## Verification Receipts

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/contracts --root packages/plugin-streams-core --root packages/mcp --ext ts,tsx` — PASS (277 files, 0 errors)
- `deno check --unstable-kv --frozen packages/contracts/streams.ts packages/plugin-streams-core/proxy.ts` — PASS
- `deno test --allow-all --sanitize-ops --sanitize-resources packages/contracts/tests packages/plugin-streams-core/tests` — PASS (140 passed, 0 failed; Deno 2.9.8; both ops & resource sanitizers enabled across all real `DurableStreamTestServer` Barrier 1, Barrier 2, Gate 5, and paced 1 update/s 32-reader soak tests)
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/contracts --root packages/plugin-streams-core --root packages/mcp --ext ts,tsx` — PASS (276 files, 0 occurrences)
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/contracts --root packages/plugin-streams-core --root packages/mcp --ext ts,tsx` — PASS (276 files, 0 findings)
- `deno doc --lint packages/contracts/streams.ts` & `deno doc --lint packages/plugin-streams-core/proxy.ts` — PASS (0 errors)
- `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/contracts --root packages/plugin-streams-core` — PASS (0 FAIL, 0 new WARN)
- `deno task quality:gate` (`quality:scan` + `arch:check`) — PASS
- `deno task docs:exports-drift` & `deno task docs:accuracy` — PASS
- `deno task check:agent-docs-prose` & `deno task check:mcp-export-corpus` & `deno task check:publish-assets` — PASS
- `deno task check:netscript-jsr-specifiers` — PASS (`failures=0`)
- `deno task docs:jsdoc-examples` — PASS (`failures=0`)
- `deno task docs:readme-fences` — PASS (`syntax_invalid=0`)
- `deno task --cwd packages/contracts publish:dry-run` — PASS
- `deno task --cwd packages/plugin-streams-core publish:dry-run` — PASS
- `git diff --stat -- deno.lock` — empty (zero lock churn; `@orpc/contract@^1.16.6` preserved)
