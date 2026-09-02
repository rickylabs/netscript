# Research — test-sdk-trace-header-authorship--1353

## Re-baseline

- Carried-in source: issue #1353, including the 2026-08-13 RFC 0001 Stage 5 normative amendment.
- Re-derived against `main` @ `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` on 2026-09-02.
- The amendment reverses the historical proposal: no `traceContextContribution()`, no public
  surface addition, and no movement of final trace injection out of the HTTP transport.
- #1349's merged slices (#1834, #1841, #1886) already shipped the contribution runtime, reserved
  trace-header enforcement, retry/reconnect epochs, and a one-contribution observability proof.

## Four-guarantee audit before this slice

| Guarantee | Audit status | File / symbol | Existing test evidence | Gap |
| --- | --- | --- | --- | --- |
| The transport creates the CLIENT span and is the sole final trace-header author. | Already proven | `packages/sdk/src/client/http-client-link.ts` — `createHttpClientLink`, `withSpan`, `SpanKind.CLIENT`, `injectContext` | `contributed headers retain CLIENT span and final trace injection` | No production gap. The existing test covered one contribution and did not match the wire `traceparent` span ID to the exported CLIENT span. |
| Contributor declarations of reserved trace keys are rejected. | Partially proven | `packages/sdk/src/internal/client-contributions/prepared-call.ts` — `RESERVED_HEADERS`, `isForbiddenHeader`, `validateHeaderKeys` | `unknown construction rejects ownership conflicts and reserved names` covered other reserved/mixed-case names | No explicit `traceparent`, `tracestate`, or `Traceparent` cases and no assertion that the diagnostic identifies the offending descriptor. |
| Retries and reconnects preserve correct span topology. | Partially proven | `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts` — `createTransportPolicy`, `startEpoch`; `http-client-link.ts` — transport `fetch` span | `forced unary retry prepares once...`, `HTTP retry materializes...`, and `iterator reconnect starts one new preparation epoch...` prove attempt/epoch behavior; the observability test proved only one CLIENT span | Parent/child topology was not asserted for retry or reconnect attempts. |
| Composition cannot double-inject or overwrite `traceparent` / `tracestate`. | Partially proven | `prepared-call.ts` rejects reserved declarations; `http-client-link.ts` injects final span context with `Headers.set` | The observability test covered one contribution; adapter tests covered multi-contribution headers separately | No two-contribution wire proof, no exact-one `traceparent` assertion, and no proof that the emitted span ID replaces stale pre-injection trace data. |

## Published-surface inspection

- `deno doc --filter SdkClientContribution packages/sdk/mod.ts` confirms the descriptor may prepare
  declared headers while transport, retry, tracing, discovery, and dispatch remain SDK-owned.
- `deno doc --filter createServiceClient packages/sdk/mod.ts` confirms contributions compose only
  through the existing client factory.
- `deno doc --filter trace packages/sdk/mod.ts` exits 1 (`Node trace was not found`).
- `deno doc --json packages/sdk/mod.ts` reports 144 root symbols and no trace contribution factory.

## jsr-audit surface scan

- Surface scanned: `packages/sdk/mod.ts` via `deno doc`, plus the package export map for final A/B
  doc-lint and publish gates.
- Planned public-surface delta: zero symbols and zero entrypoints.
- Slow-type / surface risks: none introduced by a test-only slice; existing export-map diagnostics
  are measured A/B against `origin/main` rather than treated as an absolute verdict.

## Open questions

- None. The amendment fixes ownership and scope; the audit limits implementation to proof tests.

