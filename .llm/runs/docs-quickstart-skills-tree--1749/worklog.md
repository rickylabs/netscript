# Worklog: quickstart canonical skills tree

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-quickstart-skills-tree--1749` |
| Branch | `docs/quickstart-skills-tree` |
| Archetype | N/A — docs-only |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- `docs/site/quickstart.vto` scaffold ownership tree.

### Domain Vocabulary

- `[generated]` — an artifact replaced by a generator.
- canonical skill tree — `.agents/skills/`, installed for every resolved host set.
- derived host mirror — `.claude/skills/`, installed only when Claude is among the resolved hosts.

### Ports and Constants

- No ports or new constants; this is a one-row documentation change.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| S1 | Expose the canonical skills tree and record harness decisions. | docs/site format + build | `docs/site/quickstart.vto`; required run artifacts |
| S2 | Regenerate the complete derived corpus chain. | three freshness gates + targeted `deno check` | generator outputs only |

### Deferred Scope

- Host/editor framing across other pages remains with #1745 follow-up scope.
- `.claude/skills/` remains omitted from this host-neutral illustration.

### Contributor Path

Future scaffold-tree updates should verify ownership and conditionality in the responsible generator,
edit the smallest illustrative row set, then regenerate the docs corpus through repository tasks.

## Research

- Baseline and `origin/main` both resolved to `13878a80a50c55b9662099fed64555f2310ae4a3` at activation.
- The branch is `docs/quickstart-skills-tree` with no upstream.
- Issue #1749 is open, labeled docs/p3/triage, and assigned `Backlog / Triage`.
- `initAgent()` writes canonical skill files to `.agents/skills/` before host-specific configuration.
- `.claude/skills/` is a copy made only inside `hosts.includes("claude")`.
- The three generator files confirm the full derived chain recorded in `plan.md`.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | S1 | Research and design | Source truth, ownership, host conditionality, and generator chain re-derived. |
| 2026-08-30 | S1 | PLAN-EVAL | N/A: bounded mechanical docs slice with no unresolved decision. |
| 2026-08-30 | S1 | Implementation | Added one `.agents/skills/` row; did not add the conditional Claude mirror. |

## Gate Results

| Gate | Exit | Result |
| --- | ---: | --- |
| `deno task --cwd docs/site check:source-format` | 0 | PASS |
| `deno task --cwd docs/site build` | 0 | PASS |
| `deno task --cwd docs/site check:links` | 0 | PASS |
| `deno task --cwd docs/site check:caveats` | 0 | PASS |
| `deno task docs:links` | 0 | PASS |
| `deno task docs:accuracy` | 0 | PASS |
| `deno task docs:snippets` | 0 | PASS |
| `deno task docs:exports-drift` | 0 | PASS |

The generated-asset and targeted type-check exit codes are recorded in the PR validation table after
S2 generation. `diagrams:check` is N/A: the change contains no Mermaid or SVG, and this host has no
Chromium. Root fmt/lint are N/A because `docs/site` excludes `*.vto`; the governing formatter is
`docs/site check:source-format`.

## Reconcile note

Issue #1749 remains open and on `Backlog / Triage`; this run will not relabel or close it. The PR
must use `Closes #1749`, target `main`, and remain third behind #1746 and #1748 in the serial
docs-corpus queue.

## Handoff Notes

- Verify the exact `initAgent()` ordering and the two explicit documentation decisions first.
- Verify S2 contains only generator output and provenance `sourceCommit` equals S1's short SHA.
- Independently execute every required gate during IMPL-EVAL.
