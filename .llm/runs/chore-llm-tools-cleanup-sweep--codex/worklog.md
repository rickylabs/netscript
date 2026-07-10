# Worklog: non-agentic `.llm/tools/` cleanup sweep

## Run Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `chore-llm-tools-cleanup-sweep--codex` |
| Branch         | `chore/llm-tools-cleanup-sweep`        |
| Archetype      | `6 — CLI / Tooling`                    |
| Scope overlays | docs maintenance                       |

## Design

### Public Surface

- Existing `deno.json` task names and workflow script paths remain contracts.
- Direct script CLIs retain flags, output schemas/text, and exit codes.

### Domain Vocabulary

- **authoritative reference** — mention in AGENTS, harness, skills, tasks, hooks, workflows, or
  maintained docs.
- **live consumer** — importer, spawned path, task, workflow, fixture, or generated provenance.
- **ambiguous keep** — lacks direct owner authority but participates in a live consumer chain.

### Ports

- Existing filesystem, subprocess, registry, GitHub, and release edges remain unchanged unless moved
  without behavior change.

### Constants

- No new finite vocabulary is required before the focused volatile scan.

### Commit Slices

See `plan.md`; five ordered slices, each with explicit gate evidence.

### Deferred Scope

- Behavior redesign and speculative architecture seams.

### Contributor Path

Start at `.llm/tools/README.md`, choose the concern folder, then use its README/maintenance map and
the stable root task name.

## Progress Log

| Time       | Slice | Step               | Notes                                                                                                                       |
| ---------- | ----- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-11 | 1     | baseline           | 55 TS files: check 0, lint 0, fmt 7 pre-existing, tests 23/23.                                                              |
| 2026-07-11 | 2     | coordinator gate   | Owner-waived external evaluator; separate Opus 4.8 coordinator approved with e2e KEEP correction.                           |
| 2026-07-11 | 2     | legacy removal     | Deleted five approved unreferenced search tools; repaired retained e2e documented path.                                     |
| 2026-07-11 | 2     | reconcile          | PR #595 remains independent; no issue-closing keyword applies.                                                              |
| 2026-07-11 | 3     | Deno/@std          | Replaced two hand-rolled dirname helpers with `@std/path`; centralized duplicated JSR API endpoint under `release/config/`. |
| 2026-07-11 | 3     | consistency        | Resolved all seven pre-existing formatter findings without changing contracts; added endpoint drift guard.                  |
| 2026-07-11 | 3     | reconcile          | No new deletion or dependency; `deno.lock` restored after validator wildcard churn.                                         |
| 2026-07-11 | 4     | docs               | Rewrote the concern map, retained e2e description, and maintenance map; removed deleted search documentation.               |
| 2026-07-11 | 4     | canonical pointers | Updated `netscript-tools` source skill and regenerated its Claude mirror.                                                   |
| 2026-07-11 | 4     | reconcile          | Rechecked documented tasks and paths; deletion list remains explicit in inventory and PR.                                   |

## Gate Results

Slice 2 evidence: scoped check 53 files/0 findings; lint 0; fmt 0; raw touched-file check exit 0; 11
touched tests passed.

### Final gate evidence — 2026-07-11

| Gate                        | Raw result                                                               |
| --------------------------- | ------------------------------------------------------------------------ |
| Scoped check                | 53 files selected; 0 occurrences; 0 failed batches                       |
| Scoped lint                 | 53 files selected; 0 occurrences; exit 0                                 |
| Scoped format               | 53 files selected; 0 findings; 0 failed batches                          |
| Raw touched-file check      | 14 surviving touched TS files; `RAW_CHECK_EXIT=0`                        |
| Touched tests               | 11 passed; 0 failed; `TOUCHED_TEST_EXIT=0`                               |
| Docs maintenance            | 96 docs; 0 broken links/anchors; mirror and Claude surface clean; exit 0 |
| Whole-repo stale references | No live basename matches for any deleted search tool                     |
| Whitespace                  | `git diff --check` exit 0                                                |
| Lock hygiene                | No committed `deno.lock` delta; validator-created wildcard rows removed  |

Raw logs are retained in `.llm/tmp/llm-tools-cleanup/final/` and summarized here because scratch
artifacts are not committed.
