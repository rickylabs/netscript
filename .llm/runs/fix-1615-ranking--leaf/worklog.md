# Worklog: deterministic guidance ranking

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-1615-ranking--leaf`                |
| Branch         | `fix/1615-guidance-ranking-determinism` |
| Archetype      | `2 — Integration`                       |
| Scope overlays | none                                    |

## Design

### Public Surface

- No exported function, type, entry point, tool contract, or CLI command changes.
- Existing `GuidanceIndex.find(intent)` behavior remains the sole internal ranking entry.

### Domain Vocabulary

- **Close-score band** — a leader-anchored set of candidates in one route whose numeric scores are
  within the policy gap and therefore not trustworthy as a cross-document total order.
- **Stable document identity** — normalized guidance slug used to order different documents inside a
  close-score band.
- **Within-document relevance** — raw numeric score retained between sections sharing one slug.

### Ports

- No new ports. Both `FilesystemDocsCorpus` and `EmbeddedDocsCorpus` continue to delegate to the
  same domain `GuidanceIndex`.

### Constants

- `GUIDANCE_RANKING_POLICY.closeScoreGap = 0.5` — measured maximum gap treated as effectively tied.

### Commit Slices

| #  | Slice                                                               | Gate                                                 | Files                                                                          |
| -- | ------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| S0 | Activate run, record measurement/design, open draft PR              | artifact review + raw git status                     | `.llm/runs/fix-1615-ranking--leaf/**`                                          |
| S1 | Stabilize close-score groups and prove base/fresh guidance behavior | focused guidance tests + fresh-corpus scratch check  | `packages/mcp/src/domain/docs/guidance-index.ts`, focused tests, run artifacts |
| S2 | Prove negative control and full gate set; finalize evidence         | requested gates and raw negative exit                | run artifacts only                                                             |
| S3 | Restore route-winner confidence and answer review limits            | MCP tests + confidence regression + negative control | ranking source, focused test, run artifacts                                    |

### Deferred Scope

- Corpus regeneration and generated assets — sibling PR #1608 owns them.
- Corpus selection (#1260), hybrid retrieval (#1410), and docs content edits.

### Contributor Path

Start at `GUIDANCE_RANKING_POLICY` in `guidance-index.ts`, then read the close-score grouping helper
and its focused boundary tests before changing ranking semantics. Validate both corpus adapters
through `guidance-evaluation_test.ts`.

## PLAN-EVAL

`PLAN-EVAL: N/A` — the owner/orchestrator supplied a complete issue contract, three measurement-
selected directions, hard boundaries, and exact gates; the re-derived near-tie resolves the only
must-decide question to a single internal policy/comparator slice with no public or architectural
decision remaining. Mandatory IMPL-EVAL remains assigned to the separate native Opus 5 session.

## Score Measurement

| Corpus                     |               Direct |               Plugin |        Direct − plugin |          Absolute gap |
| -------------------------- | -------------------: | -------------------: | ---------------------: | --------------------: |
| Base `6aee2b414`           |  `11.80343776647673` | `11.721196841503339` | `+0.08224092497339086` | `0.08224092497339086` |
| Fresh PR #1608 `9e9a9b6f6` | `11.502244339113766` | `11.804224537299888` |  `-0.3019801981861221` |  `0.3019801981861221` |

Decision: direction 1, deterministic close-score tie-break. Concept weighting is rejected because
the gap is not wide; fixture narrowing is rejected because rank three can remain deterministic.

## Progress Log

| Time       | Slice | Step                  | Notes                                                                                                                                                                                                                               |
| ---------- | ----- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 | S0    | bootstrap             | `supervisor.md` created first; required skills, workflow, doctrine, issue, package surface, and sibling PR read.                                                                                                                    |
| 2026-08-12 | S0    | measurement           | Instrumentation matched `GuidanceIndex.find()` and printed both candidates on base and fresh corpora.                                                                                                                               |
| 2026-08-12 | S0    | design                | Locked transitive close-score grouping; PLAN-EVAL recorded N/A with concrete rationale.                                                                                                                                             |
| 2026-08-12 | S1    | implementation        | Added leader-anchored close-score grouping by route/document; the initial implementation incorrectly changed confidence from the route-priority winner to the global maximum.                                                       |
| 2026-08-12 | S1    | focused validation    | Seven focused tests passed; all eight fresh fixture cases passed across two corpus constructions × two query reruns.                                                                                                                |
| 2026-08-12 | S1    | slice review          | Reviewed transitivity, route precedence, same-page scoring, public-surface stability, and scope boundaries; later review correctly identified the uncovered confidence behavior change.                                             |
| 2026-08-12 | S1    | reconcile             | Live issue #1615 remains open; draft PR #1617 has exactly `status:impl`, required labels/milestone/closing keyword, and no new evaluator or reviewer comments.                                                                      |
| 2026-08-12 | S2    | negative control      | Perturbed one locked expectation in commit `5d7ca0f46`; the raw focused test exited `1`, then revert commit `c86a4080f` restored the fixture and the same test exited `0`.                                                          |
| 2026-08-12 | S2    | static validation     | Guidance filter, scoped check/lint/fmt, package doc lint, and repository quality gate passed. Scoped lint/fmt required the package config because implicit root-config discovery rejects the root workspace wildcard on Deno 2.9.5. |
| 2026-08-12 | S2    | repository validation | Full tests had 3321 passing, 17 ignored, and exactly the documented pre-existing #1589 published-JSDoc failure; guidance evaluation passed in the same run.                                                                         |
| 2026-08-12 | S2    | boundary audit        | Raw diff/status confirmed no fixture, lock, generated asset, docs-site, or sibling-owned corpus changes. No E2E or scaffold runtime was run.                                                                                        |
| 2026-08-12 | S3    | review correction     | Restored `topScore` to `ranked[0]?.score` after ordering so route promotion still determines confidence; close-score ordering can reduce that score by at most `0.5`, affecting only exact threshold boundaries.                    |
| 2026-08-12 | S3    | confidence test       | Added a real-index regression: the unhinted global scorer wins with `high`; activating a route promotes a lower scorer and yields `medium`.                                                                                         |
| 2026-08-12 | S3    | negative control      | Re-perturbed the same expectation without committing it; guidance evaluation exited raw `1`, and restoring the fixture returned it to green in the package test run.                                                                |
| 2026-08-12 | S3    | corpus-growth bound   | The slug tie-break is deterministic but arbitrary. A newly added close-scoring document whose slug sorts earlier can change the locked order; the fixture then needs semantic review rather than an automatic relock.               |

## Decisions

| Decision                    | Reason                                                                                                                   | Source                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Use direction 1             | Scores reverse inside a `0.3019801981861221` fresh gap; no wide preference exists.                                       | measurement                |
| Keep golden exact           | Stable tie behavior can preserve all three meaningful ranks.                                                             | issue acceptance + plan D4 |
| No public surface change    | Ranking is internal and both adapters already share it.                                                                  | `deno doc` + code          |
| Preserve route confidence   | Confidence follows the post-order winner; close-score movement is bounded by `0.5`.                                      | review correction          |
| Admit insertion sensitivity | Stable slug order removes corpus-statistic drift for a fixed candidate set, not changes caused by a new close candidate. | review correction          |

## Drift

| Drift                                                                            | Severity | Logged in drift.md |
| -------------------------------------------------------------------------------- | -------- | ------------------ |
| Owner-selected Opus evaluator override; Fable prohibited                         | minor    | yes                |
| Live fresh head moves plugin to second, not only the abbreviated third-rank flip | minor    | yes                |

## Gate Results

### Static Gates

| Gate                             | Command or check                                                                    | Result                 | Notes                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| score measurement                | scratch instrumentation, base + PR #1608 blob                                       | PASS                   | raw exit 0; public/instrumented top three agree                                                                                                                                          |
| focused MCP guidance             | `deno test ... guidance-retrieval_test.ts guidance-evaluation_test.ts`              | PASS                   | exit 0; 7 passed, 0 failed                                                                                                                                                               |
| requested guidance filter        | `rtk proxy deno task test --filter guidance`                                        | PASS                   | exit 0; 13 passed, 0 failed, 3326 filtered (before test title was renamed to include `guidance`; focused run includes it)                                                                |
| requested guidance filter, final | `rtk proxy deno task test --filter guidance`                                        | PASS                   | exit 0; 14 passed, 0 failed, 3325 filtered; 1m50s                                                                                                                                        |
| negative control                 | raw `deno test ... guidance-evaluation_test.ts` at `5d7ca0f46`                      | PASS                   | raw exit `1`; 0 passed, 1 failed; expected `llms#deliberate-negative-control`, actual `llms#getting-started`                                                                             |
| negative-control restore         | same raw focused command after `c86a4080f`                                          | PASS                   | exit 0; 1 passed, 0 failed                                                                                                                                                               |
| repository tests                 | `rtk proxy deno task test`                                                          | EXPECTED BASELINE RED  | exit 1; 3321 passed (624 steps), 1 failed, 17 ignored; sole failure is #1589 at `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6`; guidance passed |
| scoped check                     | `run-deno-check.ts --root packages/mcp --ext ts,tsx`                                | PASS                   | exit 0; 115 selected, 0 failed batches, 0 findings                                                                                                                                       |
| scoped lint                      | `run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS                   | exit 0; 115 selected, 0 failed batches, 0 findings                                                                                                                                       |
| scoped format                    | `run-deno-fmt.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json`  | SUPERSEDED NON-VERDICT | The package tree contains a deliberately malformed formatter fixture; #1618 tracks a usable scoped verdict. S3 uses exact touched-file `deno fmt --check`.                               |
| package doc lint                 | `deno task doc:lint --root packages/mcp --pretty`                                   | PASS                   | exit 0; combined total errors 0                                                                                                                                                          |
| repository quality               | `rtk proxy deno task quality:gate`                                                  | PASS                   | exit 0; quality scan findings 0; doctrine scan `mcp: FAIL=0` (3 existing warnings, 1 info)                                                                                               |
| S3 focused guidance              | raw focused retrieval + evaluation tests                                            | PASS                   | exit 0; 8 passed, 0 failed, including route-promoted confidence semantics                                                                                                                |
| S3 MCP package tests             | `rtk proxy deno task test` from `packages/mcp`                                      | PASS                   | exit 0; 136 passed, 0 failed                                                                                                                                                             |
| S3 check                         | `run-deno-check.ts --root packages/mcp --ext ts,tsx`                                | PASS                   | exit 0; 115 selected, 0 failed batches/findings                                                                                                                                          |
| S3 lint                          | `run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS                   | exit 0; 115 selected, 0 findings                                                                                                                                                         |
| S3 exact-file format             | `deno fmt --check` on touched source/test files                                     | PASS                   | exit 0; scoped package formatting is not claimed                                                                                                                                         |
| S3 negative control              | uncommitted fixture perturbation + raw guidance evaluation                          | PASS                   | raw exit `1`; fixture restored before package tests and commit                                                                                                                           |

### Fitness Gates

| Gate             | Result | Evidence                                        | Notes                           |
| ---------------- | ------ | ----------------------------------------------- | ------------------------------- |
| JSR surface scan | PASS   | `deno doc packages/mcp/mod.ts`; package exports | planned change is internal only |

### Runtime Gates

| Gate              | Result | Evidence                                 | Notes                                                                               |
| ----------------- | ------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| guidance behavior | PASS   | base focused test + fresh scratch loader | base adapters agree twice; fresh 8 cases pass for 2 corpus constructions × 2 reruns |

### Consumer Gates

| Consumer                | Result | Evidence                       | Notes                                                 |
| ----------------------- | ------ | ------------------------------ | ----------------------------------------------------- |
| `find_guidance` callers | PASS   | guidance contract/filter tests | public result shape unchanged; exact golden preserved |

## Negative-Control Commit Trail

| Commit      | Purpose                        | Net result                                                                     |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `5d7ca0f46` | Throwaway fixture perturbation | Proved the locked evaluation detects an incorrect anchor with raw exit `1`.    |
| `c86a4080f` | Git revert of the perturbation | Restored the fixture exactly; both commits remain auditable in branch history. |

## Deliberate Omissions

- Did not edit or regenerate `.llm/assets/agent-docs/**`, `.llm/tools/docs/**`, generated publish
  assets, or `docs/site`; sibling PR #1608 retains sole ownership.
- Did not alter the guidance golden or any unrelated fixture case.
- Did not implement #1260 or #1410 scope.
- Did not run `e2e:cli` or `scaffold.runtime`, mutate the root formatter, reload/delete caches or
  locks, mark the draft ready, merge, cycle `status:impl`, or dispatch/retrigger evaluation.

## Handoff Notes

- Evaluator should inspect the grouping boundary/transitivity tests, the fresh corpus proof, and the
  raw negative-control exit first.
- Mandatory IMPL-EVAL remains intentionally absent from this implementation session; the
  orchestrator owns the separate native Opus 5 read-only evaluation of the immutable final head.
