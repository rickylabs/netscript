# Evaluation: #1897 — `@netscript/fresh` publish set excludes the `tests/` tree

## Metadata

| Field          | Value                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Run ID         | `build-fresh-publish-tests-exclude--1897`                                                               |
| Target         | `packages/fresh/deno.json` `publish.exclude` (+1 line: `"tests/"`)                                       |
| Archetype      | 4 — Public DSL / Builder                                                                                |
| Scope overlays | none                                                                                                    |
| Evaluator      | Requested: native opposite-family Claude session (Codex-authored run). Observed: Claude Code, model `claude-fable-5-1`, separate session on host worktree `/home/agent/projects/netscript/worktrees/007-leaf-1897`, 2026-09-02. Read-only except this file. |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                         |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | `PASS` | `plan.md` and `worklog.md` both record `PLAN-EVAL: N/A` with justification (issue #1897 supplies scope, alternatives, acceptance, gate set).       |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` present: surface unchanged, 17 entrypoints, slice definition, deferred scope, contributor path.                          |
| Commit slices match design plan        | `PASS` | One slice planned; working tree diff is exactly `packages/fresh/deno.json` (+1) plus the untracked run dir. No commit yet by recorded owner override (non-draft PR after IMPL-EVAL, `supervisor.md` + `drift.md`). |
| Each slice has a passing gate          | `PASS` | Independently rerun; see Static Gates.                                                                                                          |
| No speculative seams (unused files)    | `PASS` | `git diff origin/main --name-only` → only `packages/fresh/deno.json`.                                                                             |
| Constants used for finite vocabularies | `N/A`  | Metadata-only change.                                                                                                                            |
| Agent briefs carry `## SKILL` chapter  | `FAIL` (low) | `impl-eval-prompt.md` has one; `implement.md` does not. See Findings.                                                                       |
| Lock hygiene                           | `PASS` | `sha256sum deno.lock` = `e52c167e…272c46d` before and after evaluator gate runs; equals recorded baseline.                                        |

## Static Gates

| Gate             | Command or check                                                                            | Result | Evidence                                                                                  | Notes                                             |
| ---------------- | ------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Narrow typecheck | `deno publish --dry-run --allow-dirty` (includes type-check of publish graph)               | `PASS` | exit 0                                                                                    |                                                   |
| Slice typecheck  | `.llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`                           | `PASS` | exit 0; 207 files, 2 batches, 0 failed batches, 0 findings                                | Matches worklog.                                  |
| Format           | n/a                                                                                         | `N/A`  | JSON metadata edit; no TS source touched.                                                 |                                                   |
| Lint             | `deno task quality:gate`                                                                    | `PASS` | exit 0; only pre-existing warnings, none under `packages/fresh`                           |                                                   |
| Doc lint         | `deno doc --unstable-kv <entry>` × 17 export-map entrypoints                                | `PASS` | 0 failures / 17                                                                           | Publish exclusion cannot drop an exported module. |
| Publish dry-run  | `cd packages/fresh && deno publish --dry-run --allow-dirty`                                 | `PASS` | exit 0; 136 `file:` entries; `grep 'tests/'` → 0 matches (issue acceptance criterion)     | Issue file `tests/runtime-catalog-dependencies.ts` absent. |
| Link/path check  | `grep -rn 'tests/' mod.ts src` (non-test files)                                             | `PASS` | exit 1 (zero matches): no entrypoint/source module imports from `tests/`                  | Excluding the tree cannot break a consumer path.  |
| Tests            | `.llm/tools/run-deno-test.ts -- --allow-all packages/fresh`                                 | `PASS` | exit 0; 276 passed, 0 failed, 0 ignored                                                   | Superset of worklog's 254 (evaluator ran whole package dir). |
| Carrier checks   | `deno task check:assets-barrel`, `check:publish-assets`                                     | `PASS` | exit 0 / exit 0                                                                           |                                                   |
| Carrier check    | `deno task check:mcp-export-corpus`                                                         | `FAIL` (pre-existing, not attributable) | exit 1 "corpus is stale". Worklog records regeneration SHA-256 `484005d6…8831` identical with and without `"tests/"`; carrier restored from `HEAD` (confirmed: not in diff). `publish.exclude` filters publish files only and cannot change `deno doc` symbol output, so the staleness is structurally unrelated to this slice. | Truthfully recorded in `worklog.md` + `drift.md`; not masked. |

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                    | Violations |
| ---- | ---------------------------- | ------ | ----------------------------------------------------------- | ---------- |
| F-5  | Public surface audit         | `PASS` | 17/17 entrypoints unchanged and `deno doc` clean            | none       |
| F-6  | JSR publishability gate      | `PASS` | publish dry-run exit 0, 0 `tests/` entries                  | none       |
| F-7  | Doc-score gate               | `PASS` | no doc change; 17 entrypoints doc clean                     | none       |
| F-10 | Test-shape audit             | `PASS` | test tree now fully excluded from publish; tests still run (276/0) | none  |
| F-19 | Scoped source gate runners   | `PASS` | scoped check + test wrappers exit 0                         | none       |
| F-1…F-4, F-8, F-9, F-11, F-12, F-14…F-18 | — | `N/A` | no source/layout change                          | —          |

## Runtime Gates

| Gate    | Validation | Result | Evidence                                                                 |
| ------- | ---------- | ------ | ------------------------------------------------------------------------ |
| Runtime | —          | `N/A`  | Publish-filter metadata only; Aspire/Docker/browser/`e2e:cli` prohibited by owner and not required by plan. |

## Consumer Gates

| Consumer                          | Validation                                   | Result | Evidence                                            |
| --------------------------------- | -------------------------------------------- | ------ | --------------------------------------------------- |
| All 17 `@netscript/fresh` exports | `deno doc` per entrypoint + `tests/` grep    | `PASS` | 0 doc failures; zero source references to `tests/`  |

## Anti-Pattern Check

| AP    | Status | Evidence                                   | Notes |
| ----- | ------ | ------------------------------------------ | ----- |
| AP-1 … AP-25 | `N/A` | Diff is one `publish.exclude` entry; no code, barrel, builder, or export shape touched. | Existing AP-1 debt for `builders/mod.ts` neither touched nor deepened. |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                  |
| --------------------- | ----- | ------------------------------------------------------------------------- |
| New entries           | 0     | none required; no doctrine violation introduced                           |
| Resolved entries      | 0     | —                                                                         |
| Deepened violations   | 0     | `packages/fresh` debt entries (AP-1 builders, doc-lint residue RESOLVED, sandboxes, PageBuilder compat) untouched |
| Unrecorded violations | 0     | `quality:gate` exit 0                                                     |

## Findings

| Severity | Finding                                                                                              | Evidence                                            | Required action                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| low      | `implement.md` brief has no `## SKILL` chapter (protocol rule 13).                                    | `grep '## SKILL'` hits only `impl-eval-prompt.md`   | Non-blocking: implementer was the supervisor session itself (per `supervisor.md`), not a dispatched agent. Add the chapter before committing the run dir. |
| low      | `check:mcp-export-corpus` exits 1 on a pre-existing stale baseline.                                  | worklog causality check; evaluator rerun exit 1     | None for this slice. Track as a separate main-baseline chore; do not regenerate the carrier inside #1897.             |
| info     | Redundant `tests/type-fixtures/` entry now shadowed by `tests/`.                                     | diff context                                        | None; intentionally kept to avoid reordering against #1895's concurrent edits.                                        |

## Lessons for Promotion

| Lesson                                              | Pattern                                                                                      | Applies to | Confidence |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- | ---------- |
| Prove a publish-filter change by set enumeration    | before/after `deno publish --dry-run` count + entrypoint `deno doc` + `tests/` import grep    | all        | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                            |
| Rationale | Approved scope complete: issue acceptance (zero `tests/` entries in the `packages/fresh` publish set) independently verified with exit 0 and 136 files. Public surface intact (17/17 `deno doc`, no source import of `tests/`). Scoped check, tests, quality gate, and two carrier checks green; `deno.lock` byte-identical to baseline. The only red gate is a pre-existing corpus staleness proven not attributable to this slice and truthfully recorded. No debt introduced. Two low findings do not block. |

Next: generator adds the `## SKILL` chapter to `implement.md`, commits the slice, pushes, and opens the non-draft PR with `Closes #1897` per the recorded owner override.
