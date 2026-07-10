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

| Time       | Slice | Step     | Notes                                                          |
| ---------- | ----- | -------- | -------------------------------------------------------------- |
| 2026-07-11 | 1     | baseline | 55 TS files: check 0, lint 0, fmt 7 pre-existing, tests 23/23. |
| 2026-07-11 | 2 | coordinator gate | Owner-waived external evaluator; separate Opus 4.8 coordinator approved with e2e KEEP correction. |
| 2026-07-11 | 2 | legacy removal | Deleted five approved unreferenced search tools; repaired retained e2e documented path. |
| 2026-07-11 | 2 | reconcile | PR #595 remains independent; no issue-closing keyword applies. |

## Gate Results

Slice 2 evidence: scoped check 53 files/0 findings; lint 0; fmt 0; raw touched-file check exit 0;
11 touched tests passed.
