# Worklog: OMB S4 OpenAPI projection domain

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-projection-domain--w2` |
| Branch | `feat/openapi-mcp-projection-domain` |
| Archetype | `2 — Integration` (pure domain slice) |
| Scope overlays | none |

## Design

Recorded before implementation files were created.

### Public Surface

- `@netscript/mcp/openapi-projection` — documented package subpath.
- `indexOpenApiOperations(document)` — immutable deterministic operation index.
- `resolveCanonicalOperation(index, input)` — resolved/ambiguous/unknown union.
- `describeOpenApiOperation(operation)` — deterministic four-rung summary.
- `projectOperationSchemaViews(document, operation)` — request/response/errors/all views.

### Domain Vocabulary

- `HttpMethod`, `OpenApiObject`, `IndexedOpenApiOperation`, `OpenApiOperationIndex` — indexed source facts.
- `OperationResolution`, `ResolvedOperation`, `AmbiguousOperation`, `UnknownOperation` — refusal-first lookup result.
- `OperationSchemaViews`, `RequestSchemaView`, `ResponseSchemaView`, `ErrorSchemaView` — declared schema projections.
- `SchemaViewName` — request/response/errors/all closed vocabulary.

### Ports

- None. S4 is deliberately pure; S5 owns service-directory/spec-fetch ports and adapters.

### Constants

- `HTTP_METHODS` — standard OpenAPI path-operation keys.
- `SCHEMA_VIEW_NAMES` — `request`, `response`, `errors`, `all`.
- Private ref-expansion depth bound — finite recursion guard, not caller configuration.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Cardinality-safe public index contract | command + index tests; scoped check | command-domain moves/imports; entrypoint; index; metadata/docs/test; run artifacts |
| 2 | Exact canonical identity | ambiguity test | identity module + fixtures/test; entrypoint; run artifacts |
| 3 | Four-rung descriptions | ladder test | ladder module + fixtures incl. exact no-DB spec; entrypoint; run artifacts |
| 4 | Declared schema views | schema-view + package tests | views module + fixtures/test; entrypoint; run artifacts |
| 5 | Merge-readiness evidence | full validation plan | run artifacts; diagnostic fixes only in owned files |

### Deferred Scope

- Ports/adapters/fetching/tools — S5/S6.
- DB common-envelope specialization — requires attributable proof; D8 rescope if later needed.
- Whole-result byte ceiling — adjacent S8 machinery.

### Contributor Path

Open `openapi-projection.ts` to see the curated API, then edit the single concern under
`src/domain/openapi/` and its same-named test. New OpenAPI shapes extend existing structural guards;
they do not add parser strategies or I/O.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | bootstrap | research/plan | Live issue/RFC, doctrine, package surface, and P2 proof/evidence consumed; plan locked. |
| 2026-08-04 | 1 | implementation | Regrouped the command-domain triplet without changing the root exports; added the documented projection subpath, deterministic operation index, public-import tests, and README entry. |
| 2026-08-04 | 1 | review | Verified source-order indexing, dotted ids, method-path fallback, ignored Path Item metadata, unchanged 14-tool claims, pure-domain imports, and empty lock diff. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Errors absent means exact `{}` | Measured reality; no envelope inference | P2 verdict/evidence |
| PLAN-EVAL gate is composed | Explicit milestone-run D6 owner waiver | user directive + milestone-run.md |
| No local/external ref fetch | Pure domain boundary | canonical design + S4 scope |
| Implement in the owning supervisor session | The milestone orchestrator already launched this worktree's single allowed Codex sender; a nested launch was correctly refused as duplicate-sender risk | agentic sender registry + `codex-status` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal PLAN-EVAL replaced by milestone composition | minor/process-authorized | yes |

## Gate Results

### Plan Gate

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | composed per milestone-run.md (orchestrator waiver) | owner directive; `plan-eval.md` | No local formal PLAN-EVAL is spawned or awaited. |

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Branch baseline | raw git SHA/merge-base/status | PASS | Exact clean `origin/main` baseline `2c8865e8…`. |
| Baseline doc-lint | `deno task doc:lint --root packages/mcp --pretty` | PASS | 0 diagnostics across 2 existing entrypoints. |
| Baseline publish dry-run | package `deno task publish:dry-run` | PASS | Exit 0; no actual slow-type diagnostic. |
| Slice 1 command/index tests | `deno test --allow-run packages/mcp/tests/operation-index_test.ts packages/mcp/tests/command_flows_test.ts packages/mcp/tests/command_adapters_test.ts packages/mcp/tests/command_composition_test.ts` | PASS | 12 passed, 0 failed. Initial invocation omitted `--allow-run` and produced the expected permission refusal in three subprocess tests; corrected command passed. |
| Slice 1 scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 71 files, one batch, zero diagnostics after adding the required explicit exported constant type. |
| Slice 1 lock hygiene | raw `git diff -- deno.lock` | PASS | Empty. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| JSR baseline scan | PASS with baseline warnings | `audit-jsr-package.ts --root packages/mcp --text` | Existing domain/flow cardinality warnings; helper banner overcount documented. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire | N/A | plan scope | Pure deterministic domain code. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| New subpath | PASS (Slice 1) | `tests/operation-index_test.ts` imports `../openapi-projection.ts` | Full surface gates repeat at merge readiness. |

## Handoff Notes

- Review exact/fuzzy separation first, then the no-DB `{}` assertion and public doc surface.
