# Plan — SDK client contributions S5/S6/S7

Run: `feat-sdk-client-contributions--1352-1353-1467`\
Mode: clustered, ordered, plan only\
Required sequence: S5 → S6 → S7

## Outcome

Consume the shipped SDK client-contribution seam in three independently landable slices:

1. S5 provides a typed, browser-safe bearer contribution and declarative plugin reference.
2. S6 consolidates final trace-header authorship in HTTP transport while preserving the public
   compatibility inputs.
3. S7 ships locale as a public non-auth contribution and proves the seam remains general.

No slice redesigns or duplicates the S1–S3 adapter seam.

## Locked cross-slice decisions

### Ordering and concurrency

The only permitted implementation order is:

`S5 #1352` → `S6 #1353` → `S7 #1467`

- S5 lands first because it is the RFC's first real consumer and supplies the canonical auth
  descriptor needed by S6's auth-plus-trace composition tests.
- S6 lands second because it establishes the single final header/trace authority against which every
  later contribution must be tested.
- S7 lands last because its purpose is to prove the finalized seam is general, including composition
  with the real auth contribution.

No two slices may run concurrently. S5/S6 share observability and documentation proof; S6/S7 share
SDK exports, contribution behavior tests, and final-authority proof; S5/S7 share application
examples and combined documentation. Parallel branches would re-litigate the same acceptance surface
even where their nominal production-file sets differ.

Each slice is landable only on its named predecessor and must leave that branch green before the
next begins.

### One outbound-header authority

The HTTP transport is the sole final author of outbound headers. Contributions reach it only through
the existing prepared-call port.

The transport order is locked:

1. consume the immutable prepared non-reserved contribution headers;
2. let request encoding finish;
3. at final fetch, copy the encoded headers and set `Content-Type`;
4. delete any stale `traceparent` and `tracestate`;
5. create the CLIENT span;
6. if propagation is enabled, inject that span's trace fields last; otherwise emit neither trace
   field;
7. send the request.

No contribution resolver, plugin resource, generated file, CLI helper, or upstream link callback may
independently author final request headers. Auth owns the `authorization` declaration, locale owns
`accept-language`, and transport remains the one final materializer.

### Trace compatibility contract

Do not remove or rename `propagateTraceContext` or `ServiceClientContext.traceHeaders`.

- omitted/default and `true`: propagate the SDK CLIENT span;
- `false`: emit neither trace header, while still creating/recording the CLIENT span;
- supplied `traceHeaders`: use them as an explicit parent/fallback context, then emit the CLIENT
  child span's final header;
- contribution code cannot observe or claim trace fields;
- `defineServices` continues forwarding the same inputs.

Compatibility is semantic parentage and enable/disable behavior, not literal replay of
caller-supplied bytes. The current transport already overwrites those bytes when tracing is active.

### Partial GitHub semantics

Every slice PR/commit body uses only `Refs #1352`, `Refs #1353`, or `Refs #1467`, respectively. It
must not use `Closes`, `Fixes`, or `Resolves`.

Epic `#1348` may be referenced as `Part of #1348` or `Refs #1348`; it must never receive a closing
keyword. Deferred acceptance work is listed explicitly in each PR so issue closure remains
orchestrator-controlled.

### Lock and generated-state policy

`deno.lock` must remain byte-identical in all three slices. Baseline SHA-256:

`01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`

No dependency version changes are planned. If an already-workspace-resolved internal import
unexpectedly requires lock movement, the slice stops for re-scope; it does not accept incidental
lock churn. Do not delete caches or lock files and do not use reload flags.

## Slice S5 — typed bearer credential contribution (`#1352`)

### Scope and contract

Add the canonical browser-safe bearer SDK adapter under the public `@netscript/plugin-auth-core/sdk`
subpath. The factory consumes typed application context and returns the existing public
`SdkClientContribution` protocol; it does not introduce a credential option on the SDK client.

Lock these behaviors:

- access metadata distinguishes `none`, `optional`, and `required` procedures;
- unmarked procedures default to `none`;
- `required` with no credential fails before transport;
- `optional` with no credential proceeds without `authorization`;
- a present credential produces `authorization: Bearer <value>` only through the prepared-call
  channel;
- browser builds do not read ambient environment or Node/Deno-only credential sources;
- non-local cleartext HTTP rejects credential transmission unless the application explicitly opts
  in; local development remains supported;
- response caching is either explicitly partitioned by a non-secret application value or
  direct-only; a token is never a partition key;
- removing the contribution removes its typed context requirement and credential behavior.

Ship a conventional auth contribution export for the auth plugin manifest to reference. Extend
`PluginContributions` with declarative SDK-client references containing only protocol family/major,
stable id, module, export, and browser/server targets. Extend merge/builder/public exports for that
data. The auth plugin references the auth-core SDK export and provides a starter resource showing
**explicit** application selection; it does not auto-attach credentials or discover them
generically.

Apply access metadata to auth-contract procedures as client guidance:

- describe/sign-in/callback-like public entry procedures: `none`;
- sign-out/session/current-user-like authenticated procedures: `required`.

This metadata does not replace server-side authorization enforcement.

Explicitly defer the CLI auth-session raw-fetch migration. Its revoke/list calls require explicit
auth URLs that the current public SDK transport does not model. Duplicating transport would violate
the RFC and pre-empt custom-link/discovery work. Record the deferral in the S5 PR and leave `#1352`
open.

### Credential non-disclosure proof

Use runtime-generated fake credentials and assertions that never interpolate or print them. Focused
tests must inspect, by boolean/count only:

- serialized errors, causes, and public error data;
- captured console/stderr;
- span attributes/events;
- request URLs;
- cache keys/partitions;
- plugin manifest/reference data;
- generated starter-resource output.

None may contain the credential or resolver output. A focused in-process transport/authenticator
test may capture the request privately to prove the server recognizes the bearer credential, but it
must not snapshot or report the value. Harness evidence records only command status and safe
counts/hashes.

### Expected touch set and ceiling

Hard ceiling: **27 files**. Expected touch set:

1. `packages/plugin-auth-core/deno.json`
2. `packages/plugin-auth-core/src/sdk/mod.ts` (new)
3. `packages/plugin-auth-core/src/sdk/bearer-contribution.ts` (new)
4. `packages/plugin-auth-core/src/sdk/bearer-contribution_test.ts` (new)
5. `packages/plugin-auth-core/src/sdk/bearer-contribution_type_test.ts` (new only if
   compile-negative cases cannot live in the focused test)
6. `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts`
7. `packages/plugin-auth-core/src/contracts/v1/auth.contract_test.ts`
8. `packages/plugin-auth-core/README.md`
9. `packages/plugin/src/config/domain/sdk-client-contribution-reference.ts` (new)
10. `packages/plugin/src/config/domain/plugin-contributions.ts`
11. `packages/plugin/src/config/application/contribution-merger.ts`
12. `packages/plugin/src/config/builders/plugin-builder.ts`
13. `packages/plugin/src/config/mod.ts`
14. `packages/plugin/mod.ts`
15. `packages/plugin/src/sdk/mod.ts`
16. `packages/plugin/src/domain/constants.ts` (only if the public contribution-axis union requires
    `sdk-client`)
17. `packages/plugin/tests/domain/core-types_test.ts`
18. `packages/plugin/tests/config/sdk-client-contributions_test.ts` (new)
19. `plugins/auth/src/public/mod.ts`
20. `plugins/auth/tests/public/manifest_test.ts`
21. `plugins/auth/src/adapter/plugin.ts`
22. `plugins/auth/src/adapter/resources/sdk-client.ts` (new)
23. `plugins/auth/src/adapter/resources/mod.ts`
24. `plugins/auth/src/adapter/resources/resources.test.ts`
25. `plugins/auth/README.md`
26. `docs/site/identity-access/how-to/add-authentication.md`
27. `docs/site/services-sdk/sdk.md`

Files marked conditional are omitted if unnecessary; they do not license replacement files outside
the list. Any need to edit SDK adapter internals, `http-client-link.ts`, CLI transport, service
implementation, or a 28th file triggers a drift entry and re-plan before editing.

### Gates

- Focused contract/type tests for metadata and context inference.
- Focused bearer runtime tests for none/optional/required, absence, cleartext policy, cache
  partition/direct-only behavior, retry preparation stability, and contribution removal.
- In-process authenticator compatibility test with fake fetch—no socket, service runtime, browser,
  Docker, or Aspire.
- Credential non-disclosure scan described above, including generated starter output.
- Structured TypeScript check, test, lint, and source-only format wrappers over
  `packages/plugin-auth-core`, `packages/plugin`, and `plugins/auth`.
- `deno task quality:gate` and `deno task arch:check` as applicable in the implementation evaluator.
- JSR audits and package publish dry-runs for every changed publishable package/plugin.
- `deno doc`/packed-consumer probes for `@netscript/plugin-auth-core/sdk` and plugin public exports;
  no raw oRPC types may escape.
- Doc-lint A/B for `packages/plugin-auth-core`, `packages/plugin`, and `plugins/auth` against the
  exact research baselines; the new `./sdk` subpath must have zero findings.
- `git diff --check`, touch-set ceiling ≤27, and exact lock hash.
- Because this slice affects scaffold/plugin resources, merge readiness eventually requires the full
  one-pass `scaffold.runtime` verdict. It must run in the authorized remote CI/OpenHands lane, never
  locally in this run. If no remote verdict exists, record that gate as pending rather than
  substituting local runtime commands.

## Slice S6 — transport-owned trace propagation (`#1353`)

### Scope and contract

Refactor the existing HTTP link so the final fetch stage is the only trace-header author. Do not
create a trace contribution and do not change the public contribution protocol.

Move all trace-policy decisions out of the upstream link callback. The callback may forward prepared
non-trace contribution headers, but it must not materialize `traceparent` or `tracestate`. At final
fetch:

- preserve CLIENT span kind and existing safe RPC/server attributes;
- use explicit `ServiceClientContext.traceHeaders`, when supplied, as the parent/fallback context;
- otherwise use the active context;
- clear stale trace fields before injection;
- inject the CLIENT span only for omitted/default or `true` propagation;
- remove both fields for `false` while retaining the span;
- create one CLIENT span per actual transport attempt/connection epoch, with correct parent lineage
  and no double injection;
- keep the prepared non-trace contribution record byte-equivalent across retries within an epoch and
  re-prepare only when the existing seam defines a new epoch.

No public option is removed, renamed, or made required.

### Behavior-preservation matrix

Focused tests must prove all of the following through both direct `createServiceClient` use and
`defineServices` forwarding:

| Input                             | On-wire result                                                                                      | Span result                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| option omitted/default            | final `traceparent` identifies CLIENT span; `tracestate` propagated when applicable                 | one CLIENT span with existing attributes                  |
| `propagateTraceContext: true`     | same as default                                                                                     | same as default                                           |
| `propagateTraceContext: false`    | neither trace header, including if encoded input contained stale fields                             | CLIENT span still recorded                                |
| explicit `traceHeaders` + enabled | final header identifies CLIENT child; supplied parent lineage and tracestate preserved semantically | CLIENT span has supplied parent                           |
| explicit `traceHeaders` + false   | neither trace header                                                                                | CLIENT span still recorded; explicit input is not emitted |

Add auth-plus-trace composition in both contribution orderings. The auth header must be unchanged,
the final trace must still identify the CLIENT span, contributors must not observe trace state, and
reserved-header conflicts must remain redacted at declaration and runtime validation.

### Expected touch set and ceiling

Hard ceiling: **9 files**. Expected touch set:

1. `packages/sdk/src/client/http-client-link.ts`
2. `packages/sdk/src/client/service-client.ts` (only if parent-context handoff needs plumbing)
3. `packages/sdk/src/ports/service-client.ts` (documentation only; no signature change)
4. `packages/sdk/tests/client-contribution-observability_test.ts`
5. `packages/sdk/tests/integration/service-client-runtime_test.ts`
6. `packages/sdk/tests/integration/client-contribution-adapter_test.ts`
7. `packages/sdk/tests/integration/trace-propagation_test.ts` (new only if the matrix cannot remain
   readable in existing focused tests)
8. `packages/sdk/README.md`
9. `docs/site/services-sdk/sdk.md`

Do not edit `prepared-call.ts`, `stable-v1-adapter.ts`, `adapter-ports.ts`, the public contribution
algebra, auth-core production code, or plugin code. An unavoidable need to do so is architectural
drift and stops the slice.

### Gates

- Focused in-process fake-fetch trace matrix above; no socket or runtime service.
- Span-topology assertions for default/true/false, explicit parent, retry attempts, and
  reconnect/new epoch.
- Existing CLIENT attributes remain exact: `rpc.system`, `rpc.service`, `netscript.rpc.transport`,
  and `server.address`, with `SpanKind.CLIENT`.
- Auth-plus-trace composition using the landed S5 public contribution, with no secret-bearing
  snapshots or diagnostics.
- Reserved trace-header declaration/runtime rejection and redacted error checks.
- Structured check, focused tests, lint, and source-only format wrappers for `packages/sdk`.
- `deno task quality:gate`, `deno task arch:check`, SDK JSR audit, SDK publish dry-run, and
  packed-consumer/public `deno doc` checks in the implementation evaluator.
- SDK doc-lint A/B: the post-set must be a subset of the exact 3-finding baseline; new/changed SDK
  exports must be clean.
- `git diff --check`, touch-set ceiling ≤9, and exact lock hash.
- No local `e2e:cli`, Aspire, Docker, browser, or runtime gate.

## Slice S7 — locale contribution (`#1467`)

### Scope and contract

Ship a public locale contribution/factory in `packages/sdk`. It declares ownership of
`accept-language`, accepts typed application context, and uses only the existing public contribution
protocol.

Lock these behaviors:

- absent locale omits `accept-language` without inventing a default;
- present locale is normalized/validated to the documented accepted form before transport;
- duplicate locale owners conflict through the existing deterministic contribution validation;
- locale cannot claim reserved trace/content headers;
- locale contributes a stable non-secret cache partition when application behavior varies by locale,
  or selects direct-only behavior when no safe partition exists;
- the prepared locale value remains stable over retry within an epoch and is re-evaluated only at
  the existing new-epoch boundary;
- cancellation and error behavior remain the adapter seam's existing behavior;
- resolver failures and diagnostics do not reveal locale/context values beyond stable
  contribution/header identifiers;
- direct, query-client, and generated-service use retain typed context inference;
- locale composes with the real S5 bearer contribution in either declaration order without header
  loss.

Locale does not add a bespoke field to service-client options and does not touch the HTTP link or
private adapter seam.

### Expected touch set and ceiling

Hard ceiling: **9 files**. Expected touch set:

1. `packages/sdk/src/client/locale-contribution.ts` (new)
2. `packages/sdk/src/client/mod.ts`
3. `packages/sdk/mod.ts`
4. `packages/sdk/tests/locale-contribution_test.ts` (new)
5. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`
6. `packages/sdk/tests/client-contribution-cache-query_test.ts`
7. `packages/sdk/README.md`
8. `docs/site/services-sdk/sdk.md`
9. `docs/site/services-sdk/how-to/discover-services.md`

Do not edit `http-client-link.ts`, any private contribution adapter file, auth-core production code,
plugin manifests, or CLI code. A tenth file or any file outside this set requires drift/re-plan.

### Gates

- Focused locale unit/type tests for present/absent/invalid values, ownership conflicts, typed
  direct/query/generated contexts, and contribution removal.
- Focused fake-fetch tests for final `accept-language`, auth-plus-locale in both orders, trace
  coexistence, retry/new-epoch behavior, cancellation, cache partition/direct-only behavior, and
  redacted failures.
- Structured check, focused tests, lint, and source-only format wrappers for `packages/sdk`.
- `deno task quality:gate`, `deno task arch:check`, SDK JSR audit, SDK publish dry-run, and
  packed-consumer/public `deno doc` probes in the implementation evaluator.
- SDK doc-lint A/B against the exact 3-finding baseline; the new locale export must be clean.
- `git diff --check`, touch-set ceiling ≤9, and exact lock hash.
- No local `e2e:cli`, Aspire, Docker, browser, or runtime gate.

## Cluster completion gates

After S7, the implementation evaluator must verify the composed public story from a packed consumer:

- bearer plus locale typed context compiles for direct, query, and generated service clients;
- auth and locale materialize only through the prepared-call port;
- final trace fields come only from transport and describe its CLIENT span;
- false trace propagation emits no trace headers;
- cache behavior is explicitly partitioned or direct-only for both varying axes;
- no public signature exposes raw oRPC identity;
- no credential material appears in any durable output;
- the exact issue-reference and epic-reference semantics are present in all three PR bodies;
- remote CI supplies any required scaffold runtime verdict without violating this run's
  local-runtime prohibition.

Root-wide checks, tests, lint, architecture, publish dry-run, and the remote merge-readiness gate
are final integration evidence; they do not replace each slice's focused proof.

## Harness handoff and evaluation

This planning request intentionally limits deliverables to `research.md`, `plan.md`, and
`context-pack.md`; no product code is authorized.

Before implementation begins, the implementation run must instantiate the remaining harness control
artifacts required by the current workflow (`supervisor.md`, `worklog.md`, and `drift.md`), copy the
locked Design checkpoint into `worklog.md`, and dispatch a **separate-session PLAN-EVAL** using the
lane policy. Multi-issue scope, security boundaries, public exports, and corrected trace semantics
make PLAN-EVAL mandatory. Implementation is a hard stop until that evaluator returns PASS.

Each slice then receives its own implementation checkpoint and separate IMPL-EVAL. Any change to
ordering, header authority, credential storage/logging boundaries, trace semantics, touch ceiling,
lock policy, or deferred CLI scope is Design drift and requires re-plan plus a new PLAN-EVAL.
