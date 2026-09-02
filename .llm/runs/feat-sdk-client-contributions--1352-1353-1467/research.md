# Research — SDK client contributions S5/S6/S7

Run: `feat-sdk-client-contributions--1352-1353-1467`\
Issues: `#1352`, `#1353`, `#1467`\
Epic context: `#1348`\
Phase: clustered planning only

## Research question

How should the already-shipped SDK client-contribution adapter seam be consumed for bearer
credentials, trace propagation, and locale without creating a second outbound-header path, weakening
credential handling, or changing existing trace compatibility inputs?

## Authorities consulted

- `AGENTS.md` and the run brief in `plan-brief.md`.
- `.agents/skills/netscript-harness/SKILL.md` and the harness activation, run-loop, lane policy,
  Plan-Gate, plan protocol, archetype, debt, and documentation guidance.
- `.agents/skills/netscript-doctrine/SKILL.md` and the doctrine sections for dependency direction,
  contracts, public surfaces, adapters, plugins, gates, and the current codebase verdict.
- `.agents/skills/netscript-deno-toolchain/SKILL.md`; `deno doc` was used before focused source
  reads for the published SDK types.
- `.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md`, and
  `.agents/skills/rtk/SKILL.md` for gate design. The `rtk` binary was unavailable, so read-only
  inspection used focused raw commands.
- Accepted RFC `rfcs/0001-sdk-client-contributions.md`.
- Current live issue bodies and amendments for `#1352`, `#1353`, `#1467`, and prerequisite `#1466`.
- Focused code and tests in `packages/sdk`, `packages/plugin-auth-core`, `packages/plugin`,
  `plugins/auth`, `packages/cli`, and the server credential authenticator.

No Aspire, Docker, browser, local runtime, or `e2e:cli` command was run.

## Doctrine and archetype finding

The run brief calls `packages/sdk` Archetype 4, but the current authoritative codebase verdict
classifies it as **Archetype 2 — integration/infrastructure**, verdict **Keep**, with the explicit
instruction to preserve discovery, client, cache, and adapter boundaries. This plan follows the
current doctrine rather than the stale prompt classification.

The broader S5 touch set spans several archetypes:

| Surface                     | Current archetype | Planning consequence                                                                                     |
| --------------------------- | ----------------: | -------------------------------------------------------------------------------------------------------- |
| `packages/sdk`              |          A2, Keep | Consume the public protocol and private adapter ports; do not redesign them.                             |
| `packages/plugin-auth-core` |          A2, Keep | Put the browser-safe bearer descriptor/factory in a dedicated SDK adapter export.                        |
| `packages/plugin`           |          A4, Keep | Add declarative plugin-manifest reference data and builder/merge support only.                           |
| `plugins/auth`              |          A5, Keep | Reference the canonical auth-core export and provide an explicit starter resource; do not own transport. |
| `packages/cli`              |          A6, Keep | Do not duplicate SDK transport merely to replace explicit-URL raw fetch calls.                           |

No open architecture-debt entry was found that authorizes bypassing these boundaries. If
implementation discovers an unavoidable doctrine exception, it must stop and create a debt entry
before proceeding.

## Published surface learned with `deno doc`

- `CreateServiceClientOptions` is the current public options type. It exposes
  `propagateTraceContext` and `contributions`; it has no credential field.
- `ServiceClientContext` exposes optional `traceHeaders` containing `traceparent` and `tracestate`.
- `SdkClientContribution` and its public descriptor/helper types contain no upstream oRPC identity.
- `defineServices` forwards both `propagateTraceContext` and contributions.

This confirms that credentials and locale belong in contributions, while the two trace inputs remain
compatibility inputs to the transport.

## Shipped seam and present behavior

S1–S3 are already present, including:

- `packages/sdk/src/ports/sdk-client-contribution.ts`
- `packages/sdk/src/client/sdk-client-contribution.ts`
- `packages/sdk/src/internal/client-contributions/adapter-ports.ts`
- `packages/sdk/src/internal/client-contributions/prepared-call.ts`
- `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`

The seam already validates descriptors, prepares contributions once per prepared-call epoch, keeps
contributor inputs immutable, detects conflicts, rejects reserved headers, supplies redacted errors,
and includes contribution-controlled cache partitioning. It reserves `content-type`, `traceparent`,
and `tracestate` from contributions. These files are an input to this plan, not a redesign target.

`http-client-link.ts` presently has two trace-authorship stages:

1. the upstream link `headers` callback adds prepared contribution headers, `Content-Type`, and
   optional trace fields; then
2. the final fetch wrapper creates a CLIENT span and injects trace context into the actual `Headers`
   object.

The second stage can overwrite the first. In particular, the current observability test expects a
trace header even when `propagateTraceContext` is false, which conflicts with the amended `#1353`
acceptance contract. Exact caller-supplied trace bytes are not a stable current behavior under an
active tracer because the fetch wrapper already overwrites them.

The telemetry package exposes the pieces required for a single authority: incoming header extraction
can create a parent context, and the CLIENT span helper accepts an explicit parent context.

## Live issue amendments override stale summaries

### `#1352` — bearer credential contribution

The amended issue requires a browser-safe `@netscript/plugin-auth-core/sdk` bearer contribution,
access metadata, redaction, partitioned or direct-only cache behavior, a plugin-manifest reference,
documentation, and explicit scaffold/application selection. Cookie/session support and ambient
environment lookup are excluded.

Existing facts:

- the server static credential authenticator accepts `Authorization: Bearer …` and `x-api-key`;
- `packages/plugin-auth-core` has no `./sdk` export;
- `PluginContributions` has no SDK-client contribution group;
- the auth plugin manifest has no SDK-client reference;
- the CLI auth-session client still uses explicit URL raw fetch calls.

The last point is a scope constraint. The public SDK client currently discovers services through its
supported discovery path and does not expose the custom explicit-URL transport/link required by
those CLI calls. Migrating them in S5 would either duplicate transport or pre-empt the separate
custom-link/discovery work. This cluster therefore plans a partial, independently useful S5 and
explicitly defers that CLI migration.

### `#1353` — trace propagation proof

The current amendment explicitly says **not** to ship a trace contribution. The transport must
create the CLIENT span and be the sole final author of `traceparent`/`tracestate`. Contribution code
may neither observe nor overwrite trace fields. Existing `propagateTraceContext` and
`ServiceClientContext.traceHeaders` remain compatibility inputs.

Therefore S6 is a transport-authority consolidation and behavior rebaseline, not a new contribution
type.

### `#1467` — locale generality proof

Locale owns `accept-language`, typed context, cache partitioning, conflict behavior,
direct/query/generated typing, retry/cancellation/cache safety, and redaction. The repository
currently contains locale only as illustrative/test descriptors; it does not ship a canonical public
locale factory. This is the non-auth proof that the seam is not credential-shaped.

## Header-authorship decision

There will be one final outbound-header authority: the SDK HTTP transport.

- Contributions declaratively own only their validated, non-reserved header names.
- `PreparedSdkClientCall` / `PreparedOutboundHeadersPort` remains the only channel by which those
  prepared values reach transport.
- The upstream link callback only consumes the immutable prepared contributor record. It resolves no
  auth, locale, or trace policy.
- At final fetch, transport copies the encoded request headers, sets `Content-Type`, removes stale
  trace fields, creates the CLIENT span, and—only when propagation is enabled—injects that span's
  trace fields last.
- When `traceHeaders` are supplied, transport interprets them as an explicit parent/fallback
  context; the final wire header describes the SDK CLIENT child span rather than replaying the input
  bytes.
- When propagation is false, final transport removes/omits both trace fields while still recording
  the CLIENT span.

This is one final authority, not a second parallel header path. Auth and locale remain declared
contribution owners, but neither can write directly to fetch.

## Security boundaries for credentials

Credential material is runtime-only sensitive data. It must never appear in logs, error
serialization, span attributes/events, cache keys/partitions, URLs, generated files, plugin
manifests, scaffold resources, or `.llm/runs/**`.

The implementation tests must:

- generate fake credential values at runtime rather than commit realistic tokens;
- make only boolean or count assertions about absence, without printing a captured secret on
  failure;
- inspect error message/serialization/cause, captured console/stderr, recorded spans, generated
  outputs, and cache keys for absence;
- prove the plugin reference and starter resource contain only stable module/export/protocol
  identifiers and application wiring—not token values, resolver results, or environment reads;
- prove the cache partition is an explicit non-secret stable value and never derived from the token;
- record only PASS/count/hash evidence in harness artifacts, never captured headers or test output
  containing credentials.

## Documentation-lint A/B baselines

The export-map doc lint has pre-existing private-surface findings. An absolute-zero gate would be
false. Baselines were measured with `deno task doc:lint --root <root> --pretty`; each command exited
1 and left `deno.lock` unchanged.

| Root                        |                Unique findings | Baseline file/count set                                                                                                                                                                                                                                                                                                     |
| --------------------------- | -----------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/sdk`              |  3 private, 0 missing, 0 other | `packages/sdk/src/ports/query-client.ts` ×1; `packages/sdk/src/query-client/query-client-factory.ts` ×1; `packages/plugin-streams-core/src/application/create-durable-stream.ts` ×1                                                                                                                                         |
| `packages/plugin-auth-core` |  4 private, 0 missing, 0 other | `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts` ×2; `packages/plugin-streams-core/src/domain/stream-schema.ts` ×2                                                                                                                                                                                             |
| `packages/plugin`           | 15 private, 0 missing, 0 other | `packages/contract-base/src/domain/base-contract.ts` ×10; `packages/service/src/presentation/create-plugin-service.ts` ×2; `packages/service/src/presentation/plugin-contract-binder.ts` ×2; `packages/contract-base/src/domain/base-errors.ts` ×1                                                                          |
| `plugins/auth`              | 13 private, 0 missing, 0 other | `packages/plugin-streams-core/src/application/create-durable-stream.ts` ×4; `packages/plugin-streams-core/src/application/stream-producer-port.ts` ×4; `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts` ×2; `packages/plugin-streams-core/src/domain/stream-schema.ts` ×2; `plugins/auth/src/public/mod.ts` ×1 |

Post-slice findings must be a subset of the relevant exact baseline file/category/count set.
Reductions are allowed. A new file, new category, moved finding, or increased count fails. Every
newly exported subpath must have zero findings.

Baseline `deno.lock` SHA-256: `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`.

## Planning conclusions

1. Land S5 auth first, S6 trace consolidation second, and S7 locale third.
2. Do not run any pair concurrently. Even after the corrected authority design removes most direct
   callback overlap, their behavior tests, exports, docs, and acceptance proofs are order-dependent.
3. Do not redesign the public contribution protocol or private adapter seam.
4. Do not add a trace contribution.
5. Do not add a credential field to `CreateServiceClientOptions`; credentials flow through typed
   contribution context.
6. Keep every slice partial in GitHub semantics: reference its issue without a closing keyword, and
   never close epic `#1348` from a leaf slice.
