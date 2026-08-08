# feat(sdk): trace-context propagation is hardcoded inside the link — re-express it as the second, non-auth contribution that proves the seam is general — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-06 · **Proposed milestone:** `0.0.7` (post-rename-shift "Typed seams +
generation", SYNTHESIS §5.3) · **Labels:** `type:feat` `area:sdk` `area:telemetry` `priority:p1`
`status:triage` · **Depends on:** T1-01 (RFC-A ratification), T1-02 (the chain), T1-05 (first
dogfood)

## Summary

A contribution seam validated by one consumer encodes that consumer's shape. Auth (T1-05) is
credential-shaped; without a structurally different second consumer, RFC-A's claim that the chain is
general is unproven. Trace-context propagation is the right second consumer because it is already
hard-coded inside `createHttpClientLink` behind a boolean, with a per-call override field and
existing regression coverage — so re-expressing it as a contribution is a **migration, not an
addition**, and the negative test therefore has teeth: remove the contribution and `traceparent` must
disappear from the wire. It also removes the framework's last private fast lane through the link, so
NetScript's own default path goes through the public composition path rather than beside it.

## Evidence

- Corpus: `research/external/orpc.md` §1.5, §5 (the "header/trace/tenant contribution from a plugin"
  row), §7 item 1; `research/repo-audit/services-sdk.md` §1.3, §2.3 (losing the client span is the
  documented cost of the current escape hatch), §3.1.
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/sdk/src/client/http-client-link.ts:82-101` — the `headers` callback: `Content-Type`,
    then `traceparent`/`tracestate` from `options.context.traceHeaders` if present, else from
    `getTraceHeaders()`. Gated by the `propagateTraceContext` boolean.
  - `packages/sdk/src/client/service-client.ts:41-49,55-64` — `propagateTraceContext = true` default,
    threaded into the link along with `getTraceHeaders`.
  - `packages/sdk/src/ports/service-client.ts:149-155` — `ServiceClientContext.traceHeaders` is the
    per-call override, i.e. this concern already exercises the exact "typed per-call context" axis
    the envelope claims to generalise.
  - `packages/sdk/src/client/http-client-link.ts:127+` — the custom `fetch` opens the CLIENT span
    with `rpc.system=orpc` / `server.address` attributes; this is the behaviour a hand-rolled client
    silently loses today.
  - `packages/sdk/src/presets/define-services.ts:106-116` — `propagateTraceContext` is forwarded from
    L3, so the migration must preserve the L3 surface too.
- Rejected alternative, with its own citations: the AI/streams header contribution
  (`getStreamsAuth()` → `{ Authorization: 'Bearer ' + STREAMS_SECRET }`,
  `packages/plugin-streams-core/src/application/stream-url-resolver.ts:136-150`, consumed at
  `packages/fresh/src/runtime/streams/create-stream-db.ts:111` and
  `packages/fresh/src/runtime/ai/stream-proxy.ts:162`).

## Current surface

Trace propagation works and is not a defect — it is a *hard-code*. Two of its three axes
(header authorship, per-call typed override) are exactly the axes RFC-A's envelope exists to
generalise, and the third (server-side context resolution) is the environment boundary. Meanwhile
the only other credential-shaped header seam in the repo, `getStreamsAuth()`, was built entirely
outside the typed client with raw `fetch`, because there was nowhere else to put it.

## Target contract

1. **`traceContextContribution()`** ships from `@netscript/sdk` (or `@netscript/telemetry`, per the
   layering decision recorded in the implementing PR) as an `SdkClientContribution` declaring
   `headerKeys: ['traceparent', 'tracestate']` and per-call context
   `{ trace?: { traceparent?: string; tracestate?: string } | null }`.
2. **It is composed by default.** `createServiceClient` prepends it when `propagateTraceContext` is
   not `false`, so the shipped default behaviour and the L3 `defineServices` surface are unchanged.
3. **The link body no longer authors trace headers.** After this issue,
   `createHttpClientLink` contains no `traceparent` literal; `ServiceClientContext.traceHeaders`
   becomes a `@deprecated` alias forwarding to the contribution's context field for one minor.
4. **It carries no secret and needs no server-only variant for header authorship**, which is
   precisely what makes it a generality proof rather than a second credential test.
5. **The CLIENT span stays attached to the framework default chain**, so composing extra
   contributions cannot silently drop it.

### Why this consumer, and not the AI/streams headers

Both candidates were evaluated (RFC-A §9). `getStreamsAuth()` is attractive because it is a real,
shipped, out-of-band header that today lives outside the typed client. It was rejected as the
*second* consumer for three reasons: it is still a **credential** (a process-global shared secret),
so it re-tests auth's axis rather than a new one; it is entangled with the streams/SSE transport and
with #1329's envelope work, so a failure would not distinguish "the seam is wrong" from "streams is
wrong"; and it is purely additive, so a decorative seam could pass its test. Trace context fails
loudly if the seam is decorative, because its behaviour already exists and must survive the move. The
streams/AI header contribution remains a good **third** consumer once the streams envelope settles.

## Acceptance

- [ ] `traceContextContribution()` ships as an `SdkClientContribution` declaring its header keys and
      per-call context.
- [ ] `createHttpClientLink` contains no trace-header authorship; the contribution is the only
      producer.
- [ ] `createServiceClient` and `defineServices` behave identically to today when
      `propagateTraceContext` is unset or `true`.
- [ ] The per-call trace override continues to work through the contribution's context field.
- [ ] The CLIENT span is still emitted with `rpc.system=orpc` and `server.address` when other
      contributions are composed.
- [ ] NEGATIVE: with the contribution removed from the chain, a request carries no `traceparent` and
      no `tracestate` — asserted on the wire, not on the options object.
- [ ] NEGATIVE: with `propagateTraceContext: false`, no trace header is sent (pins today's behaviour).
- [ ] NEGATIVE: a test asserts the auth contribution and the trace contribution compose in either
      order without either header being lost.
- [ ] NEGATIVE: a type fixture asserts the composed per-call context is the intersection of both
      contributions' declared contexts.
- [ ] The contribution declares no credential and requires no server-only module for header
      authorship.
- [ ] `gate:` `deno task check`, `deno task test`, and `deno task publish:dry-run` pass.

## Boundaries

- Do **not** migrate `getStreamsAuth()` onto the chain here — it is the deliberately deferred third
  consumer, and it depends on the streams envelope work.
- Do **not** duplicate **#1329** (`fix(streams)`: documented SSE consumer shape differs from the wire
  protocol and does not specify the standard event/OTEL envelope, `0.0.5`, p0) — the streams
  telemetry envelope is its scope.
- Do **not** change OTEL span names, attributes, or the tracer identity — telemetry semantics are out
  of scope; this issue only moves *who authors the headers*.
- Do **not** add a tenancy or session context field "while we are here" — #884 owns tenancy.
- Do **not** implement the auth contribution here — T1-05.
- Do **not** open the chain here — T1-02.
- Do **not** duplicate the observability/runtime-truth work in the T4 pack (saga span call-sites,
  child liveness, E2E span assertions).

## Docs/consumer proof

The SDK reference documents trace propagation as a *contribution* — the first place a reader sees the
same mechanism used twice, by two unrelated concerns, which is the whole adoption argument. Consumer
proof is a diff: `http-client-link.ts` loses its trace block, `@netscript/sdk`'s public surface gains
one small value, and the two-contribution composition example in the docs is the one an app author
copies. If the negative gate ("remove it and the header disappears") cannot be written, the seam is
decorative and RFC-A's ratification should be reconsidered rather than the test weakened.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Consumer choice and its
rejected alternative are recorded in `rfcs/RFC-A-sdk-client-composition.md` §9; sourced from
`research/external/orpc.md` §5/§7 and `research/repo-audit/services-sdk.md` §1.3/§2.3, with all cited
lines re-verified against worktree baseline `fac9e339042c`. No GitHub mutation was performed.
