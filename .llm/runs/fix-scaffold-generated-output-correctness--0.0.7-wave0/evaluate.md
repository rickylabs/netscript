# Evaluation: scaffold-generated-output-correctness (#1262 / #1263 / #1588) — IMPL-EVAL cycle 1

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field            | Value                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Run ID           | `fix-scaffold-generated-output-correctness--0.0.7-wave0`                                                  |
| Target           | PR #1654 `fix(cli): correct generated scaffold output`, branch `fix/scaffold-generated-output-correctness` |
| Archetype        | 6 — CLI/tooling                                                                                           |
| Scope overlays   | none                                                                                                      |
| Evaluated head   | `f178ac663597a7b9cfd2e6a528026426d39d1173` (local HEAD = `git ls-remote origin` = PR `headRefOid`)         |
| Product head     | `0b2cf5e7c85a8194c77f1a08364b8a5879d7b393` (`git diff --name-only 0b2cf5e7c..f178ac663 -- . ':(exclude).llm/**'` is empty) |
| Immutable base   | `01e0960494c95ce56eb35892c211a095eb13e6ed` (= `git merge-base HEAD origin/main`)                          |
| Evaluator        | fresh native Claude session, 2026-08-15; separate from Codex implementer thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` and from Tier-A reviewer session `c7597d28-6774-44c9-aa00-b8b40b776165` |
| Requested route  | `formal_impl_evaluation` lane for Codex-authored work: native Claude **Fable 5 · medium** (`lane-policy.md` line 46) |
| Observed route   | `claude-fable-5`, `--effort medium`, `--remote-control` (job `state.json` `respawnFlags`)                   |
| Session ID       | `19f1be7b-db7d-47c0-b0f1-7cfca302d44a`                                                                     |
| Bridge ID        | `session_01Qs22iAtnVYh2fLb26ABvja` (from `~/.claude/sessions/105686.json` `bridgeSessionId`)              |
| Remote Control   | `https://claude.ai/code/session_01Qs22iAtnVYh2fLb26ABvja`                                                 |
| PID / cwd        | `105686` / `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness`                   |
| Expensive gates  | none rerun; lease consumed. Only read-only inspection and structured focused wrappers were executed.        |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` § Verdict = `PASS` (cycle 2) at evaluator commit `b8fc5eb53`; first product commit `32cd429c0` follows it in `git log 01e0960..HEAD` |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` (public surface, vocabulary, ports, constants, slices, deferred scope, contributor path) |
| Commit slices match design plan        | `PASS` | Plan slices 2–6 ↔ `32cd429c0`, `275ae091c`, `589a01a55`, `cab6d1feb`, `0b2cf5e7c` in order; `ebad68c80` is the recorded T-1 additive fix-up; `f178ac663` is the Tier-A sign-off (artifact-only) |
| Each slice has a passing gate          | `PASS` | Per-slice decisive gates in `worklog.md` § Gate evidence; independently re-executed here (see Static Gates) |
| Product delta confined to plan file list | `PASS` | `git diff --stat 01e0960..HEAD -- . ':(exclude).llm/**'` = exactly the 16 files enumerated in `plan.md` § Authorized boundary amendment; no other product file |
| Slice-6 evidence-only                  | `PASS` | `git diff --name-only ebad68c80..0b2cf5e7c -- . ':(exclude).llm/**'` → 0 files |
| Lock hygiene                           | `PASS` | `git diff --quiet 01e0960..HEAD -- deno.lock` → unchanged |
| No wrapper-greening suppressions       | `PASS` | `git diff 01e0960..HEAD -- . ':(exclude).llm/**' \| grep '^+.*(deno-lint-ignore\|quality-allow\|as any\|as unknown as)'` → none; `quality-allow` count in `embedded.generated.ts` 0 → 0 |
| Every brief carries `## SKILL`         | `PASS` | `implement.md` line 3 `## SKILL` |
| No speculative seams (unused files)    | `PASS` | new `generate-database-seed.ts` is consumed by `scaffolder.ts` and re-exported by `database-generators.ts`; `renderProviderConnectionHelpers` consumed by `generate-prisma-config.ts` |
| Constants used for finite vocabularies | `PASS` | verifier: `MISSING_ROW_ID`, `CRUD_BY_ID_PATH`, `CRUD_404_METHODS as const`; router: single `isPrismaNotFound` guard on `'P2025'` |

## Static Gates (independently re-executed at head `f178ac663`)

| Gate | Command or check | Result | Evidence |
| ---- | ---------------- | ------ | -------- |
| Focused decisive tests (slices 2,3,4,5 + T-1) | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/database/generators_test.ts packages/cli/src/kernel/templates/database/generate-database-seed_test.ts packages/cli/src/kernel/adapters/database/scaffolder_test.ts packages/cli/e2e/tests/application/gates/generated-router-template_test.ts packages/cli/e2e/tests/application/gates/verify-live-db-endpoint_test.ts` | `PASS` | raw exit 0; `{"passed":28,"failed":0,"ignored":0}` |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/templates/database --root packages/cli/src/kernel/adapters/database --ext ts` | `PASS` | raw exit 0; 26 files, 0 diagnostics (`--unstable-kv` applied by wrapper) |
| Asset freshness | `deno task check:assets-barrel` | `PASS` | raw exit 0; regenerated barrel byte-identical to committed `embedded.generated.ts` |
| Quality scan | `deno task quality:scan` | `PASS` | raw exit 0; `ok:true`, `findings:[]`, `allowCount:7` (all pre-existing, none in a touched file) |
| Doctrine fitness | `deno task arch:check` | `PASS` | raw exit 0; `FAIL=0` on every census row (warning-only baseline retained) |
| Doc lint | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/cli` | `PASS` | exit 0; `./mod.ts`, `./scaffolding.ts`, `./testing.ts` → 0 errors, 0 private-type refs, 0 missing JSDoc |
| Publish dry-run | `deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts --member packages/cli` | `PASS` | exit 0; `Success Dry run complete` |
| Format / Lint on touched files | recorded per slice in `worklog.md` (structured wrappers, raw exit 0) | `PASS` | slice-5 and T-1 wrapper rows; not re-run here beyond typecheck (no formatting change since) |
| Rendered SQLite / PostgreSQL output inspection | ad-hoc render of `generateEngineMod`/`generatePrismaConfig` for `sqlite` and `postgres` (read-only, temp file removed) | `PASS` | SQLite output: `resolveConnectionString('SQLITE_URI', 'file:./alpha.db')`, `PrismaLibSql`, typed `SqliteClient`, identity `normalizeDatabaseUrl`, **no** postgres/mysql/mssql parser; PostgreSQL output retains only `normalizePostgresUrl`/`parseConnectionParts`/`readConnectionPart` |

## Fitness Gates

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-3 / F-4 / F-11 / F-12 / F-14 … | doctrine census | `PASS` | `deno task arch:check` FAIL=0 |
| F-5  | Public surface audit | `PASS` | `packages/cli/deno.json` exports unchanged; no `src/public` change; `database-generators.ts` barrel gained one internal re-export |
| F-6  | JSR publishability | `PASS` | CLI publish dry-run success; doc lint 0 |
| F-19 | Scoped source gate runners | `PASS` | all evidence above from `.llm/tools/run-deno-*.ts` structured wrappers, not raw root CLI |
| others | | `N/A` | not affected by this delta |

## Runtime Gates (evidence read from committed receipts and preserved logs; not rerun)

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| `scaffold.runtime` grouped verdict | `receipts/scaffold-runtime.json` | `PASS` | `outcome:PASS`, `rawExitCode:0`, `gitHead:ebad68c80…` (product-identical to head), `lease:scaffold-generated-output-correctness-runtime`, `attempt:2`, `summary {passed:89,failed:0,skipped:0}` |
| Terminal suite record | `.llm/tmp/cli-e2e/plugin-smoke-20260815-064348.log` | `PASS` | sha256 `aabf2bbc…` matches receipt `source.sha256`; 88 `gate-end`, exactly 1 `suite-end` with `report.ok:true`; 0 `gate-end` with a failed verdict |
| Attempt-1 classification | `.llm/tmp/cli-e2e/plugin-smoke-20260815-060757.log` | `PASS` | sha256 `4e79d1c6…` matches `priorAttempt.sha256`; 37 `gate-end`, 0 `suite-end`, last record `gate-start database.generate` → infrastructure interruption, non-verdict; grep of run artifacts shows the log referenced only in interruption/non-reuse context |
| #1262 seeded row | `.liveDbReceipt.value.crud.representativeId = 1`; `database.seed` gate-end `verdict:passed` | `PASS` | verifier throws unless a list row with `name === 'Seed User'` exists (`verify-live-db-endpoint.ts` `verifyGeneratedCrudAcceptance`) — genuine assertion, not a mere pass-through |
| #1263 defined 404 | `.liveDbReceipt.value.crud.missingId = 2147483647`; `behavior.live-db-endpoint` `critical:true`, `verdict:passed` | `PASS` | `assertDefinedNotFound` requires HTTP 404 **and** wire `code === 'NOT_FOUND'` for GET, PATCH, DELETE |
| #1263 OpenAPI projection | `.liveDbReceipt.value.crud.projected404Methods = ['get','patch','delete']` | `PASS` | `assertCrud404Projection` requires `'404' in responses` for each method under `/users/{id}` in the live `/api/openapi.json` |
| #1588 composition | `database.generate` `--db postgres` gate-end passed; runtime type-check of generated workspaces passed within the suite | `PASS` (composition) | postgres-only; see T-2 below |
| Leak check | `receipts/leak-check.json` | `PASS` | `outcome:PASS`, probes `ok`, `survivors:[]`, `foreignOrUnknownTouched:[]`; my own read-only `docker ps -a` → empty and `aspire ps` → no running AppHost at evaluation time |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Generated project (postgres) | live users service list/GET/PATCH/DELETE/OpenAPI via `behavior.live-db-endpoint` | `PASS` | receipt above |
| Generated project (sqlite) | runtime | `NOT_RUN` | intentionally not part of the leased postgres pass; generator-output proof only (T-2) |

## Grouped acceptance vs live issue bodies

| Issue | Acceptance item | Result | Evidence |
| ----- | --------------- | ------ | -------- |
| #1262 | seed writes ≥1 representative row per generated model, or prints an explicit no-model message | `PASS` | `generate-database-seed.ts` typed `findFirst`/`create` on the resolved model with `name: 'Seed <Model>'`; direct no-model branch prints "No database model is available; no seed rows were written."; runtime `representativeId:1` |
| #1262 | a test fails if the seed stops writing rows | `PASS` | `generate-database-seed_test.ts` asserts `client.product.create({` and absence of `$queryRaw`; `scaffolder_test.ts` asserts the same on scaffolded `seed.ts` |
| #1262 | tutorial/docs seed steps verified | `PASS` (by inspection, as approved in plan) | `docs/site/data-persistence/database.md` "baseline rows" claim now truthful; no docs edit required by the approved plan |
| #1263 | by-id/update/delete throw defined NOT_FOUND | `PASS` | template `notFound({ errors, … })` (`@netscript/contracts` `notFound(): never` throws the contract `NOT_FOUND`); `P2025`-only translation on update/delete, others rethrown; runtime 404/`NOT_FOUND` receipt |
| #1263 | OpenAPI documents 404 for those operations | `PASS` | preserved (already green at base); regression-asserted in template test + live `assertCrud404Projection` |
| #1263 | scaffold-level test covers missing-row → 404 for each by-id op | `PASS` | template-level test pins the three `notFound` sites; behavior proven per operation by the live verifier inside `scaffold.runtime` |
| #1588 | SQLite output resolves only SQLite/libSQL URL; retains `PrismaLibSql` + typed client; other engines get only their own normalizer | `PASS` | four-engine required/forbidden matrix in `generators_test.ts` (10/10) plus my direct render inspection above |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| -- | ------ | -------- | ----- |
| AP-5 (inheritance depth) | `N/A` | pre-existing `ScaffoldError` warning untouched | |
| AP-13 (`any`/casts) | `CLEAR` | `quality:scan` 0 findings; grep for `as any`/`as unknown as` in delta → none | |
| catch-all masking | `CLEAR` | narrow `P2025` guard, `throw error` for everything else (2× in template) | plan risk register control satisfied |
| parallel abstraction | `CLEAR` | reused existing template renderer, `notFound` contract helper, `@std/text` `toCamelCase` | |
| others | `N/A` | outside this delta | |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | `git diff --stat 01e0960..HEAD -- .llm/harness/debt/arch-debt.md` empty |
| Resolved entries | 0 | — |
| Deepened violations | 0 | `arch:check` FAIL=0; E2E directory extended (existing verifier), no new gate sibling |
| Unrecorded violations | 0 | none found |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking) | **T-2 confirmed:** the leased runtime verdict is postgres-only (0 sqlite occurrences in the retry log). #1588's acceptance is a generator-output property and is proven by the four-engine matrix plus my render inspection; runtime SQLite composition is unproven in this leaf. The `scaffold-runtime-sqlite` CI job runs on a PR only with `ci:full`, or `e2e-cli-gate` + classifier `run_runtime_sqlite`; on the draft everything skips by documented policy (`ci.yml` lines 27–30, `e2e-cli.yml` line 349). | render output; `e2e-cli.yml` | Coordinator decision (see Residual) — not a `FAIL_FIX`; the approved plan never promised runtime SQLite coverage |
| low (accuracy, non-blocking) | `review-tier-a.md` § Evidence-chain observation states `packages/cli/e2e/cli.ts` "exposes no `--report` flag". That is inaccurate: `e2e:cli run --report <path>` exists at the immutable base (`packages/cli/e2e/src/presentation/cli/commands/run-command.ts` line 30, `git show 01e0960:…`) and CI uses it (`e2e-cli.yml` line 406). The genuine gap is only that `run-gate.ts`/`catalog.ts` has no `scaffold.runtime` entry. The receipt actually produced is complete and correct, and the approved plan's fixed command (no `--report`) was honored, so the verdict is unaffected. | file lines cited | Correct the note before filing the "repo-level gap" issue so it targets only the run-gate catalog |
| info | Slice-4 decisive test is textual (template string assertions), not a behavior test; the behavior for GET/PATCH/DELETE is proven by the live verifier inside the grouped runtime run. Together they satisfy #1263 acceptance item 3. | `generated-router-template_test.ts`; verifier | none |
| info | Draft-PR CI (`ci`, `Code quality`, `e2e-cli`, `public-surface-diff`) is `skipped` for every head on this branch by documented draft policy; required-context CI materializes only at `ready_for_review`. The local structured gates above stand in until then. | `gh run list --branch …` | Coordinator: expect CI to run at ready flip; the `e2e-cli-gate` label is what would make the runtime/sqlite jobs execute |

## Residual decision for the coordinator (not taken here)

Choose one before the ready flip: **(a)** accept generator-output proof for #1588 (defensible; the issue's expected outcome is textual and is met), or **(b)** apply `e2e-cli-gate` (or `ci:full`) at ready time so `scaffold-runtime-sqlite` executes in CI as one cheap runtime composition check. This evaluator recommends **(b)** as a zero-cost-to-the-leaf hedge, but does not require it for `PASS`.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Verify tool-surface claims in supervisor sign-offs | A sign-off asserting a flag/route "does not exist" should cite the file line; here `--report` did exist | all archetypes | medium |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | Approved scope (#1262/#1263/#1588 on the exact 16-file boundary) is complete; PLAN-EVAL cycle-2 `PASS` preceded implementation; every slice's decisive gate and the required package gates re-execute green at head; the single leased `scaffold.runtime` receipt is internally consistent (hashes, counts, terminal `suite-end`, exit 0) and its `crud` payload comes from a verifier that genuinely asserts the seeded row, the three defined 404s, and the three OpenAPI projections; attempt 1 is correctly non-verdict and unreused; `deno.lock` untouched; no suppressions introduced; no debt delta. T-2 is a real but non-blocking residual for the coordinator. |

Standing constraints honored: no expensive gate rerun, no product change, PR #1654 stays draft at
`status:impl`, no label/milestone/closing-keyword/ready mutation, no second evaluation cycle.
