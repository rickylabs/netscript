# Plan: #1387 typed principal and contract-declared procedure policy

## Run Metadata

| Field          | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387`                                                   |
| Branch         | `feat/service-principal-procedure-policy`                                                         |
| Phase          | `plan`                                                                                            |
| Target         | `packages/contracts`, `packages/service`, `packages/plugin`, SDK type proof, MCP projection, docs |
| Archetype      | contracts: 1 — Small Contract; service/plugin: 4 — DSL / Builder                                  |
| Scope overlays | `SCOPE-service` plus package doctrine                                                             |

## Archetype

`packages/contracts` is an Archetype 1 Small Contract: it owns a compact, runtime-free metadata
vocabulary. `packages/service` and `packages/plugin` are Archetype 4 DSL/Builder packages: the
public builder must remain fluent while implementation details stay behind package boundaries. The
mixed wave is intentional but strictly layered: contracts defines data, service interprets it,
plugin only re-exports/composes the public service types.

## Current Doctrine Verdict

- Contracts — **Keep:** keep contract primitives free of runtime ownership.
- Plugin — **Keep:** preserve manifest, discovery, validation, and host contracts.
- Service — **Refactor:** finish builder separation while preserving bootstrap/runtime wiring. This
  leaf may touch existing builder state but must not broaden the outstanding builder refactor.

## Axioms in Play

| Axiom                                         | Why it matters                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A1 — Public types are designed first          | Metadata, context generics, and policy resolver ports land before behavior.                                        |
| A2 — Simple over easy at published boundaries | One metadata vocabulary is safer than convenient parallel flags and path tables.                                   |
| A3 — 80% case is one chained call             | `.withAuthn(...).withAuthz({ authorizer: createContractAuthorizer(...) })` remains the adoption path.              |
| A5 — Composition over inheritance             | Contract policy composes with the scope adapter through ports; no base-class lattice.                              |
| A8 — One concern per folder/file              | Pure metadata stays in contracts; runtime resolution stays in service auth; projection stays at OpenAPI/MCP edges. |
| A11 — Extension axes are named first          | Authentication, authorization requirements, fallback matching, and future #884 context remain distinct axes.       |
| A14 — Tests are fitness functions             | Each bounded slice stops on base-green Tier-A gates; publishability/public-surface checks guard releases.          |

## Goal

Provide an optional, correctly typed `Principal` in service/plugin handler context; extend
`NetScriptProcedureMeta.access` with readonly scope/role authorization requirements; enforce that
metadata through one fail-closed, routing-aware service adapter that can fall back to the legacy
scope authorizer; and expose declared access through OpenAPI, SDK metadata types, MCP, and agent
tooling without changing existing services until they opt in.

## Scope

- Additive readonly policy fields on #1466's `NetScriptProcedureMeta`.
- Generic custom-context composition and a public service handler-context type.
- Public plugin re-exports from public service entrypoints.
- A match-aware contract-authorizer port and adapter used by authn and authz.
- REST and RPC enforcement, fail-closed/403/undefined negative proofs.
- OpenAPI security projection and MCP/agent access summaries.
- SDK type-propagation proof only.
- Reference/tutorial adoption and public-export drift coverage.

## Non-Scope

- #884 organization, membership, connection, tenant, assurance, delegation, or policy-decision
  contracts.
- #934 browser deny-by-default gateway.
- #1352 SDK credential injection or transport behavior.
- #1383 `PluginServiceConfig.auth`.
- #1278 whole-router context equality or per-procedure auth typestate.
- #885 conformance/mocking kit.
- Global migration of the 54 existing procedures or CLI scaffold templates.
- Runtime support for `authentication: 'optional'` until absent and invalid credentials are typed
  distinctly.
- Existing doctrine/JSR debt unrelated to files in the ceiling.

## Hidden Scope

- Authn must consult the same contract policy resolver as authz; an `AuthorizerPort`-only adapter
  cannot make a declared public procedure reachable.
- The scope fallback must report match/no-match independently from allow/deny so a permissive
  standalone fallback cannot defeat contract fail-closed semantics.
- Custom `rpcPath`, `apiPath`, aliases, and REST route templates must be bound by the service
  builder to one compiled procedure matcher; the contract adapter must not hard-code `/api` strings.
- Existing plugin `context` callers are compile consumers even though they are outside the edit
  ceiling.
- OpenAPI roles require a vendor extension; they are not representable as OAuth scopes by fiat.
- MCP tool output schemas and bounded results both need updating; retaining raw OpenAPI alone is not
  agent-visible proof.

## Locked Decisions

| ID    | Decision                                                                                                                                                                               | Rationale                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-1  | Implementation is blocked until #1466/PR #1731 lands on `main`, then this branch must rebase before Slice 1.                                                                           | Main lacks the mandatory metadata vocabulary. Parallel implementation would create the forbidden second vocabulary or conflict with its owner. |
| LD-2  | Extend `NetScriptProcedureMeta.access` with optional readonly `authorization.scopes` and `authorization.roles`.                                                                        | Additive, serializable, SDK-propagated, and forward-compatible; no parallel `{ public }` policy.                                               |
| LD-3  | `@netscript/service` owns `Principal` and `ServiceHandlerContext`; `@netscript/plugin` re-exports those types from `@netscript/service` / `@netscript/service/auth`.                   | Preserves dependency direction and avoids service-internal imports or duplicate identity types.                                                |
| LD-4  | `ContextFactory<TCustom extends object>` returns `TCustom`; `ServiceBuilder` carries the inferred custom type; runtime builds a fresh `ServiceHandlerContext<TCustom>`.                | Preserves custom fields and readonly inputs without claiming full router typestate.                                                            |
| LD-5  | Contract enforcement is opt-in through `createContractAuthorizer`. Existing unguarded and scope-only services are behavior-compatible.                                                 | Global fail-closed would deny 54 first-party procedures and all current scaffolds.                                                             |
| LD-6  | Contract metadata wins on disagreement; scope rules are fallback only when metadata is absent; no metadata plus no matched fallback denies.                                            | Makes the contract authoritative while preserving a migration adapter.                                                                         |
| LD-7  | The adapter supplies a single resolver to both authn and authz, bound to the builder's actual REST/RPC paths and aliases.                                                              | Prevents a declared public procedure from being rejected before authz and avoids duplicated path configuration.                                |
| LD-8  | `authentication: 'optional'` causes a deterministic fail-closed binding error in the first runtime adapter.                                                                            | The current authenticator cannot safely distinguish missing from invalid credentials.                                                          |
| LD-9  | OpenAPI maps none to `security: []`, required to a bearer requirement, scopes to the requirement, roles to `x-netscript-roles`, and optional to the standard anonymous-or-bearer form. | Honest, interoperable representation without inventing tenant semantics.                                                                       |
| LD-10 | SDK receives no behavior change; an updated #1466 fixture proves the extended metadata arrives. MCP list/detail flows receive bounded access summaries and accurate curl guidance.     | Respects #1352 while meeting generated-surface/agent visibility.                                                                               |
| LD-11 | Rename proof is corrected: metadata must follow the renamed procedure; the old SDK key must fail type-check. No key-indexed policy map will be introduced.                             | The issue's original compile-time wording conflicts with its binding contract-local design.                                                    |
| LD-12 | The work remains one leaf with nine small Tier-A-stopped slices. Any ceiling breach or need to change scaffold/plugin-core contracts triggers rescope rather than silent expansion.    | The concerns are separable without mixing type contracts and behavior.                                                                         |

For LD-8, “binding time” means construction of
`createContractAuthorizer(contract, ...)` during contract traversal: an `optional` declaration must
raise a stable namespaced error there, not on the first request or later in `build()`.

For LD-11, the owner/supervisor must amend the issue's compile-time-rename acceptance line to the
accepted rename-continuity plus stale-SDK-key wording before close-gate. The implementation PR body
must state that substitution and its rationale explicitly; the implementer does not edit the issue.

## Open-Decision Sweep

| Decision                                    | Status                                      | Notes                                                                            |
| ------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Metadata owner and shape                    | Resolved                                    | LD-1/LD-2.                                                                       |
| Principal owner and plugin import direction | Resolved                                    | LD-3.                                                                            |
| Context generic and router-link ceiling     | Resolved                                    | LD-4; full equality remains #1278.                                               |
| Migration/default activation                | Resolved                                    | LD-5.                                                                            |
| Contract/scope disagreement order           | Resolved                                    | LD-6.                                                                            |
| Authn/authz composition and custom paths    | Resolved                                    | LD-7.                                                                            |
| Optional authentication runtime behavior    | Must be explicitly affirmed by PLAN-EVAL    | LD-8 is the safe locked choice; a different choice is a rescope.                 |
| OpenAPI roles and MCP/SDK reach             | Resolved                                    | LD-9/LD-10.                                                                      |
| Router-rename acceptance wording            | Must be explicitly adjudicated by PLAN-EVAL | PLAN-EVAL must accept LD-11 or return FAIL with a non-duplicative design.        |
| One leaf versus issue split                 | Resolved                                    | Nine ceilings keep the work bounded; any breach stops and reopens this decision. |

## Product Ceiling and Slice Decomposition

Slice 0 is a precondition, not an implementation slice: verify #1466 is merged, rebase onto the new
`origin/main`, re-run the full base gate census, and stop if its metadata shape differs from the one
researched here.

Every numbered slice below ends with its named Tier-A gates and a commit. A failed gate, changed
dependency shape, or required file outside the listed ceiling means: stop, append `drift.md`, report
the rescope, and do not continue.

Regeneration by the contracted `gen:*` tasks is ceiling-exempt only for their named generated
carrier outputs **in the slice that staled them — or, for the Slice 1 corpus staleness recorded in
PLAN-EVAL cycle 2 (F-2'), in a supervisor-signed `chore(mcp)` regeneration commit landed before Slice
2 starts** — and those outputs must be committed with that slice:
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, every path in
`PUBLISH_ASSET_OUTPUTS`, `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, and the generated
barrels checked by `check:assets-barrel`. This exception does not authorize hand edits or any other
file outside a slice ceiling.

### Slice 1 — Contract metadata type (type contract only)

Extend the one #1466 vocabulary and its type/runtime independence proofs. Do not add enforcement.

Ceiling:

- `packages/contracts/src/domain/procedure-meta.ts`
- `packages/contracts/tests/procedure-meta_test.ts`
- `packages/contracts/tests/procedure-meta-independence_test.ts`
- `packages/contracts/tests/type-fixtures/procedure-meta_type.ts`
- `packages/sdk/tests/procedure-meta-independence_test.ts`
- `packages/sdk/tests/type-fixtures/procedure-meta_type.ts`

Tier-A stop: scoped check/lint/fmt; contracts and SDK package tests; contracts and SDK JSR audits;
`docs:exports-drift`; `mcp-export-corpus`.

### Slice 2 — Typed context public surface (type contract only)

Parameterize the context factory/builder/plugin forwarding signatures and publish the service-owned
handler context plus plugin re-exports. Widen `FetchHandler.handle`'s context and `wireRpc`'s
`buildContext` signature to `object`; edits in implementation files are signature/generic-only.

Ceiling:

- `packages/service/src/types.ts`
- `packages/service/src/builder/service-builder.ts`
- `packages/service/src/builder/service-rpc.ts`
- `packages/service/mod.ts`
- `packages/service/tests/type-assignability_test.ts`
- `packages/plugin/src/service/presentation/create-plugin-service.ts`
- `packages/plugin/src/service/mod.ts`
- `packages/plugin/mod.ts`
- `packages/plugin/tests/service/create-plugin-service_test.ts`

Compile-only, no-edit consumers: the seven plugin configurations listed in `research.md`. Tier-A
stop: scoped check/lint/fmt; service and plugin tests; service `deno doc --lint`; service JSR audit;
`docs:exports-drift`; `mcp-export-corpus`. The base-red plugin JSR/doc gates are not contracted.

### Slice 3 — Typed context runtime composition (behavior only)

Build a fresh composed context, preserve all custom fields, and add optional database, trace, and
principal fields without mutating the factory result.

Ceiling:

- `packages/service/src/builder/service-builder-impl.ts`
- `packages/service/tests/service-builder_test.ts`
- `packages/service/tests/handlers_test.ts`
- `packages/service/tests/auth/builder-auth_test.ts`

Tier-A stop: scoped check/lint/fmt; service tests; `quality:gate`; `mcp-export-corpus`; deno.lock
hash check.

### Slice 4 — Contract-policy service ports (type contract only)

Define the request-policy resolver, match-aware fallback contract, binding inputs for actual
REST/RPC prefixes/aliases, and public factory options. Preserve `AuthorizerPort` compatibility.

Ceiling:

- `packages/service/src/auth/types.ts`
- `packages/service/src/auth/options.ts`
- `packages/service/src/auth/contract-policy.ts` (new)
- `packages/service/src/auth/mod.ts`
- `packages/service/mod.ts`
- `packages/service/tests/type-assignability_test.ts`

Tier-A stop: scoped check/lint/fmt; service tests; service `deno doc --lint`; service JSR audit;
`docs:exports-drift`; `mcp-export-corpus`.

### Slice 5 — Contract-policy adapter and middleware binding (behavior only)

Implement contract traversal/matching, fallback precedence, scope/role decisions, optional-policy
binding rejection, and shared authn/authz resolution. Bind matcher configuration from the builder's
actual RPC/REST options. Add REST/RPC, no-policy, missing-scope, disagreement, and rename-continuity
tests; name the construction-time negative test
`createContractAuthorizer rejects optional authentication during construction`; the old SDK key
failure remains in the Slice 1 type fixture.

Ceiling:

- `packages/service/src/auth/contract-authorizer.ts` (new)
- `packages/service/src/auth/contract-policy.ts`
- `packages/service/src/auth/scope-authorizer.ts`
- `packages/service/src/auth/auth-middleware.ts`
- `packages/service/src/builder/service-builder-impl.ts`
- `packages/service/src/builder/service-rpc.ts`
- `packages/service/tests/auth/authorizer_test.ts`
- `packages/service/tests/auth/middleware_test.ts`
- `packages/service/tests/auth/builder-auth_test.ts`
- `packages/service/tests/auth/contract-authorizer_test.ts` (new)

Tier-A stop: scoped check/lint/fmt; service tests; `quality:gate`; service JSR audit;
`mcp-export-corpus`; deno.lock hash check.

### Slice 6 — OpenAPI access projection (behavior only)

Post-process generated operations from the same procedure metadata, add the bearer component only
when needed, and preserve existing user-supplied OpenAPI fields.

Ceiling:

- `packages/service/src/primitives/openapi.ts`
- `packages/service/tests/handlers_test.ts`
- `packages/service/tests/auth/contract-authorizer_test.ts`

Tier-A stop: scoped check/lint/fmt; service tests; service `deno doc --lint`; service JSR audit;
`quality:gate`; `mcp-export-corpus`.

### Slice 7 — MCP access result contract (type/schema contract only)

Define a bounded access summary and add optional access fields to both tool results/schemas. Do not
populate them yet.

Ceiling:

- `packages/mcp/src/domain/openapi/operation-access.ts` (new)
- `packages/mcp/src/domain/tool-contracts.ts`
- `packages/mcp/src/application/flows/list-service-operations-flow.ts`
- `packages/mcp/src/application/flows/get-operation-schema-flow.ts`
- `packages/mcp/openapi-projection.ts`

Tier-A stop: scoped check/lint/fmt; MCP tests; MCP JSR audit; `docs:exports-drift`;
`mcp-export-corpus`. MCP public doc lint is base-red and excluded.

### Slice 8 — MCP/agent access projection (behavior only)

Derive the summary from OpenAPI security/extensions, populate list/detail results, and make curl
guidance distinguish public, required, optional, and undeclared operations without handling secrets.

Ceiling:

- `packages/mcp/src/domain/openapi/operation-access.ts`
- `packages/mcp/src/domain/openapi/operation-index.ts`
- `packages/mcp/src/application/flows/list-service-operations-flow.ts`
- `packages/mcp/src/application/flows/get-operation-schema-flow.ts`
- `packages/mcp/tests/operation-index_test.ts`
- `packages/mcp/tests/openapi-read-tools_test.ts`
- `packages/mcp/tests/fixtures/openapi/no-db-generated-openapi.json`

Tier-A stop: scoped check/lint/fmt; MCP tests; MCP JSR audit; `quality:gate`; `mcp-export-corpus`;
deno.lock hash check.

### Slice 9 — Adoption documentation (docs only)

Document the single metadata vocabulary, optional principal narrowing, migration opt-in, precedence,
unsupported optional runtime semantics, and generated outputs. Replace the tutorial's duplicated
path matcher with procedure metadata plus the fallback migration explanation.

Ceiling:

- `packages/contracts/README.md`
- `packages/service/README.md`
- `packages/plugin/README.md`
- `packages/mcp/README.md`
- `docs/site/reference/contracts/index.md`
- `docs/site/reference/service/index.md`
- `docs/site/reference/mcp/index.md`
- `docs/site/tutorials/workspace/05-route-authz.md`

Tier-A stop: docs doctests reachable through affected package suites; scoped check/lint/fmt;
`docs:exports-drift`; contracts/service/SDK/MCP JSR audits; service `deno doc --lint`;
`quality:gate`; `mcp-export-corpus`; `docs-tagline`; `publish-assets`; `agent-docs-prose`;
`assets-barrel`.

No product file outside those nine ceilings is authorized. In particular, no plugin-core contract,
CLI scaffold/template, `packages/ai`, auth provider, or lockfile edit is allowed.

## Contract-First Order

1. Slice 1 defines schema metadata.
2. Slice 2 defines context types; Slice 3 implements composition and its behavior proofs.
3. Slice 4 defines policy ports; Slice 5 implements enforcement and negative tests.
4. Slice 6 implements OpenAPI behavior from the established metadata.
5. Slice 7 defines MCP output contracts; Slice 8 implements and tests projection.
6. Slice 9 documents the finished consumer path.

This order deliberately never combines a public/type contract change with its behavior change in one
slice.

## Risk Register

| Risk                                               | Mitigation                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| #1466 changes or remains unmerged                  | Hard precondition and re-baseline stop before Slice 1.                                                 |
| Authn rejects declared-public routes before authz  | One resolver is bound into both stages; public REST/RPC tests.                                         |
| Custom prefixes/aliases silently escape matching   | Builder supplies actual projection configuration; tests cover REST, RPC, alias, and renamed procedure. |
| Fallback weakens contract policy                   | Metadata is authoritative; fallback invoked only for absent metadata; match is distinct from allow.    |
| Global migration breaks consumers/scaffolds        | Enforcement is opt-in; compile current consumers; do not edit templates.                               |
| Context generic exposes unrelated workers mismatch | Do not enforce router equality; any consumer edit is a rescope to #1278.                               |
| Optional auth accepts bad credentials anonymously  | Reject optional at binding time until a typed absent/invalid result exists.                            |
| OpenAPI roles are misrepresented as scopes         | Use `x-netscript-roles`; document portability.                                                         |
| Generated SDK behavior expands into #1352          | Type fixture only; no SDK source behavior edits.                                                       |
| Existing red gates obscure regressions             | Contract only base-green gates; record/exclude doc/plugin audit reds.                                  |
| Builder file grows/deepens doctrine debt           | Put traversal/resolution in focused auth files; builder only binds ports/config.                       |

## Anti-Patterns to Resolve or Avoid

| AP                                   | Status                          | Plan                                                                                       |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------ |
| AP-1 monolithic file                 | Existing risk in builder/plugin | Avoid: focused policy files; no unrelated builder refactor.                                |
| AP-3 god interface                   | New risk                        | Keep authentication, policy resolution, and authorizer matching as small structural ports. |
| AP-9 premature abstraction           | New risk                        | Implement only scope/role requirements and the one legacy fallback required by acceptance. |
| AP-14 re-exporting upstream packages | New risk                        | Plugin re-exports NetScript-owned service types only, not Hono/oRPC packages.              |
| AP-22 useless re-export barrel       | New risk                        | Re-exports are consumer-facing identity/context seams with tests and docs.                 |
| AP-25 side effect in non-edge file   | New risk                        | Contracts and metadata traversal are pure; middleware remains the runtime edge.            |

## Fitness Gates

| Gate                     | Required | Expected evidence                                                                                 |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| F-1 file size            | Yes      | `quality:gate`; focused new files and no unexplained threshold growth.                            |
| F-3 layering             | Yes      | `arch:check` through `quality:gate`; contracts imports no runtime/service.                        |
| F-5 public surface       | Yes      | `docs:exports-drift`, service doc lint, type fixtures.                                            |
| F-6 JSR publishability   | Yes      | Base-green package audits for contracts/service/SDK/MCP; plugin baseline red explicitly excluded. |
| F-10 test shape          | Yes      | Package suites and type fixtures; no assertion-budget regression.                                 |
| F-15 upstream re-export  | Yes      | Plugin exports only NetScript-owned public types.                                                 |
| F-19 scoped source gates | Yes      | Repo wrappers over the five affected roots.                                                       |

## Arch-Debt Implications

| Entry                                       | Action | Notes                                                      |
| ------------------------------------------- | ------ | ---------------------------------------------------------- |
| Service builder separation/preset role debt | None   | Do not broaden; new logic belongs in auth files.           |
| Plugin F-1 builder debt                     | None   | Signature-only change; no new implementation mass.         |
| Plugin JSR module-tag findings              | None   | Base red outside ceiling; do not opportunistically repair. |
| Contracts `./crud` exception                | None   | No new subsystem/root subpath.                             |
| Workers router-context mismatch / #1278     | Defer  | Explicitly not activated by this generic parameterization. |

## Named Validation Contract

The following commands were run at base and passed unless marked excluded. Slice tables above select
the applicable subset; the final Tier-B readiness run uses all contracted green gates.

| Order | Gate              | Command or check                                                                                                                                                                               | Base result / expected result                             |
| ----- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1     | `G-CHECK`         | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/contracts --root packages/service --root packages/plugin --root packages/sdk --root packages/mcp --ext ts,tsx` | PASS, 0 diagnostics                                       |
| 2     | `G-LINT`          | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts` with the same roots and extensions                                                                                             | PASS, 0 findings                                          |
| 3     | `G-FMT`           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts` with the same roots and extensions                                                                                              | PASS, 0 findings                                          |
| 4     | `G-TEST-*`        | `run-deno-test.ts -- --allow-all packages/<package>/tests` for each affected package                                                                                                           | PASS: contracts 16, service 90, plugin 68, SDK 77, MCP 136 (387 total) |
| 5     | `G-QUALITY`       | `deno task quality:gate`                                                                                                                                                                       | PASS, including `quality:scan` and `arch:check`           |
| 6     | `G-EXPORTS`       | `deno task docs:exports-drift`                                                                                                                                                                 | PASS; required because this leaf grows public surfaces    |
| 7     | `G-DOC-SERVICE`   | `run-deno-doc-lint.ts --root packages/service`                                                                                                                                                 | PASS                                                      |
| 8     | `G-JSR-CONTRACTS` | `audit-jsr-package.ts --root packages/contracts`                                                                                                                                               | PASS with sanctioned slow-type info                       |
| 9     | `G-JSR-SERVICE`   | `audit-jsr-package.ts --root packages/service`                                                                                                                                                 | PASS with sanctioned slow-type info                       |
| 10    | `G-JSR-SDK`       | `audit-jsr-package.ts --root packages/sdk`                                                                                                                                                     | PASS with warnings only                                   |
| 11    | `G-JSR-MCP`       | `audit-jsr-package.ts --root packages/mcp`                                                                                                                                                     | PASS with warnings only                                   |
| 12    | `G-LOCK`          | Compare SHA-256 and `git diff` for `deno.lock` against the slice baseline                                                                                                                      | Must remain byte-identical                                |
| 13    | `mcp-export-corpus` | `deno task check:mcp-export-corpus`                                                                                                                                                           | PASS at base; **required at every slice (1-9) and final readiness**. The corpus records each public symbol's signature and JSDoc, not just the symbol list, so any slice touching an exported declaration or its JSDoc stales it; the gate runs in under a minute, so per-slice is the only honest contract point. (PLAN-EVAL cycle 2, F-2'.) |
| 14    | `docs-tagline`    | `deno task docs:tagline:check`                                                                                                                                                                 | PASS at base; required at Slice 9 and final readiness     |
| 15    | `publish-assets`  | `deno task check:publish-assets`                                                                                                                                                               | PASS at base; required at Slice 9 and final readiness     |
| 16    | `agent-docs-prose` | `deno task check:agent-docs-prose`                                                                                                                                                            | PASS after the post-S0 base probe: 639 site files built, rendered output OK, bundle fresh (7.33 s); required at Slice 9 and final readiness |
| 17    | `assets-barrel`   | `deno task check:assets-barrel`                                                                                                                                                                | PASS at base; required at Slice 9 and final readiness     |

Row 4 was re-measured after S0 at the current `24f6642f` base and reproduced the evaluator's
`3e5cbabf` census; the earlier 8/69 values predated #1466.

Excluded base-red gates: contracts/plugin/SDK/MCP public doc lint and plugin JSR audit. Excluded by
owner direction: root test and every E2E/Aspire/Docker/browser gate. RTK output, when available, is
exploratory rather than verdict evidence; RTK is not installed on this host, so repo wrappers and
raw non-mutating Git inspection are used.

## Dependencies

- Hard: #1466 / PR #1731 merged into `main`; implementation cannot dispatch before this.
- Semantic: oRPC's public procedure metadata and traversal surface retained by the landed version.
- Forward compatibility review: #884 remains the canonical enterprise identity/policy owner.
- Process: separate opposite-family PLAN-EVAL must return `PASS` and explicitly adjudicate LD-8 and
  LD-11 before any implementation dispatch.

## Drift Watch

- #1466 merge state or any change to `NetScriptProcedureMeta`/SDK propagation.
- Any implementation need outside a slice ceiling.
- Any current plugin `context` consumer requiring a source edit.
- Any matcher ambiguity for custom REST/RPC paths or aliases.
- Any need to distinguish absent and invalid credentials for optional auth.
- Any contracted gate changing from its base result.
- Any `deno.lock` byte change.
