# Evaluation: packages/ai TanStack usage-detail passthrough (#1677 / PR #1829)

## Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `fix-ai-usage-detail-passthrough--0.0.7` |
| Target         | `packages/ai` (issue #1677, PR #1829)  |
| Archetype      | `4 — Public DSL / Builder`             |
| Scope overlays | none                                   |
| Evaluator      | separate-session IMPL-EVAL (GLM 5.3 Flash), 2026-08-31, head `481dea4b5`, base `0274c0a70` |

## Process Verification

| Check                                  | Result  | Evidence                                                                                          |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `N/A`   | `PLAN-EVAL: N/A` recorded in `drift.md` with a concrete reason (authoritative contract, 2-path ceiling, frozen surface); no open design decision existed |
| Design section exists in worklog       | `PASS`  | `worklog.md` "Design" (public surface, mapping design, slices)                                    |
| Commit slices match design plan        | `PASS`  | Slice 1 = RED `545335952` (test only) + GREEN `481dea4b5` (adapter only); no third commit         |
| Each slice has a passing gate          | `PASS`  | 150/150 tests, 0 check/lint/fmt findings (below)                                                  |
| No speculative seams (unused files)    | `PASS`  | Full-tree diff base..head = 2 product paths + 4 run artifacts only                                |
| Constants used for finite vocabularies | `PASS`  | `EXPECTED_USAGE_LEAF_COUNT = 23` is the only new constant, test-only                              |

## Claim Table (adversarial A–F)

| Claim | Result   | Deciding evidence                                                                                                                                                                        |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — two-path ceiling | UPHELD | `git diff --name-status 0274c0a70..HEAD`: only `packages/ai/src/adapters/tanstack-chat-client.ts` (M), `packages/ai/tests/tanstack_chat_client_test.ts` (A) + 4 `.llm/runs/` artifacts; frozen paths (contracts/usage.ts, deno.json, docs, deno.lock, packages/mcp) diff empty; tree clean |
| B — red-before/green | UPHELD | `git diff-tree -r 545335952` = test file only (no product source); `git diff 545335952..HEAD` on the test file is **empty** (test identical at RED and HEAD); base mapper reconstructed a fresh 3-field object, so `assertStrictEquals`/`assertEquals` necessarily failed at RED |
| C — widening from upstream type | UPHELD | `tanstack-chat-client.ts:33` `import type { … TokenUsage … } from '@tanstack/ai'`; `:364` `usage: TokenUsage | undefined`; body is `return usage;` (no field list); fixture `satisfies TokenUsage` with 23 leaves typechecks (check: 101 files, 0 occurrences); `deno doc --filter TokenUsage npm:@tanstack/ai@0.39.0` resolves `@tanstack/ai-event-client@0.6.8` shape |
| D — fixture honesty | UPHELD | Fixture census = exactly 23 leaves (6 top-level scalars + 7 prompt + 6 completion + providerRequestId + 3 costDetails), asserted via `assertEquals(expectedLeaves.length, 23)`; all sentinels distinct; oracle probe (real `@std/assert` + verbatim oracle) THROWS on: single dropped nested leaf, single dropped top-level leaf, wrong-destination swap, cross-detail swap, structural (non-identical) copy, and the old 3-field projection |
| E — public surface frozen | UPHELD | `git diff` on `packages/mcp/**` and all entrypoints empty; JSR audit surface byte-identical to baseline (`.=28, ./anthropic=2, ./openai-compatible=5, ./openai-embeddings=3, ./openrouter=5, ./ollama=7, ./mcp=11, ./agent=7, ./skills=6, ./contracts=10, ./ports=17, ./tools=4, ./testing=12`); `toOwnedUsage` stays module-private; adapter export set unchanged |
| F — lock frozen | UPHELD | `sha256sum deno.lock` = `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` = `git show 0274c0a70:deno.lock \| sha256sum` |

## Static Gates (re-run at head `481dea4b5`)

| Gate          | Command (root `packages/ai`)                                                                 | Result | Evidence                                                          |
| ------------- | -------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| Package tests | `run-deno-test.ts -- --allow-all packages/ai`                                                | PASS   | exit 0; **150 passed, 0 failed**, 2052 ms                         |
| Focused test  | `deno test --allow-all packages/ai/tests/tanstack_chat_client_test.ts`                       | PASS   | 3 passed, 0 failed (positive, mutation-control negative, undefined) |
| Type check    | `run-deno-check.ts --root packages/ai --ext ts,tsx`                                          | PASS   | 101 files selected, 0 occurrences                                 |
| Lint          | `run-deno-lint.ts --root packages/ai --ext ts,tsx`                                           | PASS   | 101 files, 0 findings                                             |
| Format        | `run-deno-fmt.ts --root packages/ai --ext ts,tsx`                                            | PASS   | 101 files, 0 findings                                             |
| Quality scan  | `scan-code-quality.ts --root packages/ai --max-allow 0`                                      | PASS   | `ok:true`, findings [], allowances 0, exit 0                      |
| Doctrine      | `check-doctrine.ts --root packages/ai --text`                                                | PASS   | exit 0; FAIL=0 WARN=1 (pre-existing F-16 `src/ports`=13)          |
| JSR audit     | `audit-jsr-package.ts --root packages/ai --text`                                             | PASS   | exit 0; dry-run OK; slowTypeWarnings=1; findings=2 (both base)    |
| Doc lint      | `deno task doc:lint --root packages/ai --pretty`                                             | BASE RED (non-increase held) | exit 1; 9 failing entrypoints; 128 private refs (agent=20, anthropic=5, mod=26, ollama=5, openai-compatible=8, openrouter=5, ports=35, testing=17, tools=7); missing JSDoc 0 — identical to `research.md` baseline |
| Lock          | `sha256sum deno.lock`                                                                        | PASS   | `edfa0c24…89d1820c`, byte-identical to base                       |

Runtime/Aspire/scaffold/E2E/Docker: N/A per leaf constraint (no runtime commands run). File count
moved 100 → 101 solely because of the ceiling-listed new test file; tests 20 → 21 files (JSR audit:
`tests: 21 files`), as contracted.

## Fitness Gates

| Gate | Function                 | Result | Evidence                                                            |
| ---- | ------------------------ | ------ | ------------------------------------------------------------------- |
| F-5  | Public surface audit     | PASS   | surface counts byte-identical; corpus diff empty; no new export     |
| F-6  | JSR publishability       | PASS   | exit 0, dry-run OK, 1 slow warning ≤ base 1, 2 findings ≤ base 2    |
| F-7  | Doc-score                | PASS   | doc-lint exact non-increase (9 entrypoints / 128 refs / 0 JSDoc)    |
| F-10 | Regression behavior      | PASS   | focused test 3/3; package suite 150/150                             |
| F-15 | Re-export-of-upstream    | PASS   | `TokenUsage` type-only in internal adapter; no re-export (grep)     |
| F-16 | Folder cardinality       | DEBT_ACCEPTED (pre-existing) | `src/ports`=13, unchanged from base; no new warning           |
| F-19 | Scoped source gates      | PASS   | check/lint/fmt wrappers 0 findings                                  |

## Runtime Gates

| Gate                       | Result | Evidence              |
| -------------------------- | ------ | --------------------- |
| Aspire/scaffold/E2E/Docker | N/A    | prohibited by leaf; not run |
| Provider network           | N/A    | fake adapter, no network |

## Consumer Gates

| Consumer                          | Result | Evidence                                                                 |
| --------------------------------- | ------ | ------------------------------------------------------------------------ |
| Owned per-turn `ChatFinishEvent.usage` | PASS | fixture yields 23-leaf `RUN_FINISHED` through real `chatStream()`; strict identity + deep equality + census all hold |
| Public surface                    | PASS   | JSR audit counts unchanged; corpus untouched                             |
| Terminal multi-turn `done.usage`  | N/A    | unchanged by design (plan D6); no `agent/loop.ts` change in diff         |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                       |
| ----- | ------ | ------------------------------------------------------------------------------ |
| AP-2  | CLEAR  | no new copier/helper; existing seam corrected, body is `return usage;`          |
| AP-9  | CLEAR  | hand-written 3-field subset type removed; upstream `TokenUsage` used            |
| AP-14 | CLEAR  | `import type` only; no upstream type re-exported (surface counts unchanged)     |
| AP-22 | CLEAR  | no barrel/subpath/entrypoint change                                             |
| AP-25 | CLEAR  | fake adapter only; no network/environment/load-time side effects                |
| other | N/A    | outside run scope                                                              |

## Arch-Debt Delta

| Metric                | Count | Evidence                                        |
| --------------------- | ----- | ----------------------------------------------- |
| New entries           | 0     | no doctrine scan change (WARN=1, same as base)  |
| Resolved entries      | 0     | —                                               |
| Deepened violations   | 0     | F-16 `src/ports`=13 unchanged                   |
| Unrecorded violations | 0     | —                                               |

## Findings

| Severity | Finding                                                                                                                                                                             | Evidence                                                                 | Required action |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------- |
| low      | The in-test mutation-control negative feeds only the wholesale 3-field projection; single-field-drop and wrong-destination sensitivity are implied by deep equality, not directly asserted in the test file. Independently verified: the oracle (real `@std/assert` + verbatim census) throws on a single dropped nested leaf, a dropped top-level leaf, a within-object swap, a cross-detail swap, and a structural non-identical copy. | oracle probe output (this evaluation); `tanstack_chat_client_test.ts:126-133` | optional hardening only; plan-conformant as written (D5 specifies the old three-field projection) |
| low      | `EXPECTED_USAGE_LEAF_COUNT = 23` pins the fixture census, but a future upstream *optional* field would not fail `satisfies TokenUsage`; fixture updates rely on the worklog contributor path. | `tanstack_chat_client_test.ts:46-48`; `worklog.md` "Contributor Path"     | none (documented run discipline) |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Zero-copy boundary mapping removes omission lists | Return the upstream object by identity instead of rebuilding field-by-field | Archetypes 4 (adapter seams) | high |

## Verdict

| Field     | Value        |
| --------- | ------------ |
| Verdict   | `PASS_IMPL`  |
| Rationale | All six adversarial claims (A–F) verified against primary evidence; every re-run gate matches or beats its exact non-increase contract; red/green causality proven by commit content plus an identical RED↔HEAD test diff; no scope, surface, corpus, or lock drift. |
