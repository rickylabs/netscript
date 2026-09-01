# Plan: #1351 centralize SDK HTTP method and GET-cache policy

## Run metadata

| Field | Value |
| ----- | ----- |
| Run ID | `refactor-sdk-transport-policy--1351` |
| Branch | `refactor/sdk-transport-policy` |
| Baseline | `main` @ `82a2527e27aa91baabf35e4b001ed8b6266308e6` |
| Phase | `plan` — hard stop before PLAN-EVAL |
| Target | `packages/contracts` metadata + `packages/sdk` transport integration |
| Archetype | `2 — Integration` |
| Scope overlays | none |
| Issue state | `status:plan` |

## Precedence statement

The issue's **2026-08-13 normative amendment supersedes its own pinned 1.14.15 acceptance row and
any conflicting earlier seed prose**. Accepted RFC 0001 Stage 3 governs the implementation.
Therefore:

- one fetch/retry/dedupe/trace HTTP path remains;
- unary retry, iterator reconnect, and header-safe dedupe are proved;
- `port` and `timeout` remain accepted, documented, deprecated no-ops;
- a dependency move is a separate, whole-family, `deno.lock`-only v1.15.0 decision with frozen
  install and no-mixed-version evidence;
- neither exact manifest pins nor oRPC v2 APIs/behavior land;
- the accepted narrow contribution protocol stays closed. The older RFC-A proposal to expose raw
  plugins, fetch, links, or callback arrays does not return through this slice.

## Archetype and doctrine checkpoint

`packages/sdk` is assigned Archetype 2 by current doctrine. The planned helper is justified under
A6 because it owns a NetScript-specific method/cache/dedupe law and is the v1/v2 adapter boundary;
it is not a rename of `inferRPCMethodFromContractRouter`. The package verdict is **Keep — preserve
discovery/client/cache adapter boundaries**.

The design preserves layering:

- public policy configuration remains in `src/ports/service-client.ts` and imports only
  package-owned types;
- `src/internal/transport-policy.ts` is a pure, unexported stable-v1 adapter/policy module;
- `src/client/http-client-link.ts` stays the only HTTP edge owning `RPCLink`, retry/dedupe plugins,
  traced `fetch`, discovery, and trace injection;
- Desktop's application wrapper consumes the resolver but keeps MessagePort framing/serialization
  in its existing adapter files;
- no internal barrel or export-map entry is added.

Anti-patterns explicitly avoided: AP-2, AP-9, AP-14, AP-22, and AP-25. No new or deepened
architecture debt is planned.

## Goal

Make contract-derived transport behavior a single package-owned decision that can be changed for a
future oRPC major without editing contributions, HTTP dedupe, Desktop call sites, or wire-derived
filters. Preserve stable-v1 wire behavior and the existing contribution/retry/trace ownership.

## Public contract — LOCKED

### Procedure metadata

Extend only the contracts-owned metadata shape below; do not restore the superseded seed RFC's
other `policy` fields:

```ts
export interface NetScriptProcedureMeta {
  readonly access?: { /* existing fields unchanged */ };
  readonly policy?: {
    /** Advisory client cache policy consumed by SDK transport resolution. */
    readonly cache?: 'no-store' | 'default' | 'force-cache';
  };
}
```

The stable-v1 metadata adapter normalizes and deep-freezes `policy.cache` when it is one of those
three values. Invalid unknown-boundary values normalize as absent. The same
`SdkClientProcedureDescriptor` instance is used by transport policy and contribution preparation;
there is no second raw `procedure['~orpc'].meta` read in the HTTP link.

### The v2 override point

Add one optional property to `CreateServiceClientOptions` and
`CreateDesktopServiceClientOptions`:

```ts
readonly transportPolicy?: SdkClientTransportPolicy;
```

The upstream-neutral public types are exact and synchronous:

```ts
export type SdkClientHttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT';

export interface SdkClientTransportPolicyMethodOptions {
  readonly procedure: SdkClientProcedureDescriptor;
  readonly input: unknown;
  readonly inferredMethod: SdkClientHttpMethod;
}

export interface SdkClientTransportPolicy {
  readonly method?: (
    options: Readonly<SdkClientTransportPolicyMethodOptions>,
  ) => SdkClientHttpMethod;
}
```

Why this shape:

- future POST-only adaptation is configuration:
  `transportPolicy: { method: () => 'POST' }`;
- `fallbackMethod`, `maxUrlLength`, dedupe, retry, plugins, tracing, fetch, and link construction
  remain frozen SDK internals rather than new extension axes;
- procedure path and `NetScriptProcedureMeta.policy.cache` are available through `procedure`, but
  contributions never receive `inferredMethod` or the returned method;
- a synchronous resolver matches stable-v1's method/dedupe lifecycle and cannot introduce an async
  race between URL encoding and dedupe selection;
- exact runtime validation rejects unknown policy object fields, a non-function `method`, invalid
  returned methods, and then freezes the validated option.

The override object is validated and the owned resolver is created **before**
`validateSdkClientContributions`/contribution composition. On every logical call, its method
decision is resolved before `PreparedOutboundHeadersPort.prepare`. This is both construction-order
and per-call enforcement, not just documentation.

## Owned policy function — LOCKED

### Exact home and signature

Create `packages/sdk/src/internal/transport-policy.ts` with this exported-internal function (the
`export` is for direct relative tests and internal consumers; it is absent from every package
barrel/export map):

```ts
export function resolveTransportPolicy<TContract extends ContractLike>(
  contract: TContract,
  options: Readonly<{
    readonly transportPolicy?: SdkClientTransportPolicy;
  }> = {},
): ResolvedTransportPolicy;
```

Its exact internal result is:

```ts
interface ResolvedTransportPolicy {
  readonly resolveCall: (
    path: readonly string[],
    input: unknown,
    context: Readonly<ServiceClientContext>,
  ) => ResolvedCallTransportPolicy;
  readonly method: (
    call: ResolvedCallTransportPolicy,
  ) => SdkClientHttpMethod;
  readonly fallbackMethod: 'POST';
  readonly maxUrlLength: 2083;
  readonly dedupePredicate: (
    call: ResolvedCallTransportPolicy,
  ) => boolean;
  readonly cacheGroups: readonly [
    ResolvedTransportCacheGroup<'force-cache'>,
    ResolvedTransportCacheGroup<'default'>,
  ];
}

interface ResolvedCallTransportPolicy {
  readonly procedure: SdkClientProcedureDescriptor;
  readonly method: SdkClientHttpMethod;
  readonly cache: 'no-store' | 'default' | 'force-cache';
}

interface ResolvedTransportCacheGroup<TCache extends 'force-cache' | 'default'> {
  readonly cache: TCache;
  readonly condition: (call: ResolvedCallTransportPolicy) => boolean;
  readonly context: TCache extends 'force-cache'
    ? Readonly<{ cache: 'force-cache' }>
    : Readonly<Record<never, never>>;
}
```

Resolution law:

1. resolve the procedure node from `contract + path` and reject a non-procedure;
2. create one normalized `SdkClientProcedureDescriptor` through the existing
   `ProcedureMetadataPort`;
3. infer the stable-v1 route method from the contract (including existing HEAD→GET behavior);
4. invoke the optional validated method override with `{ procedure, input, inferredMethod }`;
5. select cache input as explicit per-call `context.cache` when it is one of the three metadata
   modes, otherwise `procedure.meta.policy?.cache ?? 'default'`;
6. freeze the per-call result;
7. derive dedupe solely as `call.method === 'GET'` and select the `force-cache`/default group from
   `call.cache`.

`dedupePredicate` never receives or reads `request.method`. `policy.cache` is therefore an input to
the same resolved call decision rather than an independent condition embedded in a plugin.
Existing non-policy `RequestCache` values retain today's default group behavior; this slice does
not silently redefine their wire semantics.

### Consumption flow

```text
createServiceClient(options)
  ├─ resolveTransportPolicy(contract, { transportPolicy })   [before contributions]
  └─ createStableV1ClientLink(..., policy)
       └─ start logical call epoch
            ├─ policy.resolveCall(path, input, transport context)
            ├─ prepare contributions with procedure/path/meta only
            └─ HTTP RPCLink
                 ├─ method(policy.method(call))
                 ├─ fallbackMethod / maxUrlLength
                 ├─ dedupe(policy.dedupePredicate(call), policy.cacheGroups)
                 ├─ existing retry path
                 └─ existing traced fetch path

createDesktopServiceClient(options)
  ├─ resolveTransportPolicy(contract, { transportPolicy })   [before contribution rejection]
  └─ policy-aware wrapper around the existing raw MessagePort link
       ├─ policy.resolveCall(path, input, context)
       └─ dispatch the unchanged MessagePort frame (no HTTP method serialized)
```

The stable-v1 logical-call record privately retains `ResolvedCallTransportPolicy`, and the
attempt-only context carries it under a private symbol so the HTTP codec/plugin projections use one
decision across retries. Iterator reconnect creates a new logical epoch and a fresh decision,
matching the existing preparation lifecycle. The raw method is never copied into
`SdkClientPrepareOptions`, `SdkClientProcedureDescriptor`, `SdkClientTransportDescriptor`, or a
contribution-owned context projection.

### HTTP consumer

`createHttpClientLink` receives a fully resolved `ResolvedTransportPolicy`; it does not accept a
raw override and contains no method/cache policy literals. It wires:

- `method` from `policy.method`;
- `fallbackMethod` from `policy.fallbackMethod`;
- `maxUrlLength` from `policy.maxUrlLength`;
- `DedupeRequestsPlugin.filter` from `policy.dedupePredicate` over the private prepared decision;
- `groups` from `policy.cacheGroups`.

It remains the sole owner of `RPCLink`, `ClientRetryPlugin`, `DedupeRequestsPlugin`, headers, traced
`fetch`, discovery, signal forwarding, and trace injection. No plugin/default is made public and no
parallel “contributed” transport path is introduced.

### Desktop consumer

The low-level exported `createDesktopRpcLink()` remains a contract-free MessagePort framing factory.
`createDesktopServiceClient()` wraps that raw link with an internal policy-aware `ClientLinkPort`
that calls the same `resolveCall` before forwarding. This is meaningful consumption: invalid
contract paths/override results fail at the common boundary, and a future policy object is accepted
consistently. It deliberately does **not** convert the resolved HTTP method into MessagePort data,
does not enable HTTP contributions, and does not relocate `DESKTOP_RPC_JSON_SERIALIZERS` into the
HTTP policy.

## Forward-compatibility enforcement — LOCKED

The method-secrecy rule is enforced at five layers:

1. **Public type:** `SdkClientPrepareOptions` remains exactly `context`, `signal`, `procedure`,
   `transport`, and `input`; neither it nor `SdkClientProcedureDescriptor` gains method fields.
2. **Construction:** `transportPolicy` is a sibling client option, never a contribution descriptor
   field. `CONTRIBUTION_FIELDS` remains closed and exact validation rejects injected policy fields.
3. **Runtime projection:** contribution preparation continues to construct a new frozen snapshot
   from the five allowed properties; it never spreads a logical/prepared call.
4. **Private storage:** the resolved decision lives only on internal logical/prepared-call data and
   a private symbol. It is absent from projected contribution context.
5. **Executable boundary:** type fixtures assert `'method'` is not a key, runtime callbacks assert
   exact own keys and absence of method/fallback/max/dedupe/retry/trace/fetch/link/plugin fields,
   and `deno doc`/packed-import tests prove internal policy identities are unavailable.

A POST-only simulation runs through `transportPolicy: { method: () => 'POST' }` and verifies the
contribution still observes only its permitted snapshot. No v2 package, handler plugin, or server
method setting is imported.

## `port` and `timeout` disposition — LOCKED

- Keep both fields source- and declaration-compatible.
- Keep/add explicit `@deprecated` guidance: `port` migrates to discovery configuration;
  `timeout` migrates to per-call `AbortSignal`.
- Do not assign new behavior, throw warnings, or remove them in 0.0.7.
- Add a regression that constructs clients with both options and proves discovery URL, dispatch,
  and cancellation behavior equal an otherwise identical client that omits them.
- Add a short SDK README “Transport policy” section naming the central contract-derived decision,
  the `transportPolicy` override, contribution method secrecy, and the two no-op migrations.

## Dependency move — separate PR and decision

### Decision

Use **two PRs**, not one:

1. `chore/orpc-v1-15-family-lock` — partial work referencing #1351 without a closing keyword;
   changes only root `deno.lock`.
2. `refactor/sdk-transport-policy` — rebased after PR 1 merges; implements the public/internal
   policy, metadata, tests, and docs; this PR may carry `Closes #1351` only after all issue
   acceptance evidence exists.

This split is mandatory in spirit and in risk control: the amendment calls the move a separate
lock-only decision, while the policy PR changes public types plus call-path behavior. Separate heads
make dependency regressions distinguishable from policy regressions and avoid one large blast
radius. No PR is opened in this PLAN slice.

### Exact lock-only operation and proof

After re-running the stable authority, the dependency PR uses Deno 2.9's native lock-only command:

```text
deno task deps:latest --filter '@orpc/*'
deno update --lockfile-only --recursive '@orpc/*'
```

Review must show **only `deno.lock` changed**. Root `deno.json`, every `packages/*/deno.json`,
`packages/telemetry/package.json`, and source stay byte-identical. Compatible `^1.14.6`/`^1.14.7`
requirements remain; no exact manifest pin appears.

Required proof on the dependency PR:

- `deno ci --frozen` succeeds without rewriting the lock;
- raw `deno why @orpc/shared` contains exactly one resolved heading,
  `@orpc/shared@1.15.0`, and no 1.14.x heading;
- a family lock census shows every resolved `@orpc/*` v1 package on 1.15.0 and no v2/prerelease;
- structured root check/test and `deno task publish:dry-run` pass;
- the full one-pass scaffold runtime E2E passes because the family is workspace-wide;
- a final raw git diff confirms `deno.lock` is the sole changed file.

Retain `@orpc/otel@1.15.0`. `@orpc/opentelemetry@1.15.0` does not exist, and a rename would violate
the lock-only boundary. The rename is deferred to the separate v2 migration.

## Contract-first implementation slices

The implementation sequence below belongs to the later policy PR, after the dependency PR and a
separate PLAN-EVAL `PASS`. Each slice is independently reviewable and must update the harness
worklog/context pack when executed.

| # | Slice and proof | Planned files | Slice gate |
| - | --------------- | ------------- | ---------- |
| 1 | **Contract:** add `policy.cache`, public override types/options, exact validation, and the private resolver with direct GET/POST/metadata/POST-only tests. Proves the contract before wiring. | `packages/contracts/src/domain/procedure-meta.ts`; contracts metadata tests/README; `packages/sdk/src/ports/service-client.ts`; existing root/client/ports/desktop barrels as needed (no manifests); new `packages/sdk/src/internal/transport-policy.ts`; new `packages/sdk/tests/transport-policy_test.ts` | scoped contracts+SDK check/lint/fmt; focused metadata and policy tests; `deno doc` zero-oRPC/private-surface assertions |
| 2 | **HTTP adapter:** resolve once per logical epoch; feed method/fallback/max URL/dedupe/cache groups into the existing link; remove `request.method` derivation. Proves identical default wire output, GET/POST behavior, header-safe dedupe, one preparation across unary retry, and fresh reconnect epochs. | `packages/sdk/src/internal/client-contributions/adapter-ports.ts`; `prepared-call.ts`; `stable-v1-adapter.ts`; `packages/sdk/src/client/service-client.ts`; `http-client-link.ts`; `packages/sdk/tests/integration/client-contribution-adapter_test.ts`; focused policy/dedupe tests | structured focused SDK tests including overlapping same/different-header GETs; source boundary check finds no `request.method` policy and one HTTP stack |
| 3 | **Desktop and secrecy:** consume the same resolver in the typed Desktop client while preserving raw MessagePort framing and contribution rejection. Prove POST-only simulation does not serialize a method and contributions/public declarations cannot observe internal policy. | `packages/sdk/src/desktop/application/desktop-rpc-client.ts`; `packages/sdk/src/desktop/domain/types.ts`; Desktop tests; `client-contribution-validation_test.ts`; `client-contribution-private-surface_test.ts`; type fixture(s) | structured Desktop/validation/private-surface tests; packed negative import probe; declaration scan |
| 4 | **Compatibility docs and merge gates:** document transport policy plus `port`/`timeout` no-op migration; add compatibility regression; run package, architecture, JSR, publish, and full scaffold gates. | `packages/sdk/README.md`; focused SDK compatibility test; run artifacts only | all validation in the next section, including full scaffold runtime E2E |

No slice touches `.llm/tools/agentic/**`, `.github/workflows/**`, any `packages/*/deno.json`, or
unrelated sibling scope.

## Test matrix

| Behavior | Required assertion |
| -------- | ------------------ |
| Contract GET | default method resolves GET; dedupe predicate true; force-cache group selected only from the resolved decision. |
| Contract POST | default method resolves POST; dedupe predicate false even if a synthetic wire request claims GET. |
| HEAD compatibility | stable-v1 inference continues mapping HEAD to GET. |
| Metadata input | `.meta({ policy: { cache: 'force-cache' } })` reaches `ResolvedCallTransportPolicy.cache` through the metadata port; no link-local raw metadata access. `no-store`/`default` normalize without a second mechanism. |
| Per-call cache | explicit supported `context.cache` takes precedence over metadata; other existing RequestCache modes retain the current default-group behavior. |
| POST-only future simulation | `transportPolicy: { method: () => 'POST' }` disables GET dedupe without importing/adopting v2. |
| Current wire | omitted policy/contributions and explicit empty contributions remain byte-identical to the existing URL/method/header/body baseline. |
| Header-safe dedupe | concurrent same-path/input/method GETs with the same prepared headers coalesce; distinct auth/locale headers dispatch separately. The test overlaps pending fetches so coalescing is observable. |
| Unary retry | one contribution preparation and one resolved policy decision per logical invocation; byte-equivalent prepared headers across transport attempts. |
| Iterator reconnect | retries within one opening epoch reuse policy/preparation; iterator-phase reconnect gets a fresh policy decision and preparation; abort starts neither. |
| Trace/fetch ownership | existing client span count/attributes and final trace injection remain one per transport attempt through the sole traced fetch. |
| Contribution secrecy | compile-time keys and runtime own keys omit method, fallback, max URL, dedupe, retry internals, tracing, fetch, link, and plugins. |
| Desktop | policy resolver executes and validates before raw MessagePort dispatch; frames/serializer behavior are unchanged; no HTTP method appears; contributions are still rejected. |
| `port`/`timeout` | options remain accepted and deprecated; supplied versus omitted clients behave identically; timeout does not synthesize a timer/signal. |

## Validation plan

Implementation evidence must come from the structured wrappers where the harness requires them.
Commands are ordered from focused to broad; exact include paths may be narrowed by the implementer
without replacing the named behavior.

| Order | Gate | Command / check | Expected result |
| ----- | ---- | --------------- | --------------- |
| 1 | Targeted check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/contracts --ext ts,tsx` and the same for `packages/sdk` | PASS; `--unstable-kv` is supplied by the wrapper where needed |
| 2 | Focused runtime/type tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <owned metadata/policy/contribution/desktop tests>` | all named matrix cases pass |
| 3 | Scoped lint/fmt | `run-deno-lint.ts` and `run-deno-fmt.ts` for `packages/contracts` and `packages/sdk`, `--ext ts,tsx` | PASS; no repo-wide Markdown/generated churn |
| 4 | Public declaration boundary | `deno doc --json` for SDK root/client/ports/desktop and contracts metadata; focused `deno doc --lint` on changed entrypoints | new policy/meta symbols documented, upstream-neutral; internal resolver/types absent |
| 5 | Full doc baseline comparison | `deno task doc:lint --root packages/sdk --pretty` and contracts equivalent | no new diagnostic or count increase; `./client` and changed metadata symbols remain clean. Existing unrelated private-type-ref baseline is reported honestly, not attributed to this slice. |
| 6 | JSR audit | `audit-jsr-package.ts --root packages/sdk --text` and contracts equivalent | dry-run OK; no new slow type, export leak, file-list, or cardinality finding |
| 7 | Package quality | `deno task quality:gate` (`quality:scan` + `arch:check`) | PASS/no new suppression or cast |
| 8 | Root static/runtime | structured root `deno task check`, `deno task test`, `deno task lint`, `deno task fmt:check` as configured | PASS |
| 9 | Publish surface | `deno task publish:dry-run` | PASS with only already-sanctioned carve-outs; no internal policy file importable as a subpath |
| 10 | Dependency graph currency | `deno ci --frozen`; raw `deno why @orpc/shared` | frozen PASS; exactly one `@orpc/shared@1.15.0` after the prerequisite PR |
| 11 | Full consumer smoke | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | exit 0 in one pass; do not split into individual gates |

The expensive scaffold gate runs only at merge readiness, not during intermediate loops.

## JSR-audit planned-surface assessment

- Both affected packages already have valid names, descriptions, README files, curated exports, and
  publish filters.
- Every new exported type/function-bearing field receives explicit annotations and JSDoc to avoid
  slow types under isolated declarations.
- No new export subpath is created, so no `deno.json` change or semver-visible subpath appears.
- Public policy declarations use only Web/NetScript types, never `@orpc/*`, `ClientOptions`, link
  plugins, interceptors, or metadata accessors.
- The internal resolver is direct-relative-imported and covered by negative packed-import/doc
  tests.
- Baseline full doc-lint debt and SDK cardinality warnings are not hidden. The slice must be
  diagnostic-neutral outside its changed symbols; widening to repair unrelated query/builder
  declarations would be a rescope.

## Open-decision sweep

| Decision | Status | Resolution / reason |
| -------- | ------ | ------------------- |
| Policy module/API signature | resolved now | Exact signature and types locked above. |
| Contract vs wire derivation | resolved now | Contract route + normalized NetScript metadata only; `request.method` forbidden. |
| Metadata precedence | resolved now | explicit supported per-call cache → procedure metadata → default; optional method override receives the normalized procedure. |
| Contribution visibility | resolved now | structural/type/runtime/private-surface enforcement; no method field. |
| Desktop behavior | resolved now | common resolver + unchanged MessagePort framing; no HTTP method serialization. |
| v2 override point | resolved now | single upstream-neutral synchronous `transportPolicy?` object; no direct dedupe/plugin override. |
| Dependency target/tool | resolved now | stable v1.15.0 from `deps:latest`; lock-only native Deno update. |
| One vs two PRs | resolved now | two PRs, dependency first. |
| v1 telemetry rename | resolved now | retain `@orpc/otel`; v2 rename deferred. |
| Server method policy | safe to defer | explicitly owned by a future v2/server migration, outside #1351. |
| Generic `deps:why` wrapper stderr defect | safe to defer | raw command is the issue's acceptance source; tooling repair is unrelated. |

No “must resolve now” item remains.

## Risk register

| Risk | Mitigation |
| ---- | ---------- |
| Method and dedupe disagree after override | Dedupe calls the final resolved call decision, never route inference or wire method independently; POST-only simulation proves it. |
| Contribution learns the method through a spread/context symbol | Construct exact snapshots rather than spreading; projection/type/own-key/doc/packed tests. |
| Policy callback runs after contribution preparation | Construction and logical-epoch ordering are explicit and tested with observations. |
| Retry/reconnect resolves policy at the wrong lifetime | Store one decision on the logical epoch; reuse across attempts; create fresh on iterator reconnect; extend existing conformance tests. |
| Different headers coalesce | Direct overlapping GET test proves upstream dedupe identity still includes prepared headers. |
| Desktop pretends to be HTTP | Wrapper validates policy but never writes the method into MessagePort frames; framing golden stays unchanged. |
| Metadata creates a second cache path | One metadata descriptor feeds policy and contribution preparation; no raw link metadata read. |
| Public option leaks upstream v1 types / slow types | NetScript-owned explicit types, zero-oRPC declaration scan, doc lint, JSR audit, publish dry run. |
| Dependency regression obscures code regression | Separate lock-only PR first, frozen install and no-mixed-version proof, then rebase policy work. |
| OTel rename accidentally widens scope | Locked decision retains `@orpc/otel`; no manifest/source changes in dependency PR. |
| Active sibling conflicts | No edits to `.llm/tools/agentic/**`, workflows, or `packages/*/deno.json`; explicit final changed-file audit. |
| Baseline doc-lint failures become false claims | Record exact baseline; require no new diagnostics plus clean changed symbols; do not claim full green without real output. |

## Deferred / forbidden scope

- oRPC v2, its wire protocol, handler `allowMethods`, `MethodOverrideHandlerPlugin`, typed errors,
  middleware changes, serializer changes, or `@orpc/opentelemetry` rename.
- Server-side method/CSRF policy.
- #1349 client-construction seam changes or a wider contribution envelope.
- Public `BatchLinkPlugin`, `RetryAfterPlugin`, `SimpleCsrfProtectionLinkPlugin`, fetch, raw link,
  retry/dedupe/trace defaults, or direct dedupe callbacks.
- #1320 Zod graph work and #451 in-process/custom link adapters.
- New semantics for `port` or `timeout`; they remain deprecated no-ops.
- Any package manifest, agentic runtime tooling, workflow, or sibling-leaf work.
- Repair of unrelated pre-existing SDK/contracts doc-lint/cardinality debt.

## Drift watch

Record significant drift before implementation if any of these change after PLAN-EVAL:

- stable-channel authority no longer reports the seven existing packages at v1.15.0;
- the dependency prerequisite lands with manifest/source changes or mixed `@orpc/shared` copies;
- `main` changes contribution snapshot fields, logical epoch/reconnect behavior, Desktop framing, or
  procedure metadata;
- implementation needs a second HTTP link/fetch/retry/dedupe/trace path;
- any planned file overlaps the named sibling leaves;
- a public fallback/maxURL/dedupe/plugin override becomes necessary rather than the locked narrow
  method override.

Any such item requires plan revision and, if material, a fresh PLAN-EVAL; it is not permission to
improvise during implementation.

## Generator's PLAN-EVAL readiness assessment

**READY_FOR_PLAN_EVAL — not a PLAN-EVAL verdict.** This plan has current research, an exact owned
function signature and module home, a contract-first type shape, resolved metadata/override/
Desktop/contribution rules, two-PR dependency sequencing, ordered commit slices, a risk register,
explicit deferred scope, a JSR surface assessment, and named gates. The known baseline doc-lint
failures and the `deps:why` wrapper stderr limitation are disclosed rather than presented as green.

The generator has not run or written `plan-eval.md`, has not evaluated its own plan, and has not
started implementation. A supervisor-dispatched, separate-session PLAN-EVAL must now apply
`.llm/harness/gates/plan-gate.md` and either return `PASS` or specific `FAIL_PLAN` findings.
