# Context Pack: agent init skill discoverability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1023-agent-init-skill-surface--skills-discoverability` |
| Branch | `fix/1023-agent-init-skill-surface` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research confirms the issue's cause: source content/manifest and generated asset freshness, not installer iteration. The exact supplied repro command is stale, but the actual contributor entrypoint run from a temp cwd reproduces the three-skill/164-line/dead-Aspire-route artifact.

## Completed

- Requested skills and harness references loaded.
- Repro and focused source/draft/docs baseline completed.
- Plan and Design checkpoint prepared.

## In Progress

- Slice 1 source/content ready to commit; slice 2 regeneration and validation next.

## Next Steps

1. Implement and validate source/content/tests/docs slice.
2. Regenerate and prove the embedded artifact with the full scoped gate set.
3. Run separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve installer logic | source/research | It already writes every non-manifest embedded entry. |
| Manifest-derived route test | issue/plan | Prevents all dangling installed-skill routes. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1023-agent-init-skill-surface--skills-discoverability/` | new | harness research/plan/design state |
| `skills/**` | changed/new | five-skill manifest, adapted drafts, repaired routes, symptom playbook |
| `packages/cli/src/public/features/agent/init/` | changed | AGENTS guidance and semantic installer test |
| `README.md`, `docs/site/reference/**`, `deno.json` | changed | enumerations and generated freshness gate |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md`; OpenHands run 30714594170 |
| Static/Fitness/Consumer | not run | implementation prohibited before PLAN-EVAL |

## Open Questions

- None.

## Drift and Debt

- Drift: requested repro entry/flag stale; actual behavior reproduced through the live entrypoint.
- Debt: none created or closed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
