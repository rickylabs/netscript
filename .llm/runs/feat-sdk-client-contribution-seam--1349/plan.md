# Plan — #1349 [sdk-client S3] typed SDK client-contribution seam

**PLAN-EVAL: REQUIRED — cycle 2.** Cycle 1 returned `FAIL_PLAN` at `4b520ea44`; the committed
verdict is `plan-eval.md`. This revision is derived from the Accepted
`rfcs/0001-sdk-client-contributions.md` and its committed compile-only proof,
`packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`. The issue amendment routes
conflicts to RFC 0001 Stage 2, so issue prose is not an alternate design source. No implementation
may begin until a separate supervisor-dispatched PLAN-EVAL returns `PASS`.

## Scope, archetype, and doctrine verdict

- **Owned surface:** `packages/sdk` only: public contribution/client/query contracts, the private
  stable-v1 adapter, runtime validation/cache behavior, Desktop rejection, SDK docs, and SDK
  consumer proof named by RFC 0001 Stage 2.
- **Archetype:** **2 — Integration.** Current doctrine assigns `packages/sdk` to Archetype 2 and
  says to preserve discovery/client/cache adapter boundaries. The descriptor/helper is a public
  DSL-like contract inside that package, but the slice's defining architecture is three
  package-owned ports plus the stable-v1 adapter to an external transport.
- **Scope overlays:** none. SDK README/API documentation is an acceptance deliverable inside this
  package wave, not a standalone docs overlay.
- **Current doctrine verdict:** **Keep** — preserve discovery/client/cache adapter boundaries
  (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`).
- **Debt:** no open `packages/sdk` entry was found in `.llm/harness/debt/arch-debt.md`. The plan
  creates no debt. The inaccurate `ports/mod.ts` “transport seam” sentence is corrected in Slice 3
  rather than left silent or deferred.
- **Anti-patterns in scope:** AP-1, AP-2, AP-3, AP-4, AP-5, AP-7, AP-8, AP-9, AP-11, AP-13, AP-14,
  AP-16, AP-17, AP-19, AP-20, AP-22, AP-23, AP-24, and AP-25. The highest-risk checks are AP-3
  (three narrow ports, not one transport god interface), AP-9 (no flag-driven generic adapter),
  AP-11/AP-25 (no environment or module-load side effects), AP-14 (zero upstream identity on the new
  public surface), and AP-22 (no internal barrel).

## Authority re-baseline: five superseded issue rows

LD-1 and LD-2 remain correct, but they belong to a five-row sweep. All five “Target contract” rows
below conflict with the later amendment and the Accepted RFC and are superseded:

| Issue row | Superseded direction                                                         | RFC 0001 Stage-2 resolution                                                                                                                          |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| §1        | `with?:` and `link?: ClientLinkPort`                                         | The only option is `contributions?`, intersected with `ValidateSdkClientContributions<T>`. **No `link?:` exists.** Keeping it would pre-empt #451.   |
| §2        | Rename to `BaseServiceClientContext` and deprecate `ServiceClientContext`    | `ServiceClientContext` remains canonical and is the compatibility default for client-side widened generics. No alias or rename is introduced.        |
| §3        | Export `createHttpClientLink`, `ClientLinkPort`, and `ClientLinkCallOptions` | These and all three internal adapter ports stay private and absent from every public doc/import graph.                                               |
| §5        | Remove `port` and `timeout`                                                  | Both remain accepted and gain deprecation JSDoc; disposition/removal belongs to #1351.                                                               |
| §7        | Add an environment/desktop compatibility declaration to a contribution       | Protocol major 1 has no environment flag. `CreateDesktopServiceClientOptions` gains no `contributions`; TypeScript and construction reject attempts. |

This is a correction of the plan's authority chain, not a scope change.

## Locked architecture decisions

### LD-1 — transport/link symbols remain private; owned docs tell the truth

`createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, the private adapter ports, the
private prepared-call types, and any package-private symbol remain unexported. Slice 3 replaces the
misleading `ports/mod.ts` “transport seam” sentence with contribution-surface wording; it does not
invent an exported link escape hatch.

### LD-2 — `port` and `timeout` remain accepted and deprecated

`CreateServiceClientOptions` and `DefineServiceConfig` keep both fields with migration-oriented
deprecation JSDoc. They gain no new behavior. Their eventual transport/discovery disposition is
#1351.

### LD-3 — the public surface is the RFC-fixed contribution algebra

The public names and shapes come from RFC 0001 §Public contribution contract, §Tuple type algebra,
§Query and generated type propagation, §Server key algebra, and §Error and failure model:

- `SdkClientContributionProtocol`, `SdkClientContributionId`, `SdkClientProcedureDescriptor`,
  `SdkClientTransportDescriptor`, `SdkClientPrepareOptions`, `SdkClientRequestPatch`,
  `SdkClientContextDeclaration`, `SdkClientCachePartitionOptions`, `SdkClientResponseCache`, and
  `SdkClientContribution` use the RFC's fixed fields. `SdkClientPrepareOptions` contains exactly the
  contribution context projection, optional signal, procedure, transport, and input. The transport
  descriptor is `{ kind: 'http', origin, rpcPath, secure }`; it has no resolved method. Partition
  resolvers receive context and procedure only.
- `defineSdkClientContribution<TContext>()(descriptor)` preserves literal id, declaration, header
  keys, and cache mode. The descriptor has no type marker, dependency/order list, priority,
  environment/desktop flag, upstream callback, arbitrary metadata, link, fetch, retry, plugin, or
  interceptor field.
- `SdkClientContributionContext<T>` and `ValidateSdkClientContributions<T>` recursively intersect
  contexts, produce named id/context/header/limit diagnostics, accept 16 literal contributions, and
  reject 17 with `limit:more-than-16`; widened arrays retain their context union and receive full
  validation at construction.
- `CreateServiceClientOptions<TContract, TContributions = readonly []>` and
  `DefineServiceConfig<TContract, TContributions = readonly []>` use `contributions?` intersected
  with `ValidateSdkClientContributions<TContributions>`; neither gains `with?` or `link?`.
- `ServiceClientContext` remains live. Client-side widened generics default to it; query-only
  context generics default to `Record<never, never>`; key suffix generics default to `readonly []`,
  exactly as the RFC compatibility table states.
- Preserve `TError` as the third `ServiceClientMethod` slot and append context fourth:
  `ServiceClientMethod<TInput, TOutput, TError = Error, TContext extends object = ServiceClientContext>`.
  `ServiceClientShape` and `ServiceClient` propagate that error channel. This intentionally corrects
  the RFC sketch's omission and obeys #1350's prohibition on erasing the existing channel.
- Thread context through `ServiceRequestOptions`/`ServiceRequestRest`, `ServiceClientShape`,
  `ServiceClient`, `ActionMethod`, `FactoryConfig`, `QueryFactory`, `ServiceQueryClientContext`, all
  service procedure query/infinite/mutation/streamed option and utility types, `ServiceQueryUtils`,
  `DefinedServiceClients`, `DefinedServiceQueries`, and `DefinedServiceQueryUtils`, preserving every
  pre-RFC positional generic through appended defaults.
- Add `SdkClientServerKeySuffix` and `ActionQueryKey<TAction, TSuffix = readonly []>`. The empty
  default is the exact existing three-tuple; a partition is the RFC's two-string suffix and yields
  the exact five-tuple while remaining a `Deno.KvKey`.
- Publish `SdkClientContributionError`, its ten-code `SdkClientContributionErrorCode`, and
  `SdkClientContributionDiagnostic`. Slice 1 establishes the class/type contract; Slice 3 maps
  construction, partition, and preparation failures to those fixed codes and redacted fields.

The committed RFC fixture is migrated from its local stand-ins to these public imports. Its current
Desktop excess-property check, default assignability, required-context rest, 16/17 budget, server
suffix, per-service inference, and direct-only omission remain proofs rather than being weakened.

### LD-4 — forbidden powers are absent by shape and by dataflow

Compile-negative fixtures prove a literal descriptor cannot supply `fetch`, link/plugins,
interceptors, retry/dedupe/trace controls, dependency/order fields, environment flags, or a resolved
HTTP method. Construction validation repeats the closed plain-object shape checks for JavaScript,
`unknown`, and widened input. Runtime callback-observation tests prove the SDK constructs only the
RFC `SdkClientPrepareOptions` projection: retry/cache/trace fields are not copied into contributor
context; cancellation is exposed only as the separate signal. Partition callbacks additionally
receive no input or transport. Unrepresentability therefore does not rely on TypeScript excess
properties alone.

### LD-5 — all dispatch traverses the three-port RFC pipeline

This is a direct RFC rule, not an inference. `PreparedOutboundHeadersPort` prepares exactly once per
logical call epoch; `ProcedureMetadataPort` alone interprets the upstream procedure node; and
`ClientTransportPolicyPort` owns encoding, retry, dedupe, tracing/final trace injection, fetch,
decoding, streaming recovery, and dispatch. The transport port accepts an already prepared
`PreparedSdkClientCall` and must never invoke contributors. “No private fast lane” means built-in
transport behavior traverses this port pipeline, not that retry/dedupe/trace become public
contribution capabilities.

### LD-6 — tuple order reports failures; valid semantics are order-independent

Contributors run sequentially in tuple declaration order against the same immutable snapshot.
Disjoint valid contributions commute; order affects only which invalid descriptor or preparation
failure is reported first. Protocol v1 has no `dependsOn`, `before`, `after`, `requires`,
`priority`, numeric order, or environment field. An attempted extra field is a closed-shape
`SDK_CONTRIBUTION_INVALID` construction error, satisfying the issue's “invalid dependency ordering”
line without inventing a dependency DSL. The 16 cap is enforced both at the literal tuple boundary
with the named diagnostic and at construction for unknown/widened input.

### LD-7 — Desktop rejects at the options/transport boundary

`CreateDesktopServiceClientOptions` gains no `contributions` property and the committed RFC fixture
continues to prove excess-property rejection. JavaScript/unknown/widened options carrying
`contributions` fail Desktop construction with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`; they are
never ignored. The CLI/generator target-rejection gate belongs to its later CLI lane and is explicit
deferred scope for this leaf, not a descriptor flag.

### LD-8 — isolated declarations and JSR surface safety are design constraints

All new public return types and widened generics are explicitly nameable under isolated
declarations. Tail-recursive tuple processing, named conflict markers, and the existing 16/17
fixture bound inference cost. Root/client/ports entrypoints document the new symbols, internal
imports remain relative, and no new public/generated declaration carries an `@orpc/*` identity.
`deno doc --lint`, the repository JSR audit, the SDK publish dry-run, and packed-consumer probes are
required; `packages/sdk` does not claim a new slow-type exception.

### LD-9 — server/plugin/contracts expansion is confirmed out of scope

RFC 0001 says server-plugin reachability is a service-preset problem and its three ports are
client-only. `NetScriptProcedureMeta` already exists and is initialized/exported on the baseline, so
#1349 needs no `packages/contracts` change. #1350 retains ownership of the error-channel repair;
#1352 owns bearer/auth behavior and manifest reference. No `packages/service`, `packages/contracts`,
`packages/plugin`, or plugin file may change. If the private adapter appears to require such a
change, stop and report it as a rescope signal.

## Open-decision sweep

No implementation-shaping decision remains open in this leaf:

- **Resolved now:** field name (`contributions?`), absence of `link?`, canonical context name,
  descriptor/prepare/partition shapes, error taxonomy, tuple/order law, 16 cap, query generic
  defaults, key suffix, three-port channel, stable-v1 baseline, Desktop rejection, and private
  export boundary are all RFC-fixed above.
- **Implementation realization locked:** use the RFC-preferred outer logical-call wrapper for
  prepare-once/reconnect epochs. A package-private symbol may only carry the same immutable prepared
  value across an upstream callback; it is not an alternate channel or contributor-visible state.
- **Safe to defer to named sibling owners:** stable-v1 family upgrade/transport consolidation
  (#1351), custom links (#451), contract error repair (#1350), bearer/auth and environment-specific
  factories (#1352), trace proof (#1353), service-preset incoming-header behavior, generic plugin
  discovery/generation (#1093), and any v2 adapter/migration RFC. None changes a file or public
  shape in this leaf.

## Commit slices

Three implementation slices retain the cycle-1 decomposition; their ceilings and gates are now
complete. Each future slice updates the run artifacts, is reviewed by the supervisor, and is
independently committed. This cycle-2 commit itself is plan text only and is not an implementation
slice.

### Slice 1 — public contract, tuple/key algebra, and compatibility proofs

**Proves:** the RFC-fixed descriptor/helper/error surface is publishable; client and query contexts
compose per service; old positional generic uses and key shapes remain exact; 16 succeeds/17 fails;
Desktop rejects the field at compile time; `port`/`timeout` remain accepted/deprecated.

**Files:**

- `packages/sdk/src/ports/sdk-client-contribution.ts` (new public protocol, descriptor, cache,
  prepare, and validation/context algebra)
- `packages/sdk/src/client/sdk-client-contribution.ts` (new curried public helper signature)
- `packages/sdk/src/client/errors.ts` (public contribution error/code/diagnostic contract)
- `packages/sdk/src/ports/service-client.ts`
- `packages/sdk/src/ports/query-factory.ts`
- `packages/sdk/src/ports/service-query-utils.ts`
- `packages/sdk/src/ports/query-key.ts`
- `packages/sdk/src/presets/define-services.ts`
- `packages/sdk/src/ports/mod.ts`, `packages/sdk/src/client/mod.ts`,
  `packages/sdk/src/presets/mod.ts`, and `packages/sdk/mod.ts` (only the RFC-A public exports; no
  link/internal export)
- `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` (replace local model with
  public imports without removing assertions)
- focused existing type fixtures under `packages/sdk/tests/type-fixtures/` for `sdk-assignability`,
  `define-services`, and `service-query-utils-upstream` compatibility

**Slice gates:**

1. `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`.
2. Structured scoped SDK check/test/lint/fmt wrappers (`--ext ts,tsx`) and focused type-fixture
   checks; never raw root gates.
3. `deno task quality:scan` and `deno task arch:check`.
4. `deno task doc:lint --root packages/sdk --pretty`, SDK publish dry-run, and repository JSR audit.
5. Compile-negative assertions for forbidden descriptor fields, compatibility defaults, exact
   three/five tuple keys, preserved `TError`, and unchanged Desktop excess-property rejection.

### Slice 2 — private ports, stable-v1 adapter, and logical-call epoch conformance

**Proves:** every call follows prepare → immutable prepared call → transport; omission is
byte-identical to baseline; ordinary retries prepare once; iterator reconnects prepare once per new
epoch; private/upstream adapter identities do not leak.

**Files:**

- `packages/sdk/src/internal/client-contributions/adapter-ports.ts` (exactly the three RFC
  responsibilities)
- `packages/sdk/src/internal/client-contributions/prepared-call.ts` (composition, immutable
  snapshot/prepared headers, prepare-once epoch logic)
- `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts` (supported private adapter;
  optional private symbol carries only the already prepared value)
- `packages/sdk/src/client/service-client.ts`
- `packages/sdk/src/client/http-client-link.ts`
- `packages/sdk/src/ports/client-link-factory.ts` (extend the existing package-internal structural
  seam to carry the prepared channel; it remains unexported)
- focused conformance tests under `packages/sdk/tests/integration/` for omitted contributions,
  preparation/dataflow, forced unary retry, streaming reconnect, and abort
- packed-consumer/absence fixtures under `packages/sdk/tests/` (test-only)

There is no `src/internal/client-contributions/mod.ts` and no `deno.json` internal subpath.

**Slice gates:**

1. Forced unary retry with `context.retry: 1`: preparation count exactly 1, fresh transport header
   container per attempt, and byte-equivalent contributor headers/context/procedure projection.
2. Iterator-phase reconnect: credential A for the initial epoch, rotate to B, preparation count 2,
   reconnect uses B, all attempts within an epoch are byte-equivalent, and abort starts no epoch.
3. Runtime observation assertions: callbacks see only the RFC snapshot and cannot see SDK
   retry/cache/trace state; ordinary transport errors keep the existing error path.
4. `deno doc --json` scans for SDK root, `./client`, `./ports`, and `./desktop` proving absence of
   all three ports, prepared-call types, and private symbol.
5. Packed-consumer negative imports reject `@netscript/sdk/internal/client-contributions`,
   `@netscript/sdk/internal/client-contributions/adapter-ports`, and
   `@netscript/sdk/client-contributions`.
6. Scoped new-declaration/generated-client zero-oRPC identity scan with no growth in the #1350/#1278
   allowlist.
7. Structured scoped SDK check/test/lint/fmt wrappers plus `quality:scan`, `arch:check`, doc lint,
   publish dry-run, and JSR audit.

### Slice 3 — validation/failures, cache/query behavior, Desktop runtime rejection, and docs proof

**Proves:** invalid shapes and ownership fail deterministically/redacted; cache modes are safe on
both key algebras; direct-only services disappear at type and runtime; Desktop never ignores the
field; public docs/examples and the combined header+span consumer path match the shipped surface.

**Files:**

- `packages/sdk/src/internal/client-contributions/prepared-call.ts` (construction/preparation/
  partition validation and RFC code mapping)
- `packages/sdk/src/client/sdk-client-contribution.ts` and `packages/sdk/src/client/errors.ts`
  (construction helper and stable redacted throws)
- `packages/sdk/src/client/service-client.ts`
- `packages/sdk/src/ports/query-key.ts`
- `packages/sdk/src/query/query-factory.ts`
- `packages/sdk/src/query-client/create-service-query-utils.ts`
- `packages/sdk/src/query-client/query-client-factory.ts`
- `packages/sdk/src/query-client/types.ts`
- `packages/sdk/src/presets/define-services.ts`
- `packages/sdk/src/desktop/application/desktop-rpc-client.ts`
- focused SDK construction/header/error/cache/query/Desktop tests and generated-collection/
  persister conformance fixtures under `packages/sdk/tests/`
- `packages/sdk/README.md`, `packages/sdk/src/ports/mod.ts`, and public entrypoint JSDoc
- `packages/sdk/tests/readme-doctest_test.ts` and the focused consumer integration test

**Slice gates:**

1. Construction through `unknown` rejects bad protocol/id/plain-object shape, duplicate id/context/
   header ownership, reserved context keys, forbidden/mixed-case headers, limits, dependency/order/
   priority/environment extras, and Desktop `contributions`; required codes include
   `SDK_CONTRIBUTION_INVALID` and `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`.
2. Preparation rejects undeclared/forbidden/non-string/CR-LF headers, missing runtime context,
   invalid partitions, resolver failure, and abort with zero dispatch; snapshots prove no secret
   value/source message/cause appears in errors, logs, or spans.
3. Cache conformance proves exact server and TanStack suffixes sorted by id, no suffix for empty/
   invariant tuples, no cross-partition observation for locale/two auth partitions, unchanged prefix
   invalidation, persisted-key separation, paired generated collection key/function wiring, and
   runtime omission of direct-only query/query-utils keys.
4. `createServiceQueryUtils` recursive wrappers cover query/streamed/live/infinite full keys;
   mutations forward context without a response-cache suffix; the old cast fast path is limited to
   the empty-context/no-partition specialization.
5. README/export table documents the **contribution** surface, removes the “fork the link” escape
   hatch, states query-partition visibility/direct-only behavior and the HTTP-only Desktop boundary,
   and provides a worked example compiled by the README doctest.
6. One consumer integration test asserts both the contributed header is sent and the SDK CLIENT
   span/final trace injection is still emitted, proving contribution composition did not bypass
   transport observability.
7. Re-run the Slice-2 port-absence, packed-negative-import, and zero-oRPC gates; then structured
   scoped SDK check/test/lint/fmt, `quality:scan`, `arch:check`, doc lint, docs export drift/corpus
   checks, SDK publish dry-run, repository JSR audit, and the RFC fixture check.
8. At implementation merge readiness, run the RFC-required full
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; this expensive gate is not
   run during this plan-text revision or intermediate loops.

## Final gate set

Archetype 2 requires static, fitness, runtime (because the adapter behavior changes), and consumer
gates. Final evidence must include:

- structured scoped check/test/lint/fmt wrappers for `packages/sdk` (F-19);
- F-1 through F-12 plus F-14 through F-18 via `deno task arch:check` and manual evidence where a
  script is pending;
- `deno task quality:scan` (no `any`, blanket lint-ignore, unsafe casts, or host coupling);
- the re-pointed RFC fixture check with `--unstable-kv` and the focused runtime/cache/Desktop
  suites;
- full-export `deno doc --lint`, SDK publish dry-run, repository JSR audit, and README doctest;
- root/client/ports/desktop private-port absence, packed negative imports, and scoped zero-oRPC
  declaration/generated-client scans;
- docs export-drift/corpus checks and the combined contributed-header + CLIENT-span consumer proof;
- `deno.lock` unchanged unless a separately authorized #1351 dependency decision occurs (not this
  leaf); and
- the one-pass scaffold runtime E2E only at merge readiness.

RTK output is exploratory only. Durable or final verdicts come from the structured wrappers and
named gate outputs. If a cached gate receipt has `stdout.bytes = 0`, rerun the wrapper directly and
do not treat the receipt as evidence (D-1).

## JSR planned-surface audit

- Existing SDK root/client/ports/desktop subpaths remain the only relevant entrypoints; no internal
  subpath or internal barrel is added.
- Every new public symbol has explicit, isolated-declaration-safe annotations and full JSDoc; the
  curried helper has a named return type. No public type inherits or re-exports upstream identity.
- Deep tuple recursion and the roughly fifteen widened generic surfaces are guarded by the RFC
  fixture, existing single-/two-generic assignability fixtures, exact default key assertions, and
  the 16-contribution budget. No defaulted type parameter is inserted before an existing positional
  parameter.
- `deno doc --lint` covers the full SDK export map, not `mod.ts` alone. The publish dry-run's file
  list must contain no new internal/test/scratch paths, and the repository JSR audit must report no
  new slow-type or portability finding. A green dry-run is static evidence, so the packed-consumer
  probe remains a separate required gate.
- Internal SDK self-imports stay relative to avoid the JSR self-referential-subpath trap. No
  import-attribute or top-level filesystem/environment behavior is introduced.

## Risk register

| Risk                                                                                                | Impact                                                             | Mitigation / proving gate                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1: tuple recursion conflicts with isolated declarations or becomes too expensive                  | Public `.d.ts` emission/consumer inference breaks                  | RFC tail recursion, named markers, hard 16 cap; migrate—not delete—the committed fixture; record check time/RSS; publish dry-run and JSR audit. |
| R-2: appended context/suffix generics break existing consumers or docs across ~15 surfaces          | Additive feature becomes a source break                            | Exact RFC defaults, preserved `TError` slot, existing assignability fixtures, README doctest, packed consumer, exact three-tuple assertions.    |
| R-3: upstream retry/reconnect callbacks invoke preparation per attempt or retain a stale credential | Duplicate secret resolution or reconnect with old credentials      | Outer epoch wrapper; unary count-1 and A→B reconnect count-2 conformance; abort/no-new-epoch test.                                              |
| R-4: context-bearing responses share server/TanStack cache entries                                  | Cross-user/locale data observation                                 | Canonical sorted non-secret suffix; direct-only omission; server/TanStack/persister/collection non-observation tests.                           |
| R-5: contributor values or source failures leak into diagnostics/telemetry                          | Credential/input disclosure                                        | Framework-authored ten-code error taxonomy; no source cause; redaction snapshots across errors/logs/spans.                                      |
| R-6: private ports or oRPC identity leak into published declarations                                | Locks the public API to a transport major and violates doctrine    | Four-entrypoint `deno doc --json` absence scan, packed negative imports, non-growing scoped zero-oRPC scan.                                     |
| R-7: Desktop or widened JS input is silently accepted                                               | Unsupported MessagePort behavior appears to work                   | Existing excess-property fixture plus construction-time unsupported-transport test.                                                             |
| R-8: docs retain the false exported-transport story                                                 | Consumers fork internal links or cannot find the contribution path | Slice-3 README/export-table rewrite, `ports/mod.ts` correction, compiled worked example, docs gates.                                            |
| D-1: cached zero-byte gate receipt appears green without evidence                                   | False gate verdict                                                 | Inspect `stdout.bytes`; rerun the structured wrapper directly when zero; never use RTK as durable evidence.                                     |

## Deferred scope and tripwires

- **#1350:** base contract/error-map repair. Preserve `TError`; no contracts file changes.
- **#1351:** transport consolidation, no-op option disposition, and any stable-v1 family upgrade.
  Current lock/family is the implementation baseline; `deno.lock` remains untouched here.
- **#1352:** bearer/auth factory, environment-specific exports, security policy, and manifest
  reference.
- **#1353:** independent final trace-ownership proof; this leaf only proves contribution headers do
  not bypass the existing CLIENT span path.
- **#451:** public custom-link/capability design. The `link?:` tripwire is forbidden in #1349.
- **#1093 / CLI lane:** generic discovery, static generated imports/selection, and generator-level
  Desktop target rejection. This leaf owns type/runtime Desktop rejection only.
- **Service preset:** optional incoming request-header plugin/default and direct-call server policy.
- **Locale product contribution:** later non-auth proof; this leaf may use local synthetic locale
  fixtures but does not ship an app/plugin contribution.
- **oRPC v2:** adapter/migration RFC and all wire/error/GET/telemetry migration decisions.

Any need to edit `packages/contracts`, `packages/service`, `packages/plugin`, `plugins/`, CLI
generators, `deno.lock`, or to export a custom link/internal port is a scope-change signal: stop and
report it rather than absorb it.

## Finding traceability

| Finding | Cycle-2 closure                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1     | Five-row authority table plus LD-3: `contributions?`, no `link?`, canonical `ServiceClientContext`, exact RFC defaults/shapes.                              |
| F-2     | LD-6: valid commutativity, sequential first failure, dual 16 cap, no dependency/order/environment fields, invalid extras map to `SDK_CONTRIBUTION_INVALID`. |
| F-3     | LD-7: Desktop options gain nothing; committed excess-property proof plus widened/JS construction error; generator gate explicitly deferred.                 |
| F-4     | Slice 1 now includes query-factory, service-query-utils, query-key algebra, define-services, all query-side generics, and the local error taxonomy.         |
| F-5     | Slices 2/3 name the three RFC files, exact port/epoch behavior, runtime/cache/Desktop files, tests, and per-slice gates.                                    |
| F-6     | Final gate set and risk register include fixture, absence, packed negative import, zero-oRPC, doc/publish, `arch:check`, and `quality:scan` evidence.       |
| F-7     | Slice 3 owns README/export/JSDoc correction, compiled example, and one header-added + CLIENT-span-still-emitted consumer proof.                             |
| F-8     | `supervisor.md` and `worklog.md` are created in this cycle-2 plan commit; `worklog.md` contains the required Design checkpoint.                             |

## Cycle-2 acceptance

- [ ] Separate PLAN-EVAL returns `PASS`; this generator does not self-evaluate or dispatch it.
- [ ] Plan remains #1349 Stage-2 scope with no sibling-owner or package/plugin creep.
- [ ] All F-1…F-8 rows above remain traceable in `plan.md`, `supervisor.md`, and `worklog.md`.
- [ ] This revision commit changes only `.llm/runs/feat-sdk-client-contribution-seam--1349/` plan
      artifacts; `packages/`, `plugins/`, and `deno.lock` remain untouched.
