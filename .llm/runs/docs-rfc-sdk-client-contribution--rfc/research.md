# Research — docs-rfc-sdk-client-contribution--rfc

## Re-baseline

- Carried-in source:
  `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`
- Repository authority: `origin/main` @ `fac9e339042c5394bf882311657d8981d353a1c3`, fetched and
  re-verified on 2026-08-08.
- Live design record: draft PR `#1390` and tracking issue `#1348`.
- Result: the 755-line proposal is useful problem discovery, but its single envelope is too broad
  for current code and doctrine. The ratifiable seam is typed request-header preparation plus the
  minimum cache-variance declaration required to make query use safe.

## Authorities read completely

- RFC process and template: `rfcs/README.md`, `rfcs/0000-template.md`.
- Harness: activation, run loop, lane policy, doc audit, gate matrix, plan gate, verdicts, and both
  evaluator protocols.
- Profiles: `SCOPE-docs`, Archetypes 2, 4, 5, and 6.
- Doctrine: sections 01–11, including extension-axis law, public surfaces, layering, archetypes,
  fitness gates, anti-patterns, debt, and plugin thinness.
- Relevant debt ledgers for SDK, contracts/service, plugin, telemetry, and auth.
- Requested skills: harness, doctrine, PR, tools, Deno toolchain, JSR audit, rtk, and WSL remote.

## Current repository findings

| #  | Finding                                                                   | Evidence and consequence                                                                                                                                                                                  |
| -- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The public client has no extension option.                                | `deno doc CreateServiceClientOptions packages/sdk/mod.ts` reports only `contract`, service/discovery fields, two reserved fields, and `propagateTraceContext`.                                            |
| 2  | `port` and `timeout` are accepted but unused.                             | `packages/sdk/src/client/service-client.ts` destructures neither; `defineServices` forwards both. The RFC deprecates rather than repurposes them.                                                         |
| 3  | The HTTP link already owns the full transport policy.                     | `packages/sdk/src/client/http-client-link.ts` constructs the sole `RPCLink`, `Content-Type`, retry, GET dedupe, traced `fetch`, cache/signal forwarding, and final trace injection.                       |
| 4  | The useful header seam already exists upstream.                           | oRPC 1.14.6 declarations show `headers` is `Value<Promisable<...>, [ClientOptions<T>, path, input]>`; no NetScript interceptor framework is necessary.                                                    |
| 5  | Client context is fixed and query layers erase it.                        | `ServiceClientContext`, `ServiceClientMethod`, `QueryFactory`, `ServiceQueryUtils`, and `invokeClientProcedure` have no context generic; `ServiceQueryClientContext` is forced to `Record<never, never>`. |
| 6  | Upstream TanStack utilities already preserve required context.            | `@orpc/tanstack-query@1.14.6` `QueryOptionsIn`, `InfiniteOptionsIn`, and `MutationOptionsIn` require context unless it is empty. NetScript's structural remap discards it.                                |
| 7  | Context-bearing headers create a cache-safety problem.                    | Current server and TanStack full keys contain input/path but no request context. Bearer/locale responses could collide unless the contribution declares response invariance or a non-secret partition.    |
| 8  | A package-owned link port exists but is internal.                         | `packages/sdk/src/ports/client-link-factory.ts`; `ports/mod.ts` claims a transport seam but does not export it. Custom transport remains #451, not a contribution field.                                  |
| 9  | Server handler plugins already have an axis.                              | `RPCHandlerConfig.plugins` and `createRPCPlugins` in `packages/service/src/primitives/handlers.ts`. Preset reachability is separate service work.                                                         |
| 10 | Plugin contributions need a generic SDK reference group.                  | `PluginContributions` has typed groups but no `sdkClients`; `cli.doctorChecks` is a closed `'auth-backend'[]` literal. #1093 is the generic-discovery dependency.                                         |
| 11 | Contract metadata is supported upstream but not initialized by NetScript. | `deno doc ContractBuilder` shows `oc.$meta<T>()`; actual `~orpc` definitions carry `meta`. `baseContract` currently starts at `oc.errors(...)`.                                                           |
| 12 | The current base annotation erases and leaks types.                       | `baseContract: ReturnType<typeof oc.errors>` is a current `deno doc --lint` private-type-ref and widens the error map. #1350 must preserve both concrete errors and new metadata.                         |
| 13 | Auth core, not the thin plugin, must own bearer conventions.              | Doctrine 11 assigns convention-bearing primitives to `packages/plugin-auth-core`; `plugins/auth` should only declare/deliver the reference and wiring.                                                    |
| 14 | Trace headers are not a valid second request-preparation consumer.        | The SDK creates a CLIENT span inside `fetch` and overwrites/injects `traceparent` there. Preparing it earlier would describe the wrong span or be overwritten.                                            |

## Current public API snapshots (`deno doc`)

- `CreateServiceClientOptions<TContract>`: 9 fields; no headers/context/link/plugin contribution.
- `ServiceClientContext`: signal/cache/retry/trace fields, all optional.
- `ServiceClientMethod<TInput,TOutput>`: input plus optional `ServiceRequestOptions`.
- `createActionQueryKey()` and `ActionMethod.key`: fixed public three-tuples; `CacheKey` remains
  `Deno.KvKey` and server storage prepends `cache_query`.
- `ServiceQueryClientContext`: public `Record<never, never>`; the checked-in upstream fixture pins
  default `ServiceQueryUtils<TContract>` assignability.
- `@netscript/sdk/desktop`: separate MessagePort client factory with no HTTP header channel or
  contribution option.
- `ServiceHandlerPlugin`: structural `order`, `init`, and `initRuntimeAdapter` using `unknown`.
- `RPCHandlerConfig`: already has `plugins`, tracing/error/dedupe/logging/debug fields.
- `PluginContributions`: 10 array groups plus `aspire` and `doctor` module strings; no SDK group.
- SDK module docs promise upstream-free `@netscript/sdk/ports`, constraining the RFC from exporting
  oRPC link/interceptor types.

## Live GitHub re-baseline

| Artifact | Live state on 2026-08-08                            | RFC consequence                                                                                                                             |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| PR #1347 | Open draft; planning record says it must not merge. | Cite as source roadmap only, not ratified architecture.                                                                                     |
| #1348    | Open, `status:triage`, milestone `0.0.6`.           | RFC tracking record; this PR references but must not close it. Its body still assumes the broad envelope and needs post-FCP reconciliation. |
| #1349    | Open triage, milestone `0.0.7`.                     | Re-scope to minimal descriptor/context/header/query-safety seam; remove pass-through arrays/link scope.                                     |
| #1350    | Open triage, milestone `0.0.7`.                     | Independent but coordinated base-contract error/metadata repair.                                                                            |
| #1351    | Open triage, milestone `0.0.7`.                     | SDK-owned transport consolidation and coherent oRPC update; no contributor transport control.                                               |
| #1352    | Open triage, milestone `0.0.7`.                     | Auth-core bearer dogfood, redaction, access metadata, cache partition/direct-only behavior.                                                 |
| #1353    | Open triage, milestone `0.0.7`.                     | Proposed trace dogfood conflicts with current span ownership; re-scope to transport trace conformance.                                      |
| #1093    | Open triage, milestone `0.0.6`.                     | Generic plugin discovery is required for third-party module references.                                                                     |
| #451     | Open research, Backlog / Triage.                    | Sole owner of a future custom-link option; it should unhide the existing port rather than extend this descriptor.                           |
| #928     | Open `status:plan`, milestone `0.0.9`.              | Align on `(family, major)` negotiation vocabulary, not one universal contribution payload.                                                  |
| #934     | Open `status:plan`, milestone `0.0.9`.              | May consume shared access metadata without depending on SDK contribution types.                                                             |
| #884     | Open triage, milestone `0.0.14`.                    | Future tenant contribution candidate; server org policy remains separate.                                                                   |

No issue, milestone, or lifecycle record was mutated in research. The PR is the only GitHub write.

## Upstream and standards evidence

| Source                                                        | Verified claim                                                                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno.lock` and Deno cache declarations                       | The workspace resolves the oRPC family to 1.14.6. `ClientOptions<T>` has signal/lastEventId/context; `RPCLinkOptions` composes native headers, link plugins, interceptors, and fetch capabilities. |
| `deno task deps:latest -- --filter '@orpc/*'`                 | Stable-channel report: seven oRPC packages are behind; `^1.14.6`/`^1.14.7` → `1.15.0` on 2026-08-08. Implementation must recheck rather than hardcode this future value.                           |
| `deno task deps:why -- @orpc/client`                          | Nine source hits; the dependency is live and not removable.                                                                                                                                        |
| <https://v1.orpc.dev/docs/client/rpc-link>                    | Official stable-v1 docs show async headers from typed client context and method/fetch decisions from context/path.                                                                                 |
| <https://v1.orpc.dev/docs/metadata>                           | Official stable-v1 docs show `$meta<T>()` initialization and procedure metadata consumption; this is adapter evidence only.                                                                        |
| <https://fetch.spec.whatwg.org/#forbidden-request-header>     | Normative forbidden header list plus `proxy-`/`sec-` prefix ownership.                                                                                                                             |
| <https://www.w3.org/TR/trace-context/>                        | Final trace mutation, privacy, and trust-boundary rules support transport ownership.                                                                                                               |
| <https://www.rfc-editor.org/rfc/rfc9110.html#section-17.16.1> | HTTP credentials rely on secured transport for confidentiality.                                                                                                                                    |
| OWASP Logging Cheat Sheet                                     | Access tokens/session identifiers are excluded from direct logging.                                                                                                                                |

### Root-requested post-generator oRPC v2 audit amendment

This is a research amendment requested by the root orchestrator after generator completion. It is
not a formal PLAN-EVAL verdict and no evaluator was launched. The supplied audit follow-up was read
in full (59 lines; SHA-256 `fa8b0ab5cd1afd57b8f6c20036a265fa7c8fb48764f88f97f289c44c0737d3d0`). Its
claims were reconciled against official upstream sources and current repository state:

| Evidence                                                                                                                                                                                                                                                      | Reconciled conclusion                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Official releases](https://github.com/middleapi/orpc/releases)                                                                                                                                                                                               | `v2.0.0-beta.26` superseded `beta.25` and remains pre-release; `v1.15.0` is latest stable on the audit date. Do not migrate production to beta for RFC-A.                                                                                                                          |
| [v1-to-v2 migration guide](https://v2.orpc.dev/docs/migrations/from-v1)                                                                                                                                                                                       | The RPC protocol is incompatible across majors; `.$meta<T>` becomes `defineMeta` plugins; middleware deduplication, error/status, GET/CSRF, links, serializers, OpenAPI, TanStack, and OTel all change. A v2 rollout is coordinated migration scope.                               |
| [Request headers plugin](https://v2.orpc.dev/docs/plugins/request-headers)                                                                                                                                                                                    | `RequestHeadersHandlerPlugin` is an optional incoming server companion and request headers can be absent on direct calls. It does not solve outbound composition.                                                                                                                  |
| [TanStack integration](https://v2.orpc.dev/docs/integrations/tanstack-query#client-context)                                                                                                                                                                   | v2 still excludes client context from query keys; RFC-A's partition/direct-only law remains necessary.                                                                                                                                                                             |
| [v2 error handling](https://v2.orpc.dev/docs/error-handling) and [client error handling](https://v2.orpc.dev/docs/client/error-handling)                                                                                                                      | Typed-error factories, HTTP status maps, and client inference changes belong to the v2 migration, not RFC-A contribution failures.                                                                                                                                                 |
| [`beta.25` standard link codec](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/adapters/standard/rpc-link-codec.ts) and [retry plugin](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/plugins/retry.ts) | Headers resolve during encoding and retry invokes downstream per attempt. Direct link-header preparation executes per retry; RFC-A must prepare above retry or memoize per logical call.                                                                                           |
| `rg -l '@orpc/' packages plugins`                                                                                                                                                                                                                             | 91 files contain references; 74 remain after excluding test paths/name patterns. The affected production surface is materially larger than RFC-A and includes SDK, service, contracts, plugins, telemetry, Fresh/desktop, CLI/scaffold, serializers, OpenAPI, errors, and queries. |
| `deno task deps:latest --filter '@orpc/*'`                                                                                                                                                                                                                    | Seven workspace dependencies on v1.14.x are behind stable v1.15.0. Any exact-family v1 upgrade is a separate low-risk sequencing decision.                                                                                                                                         |

The amendment locks upstream-major neutrality and three internal NetScript adapter responsibilities:
procedure metadata, prepared outbound headers, and transport policy. Stable v1 is the implementation
target. A v2 adapter must be designed and gated in a separate RFC/spike.

### Formal PLAN-EVAL cycle 1 amendment

Claude Fable 5 returned authoritative `FAIL_PLAN / CHANGES_REQUESTED` in `plan-eval.md` at commit
`f1a29fe1a65d59f71a59bf4b6b2a48fc49e1e86f`. The 159-line verdict was read completely; SHA-256
`0690af2a2914ad0a9118be04ccebb933af33b2bac8f3f743bc7990f8f5f38cdd`. This section is generator
remediation of that verdict, not a self-evaluation.

| Finding | Re-baselined evidence                                                                                                                                                                            | Author correction                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-A1    | `deno doc --json packages/sdk/src/ports/mod.ts` reaches `~orpc` through current `ContractProcedureLike`/`ContractLike`; doctrine 02 sanctions builder coupling in contracts.                     | Scope zero-oRPC to named new RFC-A declaration nodes and generated client declarations. Keep a non-growing #1350/#1278 allowlist for unchanged leakage.                                              |
| F-A2    | Server keys are fixed three-tuples in `query-key.ts`/`query-factory.ts`; `CacheKey`, `CacheQuery`, key bridge, KV persister, collections, and the current query-utils cast constrain the design. | Specify exact empty or two-string server suffix, defaulted 3/5 tuple types, six-surface disposition, recursive TanStack wrapping cost, and upstream-fixture disposition.                             |
| F-A3    | `ServiceClientMethod`, `ServiceClientShape`, `ServiceQueryClientContext`, and query option types are public.                                                                                     | Append a normative compatibility default to every widened public generic; never insert before an existing positional parameter.                                                                      |
| F-A4    | Locked v1.14.6 resolves headers in codec `encode`; retry re-enters downstream from both unary failure and iterator consumption.                                                                  | Define stream sessions as multiple preparation epochs: unary retry prepares once, iterator reconnect prepares fresh credentials once per epoch.                                                      |
| F-A5    | Desktop creates a second client over MessagePort and has no HTTP header channel.                                                                                                                 | Keep RFC-A HTTP-only; type/runtime/generator reject Desktop contributions, and auth/desktop docs state the consequence.                                                                              |
| F-A6    | `src/ports/` is a public barrel.                                                                                                                                                                 | Place the three ports in `src/internal/client-contributions/`, forbid an internal barrel/export, and add root/subpath doc plus packed-consumer absence gates.                                        |
| F-A7    | Current retry fields hand-copy stable-v1 retry context; retry defaults to zero; dedupe replaces downstream context but keys include headers.                                                     | Exclude all transport fields from contribution-visible context, expose signal separately, state the private prepared-call channel, drive retry explicitly, and compare only the prepared projection. |
| F-A8    | Stable v1 enables GET inference now; v2 defaults away from GET, removes `inferRPCMethodFromContractRouter`, and can make GET-only dedupe inert. `@orpc/opentelemetry` also exists on v1.         | Correct keep-GET versus retire-GET direction; add inference, allowMethods/CSRF, dedupe-effectiveness, OTel ownership, lock-only family, desktop, and stream gates to the v2 spike.                   |
| F-A9    | The old `.llm/tmp` proof was ignored and modeled a stripped context.                                                                                                                             | Commit `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` against real contract/defineServices/query/key surfaces.                                                              |
| F-A10   | Dedupe identity includes headers; v1.15.0 shipped after the then-current v2 beta; #1350 is filed as the `safe()` error repair, not metadata.                                                     | Cite verified lifecycle/header safety, classify raw input as sensitive borrowed data, keep stable v1, and split Stage 1a error repair from Stage 1b metadata ownership reconciliation.               |

## Proposal challenge record

| Starting proposal choice                                                                                    | Verdict              | Reason                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| One envelope for headers, interceptors, plugins, fetch, link, errors, server plugins, metadata, and queries | Reject               | Different owners/lifecycles; mirrors upstream; violates minimality and A14/AP14.                      |
| Named/versioned descriptor and tuple-derived context                                                        | Keep, narrow         | Needed for plugin discovery, conflicts, generated typing, and unknown-boundary validation.            |
| Later contribution overwrites declared header                                                               | Reject               | Doctrine forbids semantic plugin-order dependence; all header owners are exclusive.                   |
| `requires`/priority/order fields                                                                            | Reject in v1         | Contributors receive the same snapshot and cannot consume each other's output; valid results commute. |
| Trace as second contribution                                                                                | Reject               | Final trace header belongs to the client span created at transport dispatch. Reserve the keys.        |
| Auth as first dogfood                                                                                       | Keep                 | Bearer resolution proves async secret/context/header/failure/redaction behavior.                      |
| Second proof                                                                                                | Change to locale     | Locale is non-auth, owns a normal header, requires optional context, and proves cache partitioning.   |
| Contribution error map merged with contract errors                                                          | Reject               | Preparation failures occur before a server response and are not defined contract errors.              |
| Arbitrary query defaults/invalidation                                                                       | Reject               | Existing query APIs remain policy owner; only a canonical cache-safety suffix is permitted.           |
| Automatic plugin activation                                                                                 | Reject               | Installation exposes availability; generated/app config explicitly selects per service.               |
| Raw `fetch`/link override                                                                                   | Reject from this RFC | Transport remains SDK-owned; #451 owns future custom links using the existing structural port.        |

## Locked design conclusions

1. Protocol `{ family: 'netscript.sdk-client', major: 1 }`; id is lower-case `<owner>:<name>`.
2. Curried `defineSdkClientContribution<TContext>()` validates a runtime context declaration with
   required/optional modes, exclusive lower-case header keys, and one async `prepare` callback.
3. Patch surface is headers only. All emitted values are sensitive by default.
4. Literal tuples get named conflict diagnostics and a 16-contribution inference ceiling; runtime
   repeats all checks.
5. Contributors execute sequentially with one immutable snapshot, cannot observe accumulated output,
   and successful composition is order-independent.
6. Every contributor declares response cache as `invariant`, `partitioned`, or `direct-only`.
   Partitions are synchronous/non-secret and sorted by id; direct-only services are omitted from
   generated query maps.
7. `NetScriptProcedureMeta.access.authentication` is `none | optional | required`; first-party
   bearer defaults unmarked procedures to `none`.
8. SDK transport owns discovery/codec/retry/dedupe/fetch/trace/errors. Trace fields and Fetch-owned
   headers are reserved.
9. Plugin manifests carry static module/export/target references; generators use explicit imports
   and literal tuples. No ambient activation.
10. Named new RFC-A contribution types and generated client declarations are upstream-major-neutral
    and contain zero raw oRPC symbols under the non-growing #1350/#1278 baseline. Package-private
    metadata, prepared-header, and transport-policy ports isolate version-specific adapters.
11. Preparation runs exactly once per logical-call epoch above ordinary retry semantics. The
    immutable prepared header/context snapshot is reused byte-equivalently on every attempt in that
    epoch; iterator reconnect starts a new epoch with fresh preparation.
12. RFC-A implements on stable v1. A v1.15.0 move needs a separate exact-family decision; v2 beta,
    typed-error/status, OTel, GET/CSRF, protocol rollout, and broad migration work belong to a
    separate RFC/spike.
13. No product implementation belongs in this RFC PR.

## Type proof

Committed compile-only proof:
`packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`. It imports the current real
`ContractLike`, `DefineServiceConfig`/`defineServices`, `ServiceClient`, `ServiceQueryUtils`, and
query-key primitives while modeling only the not-yet-implemented RFC types locally.

Checked cases:

- required auth plus optional locale context intersection;
- current default client/query/`defineServices` assignability;
- current `ActionMethod`/`QueryFactory` exact three-tuple keys, `FactoryConfig` client default, and
  `CacheKey` compatibility;
- contribution-aware `defineServices` client/query results and direct-only omission;
- default three-segment and partitioned five-segment server keys;
- current Desktop options rejecting an HTTP contribution field;
- required request argument and missing-auth `@ts-expect-error`;
- named duplicate-context conflict at the tuple boundary;
- accepted 16-element synthetic tuple; and
- rejected 17-element tuple.

Command:

```text
deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts
```

Result after the cycle-1 remediation: exit 0, 0.92 s elapsed, 268,448 KiB maximum RSS under the
recorded `/usr/bin/time` format. Timing is informational, not a gate.

## JSR / publish-surface audit

### Current baseline

The repository-native package audit reported dry-run OK for all four affected package roots:

| Package                       | Exports now | Dry-run | Existing findings relevant to implementation                                                                                                                      |
| ----------------------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/contracts`        | 4           | OK      | sanctioned oRPC slow-type warning; doc-lint reports 9 combined private-type refs.                                                                                 |
| `@netscript/sdk`              | 12          | OK      | slow-type warning and existing `src` cardinality warning; doc-lint reports 3 combined private-type refs.                                                          |
| `@netscript/plugin`           | 13          | OK      | 4 existing missing `@module` export docs plus cardinality warnings; doc-lint reports 15 combined private-type refs. Audit exits 1 on these pre-existing findings. |
| `@netscript/plugin-auth-core` | 9           | OK      | slow-type warning; doc-lint reports 4 combined private-type refs.                                                                                                 |

Commands:

```text
deno run -A .llm/tools/fitness/audit-jsr-package.ts --root <package> --text
deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root <package> --pretty
```

These are baseline findings, not caused by the RFC file. They make the implementation bar stricter:
new contribution types may not add private upstream refs or slow types, and #1350 must reduce rather
than deepen the contract leak.

### Proposed publish consequences

- `@netscript/contracts`: new root metadata types; no new subpath.
- `@netscript/sdk`: new root/client/ports symbols and generics; no new export subpath.
- `@netscript/plugin`: new optional config reference and builder path; no SDK runtime dependency.
- `@netscript/plugin-auth-core`: new `./sdk` export and optional explicit `./sdk/server` convenience
  export; adds a reviewed SDK dependency.
- Named new RFC-A declarations and generated client declarations must remain package-owned and
  isolated-declaration compatible, with zero raw oRPC module specifiers or symbols. The gate does
  not rescan the whole existing ports/contracts graph as if its #1350/#1278 leakage were absent.
- Required implementation evidence: `deno doc --lint`, package audit, publish dry-run, packed/prod
  consumer check, docs on every new entrypoint, and no `@orpc/*` identity in named new RFC-A or
  generated client declarations.

## Remaining safe questions

- Whether to raise (never lower) the 16-contribution ceiling after CI evidence.
- Whether a server environment credential convenience export ships in the first auth slice.
- Whether #451 is rescheduled with this work while remaining independent.
- Final public naming refinements that preserve the locked semantics.
- Outer wrapper (preferred) versus immutable per-epoch memoization for stable-v1 unary prepare-once;
  both must use the specified private channel and re-prepare iterator reconnects.
- Whether procedure-auth metadata is ratified inside RFC-A or as a dependent decision implemented
  through #1350.
- Whether the incoming stable-v1 request-header handler is preset-default or explicit, with absent
  headers supported for direct calls either way.
- Whether the stable-v1.15.0 exact-family upgrade precedes or follows the minimal seam.
- For the separate v2 RFC: preserve current GET with replacement inference/allowMethods/CSRF or
  retire GET and replace dedupe; zero-downtime parallel endpoints versus coordinated rollout; and
  whether v2 OTel can replace final injection without violating NetScript span ownership.
