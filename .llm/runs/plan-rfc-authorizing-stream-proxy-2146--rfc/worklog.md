# Worklog: RFC draft: revocable authorizing stream proxy for bearer and cookie clients (#2146)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-authorizing-stream-proxy-2146--rfc` |
| Branch         | `plan/rfc-authorizing-stream-proxy-2146` |
| Issue          | #2146 — design draft PR; body carries `Refs #2146` only (no closing keyword anywhere, including prose) |
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

- `rfcs/0000-authorizing-stream-proxy.md` from `rfcs/0000-template.md`: a generic, revocable authorizing proxy for Streams SSE serving bearer and cookie clients with offset resume, mountable in a `defineService` app and declarable in a contract; relationship to the existing chat-specific stream proxy.
- Acceptance cases from the issue comment `issuecomment-7120816734`: two synthetic sessions on one stream, delivery paused at the authorization check, one session revoked, then released — only the still-authorized reader receives the batch and its cursor-advancing control; the revoked reader closes, releases its upstream reader, and fails fresh admission. Also an idle reader at expiry, and two gateways sharing a synthetic revocation source with the change initiated on the other gateway. Session identity and the revocation decision stay in application policy.
- Mark every claim about current behavior source-inspected or measured.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- No accepted governing RFC exists; the existing use-case issue is not RFC acceptance. Implementation waits for accepted design scope.
- #2654 (producer-scoped connection configuration) is issue-only: reference it as related, do not design it.
- #2650 edits the Streams docs concurrently; do not edit `docs/site/**`.
- Ask the coordinator before touching another lane's files.

### Gates

- RFC file template-shaped and link-clean; no claim about shipped API that `main` does not contain.

## Design

Design-only deliverable (`rfcs/0000-authorizing-stream-proxy.md`); no framework source files created in this run.

1. **Public surface (proposed in RFC)** —
   - `@netscript/contracts/streams`: `defineStreamEndpoint`, `buildStreamEndpointUrl`, `StreamEndpointContract`, `StreamEndpointClientAuthMode`.
   - `@netscript/service`: `StreamProxyMount`, `StreamProxyMountContext`, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `ContractAuthorizerOptions.streamEndpoints`, `OpenAPIConfig` stream projection, pre-drain `shutdownSignal`.
   - `@netscript/plugin/service`: `PluginServiceConfig.streamProxies`.
   - `@netscript/plugin-streams-core/proxy`: `createNetScriptStreamProxy`, `bindStreamProxy`, `StreamProxyOptions`, `StreamProxyPolicy` hooks (`authorize`, `recheck`, `resolvePath`), `StreamProxyRevocationSource`, `StreamProxyClockPort`, shared header sanitizer.
   - `@netscript/fresh/streams`: `proxyUrl` option on `createNetScriptStreamEventSourceV1`.
   - `@netscript/fresh/ai`: backward-compatible `createNetScriptChatStreamProxy` reusing shared sanitization without forwarding client `Cookie` headers upstream.
2. **Domain vocabulary** — Delivery unit (`data[]` + committing `control`), `StreamProxyAuthDecision<TGrant>`, `StreamProxyRecheckDecision`, `StreamProxyRecheckReason`, `StreamProxyCloseReason`, `StreamProxyRevocationSignal`.
3. **Ports** — `StreamProxyClockPort` (deterministic expiry/idle timers), `StreamProxyRevocationSource<TGrant>` (cross-gateway push wake seam), `StreamProxyMount` (keeps `@netscript/service` acyclic with `@netscript/plugin-streams-core`).
4. **Constants** — `STREAM_SSE_WIRE_EVENT_NAMES_V1` (`['data', 'control']`), reserved protocol query keys (`['offset', 'live', 'cursor']`), `STRIPPED_STREAM_PROXY_RESPONSE_HEADERS`, `StreamProxyCloseReason` union, `StreamProxyRecheckReason` union.
5. **Commit slices (this design draft)** —
   - `S1`: Draft `rfcs/0000-authorizing-stream-proxy.md` + run artifacts (`research.md`, `worklog.md`, `context-pack.md`); gates: internal doc-link check, closing-keyword & leak hygiene grep, baseline measurement script against `main` `87965d80`.
6. **Deferred scope** — Implementation awaits owner RFC acceptance; `#2654` (producer-scoped connection configuration) referenced only; `docs/site/**` untouched (`#2650`); long-poll/snapshot `StreamDB` proxy mode deferred to follow-up / open question.
7. **Contributor path** — Start from `rfcs/0000-authorizing-stream-proxy.md` § Reference-level explanation and § Acceptance tests and implementation gates.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Grounded baseline via `find_guidance`, `deno doc`, direct source inspection across `plugin-streams-core`, `plugins/streams`, `fresh`, `service`, `contracts`, `plugin-auth-core`, and live `deno eval` measurement against `DurableStreamTestServer` (`research.md`). |
| 2026-11-24 | S1 | draft-rfc | Authored `rfcs/0000-authorizing-stream-proxy.md`, `research.md`, and `context-pack.md`; kept `packages/`, `plugins/`, and `docs/site/` untouched. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Place runtime proxy in `@netscript/plugin-streams-core/proxy`, contracts in `@netscript/contracts/streams`, and structural mount in `@netscript/service` | `@netscript/plugin-streams-core` already imports `@netscript/service`; structural `StreamProxyMount` prevents a circular dependency while keeping backend services free of `@netscript/fresh`. | `packages/plugin-streams-core/deno.json:18`, `packages/service/deno.json` |
| Gate authorization atomically on `(data[], control)` delivery units | Prevents leaking unauthorized `event: data` frames and prevents advancing `streamNextOffset` when a session is revoked mid-delivery. | `issuecomment-7120816734`, `stream-sse-v1.ts:118-142` |
| Hybrid idle expiry (`ClockPort` `expiresAtMs` + `recheckEveryMs` + optional push `revocationSource`) | Next-event-only leaks idle sockets; timer-only leaks active batches after revocation. | `08-runtime-state-failure.md:104-125`, `issuecomment-7120816734` |
| Expose pre-drain `shutdownSignal` from `ServiceShutdownCoordinator` | `ServiceShutdownCoordinator` awaits `server.shutdown()` before running `onShutdown` hooks, so long-lived SSE routes need pre-drain abort notification. | `service-shutdown.ts:96-147` |
| Separate sibling `defineStreamEndpoint` contract rather than embedding inside oRPC procedure map | `traverseContract` and `OpenAPIGenerator` walk every enumerable key expecting `'~orpc'` nodes, and `ContractAuthorizerRawRoute` rejects parameterized paths. | `contract-procedure-index.ts:187-205`, `contract-raw-routes.ts:12,45` |
| Strict upstream header allowlist + cookie Fetch Metadata/Origin guard | Measured `createNetScriptChatStreamProxy` forwarding client `Cookie` upstream and `DurableStreamTestServer` emitting `access-control-allow-origin: *`. | `research.md` § 3 |

## Validation

| Gate | Command | Exit | Result |
| ---- | ------- | ---- | ------ |
| Internal doc links (RFC) | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-authorizing-stream-proxy.md --pretty` | `0` | `docs=1 broken-links=0 broken-anchors=0 orphans=0` |
| Internal doc links + doctrine anchors | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-authorizing-stream-proxy.md --root docs/architecture/doctrine --pretty` | `0` | `docs=13 broken-links=0 broken-anchors=0 orphans=0` |
| Closing-keyword hygiene | `grep -Eni '(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)[^a-zA-Z0-9\n]{0,20}(#[0-9]+|issues/[0-9]+)' rfcs/0000-authorizing-stream-proxy.md .llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/*.md` | `1` (no matches) | Zero closing keywords |
| Process-language scan (RFC) | `grep -Eni '\b(owner|evaluator|harness|worklog|coordinator|plan-eval|impl-eval|neon|sol|opus|codex|antigravity|t3)\b|\.llm/runs' rfcs/0000-authorizing-stream-proxy.md` | `1` (no matches) | Zero process language |
| Private-name / leak scan | `grep -Eni` scan across `rfcs/0000-authorizing-stream-proxy.md` and run artifacts for machine paths, loopback/LAN IPs, and private consumer-app/coordinator names | `1` (no matches) | Zero leaks |
| Current-main measurement probe | `deno eval --no-lock ...` (recorded in `research.md` § 3) | `0` | Verified chat proxy cookie forwarding, `createContractAuthorizer` param raw-route error, `createNetScriptStreamEventSourceV1` prefixing, and `DurableStreamTestServer` SSE wire framing + offset resume |

## Drift

See `drift.md`.
