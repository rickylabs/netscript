# Worklog: RFC draft: mounted SDK transport parity for in-process service clients (#451)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-in-process-service-link-451--rfc` |
| Branch         | `plan/rfc-in-process-service-link-451` |
| Issue          | #451 — design draft PR; body carries `Refs #451` only (no closing keyword anywhere, including prose) |
| Classification | design draft awaiting owner |
| Archetype      | RFC document (`rfcs/0000-*.md`); no framework source |
| Scope overlays | `SCOPE-docs.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| Design reviewer | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — design-only deliverable; the independent design review is the gate.
- Design review: one independent design verdict at the exact head; documentation cap of two rounds. The design verdict is not an IMPL-EVAL and does not authorize implementation.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- `rfcs/0000-in-process-service-link.md` from `rfcs/0000-template.md`: an in-process link that mounts a service and keeps parity with the HTTP link.
- Acceptance cases from the issue comment `issuecomment-7120821765`: one mounted synthetic service, the same typed procedure through HTTP and the in-process link; two caller contexts with separate cache partitions and one denied caller; compare effective RPC path, response or denial, trace propagation, and cache isolation; abort one in-flight caller signal and show the mounted handler observes cancellation as the HTTP handler does; neither transport shares a result between contexts or retains the cancelled request.
- Reconcile with accepted RFC 0001 (typed SDK client contributions: header preparation, cache partitions, transport-owned tracing) and the `ServiceApp` dependency-direction decision in the issue.
- Mark every claim about current behavior source-inspected or measured.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- #2611 owns the SDK GET transport/dedup repair: reference it, do not redesign GET transport or dedup.
- #891 (deploy plugin RFC) keeps this orthogonal; #822 closed unmerged; #824 and #850 are superseded — do not build on them.
- No accepted governing RFC covers the in-process link; this draft does not authorize implementation.
- Ask the coordinator before touching another lane's files.

### Gates

- RFC file template-shaped and link-clean; no claim about shipped API that `main` does not contain.

## Design

Design-only deliverable (`rfcs/0000-in-process-service-link.md`); no files under `packages/` or `plugins/` are modified in this run.

1. **Proposed public surface (`@netscript/sdk/ports`, `./client`, `./presets`, `.`):**
   - `InProcessServiceApp` (structural port: `fetch(request: Request): Response | Promise<Response>`)
   - `InProcessServiceRegistry` (`register` with inline `{ readonly replace?: boolean }`, `unregister`, `resolve`, `has`, `clear`)
   - `ServiceClientTransport` (inlined 3-arm discriminated union — trimming 5 redundant arm/options type aliases across all barrels)
   - `InProcessServiceError`, `InProcessServiceErrorCode` (`IN_PROCESS_SERVICE_INVALID`, `IN_PROCESS_SERVICE_DUPLICATE`, `IN_PROCESS_SERVICE_NOT_FOUND`, `IN_PROCESS_REDIRECT_UNSUPPORTED`)
   - `createInProcessServiceRegistry`, `registerInProcessService`, `unregisterInProcessService`, `resolveInProcessService`, `clearInProcessServices`
   - `transport?: ServiceClientTransport` on `CreateServiceClientOptions` and `DefineServiceConfig` (default `{ kind: 'http' }`)
   - `CreateInProcessServiceClientOptions`, `createInProcessServiceClient`
2. **Proposed package-private seams (excluded from `deno doc`):**
   - `packages/sdk/src/internal/fetch-rpc-link.ts` (`createFetchRpcClientLink` shared by HTTP and in-process)
   - `packages/sdk/src/client/in-process-client-link.ts` (`createInProcessClientLink` with epoch-pinned `WeakMap<InProcessServiceApp, ClientLinkPort>` dispatch + `createInProcessFetch` with pre-dispatch abort subscription, post-headers `wrapAbortableResponse`, single late-body cancel path, redirect refusal, and `withContextAsync(extractContext({}), ...)` `ROOT_CONTEXT` detachment)
3. **Ports & dependency direction:** Structural `InProcessServiceApp` in `@netscript/sdk/ports` (no root `@netscript/service` import, preserving 0 browser-unsafe edges and Deno-free universal ports); retain existing `@netscript/service/rpc-path` leaf import for `buildServiceRpcPath`.
4. **Commit slices (design draft PR):**
   - S1 (Round 1): Write initial `rfcs/0000-in-process-service-link.md` + update run `worklog.md` and `drift.md` with baseline evidence.
   - S2 (Round 2): Address all 6 accepted DESIGN-EVAL blockers and 3 accepted advisories (preserving the verbatim owner authorization excerpt at lines 19–25), commit runnable frozen probe fixtures under `.llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/`, and re-verify all gates.
5. **Deferred scope:** Implementation under `packages/sdk` awaits owner RFC acceptance; GET transport/dedup repair remains owned by `#2611` (`#2610`); deployment/host composition remains orthogonal under `#891`.

## Research & Measured Evidence

All baseline and round-2 probes ran against `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (Deno `2.9.7`, TypeScript `6.0.3`, locked `@orpc/client@1.15.5`, `@orpc/server@1.15.5`, `jsr:@hono/hono@4.13.13` per `packages/service/deno.json:24-27`) with zero edits under `packages/` or `plugins/`.

### Probe 1 — `deno doc` & MCP `find_guidance`

- Command: `deno doc --frozen --json` on `packages/sdk/mod.ts`, `packages/sdk/src/client/mod.ts`, `packages/sdk/src/ports/mod.ts`, `packages/sdk/src/presets/mod.ts`, plus `deno doc --filter ServiceApp packages/service/mod.ts` (exit `0`).
  - Observed `ServiceApp` (`packages/service/src/types.ts:20-31`): `fetch(request: Request, env?: ServiceEnvironment): Response | Promise<Response>` and `request(input: Request | string | URL, init?: RequestInit, env?: ServiceEnvironment): Response | Promise<Response>`, where `ServiceEnvironment.remoteAddr?: Deno.Addr` (`packages/service/src/types.ts:15-18`).
  - Measured baseline exported symbol counts (`deno doc --frozen --json`, v2 `symbols`): `packages/sdk/mod.ts` = `159`, `packages/sdk/src/client/mod.ts` = `54`, `packages/sdk/src/ports/mod.ts` = `96`, `packages/sdk/src/presets/mod.ts` = `94`.
- Command: `deno run -A packages/cli/bin/netscript.ts agent mcp` (`find_guidance`, exit `0`).
  - Returned guidance references for `pages/services-sdk/service-layout`, `pages/reference/sdk`, and `pages/observability/how-to/add-opentelemetry` (`withRPC({ traceContext: true })`).

### Probe 2 — `deno info --json` dependency-direction measurement (O-1)

- Baseline command: `deno info --frozen --json packages/sdk/mod.ts` (exit `0`):
  - `SDK_MOD_MODULE_COUNT: 113`
  - `@netscript/service` leaf modules only: `packages/service/src/primitives/rpc-path.ts` and `packages/service/src/auth/internal-credential/*` (4 files)
  - `HAS_LOGGER: false`, `HAS_KV: false`, `HAS_HONO: false`, `HAS_NODE: false`
- Negative control command: `deno info --json` on temp `.ts` containing only `import type { ServiceApp } from "@netscript/service"; export type Probe = ServiceApp;` (exit `0`, temp file removed):
  - `IMPORT_TYPE_ROOT_SERVICE_COUNT: 215`
  - `HAS_LOGGER: true`, `HAS_KV: true`, `HAS_HONO: true`, `HAS_NODE: true`
  - Proves importing `type { ServiceApp }` from `@netscript/service` root fails `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63,103-110`.

### Probe 3 — Round-1 baseline defect measurements (naive `app.fetch` & ALS leakage)

- Baseline `deno eval` probes on `main` `87965d80` established:
  - `new Request(base, { headers, cache, signal })` in Deno 2.9.7 succeeds across all four cache modes (`undefined`, `"default"`, `"no-store"`, `"force-cache"`), with `rebuilt.signal.aborted` transitioning synchronously `false → true` on `controller.abort()`.
  - Naive `app.fetch(new Request(req, init))` delivered `signal.aborted === true` to the handler **but resolved `{ done: true }` instead of rejecting** on both cooperative and non-cooperative handlers.
  - Calling `app.fetch(request)` without `ROOT_CONTEXT` detachment leaked the caller's active OTel span via ALS when `propagateTraceContext: false` (SERVER span inherited caller `traceId` and non-null `parentId`); detaching via `withContextAsync(extractContext({}), ...)` produced a fresh root SERVER span (`parentId: null`) matching HTTP.
  - Current `main` `DedupeRequestsPlugin` stripped `context.signal` (`hasSignal: false`) and internal context symbols (`hasSym: false` in `RPCLink.fetch`) on deduped `GET` requests (`#2610`/`#2611`).
  - Locked `@orpc/client@1.15.5` `StandardRPCLinkCodec.decode()` decoded a raw `302` empty-body redirect response as `[null, null, false, true]` (`isSuccess: true, data: null`), proving `createInProcessFetch()` must explicitly refuse WHATWG redirect statuses (`301, 302, 303, 307, 308`).

### Probe 4 — Committed runnable frozen parity & abort-barrier probe (Round 2)

- Files:
  - `.llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/in-process-fetch-adapter.ts`
  - `.llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/parity-probe.ts`
- Command: `deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/parity-probe.ts` (exit `0`, zero `deno.lock` changes).
- Measured outputs:
  - Single-app parity (`running.app` backing both loopback HTTP and round-2 `createInProcessFetch`):
    - Identical path `/api/rpc/v1/vault/readSecret`, `ownerA: "alice"`, `ownerB: "bob"`, `deny401: { isDefined: false, code: "UNAUTHORIZED", status: 401 }`, `deny403: { isDefined: false, code: "FORBIDDEN", status: 403 }`, `cached403IsNull: true`, and **measured contract-defined error** `definedError: { isDefined: true, code: "VAULT_LOCKED", status: 409, data: { vaultId: "locked", reason: "maintenance" } }`.
  - Tracing parity:
    - `propagateTraceContext: true`: both HTTP and in-process `sameTrace: true`, `serverParentEqualsClient: true`, `serverParentIsNull: false`, `tracestate: "ns=round2"`.
    - `propagateTraceContext: false`: both HTTP and in-process `sameTrace: false`, `serverParentEqualsClient: false`, `serverParentIsNull: true`, `tracestate: null`.
  - Abort-lifecycle barriers (all assertions passed):
    - `preAbortedEntered: false`
    - `syncAbortMessage: "sync-setup-abort"`, `syncAbortBodyCancels: 1`
    - `abandonedMessage: "barrier-abort"`, `freshSucceededBeforeRelease: true`, `cachePreservedAfterAbandonedRelease: true`, `lateTrackedBodyCancels: 1`
    - `postHeadersStreamAbortMessage: "mid-stream-abort"`, `postHeadersStreamCancelCount: 1`

### Probe 5 — Committed runnable frozen edge-controls probe (Round 2)

- File: `.llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/edge-controls-probe.ts`
- Command: `deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/edge-controls-probe.ts` (exit `0`, zero `deno.lock` changes).
- Measured outputs:
  - Credential trust: `cleartextBearerRefusedBeforeDispatch: true`, `cleartextInternalRefusedBeforeDispatch: true`, `trustedBearerSucceeded: true`, `trustedInternalSucceeded: true`.
  - Mid-epoch replacement race (`WeakMap<InProcessServiceApp, ClientLinkPort>`): `epoch1AppId: "app-1"`, `epoch2AppId: "app-2"`, `app1Seen: ["Bearer epoch-1-app1-cred"]`, `app2Seen: ["Bearer epoch-2-app2-cred"]`.
  - Redirect refusal: `failedWithoutFollowing: true`, `outboundFetchCalls: 0`.
  - Concurrent identical-header two-partition `GET`: `wireCallsObserved: 1`, `coalescedUnderCurrentMain: true` (confirming shared-SDK `DedupeRequestsPlugin` coalescing prerequisite while cache layer isolates keys).
  - Near-2083 URL-length boundary: `payloadLen: 1989`, `httpFullUrlLen: 2082` (`GET`), `inProcFullUrlLen: 2088` (`POST`), `decodedPayloadIdentical: true`.
  - Peer-metadata `withRateLimit()` boundary:
    - Default socket-keyed: HTTP `[200, 429]`, in-process separate `'unknown'` bucket `[200, 429]` (with service warning logged).
    - Logical principal-keyed (`x-principal`): HTTP `user-42` `200`, in-process `user-42` `429` (`Retry-After` present), in-process `user-99` `200`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Read required skills, doctrine, RFC 0001, `#451` (incl. `issuecomment-7120821765`), `#2610`/`#2611`/`#891`/`#822`/`#824`/`#850`, SDK & Service source; ran `deno doc`, MCP `find_guidance`, `deno info --json`, and live parity probes on `main` `87965d80`. |
| 2026-11-24 | S1 | draft | Authored `rfcs/0000-in-process-service-link.md` from template with full parity spec, O-1 decision, RFC 0001 reconciliation, abort/trace proofs, acceptance tests, alternatives, and unresolved questions. |
| 2026-11-24 | S1 | validate | Internal doc link check (`rfcs/0000-in-process-service-link.md` + default internal doc roots), close-gate keyword parser (`extractClosingIssues`), process-language check, and leak scan all exit `0` clean; restored incidental `deno.lock` churn from probe. |
| 2026-11-24 | S2 | revision-round-2 | Addressed all 6 accepted DESIGN-EVAL round-1 blockers and 3 accepted advisories (preserving verbatim owner model authorization at lines 19–25); measured barrel export counts, `DedupeRequestsPlugin` context stripping, and `302` oRPC decode behavior; committed and ran frozen probes (`probes/in-process-fetch-adapter.ts`, `probes/parity-probe.ts`, `probes/edge-controls-probe.ts`); revised `rfcs/0000-in-process-service-link.md`, `worklog.md`, and `drift.md`; re-ran all doc/hygiene/link/lock checks. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Define structural port `InProcessServiceApp` in `@netscript/sdk/ports` instead of `import type { ServiceApp } from '@netscript/service'` | Measured `deno info --json`: importing `ServiceApp` from `@netscript/service` root expands graph 113 → 215 modules pulling `logger`, `kv`, `hono`, `node:*` (breaking `define-services-browser-import_test.ts`) and exposes `Deno.Addr`. | Probe 2; `packages/service/src/types.ts:15-31`; `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63` |
| Keep `createInProcessClientLink` and `createFetchRpcClientLink` package-private alongside `createHttpClientLink` | `client-contribution-private-surface_test.ts` forbids `createHttpClientLink` / `ClientLinkPort` from public `deno doc`; public entrypoints are `createServiceClient({ transport })`, `createInProcessServiceClient`, and `defineServices`. | `packages/sdk/tests/client-contribution-private-surface_test.ts:4-19`; RFC 0001 § Transport ownership |
| Pin per-epoch mounted app via per-client `WeakMap<InProcessServiceApp, ClientLinkPort>` | Measured: `DedupeRequestsPlugin` strips `options.context` before `fetch` on deduped `GET`; closing each `RPCLink` over its pinned `app` makes mid-epoch `{ replace: true }` immune to credential cross-delivery and cross-app coalescing while remaining GC-safe. | Probe 3 & Probe 5 (`edge-controls-probe.ts`) |
| Require pre-dispatch abort subscription, single late-body cancel path, post-headers `wrapAbortableResponse`, and explicit redirect refusal (`301/302/303/307/308`) in `createInProcessFetch` | Eliminates round-1 setup-abort race, double late-body cancel, and post-headers hung-body leak; prevents locked `@orpc/client@1.15.5` from silently decoding raw `302` redirects as `data: null` and ensures zero outbound redirect following. | Probe 3, Probe 4 (`parity-probe.ts`), Probe 5 (`edge-controls-probe.ts`) |
| Require `ROOT_CONTEXT` detachment (`withContextAsync(extractContext({}), ...)`) around `app.fetch(request)` | Measured: without detachment, `@hono/otel` leaks caller's active OTel span via ALS when `propagateTraceContext: false`; with detachment, both `true` and `false` match HTTP exactly with zero telemetry-package changes. | Probe 3 & Probe 4; `packages/telemetry/src/context/w3c.ts:201-202` |
| Explicitly scope parity boundaries for `maxUrlLength = 2083` verb fallback, `ServiceEnvironment.remoteAddr` (`withRateLimit()`), and identical-header unsignalled `GET` dedup coalescing | Empirical controls confirmed origin-length `GET`→`POST` fallback near 2083, `'unknown'` rate-limit fallback without `remoteAddr` (exact `429` parity with logical `key`), and shared `DedupeRequestsPlugin` coalescing on identical-header unsignalled `GET`. | Probe 5 (`edge-controls-probe.ts`); `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts:61-91`; `#2610`/`#2611` |
| Present shipped `SdkClientTransportDescriptor.kind: 'http'` verbatim and frame widening to `'http' | 'in-process'` honestly as a potentially breaking TypeScript change with a non-breaking v1 alternative | Shipped `packages/sdk/src/ports/sdk-client-contribution.ts:32` is literal `'http'`; external exhaustive `kind` checks would break even on HTTP-only callers. | `packages/sdk/src/ports/sdk-client-contribution.ts:30-39` |
| Inline transport arm types and `register` options (`-5` exports per barrel) and place new port types in existing `packages/sdk/src/ports/service-client.ts` | Keeps `packages/sdk/src/ports/` at 12 immediate children (R-FOLD-CARD) and reduces barrel growth against doctrine F-5 (`mod.ts` baseline `159` symbols). | Probe 1 (`deno doc --frozen --json`); `docs/architecture/doctrine/05-folder-structure.md:167-185`, `09-anti-patterns-and-fitness-functions.md:234-244` |

## Validation

| Gate / Check | Command | Exit | Result |
| --- | --- | --- | --- |
| Frozen parity & abort-barrier probe | `deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/parity-probe.ts` | `0` | HTTP ↔ in-process parity incl. `VAULT_LOCKED` defined error, W3C tracing + detachment, setup/in-flight/barrier/post-headers body abort (`lateTrackedBodyCancels: 1`, `postHeadersStreamCancelCount: 1`), `deno.lock` untouched |
| Frozen edge-controls probe | `deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/edge-controls-probe.ts` | `0` | Bearer/internal trust + cleartext refusal, mid-epoch `{ replace: true }` isolation, `302` redirect refusal (`outboundFetchCalls: 0`), identical-header GET dedup (`wireCallsObserved: 1`), near-2083 `GET`/`POST` parity, `withRateLimit()` default vs logical-key `429` parity, `deno.lock` untouched |
| RFC internal doc link check | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-in-process-service-link.md --pretty` | `0` | `docs=1 broken-links=0 broken-anchors=0 orphans=0` |
| Repo internal doc link check | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --pretty` | `0` | `docs=105 broken-links=0 broken-anchors=0 orphans=0` |
| Close-gate closing-keyword parser | `deno eval --no-lock` calling `extractClosingIssues` on RFC, `worklog.md`, `drift.md`, and probes | `0` | `[]` on every touched file |
| Closing-keyword prose grep | Regex scan for closing-keyword verbs followed by issue references across RFC, `worklog.md`, `drift.md`, probes | `0` (0 matches) | Clean — zero closing keywords in prose |
| RFC process-language grep | Regex scan for process/workflow/FCP terms on `rfcs/0000-in-process-service-link.md` | `0` (0 matches) | Clean — zero process or FCP language in RFC |
| Leak / hygiene grep | Regex scan for machine paths, IPv4 addresses, private references, or token prefixes across all touched files | `0` (0 matches) | Clean — zero paths, IPs, private refs, or secrets |
| Owner model authorization byte-identity check | `diff -u` on `worklog.md` lines 1–60 against `HEAD` | `0` | Byte-identical (`0` diff lines) |

## Drift

See `drift.md`.
