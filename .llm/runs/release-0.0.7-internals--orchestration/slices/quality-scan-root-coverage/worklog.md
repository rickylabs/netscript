# Worklog: quality-scan-root-coverage

## Run Metadata

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch         | `fix/quality-scan-root-coverage`                                           |
| Archetype      | `6 — CLI / Tooling`                                                        |
| Scope overlays | `service`, `docs`                                                          |

## Design

### Public surface

- No JSR/public package export changes.
- Executable repository task surface: `quality:scan`, `quality:scan:repo`, and their composition in
  `quality:gate`.
- New internal CLI: `.llm/tools/quality/check-root-coverage.ts`, emitting deterministic structured
  JSON and exit 1 on an incomplete/malformed denominator.
- Existing scanner output remains the compliance report and includes actual `mode` and `scanned`
  paths. The checker explicitly says configured roots are configuration coverage, not traversal.

### Domain vocabulary

- Published denominator — an existing `WorkspaceMember` with `publishable:true` and a `packages/**`
  or `plugins/**` root.
- `ConfiguredRootSet` — normalized roots extracted for one quality task.
- `RootCoverage` — task name, configured roots, and uncovered published members.
- `RootCoverageReport` — census, named boundary and `publish:false` exclusions, quality-task
  configuration coverage, doctrine roots/gaps, traversal disclosure, and aggregate `ok`.
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

- `COVERAGE_TASKS` — `quality:scan`, `quality:scan:repo`.
- `INCLUDED_PARENTS` — named `packages/**`, `plugins/**` denominator boundary.
- Stable report fields include `ok`, `census`, `boundary`, `publishableMembers`,
  `excludedNonPublishableMembers`, `qualityTasks`, `doctrine`, `scannerTraversal`, and `errors`.

### Commit slices

| # | Slice                                           | Gate                                                                                | Files                                                                  |
| - | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1 | Fail-closed coverage contract + fixtures        | focused durable test; scoped check/lint/fmt                                         | `.llm/tools/quality/check-root-coverage.ts`, `_test.ts`, run artifacts |
| 2 | Bind both scan tasks to broad roots and checker | quality-scan, quality-scan-repo, arch-check, quality-gate                           | `deno.json`, conditional test adjustment, run artifacts                |
| 3 | Final frozen gate set and handoff               | check, test, quality-job, publish-dry-run, docs-source-format(+test), docs-accuracy | run artifacts only                                                     |

### Deferred scope

- Scanner diagnostic deduplication and unknown-flag rejection from #1653.
- Package/plugin, doctrine, debt, workflow, gate catalog, E2E, Aspire, Docker, and release changes.

### Contributor path

A contributor adds a workspace member only in root `deno.json` and its member config. The coverage
checker derives it automatically: broad roots cover it without another list edit; a narrowed or
misconfigured task fails and names the missing member. To change coverage policy, edit the focused
checker and its semantic fixtures, not package lists in multiple tasks.

## Progress log

| Time                      | Slice     | Step              | Notes                                                                                                                            |
| ------------------------- | --------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15T07:10:07+02:00 | Bootstrap | Activated         | Identity and mandatory run artifacts committed at the immutable baseline.                                                        |
| 2026-08-15T07:11:26+02:00 | Bootstrap | Draft PR          | PR #1656 opened from bootstrap commit; required labels and milestone applied.                                                    |
| 2026-08-15                | Plan      | Research complete | Live issue, task roots, 35-member publish census, 36-root doctrine census, tests, CI, JSR risk, and #1653 findings re-baselined. |
| 2026-08-15                | Plan      | Design checkpoint | Exact three-path implementation surface and three ordered slices locked.                                                         |
| 2026-08-15                | Plan eval | PASS              | Cycle 1 passed at `3b95a004f`; immutable plan `da76d9d84` remained byte-identical.                                               |
| 2026-08-15                | S1        | RED               | Contract test committed at `2c9aa89c0`; durable receipt failed before the checker existed.                                       |
| 2026-08-15                | S1        | Implementation    | Checker and nine tests implemented; `deno.json` remains unchanged.                                                               |
| 2026-08-15                | S1        | Design checkpoint | Configured roots and observed traversal are separate; out-of-boundary workspace members are named and counted.                   |

## Decisions

| Decision                                     | Reason                                                                                                                  | Source                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| PLAN-EVAL required                           | Cross-repository denominator and ancestry semantics are decision-heavy despite small code volume.                       | harness run-loop + plan-gate |
| Do not edit doctrine checker                 | Dynamic 36-root discovery is already current and independently tested; new coverage tool verifies its published subset. | research F5                  |
| Do not edit scanner                          | Existing `scanned` output satisfies reporting; task configuration and fail-closed coverage are the defect.              | research F4                  |
| Prove forwarding by execution                | A temp workspace runs the real checker first in an `&&` task and records `--changed-file` only at the final command.    | PLAN-EVAL advisory A         |
| Never equate configured roots with traversal | `observedByChecker:false`, `traversedPaths:null`, and a note prevent a traversal claim.                                 | PLAN-EVAL advisory A         |
| Name the denominator boundary                | Exact parent patterns plus excluded count/paths/reason are emitted even when the count is zero.                         | PLAN-EVAL advisory B         |

## Drift

| Drift                                                                   | Severity | Logged in drift.md |
| ----------------------------------------------------------------------- | -------- | ------------------ |
| Launcher pre-seeded the run directory                                   | minor    | yes                |
| Historical `arch:check` omission is already fixed on the immutable base | minor    | yes                |

## Gate results — slice 1

| Gate                                                    | Exit | Commit attested | Receipt                                 |
| ------------------------------------------------------- | ---: | --------------- | --------------------------------------- |
| focused test (RED)                                      |    1 | `2c9aa89c0`     | `receipts/slice-1/red-test.json`        |
| focused test (GREEN; 8/8 before final CLI-failure case) |    0 | `22e35f4be`     | `receipts/slice-1/test.json`            |
| check (package roots + explicit S1 roots)               |    0 | `22e35f4be`     | `receipts/slice-1/check.json`           |
| lint (package roots + explicit S1 roots)                |    0 | `22e35f4be`     | `receipts/slice-1/lint.json`            |
| format check (package roots + explicit S1 roots)        |    0 | `22e35f4be`     | `receipts/slice-1/fmt-check.json`       |
| focused final test (GREEN; 9/9)                         |    0 | `a2f33ca4f`     | `receipts/slice-1/final-test.json`      |
| final check (wrapper fired; 2,921 files)                |    0 | `a2f33ca4f`     | `receipts/slice-1/final-check.json`     |
| final lint (wrapper fired; 2,036 files)                 |    0 | `a2f33ca4f`     | `receipts/slice-1/final-lint.json`      |
| final format check (wrapper fired; 2,036 files)         |    0 | `a2f33ca4f`     | `receipts/slice-1/final-fmt-check.json` |

An initial final static launch was intercepted by Deno task input caching. Those cached receipts
were discarded rather than called passes; reordered explicit roots forced the wrappers to fire and
emit the selection summaries cited above.

JSR audit touched-publishable-member denominator is empty: S1 changes internal `.llm` tooling and
tests only. No public exports, dependency pins, runtime assets, `import.meta` reads, package config,
or lockfile changed. The repository publish dry run remains a frozen final-gate responsibility.

## Handoff notes

- Tier-A should inspect S1 only. The live checker stays red with 29 `quality:scan` omissions until
  the approved S2 task binding.
- S2 must not start until the topic supervisor reviews this slice.
- No formal IMPL-EVAL has been launched.

## Tier-A sign-off — Slice 1

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at implementation head `dbbedde346f91341208875aee7b5108bd3805dc7`, with F1 closed at
`179219b02d7901a534917ba1570bc91be1551036`. Supervisor commit, not the implementer's; no lane
self-certified.

Verified by execution at the landed head, not from receipts:

- **Fail-closed proven.** Running the checker exits **1** with `ok:false` and a single error naming
  the 29 published members `quality:scan` does not cover — the expected RED state before S2 wires
  the roots.
- **Census reproduces the evaluator exactly.** `workspaceMembers: 37`, `membersInsideBoundary: 37`,
  `publishableMembersInsideBoundary: 35`; non-publishable exactly `packages/bench` and
  `packages/cli/e2e`, each with `reason: publish:false`. Per task: `quality:scan` 3 configured roots
  / 29 uncovered; `quality:scan:repo` 5 roots / 0 uncovered. Doctrine 36 roots with 0 uncovered
  published members, confirming the 35 ⊂ 36 subset.
- **Determinism holds.** Every path array is lexically sorted and two consecutive runs are
  byte-identical, which is what makes these receipts comparable across commits.
- **Scope holds.** Only `check-root-coverage.ts` and its test; `deno.json` correctly deferred to S2.
  No third path, no `deno.lock` churn.
- **RED-first held.** `red-test.json` exit 1, then `test.json` exit 0; nine slice-1 receipts, all
  PASS except that intentional red.

Advisory discharge:

- **B — discharged.** `boundary` emits `includedParents`, a `description` naming #1542, and
  `excludedWorkspaceMembers` with `count`, `paths`, and
  `reason: "outside packages/** and
  plugins/**"`. A future publishable member under `examples/*`
  or `apps/*` becomes visible rather than silently dropped, and the denominator itself was not
  expanded — the boundary is named, not moved.
- **A, JSON half — discharged.** `scannerTraversal` reports `observedByChecker: false`,
  `traversedPaths: null`, and the note that configured roots are configuration coverage only. The
  report cannot be misread as a claim that the scanner traversed those roots.
- **A, wiring half — deferred to S2 by design.** Proving the checker still executes when
  `--changed-file` is appended depends on the `deno.json` chain S2 owns. It must be asserted there
  by receipt, not reasoned about from `deno task` argument-forwarding behaviour.

F1 closed: three locked output field names had changed without a record. The implemented names are
more precise, so the fix was to record rather than revert; the drift entry now carries the full
expected→actual mapping, the unchanged fields, the rationale, and an explicit note that `census`,
`boundary`, and `scannerTraversal` are advisory-driven additions rather than unplanned scope.

Slice 2 is authorized.

## Slice 2 — configured task binding

The topic supervisor corrected an over-constrained S2 dispatch: the approved plan already permits
`deno.json`, the same root-coverage test when its live assertion needs rebinding, and run artifacts.
No rescope was required and no fourth path entered the slice.

### Progress

| Step                | Commit      | Result                                                                                                     |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| RED task wiring     | `98360da7b` | Checker runs before the still-narrow scanner task; changed-file invocation exits 1 with 29 uncovered.      |
| Green binding       | `15d894740` | `quality:scan` uses broad `packages`, `plugins`, `docs/site`; both tasks invoke the checker first.         |
| Live test rebinding | `15d894740` | Live integration expects zero gaps/`ok:true`; structured CLI failure uses an incomplete temp-repo fixture. |

### Advisory A — wiring proof

- `red-forwarding.json` invokes
  `deno task quality:scan --changed-file
  .llm/tools/quality/check-root-coverage.ts` at the
  narrow-root commit. The checker emits the full 37/37/35 census and exits 1 on 29 uncovered members
  before the scanner can run.
- `forwarding.json` repeats the exact changed-file invocation at the green binding. The checker
  emits `ok:true`, both task gap arrays are empty, and the next JSON object is the scanner report
  with `mode:"changed-files"` and `scanned:[".llm/tools/quality/check-root-coverage.ts"]`.
- Both receipt stderr records show the appended `--changed-file` tokens after the final scanner
  command and its preserved `--max-allow 7`; they never enter checker root parsing.

### Gate results — slice 2

| Gate                          | Exit | Commit attested | Receipt                                   |
| ----------------------------- | ---: | --------------- | ----------------------------------------- |
| changed-file forwarding RED   |    1 | `98360da7b`     | `receipts/slice-2/red-forwarding.json`    |
| focused test (9/9)            |    0 | `15d894740`     | `receipts/slice-2/test.json`              |
| changed-file forwarding GREEN |    0 | `15d894740`     | `receipts/slice-2/forwarding.json`        |
| quality scan                  |    0 | `15d894740`     | `receipts/slice-2/quality-scan.json`      |
| repository quality scan       |    0 | `15d894740`     | `receipts/slice-2/quality-scan-repo.json` |
| doctrine architecture check   |    0 | `15d894740`     | `receipts/slice-2/arch-check.json`        |
| composite quality gate        |    0 | `15d894740`     | `receipts/slice-2/quality-gate.json`      |

The normal scanner report records exact traversal roots `packages`, `plugins`, `docs/site`, zero
findings, `allowCount:7`, and no allowance failures. The repo scanner records `packages`, `plugins`,
`.llm/tools/fitness`, `.llm/tools/quality`, and `docs/site`, also with allowance count 7 and no
failures. The checker reports 37/37/35, both named `publish:false` exclusions, zero gaps for both
quality tasks, and 36 doctrine roots covering all 35 publishable members.

JSR touched-publishable-member denominator remains empty. S2 changes only root task configuration,
the internal test, and run evidence; no package/plugin export, dependency pin, runtime asset,
`import.meta` read, or lockfile changed.

### Handoff

- S2 is stopped for topic-supervisor Tier-A review.
- S3 and its frozen final gate set are not started.
- No formal IMPL-EVAL has been launched.

## Tier-A sign-off — Slice 2

Signed off by `topic-internals-0.0.7` (Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`, Opus 5
/ high) at implementation head `a7e9ee0d5c8c15bade0e1d5c656e77d9105ddbf2`. Supervisor commit, not
the implementer's.

Verified by execution at the landed head:

- **The coverage gap is closed.** The checker now exits **0** with `ok:true` and `errors: []`.
  `quality:scan` roots moved from the descendant `packages/cli/src` to broad `packages`, taking its
  uncovered count from **29 to 0**; `quality:scan:repo` and doctrine both remain at 0. The census is
  unchanged at 37/37/35 and both `publish:false` exclusions are still named. The 29→0 transition
  against slice 1's recorded RED is the evidence acceptance criteria 1 and 3 rest on.
- **Advisory A's wiring half is proven, not argued.** The `red-forwarding` → `forwarding` receipt
  pair runs the _identical_ argv `deno task quality:scan --changed-file …` at exit 1 then exit 0. I
  reproduced it independently: with `--changed-file` appended the checker still executes (its
  `census`/`boundary`/`scannerTraversal` JSON is present) and the scanner receives the file
  (`mode: changed-files`, `scanned: [<the file>]`). D5's assumption about `deno task` forwarding
  trailing arguments to the last command in an `&&` chain is now an asserted fact.
- **Criterion 2 survives the repo becoming healthy.** Structured CLI failure moved to a temp fixture
  (`@fixture/covered` / `@fixture/uncovered`) rather than being deleted, and the fixture suite still
  proves omission, descendant-root rejection, broad-root future-member coverage, empty census, and
  malformed/missing task roots. Had that assertion simply been dropped, criterion 2 would have
  silently stopped being tested the moment coverage went green.
- **Permissions and budget preserved byte-for-byte.** `--max-allow 7`, `plugins`, `docs/site`, and
  `--allow-net=api.github.com --allow-env=GITHUB_TOKEN,GH_TOKEN` are intact on the scanner, so
  #1653's fail-closed owner resolver is unaffected. The checker itself correctly runs with
  `--allow-read` only.
- **Scope and hygiene hold.** Only `deno.json` and `check-root-coverage_test.ts` outside run
  artifacts — the surface the approved plan's S2 authorizes. No `check-root-coverage.ts` edit, no
  fourth path, no `deno.lock` churn.
- **Focused suite re-run by the supervisor: 9 passed, 0 failed.** Slice-2 receipts: `quality-scan`,
  `quality-scan-repo`, `quality-gate`, `arch-check`, `test`, and `forwarding` all exit 0, with
  `red-forwarding` retained at exit 1 as the RED proof.

Note on the preceding stop: S2's first turn halted with no commits because my brief restricted the
slice to `deno.json` alone, contradicting the approved plan's S2 file list, which already authorizes
this test when its live integration assertion needs binding. The leaf was correct to stop and ask;
the constraint was mine and was withdrawn without a coordinator rescope.

Slice 3 is authorized.

## Slice 3 — final contract and publishability evidence

S3 changes run artifacts only. All required gates ran at the signed-off, branch-reachable S2 head
`4ae309d5774676d710ba24f56119b028bc2c095c`.

### Final gate results

| Gate | Exit | Receipt | Execution evidence |
| --- | ---: | --- | --- |
| check | 0 | `receipts/slice-3/check.json` | wrapper fired; 2,919 files, 25 batches, zero findings |
| full test | 0 | `receipts/slice-3/test.json` | 4,128 passed, 19 ignored, 0 failed |
| quality job | 0 | `receipts/slice-3/quality-job.json` | CI dependency graph fired; standalone check receipt covers its one cache hit |
| publish dry run | 0 | `receipts/slice-3/publish-dry-run.json` | canonical workspace simulation ended `Success Dry run complete` |
| quality gate | 0 | `receipts/slice-3/quality-gate.json` | checker/scanner and doctrine commands fired |
| docs source format, incorrect root cwd | 1 | `receipts/slice-3/docs-source-format.json` | truthful invocation error: root has no `check:source-format` task |
| docs source format, authoritative docs cwd | 0 | `receipts/slice-3/docs-source-format-docs-cwd.json` | `Docs source format: OK` |
| docs source-format test | 0 | `receipts/slice-3/docs-source-format-test.json` | 6 passed, 0 failed from `docs/site` |
| docs accuracy | 0 | `receipts/slice-3/docs-accuracy.json` | PASS with published-source/command/import corpus counts |

The first docs source-format command fired from the wrong working directory and remains recorded as
a failure, not relabeled as a pass. The approved plan says docs gates run from `docs/site` where
required; the corrected durable receipt uses that cwd and passes without a source change.

### JSR audit closeout — applicable, empty touched-member denominator

- Git ground truth from immutable base `473e8d75b5281c93dc4729d99f3358a34f2bd687` to S2 sign-off
  head shows no changed path under `packages/**` or `plugins/**`.
- Touched publishable members: **0**. Therefore the per-member public-export and exact
  `@netscript/*` pin audit has zero rows. This is an explicit empty denominator, not a vacuous
  package-level pass.
- Rescope tripwire: any changed publishable-member source/config/export would invalidate the empty
  denominator and require stopping for member-level export, pin, runtime-asset, and `import.meta`
  review. The Git diff proves that tripwire did not fire.
- Runtime asset / top-level `import.meta` rejection has no touched publishable row to evaluate. The
  internal checker use of `import.meta` is outside JSR publication and was already authorized.
- The canonical workspace isolated-declaration publish simulation passes in
  `receipts/slice-3/publish-dry-run.json`.
- `deno.lock` and `docs/site/deno.lock` are byte-unchanged from the immutable base.

### Definition of Done evidence audit

The implementation thread did **not** edit the PR body or tick its boxes. The following statuses are
the truthful handoff for the coordinator:

| PR Definition-of-Done row | Truthful status | Evidence |
| --- | --- | --- |
| Configured scan/doctrine roots cover every published package and exclusions are named | ready to tick | S2 `quality-scan*.json` and S3 `quality-gate.json`: 37/37/35, zero gaps, Bench + CLI E2E named `publish:false`, 36 doctrine roots |
| A test or gate fails when a published package is absent | ready to tick | permanent omission/descendant/future-member fixtures; fixture-backed CLI exit 1; S1/S2 RED receipts |
| `quality:gate` reports which roots it scanned | ready to tick | checker configured-root arrays + scanner `scanned` arrays in S2 scan receipts; S3 composite gate fires that task before doctrine |
| Required check/test/publish/quality/docs evidence is recorded | ready to tick | all eight authoritative S3 receipts pass; wrong-cwd docs failure retained plus correct-cwd pass |
| Applicable JSR audit covers every touched publishable member and publishability risks | ready to tick with explicit empty-denominator note | zero touched publishable members by Git diff; rescope tripwire not fired; workspace publish dry run passes |
| PLAN-EVAL and IMPL-EVAL pass before ready-for-review | **not ready to tick** | PLAN-EVAL cycle 1 passed; formal IMPL-EVAL has not been authorized or run, and PR remains draft |

### Final implementation-surface review

Outside run artifacts, immutable-base diff contains exactly the three locked paths:
`.llm/tools/quality/check-root-coverage.ts`,
`.llm/tools/quality/check-root-coverage_test.ts`, and `deno.json`. No publishable member, workflow,
scanner, doctrine tool, gate catalog, docs source, dependency, or lockfile changed.

### Handoff

- S3 is stopped for topic-supervisor Tier-A review.
- Formal IMPL-EVAL remains coordinator-gated and has not been launched.
- PR remains draft; no DoD box, label, issue state, or readiness transition was mutated.
