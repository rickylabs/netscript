# Research — feat-service-principal-procedure-policy--1387

## Re-baseline

- Carried-in source: issue #1387 and its two follow-up comments; the cited line numbers were treated
  as anchors, not authority.
- Re-derived against `origin/main` @ `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` on 2026-08-30.
- Dependency branch inspected: `origin/feat/sdk-procedure-meta` @
  `32a698e18594aa31154a5b7c88886875b3e1140f` (PR #1731 for #1466).
- What changed vs the issue seed:
  - The four cited service anchors still describe the defect, though the surrounding builder and
    auth surfaces have grown.
  - #1466 now has an implemented and IMPL-EVAL-passed branch, but it has **not merged** to `main`.
    Main still has no `NetScriptProcedureMeta` symbol and no oRPC procedure metadata.
  - #1466's branch fixes the metadata vocabulary: `NetScriptProcedureMeta.access.authentication`
    already exists and is propagated through contract, SDK client, and query-factory types.
  - The repo now has 54 concrete first-party procedure definitions that carry no declared access
    metadata, plus scaffold generators that emit additional undeclared procedures.

## Doctrine and layering

| Package              | Archetype          | Doctrine verdict                                                              | Ownership and layering consequence                                                                                                                                                                      |
| -------------------- | ------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts` | 1 — Small Contract | Keep: contract primitives remain free of runtime ownership                    | Owns the pure, serializable `NetScriptProcedureMeta` vocabulary. It must not import service, Hono, authorizers, or runtime adapters.                                                                    |
| `packages/service`   | 4 — DSL / Builder  | Refactor: finish builder separation while preserving bootstrap/runtime wiring | Owns `Principal`, handler-context composition, authentication/authorization ports, the contract-authorizer adapter, middleware binding, and OpenAPI projection. It may depend on public contracts APIs. |
| `packages/plugin`    | 4 — DSL / Builder  | Keep: preserve manifest, discovery, validation, and host contracts            | Re-exports service-owned identity/context types from public `@netscript/service` entrypoints. It does not define a second principal and does not import `packages/service/src/**`.                      |

The dependency direction stays `contracts -> service adapter -> plugin composition`: contracts is a
domain vocabulary; service consumes it at the adapter/presentation edge; plugin already composes the
published service surface. The contract-authorizer belongs in `packages/service/src/auth/`, beside
the existing authentication and scope-authorizer adapters. It is not a contracts package concern and
is not a plugin adapter.

Existing doctrine debt is not scope for this leaf:

- `packages/service` has an open Refactor verdict around builder separation and preset/asset role
  clarity. The plan confines builder edits to typed state and auth wiring and must not expand the
  monolith.
- `packages/plugin` has an accepted F-1 file-size debt in the builder area and pre-existing JSR
  module-tag failures. Re-export/type-parameter edits must not deepen either finding.
- `packages/contracts` has an accepted `./crud` root-subpath exception. Policy metadata remains in
  the canonical domain/public surface and creates no new root-level subsystem.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                | How to verify                                                                                                                                                |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | `ContextFactory` still returns `Record<string, unknown>`, erasing the custom context result.                                                                                                                                                                           | `deno doc --filter ContextFactory packages/service/mod.ts`; `packages/service/src/types.ts:269`                                                              |
| 2  | `buildRpcContext` mutates the returned bag to add database, trace headers, and a resolved principal.                                                                                                                                                                   | `packages/service/src/builder/service-builder-impl.ts:256-282`                                                                                               |
| 3  | `Principal` is already a public service auth type with `subject`, scopes, roles, scheme, and claims; service must remain its owner.                                                                                                                                    | `deno doc --filter Principal packages/service/src/auth/mod.ts`; `packages/service/src/auth/types.ts`                                                         |
| 4  | `@netscript/plugin` has no principal export. Its `./service` subpath currently re-exports `ContextFactory` from the public service package.                                                                                                                            | `deno doc packages/plugin/mod.ts`; `deno doc packages/plugin/src/service/mod.ts`                                                                             |
| 5  | Authorization sees only `{ principal, method, path }`; `createScopeAuthorizer` selects its first matching path rule and otherwise returns `authz.no-matching-rule` when fail-closed.                                                                                   | `packages/service/src/auth/types.ts`; `packages/service/src/auth/scope-authorizer.ts`                                                                        |
| 6  | Authn runs before authz and rejects a missing credential on guarded prefixes. A contract policy adapter used only as `AuthorizerPort` therefore cannot make `authentication: 'none'` public. The same policy resolver must inform both middleware stages.              | `packages/service/src/auth/auth-middleware.ts`; `packages/service/src/builder/service-builder-impl.ts`                                                       |
| 7  | Main has no `NetScriptProcedureMeta`. On #1466, the exact Stage 1b shape is `access?: { authentication?: 'none'                                                                                                                                                        | 'optional'                                                                                                                                                   |
| 8  | #1466 propagates the exact `~orpc.meta` type into direct SDK clients, generated `defineServices` clients, and query factories (`__netscriptProcedureMeta`). Extending that one type is sufficient for SDK type propagation; #1387 must not add an SDK credential seam. | `git diff origin/main...origin/feat/sdk-procedure-meta -- packages/contracts packages/sdk`                                                                   |
| 9  | PR #1731 is open and unmerged even though its separate IMPL-EVAL is PASS. #1387 implementation cannot start on main until it lands.                                                                                                                                    | GitHub PR #1731 and `git merge-base origin/main origin/feat/sdk-procedure-meta`                                                                              |
| 10 | oRPC procedure and router definitions retain initial context and procedure metadata in their public type/runtime definitions. Public traversal APIs can enumerate contract procedures without reading upstream internals.                                              | `deno doc --filter Procedure jsr:@orpc/server`; `deno doc --filter Router jsr:@orpc/server`; `deno doc --filter traverseContractProcedures jsr:@orpc/server` |
| 11 | `createOpenAPISpec` currently delegates directly to `OpenAPIGenerator.generate` and supplies only info/servers. It does not map procedure metadata to `security`.                                                                                                      | `packages/service/src/primitives/openapi.ts`                                                                                                                 |
| 12 | MCP's operation index retains the raw OpenAPI operation, so a generated `security` field survives parsing. However, `list_service_operations` omits access data and `get_operation_schema` emits a generic unauthenticated curl/caveat.                                | `packages/mcp/src/domain/openapi/operation-index.ts`; the two flows under `packages/mcp/src/application/flows/`                                              |
| 13 | The agent-facing surface is the MCP tool output. Projecting access into those two bounded results reaches agents without a separate `packages/ai` change.                                                                                                              | `packages/mcp/src/domain/tool-contracts.ts`; `packages/mcp/src/application/runner/mcp-server.ts`                                                             |
| 14 | The current auth tutorial still duplicates the route in a path matcher and teaches prefix policy as the source of truth.                                                                                                                                               | `docs/site/tutorials/workspace/05-route-authz.md`                                                                                                            |
| 15 | A contract-local policy moves with its procedure when a router key is renamed. Requiring the rename itself to break policy at compile time would require a second key/path-indexed policy map and recreate the defect.                                                 | Type mechanics of `.meta()` on the procedure; compare #1387 acceptance with the #1466 contract-local shape                                                   |

## Locked metadata vocabulary

The only policy declaration is an additive extension to #1466's type:

```ts
export interface NetScriptProcedureMeta {
  readonly access?: {
    readonly authentication?: NetScriptAuthenticationRequirement;
    readonly authorization?: {
      readonly scopes?: readonly string[];
      readonly roles?: readonly string[];
    };
  };
}
```

Public procedures use `access.authentication: 'none'`; protected procedures use `'required'` and
optionally declare scopes/roles. There is no parallel `{ public: true }` vocabulary and no policy
map keyed by a router or URL string. `optional` remains part of #1466's metadata vocabulary, but the
first runtime adapter must reject it fail-closed at binding time: the current `AuthenticatorPort`
cannot distinguish absent credentials from invalid credentials, so silently treating an authn
failure as anonymous would be unsafe. OpenAPI may still represent the declared optional contract;
runtime support requires a later, explicitly typed authentication-result extension.

The nested `authorization` object is intentionally open to additive readonly fields. #884 can later
add canonical resource/action, assurance, organization context, or a reference to its decision input
without replacing `Principal` or moving tenant data into this leaf. #1387 adds no organization,
membership, connection, tenant, delegation, or assurance fields.

## ContextFactory census and typed composition

The proposed type shape is:

```ts
export type ContextFactory<TCustom extends object = Record<never, never>> = (
  context: Context,
) => TCustom;

export type ServiceHandlerContext<TCustom extends object = Record<never, never>> =
  & Readonly<TCustom>
  & {
    readonly db?: DbContext;
    readonly traceHeaders?: Readonly<Record<string, string>>;
    readonly principal?: Principal;
  };
```

`ServiceBuilder` gains a context generic and `withContext<TNext>()` returns the builder specialized
to `TNext`. Runtime composition creates a fresh object rather than mutating the custom factory's
possibly-readonly return. `principal` remains optional because the builder is configured at runtime;
an unguarded handler sees `Principal | undefined` and must narrow. Linking every router's oRPC
`$context<T>()` declaration to every fluent builder state is explicitly outside #1387/#1278, so the
plan does not claim per-procedure auth typestate.

There are two direct `withContext` call expressions:

1. `packages/service/tests/type-assignability_test.ts` uses an explicitly annotated `ContextFactory`
   returning `{ tenant: 'alpha' }`. It must specialize the generic to retain that field; its current
   unspecialized annotation would still compile but intentionally erases it.
2. `packages/plugin/src/service/presentation/create-plugin-service.ts` forwards
   `PluginServiceConfig.context`. The config/factory must become generic so callers infer their
   custom fields.

The plugin forwarding seam has seven live consumer configurations that must compile unchanged:

| Consumer                                                                          | Custom context                                        |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `plugins/workers/services/src/main.ts`                                            | `workers` runtime                                     |
| `plugins/workers/services/src/trigger-path-id_test.ts`                            | stub `workers` runtime                                |
| `plugins/sagas/services/src/main.ts`                                              | `db`, saga runtime, KV projection flag                |
| `plugins/sagas/tests/services/publish-http-boundary_test.ts` (two configurations) | existing context object; literal database/saga fields |
| `plugins/auth/services/src/main.ts`                                               | registry and telemetry                                |
| `plugins/triggers/services/src/main.ts`                                           | inferred result of `resolveContext`                   |

No caller needs a behavior change for generic inference. A broader router-context mismatch already
exists in workers: its declared request context requires `db` while its factory supplies only
`workers`. Enforcing whole-router context equality would surface that unrelated #1278 debt, so this
leaf must not add that equality gate. If any of these consumer files needs an edit merely to satisfy
the generic, that is a product-ceiling breach and a rescope, not an incidental cleanup.

## Fail-closed migration census

The current concrete first-party contract inventory is undeclared:

| Surface                 | Procedures with no access metadata |
| ----------------------- | ---------------------------------: |
| CRUD contract generator |                                  5 |
| Base plugin `describe`  |                                  1 |
| Workers core            |                                 21 |
| Auth core               |                                  5 |
| Triggers core           |                                 10 |
| Sagas core              |                                  7 |
| AI core                 |                                  5 |
| **Total**               |                             **54** |

Scaffolds also emit undeclared health/CRUD/memory/plugin routes in the CLI service templates,
generated plugin contract template, `new-plugin-use-case.ts`, and `contract-source.ts`. Globally
turning metadata enforcement on would deny all 54 first-party procedures and every new scaffolded
route.

The migration answer is therefore **explicit opt-in**. Existing services using only
`createScopeAuthorizer`, existing unguarded services, and generated projects keep their current
behavior. Fail-closed metadata semantics activate only when an application supplies the object from
`createContractAuthorizer(contract, { fallback? })` to `.withAuthz()`. Within that adapter:

1. A matching declared contract policy is authoritative.
2. If metadata is absent, a match-aware fallback (including `createScopeAuthorizer`) may decide.
3. If neither metadata nor a fallback rule matches, deny regardless of the fallback's standalone
   `denyByDefault` option.
4. On disagreement, contract metadata wins: `authentication: 'none'` stays public; declared required
   scopes/roles cannot be weakened by a path rule.
5. The adapter exposes one resolver used by both authn and authz middleware, so public policy does
   not need a duplicate `allowAnonymous` path.

`createScopeAuthorizer` remains the legacy path-prefix adapter. It gains match-aware composition
information but remains usable on its own through the existing `AuthorizerPort` API.

## Generated surfaces

- OpenAPI: `authentication: 'none'` maps to operation `security: []`; `required` maps to a default
  bearer security scheme and a per-operation requirement. Scopes are placed in the requirement;
  roles, which OpenAPI security schemes cannot express portably, are retained in a documented
  `x-netscript-roles` extension. Optional authentication maps to `[{}, { bearerAuth: [] }]` even
  though runtime binding initially rejects optional; that makes the contract declaration visible
  without pretending runtime support exists.
- SDK: no new SDK implementation. #1466 already carries the exact metadata type to direct/generated
  clients and query factories. #1387 extends its type fixture to prove scopes/roles arrive
  unchanged. Credential injection remains #1352.
- MCP/agents: derive a bounded access summary from the already-retained OpenAPI operation and return
  it from both `list_service_operations` and `get_operation_schema`. The curl guidance must say when
  credentials are required; it must not solicit or echo credentials.

## Negative-test feasibility

| Acceptance point                                              | Feasible result                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unguarded handler principal                                   | Feasible: type is `Principal                                                                                                                                                                                                                                                                                                        |
| Missing metadata and no fallback rule                         | Feasible: match-aware adapter returns an explicit deny reason.                                                                                                                                                                                                                                                                      |
| Principal lacks declared scope                                | Feasible: REST and RPC tests both return 403.                                                                                                                                                                                                                                                                                       |
| Router rename breaks contract-declared policy at compile time | **Not achievable with the required contract-local design, and not desirable.** The corrected proof is that metadata follows the renamed procedure in both projections; the old SDK property name fails type-check because ordinary contract typing changed. PLAN-EVAL must explicitly accept this correction before implementation. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: export maps and dry-run surfaces for `packages/contracts`, `packages/service`,
  `packages/plugin`, `packages/sdk`, and `packages/mcp` using
  `.llm/tools/fitness/audit-jsr-package.ts`.
- Base green: contracts, service, SDK, and MCP audits (only sanctioned/informational slow-type and
  cardinality warnings).
- Base red and excluded: plugin audit fails because four existing export modules lack `@module`
  tags; those files are outside this plan and the finding is not caused by #1387.
- Slow-type risk: contracts and service are already sanctioned for oRPC-bound slow types. The new
  metadata must remain readonly data and must not introduce inferred anonymous types in public
  signatures.

## Base gate census

All commands ran on the clean baseline before artifacts were added.

| Candidate                                                             | Base result                                                       | Contract decision                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Scoped check over contracts/service/plugin/SDK/MCP (417 TS/TSX files) | PASS, 0 diagnostics                                               | Contract                                               |
| Scoped lint over the same roots                                       | PASS, 0 findings                                                  | Contract                                               |
| Scoped source format check over the same roots                        | PASS, 0 findings                                                  | Contract                                               |
| Package tests: contracts 8, service 90, plugin 68, SDK 69, MCP 136    | PASS, 371 total                                                   | Contract per affected slice                            |
| `deno task quality:gate`                                              | PASS (`quality:scan` and `arch:check`)                            | Contract at behavior/final slices                      |
| `deno task docs:exports-drift`                                        | PASS                                                              | Contract for every public-surface/docs slice and final |
| Service `deno doc --lint` wrapper                                     | PASS                                                              | Contract for service public-surface slices             |
| Contracts/plugin/SDK/MCP `deno doc --lint` wrappers                   | FAIL at base: 9/15/3/2 private-type-reference entrypoint findings | Exclude; cannot signal regression                      |
| JSR audit contracts/service/SDK/MCP                                   | PASS                                                              | Contract when that package surface changes             |
| JSR audit plugin                                                      | FAIL at base: four missing `@module` tags                         | Exclude; preserve but do not fix                       |
| Root `deno task test`                                                 | NOT RUN by owner direction; known host infrastructure red         | Exclude                                                |
| E2E/Aspire/Docker/browser                                             | NOT RUN; no runtime lease                                         | Forbidden for this slice and not a per-slice contract  |

## Open questions for PLAN-EVAL

1. Will PLAN-EVAL explicitly accept replacing the impossible “router rename breaks policy at compile
   time” checkbox with the two honest proofs described above? A `PASS` must say so; silence is not
   authorization to promise the impossible test.
2. Does PLAN-EVAL accept fail-closed rejection of `authentication: 'optional'` in the first runtime
   adapter as the only semantics compatible with the current authenticator result type? If not, the
   evaluator must identify a typed absent-vs-invalid credential contract and rescope it before
   implementation.
