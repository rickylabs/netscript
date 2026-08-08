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
| <https://orpc.dev/docs/client/rpc-link>                       | Official docs show async headers from typed client context and method/fetch decisions from context/path.                                                                                           |
| <https://orpc.dev/docs/metadata>                              | Official docs show `$meta<T>()` initialization and procedure `~orpc.meta` consumption.                                                                                                             |
| <https://fetch.spec.whatwg.org/#forbidden-request-header>     | Normative forbidden header list plus `proxy-`/`sec-` prefix ownership.                                                                                                                             |
| <https://www.w3.org/TR/trace-context/>                        | Final trace mutation, privacy, and trust-boundary rules support transport ownership.                                                                                                               |
| <https://www.rfc-editor.org/rfc/rfc9110.html#section-17.16.1> | HTTP credentials rely on secured transport for confidentiality.                                                                                                                                    |
| OWASP Logging Cheat Sheet                                     | Access tokens/session identifiers are excluded from direct logging.                                                                                                                                |

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
10. No product implementation belongs in this RFC PR.

## Type proof

Ignored scratch proof: `.llm/tmp/sdk-client-contribution-probe.ts` with an isolated local config.

Checked cases:

- required auth plus optional locale context intersection;
- required request argument and missing-auth `@ts-expect-error`;
- named duplicate-context conflict at the tuple boundary;
- accepted 16-element synthetic tuple; and
- rejected 17-element tuple.

Command:

```text
deno check --config .llm/tmp/deno.json .llm/tmp/sdk-client-contribution-probe.ts
```

Result: exit 0. The first uncached observation was 0.67 s / 225,508 KiB RSS; a later warm check was
0.02 s / 27,136 KiB. Timing is informational, not a gate.

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
- Generated declarations must remain package-owned and isolated-declaration compatible.
- Required implementation evidence: `deno doc --lint`, package audit, publish dry-run, packed/prod
  consumer check, docs on every new entrypoint, and no `@orpc/*` type in emitted declarations.

## Remaining safe questions

- Whether to raise (never lower) the 16-contribution ceiling after CI evidence.
- Whether a server environment credential convenience export ships in the first auth slice.
- Whether #451 is rescheduled with this work while remaining independent.
- Final public naming refinements that preserve the locked semantics.
