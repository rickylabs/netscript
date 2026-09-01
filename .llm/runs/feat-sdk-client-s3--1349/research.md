# Research — #1349 remaining S3 reconciliation

## Re-baseline

- Carried-in sources: issue #1349 as amended on 2026-08-13, RFC 0001 Stage 2, merged PRs #1834 and
  #1841, and `.llm/runs/feat-sdk-client-contribution-seam--1349/`.
- Re-derived against `origin/main` @ `82a2527e27aa91baabf35e4b001ed8b6266308e6` on 2026-09-01.
- `deno doc` was run over `@netscript/sdk/client`, `./ports`, `./presets`, `./query`,
  `./query-client`, and `./desktop`; focused source reading was limited to the one uncovered error
  branch and the relevant tests.
- What changed versus the carried-in completion claims: the runtime and public contract are on
  `main`, but three acceptance tripwires are incomplete. The exact forbidden public link names and
  upstream callback-array fields are not named by tests, and the public
  `SDK_CONTRIBUTION_RUNTIME` taxonomy member has no assertion anywhere in `packages/sdk/tests`.

## Authority and reconciliation rule

The issue's **0.0.7 normative scope amendment** and RFC 0001 Stage 2 supersede the original target
rows that proposed a public link seam, upstream interceptor/plugin arrays, option removal, and
server-handler work. In particular, dependency ordering is not a supported semantic: dependency
fields are invalid descriptor shape.

## Amended acceptance rows

| # | Amended acceptance row | Status on `main` | File and symbol evidence |
| --- | --- | --- | --- |
| 1 | `createServiceClient` accepts an ordered tuple of v1 descriptors limited to context projection, disjoint headers, and response-cache behavior. | **Shipped** | `deno doc packages/sdk/src/client/mod.ts`: `createServiceClient`, `CreateServiceClientOptions.contributions`, `SdkClientContribution`, and `SdkClientRequestPatch`; `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` proves tuple inference and closed descriptor fields. |
| 2 | Omitting the tuple preserves wire behavior and existing calls. | **Shipped** | `CreateServiceClientOptions<TContract, TContributions = readonly []>` defaults compatibly; `packages/sdk/tests/integration/client-contribution-adapter_test.ts` test `omitted and explicit-empty contributions produce byte-identical requests`; existing defaults compile in `sdk-assignability_type.ts` and `define-services_type.ts`. |
| 3 | Client/query context generics default compatibly and compose to the intersection of contribution contexts. | **Shipped** | `deno doc`: `ServiceClientMethod<..., TContext = ServiceClientContext>`, `SdkClientContributionContext<TContributions>`, `QueryFactory<..., TContext = ServiceClientContext>`, and `ServiceQueryUtils<..., TContext = Record<never, never>>`; RFC type fixture calls the generated client and query utils with intersected auth+locale context. |
| 4 | Stable-v1 adapter stays under private `src/internal/client-contributions/`; forbidden link/adapter identities are not public. | **Partially shipped — implementation complete, exact tripwire incomplete** | Private symbols exist as `ClientTransportPolicyPort`, `PreparedOutboundHeadersPort`, `PreparedSdkClientCall`, `createStableV1ClientLink`, and `stableV1PreparedCall` under `adapter-ports.ts`, `prepared-call.ts`, and `stable-v1-adapter.ts`. `deno doc --json` symbol inventories for root/client/ports/desktop contain none of `createHttpClientLink`, `ClientLinkPort`, or `ClientLinkCallOptions`, and `deno.json` has no internal export. However `client-contribution-private-surface_test.ts::PRIVATE_ADAPTER_NAMES` does not name those three amendment-prohibited symbols. |
| 5 | Contributions cannot supply/observe fetch, link plugins, interceptor arrays, retry, dedupe, tracing, or resolved HTTP method. | **Partially shipped — closed implementation, exact callback-array tripwire incomplete** | `SdkClientContribution` exposes only protocol/id/context/headerKeys/responseCache/prepare; `SdkClientPrepareOptions` exposes the projected context, signal, package-owned procedure/transport descriptor, and borrowed input; unary retry test proves retry/cache/trace fields are absent from callback context. Runtime validation is closed-shape and the type fixture rejects `link`, `fetch`, and `retry`, but no test names `plugins`, `interceptors`, `clientInterceptors`, or `adapterInterceptors`. |
| 6 | `port` and `timeout` remain accepted and deprecated; #1351 owns disposition. | **Shipped** | `deno doc --filter CreateServiceClientOptions` and `--filter DefineServiceConfig` show both optional properties with `@deprecated` guidance pointing to #1351. |
| 7 | Construction deterministically rejects conflicts, unsupported versions, over-limit tuples, dependency/order fields, and Desktop contributions. | **Shipped under Stage-2 semantics** | `validateSdkClientContributions` is the runtime boundary. `client-contribution-validation_test.ts` covers protocol family/major, duplicate id/context/header ownership, reserved headers, 17 entries, forbidden dependency/order fields, and Desktop runtime rejection; the RFC type fixture covers duplicate context, 17 entries, order-field invalidity, and Desktop type rejection. |
| 8 | Reconnect preparation and cache modes have positive/negative coverage; removing contributions removes their effects. | **Shipped** | `client-contribution-adapter_test.ts` pins prepare-once unary retry, fresh iterator reconnect epochs, abort, and byte-identical omission. `client-contribution-cache-query_test.ts` pins sorted server/TanStack suffixes, cache isolation, invariant/omitted unsuffixed keys, direct-only omission, invalidation prefixes, persistence, and collection key/function pairing. |
| 9 | Server handler/plugin forwarding and deduplication remain outside this leaf. | **Shipped as non-scope** | Public `defineServices`/`DefineServiceConfig` documentation contains only client contribution configuration. PRs #1834/#1841 changed the SDK client contribution seam; no service-handler surface is part of this leaf. |
| 10 | SDK check/test/publish gates pass with isolated declarations. | **Shipped on the landed slices; must be revalidated for this test slice** | PR #1841 records structured SDK check/lint/fmt, 113 tests, JSR audit, publish dry-run, 0 new doc diagnostics, and byte-identical `deno.lock`. This run will repeat the user-specified focused gates after adding the missing tripwires. |

## Required coverage matrix

| Coverage family | Status | Existing pin / gap |
| --- | --- | --- |
| Key algebra | **Shipped** | `server and TanStack full keys use sorted contribution partitions`; RFC type fixture proves exact default three-tuple and partitioned five-tuple. |
| Reconnect preparation | **Shipped** | `iterator reconnect starts one new preparation epoch and rotates credentials`; abort test proves no post-abort epoch. |
| Desktop rejection | **Shipped** | Runtime rejection in `client-contribution-validation_test.ts`; compile rejection in the RFC type fixture. |
| Cache modes | **Shipped** | Partitioned, invariant, omitted, and direct-only behavior in `client-contribution-cache-query_test.ts`; invalid partitions in validation tests. |
| Conflicts | **Shipped** | Duplicate id, context ownership, header ownership, and reserved ownership tests. |
| Local failure taxonomy | **Partially shipped** | Nine of ten public `SdkClientContributionErrorCode` values are asserted. `SDK_CONTRIBUTION_RUNTIME`, emitted by `validatePatchHeaders` for a non-record or extra-field patch, is not asserted. |

## Audit verdict

The production contract and runtime are shipped. The only outstanding S3 scope is test coverage:

1. pin the three amendment-prohibited public link symbols in the `deno doc --json` absence test;
2. pin all upstream interceptor/plugin callback-array field names at compile and unknown-input
   runtime boundaries; and
3. pin `SDK_CONTRIBUTION_RUNTIME` as the tenth local taxonomy member, including its redacted
   diagnostic fields.

No production source, export map, option handling, transport consolidation, server handler, or
`http-client-link.ts` header-authorship callback needs modification.

## jsr-audit surface scan

- Surface scanned: all 13 `packages/sdk/deno.json` exports through `deno doc`; metadata is a scoped
  package with name/version/description/exports and a source-only publish include/exclude policy.
- Planned public delta: **none** (tests and harness artifacts only).
- Base doc-lint measurement: 3 combined `private-type-ref` diagnostics, 0 `missing-jsdoc`, exit 1.
  The branch requirement is 0 new diagnostics, measured A/B rather than as an absolute clean bar.
- Slow-type/surface risk: none introduced by the plan; publish dry-run still runs as a regression
  gate. `deno.lock` base SHA-256 is
  `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`.

## Open questions

- None that can force implementation rework. The outstanding work is a closed, test-only slice.
