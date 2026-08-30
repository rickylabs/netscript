# Worklog: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Design

This section was recorded before any implementation files. This slice contains no product code.

### Public Surface

- `NetScriptProcedureMeta.access.authorization` — optional readonly scopes/roles extending #1466.
- `ContextFactory<TCustom>` — typed custom context factory output.
- `ServiceHandlerContext<TCustom>` — custom fields plus optional service-owned request fields,
  including `Principal | undefined`.
- `ServiceBuilder<TRouter, TCustom>` / `withContext<TNext>()` — fluent generic propagation.
- `createContractAuthorizer(contract, options?)` — opt-in contract metadata adapter.
- Plugin root and `./service` type re-exports — public service-owned identity/context types.
- OpenAPI operation `security` plus `x-netscript-roles` projection.
- MCP operation access summary in list/detail results.

### Domain Vocabulary

- `NetScriptAuthenticationRequirement` — existing #1466 none/optional/required declaration.
- `NetScriptProcedureMeta` — the only procedure metadata vocabulary.
- `Principal` — existing service-owned non-tenant authenticated identity.
- `ServiceHandlerContext<TCustom>` — handler-visible composition with optional framework fields.
- `ProcedureAccessPolicy` — service interpretation of declared contract access.
- `AuthorizerMatch` / match-aware fallback result — distinguishes no rule from a matched deny.
- `OperationAccessSummary` — bounded MCP projection of OpenAPI access.

### Ports

- `AuthenticatorPort` — unchanged provider seam; its current result limitation drives optional-auth
  fail-closed behavior.
- `AuthorizerPort` — compatibility seam retained for standalone authorizers.
- `ProcedurePolicyResolver` — reads the same compiled metadata before authn and during authz.
- `MatchAwareAuthorizerPort` — permits contract fallback without confusing no-match and deny.

### Constants

- Existing auth prefix constants remain standalone defaults; contract binding uses actual builder
  projection configuration.
- OpenAPI uses one documented default bearer scheme name and `x-netscript-roles`; neither becomes a
  second policy vocabulary.
- Explicit deny/error reasons are stable, namespaced strings tested by behavior suites.

### Commit Slices

| # | Slice                           | Gate                                                         | Files                                                   |
| - | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 0 | #1466 merge/rebase precondition | Re-run full base census                                      | No product edits                                        |
| 1 | Contract metadata type          | G-CHECK/LINT/FMT, contracts+SDK tests/audits, G-EXPORTS      | Contracts metadata and type fixtures; SDK type fixtures |
| 2 | Typed context public surface    | Static gates, service+plugin tests, service doc/JSR, exports | Service/plugin type/export ceiling                      |
| 3 | Context runtime composition     | Static gates, service tests, quality, lock                   | Builder implementation/tests                            |
| 4 | Policy ports                    | Static gates, service tests/doc/JSR, exports                 | Service auth type ceiling                               |
| 5 | Policy enforcement              | Static gates, service tests, quality/JSR/lock                | Auth adapter/middleware/builder/tests                   |
| 6 | OpenAPI projection              | Static gates, service tests/doc/JSR/quality                  | OpenAPI primitive/tests                                 |
| 7 | MCP result contract             | Static gates, MCP tests/JSR, exports                         | MCP domain/schema/flow types                            |
| 8 | MCP/agent projection            | Static gates, MCP tests/JSR/quality/lock                     | MCP index/flows/tests                                   |
| 9 | Adoption docs                   | Doctests, static gates, exports/audits/quality               | Four READMEs and four docs pages                        |

Exact per-slice ceilings are authoritative in `plan.md`.

### Deferred Scope

- Enterprise organization/membership/assurance — #884.
- Browser gateway — #934.
- SDK credentials — #1352.
- Plugin auth configuration — #1383.
- Whole-router context soundness — #1278.
- Optional-auth runtime support — requires a typed absent-vs-invalid authenticator result.
- Existing 54-procedure and scaffold migration — consumers opt in deliberately.

### Contributor Path

After #1466 lands, a developer annotates a contract procedure with
`.meta({ access: { authentication: 'required', authorization: { scopes: ['x:read'] } } })`, types
the router context as `ServiceHandlerContext<MyContext>`, and installs
`createContractAuthorizer(contract, { fallback: legacyScopeAuthorizer })` through the existing
service auth builder. The same metadata drives enforcement, OpenAPI, SDK type inspection, and MCP
operation summaries.

## Progress Log

| Time       | Slice    | Step                    | Notes                                                                                                                              |
| ---------- | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | planning | activation              | Read harness, doctrine, PR, Deno toolchain, RTK, repo-tools, and JSR-audit instructions.                                           |
| 2026-08-30 | planning | re-baseline             | Fetched current main and #1466 branch; safely fast-forwarded the clean leaf branch.                                                |
| 2026-08-30 | planning | public-surface research | Used `deno doc` before focused source reads; enumerated context callers, auth ordering, OpenAPI/MCP reach, and consumer contracts. |
| 2026-08-30 | planning | migration research      | Counted 54 undeclared first-party procedures and identified scaffold generators; selected opt-in enforcement.                      |
| 2026-08-30 | planning | base gates              | Ran candidate gates on clean base; contracted only green signals.                                                                  |
| 2026-08-30 | planning | artifacts               | Wrote research, locked plan, drift, worklog, supervisor, and context pack only; no product code.                                   |

## Decisions

| Decision                                              | Reason                                                                 | Source                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Extend #1466 metadata, never parallel it              | Policy must remain contract-local and already propagates to SDK types. | Owner constraint, #1466 branch, plan LD-1/2 |
| Service owns Principal; plugin re-exports public type | Correct dependency direction.                                          | Doctrine and package export maps            |
| Enforcement is opt-in                                 | Global activation denies existing procedures/scaffolds.                | Research migration census                   |
| Contract wins; scope authorizer is fallback           | Prevents drift and weakening.                                          | #1387 target, plan LD-6                     |
| Optional runtime binding fails closed                 | Authenticator cannot distinguish absent/invalid.                       | Auth port inspection, plan LD-8             |
| Rename acceptance is corrected                        | Contract-local metadata moves with procedure.                          | Drift entry and plan LD-11                  |

## Drift

| Drift                              | Severity      | Logged in drift.md |
| ---------------------------------- | ------------- | ------------------ |
| Initial branch behind fetched main | minor         | yes                |
| #1466 not merged                   | significant   | yes                |
| Router-rename acceptance conflict  | architectural | yes                |
| RTK unavailable                    | minor         | yes                |
| Candidate gates red at base        | minor         | yes                |

## Gate Results

### Static Gates

| Gate             | Command or check                                       | Result  | Notes                                                |
| ---------------- | ------------------------------------------------------ | ------- | ---------------------------------------------------- |
| Scoped check     | Structured check wrapper over five roots               | PASS    | 0 diagnostics                                        |
| Scoped lint      | Structured lint wrapper over five roots                | PASS    | 0 findings                                           |
| Scoped format    | Structured format wrapper over five roots, TS/TSX only | PASS    | 417 files, 0 findings                                |
| Contracts tests  | Structured test wrapper                                | PASS    | 8/8                                                  |
| Service tests    | Structured test wrapper                                | PASS    | 90/90                                                |
| Plugin tests     | Structured test wrapper                                | PASS    | 68/68                                                |
| SDK tests        | Structured test wrapper                                | PASS    | 69/69                                                |
| MCP tests        | Structured test wrapper                                | PASS    | 136/136                                              |
| Export drift     | `deno task docs:exports-drift`                         | PASS    | Branch-sensitive public-surface gate                 |
| Service doc lint | Structured doc-lint wrapper                            | PASS    | Other four candidate roots are base-red and excluded |
| Root test        | Owner-declared host infrastructure red                 | NOT_RUN | Must not chase or contract                           |

### Fitness Gates

| Gate                                     | Result | Evidence                 | Notes                                        |
| ---------------------------------------- | ------ | ------------------------ | -------------------------------------------- |
| F-1/F-3/F-5 aggregate                    | PASS   | `deno task quality:gate` | Includes quality scan and architecture check |
| F-6 contracts/service/SDK/MCP            | PASS   | JSR audit commands       | Warnings/info only                           |
| F-6 plugin                               | FAIL   | Base JSR audit           | Existing four module-tag failures; excluded  |
| Public doc lint contracts/plugin/SDK/MCP | FAIL   | Base doc-lint reports    | Existing private type refs; excluded         |

### Runtime Gates

| Gate                      | Result  | Evidence       | Notes                                 |
| ------------------------- | ------- | -------------- | ------------------------------------- |
| E2E/Aspire/Docker/browser | NOT_RUN | Owner boundary | No runtime lease; planning slice only |

### Consumer Gates

| Consumer                            | Result             | Evidence               | Notes                                                      |
| ----------------------------------- | ------------------ | ---------------------- | ---------------------------------------------------------- |
| Seven plugin context configurations | PASS at base       | Five-root scoped check | Must remain compile-only/no-edit consumers                 |
| Current procedures/scaffolds        | PASS at base       | Static census          | Opt-in migration preserves current behavior                |
| SDK metadata propagation            | PENDING_DEPENDENCY | #1466 PR #1731         | Branch inspection proves intended carrier; must land first |

## Handoff Notes

- PLAN-EVAL should inspect the metadata dependency, migration census, authn-before-authz
  consequence, and corrected rename proof first.
- A PLAN-EVAL `PASS` must explicitly affirm LD-8 and LD-11.
- Implementation remains prohibited until both PLAN-EVAL passes and #1466 lands.
- The initial `deno.lock` SHA-256 is
  `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
