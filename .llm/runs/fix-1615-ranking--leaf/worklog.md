# Worklog: deterministic guidance ranking

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1615-ranking--leaf` |
| Branch | `fix/1615-guidance-ranking-determinism` |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Design

### Public Surface

- No exported function, type, entry point, tool contract, or CLI command changes.
- Existing `GuidanceIndex.find(intent)` behavior remains the sole internal ranking entry.

### Domain Vocabulary

- **Close-score band** — a leader-anchored set of candidates in one route whose numeric scores are
  within the policy gap and therefore not trustworthy as a cross-document total order.
- **Stable document identity** — normalized guidance slug used to order different documents inside
  a close-score band.
- **Within-document relevance** — raw numeric score retained between sections sharing one slug.

### Ports

- No new ports. Both `FilesystemDocsCorpus` and `EmbeddedDocsCorpus` continue to delegate to the
  same domain `GuidanceIndex`.

### Constants

- `GUIDANCE_RANKING_POLICY.closeScoreGap = 0.5` — measured maximum gap treated as effectively tied.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S0 | Activate run, record measurement/design, open draft PR | artifact review + raw git status | `.llm/runs/fix-1615-ranking--leaf/**` |
| S1 | Stabilize close-score groups and prove base/fresh guidance behavior | focused guidance tests + fresh-corpus scratch check | `packages/mcp/src/domain/docs/guidance-index.ts`, focused tests, run artifacts |
| S2 | Prove negative control and full gate set; finalize evidence | requested gates and raw negative exit | run artifacts only |

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

| Corpus | Direct | Plugin | Direct − plugin | Absolute gap |
| ------ | -----: | -----: | -------------: | -----------: |
| Base `6aee2b414` | `11.80343776647673` | `11.721196841503339` | `+0.08224092497339086` | `0.08224092497339086` |
| Fresh PR #1608 `9e9a9b6f6` | `11.502244339113766` | `11.804224537299888` | `-0.3019801981861221` | `0.3019801981861221` |

Decision: direction 1, deterministic close-score tie-break. Concept weighting is rejected because
the gap is not wide; fixture narrowing is rejected because rank three can remain deterministic.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-12 | S0 | bootstrap | `supervisor.md` created first; required skills, workflow, doctrine, issue, package surface, and sibling PR read. |
| 2026-08-12 | S0 | measurement | Instrumentation matched `GuidanceIndex.find()` and printed both candidates on base and fresh corpora. |
| 2026-08-12 | S0 | design | Locked transitive close-score grouping; PLAN-EVAL recorded N/A with concrete rationale. |
| 2026-08-12 | S1 | implementation | Added leader-anchored close-score grouping by route/document and preserved maximum-score confidence. |
| 2026-08-12 | S1 | focused validation | Seven focused tests passed; all eight fresh fixture cases passed across two corpus constructions × two query reruns. |
| 2026-08-12 | S1 | slice review | Reviewed the source/test diff for transitivity, route precedence, same-page scoring, confidence preservation, public-surface stability, and scope boundaries; no overreach or generated/lock churn found. |
| 2026-08-12 | S1 | reconcile | Live issue #1615 remains open; draft PR #1617 has exactly `status:impl`, required labels/milestone/closing keyword, and no new evaluator or reviewer comments. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use direction 1 | Scores reverse inside a `0.3019801981861221` fresh gap; no wide preference exists. | measurement |
| Keep golden exact | Stable tie behavior can preserve all three meaningful ranks. | issue acceptance + plan D4 |
| No public surface change | Ranking is internal and both adapters already share it. | `deno doc` + code |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Owner-selected Opus evaluator override; Fable prohibited | minor | yes |
| Live fresh head moves plugin to second, not only the abbreviated third-rank flip | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| score measurement | scratch instrumentation, base + PR #1608 blob | PASS | raw exit 0; public/instrumented top three agree |
| focused MCP guidance | `deno test ... guidance-retrieval_test.ts guidance-evaluation_test.ts` | PASS | exit 0; 7 passed, 0 failed |
| requested guidance filter | `rtk proxy deno task test --filter guidance` | PASS | exit 0; 13 passed, 0 failed, 3326 filtered (before test title was renamed to include `guidance`; focused run includes it) |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| JSR surface scan | PASS | `deno doc packages/mcp/mod.ts`; package exports | planned change is internal only |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| guidance behavior | PASS | base focused test + fresh scratch loader | base adapters agree twice; fresh 8 cases pass for 2 corpus constructions × 2 reruns |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `find_guidance` callers | PASS | guidance contract/filter tests | public result shape unchanged; exact golden preserved |

## Handoff Notes

- Evaluator should inspect the grouping boundary/transitivity tests, the fresh corpus proof, and
  the raw negative-control exit first.
