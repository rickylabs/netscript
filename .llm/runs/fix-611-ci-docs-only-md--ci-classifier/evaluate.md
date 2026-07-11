# Evaluation: #611 CI Markdown-only classifier + skip-label guidance

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-611-ci-docs-only-md--ci-classifier`                     |
| Target         | `.github/scripts/ci-classify-changes.ts` + PR/harness skills |
| Archetype      | `N/A` — repository CI tooling, no package/plugin surface     |
| Scope overlays | `docs`                                                       |
| Evaluator      | IMPL-EVAL — Claude Opus (opposite-family, local) / 2026-07-11 |
| PR / issue     | PR #613 (draft), Closes #611                                 |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                            |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict = `PASS`; approval commit `dc1dd3b5` (09:47:33) precedes first impl commit `34b33781` (09:48:44). `git log` order confirms no slice landed before the gate. |
| Design section exists in worklog       | PASS   | `worklog.md` §Design present with all 7 elements (Public Surface, Domain Vocabulary, Ports, Constants, Commit Slices, Deferred Scope, Contributor Path).            |
| Commit slices match design plan        | PASS   | Design named 3 slices; branch carries plan `5486637b`, plan-eval artifact `dc1dd3b5`, classifier slice `34b33781`, guidance+mirror slice `9279e40c` — in Design order, < 30. |
| Each slice has a passing gate          | PASS   | Slice 2 gate (tests + scoped check/fmt) and Slice 3 gate (sync-claude:check) evidenced in per-slice PR comments and independently re-run below.                     |
| No speculative seams (unused files)    | PASS   | No new files; only existing files edited. New `isCritical()` helper is reachable from `isDocsOnlyPath` (`ci-classify-changes.ts:99`).                               |
| Constants used for finite vocabularies | PASS   | Reuses `IMPACTING_PREFIXES`/`IMPACTING_EXACT`/`DOCS_EXTENSIONS`/`DOCS_PREFIXES`; see low-severity DRY note in Findings re `isCritical` inlined basenames.           |

## Static Gates

| Gate             | Command or check                                                                              | Result | Evidence                                                    | Notes |
| ---------------- | --------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | ----- |
| Unit tests       | `deno test --no-lock -A .github/scripts/`                                                      | PASS   | 30 passed, 0 failed (independently re-run).                 | Covers all 4 requested cases + critical-path + rename. |
| Slice typecheck  | `run-deno-check.ts --root .github/scripts --ext ts,tsx`                                        | PASS   | `filesSelected:2, failedBatches:0, totalOccurrences:0`      |       |
| Format           | `run-deno-fmt.ts --root .github/scripts --ext ts,tsx`                                          | PASS   | `filesSelected:2, findings:0`                               |       |
| Lint             | `run-deno-lint.ts --root .github/scripts --ext ts,tsx`                                         | PASS   | `exitCode:0, totalOccurrences:0` (not in plan gate set; run for completeness). |       |
| Generated mirror | `deno task agentic:sync-claude:check`                                                          | PASS   | `agentic:sync-claude OK: 17 skill(s), 21 mirrored file(s)`; `.claude/skills/{pr,harness}` byte-identical to `.agents/skills` sources. |       |
| Lock hygiene     | `git diff -- deno.lock`                                                                        | PASS   | 0 diff lines — `deno.lock` unchanged.                       |       |
| Link/path check  | docs overlay — referenced label terms                                                         | PASS   | Skill edits reference `ci:skip-e2e` / `ci:skip-scaffold` / `ci:full`, all present in `.github/labels.yml:150,153,156`. No new local file paths added. |       |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-1 … F-19 | doctrine fitness | N/A | No `packages/`/`plugins/` public surface touched; archetype `N/A` per plan and PLAN-EVAL. | none |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Runtime/Aspire | pure classifier; behavior proven by unit tests | N/A | No runtime surface; 30 unit tests cover `decide`/`isDocsOnlyPath`/`parseNameStatus`. |
| Release-gate class (`scaffold.runtime`, `e2e-cli-prod`) | n/a per protocol rule 14 | N/A | Run changes the classifier that *decides* scaffold gating, not scaffold output / plugin scaffold / DB / Aspire / published CLI shape. Not a release cut. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Claude skill mirrors | `agentic:sync-claude:check` | PASS | 17 skills / 21 files in sync; mirrors regenerated only via the sync task (D4 honored). |
| `.github/labels.yml` taxonomy | skill terminology matches checked-in labels | PASS | `ci:skip-scaffold` newly referenced by skills exists in taxonomy. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| -- | ------ | -------- | ----- |
| AP-1 … AP-25 | N/A | Scope is repository CI tooling + agent-guidance Markdown; no doctrine-governed package/plugin code in the diff. | Nothing in scope could affect the doctrine patterns. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No doctrine-governed surface touched; plan §Deferred Scope declares no debt. |
| Resolved entries | 0 | — |
| Deepened violations | 0 | — |
| Unrecorded violations | 0 | Classifier ordering keeps critical `deno.json*`/`deno.lock`/workflow paths authoritative; no violation introduced. |

## Correctness Review (classifier)

Independently traced `isDocsOnlyPath` precedence (`ci-classify-changes.ts:98-103`):

1. `isCritical` first → `deno.json[c]`, `deno.lock` (any depth, basename), and `.github/workflows/**` always force full CI even if `.md`. Confirmed `.github/workflows/README.md` ⇒ `false` (test present).
2. `.md`/`.mdx` extension then wins over ordinary `packages/`/`plugins/`/`apps/` prefixes ⇒ `packages/cli/README.md` docs-only (issue #611's core requirement).
3. `isImpacting` demotes remaining non-Markdown under impacting prefixes.
4. `isDocs` allows the docs directory prefixes.

Edge cases verified: empty diff ⇒ not docs-only (runs); `README.md` + `mod.ts` ⇒ full; `README.md` + `deno.lock` ⇒ full; rename `packages/cli/OLD_README.md → README.md` ⇒ docs-only (both sides Markdown); rename with an impacting source path still surfaces via `parseNameStatus` dual-path (rename hole stays closed). Conservative default (unclassifiable ⇒ force gate) preserved. Module-header contract comment rewritten to match the reversed policy (PLAN-EVAL reminder honored).

## Process / GitHub Surface

- Per-slice PR comment trail complete and evidenced: PLAN-EVAL APPROVED (`dc1dd3b5`), Slice 2 IMPL (`34b33781`, 30/30 + scoped gates), Slice 3 IMPL (`9279e40c`, mirror check). This is the authoritative commit trail (run-loop §5).
- `Closes #611` present in PR body; milestone `0.0.1-beta.7` (drift-logged); exactly one `status:` label.
- Close-gate (protocol rule 12): issue #611's two acceptance criteria are both checked with linked commit + phase-comment evidence; the issue carries no `gate:` checkboxes. Close-gate is satisfied at the issue level.
- No agent briefs were dispatched (single supervisor-driven session per `supervisor.md`); protocol rule 13 (`## SKILL` chapter in briefs) is n/a.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | PR #613 body is stale relative to actual progress: slice boxes S2/S3 and the entire Definition-of-Done checklist are unchecked, and Validation/Harness still read "PLAN-EVAL pending … Phase: plan-eval". | `gh pr view 613 --json body`; authoritative per-slice comments and run artifacts are current. | Non-blocking for IMPL-EVAL. Refresh the PR body (check S2/S3 + DoD, update phase/validation) as part of the `status:ready-merge` transition before merge. |
| low | `isCritical` (`ci-classify-changes.ts:79-84`) re-inlines the `deno.json`/`deno.jsonc`/`deno.lock` basenames already encoded in `IMPACTING_EXACT` and `isImpacting`'s basename check. | Two independent copies of the same finite vocabulary. | Optional cleanup: derive `isCritical` from a shared constant. Not a gate failure. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Reversing a classifier precedence rule must invert the encoding tests and rewrite the module-header contract in the same slice | contract-first reversal | docs / CI-tooling runs | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is fully implemented: Markdown/MDX diffs classify docs-only across all directories while `deno.json*`/`deno.lock`/workflow criticals and any non-Markdown impacting path still force full CI, and rename dual-path handling keeps the rename hole closed. All applicable static/consumer gates were re-run independently and pass (30/30 tests, scoped check/lint/fmt clean, mirror sync 17/21, `deno.lock` untouched); fitness/runtime/release gates are correctly `N/A`. No architecture debt was introduced or required, and issue #611's close-gate acceptance criteria are checked with linked evidence. The two findings are low-severity: a stale PR body to refresh before the ready-merge transition, and an optional DRY cleanup — neither blocks the implementation against the approved plan. |
