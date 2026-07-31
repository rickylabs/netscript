# Context Pack: fresh-ui registry SDK subpath dependencies (#953 / #956)

## Run Metadata

| Field          | Value                               |
| -------------- | ----------------------------------- |
| Run ID         | `fix-freshui-registry-sdk-pin--953` |
| Branch         | `fix/freshui-registry-sdk-pin`      |
| Current phase  | `plan`                              |
| Archetype      | `6 - CLI / Tooling`                 |
| Scope overlays | `frontend`                          |

## Current State

Research and plan are complete and the design checkpoint is recorded. The defect is understood and
reproduced by execution: two compounding causes, not one. Implementation has not started.

## Completed

- Research (`research.md`, F1–F12) — every claim in the owner's root-cause comment re-verified
  against `main` @ `8e0bcef39`, plus the two findings that widen it.
- Plan (`plan.md`) — archetype, locked decisions D1–D5, risk register, gate set.
- Design checkpoint (`worklog.md` § Design) — public surface, vocabulary, five commit slices.
- Drift (`drift.md`) — five entries.

## In Progress

- Slice 1: run-dir bootstrap commit + draft PR.

## Next Steps

1. Commit the run dir, open the draft PR, apply labels.
2. Slice 2 — `importEntryForDependency` + merge/prune symmetry + tests.
3. Slice 3 — manifest pins → `0.0.1-beta.11`.
4. Slice 4 — guard rules (currency, export existence, range reporting) + tests.
5. Slice 5 — full gate set, PR finalisation, follow-up issue for range pins.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Normalise the import-map value to the package root | plan D1 | Executed proof; one entry serves root + all subpaths |
| Extend `check-netscript-jsr-specifiers.ts` | plan D2 | Already a `ci:quality` dependency |
| Currency vs. the workspace member's own version | plan D3 | Names the disagreeing package |
| Range pins reported, not failed | plan D4 | Skew, not breakage |
| Evaluator passes `NOT_RUN` | plan D5 | Single-session run cannot self-certify |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-freshui-registry-sdk-pin--953/**` | new | run artifacts |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | `NOT_RUN`      | — |
| Fitness     | `NOT_RUN`      | — |
| Runtime     | `N/A`          | not a release cut |
| Consumer    | `PASS (probe)` | `/tmp/sdkprobe` three `deno check` runs |

## Open Questions

- None blocking. Q1 and Q2 resolved in `research.md`.

## Drift and Debt

- Drift: five entries — filed root cause incomplete; MCP beta.9 not reproducible; bump cannot see
  `.ts` residue; range-pin skew deferred; evaluator passes not run.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
