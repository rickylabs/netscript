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
| 2026-08-04 | 2 | implementation/review | Added exact identity resolution and a committed ambiguity fixture. Verified id precedence, uppercase method-path fallback, case-variant refusal, duplicate-id ambiguity candidates, and non-executing substring suggestions. |
| 2026-08-04 | 3 | implementation/review | Added the four-rung description ladder, a per-rung fixture, and the byte-identical 3657-byte generated no-DB spec. Verified the real operations have no operation summary/description and fire rung 3; nested schema property `summary` does not leak into operation descriptions. |
| 2026-08-04 | 2a | acceptance correction | Tightened identity refusal for two spec IDs that collide under case-folding. Either exact spelling now returns both candidates; a differently cased unique ID remains an unknown suggestion only. |
| 2026-08-04 | 4 | implementation/review | Added request/success/error/all projections, path/operation parameter merging, bounded local-ref expansion, unresolved/external-ref preservation, and detected-only common error compaction. The real no-DB fixture returns exact `{}` errors for all three operations. |
| 2026-08-04 | 4 | gate correction | Package `deno task test` exposed a baseline task-permission defect: three existing temp-directory tests require write permission. Added test-only `--allow-write`; no runtime permission or domain I/O changed. |
| 2026-08-04 | 5 | composed evaluation | The first OpenHands dispatch reached the runner but produced no verdict because LiteLLM rejected the unprefixed `qwen/qwen3.7-max` model identifier. A single corrected `openrouter/qwen/qwen3.7-max` retry completed successfully and committed `evaluate.md` with `IMPL-EVAL: PASS`. |
| 2026-08-04 | 5 | close-gate review | The current review-thread gate passed with 0 threads and 0 unanswered. Fresh CI correctly reported the self-referential DoD/closing-keyword metadata still pending and found the MCP generated publish-asset manifest stale after the new subpath export. Regenerated only that manifest with the repo-native task. |
| 2026-08-04 | 5 | merge-readiness handoff | Corrected the PR's structured acceptance block to the repo's constrained `issue`/`entries`/`box-index` schema, then observed authoritative close-gate, full scaffold runtime, scaffold static, desktop-native, surface-diff, repo check/test, quality, and lane-visibility checks pass. GitHub reports the ready-merge PR `MERGEABLE` / `CLEAN`; merge authority remains with the milestone orchestrator. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Errors absent means exact `{}` | Measured reality; no envelope inference | P2 verdict/evidence |
| PLAN-EVAL gate is composed | Explicit milestone-run D6 owner waiver | user directive + milestone-run.md |
| No local/external ref fetch | Pure domain boundary | canonical design + S4 scope |
| Implement in the owning supervisor session | The milestone orchestrator already launched this worktree's single allowed Codex sender; a nested launch was correctly refused as duplicate-sender risk | agentic sender registry + `codex-status` |
| Retry OpenHands once with a provider-prefixed model id | The first run failed before tokens or verdict with an explicit LiteLLM provider-shape error; the dispatcher dry-run accepted the corrected approved Qwen route | Actions runs `30861232769` and `30861395106` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal PLAN-EVAL replaced by milestone composition | minor/process-authorized | yes |
| Package test task lacked existing temp-write permission | minor/test-infrastructure | yes |
| OpenHands model identifier required a provider prefix | minor/evaluator-infrastructure | yes |
| Augment review unavailable because the account had no credits | minor/external-composition | yes |

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
| Slice 2 identity tests | `deno test packages/mcp/tests/operation-index_test.ts packages/mcp/tests/canonical-identity_test.ts` | PASS | 6 passed, 0 failed. |
| Slice 2 scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 73 files, one batch, zero diagnostics. |
| Slice 2 hygiene | `git diff --check`; raw `git diff -- deno.lock` | PASS | No whitespace errors; lock diff empty. |
| Slice 3 ladder tests | `deno test packages/mcp/tests/operation-index_test.ts packages/mcp/tests/canonical-identity_test.ts packages/mcp/tests/description-ladder_test.ts` | PASS | 8 passed, 0 failed; all four rungs and real generated rung 3 covered. |
| Real fixture provenance | `cmp <P2-no-db-live-spec.json> packages/mcp/tests/fixtures/openapi/no-db-generated-openapi.json`; `wc -c` | PASS | Byte-identical; 3657 bytes. |
| Slice 3 scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 75 files, one batch, zero diagnostics. |
| Slice 3 hygiene | `git diff --check`; raw `git diff -- deno.lock` | PASS | No whitespace errors; lock diff empty. |
| Slice 4 schema-view tests | `deno test packages/mcp/tests/schema-views_test.ts` | PASS | 3 passed: merged request/ref cycle, detected common errors + preserved refs, and exact no-DB `{}` errors. |
| Package tests | package `deno task test` | PASS after task correction | 78 passed, 0 failed. Initial task ran 74 pass / 3 permission-only failures because its task omitted write access for existing temp-dir tests; test-only permission was corrected. |
| Slice 4 scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS | 77 files, one batch, zero diagnostics. |
| MCP doctrine scan | `check-doctrine.ts --root packages/mcp` | PASS for introduced surface | Schema views reduced below the 300-line F-1 cap; only pre-existing flows cardinality and architecture-doc info remain. |
| Framework quality | `deno task quality:gate` | PASS | Exit 0; quality scan clean and architecture chain completed with baseline warnings only. |
| Final scoped lint | `run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json --pretty` | PASS | 77 files, zero occurrences. The first no-config wrapper run hit the root Deno 2.9 workspace parse failure and produced no lint findings; explicit package config is the authoritative rerun. |
| Final scoped format | `run-deno-fmt.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json --pretty` | PASS | 77 files, zero findings. The first no-config run hit the same root workspace parse failure; explicit package config passed. |
| Final doc-lint | `deno task doc:lint --root packages/mcp --pretty` | PASS | 0 errors/private refs/missing docs across 3 entrypoints. |
| Final publish dry-run | package `deno task publish:dry-run` | PASS | Exit 0; all 3 entrypoints checked and intended projection/domain files included. |
| Final lock/boundary hygiene | raw diff/grep + fixture `cmp` | PASS | No `deno.lock` diff, no domain I/O/runtime imports, no lint ignores/double casts/quality allowances; P2 fixture remains byte-identical at 3657 bytes. |
| OpenHands IMPL-EVAL | corrected approved Qwen route; Actions run `30861395106`; committed `evaluate.md` | PASS | Independent evaluator repeated the package, doctrine, JSR/publish, identity, ladder, ref-bound, exact no-DB `{}` and lock gates; no substitute blocker found. |
| Current review threads | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1195 --pretty` | PASS | 0 threads, 0 unanswered after the evaluator artifact commit. |
| Generated publish assets | `deno task gen:publish-assets`; `deno task check:publish-assets`; package publish dry-run | PASS | CI found the new `./openapi-projection` public subpath absent from the checked-in MCP publish manifest; regeneration changed only `packages/mcp/src/publish-assets.generated.ts`, the check passed, and all 3 entrypoints dry-ran successfully. |
| PR close gate | Actions run `30862374051`; job `91846994088` | PASS | Structured acceptance mirror, referenced issue acceptance, and answered review-thread checks all passed against the live ready-merge body. |
| Current PR check rollup | `deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1195 --pretty` | PASS | Head `0094071a9…`: 0 current failures; scaffold runtime/static, desktop native, surface diff, core CI, quality, and close-gate all current-pass. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Final JSR audit | PASS with baseline warnings | `audit-jsr-package.ts --root packages/mcp --text` | New 3-entrypoint surface publishes; domain cardinality warning is resolved. Only pre-existing flows cardinality plus the known dry-run banner overcount remain. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire | N/A | plan scope | Pure deterministic domain code. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| New subpath | PASS (Slices 1–4) | all new tests import `../openapi-projection.ts` | Full surface gates repeat at merge readiness. |

## Handoff Notes

- Review exact/fuzzy separation first, then the no-DB `{}` assertion and public doc surface.
