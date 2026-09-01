# Research — refactor-sdk-transport-policy--1351

## Re-baseline

- Carried-in sources:
  - issue [#1351](https://github.com/rickylabs/netscript/issues/1351), including its
    **2026-08-13 normative amendment**;
  - accepted RFC 0001 at `rfcs/0001-sdk-client-contributions.md`, especially Stage 3;
  - the earlier seed-run RFC-A draft at
    `.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`
    §§3.6 and 3.11, which explains the origin of the transport-policy requirement.
- Re-derived against `main` and the slice branch at
  `82a2527e27aa91baabf35e4b001ed8b6266308e6` on 2026-09-01. `HEAD`, `main`, and their merge base
  were identical when research began.
- The requested RFC path `docs/architecture/rfcs/` does not exist at this baseline. The accepted
  RFC is under the repository-root `rfcs/` directory. This is a path correction, not an authority
  change.
- The amendment wins over contradictory issue text. In particular, the old pinned `1.14.15` row
  is stale; stable v1.15.0 is the only dependency target, any move is a separate whole-family
  lock-only decision, exact manifest pins do not land, and no oRPC v2 work belongs here.
- Facts explicitly supplied by the owner were treated as premises rather than discovery tasks:
  #1349's contribution seam is on main, the family manifests remain `^1.14.6`/`^1.14.7`, and the
  former lock conflict was removed by #1695.

## Authority and scope reconciliation

The accepted RFC's current Stage 3 row is normative for implementation shape:

> Decide separately whether to move the lock-pinned whole oRPC v1 family to stable v1.15.0, keep
> one fetch/retry/dedupe/trace path, prove unary/reconnect semantics and header-safe dedupe, and
> deprecate current no-op options. Selecting/renaming v1 OTel belongs here; no v2 migration.

The older seed RFC-A §3.11 remains useful provenance, but its broad contribution-envelope proposal
was superseded by accepted RFC 0001. Its durable forward-compatibility rule is still reflected in
the accepted RFC and the amended issue: contributions receive procedure path, input, projected
context, transport descriptor, and NetScript metadata, but never the resolved HTTP method.

The accepted RFC's `NetScriptProcedureMeta` example and the current source expose only `access`.
The older RFC-A §3.6 specified `policy.cache?: 'no-store' | 'default' | 'force-cache'`, and the
amended issue explicitly requires that value to be an input to the central transport policy. The
smallest reconciliation is to add only `policy.cache`; the obsolete draft's `policy.public`,
`policy.scopes`, and `policy.rateLimit` fields must not be resurrected because accepted RFC 0001
now owns access control under `access`.

## Doctrine and harness profile

- Selected archetype: **Archetype 2 — Integration**. The current doctrine assignment table names
  `packages/sdk` as Archetype 2, and this slice wraps oRPC's stable-v1 transport behind a
  package-owned internal policy. The older RFC's “Public DSL/builder” description predates the
  doctrine's measured 2026-08-12 assignment.
- Scope overlays: none. The later implementation includes consumer documentation, but it is a
  framework integration change rather than a docs-only run.
- Current doctrine verdict: **Keep — preserve discovery/client/cache adapter boundaries**
  (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`).
- Relevant axioms: A1 public types first; A6 a helper is justified when it owns NetScript policy;
  A8 one reason per file; A10 one composition root; A11 name the transport-policy extension axis;
  A14 tests and publish gates preserve the boundary.
- Relevant anti-pattern risks: AP-2 (a policy module must do more than rename oRPC), AP-9
  (no second cache mechanism), AP-14 (no upstream identity in the public override types), AP-22
  (no internal barrel), and AP-25 (the policy module remains pure; `fetch` stays at the HTTP edge).
- No open architecture-debt entry specifically owns SDK HTTP method/cache policy. The doctrine
  registry has unrelated SDK mentions but no #1351 transport debt to update or close.

## Findings

| # | Finding | Evidence / verification |
| - | ------- | ----------------------- |
| 1 | The HTTP policy is still three inline decisions. | `packages/sdk/src/client/http-client-link.ts:115` assigns `inferRPCMethodFromContractRouter(contract)`; line 144 tests `request.method === 'GET'`; lines 145+ define cache groups. |
| 2 | Fetch, retry, dedupe, and client tracing already share one HTTP link construction path. | `http-client-link.ts:138`, `:143`, `:162`, and `:164`. The plan must extract decisions without introducing another `RPCLink`, retry plugin, dedupe plugin, traced fetch, or dispatch path. |
| 3 | The stable-v1 contribution adapter already owns logical-call epochs. | `stable-v1-adapter.ts:210-270`: `startEpoch` prepares once, unary attempts reuse the prepared call, and iterator reconnect starts another epoch. This is the correct location to resolve one per-call policy decision before contribution preparation. |
| 4 | Contributions already receive an exact, narrow runtime snapshot. | `SdkClientPrepareOptions` has only `context`, `signal`, `procedure`, `transport`, and `input` (`ports/sdk-client-contribution.ts:42-54`); `prepared-call.ts:22-29` exact-validates descriptor fields and constructs the snapshot at `:460-466`. The method can be kept out structurally, not just by convention. |
| 5 | The metadata adapter currently discards all metadata except a valid authentication value. | `stable-v1-adapter.ts:74-99`. Adding `policy.cache` requires a deliberate normalization/freeze path; reading `procedure['~orpc'].meta` independently inside the dedupe filter would create the forbidden second mechanism. |
| 6 | Current public metadata has no cache policy. | `packages/contracts/src/domain/procedure-meta.ts:28-42` exposes `access` only. The accepted type is upstream-neutral and already has declaration-independence tests. |
| 7 | `port` and `timeout` are already source-deprecated but remain accepted and ignored. | `ports/service-client.ts:276-290`. `createServiceClient` does not destructure or consume either field. The missing work is explicit consumer documentation plus regression proof that the fields remain accepted no-ops. |
| 8 | Desktop is a MessagePort transport, not a second HTTP stack. | `desktop/application/desktop-rpc-client.ts:15-23` constructs the MessagePort `RPCLink` with `DESKTOP_RPC_JSON_SERIALIZERS`; lines 27-34 reject any `contributions` property. Desktop therefore must consume the common procedure-policy resolver without mapping its HTTP method onto MessagePort frames or opening contributions. |
| 9 | The current HTTP dedupe implementation is header-safe upstream. | oRPC v1.14.6's installed `DedupeRequestsPlugin` compares canonical JSON containing body, **headers**, method, and URL before coalescing. NetScript still needs a direct overlapping-request test so this remains proven after policy extraction. |
| 10 | oRPC's v1 method helper is contract-derived. | `deno doc --filter inferRPCMethodFromContractRouter npm:@orpc/contract@1.14.6` reports a `(options, path) => Exclude<HTTPMethod, 'HEAD'>` resolver. Installed source resolves the contract node's route method and maps `HEAD` to `GET`. |
| 11 | The upstream link supports exactly the projections the issue asks NetScript to own. | `deno doc --filter StandardRPCLinkCodecOptions npm:@orpc/client@1.14.6/standard`: `method`, `fallbackMethod` (default POST), and `maxUrlLength` (default 2083). `DedupeRequestsPluginOptions` provides a predicate plus cache-group descriptors. |
| 12 | The public override can stay upstream-neutral. | `CreateServiceClientOptions` and Desktop client options already use NetScript-owned structural types. A synchronous `transportPolicy?` object can expose a method resolver over `SdkClientProcedureDescriptor` without exporting oRPC callbacks/plugins. |
| 13 | No package manifest needs to change for policy work. | SDK exports already route through `mod.ts`, `./client`, `./ports`, and `./desktop`. The internal resolver can be direct-relative-imported and excluded from every export map. This respects the active sibling manifest leaf. |

## Dependency decision evidence

The required stable-channel authority was run exactly from the repository root:

```text
$ deno task deps:latest --filter '@orpc/*'
Task deps:latest deno run --allow-read --allow-net .llm/tools/deps/latest.ts --pretty --behind-only '--filter' '@orpc/*'
deps:latest — 7 behind / 7 total

  ✗ npm:@orpc/client  ^1.14.6  →  1.15.0
  ✗ npm:@orpc/contract  ^1.14.6  →  1.15.0
  ✗ npm:@orpc/openapi  ^1.14.6  →  1.15.0
  ✗ npm:@orpc/otel  ^1.14.7  →  1.15.0
  ✗ npm:@orpc/server  ^1.14.6  →  1.15.0
  ✗ npm:@orpc/tanstack-query  ^1.14.6  →  1.15.0
  ✗ npm:@orpc/zod  ^1.14.6  →  1.15.0
```

This establishes stable **v1.15.0** for the seven existing family members. `deno outdated
--latest` was not used and must not be used for the decision.

Baseline graph evidence:

```text
$ deno why @orpc/shared
@orpc/shared@1.14.6
  npm:@orpc/client@^1.14.6 > @orpc/shared@1.14.6
  npm:@orpc/contract@^1.14.6 > @orpc/shared@1.14.6
  ...

@orpc/shared@1.14.7
  (no dependency path found -- try running `deno install` to refresh the lockfile)
```

The raw command exposes two resolved lock entries today. The repository wrapper
`deno task deps:why @orpc/shared` currently reports a false “not present” because `deno why` emits
its tree on stderr while `.llm/tools/deps/why.ts` only records stdout. For this acceptance gate,
the amended issue explicitly names raw `deno why @orpc/shared`; its post-move output must contain
exactly one heading, `@orpc/shared@1.15.0`. Repairing the generic wrapper is outside #1351.

The v1 telemetry rename is resolved **against** this lock-only decision: retain `@orpc/otel` and
move it to 1.15.0 with the family. `npm:@orpc/opentelemetry@1.15.0` does not exist, and adopting
that name would require manifest/source changes rather than the normative lock-only family move.
The rename remains for the separate coordinated v2 migration; it does not land in either #1351 PR.

## JSR / publish-surface scan

Current scan commands were non-mutating:

- `deno task doc:lint --root packages/sdk --pretty` — baseline has 3 unique private-type-ref
  diagnostics in unrelated query/client/streams surfaces; `./client` itself is clean.
- `deno task doc:lint --root packages/contracts --pretty` — baseline has 9 private-type-ref
  diagnostics in existing contract builders; no missing JSDoc.
- `audit-jsr-package.ts --root packages/sdk --text` — dry-run OK; existing warnings are SDK `src/`
  cardinality (14 children) and one slow-type banner.
- `audit-jsr-package.ts --root packages/contracts --text` — dry-run OK; its oRPC-bound slow-type
  carve-out is already sanctioned.

Planned public-surface risks:

1. `transportPolicy?` adds a public function-bearing option to SDK client and Desktop declarations.
   All involved types need explicit exported annotations, JSDoc, and zero oRPC identity.
2. `NetScriptProcedureMeta.policy.cache` changes the contracts declaration consumed by SDK and
   downstream contract builders. It must preserve exact metadata/error-map inference and remain
   upstream-neutral.
3. The internal `resolveTransportPolicy` function and its resolved types must remain absent from
   `deno doc` for root/client/ports/desktop and from packed consumer subpaths.
4. Full doc-lint cannot honestly be claimed green at baseline. The implementation gate is: changed
   entrypoints/symbols have zero diagnostics and the full scans introduce no new diagnostic or
   count increase. This slice does not absorb unrelated query/contract-builder debt.
5. No `packages/*/deno.json` edit is needed or allowed. Existing exports are sufficient.

## Test seams already available

- `packages/sdk/tests/integration/client-contribution-adapter_test.ts` already proves preparation
  once per unary retry, fresh preparation on iterator reconnect, no reconnect after abort, and
  byte-identical requests for omitted versus empty contributions.
- `packages/sdk/tests/client-contribution-private-surface_test.ts` already audits private adapter
  names out of `deno doc` and rejects private packed imports.
- `packages/sdk/tests/client-contribution-validation_test.ts` already exercises exact descriptor
  fields and Desktop contribution rejection.
- `packages/sdk/tests/procedure-meta-independence_test.ts` and
  `packages/contracts/tests/procedure-meta-inference_test.ts` already protect upstream-neutral
  metadata and exact builder inference.

These should be extended or complemented, not replaced with a new parallel conformance harness.

## Resolved questions

| Question | Resolution |
| -------- | ---------- |
| One PR or two? | **Two.** First a whole-family `deno.lock`-only v1.15.0 PR; then the contracts/SDK policy PR. The amendment calls the dependency move separate, and combining a workspace-wide family graph change with a public transport option and runtime refactor would make failures hard to attribute. |
| Dependency order? | Lock-only family PR first, then rebase the policy branch on that merged head. The policy tests then run on the supported v1.15.0 adapter rather than proving code against a graph immediately replaced underneath it. |
| OTel package name? | Keep `@orpc/otel` for stable v1.15.0. Do not rename in #1351. |
| Internal module home? | `packages/sdk/src/internal/transport-policy.ts`, direct-relative imported, no internal barrel and no package export. |
| Where is the public override type? | NetScript-owned types in `packages/sdk/src/ports/service-client.ts`, re-exported through the existing root/client/ports/desktop surfaces that already expose the containing options. No oRPC types. |
| How does metadata participate? | One normalized `SdkClientProcedureDescriptor` is created by the stable-v1 metadata port; `policy.cache` is part of the resolver input and the same descriptor is passed to contributions. No link reads raw metadata independently. |
| How is contribution isolation enforced? | Compile-time omission from `SdkClientPrepareOptions`, exact runtime snapshot construction, descriptor exact-field validation, private prepared-call storage, public-surface/packed-import tests, and a runtime own-key assertion. |
| How does Desktop consume policy? | `createDesktopServiceClient` resolves the same policy before checking/handling contributions and wraps the raw MessagePort link so each call is described/validated by that resolver. The selected HTTP method is never added to MessagePort frames and contributions remain rejected. |

No question that would force implementation rework remains open. Detailed precedence, types,
commit slices, gates, and deferred scope are locked in `plan.md`.
