# Evaluation: Wave 1 — Contracts & schemas (`@netscript/config`, `@netscript/contracts`, `@netscript/runtime-config`)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `feat-package-quality-wave1-contracts--contracts` |
| Target         | `@netscript/config`, `@netscript/contracts`, `@netscript/runtime-config` |
| Archetype      | 1 — Small Contract (all three)                    |
| Scope overlays | none                                              |
| Evaluator      | IMPL-EVAL, separate session, 2026-06-06           |

## Process Verification

| Check                                  | Result | Evidence                                                                 |
| -------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS` (adjusted, F-14/F-17 added) before slice 1        |
| Design section exists in worklog       | PASS   | `worklog.md` § Design (public surface, vocabulary, ports, constants, 27 slices, contributor path) |
| Commit slices match design plan        | PASS   | `commits.md` lists 27 slices in design order; runtime-config (1–10) → config (11–18) → contracts (19–24) → cross-cutting (25–27) |
| Each slice has a passing gate          | PASS   | `worklog.md` Progress Log records a named gate per slice                  |
| No speculative seams (unused files)    | PASS   | All `src/` files reachable from a barrel/subpath; no template-only files found |
| Constants used for finite vocabularies | PASS   | `RUNTIME_CONFIG_TOPICS`, `DEFAULT_DEBOUNCE_MS`, `POINTER_FILE_NAME`, contracts `DEFAULT_PAGINATION_*` |

## Static Gates

Independently re-run by the evaluator with Deno 2.8.2. The sandbox **cannot reach JSR
(`jsr.io`) or npm**, so any gate that must resolve `@std/*`, `zod`, or `@orpc/*` (type-check,
test, publish dry-run) could not be re-run here and relies on generator evidence.

| Gate            | Command or check | Result        | Evidence | Notes |
| --------------- | ---------------- | ------------- | -------- | ----- |
| Format          | `deno fmt --check packages/{runtime-config,config,contracts}` | PASS | `Checked 18/41/29 files`, no diffs | offline |
| Lint            | `deno lint packages/{runtime-config,config,contracts}` | PASS | `Checked 8/32/20 files`, 0 problems | offline |
| Doc lint (root) | `deno doc --lint mod.ts` per package | PASS | runtime-config `Checked 1 file`; config root clean; contracts `Checked 4 files` | offline |
| **Doc lint (subpaths)** | `deno doc --lint <subpath>` | **FAIL** | `@netscript/config` `./paths` (`src/paths/mod.ts`) → **28 `missing-jsdoc` errors** | see Findings |
| Narrow typecheck | `deno check mod.ts` | NOT_RUN | JSR/npm blocked in sandbox; generator reports PASS (worklog slices 18/24/10) | env limitation |
| Publish dry-run | `deno publish --dry-run --allow-dirty` | NOT_RUN | JSR/npm blocked; generator reports 0 slow types all three (worklog slice 27) | env limitation; PLAN-EVAL flagged F-6 for IMPL re-run |
| Tests           | `deno test --allow-all` | NOT_RUN | JSR/npm blocked; generator reports 8/10/4 passed | env limitation |

## Fitness Gates

| Gate | Function                | Result        | Evidence | Violations |
| ---- | ----------------------- | ------------- | -------- | ---------- |
| F-1  | File-size lint          | PASS          | No non-test `.ts` > 500 LOC across all three packages (evaluator scan) | none |
| F-5  | Public surface audit    | **FAIL**      | `./paths` subpath doc-lint = 28 errors (root + merge + schema/plugins + contracts subpaths clean) | config `./paths` |
| F-6  | JSR publishability      | NOT_RUN       | JSR/npm blocked; generator evidence only | — |
| F-7  | Doc-score gate          | **FAIL**      | READMEs 339/255/424 ✓ and docs 8/7/7 files ✓, but doc-lint not clean on `config` `./paths` | config `./paths` JSDoc |
| F-8  | Workspace lib check     | PASS          | Root `deno.json` `lib` includes `deno.ns`, `deno.unstable` | none |
| F-10 | Test-shape audit        | PARTIAL       | No test file > 500 LOC; suites present all three; run NOT_RUN (env) | — |
| F-11 | Forbidden-folder lint   | PASS          | No `utils/helpers/common/lib/interfaces` dirs in any target package (evaluator scan) | none |
| F-12 | Naming-convention lint  | PASS          | `deno lint` clean; no `I*`/`*_T`/`*Impl` exports | none |
| F-14 | Console-log lint        | PASS          | `grep console.` over `runtime-config/{mod.ts,src}`, `config/src`, `contracts/src` = 0 | none |
| F-15 | Re-export-upstream lint | PASS          | `deno lint` clean; no `export * from 'npm:'/'jsr:'` outside `@netscript`/`@std` | none |
| F-16 | Folder-cardinality lint | PASS          | No `src/` dir > 12 immediate children (evaluator scan) | none |
| F-17 | Abstract-derived audit  | PASS          | No abstract/derived class pairs (type + factory surfaces) | none |
| F-18 | Sub-barrel lint         | PASS          | `config/src/domain/mod.ts` + `contracts/src/public/mod.ts` carry `arch:barrel-ok` | none (debt-accepted) |

## Consumer Gates

| Consumer          | Validation     | Result  | Evidence |
| ----------------- | -------------- | ------- | -------- |
| `packages/cli`    | `deno check`   | NOT_RUN | JSR/npm blocked in sandbox; generator reports 0 errors (slice 25) |
| `plugins/sagas`   | `deno check`   | NOT_RUN | JSR/npm blocked; generator reports 0 errors (slice 26) |
| `plugins/workers` | `deno check`   | NOT_RUN | JSR/npm blocked; generator reports 0 errors (slice 26) |

## Anti-Pattern Check

| AP    | Status        | Evidence | Notes |
| ----- | ------------- | -------- | ----- |
| AP-1  | CLEAR         | `runtime-config/mod.ts` split into domain/application/diagnostics; no file > 500 LOC | |
| AP-13 | CLEAR         | F-14 console scan = 0 in published src | console removed per L5 |
| AP-16 | CLEAR         | No `helpers.ts`/`helpers/` remain in config or contracts | renames landed |
| AP-22 | DEBT_ACCEPTED | `config/src/domain/mod.ts` justified `arch:barrel-ok`; entry in `debt/arch-debt.md` | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 2     | `contracts` root `crud/` layout; `config/src/domain/mod.ts` sub-barrel |
| Resolved entries      | 3     | runtime-config single-file; config AP-16; contracts AP-16 |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | The `./paths` doc-lint gap is incomplete scope, not undocumented debt |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| Medium | `@netscript/config` publishes the `./paths` subpath (`exports["./paths"] → ./src/paths/mod.ts`), but `deno doc --lint src/paths/mod.ts` reports **28 `missing-jsdoc` errors** on the exported `PathConstants`/`PathFiles`/`Permissions` members. The config doc-lint sweep (worklog slice 18) only ran `mod.ts src/merge/mod.ts src/schema/plugins/mod.ts` and never linted `./paths`. The plan's acceptance bar (`plan.md` § Goal) and the generator's own handoff note require doc-lint clean on **every** entrypoint, root **and all subpaths**. F-5/F-7 therefore fail on this subpath. | `deno doc --lint packages/config/src/paths/mod.ts` → `error: Found 28 documentation lint errors.` | fix — add JSDoc to the exported members of `src/paths/mod.ts` (and any transitively named public types), then re-run `deno doc --lint` on all four config entrypoints |
| Low (env) | F-6 publish dry-run, F-10 test runs, and consumer `deno check` could not be independently re-verified: the evaluator sandbox cannot reach `jsr.io`/`registry.npmjs.org` to resolve `@std/*`, `zod`, `@orpc/*`. PLAN-EVAL already flagged F-6 for IMPL-time confirmation. | `curl https://jsr.io/@std/path/meta.json` → HTTP 000; `deno check` → `JSR package manifest ... failed to load` | confirm F-6/F-10/consumer gates on a network-enabled runner (or accept generator evidence) before publish |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Doc-lint sweeps must enumerate **every** `exports` entry from `deno.json`, not only the subpaths a slice happened to touch. A subpath that no slice edited (here `./paths`) still ships and still gates on F-5/F-7. | Derive the doc-lint target list from `deno.json` `exports` keys, not from the slice diff. | Archetype 1 (Small Contract), any multi-subpath package | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | The plan is sound and 3 packages are largely at the S1 bar (fmt, lint, root + merge + schema/plugins + all contracts subpaths doc-lint clean; F-1/F-8/F-11/F-12/F-14/F-15/F-16/F-17/F-18 pass; READMEs and docs meet thresholds). One required gate fails: the published `@netscript/config` `./paths` subpath has 28 `missing-jsdoc` doc-lint errors that the config sweep never exercised, so F-5/F-7 are not clean on all config entrypoints as the approved plan requires. This is an implementation/docs completeness gap with a valid plan — `FAIL_FIX`, not `FAIL_RESCOPE` or `FAIL_DEBT`. Fix: document the `./paths` exports and re-run doc-lint over all four config entrypoints. (F-6/F-10/consumer gates remain on generator evidence only due to the sandbox JSR/npm block; re-confirm on a networked runner before publish.) |
