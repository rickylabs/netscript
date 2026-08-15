# Worklog: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` |

## Design

### Public surface

- No JSR/public package export changes.
- Executable repository task surface: `quality:scan`, `quality:scan:repo`, and their composition in
  `quality:gate`.
- New internal CLI: `.llm/tools/quality/check-root-coverage.ts`, emitting deterministic structured
  JSON and exit 1 on an incomplete/malformed denominator.
- Existing scanner output remains the compliance report and already includes `scanned` roots.

### Domain vocabulary

- `PublishedWorkspaceMember` — existing `WorkspaceMember` with `publishable:true` and a
  `packages/**` or `plugins/**` root.
- `ConfiguredRootSet` — normalized roots extracted for one quality task.
- `RootCoverage` — task name, configured roots, and uncovered published members.
- `RootCoverageReport` — published members, named `publish:false` exclusions, quality-task coverage,
  doctrine roots, doctrine gaps, and aggregate `ok`.
- “covers” — configured root equals or is an ancestor of the member root; descendants do not cover
  the whole member.

### Ports and dependencies

- Reuse `discoverWorkspaceMembers()` from `.llm/tools/deps/workspace.ts` as the workspace/config
  discovery boundary.
- Reuse `discoverDoctrineRoots()` from `.llm/tools/fitness/check-doctrine.ts` as the doctrine-root
  authority.
- No new port/interface abstraction: the pure coverage function accepts arrays, and the CLI edge
  performs filesystem reads.

### Constants

- `QUALITY_SCAN_TASKS` — `quality:scan`, `quality:scan:repo`.
- `PUBLISHED_ROOT_PREFIXES` — `packages/`, `plugins/`.
- Stable report field names: `ok`, `publishedMembers`, `excludedMembers`, `configuredRoots`,
  `uncoveredMembers`, `doctrineRoots`.

### Commit slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Fail-closed coverage contract + fixtures | focused durable test; scoped check/lint/fmt | `.llm/tools/quality/check-root-coverage.ts`, `_test.ts`, run artifacts |
| 2 | Bind both scan tasks to broad roots and checker | quality-scan, quality-scan-repo, arch-check, quality-gate | `deno.json`, conditional test adjustment, run artifacts |
| 3 | Final frozen gate set and handoff | check, test, quality-job, publish-dry-run, docs-source-format(+test), docs-accuracy | run artifacts only |

### Deferred scope

- Scanner diagnostic deduplication and unknown-flag rejection from #1653.
- Package/plugin, doctrine, debt, workflow, gate catalog, E2E, Aspire, Docker, and release changes.

### Contributor path

A contributor adds a workspace member only in root `deno.json` and its member config. The coverage
checker derives it automatically: broad roots cover it without another list edit; a narrowed or
misconfigured task fails and names the missing member. To change coverage policy, edit the focused
checker and its semantic fixtures, not package lists in multiple tasks.

## Progress log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15T07:10:07+02:00 | Bootstrap | Activated | Identity and mandatory run artifacts committed at the immutable baseline. |
| 2026-08-15T07:11:26+02:00 | Bootstrap | Draft PR | PR #1656 opened from bootstrap commit; required labels and milestone applied. |
| 2026-08-15 | Plan | Research complete | Live issue, task roots, 35-member publish census, 36-root doctrine census, tests, CI, JSR risk, and #1653 findings re-baselined. |
| 2026-08-15 | Plan | Design checkpoint | Exact three-path implementation surface and three ordered slices locked. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL required | Cross-repository denominator and ancestry semantics are decision-heavy despite small code volume. | harness run-loop + plan-gate |
| Do not edit doctrine checker | Dynamic 36-root discovery is already current and independently tested; new coverage tool verifies its published subset. | research F5 |
| Do not edit scanner | Existing `scanned` output satisfies reporting; task configuration and fail-closed coverage are the defect. | research F4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Launcher pre-seeded the run directory | minor | yes |
| Historical `arch:check` omission is already fixed on the immutable base | minor | yes |

## Gate results

All implementation and proving gates are **NOT FIRED**. This turn has no implementation authority.
No receipt has been created.

## Handoff notes

- PLAN-EVAL should challenge D2-D5: denominator, ancestor direction, doctrine comparison, and task
  binding are load-bearing.
- Confirm the three-path surface is sufficient and that no scanner/check-doctrine edit is required.
- Implementation must not begin until coordinator-disposed PLAN-EVAL `PASS` exists.
