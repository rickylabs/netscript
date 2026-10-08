# Evaluation: Issue #1932 / PR #2097 — Atomic Saga Worker Producer (C6)

Independent IMPL-EVAL Round 1 on exact clean HEAD `5d96eae8722c708371529ae3b89a243a91e86c2a`.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-command-c6-saga-producer--lane-d` |
| Target         | Issue #1932 / PR #2097 (`5d96eae8722c708371529ae3b89a243a91e86c2a`) |
| Archetype      | Archetype 3 (Adapter / Lifecycle Integration / Outbox Producer); touches Archetypes 1, 2, 4 |
| Scope overlays | `service` (Command queue / Outbox / Sagas & Workers integration) |
| Evaluator      | Independent Google session (`agy` / Gemini 3.8 Flash High / Native opposite-vendor fallback). Requested: `gemini-3.8-flash-high/high`, observed: `Gemini 3.8 Flash (High) / Google`. Round: 1 (max 3 allowed per BRIEF-D4). |

---

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | Whole-chain PLAN-EVAL approved at `359d17f426592d58a6f6388a9522bc3afbc45dde`, decisions 13–15 / S15–S20. |
| Design section exists in worklog       | PASS   | Present in `.llm/runs/feat-command-c6-saga-producer--lane-d/worklog.md` under `## Design`. |
| Commit slices match design plan        | PASS   | S15 (`92d6e38`), S16 (`4900ce7`), S17 (`a77e5d1`), S18 (`b30a5ef`), S19 (`5b4f653`), S20a (`90fc539`), S20b (`0768d50`, `9fe21a3`), S20 (`25fc8a0`, `5d96eae`); sequence matches planned design slices. |
| Each slice has a passing gate          | PASS   | Dedicated slice reviews and gate evidence documented in `worklog.md`, `mutations.json`, and slice qualification records. |
| No speculative seams (unused files)    | PASS   | No dead code or unused modules introduced. All new effect constructors, validators, stores, and adapters have active consumers and test coverage. |
| Constants used for finite vocabularies | PASS   | Reuses finite vocabulary: `sgwc-v1:`, `sgtx-v1:`, `saga-inbound-v1`, `WorkerCommandEffect`, `SagaTransitionEffect`, `NetScriptStreamDBStatus`, and lifecycle status constants. |

---

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx` | PASS | 128 files checked, 0 errors. | Scoped to sagas core. |
| Slice typecheck  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core,packages/plugin-workers-core,packages/database,packages/service --ext ts,tsx` | PASS | 367 files checked, 0 errors. | Covers all touched packages. |
| Repo-wide check  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts` | PASS | 3,261 files selected across 27 batches, 0 failed batches. | Verified both locally and in CI. |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-sagas-core,packages/plugin-workers-core,packages/database,packages/service --ext ts,tsx` | PASS | 285 files checked, 0 formatting findings. | Clean formatting. |
| Lint             | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-sagas-core,packages/plugin-workers-core,packages/database,packages/service --ext ts,tsx` | PASS | 285 files checked, 0 lint findings. | Clean linting. |
| Doc lint         | `deno task doc:lint --pretty` | BASELINE PARITY | Exit 1 baseline disclosed (`fullMapGreenClaim: false`). `plugin-sagas-core`: 8 legacy diagnostics in untouched files; `plugin-workers-core`: 7 legacy diagnostics in untouched files. Zero diagnostics in newly introduced public exports. | Disclosed in `qualification.json`. |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` across `packages/plugin-sagas-core`, `packages/plugin-workers-core`, `packages/database`, `packages/service`, `plugins/sagas` | PASS | Exit 0 for all packages. | No slow-types or invalid export graph issues. |
| Link/path check  | `check:mcp-export-corpus`, `check:publish-assets`, `check:agent-docs-prose`, `check:assets-barrel`, `docs:links` | PASS | All generation and freshness checks exit 0; `docs:links` reports 105 documents checked with 0 broken links/anchors. | Verified clean. |

---

## Fitness Gates

| Gate | Function                          | Result          | Evidence                                                                                   | Violations |
| ---- | --------------------------------- | --------------- | ------------------------------------------------------------------------------------------ | ---------- |
| F-1  | File-size lint                    | PASS            | All new/modified files within doctrine lines-of-code thresholds (`worker-effects.ts`: 152 lines, `validate-transition-commit.ts`: 97 lines, `bind-postgres-command-outbox.ts`: 105 lines, `prisma-saga-transition-store.ts`: 222 lines). | None |
| F-2  | Helper-reinvention scan           | PASS            | Reuses existing `command-identity.ts` for traceparent validation; Web Platform `crypto.subtle` and `structuredClone` used directly. | None |
| F-3  | Layering check                    | PASS            | `deno task arch:check` passes with 0 violations across all workspace members.               | None |
| F-4  | Inheritance audit                 | PASS            | No deep class inheritance introduced; pure functions and interface ports used.             | None |
| F-5  | Public surface audit              | PASS            | New public exports explicitly registered in `mod.ts` and `deno.json` exports; recursive types correctly bounded. | None |
| F-6  | JSR publishability gate           | PASS            | `publish:dry-run` passes cleanly for all modified packages.                                | None |
| F-7  | Doc-score gate                    | BASELINE PARITY | Legacy doc-lint baselines preserved without adding new diagnostics.                        | None |
| F-8  | Workspace `lib` override check    | PASS            | Workspace tsconfig and Deno compiler configurations unmodified.                            | None |
| F-9  | Permission declaration check      | PASS            | Permissions declared accurately in test runner and scripts.                                | None |
| F-10 | Test-shape audit                  | PASS            | Co-located tests under `tests/` using standard `@std/assert` and named assertions.         | None |
| F-11 | Forbidden-folder lint             | PASS            | No forbidden folder hierarchies created.                                                   | None |
| F-12 | Naming-convention lint            | PASS            | Kebab-case filenames and camelCase exported symbols followed strictly.                     | None |
| F-13 | Saga and runtime invariants       | FAIL            | `isRegisteredSagaDefinition` in `saga-engine.ts` enforces strict instantiation of optional collection fields (`correlations`, `compensations`, `signalHandlers`, `queryHandlers`), rejecting valid user/test definitions where optional collections are omitted. | `TypeError: Invalid saga definition registration` in `installed-runtime-registry-integration_test.ts:281` |
| F-14 | Console-log lint                  | PASS            | No rogue `console.log` statements in runtime framework code.                               | None |
| F-15 | Re-export-of-upstream lint        | PASS            | No illegal upstream package re-exports.                                                    | None |
| F-16 | Folder-cardinality lint           | PASS            | Directory structures remain within cardinality limits.                                      | None |
| F-17 | Abstract-derived co-location lint | PASS            | Port definitions co-located with domain models.                                            | None |
| F-18 | Sub-barrel lint                   | PASS            | Clean subpath exports in `mod.ts` without wildcard sub-barrel cycles.                      | None |
| F-19 | Scoped source gate runners        | PASS            | Gate runner executed without illegal bypass flags.                                         | None |

---

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Focused Sagas Tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-sagas-core/tests/worker-effects_test.ts packages/plugin-sagas-core/tests/saga-transition-commit_test.ts packages/plugin-sagas-core/tests/saga-worker-producer_test.ts packages/plugin-sagas-core/tests/prisma-transition-store_test.ts packages/database/tests/commands/bound-outbox_test.ts` | PASS | 10/10 passed in 1,213 ms. Zero timer leaks. |
| Scoped Sagas Regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-sagas-core/` | PASS | 535 passed, 0 failed, 7 ignored (dedicated provider-dependent tests isolated). |
| Real PostgreSQL Conformance | Dedicated provider runner on PostgreSQL 15 | PASS | Generated Prisma client callback store commits atomic transition, history, correlation, outbox, and replay marker with zero ignored tests. |
| Pinned C5 Relay Integration | Temporary external cohort fixture at `1a93a6acb127f58cb5bb622223180ca5e5e9925e` | PASS | Restart recovery, crash-before-settlement redelivery, duplicate dedupe, lease expiration, and downstream SQL applied-key persistence verified. |
| Native Durable Progress & Completion | Third native consumer fixture | PASS | Observes progress 25/75 surviving restart, checked `publishSagaOrThrow()` completion, no duplicate outbox rows. |
| Mutation Suite (29 rows, 17 named tests) | Aggregate `.llm/runs/feat-command-c6-saga-producer--lane-d/mutations.json` | PASS | 29 semantic mutations kill tests with named `AssertionError` (`mutantExit: 1`), restored files pass (`restoredExit: 0`), byte-identical restorations confirmed. |
| Scaffold Runtime E2E | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (CI run 37831334754) | PASS | Aspire + Docker + PostgreSQL and SQLite suites passed completely. |
| Repo-wide Full Test Suite | `deno task test` (CI run 37831334592, job `check-test`) | FAIL | 5,589 passed, 1 failed, 17 ignored. Failed test: `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts:281` ("packaged runtime export starts a saga runtime with a project-owned non-empty registry"). |

---

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| MCP Export Surface Corpus | `deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/generate-export-surface-corpus.ts --check` | PASS | Provenance clean; symbols matched. |
| Publish Assets | `deno run --no-lock --allow-read --allow-run .llm/tools/generate-publish-assets.ts --check` | PASS | Packaging assets match clean tree. |
| Plugin Sagas Runtime Registry Integration | `deno test --allow-all packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts` | FAIL | Registry integration fails on valid minimal saga definition missing optional collections (`correlations`, `compensations`, etc.), throwing `TypeError: Invalid saga definition registration` at `registeredSagaDefinition`. |

---

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | File sizes small; single-responsibility modules. | None |
| AP-2  | CLEAR  | No speculative seams or premature abstractions. | None |
| AP-3  | CLEAR  | Module boundaries clean; no circular imports. | None |
| AP-4  | CLEAR  | Explicit typed parameters; `NoInfer` prevents schema payload widening. | None |
| AP-5  | CLEAR  | Pure functions and composition preferred over inheritance. | None |
| AP-6  | VIOLATION | `isRegisteredSagaDefinition` in `saga-engine.ts` introduces an overly rigid runtime shape check that breaks backward compatibility with saga definitions that omit optional collection fields (`correlations`, `compensations`, `signalHandlers`, `queryHandlers`). | Causes regression in `installed-runtime-registry-integration_test.ts`. |
| AP-7  | CLEAR  | No magic constants or undocumented strings; stable prefix namespaces used. | None |
| AP-8  | CLEAR  | Errors thrown with standard `SagasError` or `TypeError` without swallowing. | None |
| AP-9  | CLEAR  | Abort signals checked around provider and schema boundaries. | None |
| AP-10 | CLEAR  | Public symbols cleanly exported without leaking internal types. | None |
| AP-11 | CLEAR  | Interacts with worker effects and database outbox via explicit ports. | None |
| AP-12 | CLEAR  | State machine transitions deterministic; atomic commit maintains single CAS version check. | None |
| AP-13 | CLEAR  | Timers cleaned up; zero lingering timers. | None |
| AP-14 | CLEAR  | `quality:scan` passes with zero unexpected allowances. | None |
| AP-15 | CLEAR  | Upstream errors wrapped and classified. | None |
| AP-16 | N/A    | CLI commands outside core scope. | None |
| AP-17 | N/A    | Aspire wiring patterns outside scope. | None |
| AP-18 | N/A    | Plugin manifest patterns outside scope. | None |
| AP-19 | CLEAR  | No raw process exits in framework code. | None |
| AP-20 | CLEAR  | Dead code eliminated. | None |
| AP-21 | CLEAR  | Outbox binding and store operations idempotent. | None |
| AP-22 | CLEAR  | Inbound replay deduplicated deterministically. | None |
| AP-23 | N/A    | Fresh UI components outside scope. | None |
| AP-24 | N/A    | Database schema migrations outside scope. | None |
| AP-25 | CLEAR  | Native Web Crypto and Deno primitives used directly. | None |

---

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new architecture debt added to `debt/arch-debt.md`. |
| Resolved entries      | 0     | N/A (Feature implementation). |
| Deepened violations   | 0     | `arch:check` clean (0 violations). |
| Unrecorded violations | 0     | Pre-existing doc-lint diagnostics match known baseline. |

---

## Documentation Audit

Evaluated against the 9 gates of `.llm/harness/workflow/doc-audit.md`:

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| ---- | ---------- | ----- | ------ | -------- | --------- |
| `deno task docs:links` | `deno task docs:links` | 105 documentation pages | PASS | 0 broken links, anchors, or orphaned docs. | Verified |
| Site build | `deno run --no-lock --allow-read --allow-write --allow-run .llm/tools/docs/generate-agent-docs-prose.ts --check` | Generated doc site artifacts | PASS | Generated doc site builds cleanly with no errors. | Verified |
| Internal-wording scan | Automated prose scan for issue/PR numbers and internal project codenames | Changed public documentation lines | PASS | Public documentation contains no internal issue/PR references or unreleased internal codenames. | Verified |
| Versionless-specifier scan | Check `{{ releaseSpecifier }}` usage | Pinned `jsr:@netscript/*` examples | PASS | Correctly uses templated release specifiers in consumer examples. | Verified |
| Command/API accuracy | `deno doc` on `packages/plugin-sagas-core/mod.ts` and `packages/plugin-workers-core/mod.ts` | Documented saga effects and store APIs | PASS | Documented APIs match live signatures and exports. | Verified |
| Template/generated drift | `check:publish-assets`, `check:assets-barrel`, `check:mcp-export-corpus` | Generated barrels and manifests | PASS | Generated files match source templates exactly. | Verified |
| Navigation/front matter | Front matter inspection across docs tree | Documentation sidebar and metadata | PASS | Navigation intact, front matter valid, no orphaned pages. | Verified |
| Prose quality | Manual inspection of prose changes in `docs/` and READMEs | Documentation changes in changeset | PASS | Clear heading hierarchy, accurate examples, reader-ready prose. | Verified |
| Cross-page consistency | Cross-page verification | Sagas, workers, and command outbox documentation | PASS | Claims consistent across docs; prerequisite C5 relay boundaries accurately described. | Verified |

---

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| **High** | Regression in `registeredSagaDefinition`: overly strict runtime shape check breaks valid saga definitions lacking optional collection fields. | `packages/plugin-sagas-core/src/runtime/saga-engine.ts:610-652`<br>Failing test: `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts:281`<br>Error: `TypeError: Invalid saga definition registration.`<br>Reproduce: `deno test --allow-all packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts` | Update `isRegisteredSagaDefinition` in `saga-engine.ts` so that optional collections (`correlations`, `compensations`, `signalHandlers`, `queryHandlers`) are permitted to be `undefined` (or, if defined, conform to expected types). Default omitted collections to empty instances or preserve existing permissive handling so existing minimal/mock definitions pass. |
| **High** | CI `check-test` job failure in `ci` workflow run 37831334592 directly caused by the above regression. | `gh run view 37831334592`<br>`summary: {"passed": 5589, "failed": 1, "ignored": 17, "totalResults": 5607, "uniqueFailures": 1}` | Fix the regression in `saga-engine.ts`, verify full test suite passes locally with `deno task test`, and ensure CI runs clean on the repaired HEAD. |
| **Low** | PR #2097 Definition of Done checkboxes 40 ("Independent exact-product-head IMPL-EVAL PASS") and 41 ("Current-head CI green...") remain unchecked. | `check-close-gate.ts` in CI run 37831334592 job `close-gate`. | Expected for Round 1 while review was active and CI had 1 failing test; to be checked by operator after repair and successful evaluation. |

---

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Permissive boundary validation for optional domain collections | When adding runtime boundary type assertions on heterogeneous definition objects, optional collection properties (such as handlers, compensations, correlation rules) must be checked conditionally (`field === undefined || ...`) rather than asserting non-null instances, preserving compatibility with minimal definitions and external tests. | Archetype 1, Archetype 3 | High |

---

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **FAIL_FIX** |
| Rationale | Evaluated exact clean HEAD `5d96eae8722c708371529ae3b89a243a91e86c2a`. While the C6 outbox producer core implementation, PostgreSQL physical store conformance, 29 mutation kills, scaffold runtime E2E, and documentation audit are exceptionally well-constructed, a regression was introduced in `packages/plugin-sagas-core/src/runtime/saga-engine.ts:610-652` (`registeredSagaDefinition` / `isRegisteredSagaDefinition`). The runtime check strictly requires `correlations` to be an Array and `compensations`, `signalHandlers`, `queryHandlers` to be instances of `Map`, rejecting valid minimal saga definitions that omit these optional fields. This caused `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts` to fail both locally and in CI (`check-test` job in workflow run 37831334592: 5,589 passed, 1 failed). Product code cannot be edited by the evaluator; this defect requires a targeted fix by the implementation session in Round 2. |
