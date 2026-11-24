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

1. **Public surface (proposed in RFC, tightened in round 2)** —
   - `@netscript/contracts/streams`: `defineStreamEndpoint`, `buildStreamEndpointUrl`, `StreamEndpointContract`, `StreamEndpointClientAuthMode`.
   - `@netscript/service`: `StreamProxyMount`, `StreamProxyMountContext` (`params`, `principal`, `remoteAddr`, pre-drain `shutdownSignal`), `StreamProxyAdmissionMode`, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `ContractPolicyBindingOptions.streamMounts`, `streamEndpoints` cross-check option on `createContractAuthorizer` and `createContractOverlayAuthorizer`.
   - `@netscript/plugin-streams-core/proxy`: `createNetScriptStreamProxy`, `bindStreamProxy`, `StreamProxyOptions`, `StreamProxyPolicy` hooks (`authorize`, `recheck`, `resolvePath`), `StreamProxyRevocationSource`, `StreamProxyClockPort`. (Header hygiene helpers kept package-internal.)
   - `@netscript/fresh/streams`: `proxyUrl` option on `createNetScriptStreamEventSourceV1` with strict single-offset-authority validation.
   - `@netscript/fresh/ai`: `createNetScriptChatStreamProxy` keeps legacy defaults unchanged when `authorize` / `recheck` are omitted; adds opt-in revocable SSE delegation preserving `target`, `streamPath`, `query`, `auth`, and `fetch` overrides.
2. **Domain vocabulary** — Delivery unit (`data[]` + validated committing `control` with non-empty `streamNextOffset`), `invalidationEpoch`, `StreamProxyCredentialMode`, `StreamProxyAuthDecision<TGrant>`, `StreamProxyRecheckDecision`, `StreamProxyRecheckReason` (including `'post-subscribe'`), `StreamProxyCloseReason`, `StreamProxyRevocationSignal`.
3. **Ports** — `StreamProxyClockPort` (deterministic expiry/idle/policy/connect timers), `StreamProxyRevocationSource<TGrant>` (cross-gateway push wake seam with `{ signal }` and mandatory `'post-subscribe'` catch-up), `StreamProxyMount` (keeps `@netscript/service` acyclic with `@netscript/plugin-streams-core`), `ServiceProxyTrust` (trusted reverse-proxy origin resolution gated on socket `remoteAddr`).
4. **Constants** — `STREAM_SSE_WIRE_EVENT_NAMES_V1` (`['data', 'control']`), reserved protocol query keys (`['offset', 'live', 'cursor']`), internal safe upstream metadata allowlist + reserved response headers table, `StreamProxyCloseReason` union, `StreamProxyRecheckReason` union.
5. **Commit slices (this design draft)** —
   - `S1`: Draft `rfcs/0000-authorizing-stream-proxy.md` + run artifacts (`research.md`, `worklog.md`, `context-pack.md`) at `61b28d60`; DESIGN-EVAL round 1 returned `CHANGES_REQUESTED` with 7 blockers + 4 advisories.
   - `S2`: Round-2 revision addressing all 7 blockers and 4 advisories + runnable synthetic fixture `baseline-probe.ts`; gates: `baseline-probe.ts`, internal doc-link checks, closing-keyword / process-language / leak hygiene scans.
6. **Deferred scope** — Implementation awaits owner RFC acceptance; `#2654` (producer-scoped connection configuration) referenced only; `docs/site/**` untouched (`#2650`); OpenAPI/service-info SSE projection, `PluginServiceConfig.streamProxies`, public sanitizer helper exports, and long-poll/snapshot `StreamDB` proxy mode explicitly deferred to follow-ups.
7. **Contributor path** — Start from `rfcs/0000-authorizing-stream-proxy.md` § Reference-level explanation and § Acceptance tests and implementation gates.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Grounded baseline via `find_guidance`, `deno doc`, direct source inspection across `plugin-streams-core`, `plugins/streams`, `fresh`, `service`, `contracts`, `plugin-auth-core`, and live `deno eval` measurement against `DurableStreamTestServer` (`research.md`). |
| 2026-11-24 | S1 | draft-rfc | Authored `rfcs/0000-authorizing-stream-proxy.md`, `research.md`, and `context-pack.md`; opened draft PR #2658 at `61b28d60f0360f7ec4eb53fbe2c4e8e5992bc0e5`. |
| 2026-11-24 | S2 | design-rev-2 | Addressed all 7 accepted blockers and 4 advisories from DESIGN-EVAL round 1 (`issuecomment-7121812944`): monotonic `invalidationEpoch` fencing + Barrier 2; finite expiry activation, setup abort/late-result disposal, `'post-subscribe'` catch-up, and decoupled synchronous downstream close; unified incremental SSE parser bound + `control` `streamNextOffset` validation + EOF rules; authoritative single-registration contract policy across both authorizers + corrected `auth-middleware.ts:192-201` claim + symmetric `patternsIntersect` overlap checks; deterministic credential selection, `trustProxy` origin resolution, dynamic `Connection` stripping, and 3-tier response header ownership; single offset authority on `proxyUrl` + dispose-and-rebuild reconnect + retention condition; preserved legacy chat-proxy defaults with opt-in SSE delegation; tightened public exports (deferred OpenAPI/service-info/sanitizer/plugin-service), committed repeatable `baseline-probe.ts`, replaced literal example hostnames with symbolic origins, dropped FCP prose, and noted `#2146` reference status pending maintainer tracking-issue decision. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Place runtime proxy in `@netscript/plugin-streams-core/proxy`, contracts in `@netscript/contracts/streams`, and structural mount in `@netscript/service` | `@netscript/plugin-streams-core` already imports `@netscript/service`; structural `StreamProxyMount` prevents a circular dependency while keeping backend services free of `@netscript/fresh`. | `packages/plugin-streams-core/deno.json:18`, `packages/service/deno.json` |
| Fence delivery decisions with monotonic `invalidationEpoch`, `highWaterMark: 0`, and synchronous post-await `controller.enqueue` | Prevents a stale in-flight `allow` from emitting a batch after an observed push `'recheck'` wake or expiry tick; clarifies pull-only linearizability and WHATWG `close()` drain limits. | `issuecomment-7121812944` blocker 1, `issuecomment-7120816734` |
| Arm finite `expiresAtMs` immediately after `authorize`, add `'post-subscribe'` catch-up `recheck`, dispose late setup results, and close downstream synchronously before async upstream cancel | Closes the admission-to-subscribe revocation race, bounds setup cancellation and expiry contention during paused checks, and decouples downstream EOF from stalled upstream teardown. | `issuecomment-7121812944` blocker 2, `08-runtime-state-failure.md:104-125` |
| Enforce `maxPendingBatchBytes` across incremental parser assembly and validate `event: control` against `STREAM_SSE_CONTRACT_V1.schemas.control` | Prevents unbounded memory growth on partial frames/comments/control blocks and prevents committing pending `data` without a valid `streamNextOffset` or on premature EOF. | `issuecomment-7121812944` blocker 3, `sse-contract-v1.ts:195-200` |
| Auto-bind mounted `streamProxies` into both `createContractAuthorizer` and `createContractOverlayAuthorizer`, cross-check explicit `streamEndpoints`, add explicit `proxy-self-contained` mode, and check symmetric `patternsIntersect` | Corrects `auth-middleware.ts:192-201` (matched required-auth routes always run authn), prevents `contract-overlay-authorizer.ts:94-98` unmatched `{ allow: true }` bypass, and catches concrete-inside-template oRPC overlaps missed by literal `claims(path)`. | `issuecomment-7121812944` blocker 4, `auth-middleware.ts:192-201`, `contract-overlay-authorizer.ts:94-98`, `contract-procedure-index.ts:115-120` |
| Deterministic `credentialMode` selection, `ServiceProxyTrust` + `remoteAddr` effective-origin resolution, dynamic `Connection` stripping, and 3-tier response header ownership | Closes malformed-`Authorization` and mixed-credential ambiguity, prevents `X-Forwarded-*` spoofing without trusted socket metadata, and prevents `decision.responseHeaders` from overwriting mandatory cache/framing/CORS headers. | `issuecomment-7121812944` blocker 5, `client-address.ts:27-48`, `service-cors.ts:84-91` |
| Make `options.offset` the single offset authority on `proxyUrl` and document dispose-and-rebuild reconnect + retention condition | Eliminates silent URL-vs-`initialState` offset drift and prevents native `EventSource` from retrying stale initial URLs in offset-only mode. | `issuecomment-7121812944` blocker 6, `create-stream-event-source.ts:49-65`, `stream-sse-v1.ts:118-142` |
| Preserve legacy `createNetScriptChatStreamProxy` defaults unchanged when `authorize` / `recheck` are omitted; add opt-in SSE delegation preserving all documented overrides | Avoids unannounced wire breaks on legacy cookie forwarding and non-SSE `application/json` chat responses while keeping all existing `stream-proxy_test.ts` regressions green. | `issuecomment-7121812944` blocker 7, `stream-proxy_test.ts:17-323` |
| Defer OpenAPI/service-info projection, `PluginServiceConfig.streamProxies`, and public sanitizer helper exports; retain only `proxyUrl` in `@netscript/fresh/streams` | Aligns with narrower-variant restraint while retaining the one Fresh option that prevents forced `/v1/stream/netscript` prefixing and offset drift. | `issuecomment-7121812944` advisory 1 |
| Expose pre-drain `shutdownSignal` on `ServiceEnvironment` / `StreamProxyMountContext` | `ServiceShutdownCoordinator` aborts `#controller` at line 96 and awaits `server.shutdown()` before running `onShutdown` hooks, so active SSE readers need pre-drain abort notification. | `service-listener.ts:98,113-114`, `service-shutdown.ts:47,96-147` |

## Validation

| Gate | Command | Exit | Result |
| ---- | ------- | ---- | ------ |
| Repeatable baseline probe | `deno run -A --frozen .llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/baseline-probe.ts` | `0` | Verified chat proxy cookie forwarding, `createContractAuthorizer` param raw-route error, `createNetScriptStreamEventSourceV1` prefixing, and `DurableStreamTestServer` SSE wire framing + offset resume |
| Internal doc links (RFC) | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-authorizing-stream-proxy.md --pretty` | `0` | `docs=1 broken-links=0 broken-anchors=0 orphans=0` |
| Internal doc links + doctrine anchors | `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-authorizing-stream-proxy.md --root docs/architecture/doctrine --pretty` | `0` | `docs=13 broken-links=0 broken-anchors=0 orphans=0` |
| Closing-keyword hygiene | `grep -Eni '(close\|closes\|closed\|fix\|fixes\|fixed\|resolve\|resolves\|resolved)[^a-zA-Z0-9\n]{0,20}(#[0-9]+\|issues/[0-9]+)' rfcs/0000-authorizing-stream-proxy.md .llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/*` | `1` (no matches) | Zero closing keywords |
| Process-language / FCP scan (RFC) | `grep -Eni '\b(owner\|evaluator\|harness\|worklog\|coordinator\|plan-eval\|impl-eval\|fcp\|final comment period\|neon\|sol\|opus\|codex\|antigravity\|t3)\b\|\.llm/runs' rfcs/0000-authorizing-stream-proxy.md` | `1` (no matches) | Zero process/FCP language |
| Hostname & leak scan (RFC + run docs + probe) | `grep -Eni` scan across `rfcs/0000-authorizing-stream-proxy.md`, `research.md`, `context-pack.md`, `worklog.md`, `baseline-probe.ts` for literal example hostnames, machine paths, loopback/LAN IPs, and private consumer-app names | `1` (no matches) | Zero leaks or literal example hostnames |

## Drift

See `drift.md`.
