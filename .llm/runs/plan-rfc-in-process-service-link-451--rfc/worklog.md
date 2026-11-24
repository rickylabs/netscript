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
   - `InProcessServiceRegisterOptions`, `InProcessServiceRegistry`, `InProcessServiceError`, `InProcessServiceErrorCode`
   - `HttpServiceClientTransport`, `DirectInProcessServiceClientTransport`, `RegistryInProcessServiceClientTransport`, `InProcessServiceClientTransport`, `ServiceClientTransport`
   - `createInProcessServiceRegistry`, `registerInProcessService`, `unregisterInProcessService`, `resolveInProcessService`, `clearInProcessServices`
   - `transport?: ServiceClientTransport` on `CreateServiceClientOptions` and `DefineServiceConfig` (default `{ kind: 'http' }`)
   - `CreateInProcessServiceClientOptions`, `createInProcessServiceClient`
2. **Proposed package-private seams (excluded from `deno doc`):**
   - `packages/sdk/src/internal/fetch-rpc-link.ts` (`createFetchRpcClientLink` shared by HTTP and in-process)
   - `packages/sdk/src/client/in-process-client-link.ts` (`createInProcessClientLink`, `createInProcessFetch` with abort race, late body cancellation, and `withContextAsync(extractContext({}), ...)` `ROOT_CONTEXT` detachment)
3. **Ports & dependency direction:** Structural `InProcessServiceApp` in `@netscript/sdk/ports` (no root `@netscript/service` import, preserving 0 browser-unsafe edges and Deno-free universal ports); retain existing `@netscript/service/rpc-path` leaf import for `buildServiceRpcPath`.
4. **Commit slices (design draft PR):**
   - S1: Write `rfcs/0000-in-process-service-link.md` + update run `worklog.md` and `drift.md` with source-inspected and measured evidence; validate links, hygiene, and measured probes.
5. **Deferred scope:** Implementation under `packages/sdk` awaits owner RFC acceptance; GET transport/dedup repair remains owned by `#2611` (`#2610`); deployment/host composition remains orthogonal under `#891`.

## Research & Measured Evidence

All baseline probes ran against `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (Deno `2.9.7`, TypeScript `6.0.3`, locked `@orpc/client@1.15.5`, `hono@4.13.5`) with zero edits under `packages/` or `plugins/`.

### Probe 1 — `deno doc` & MCP `find_guidance`

- Command: `deno doc packages/sdk/mod.ts`, `deno doc packages/sdk/src/client/mod.ts`, `deno doc packages/sdk/src/ports/mod.ts`, `deno doc --filter ServiceApp packages/service/mod.ts` (exit `0`).
  - Observed `ServiceApp` (`packages/service/src/types.ts:20-31`): `fetch(request: Request, env?: ServiceEnvironment): Response | Promise<Response>` and `request(input: Request | string | URL, init?: RequestInit, env?: ServiceEnvironment): Response | Promise<Response>`, where `ServiceEnvironment.remoteAddr?: Deno.Addr` (`packages/service/src/types.ts:15-18`).
- Command: `deno run -A packages/cli/bin/netscript.ts agent mcp` (`find_guidance`, exit `0`).
  - Returned guidance references for `pages/services-sdk/service-layout`, `pages/reference/sdk`, and `pages/observability/how-to/add-opentelemetry` (`withRPC({ traceContext: true })`).

### Probe 2 — `deno info --json` dependency-direction measurement (O-1)

- Baseline command: `deno info --json packages/sdk/mod.ts` (exit `0`):
  - `SDK_MOD_MODULE_COUNT: 113`
  - `@netscript/service` leaf modules only: `packages/service/src/primitives/rpc-path.ts` and `packages/service/src/auth/internal-credential/*` (4 files)
  - `HAS_LOGGER: false`, `HAS_KV: false`, `HAS_HONO: false`, `HAS_NODE: false`
- Negative control command: `deno info --json` on temp `.ts` containing only `import type { ServiceApp } from "@netscript/service"; export type Probe = ServiceApp;` (exit `0`, temp file removed):
  - `IMPORT_TYPE_ROOT_SERVICE_COUNT: 215`
  - `HAS_LOGGER: true`, `HAS_KV: true`, `HAS_HONO: true`, `HAS_NODE: true`
  - Proves importing `type { ServiceApp }` from `@netscript/service` root fails `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63,103-110`.

### Probe 3 — Naive `app.fetch(new Request(req, init))` vs HTTP parity probe

- Command: `deno eval` mounting a synthetic `@netscript/service` app with `createStaticCredentialAuthenticator`, `createScopeAuthorizer`, `withRPC({ rpcPath: '/api/rpc/v1/demo' })`, and RFC 0001 `defineSdkClientContribution` (exit `0`).
- Measured outputs:
  - `new Request(base, { headers, cache, signal })` in Deno 2.9.7 succeeds across all four cache modes (`undefined`, `"default"`, `"no-store"`, `"force-cache"`), with `rebuilt.signal.aborted` transitioning synchronously `false → true` on `controller.abort()`.
  - `deny401Http` and `deny401InProc` identical: `{ isSuccess: false, isDefined: false, name: "Error", code: "UNAUTHORIZED", status: 401, message: "Unauthorized" }`.
  - `deny403Http` and `deny403InProc` identical: `{ isSuccess: false, isDefined: false, name: "Error", code: "FORBIDDEN", status: 403, message: "Forbidden" }`.
  - **Naive abort failure (measured):**
    - `abort_http-coop`: `{ outcome: { rejected: "Error", message: "user-aborted", ms: 32 }, handler: { aborted: true, settled: true } }`
    - `abort_inProc-coop` (naive): `{ outcome: { resolved: { done: true }, ms: 31 }, handler: { aborted: true, settled: true } }` — **resolved instead of rejecting!**
    - `abort_http-noncoop`: `{ outcome: { rejected: "Error", message: "user-aborted", ms: 31 }, handler: { aborted: true, settled: true } }`
    - `abort_inProc-noncoop` (naive): `{ outcome: { resolved: { done: true }, ms: 154 }, handler: { aborted: true, settled: true } }` — **waited 154ms and resolved instead of rejecting!**
  - **Naive OTel ALS leakage when `propagateTraceContext: false` (measured):**
    - `parentTraceId`: `"89d1d48751237491e240e129888dbc51"`
    - `httpSpans` SERVER span (`GET /api/rpc/v1/demo/*`, `kind: 1`): `traceId: "0093a5d212d668cafcf562017c43e7fb"`, `parentId: null` (detached root trace).
    - `inProcRawSpans` SERVER span (without detachment): `traceId: "89d1d48751237491e240e129888dbc51"`, `parentId: "dd05de7d09cf87cb"` — **leaked caller trace via ALS!**
    - `inProcRootSpans` SERVER span (with `ROOT_CONTEXT` detachment): `traceId: "b0ea8ca738c3a8a244944f41b132d64d"`, `parentId: null` (exact HTTP parity).
  - **Current `main` GET dedup boundary (`#2610`/`#2611`, measured):**
    - `currentMainGetDedupInit`: `{ hasSignal: false }` on `GET` procedure with `context: { cache: "no-store", signal }`.

### Probe 4 — Abort-racing + `extractContext({})` detached single-app parity probe

- Command: `deno eval` mounting one `ServiceApp` (`running.app` backing both `Deno.serve` HTTP and abort-racing `createInProcessFetch` using `withContextAsync(extractContext({}), ...)` from `@netscript/telemetry/context`), exercising two authorized partitioned contexts (`alice`/`ctx-alice`, `bob`/`ctx-bob`), one denied caller (`mallory`/`ctx-mallory`), `CacheQuery(new MemoryCacheStore())`, W3C `traceparent` + `tracestate`, and cooperative/non-cooperative/pre-aborted cancellation (exit `0`).
- Measured outputs:
  - Trace parity (`propagateTraceContext: true`, `callerTraceId: "26d9852bfa12309151a1d83412fa37c2"`):
    - HTTP: `serverParentEqualsClient: true`, `tracestate: "vendor=xyz"`, `path: "/api/rpc/v1/demo/readItem"`.
    - In-process (detached): `serverParentEqualsClient: true`, `tracestate: "vendor=xyz"`, `path: "/api/rpc/v1/demo/readItem"`.
  - Trace isolation (`propagateTraceContext: false` via `withContextAsync(extractContext({}), ...)`):
    - `callerTraceId: "49d983d2be9678ff87afb9f948d86080"`, `serverTraceId: "7a8268e07e8f4f6794b5f6fe4a143ed7"`, `serverParentId: null`, `detached: true`.
  - Abort parity with `createInProcessFetch`:
    - `race_http-coop`: `{ rejected: "user-aborted", ms: 32, handler: { aborted: true, settled: true } }`
    - `race_inProc-coop`: `{ rejected: "user-aborted", ms: 32, handler: { aborted: true, settled: true } }`
    - `race_http-noncoop`: `{ rejected: "user-aborted", ms: 31, handler: { aborted: true, settled: true } }`
    - `race_inProc-noncoop`: `{ rejected: "user-aborted", ms: 31, handler: { aborted: true, settled: true } }`
    - `preAborted`: `{ rejected: "already-aborted", handlerEntered: false }`
  - Single-app cache-partition & denial parity (`sameMountedAppInstance: true`, `path: "/api/rpc/v1/vault/readSecret"`, `tracestate: "ns=parity"`):
    - Both HTTP and in-process: `resA.owner === "alice"`, `resB.owner === "bob"`, `deniedCode === "FORBIDDEN"`, `deniedStatus === 403`, `cachedAOwner === "alice"`, `cachedBOwner === "bob"`, `cachedDeniedIsNull === true`, `distinctKeys === true`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Read required skills, doctrine, RFC 0001, `#451` (incl. `issuecomment-7120821765`), `#2610`/`#2611`/`#891`/`#822`/`#824`/`#850`, SDK & Service source; ran `deno doc`, MCP `find_guidance`, `deno info --json`, and live parity probes on `main` `87965d80`. |
| 2026-11-24 | S1 | draft | Authored `rfcs/0000-in-process-service-link.md` from template with full parity spec, O-1 decision, RFC 0001 reconciliation, abort/trace proofs, acceptance tests, alternatives, and unresolved questions. |
| 2026-11-24 | S1 | validate | Internal doc link check (`rfcs/0000-in-process-service-link.md` + default internal doc roots), close-gate keyword parser (`extractClosingIssues`), process-language check, and leak scan all exit `0` clean; restored incidental `deno.lock` churn from probe. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Define structural port `InProcessServiceApp` in `@netscript/sdk/ports` instead of `import type { ServiceApp } from '@netscript/service'` | Measured `deno info --json`: importing `ServiceApp` from `@netscript/service` root expands graph 113 → 215 modules pulling `logger`, `kv`, `hono`, `node:*` (breaking `define-services-browser-import_test.ts`) and exposes `Deno.Addr`. | Probe 2; `packages/service/src/types.ts:15-31`; `packages/sdk/tests/query/define-services-browser-import_test.ts:38-63` |
| Keep `createInProcessClientLink` package-private alongside `createHttpClientLink` | `client-contribution-private-surface_test.ts` forbids `createHttpClientLink` / `ClientLinkPort` from public `deno doc`; public entrypoints are `createServiceClient({ transport })`, `createInProcessServiceClient`, and `defineServices`. | `packages/sdk/tests/client-contribution-private-surface_test.ts:4-19`; RFC 0001 § Transport ownership |
| Require abort-racing + late `Response.body` cancellation in `createInProcessFetch` | Measured: naive `app.fetch(new Request(req, init))` delivers `signal.aborted` to handler but resolves caller instead of rejecting. | Probe 3 & Probe 4 |
| Require `ROOT_CONTEXT` detachment (`withContextAsync(extractContext({}), ...)`) around `app.fetch(request)` | Measured: without detachment, `@hono/otel` leaks caller's active OTel span via ALS when `propagateTraceContext: false`; with detachment, both `true` and `false` match HTTP exactly with zero telemetry-package changes. | Probe 3 & Probe 4; `packages/telemetry/src/context/w3c.ts:201-202` |
| Use synthetic origin `https://in-process.localhost` with `secure: true` and `SdkClientTransportDescriptor.kind: 'http' | 'in-process'` | RFC 6761 `.localhost` avoids DNS and `serviceName` hostname issues; `secure: true` matches confidentiality and satisfies `createBearerSdkClientContribution` & `createInternalCredentialSdkClientContribution` without `allowInsecureTransport`. | `packages/plugin-auth-core/src/sdk/bearer-contribution.ts:87-95`; `packages/sdk/src/client/internal-credential-contribution.ts:118-129` |
| Reference `#2611` (`#2610`) rather than redesigning GET dedup | Shared `RPCLink` / `DedupeRequestsPlugin` ensures `#2611`'s GET fix applies automatically to both HTTP and in-process. | Probe 3 (`hasSignal: false`); `#2610`/`#2611` |
| Place new port types in existing `packages/sdk/src/ports/service-client.ts` (avoid 13th child in `ports/`) | `packages/sdk/src/ports/` currently has 12 immediate children (R-FOLD-CARD cap = 12). | `docs/architecture/doctrine/05-folder-structure.md:167-185`; `packages/sdk/src/ports/` |

## Validation

| Gate / Check | Command | Exit | Result |
| --- | --- | --- | --- |
| RFC internal doc link check | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-in-process-service-link.md --pretty` | `0` | `docs=1 broken-links=0 broken-anchors=0 orphans=0` |
| Repo internal doc link check | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --pretty` | `0` | `docs=105 broken-links=0 broken-anchors=0 orphans=0` |
| Close-gate closing-keyword parser | `deno eval --no-lock` calling `extractClosingIssues` on RFC, `worklog.md`, `drift.md` | `0` | `[]` on all three files |
| Closing-keyword prose grep | Regex scan for closing-keyword verbs followed by issue references across RFC, `worklog.md`, `drift.md` | `0` (clean, 0 matches) | Clean — zero closing keywords in prose |
| RFC process-language grep | Regex scan for process/workflow terms on `rfcs/0000-in-process-service-link.md` | `0` (clean, 0 matches) | Clean — zero process language in RFC |
| Leak / hygiene grep | Regex scan for machine paths, IPv4 addresses, private references, or token prefixes across RFC, `worklog.md`, `drift.md` | `0` (clean, 0 matches) | Clean — zero paths, IPs, private refs, or secrets |
| Baseline probes (Probes 1–4) | `deno doc`, MCP `find_guidance`, `deno info --json`, `deno eval` parity probes against `main` `87965d80` | `0` | All measured behaviors recorded above |

## Drift

See `drift.md`.
