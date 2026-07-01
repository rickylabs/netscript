# Evaluation: `@netscript/plugin` (A4 plugin host)

## Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `feat-package-quality-wave3-plugin--host`   |
| Target         | `@netscript/plugin`                         |
| Archetype      | `4 - Public DSL/Builder`                    |
| Scope overlays | `none`                                      |
| Evaluator      | IMPL-EVAL (separate session) / 2026-06-08   |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict = `PASS`; first code commit `0c1b2a1` follows the PLAN-EVAL commit `10da21e`. |
| Design section exists in worklog       | PASS   | `worklog.md` § "Design Checkpoint" (public surface, domain vocabulary, ports, constants, contributor path, gate evidence). |
| Commit slices match design plan        | PASS   | 24 slices, ordered Phase A→D, each paired with a `docs(wave3): record …` ledger commit (`commits.md` rows 2–49; `git log`). |
| Each slice has a passing gate          | PASS   | `worklog.md` § "Implementation Evidence" names a gate + result per slice; spot-verified independently (below). |
| No speculative seams (unused files)    | PASS   | New file `src/domain/schema-types.ts` is consumed by `manifest-schema.ts:5` and `plugin-stream-topic-contribution.ts:13`; new tests exercise existing surfaces. No dead exports introduced. |
| Constants used for finite vocabularies | PASS   | `PLUGIN_TYPES`, `CONTRIBUTION_AXES`, `LIFECYCLE_HOOK_NAMES` remain const-derived unions (`tests/domain/core-types_test.ts` asserts the finite vocabularies). |

## Static Gates

| Gate            | Command                                                  | Result | Evidence |
| --------------- | -------------------------------------------------------- | ------ | -------- |
| Typecheck (all 8 entrypoints) | `deno task check`                          | PASS   | `Check mod.ts … src/templates/mod.ts` (8 entrypoints, exit 0). |
| Format          | `deno task fmt --check`                                  | PASS   | `Checked 113 files`. |
| Lint            | `deno task lint`                                         | PASS   | `Checked 104 files`. |
| Doc lint        | `deno doc --lint <8 entrypoints>`                        | PASS   | `Checked 8 files` (0 errors; down from 93 at base). |
| Publish dry-run | `deno publish --dry-run --allow-dirty`                   | PASS_WITH_DOCUMENTED_WARNING | `Success Dry run complete`; 0 slow types; only the documented `unanalyzable-dynamic-import` warning. |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | DEBT_ACCEPTED | `plugin-builder.ts` = 360 LOC (only file >300); matching `arch-debt.md` entry. | builder size (accepted) |
| F-2  | Helper-reinvention scan      | PASS   | `safeStringifyMetadata` in `loader.ts` is a justified circular-safe logger sink. | none |
| F-3  | Layering check               | PASS   | `domain/` (incl. new `schema-types.ts`) imports no impl; ports→domain; application→ports; adapters→ports; cli→application. | none |
| F-4  | Inheritance audit            | PASS   | `PluginContribution` + derived bases co-located in `src/abstracts/`. | none |
| F-5  | Public surface audit         | PASS   | 8 curated entrypoints unchanged; root `mod.ts` exposes authoring/diagnostics/domain only. | none |
| F-6  | JSR publishability           | PASS_WITH_DOCUMENTED_WARNING | dry-run SUCCESS, 0 slow types; `./sdk` dynamic-import warning documented in `src/sdk/mod.ts`. | none |
| F-7  | Doc-score gate               | PASS   | `deno doc --lint` over all 8 entrypoints = `Checked 8 files`, 0 errors. | none |
| F-8  | Workspace lib check          | PASS   | `deno task check` covers all 8 entrypoints with `--unstable-kv`. | none |
| F-9  | Permission declaration check | PASS   | Tests run under explicit `--allow-all`; README "Required Permissions" section added. | none |
| F-10 | Test-shape audit             | PASS   | `deno test --allow-all` → 21 passed / 0 failed across 9 focused files; no god file, no Jest globals. | none |
| F-11 | Forbidden-folder lint        | PASS   | No `utils/`/`helpers/`/`common/`/`lib/`/`interfaces/` under `src/`. | none |
| F-12 | Naming-convention lint       | PASS   | Public verbs `define/with/create/start/run/inspect`; no `I*`/`*T` exports. | none |
| F-13 | Saga/runtime invariants      | N/A    | A4 host package owns no saga/runtime state machine (matches gate matrix). | n/a |
| F-14 | Console-log lint             | PASS   | Console use confined to `loader.ts` logger sink. | none |
| F-15 | Re-export-upstream lint      | PASS   | No `z.ZodType`/`StandardSchemaV1` in public signatures; no zod/standard-schema re-export in barrels. Replaced by package-owned `PluginManifestParser`/`PluginPayloadSchema` (LD-8). | none |
| F-16 | Folder-cardinality lint      | PASS   | Role folders bounded; `public/`/`kernel/` are the locked-plan accepted single-member roles. | none |
| F-17 | Abstract-derived co-location | PASS   | Abstract contribution contracts all in `src/abstracts/`. | none |
| F-18 | Sub-barrel lint              | PASS   | Each `mod.ts` is a leaf barrel; no nested utility sub-barrel introduced. | none |

## Consumer Gates

| Consumer        | Validation                                     | Result | Evidence |
| --------------- | ---------------------------------------------- | ------ | -------- |
| `packages/cli`  | `deno check --unstable-kv mod.ts` (independent)| PASS   | Evaluator re-ran from `packages/cli`; `Check mod.ts`, exit 0. Imports `@netscript/plugin` + `/config` + `/sdk` + `/templates`. |
| `plugins/sagas,streams,triggers,workers` | `deno task check` | PASS (generator evidence) | `worklog.md` slice 22; consistent with the CLI gate the evaluator re-verified. |

## Runtime Gates

| Gate                          | Validation              | Result | Evidence |
| ----------------------------- | ----------------------- | ------ | -------- |
| Merge-readiness `e2e:cli`     | `deno task e2e:cli` ×1  | ACCEPTED_CARRY_FORWARD | 35 passed / 1 failed; sole failure `behavior.triggers-health` (`localhost:8093/health`) is the locked **LD-4** Wave 4 carry-forward, not host-bootstrap scope; cleanup passed. |

## Anti-Pattern Check

| AP    | Status | Notes |
| ----- | ------ | ----- |
| AP-1  | DEBT_ACCEPTED | builder barrel size — `arch-debt.md` plugin-builder.ts entry. |
| AP-9  | CLEAR  | typestate enforces name+version before `build()`; justified. |
| AP-14 | CLEAR  | no upstream DSL deps re-exported (F-15 confirmed; LD-8 structural types). |
| AP-15 | CLEAR  | `withService`/`withDbSchemas` use caller vocabulary. |
| others | N/A   | outside the run's touched surface. |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 1     | `plugin-builder.ts` F-1 (owner/target/reason/linked-plan/status/gate all present). |
| Resolved entries      | 1     | old `packages/plugin — types.ts 1,005 LOC` closed with evidence (`types.ts` no longer exists). |
| Deepened violations   | 0     | builder grew 343→360 LOC via JSDoc; recorded in the entry (not an undocumented deepening). |
| Unrecorded violations | 0     | F-1 scan shows builder is the only >300 LOC src file, and it is tracked. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Builder LOC drifted 343→360 during slice-4 JSDoc; debt entry + worklog recorded the stale 343. | `wc -l plugin-builder.ts` = 360; base `89071df` = 343. | **Fixed in-line by evaluator** — updated `arch-debt.md`, `worklog.md` F-1 rows to 360 LOC with cause. No verdict impact (still the only F-1 violation, still accepted debt). |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| JSDoc sweeps inflate LOC and can re-cross the F-1 cap on borderline files; record the post-implementation size, not the research-baseline size, in the debt entry. | size-debt accounting | all archetypes | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete: doc-lint 93→0 across all 8 entrypoints; README 138→165 with the missing STANDARDS sections; A4 test layers added (21 passing); task hygiene (`check`/`lint`/`fmt`) green. All required static + fitness gates pass, are N/A (F-13), or have valid accepted debt (F-1). The LD-8 PLAN-EVAL constraint is honored — upstream `ZodType`/`StandardSchemaV1` replaced with package-owned structural types, F-15 confirmed clean. Consumer-import gate independently re-verified for `packages/cli`. The single `e2e:cli` failure is the pre-locked LD-4 Wave 4 carry-forward, not new host scope. Debt registry delta is well-formed (1 closed with evidence, 1 opened complete). The one low-severity evidence drift (builder 343→360 LOC) was corrected in-line. Ready to merge into the umbrella. |
