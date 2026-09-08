# Binding repair plan: generated contract authorizer must see the mounted geometry

Same planner session (Fable 5.1), issue #1383 / draft PR #2003, implementation state `6b400f643` (S4) +
probe commit `72dbf3cf2`. Planning only: no product edit, commit, GitHub write, dispatch, AppHost or
release. Complex tier authorized by the milestone coordinator for a native security-boundary correction.
The future evaluator must be independent of both the Anthropic planner and the OpenAI coordinator.

## Handoff summary

- **Defect (confirmed from source):** the generated connector builds
  `createContractAuthorizer(<core>ContractDefinition)` from the **flat** core contract, whose procedures carry
  route paths like `/guarded-fixture` and router paths like `listGuardedFixtures`. The connector actually
  serves the router assembled by `assemblePluginContractRouter`, which mounts the implementation under
  `os.prefix('/v1/<ns>')` inside `{ v1: { <ns>: … } }`. So the live REST path is
  `/api/v1/<ns>/guarded-fixture` and the live RPC path is `/api/rpc/v1/<ns>/listGuardedFixtures`, while the
  authorizer compiled `/api/guarded-fixture` and `/api/rpc/listGuardedFixtures`. Every guarded request is
  therefore "no contract procedure" → deny → 403 for a valid read session (`s5-runtime-finding.json`).
- **Smallest native, typed correction:** give the plugin contract layer a contract-side counterpart of the
  router assembly — `mountPluginContract(contract, { version, namespace })` in `@netscript/plugin/contract-base`
  — implemented with upstream `oc.prefix('/<version>/<namespace>').router(contract)` wrapped as
  `{ [version]: { [namespace]: … } }`. The generated connector passes that mounted contract to the unchanged
  `createContractAuthorizer`. One assembly config type is shared by the router assembler and the contract
  mount, so the geometry has one authority and no path table, cast, fallback or extra middleware is added.
  Compatibility RPC path `/api/rpc/v1/<procedure>` keeps working through the binder's existing
  `deprecatedRpcRoutes` remap.
- **Proof:** the existing S5 probe (unchanged assertions: REST 200 and native typed SDK RPC 200 with the same
  read session, 403 write-only session on both, 401 anonymous/invalid/revoked, 503 verifier down, health 200)
  plus a unit test on `mountPluginContract`, a service-side authorizer test with a mounted contract, and the
  generated-workspace check. `scaffold.plugins` carries the executable gate; `scaffold.runtime` remains the
  merge-readiness run.
- **Re-evaluation:** yes, bounded. This changes the composite plan's D2/amendment binding claim ("the service
  builder binds that authorizer to its actual REST and RPC paths"), adds one public export to
  `@netscript/plugin/contract-base`, and touches the generated template. An independent evaluator (not
  Anthropic, not OpenAI) should review this amendment against `plan-eval-2.md` before S5 is re-run; a full
  plan re-evaluation is not needed.
- **Deferrals preserved:** first-party guarded adoption, #1384, #1382, core `access` metadata, and any
  release/tag/publication stay open and owner-gated.

## 1. Source facts

| # | Fact | Source |
| - | ---- | ------ |
| B1 | `assemblePluginContractRouter(router, { version, namespace, handlers })` returns `{ [version]: os.router({ [namespace]: os.prefix('/'+version+'/'+namespace).router(implemented) }) }` and registers a compatibility RPC router that also spreads the flat procedures under `[version]`. Its config type is `PluginContractAssemblyConfig { version; namespace; handlers }`. | [observed - `packages/plugin/src/service/presentation/plugin-contract-binder.ts` `assemblePluginContractRouter`, `PluginContractAssemblyConfig`] |
| B2 | The generated connector assembles with `{ version: 'v1', namespace: '<name>' }` and its main passes the **flat** `<camel>ContractDefinition` to `createContractAuthorizer`. | [observed - `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts` `connectorServiceHandlersSource` lines 25-28, `connectorServiceMainSource` lines 3-12] |
| B3 | `createContractAuthorizer` compiles procedures by traversing the given contract object: REST pattern = `joinPath(binding.apiPath, procedure.route.path)`, RPC key = the object key path; unmatched → `deny('authz.no-contract-procedure')`, matched-without-metadata → fallback or `deny('authz.no-matching-rule')`. Binding supplies only `apiPath`, `rpcPath`, `rpcAliases`, `deprecatedRpcRoutes` (remapped before RPC lookup). | [observed - `packages/service/src/auth/contract-authorizer.ts:73-108,110-125,167-200,204-215`; `packages/service/src/auth/contract-policy.ts:61-70`] |
| B4 | The factory binds with `rpcPath: '/api/rpc'`, `deprecatedRpcRoutes: [{ pathPrefix: '/api/rpc/v1/', replacementPrefix: '/api/rpc/v1/<routerName ?? name>/' }]`; the builder passes those into `authorizer.bind(...)`. So RPC lookups already resolve to `v1/<ns>/<procedure>` keys — the authorizer's compiled keys were the mismatch, not the binding. | [observed - `packages/plugin/src/service/presentation/create-plugin-service.ts` `withRPC({ deprecatedRpcRoutes… })`; `packages/service/src/builder/service-builder-impl.ts` `bindContractPolicy`] |
| B5 | Upstream contract API: `ContractBuilder.prefix(prefix): ContractRouterBuilder` ("prefixes all procedures in the contract router; post-appended to any existing router prefix") and `.router(router: T): EnhancedContractRouter<T, TErrorMap>`; `EnhancedContractRouter` is a mapped type preserving each procedure's schemas and meta; `ContractRouter<TMeta>` is `ContractProcedure | { [k]: ContractRouter }` — **no lazy variant on the contract side**. | [observed - `deno doc npm:@orpc/contract@^1.15.0 --filter ContractBuilder` lines 67-83, `--filter EnhancedContractRouter`, `--filter ContractRouter`] |
| B6 | `ContractPolicyContract` = a procedure carrying `'~orpc'.meta.access?` or a record of such; a prefixed `EnhancedContractRouter` of the generated definition is structurally assignable exactly as the flat definition is today. | [observed - `packages/service/src/auth/contract-policy.ts:6-14`; S4 emitted main compiles with the flat definition] |
| B7 | The server-side helpers the brief names are router-oriented: `getHiddenRouterContract(router: Lazyable<AnyRouter \| AnyContractRouter>): AnyContractRouter \| undefined`, `traverseContractProcedures(options, cb, lazyOptions?)`, `unlazyRouter(router): Promise<…>`, `resolveContractProcedures(...): Promise<void>`. The only in-repo precedent (`createOpenAPISpec`) traverses the **implemented** router at request-wiring time, where lazy nodes are acceptable. `createContractAuthorizer` compiles synchronously at construction from a typed contract, and passing the assembled `AnyRouter` fails `TS2345` (lazy routers are not `ContractPolicyContract`), as the reverted experiment showed. | [observed - `deno doc npm:@orpc/server@^1.15.0 --filter …`; `packages/service/src/primitives/openapi.ts:22,94-108`; `s5-runtime-finding.json` `directAssembledRouterExperiment`] |
| B8 | `@netscript/plugin/contract-base` already owns the contract-level plugin seam (`BASE_PLUGIN_CONTRACT_ROUTES`, `BasePluginContract`, base errors, capabilities) and is imported by `@netscript/plugin-auth-core` and by the generated core contract; it has no server import. | [observed - `packages/plugin/src/contract-base/mod.ts:25-42`; `new-plugin-use-case.ts:408-415`] |
| B9 | First-party assembler consumers: auth, sagas, workers, triggers routers, all `{ version: 'v1', namespace: <ns> }`. None uses an authorizer yet (public postures, S3). | [observed - `plugins/{auth,sagas,workers,triggers}/services/src/router.ts`] |
| B10 | The S5 probe already asserts the required behaviour set, including that the native SDK hits `POST /api/rpc/v1/guarded-fixture/listGuardedFixtures`; it type-checks the 22 generated files; only the read 200 fails. | [observed - `packages/cli/e2e/src/application/gates/scaffold/guarded-plugin-probe-source.ts`; `s5-runtime-finding.json`] |
| B11 | Existing authorizer tests cover REST/RPC/alias/renamed-key dispatch and fallback semantics with hand-built contracts; none uses a version/namespace-mounted contract. | [observed - `packages/service/tests/auth/contract-authorizer_test.ts:27-128`] |

## 2. Alternatives inspected

| Option | Verdict | Why |
| ------ | ------- | --- |
| A. Contract-side mount via `oc.prefix().router()` exported by `@netscript/plugin/contract-base` (**chosen**) | smallest, typed, native | Reuses the upstream contract prefix (B5), keeps `createContractAuthorizer` and the builder untouched, produces a `ContractPolicyContract`-assignable value (B6), shares the assembly coordinates type with the router assembler (B1), no lazy handling, no cast. |
| B. Derive the contract from the assembled router with `getHiddenRouterContract`/`traverseContractProcedures` inside `createContractAuthorizer` | rejected for this fix | Requires widening the authorizer input to `AnyRouter` and either async construction (`unlazyRouter`) or silently skipping lazy branches; that is a service public-API and semantics change larger than the defect, and would let a connector pass a router whose lazy parts are never policy-compiled (B7). |
| C. Extend `ContractPolicyBindingOptions` with a route prefix / router path supplied by the factory from `apiVersion`/`routerName` | rejected | Second expression of mount geometry (factory config vs. assembler config) — exactly the "duplicate policy/path table" the brief forbids; diverges whenever a connector assembles with a namespace different from `routerName`. |
| D. Widen `ContractPolicyContract`/`traverseContract` to accept lazy routers and compile them lazily | rejected | Parallel binding semantics inside the authorizer; unmatched-until-resolved procedures would deny nondeterministically; larger surface than the defect. |
| E. Make the generated core contract itself version/namespace-prefixed | rejected | Would change the SDK client paths (`createServiceClient` builds `/api/rpc/v1/<routerName>` itself) and OpenAPI generation for every consumer of the core contract; also breaks the base-contract convention (`/describe`). |

## 3. Exact mutation paths

### 3.1 `packages/plugin` (contract-base, additive; Archetype 5 factory/seam authority)

| Path | Change |
| ---- | ------ |
| `packages/plugin/src/contract-base/domain/contract-mount.ts` (new) | `export interface PluginContractMount { readonly version: string; readonly namespace: string }` and `export function mountPluginContract<TContract extends AnyContractRouter>(contract: TContract, mount: PluginContractMount): { readonly [version: string]: { readonly [namespace: string]: EnhancedContractRouter<TContract, Record<never, never>> } }` implemented as `{ [mount.version]: { [mount.namespace]: oc.prefix(\`/${mount.version}/${mount.namespace}\`).router(contract) } }`. Validation: non-empty `version`/`namespace` without `/` (throw `TypeError`); no other logic. Types come from `@orpc/contract` (already a dependency of `packages/plugin`, B8/B5). |
| `packages/plugin/src/contract-base/mod.ts` | Export `mountPluginContract`, `PluginContractMount`. |
| `packages/plugin/src/service/presentation/plugin-contract-binder.ts` | `PluginContractAssemblyConfig` becomes `PluginContractMount & { handlers }` (type-level refactor, no runtime or call-site change) so the router assembler and the contract mount share one coordinates type. Existing signatures and behaviour unchanged (B1, B9). |
| `packages/plugin/src/contract-base/domain/contract-mount_test.ts` (new) | Mount test: prefixed REST paths, nested keys, per-procedure meta preserved, `TypeError` on empty/slashed segments. |
| `packages/plugin/tests/service/create-plugin-service-auth_test.ts` | Add one case: a mounted contract authorizer on an assembled router → REST and RPC 200 with the required scope, 403 without, compatibility `/api/rpc/v1/<procedure>` remapped and authorized. |
| `docs/site/reference/plugin/index.md`, `packages/plugin/README.md`, `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | Document: "an authorizer must see the mounted contract; mount with the same `{ version, namespace }` you assemble with". |

### 3.2 `packages/service` (test only)

| Path | Change |
| ---- | ------ |
| `packages/service/tests/auth/contract-authorizer_test.ts` | Add a case binding an authorizer built from a `{ v1: { ns: prefixed } }` contract against `/api` + `/api/rpc` with a deprecated-route alias, asserting REST `/api/v1/ns/<path>` and RPC `/api/rpc/v1/ns/<key>` resolve and `/api/rpc/v1/<key>` remaps (B3/B4). No source change in `packages/service`. |

### 3.3 Generator

| Path | Change |
| ---- | ------ |
| `new-plugin-use-case.ts` `connectorServiceMainSource` | Import `mountPluginContract` from `@netscript/plugin/contract-base` (already a generated dependency via `@netscript/plugin`, B8); emit `authz: { authorizer: createContractAuthorizer(mountPluginContract(<camel>ContractDefinition, <CONST>)) }`. |
| `new-plugin-use-case.ts` `connectorServiceHandlersSource` | Emit one exported constant `<CAMEL>_CONTRACT_MOUNT: PluginContractMount = { version: 'v1', namespace: '<name>' }` in `handlers.ts` and use it in `.assemble({ ...<CAMEL>_CONTRACT_MOUNT, handlers })`; main imports the same constant. One literal, two consumers. |
| `new-plugin_test.ts` | Emitted main uses `mountPluginContract(..., <CAMEL>_CONTRACT_MOUNT)`; emitted handlers export the mount constant (precondition assertions; behaviour proof stays in S5). |
| Generated carriers | `gen:mcp-export-corpus` / `check:mcp-export-corpus` (new export on `@netscript/plugin/contract-base`), `docs:exports-drift`, `docs:jsdoc-examples`, prose/assets chain if docs pages change. |

### 3.4 Not changed

`createContractAuthorizer`, `ContractPolicyBindingOptions`, the builder, the factory policy code, `assemblePluginContractRouter` runtime, first-party routers/mains, the S5 probe assertions.

## 4. Compatibility and security

- **Additive public surface:** one function and one type on `@netscript/plugin/contract-base`; a type-level
  refactor of `PluginContractAssemblyConfig` with identical members. No behaviour change for any existing
  caller (B9). Publish dry-run and `doc:lint` on `packages/plugin` are required gates.
- **Security:** policy still comes only from procedure-local contract metadata; unmatched paths and unmarked
  procedures stay denied (B3). The mounted contract cannot add or drop procedures relative to the served
  router unless the connector assembles with different coordinates — which is why both take the same
  constant. Deprecated flat RPC paths are authorized through the existing remap only when they map onto a
  mounted procedure (B4).
- **Risk:** a connector that assembles under one namespace and mounts the policy under another silently
  denies everything (fail-closed). Mitigation: the shared constant in generated code, the documented rule,
  and the executable S5 gate. A future hardening (out of scope) could have `assemble` return the mounted
  contract alongside the router.
- **Not solved here:** first-party plugins remain `public`; their cores still lack `access` metadata, so this
  mount helper does not by itself enable their guarded adoption.

## 5. Executable tests and proof commands

1. `contract-mount_test.ts`: mounted paths/keys/meta; validation errors.
2. `contract-authorizer_test.ts` (new case): mounted contract resolves REST, RPC and remapped deprecated RPC.
3. `create-plugin-service-auth_test.ts` (new case): assembled router + mounted-contract authorizer → 200/403
   on REST and RPC in one app, same session.
4. `new-plugin_test.ts`: emitted mount constant and authorizer wiring.
5. **S5 probe unchanged**: regenerate with the public CLI, `generate plugins`, scoped check of the 22 files,
   then the native session lifecycle: REST 200 and typed-SDK RPC 200 with the `guarded-fixture:read` session
   (asserting the RPC request path/method), 403 for the write-only session on both, 401 anonymous/invalid/
   revoked, 503 with the auth service stopped, `/health` 200. Receipt replaces `s5-runtime-finding.json`
   with a PASS record only if every assertion holds.

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --root packages/service --root packages/cli/src/public/features/plugins/new --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/plugin packages/service/tests/auth packages/cli/src/public/features/plugins/new
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts && deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts
deno task quality:gate && deno task check:netscript-jsr-specifiers
deno task doc:lint --root packages/plugin --pretty && (cd packages/plugin && deno publish --dry-run --allow-dirty)
deno task gen:mcp-export-corpus && deno task check:mcp-export-corpus && deno task docs:exports-drift && deno task docs:jsdoc-examples
deno task e2e:cli run scaffold.plugins --cleanup --format pretty      # carries the S5 generated guarded-plugin probe
deno task e2e:cli run scaffold.runtime --cleanup --format pretty      # merge readiness, unchanged requirement
```

## 6. Evaluation and sequencing

- Amend the composite plan (this file) → independent bounded re-evaluation of the amendment by an evaluator
  outside the Anthropic and OpenAI families → implement as slice S5a (contract mount + tests) and S5b
  (generator + probe rerun) → continue S6 carriers, full runtime, IMPL-EVAL.
- No owner decision is required: the correction is a technical binding fix inside already-accepted scope
  (#1383 target 5 guarded generation; amendment's contract-authorizer choice). Release, tag and publication
  remain owner-reserved and unauthorized.
