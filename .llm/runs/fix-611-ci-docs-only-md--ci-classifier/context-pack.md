# Context Pack: #611 CI Markdown-only classifier

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-611-ci-docs-only-md--ci-classifier` |
| Branch | `fix/611-ci-docs-only-md` |
| Current phase | `implement` |
| Archetype | `N/A` |
| Scope overlays | `docs` |

## Current State

Research, locked plan, Design checkpoint, and separate-session PLAN-EVAL are complete against `origin/main` `720fcb7e`; implementation is unlocked.

## Completed

- Loaded harness, PR, tools, docs overlay, gate matrix, and PLAN-EVAL protocol.
- Inspected classifier, tests, source skills, issue #611, branch, and clean worktree.
- Separate Claude Opus PLAN-EVAL returned `PASS` in `plan-eval.md`.

## In Progress

- Classifier implementation and focused regressions.

## Next Steps

1. Implement slices 2–3 and run named gates.
2. Obtain IMPL-EVAL and finalize PR status/metadata.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Global Markdown/MDX precedence with explicit critical overrides | issue #611 / plan D1 | Covers package/plugin/app README-only diffs. |
| Preserve rename/copy dual-path parsing | issue #611 / plan D2 | Prevents source rename holes. |

## Drift and Debt

- Drift: none so far.
- Debt: none.

## Commits

- See draft PR commit list and per-slice comments.
