# Evaluation: #309 release engineering and API-stability gates

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-309-release-api-stability-gates--codex`      |
| Target         | Release tooling, CI, and versioning doctrine       |
| Archetype      | `6 - CLI / Tooling`                                |
| Scope overlays | `docs`                                             |
| Evaluator      | Claude / Anthropic Opus 4.8 / high — 2026-07-12    |
| Base → head    | `eac57c5f` → `dc4c6bf3`                            |

Separate-session IMPL-EVAL of Codex-authored local run. Evaluate-only: no implementation, commit,
push, PR, publish, or release cut performed. All commands below were read-only or temp-dir scoped.

## Process Verification

| Check                                  | Result   | Evidence                                                                                       |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `N/A`    | `plan-eval.md` = `OWNER_WAIVED` (carried D1). Waiver accurately recorded in `supervisor.md` + `drift.md` D1. Not falsely claimed as PASS. |
| Plan + Design existed before impl      | `PASS`   | `plan.md` (locked decisions D1–D7) and worklog `## Design` (surface/vocabulary/ports/slices) precede the three impl commits. |
| Design section exists in worklog       | `PASS`   | `worklog.md` `## Design` → Public Surface / Domain Vocabulary / Ports / Commit Slices.          |
| Commit slices match design plan        | `PASS`   | 3 planned slices ↔ 3 commits: `132ae6e6` (zero-residue bumps), `14c6c172` (surface classify), `dc4c6bf3` (release completion). |
| Each slice has a passing gate          | `PASS`   | slice1 `version:bump:test` 7/7; slice2 `surface:diff:test` 3/3 + live patch + CLI exit-paths; slice3 mirror/Claude/docs green (all re-run below). |
| No speculative seams (unused files)    | `PASS`   | All `surface-diff.ts` exports consumed by `surface-diff_test.ts`; `cut.ts` re-exports consumed by `cut_test.ts`; fixtures all referenced. |
| Constants for finite vocabularies      | `PASS`   | `SURFACE_SCHEMA_VERSION`, `volatileDocKeys`, `removalPattern`; verdict/kind as literal unions.  |
| PLAN-EVAL / IMPL-EVAL separate session | `PASS`   | Generator = Codex; this evaluator = separate opposite-family Claude session.                    |
| No PR opened / issue #309 open         | `PASS`   | Owner-prohibited PR (drift D4); commit list + worklog are the authorized trail; #309 stays open. |

## Static Gates

| Gate             | Command or check                                                     | Result | Evidence                              | Notes |
| ---------------- | ------------------------------------------------------------------- | ------ | ------------------------------------- | ----- |
| Scoped typecheck | `run-deno-check.ts --root .llm/tools/release --root .llm/tools/deps` | `PASS` | `filesSelected:36, uniqueOccurrences:0` | `--unstable-kv` applied by wrapper. |
| Lint             | `run-deno-lint.ts` (same roots)                                     | `PASS` | `filesSelected:36, totalOccurrences:0` |       |
| Format           | `run-deno-fmt.ts --check` (same roots)                             | `PASS` | `filesSelected:36, findings:0`         | Scoped source TS only. |
| Doc lint         | n/a                                                                | `N/A`  | No package export/publish surface changed. | Tooling under `.llm/tools`. |
| Publish dry-run  | n/a                                                                | `N/A`  | No package/manifest publish surface changed. | Release execution prohibited. |
| Link/path check  | `deno task docs:links`                                             | `PASS` | `docs=96 broken-links=0 broken-anchors=0 orphans=0` |       |
| Skill mirror     | `agentic:sync-claude:check` + `agentic:check-claude`              | `PASS` | `OK: 17 skill(s), 21 mirrored`; settings/hook-lock green; `.agents`↔`.claude` release SKILL byte-identical. |

## Fitness Gates

| Gate | Function                | Result | Evidence | Violations |
| ---- | ----------------------- | ------ | -------- | ---------- |
| F-5  | Public surface audit    | `PASS` | Baseline snapshots every publishable member: 34 packages / 258 exports / 6,654 symbols; `discoverWorkspaceMembers`=34 matches baseline; 29 multi-export packages preserve subpath identity; live verdict `patch`. | none |
| F-6  | JSR publishability gate | `N/A`  | No package export/manifest changed. | — |
| F-7  | Doc-score gate          | `N/A`  | No package docs changed. | — |
| F-10 | Test-shape audit        | `PASS` | Coordinator + classifier tests assert semantic outcomes (exact file set, residue=[], change kinds, exit codes), not whole-string snapshots; `version:bump:test` 7/7, `surface:diff:test` 3/3. | none |
| F-19 | Scoped source gate runners | `PASS` | 36-file scoped check/lint/fmt, zero findings. | none |

Other F-gates (`F-1..F-4, F-8..F-18`): `N/A` — no `packages/`/`plugins/` framework source touched.

## Runtime Gates

| Gate                    | Validation                                   | Result | Evidence |
| ----------------------- | -------------------------------------------- | ------ | -------- |
| Release cut / publish   | Prohibited by brief; not executed            | `N/A`  | No `deno.lock`/tag/release side effects; `git diff eac57c5f..dc4c6bf3 -- deno.lock` empty, working tree clean. |
| `deno doc --json` probe | Confirms Deno 2.9 drops `{removal}` payload  | `PASS` | Probe of `@deprecated{removal: 0.2}` emits `[{"kind":"deprecated"}]` only → source fallback is necessary and correct. |

## Consumer Gates

| Consumer               | Validation                                                  | Result | Evidence |
| ---------------------- | ----------------------------------------------------------- | ------ | -------- |
| `deno task surface:diff` (live) | current vs committed baseline                      | `PASS` | `surface:diff verdict: patch`, exit 0. |
| Two-snapshot CLI       | `--baseline/--current/--declarations` verdict path          | `PASS` | Empty declarations → verdict `major`, 2 undeclared majors, exit 1; exact `Changed`+`Removed` declarations → verdict still `major` (not hidden), 0 undeclared, exit 0. |
| Deprecation warning    | expired-removal warning at/past declared line               | `PASS` | `WARN @netscript/example . Changed: deprecated removal 1.2 reached at 1.2.0`. |
| CI surface-diff workflow | `.github/workflows/surface-diff.yml`                      | `PASS` | `pull_request paths: ["packages/**"]`; `continue-on-error: true` scoped to the single classify step with `# Beta rollout is observational. Issue #309 owns the stable-line flip to blocking.` |

## Acceptance Criteria

| # | Criterion | Result | Evidence |
| - | --------- | ------ | -------- |
| 1 | Shared zero-residue coordination across root, every workspace member pattern (incl. nested explicit `packages/cli/e2e`), scaffold manifests, and all lock mirrors; tests cover real classes + exact wrapper path. | `PASS` | `cut.ts` imports `coordinateVersionBump`/`findVersionResidue` from `bump-version.ts` (one coordinator). `discoverVersionFiles` derives root `workspace`, expands `packages/*`/`plugins/*`/`examples/*`/`apps/*` globs + nested explicit member, walks `scaffold.plugin.json`, adds `deno.lock`; blunt `replaceAll(old→new)` then repo-wide residue re-scan. `cut_test.ts` exercises all 5 pattern classes + scaffold + caret & exact lock mirrors, asserting exact file set and residue `[]`. `bump-version_test.ts` covers the exact-version wrapper path and native dry-run passthrough. 7/7 pass. |
| 2 | Snapshots every export of every publishable package from `deno doc --json`; deterministic normalized signatures; removals/changes major, additions minor, none patch; nonzero only for exact undeclared majors. | `PASS` | `createSurfaceSnapshot` iterates all 34 publishable members × all exports (`readExports` handles string + object subpaths). `normalizeValue` strips `location/jsDoc/hasBody/resolution` + `sha256(stableJson)` (normalization test proves relocation/doc/body/resolution invariance). `diffSurfaceSnapshots` classification matches; `main` returns `undeclaredMajors.length>0?1:0`. surface 3/3; live patch/exit 0; CLI exit 1/0 verified. |
| 3 | Baseline/declaration placement per policy; root task + package-path PR workflow wired; `continue-on-error: true` limited to beta rollout. | `PASS` | Baseline `.llm/tools/release/baselines/public-surfaces.json` and separate `surface-major-declarations.json` (D1/D4). `deno.json` adds `surface:diff` + `surface:diff:test`. Workflow `paths: packages/**`, `continue-on-error` on the one classify step with the #309-scoped comment. |
| 4 | Doctrine documents `@deprecated{removal: x.y}`; tool warns at/past removal; source fallback necessary/correct because Deno JSON drops payload. | `PASS` | `02-public-surface.md` documents the machine-readable convention (value = first `major.minor` line for removal). `findExpiredDeprecations` warns when `current >= removal`. Live probe confirms `deno doc --json` drops `{removal}` (only `{"kind":"deprecated"}`); `readDeprecatedRemoval` correctly falls back to a 40-line source window regex. |
| 5 | Release skill: green `publish.yml` AND artifact-pinned `e2e-cli-prod` is the only done-state; red = real defect / fix-forward; Claude mirror in sync. | `PASS` | `netscript-release/SKILL.md` "Hard Release Completion Gate" states both-green-only, forbids relabeling/bypass/partial-done, requires fix-forward next patch/prerelease. `.claude` mirror byte-identical; `sync-claude:check` OK 17/21. |
| 6 | `deno.lock` unchanged; no release/publish occurred. | `PASS` | `git diff eac57c5f..dc4c6bf3 -- deno.lock` empty; working tree clean; lock unchanged after Claude hook runs; no cut/publish executed. |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `CLEAR` | Parsing/normalization/comparison/CLI are separate bounded functions. | Plan risk resolved. |
| AP-11 | `CLEAR` | Process/filesystem effects isolated to `runDenoDoc`/`readDeclarationSource`/`main`; classifier pure. | |
| AP-18 | `CLEAR` | Tests assert semantic classifications and exit codes, not whole-output string snapshots. | |
| all others | `N/A` | No `packages/`/`plugins/` framework source in scope. | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | Plan `arch-debt.md` action = none; stable-line blocking rollout remains tracked by open #309. |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | No doctrine violation introduced; deprecation convention added to the existing authority file 02 (D2 drift: file `10-versioning-*` does not exist). |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking) | `replaceVersionFiles` uses blunt `replaceAll(oldVersion, newVersion)` across `deno.lock`/manifests. A prior version string that is a proper prefix of another concurrent token could in theory over-match. | `bump-version.ts:133-143` | None required this slice: monotonic semver increments make collision non-realistic, the repo-wide residue re-scan (`findVersionResidue`) is a hard post-condition, and actual cut execution is prohibited/out of scope. Note for the eventual stable-line cut on #309. |

No high or medium findings. No blocking defect.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| `deno doc --json` (2.9) strips attached JSDoc tag payloads (`{removal: x.y}`); a narrow source-window fallback is required to recover them. | surface/deprecation tooling | Archetype 6 tooling, release gates | high |
| Reuse the single publishable-member discovery (`discoverWorkspaceMembers`) so surface snapshots and publish stay definitionally aligned. | one-definition discovery | Archetype 6, release | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All six acceptance criteria are independently reproduced: shared zero-residue bump coordinator with full pattern-class + nested-explicit + scaffold + lock-mirror coverage (7/7); deterministic full-surface classifier exiting nonzero only for exact undeclared majors (3/3, live patch, CLI exit 1/0, deprecation warn); policy-correct baseline/declaration placement with a package-path beta-scoped non-blocking workflow; doctrine-documented `@deprecated{removal}` with a source fallback proven necessary against live Deno 2.9 behavior; a both-green-only release completion gate mirrored byte-identically to `.claude`; and an unchanged `deno.lock` with no release/publish side effects. Static/fitness/consumer gates are green or justified `N/A`. PLAN-EVAL is an accurately-recorded owner waiver (D1), not a falsely-claimed PASS, and plan + Design predate implementation. The single finding is low-severity and non-blocking. Issue #309 correctly remains open for the deferred stable-line blocking rollout. |
