# Context Pack: package-backed plugin registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-package-backed-plugin-generate--0.0.7` |
| Branch | `fix/package-backed-plugin-generate` |
| Current phase | `research` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Issue #1966 is re-baselined at dispatch base `79adb103b`. Harness research/plan/design are activated; PLAN-EVAL is N/A because the canonical brief already fixes the bounded repair decisions. The bootstrap slice is committed at `2d137cfa9`; check and quality pass, while the exact lint/fmt wrapper commands expose a pre-existing root-config exclusion that prevents complete CLI coverage.

## Completed

- Read issue acceptance/evidence, all requested skills, harness workflow/gates/routes, applicable Archetype 5/6 doctrine, current verdicts, and relevant debt.
- Traced the command into the installed-runtime generator far enough to identify the two causal candidates.
- Ran bootstrap pre-push gates: scoped check and `quality:gate` passed; scoped lint/fmt failed closed on the baseline `packages/cli/` exclusion and are recorded as drift.

## In Progress

- Exact published Canary 8 reproduction from repository and project cwd.

## Next Steps

1. Create identical dedicated roots and record published two-cwd output/tree.
2. Run baseline local CLI against the same shape.
3. Commit deterministic RED, then repair and gate GREEN.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Explicit project root is authoritative | CLI contract / issue #1966 | Regression must distinguish cwd. |
| PLAN-EVAL N/A | harness run loop | Mechanical bounded fix. |
| Fable 5 medium final evaluator | lane policy | Fresh native opposite-family session. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-package-backed-plugin-generate--0.0.7/*` | new | Harness activation and carried implement brief. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | partial/baseline blocker | Check PASS; lint/fmt exact commands refuse root-excluded CLI coverage. |
| Fitness | PASS at bootstrap | `deno task quality:gate` exit 0 at `2d137cfa9`. |
| Runtime | pending | Published two-cwd reproduction. |
| Consumer | pending | Package-backed regression and hosted suite. |

## Open Questions

- Root/cwd bug or package-backed manifest/generator bug?
- Does baseline local CLI reproduce it?

## Drift and Debt

- Drift: baseline root lint/fmt configuration excludes `packages/cli/`, so the exact scoped wrapper commands fail closed; outside the issue ceiling.
- Debt: no new debt; existing CLI and workers debt is baseline only.

## Commits

- See the draft PR's commit list + per-slice PR comments.
