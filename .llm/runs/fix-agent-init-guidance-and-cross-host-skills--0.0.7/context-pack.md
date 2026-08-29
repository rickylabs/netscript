# Context Pack: agent-init guidance and cross-host skills

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-init-guidance-and-cross-host-skills--0.0.7` |
| Branch | `fix/agent-init-guidance-and-cross-host-skills` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Research and design are complete at baseline `5bb112dd35f94fc8435672e2cabff1f9a447aa0b`.
The product tree is unchanged. The plan locks a five-path product ceiling, treats the current
re-intake as authority over conflicting older issue comments, and records PLAN-EVAL as N/A.

## Completed

- Read required harness/CLI/doctrine/tooling/toolchain/PR/RTK/JSR instructions and relevant doctrine.
- Re-baselined branch, package archetype/verdict, live issues/comments, installer, app guide, asset
  generator, tests, and public/JSR surface.
- Mapped every acceptance box separately for #1672, #1674, and #1675.
- Identified the three behavioural boxes that require supervisor disposition.

## In Progress

- Slice 1 harness bootstrap commit and draft PR opening.

## Next Steps

1. Commit/push the run bootstrap with explicit refspec and open a draft PR without closing keywords.
2. Implement the guidance asset, canonical skill install, Claude mirror, and semantic tests.
3. Regenerate assets and run focused/scaffold/quality/publish gates.
4. Update artifacts/PR evidence and stop for Tier-A.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Five-path product ceiling | `research.md` / `plan.md` | Any extra product path is rescope. |
| Canonical `.agents`, conditional derived `.claude` | #1675 / D1-D2 | Canonical emitted for every host. |
| Universal root guidance | #1672/#1674/#1675 / D3-D7 | Pointer surface, existing marked upsert. |
| Behavioural acceptance deferred to supervisor | grouped brief | Recommended `[post-merge]`; not decided locally. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| Run artifacts in this directory | new | Research, plan, design, context, drift, supervisor identity. |
| Product paths | unchanged | Implementation has not begun. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Planned scoped wrappers. |
| Fitness | NOT_RUN | `quality:gate`, JSR scan recorded. |
| Runtime | N/A | E2E/Aspire/Docker unauthorized. |
| Consumer | NOT_RUN | Fresh real CLI scaffold proof planned. |

## Open Questions

- Supervisor: `[post-merge]` markers or explicit rejection for the three behavioural boxes?

## Drift and Debt

- Drift: two significant older-comment/re-intake conflicts recorded in `drift.md`.
- Debt: no new debt; existing CLI public-doc completeness debt is not deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
