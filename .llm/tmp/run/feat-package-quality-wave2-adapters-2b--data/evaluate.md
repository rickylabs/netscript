# Evaluation: Sub-wave 2b — data adapters (kv · database · prisma-adapter-mysql)

IMPL-EVAL (final pass) for Sub-wave 2b only. Sub-waves 2a (merged) and 2c are separate
branches/PRs and out of scope for this verdict.

## Metadata

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Run ID         | `feat-package-quality-wave2-adapters-2b--data`                              |
| Target         | `packages/kv`, `packages/database`, `packages/prisma-adapter-mysql`         |
| Archetype      | A2 — Integration                                                            |
| Scope overlays | `SCOPE-docs.md`                                                             |
| Evaluator      | IMPL-EVAL session, 2026-06-07 (deno 2.8.2)                                  |
| Branch / head  | `feat/package-quality-wave2-adapters-2b` @ `b647691` + 1 evaluator fix      |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | Combined Wave 2 plan PLAN-EVAL = `PASS` (Option A); 2b implements locked slices (per PR description / plan §"Sub-wave 2b") |
| Design section exists in worklog       | PASS   | `worklog.md` § "Design" — surface, vocabulary, ports, composition roots, permissions, consumer impact, contributor path |
| Commit slices match design plan        | PASS   | `5774c18` kv (slices 1-8), `8cab1d7` database (9-17), `9ceb9c7` prisma (18-22), consumer gate (23)                       |
| No speculative seams (unused files)    | PASS   | publish dry-run file lists contain only package-owned contracts/docs/adapters; no orphaned exports                      |
| Constants used for finite vocabularies | PASS   | adapter technology names and KV provider variants are typed; no inline magic strings introduced by the run              |

## Static Gates (independently re-run, deno 2.8.2)

| Gate            | Command                                                         | Result | Evidence                                                                                  |
| --------------- | -------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Typecheck       | `deno task --cwd <pkg> check`                                  | PASS   | kv, database, prisma all clean (database clean **after** evaluator slow-type fix below)    |
| Doc lint        | `deno doc --lint <all exports>` per package                    | PASS   | kv `Checked 4 files`; database `Checked 10 files`; prisma `Checked 1 file` (npm type-resolution warnings only) |
| Publish dry-run | `deno task --cwd <pkg> publish:dry-run`                        | PASS   | all three `Success Dry run complete`, **0 slow types** (no `--allow-slow-types`)           |
| Lint            | `deno task --cwd <pkg> lint`                                   | PASS   | database `Checked 19 files` 0 problems; scoped lint clean                                  |
| Format          | `deno fmt --check packages/{kv,database,prisma-adapter-mysql}` | PASS   | `Checked 90 files` clean                                                                   |
| Tests           | `deno task --cwd <pkg> test`                                   | PASS   | kv `78 passed`; database `3 passed`; prisma `8 passed`; 0 failed                           |
| README ≥150 LOC | `wc -l README.md`                                              | PASS   | kv 161, database 249, prisma 302                                                           |

## Fitness Gates (Archetype A2 — gate matrix is source of truth)

| Gate | Function                          | Result | Evidence                                                                                          |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| F-1  | File-size lint                    | WARN   | scoped doctrine reports large files (kv redis/deno-kv/denokv-bridge/memory; database sql-json/mssql; prisma adapter) — pre-existing WARN-only, recorded as residual debt |
| F-2  | Helper-reinvention scan           | PASS   | no reinvented shared helpers introduced                                                           |
| F-3  | Layering check                    | PASS   | kv `bridges/`→`adapters/`, `core/`→`application/`; database `interfaces/`→`ports/` (AP-17 resolved) |
| F-4  | Inheritance audit                 | N/A    | no new abstract bases in target packages                                                          |
| F-5  | Public surface audit              | PASS   | kv adds `./testing`; database adds `./ports` + `./testing`; prisma narrowed to package-owned surface |
| F-6  | JSR publishability                | PASS   | publish dry-run 0 slow types on all three                                                         |
| F-7  | Doc-score gate                    | PASS   | `/docs` per STANDARDS §7; doc-lint clean on every export entrypoint                                |
| F-8  | Workspace lib check               | PASS   | package `check` tasks pass                                                                        |
| F-9  | Permission declaration check      | PASS   | docs declare KV/network/db permissions; `--unstable-kv` used where required                        |
| F-10 | Test-shape audit                  | PASS   | adapter-contract + docs-example fixtures; named, behavior-asserting tests                          |
| F-11 | Forbidden-folder lint             | PASS   | no forbidden folder segments in target packages                                                  |
| F-12 | Naming-convention lint            | PASS   | adapters named by technology (`redis`, `deno-kv`, `postgres`, `mssql`, `mysql`)                   |
| F-13 | Saga/runtime invariants           | N/A    | not a saga/runtime archetype                                                                      |
| F-14 | Console-log lint                  | PASS   | runtime `console.*` removed from touched package source; example scripts excluded from publish    |
| F-15 | Re-export-upstream lint           | PASS   | database root no longer re-exports upstream `PrismaPg`; prisma keeps conversion/error helpers internal |
| F-16 | Folder-cardinality lint           | PASS   | `adapters/`, `application/`, `ports/`, `testing/` each hold ≥2 siblings or are justified           |
| F-17 | Abstract-derived co-location      | N/A    | no abstract/derived split introduced                                                             |
| F-18 | Sub-barrel lint                   | PASS   | exports route through package `mod.ts` / subpath barrels                                          |

Scoped doctrine (`.llm/tools/fitness/check-doctrine.ts --root <pkg>`): kv `FAIL=0 WARN=5`, database
`FAIL=0 WARN=5`, prisma `FAIL=0 WARN=1`. All residuals are WARN-only and pre-existing
(file size, one `any` in kvdex export, database script `Deno.exit`, database `export default`).

## Consumer Gates

| Consumer            | Validation                       | Result | Evidence                                                                              |
| ------------------- | -------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| plugins/sagas       | `deno task --cwd plugins/sagas check`    | PASS   | clean                                                                                  |
| plugins/triggers    | `deno task --cwd plugins/triggers check` | PASS   | clean                                                                                  |
| plugins/workers     | `deno task --cwd plugins/workers check`  | PASS   | clean                                                                                  |
| removed `@netscript/database/interfaces` | repo grep | PASS   | zero `.ts` consumers of the removed subpath; new `./ports` referenced as designed       |
| removed database root `PrismaPg` re-export | repo grep | PASS   | CLI imports `PrismaPg` from `@prisma/adapter-pg` directly (template string), not the database root |
| packages/cli        | `deno task --cwd packages/cli check`     | FAIL (out of scope) | TS9016/TS9027 on `src/maintainer/.../copy-official-plugin.ts:205` `_internal` shorthand — **identical on base `e5d54e2`, not touched by 2b** |
| plugins/streams     | `deno task --cwd plugins/streams check`  | FAIL (out of scope) | TS9007/TS9027 on `src/e2e/probes/probe-context.ts` `probePayloadSchema` — **identical on base `e5d54e2`, not touched by 2b** |

The two failing consumer checks are pre-existing isolated-declarations debt in files the 2b run
never touched; both fail identically on the integration base `e5d54e2`. The 2b change surface
(database `ports` rename, database root re-export removal, prisma root narrowing, kv internal
folder renames) does not break any consumer that imports the affected public surfaces.

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                  |
| ----- | ------ | ----------------------------------------------------------------------------------------- |
| AP-1  | N/A    | god-file consolidation deferred; WARN-only file sizes recorded as residual                |
| AP-9  | DEBT   | large files remain WARN-only in all three packages (pre-existing; residual debt)          |
| AP-16 | CLEAR  | folder cardinality satisfied after renames                                                |
| AP-17 | CLEAR  | database `interfaces/`→`ports/` resolves the consumed-contract folder violation           |
| AP-19 | DEBT   | database `extensions/sql-json.extension.ts` `export default` remains WARN-only            |
| AP-23 | DEBT   | one `any` in `kv/adapters/kvdex.ts:32` exported declaration remains WARN-only             |

## Findings

| Severity | Finding                                                                                                   | Evidence                                                                                       | Required action |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| high     | `@netscript/database` failed `check` / `publish:dry-run` with 7 slow-type errors on `jsonUtils` shorthand object | `extensions/sql-json.extension.ts:572` TS9016/TS9027 (and TS9013 with naive `key: value` expansion) | **FIXED in this session** — annotated `jsonUtils` with an explicit object type using inline function signatures (no private-type refs), so both isolated-declarations and `private-type-ref` doc-lint pass |
| low      | Generator worklog/context-pack claimed CLI + streams consumer checks PASS                                 | `worklog.md` slice 23; observed FAIL here                                                       | recorded as drift; failures are pre-existing/out-of-scope (see Consumer Gates) |
| low      | Repo-wide `arch:check` not green (57 FAIL)                                                                | dominated by out-of-scope CLI/plugin debt; scoped target packages `FAIL=0`                      | already recorded in `drift.md`; out of 2b scope |

## Evaluator Fix Applied

One in-scope code fix (surface = a single file) was required to bring `@netscript/database`
to the locked Definition of Done (0 slow types, doc-lint clean):

- `packages/database/extensions/sql-json.extension.ts` — gave the public `jsonUtils` const an
  explicit object type annotation using inline function signatures (built only from public types:
  `unknown`, `string`, `Record<string, unknown>`, `readonly string[]`, `boolean`, `void`). This
  satisfies `--isolatedDeclarations` without referencing the private util functions by name, so it
  also keeps `deno doc --lint` free of `private-type-ref` errors.

Verification after fix: database `check` PASS, doc-lint `Checked 10 files`, `publish:dry-run`
`Success` (0 slow types), `test` 3 passed, `fmt --check` clean.

## Verdict

| Field     | Value                                                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                  |
| Rationale | Approved 2b scope is complete for all three packages. Static, doc, publish, test, README, and scoped fitness gates pass; the one blocking slow-type/doc-lint defect in `@netscript/database` was a narrow single-file fix applied this session. The two failing consumer checks (CLI, streams) are pre-existing isolated-declarations debt outside the 2b change surface and fail identically on base `e5d54e2`; they are not introduced or deepened by this run. No new unrecorded doctrine violations. |
