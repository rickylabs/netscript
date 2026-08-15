# Worklog — scaffold-generated-output-correctness

## Design

- Public surface: generated project output; existing CLI module exports remain unchanged.
- Domain vocabulary: representative seed row, empty schema, defined NOT_FOUND, OpenAPI projection,
  SQLite/libSQL URL, provider-selected helper emission.
- Ports: existing template renderer, database scaffolder/generators, Prisma client, and NetScript
  contract errors only; no parallel generator or error abstraction.
- Constants: immutable base `01e0960494c95ce56eb35892c211a095eb13e6ed`; exactly one grouped runtime
  verdict; Prisma missing-record code `P2025` at the translation boundary.
- Commit slices: harness/bootstrap; provider output; seed; 404 behavior; shared acceptance; leased
  merge-readiness.
- Deferred scope: anything outside #1262/#1263/#1588 and the declared file boundary.
- Contributor path: focused generator/template tests, existing live DB verifier, structured package
  reporters, then one leased runtime smoke.

## Events

| UTC                  | Event                                                                                                                           | Evidence                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 2026-08-13T20:22:40Z | Attached implementation session matched requested OpenAI `gpt-5.6-sol` high route.                                              | `codex-thread-ids.md`                        |
| 2026-08-13T20:38:25Z | Verified exact immutable head, branch, and absence of upstream before work.                                                     | raw Git read-only checks                     |
| 2026-08-13T20:38:25Z | Reconciled all three live issues and current milestone state.                                                                   | `research.md`                                |
| 2026-08-13T20:38:25Z | Ran independent red-first probes: #1262 red; #1263 runtime red; #1263 OpenAPI projection already green; #1588 red.              | `research.md`; `receipts/red-first.md`       |
| 2026-08-13T20:38:25Z | Classified Archetype 6, audited public/JSR seams, and locked a six-slice design.                                                | `research.md`; `plan.md`                     |
| 2026-08-13T20:38:25Z | Stopped before source edits on two frozen-boundary gaps and selected mandatory PLAN-EVAL.                                       | `drift.md`; `plan.md`                        |
| 2026-08-13T20:41:24Z | Pushed the artifact-only head by explicit refspec and opened draft PR #1654 direct to `main`, with plain issue references only. | `88b735a36`; PR #1654                        |
| 2026-08-13T20:42:08Z | Applied milestone `0.0.7`, required area/type/priority/wave/gate taxonomy, and exactly one phase label (`status:plan`).         | PR #1654                                     |
| 2026-08-13T20:43:00Z | Posted structured RESEARCH and PLAN phase summaries; requested contract disposition before separate PLAN-EVAL.                  | PR #1654 comments `5286159434`, `5286161295` |
| 2026-08-13T20:46:05Z | Coordinator authorized the exact generator/scaffolder amendment, retained regression-only treatment of the already-green #1263 OpenAPI projection, and denied an expensive-gate lease. | PR #1654 comment `5286194892`; `drift.md` |
| 2026-08-13T20:50:16Z | Reconciled the late thread-identity edit, replaced direct Codex steering with the exact Deno-suite same-thread command, and recorded the PLAN-EVAL allowance-reset pause. | `codex-thread-ids.md`; `context-pack.md`; `plan.md` |
| 2026-08-14T23:42:17Z | PLAN-EVAL cycle 1 recorded `FAIL_PLAN`; same-thread repair chose memory exclusion (OD-1b), fixed the empty-schema generator contract (OD-2), added exact proves/gate/files slice accounting including `generate-engine-mod.ts`, and verified the existing tutorial baseline-row claim by inspection. No product file or gate was touched. | `plan-eval.md`; `plan.md`; `context-pack.md` |
| 2026-08-14T23:54:02Z | Fresh opposite-family PLAN-EVAL cycle 2 recorded `PASS` against `5b3c6fcf2`; evaluator commit `b8fc5eb53` authorizes ordered implementation slices 2–5 but grants no runtime lease. | `plan-eval.md`; PR comment `5299298009` |
| 2026-08-15T00:05:12Z | Slice 2 selected provider-marked helper blocks before emission, retained SQLite/libSQL plus the generated typed client, regenerated the embedded asset through `gen:assets-barrel`, and cleared its decisive and required package gates. | generator tests; `quality:scan`; `arch:check` |
| 2026-08-15T00:05:12Z | Slice 2 reconcile: #1262/#1263/#1588 remain open, PR #1654 remains draft at exactly one `status:impl`, cycle-2 PASS is the latest coordinator/evaluator input, and no scope, issue-link, milestone, or closing-keyword adjustment is authorized. | live PR/issue reads |
| 2026-08-15T00:09:09Z | Slice 3 replaced the placebo query with a generated typed `findFirst`/`create` seed, added the truthful direct-call no-model branch, passed resolved model/database names through the scaffolder, regenerated the embedded asset, and cleared its decisive and required package gates. | focused seed/scaffolder tests; `quality:scan`; `arch:check` |
| 2026-08-15T00:09:09Z | Slice 3 reconcile: the only new PR comment is the recorded slice-2 implementation evidence; #1262/#1263/#1588 remain open and PR #1654 remains draft at exactly one `status:impl`. No external finding or authorized lifecycle/scope change appeared. | live PR read; prior live issue reads |
| 2026-08-15T00:13:41Z | Slice 4 gave the persistent generated router a defined `NOT_FOUND` path for missing GET rows, translated only Prisma `P2025` for update/delete, retained the already-green common 404 OpenAPI projection assertion, regenerated the embedded asset, and cleared its decisive and required package gates. | generated-router template tests; `quality:scan`; `arch:check` |
| 2026-08-15T00:13:41Z | Slice 4 reconcile: the only new PR comment is the recorded slice-3 implementation evidence; #1262/#1263/#1588 remain open and PR #1654 remains draft at exactly one `status:impl`. No external finding or authorized lifecycle/scope change appeared. | live PR read; prior live issue reads |
| 2026-08-15T00:19:39Z | Slice 5 extended the existing live database verifier to prove the generated `Seed User` list row, defined `NOT_FOUND` responses for a guaranteed-missing GET/PATCH/DELETE ID, and all three 404 OpenAPI projections in the later shared runtime execution. Its focused, structured check/test/lint/fmt and required package gates are green without starting a runtime. | focused verifier tests; structured wrappers; `quality:scan`; `arch:check` |
| 2026-08-15T00:19:39Z | Slice 5 reconcile: the only new PR comment is the recorded slice-4 implementation evidence; #1262/#1263/#1588 remain open and PR #1654 remains draft at exactly one `status:impl`. No external finding or authorized lifecycle/scope change appeared. | live PR read; prior live issue reads |
| 2026-08-15T03:56:02Z | T-1 bounded fix-up restored the removed MSSQL Aspire loopback regression case without changing the four-engine required/forbidden matrix. The case pins `tcp:` stripping, comma/port parsing with the `1433` default, `127.0.0.1`/`::1`/`[::1]` normalization, and empty-host fallback in generated MSSQL Prisma output. The source-only mutation stayed green because tests consume the embedded registry; regenerating the temporary mutation produced the expected RED, then both product files were restored to their original hashes before the final PASS. | `generators_test.ts`; structured RED/GREEN wrapper output; product-file hashes |
| 2026-08-15T03:56:02Z | T-1 reconcile: PR #1654 remains open and draft at exactly one `status:impl`; its remote head was the immutable fix-up base `cab6d1feb8` before this commit, and the latest external input remained this thread's slice-5 comment. No lifecycle, scope, lease, issue-link, milestone, or closing-keyword change is authorized. | live PR read |
| 2026-08-15T04:02:33Z | The coordinator granted the singleton `scaffold-generated-output-correctness-runtime` lease for one grouped #1262/#1263/#1588 pass from immutable head `ebad68c80`. | coordinator lease at central commit `9ee687ce0` |
| 2026-08-15T04:40:28Z | Attempt 1 was classified as an infrastructure/transport interruption, not a verdict: its preserved suite log has 37 `gate-end` records, zero `suite-end`, and stops at `gate-start database.generate`. The coordinator removed its positively owned stopped containers and re-granted one clean retry. | `.llm/tmp/cli-e2e/plugin-smoke-20260815-060757.log`; coordinator reconciliation |
| 2026-08-15T04:42:00Z | Correct fail-closed refusal: the requested `run-gate.ts --child-report` route could not represent `scaffold.runtime` because the gate is absent from the allowlist and the fixed command writes no standalone JSON report. No command ran, no catalog/argv changed, and no receipt was fabricated. The coordinator withdrew that over-specification and restored the approved suite-owned NDJSON receipt contract. | `.llm/tools/gates/catalog.ts`; `run-gate.ts`; correction brief |
| 2026-08-15T04:53:51Z | Slice 6 retry reached one terminal `suite-end`: exact command raw exit 0, `passed=89 failed=0 skipped=0`. The live verifier proved the representative seeded row, missing GET/PATCH/DELETE defined 404/`NOT_FOUND` behavior, and all three OpenAPI 404 projections. | `receipts/scaffold-runtime.json`; `.llm/tmp/cli-e2e/plugin-smoke-20260815-064348.log` |
| 2026-08-15T04:55:26Z | Post-run cleanup is exact and clean. The suite removed its three final containers; the run-owned labeled Aspire network and second Garnet anonymous volume were removed by exact identity after positive timestamp/creator correlation. Final `aspire ps` is empty, `docker ps -a` is empty, only built-in networks remain, volumes are empty, and leak-check reports no survivors. | `receipts/leak-check.json`; runtime receipt resource identity |

## Gate evidence

| Slice | Evidence | Result |
| ----- | -------- | ------ |
| 2 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/database/generators_test.ts` | PASS, raw exit 0; 9 passed, 0 failed |
| 2 | `deno task quality:scan` | PASS, raw exit 0; 0 findings, 7 pre-existing bounded allowances |
| 2 | `deno task arch:check` | PASS, raw exit 0; no doctrine FAIL rows (warning-only baseline census retained) |
| 2 | `deno task gen:assets-barrel` | PASS, raw exit 0; generated mirror refreshed without hand editing |
| 3 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/database/generate-database-seed_test.ts packages/cli/src/kernel/adapters/database/scaffolder_test.ts` | PASS, raw exit 0; 6 passed, 0 failed |
| 3 | `deno task quality:scan` | PASS, raw exit 0; 0 findings, 7 pre-existing bounded allowances |
| 3 | `deno task arch:check` | PASS, raw exit 0; no doctrine FAIL rows (warning-only baseline census retained) |
| 3 | `deno task gen:assets-barrel` | PASS, raw exit 0; generated mirror refreshed without hand editing |
| 4 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/generated-router-template_test.ts` | PASS, raw exit 0; 3 passed, 0 failed |
| 4 | `deno task quality:scan` | PASS, raw exit 0; 0 findings, 7 pre-existing bounded allowances |
| 4 | `deno task arch:check` | PASS, raw exit 0; no doctrine FAIL rows (warning-only baseline census retained) |
| 4 | `deno task gen:assets-barrel` | PASS, raw exit 0; generated mirror refreshed without hand editing |
| 5 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts` | PASS, raw exit 0; 9 passed, 0 failed |
| 5 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts --file packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts --ext ts` | PASS, raw exit 0; 2 files, 0 diagnostics; `--unstable-kv` applied by the wrapper |
| 5 | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts --file packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts --ext ts` | PASS, raw exit 0; 2 files, 0 findings |
| 5 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts --file packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts --ext ts` | PASS, raw exit 0; 2 files, 0 findings |
| 5 | `deno task quality:scan` | PASS, raw exit 0; 0 findings, 7 pre-existing bounded allowances |
| 5 | `deno task arch:check` | PASS, raw exit 0; no doctrine FAIL rows (warning-only baseline census retained) |
| T-1 probe | Structured decisive test after neutralizing the source asset only | EXPECTED-SEAM DISCOVERY, raw exit 0; 10 passed because the generator test hydrates the embedded registry |
| T-1 probe | `deno task gen:assets-barrel` after temporary source neutralization | PASS, raw exit 0; mirrored the temporary branch into the consumed registry |
| T-1 RED | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/database/generators_test.ts` | EXPECTED FAIL, raw exit 1; restored MSSQL case rejected the missing `127.0.0.1` loopback predicate |
| T-1 restore | `deno task gen:assets-barrel` after restoring the source verbatim | PASS, raw exit 0; restored the embedded file to SHA-256 `2f82179c3dbbb875d9c499aa93704b12d543da8f23ebb9e91b44d0d87147e3d7` |
| T-1 GREEN | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/database/generators_test.ts` | PASS, raw exit 0; 10 structured results passed, 0 failed; source-level `it()` count is 9 |
| T-1 lint setup | Three scoped wrapper attempts using the workspace/member configuration | FAIL-CLOSED, raw exits 2, 2, 2; Deno excluded `packages/cli/`, and the wrapper refused false-green evidence |
| T-1 lint | `run-deno-lint.ts --file packages/cli/src/kernel/templates/database/generators_test.ts --ext ts,tsx` with a temporary no-exclude config preserving the repository `recommended`/`jsr` rules | PASS, raw exit 0; 1 file, 0 findings; temporary config removed |
| T-1 fmt setup | Scoped wrapper attempt using the workspace configuration | FAIL-CLOSED, raw exit 2; Deno excluded `packages/cli/`, and the wrapper refused false-green evidence |
| T-1 fmt | `run-deno-fmt.ts --file packages/cli/src/kernel/templates/database/generators_test.ts --ext ts,tsx` with a temporary no-exclude config preserving repository formatting rules | PASS, raw exit 0; 1 file, 0 findings; temporary config removed |
| T-1 | `deno task quality:scan` | PASS, raw exit 0; 0 findings, 7 pre-existing bounded allowances |
| T-1 | `deno task arch:check` | PASS, raw exit 0; no doctrine FAIL rows (warning-only baseline census retained) |
| T-1 | `git diff --check` | PASS, raw exit 0; no whitespace errors |
| 6 | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS, raw exit 0; terminal `suite-end`; 89 passed, 0 failed, 0 skipped; one authorized retry after the non-verdict transport interruption |
| 6 | `deno task agentic:leak-check -- --slice-dir .llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0 --worktree /home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness` | PASS, raw exit 0; Aspire/Docker probes `ok`; 0 survivors |

## Slice 2 test-consolidation accounting — T-1

Slice 2 changed the source-level `it()` count from 11 to 8 by replacing five cases with the
four-engine matrix plus one stronger SQLite construction case. T-1 raises the count to 9 without
altering any matrix entry or forbidden-symbol assertion.

| Removed case | Disposition | Specific current coverage |
| ------------ | ----------- | ------------------------- |
| `generates Prisma config with Aspire env key and sqlite fallback URL` | **Subsumed by the matrix.** | SQLite `engineRequired` pins `resolveConnectionString('PRIMARY_DB_URI', 'file:./alpha_app.db')`; `prismaRequired` pins the direct `defineConfig` import and `'file:./alpha_app.db'`; its forbidden list excludes all server normalizers/parsers. The dedicated SQLite construction case additionally pins the env-key → `DATABASE_URL` → fallback chain. |
| `generates Prisma config with the env import and fallback for postgres` | **Subsumed by the matrix.** | PostgreSQL `prismaRequired` pins `defineConfig, env`, `env('DATABASE_URL')`, and `normalizePostgresUrl`. |
| `normalizes mssql Aspire loopback endpoints to hostname URLs` | **Restored here.** | The additive case pins generated `tcp:` stripping, `[host, port]` splitting, the `1433` default, all three loopback spellings, and empty-host fallback. |
| `generates engine modules with adapter setup where required` | **Subsumed by the matrix.** | MSSQL `engineRequired` pins `PrismaMssql`, `MssqlClient`, and `normalizeMssqlUrl`; the same matrix iteration generates both engine-module and Prisma-config output while forbidding PostgreSQL/MySQL helpers. |
| `constructs the sqlite engine module with the libsql driver adapter` | **Subsumed by the matrix.** | SQLite `engineRequired` pins `PrismaLibSql`, `SqliteClient`, and the exact config-key/file fallback; the retained dedicated case strengthens this with the typed client import, both `PrismaLibSql` construction sites, and the no-adapter prohibition. |

The coordinator-owned lease was granted and consumed by the terminal slice-6 retry. Its one
`suite-end` verdict is shared by all three issues; the interrupted first attempt remains explicitly
non-verdict evidence and is not reused as acceptance.

Red-first probes are defect evidence, not green gate receipts. Durable gate receipt generation
begins only after an approved plan and implementation.

Implementation note: PLAN-EVAL cycle 2 and implementation slices 2–6 are complete. PR #1654
remains draft at exactly one phase label, `status:impl`; substantive Tier-A review and a fresh
opposite-family IMPL-EVAL remain external stops. No publish, merge, ready flip, or self-certification
has occurred.
