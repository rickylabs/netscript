# Context Pack: agent-init guidance and cross-host skills

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-init-guidance-and-cross-host-skills--0.0.7` |
| Branch | `fix/agent-init-guidance-and-cross-host-skills` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Implementation is complete within the five-path ceiling and pushed as
`2f4b8c00d664f0c03f22946d1e0315cb7819303e`. The generated barrel, focused tests (22/22), scoped
check/lint, fresh-scaffold consumer proof, durable quality/doctrine gate, and CLI publish dry-run all
pass. The structured formatter exception and behavioural decisions remain for Tier-A disposition.

## Completed

- Read required harness/CLI/doctrine/tooling/toolchain/PR/RTK/JSR instructions and relevant doctrine.
- Re-baselined branch, package archetype/verdict, live issues/comments, installer, app guide, asset
  generator, tests, and public/JSR surface.
- Mapped every acceptance box separately for #1672, #1674, and #1675.
- Identified the three behavioural boxes that require supervisor disposition.
- Opened draft PR #1729 without closing keywords.
- Implemented one composed root guidance asset with issue-separated semantic assertions.
- Installed canonical `.agents/skills` for every host and derived Claude mirrors from canonical bytes.
- Proved a fresh scaffold emits the contracted guidance, configs, offline docs, and byte-identical mirrors.

## In Progress

- Slice 3 evidence commit, PR update, and Tier-A stop.

## Next Steps

1. Commit/push the run-only evidence update with an explicit full refspec.
2. Update draft PR #1729 with Slice 2/3 evidence without closing keywords or readiness changes.
3. Report exact final head and stop for Tier-A.

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
| Run artifacts in this directory | updated | Research, plan, design, context, drift, gate and supervisor evidence. |
| `packages/cli/src/kernel/assets/agent/guidance.md.template` | new | Compact build/Deno/skill/MCP pointer surface. |
| `packages/cli/src/kernel/assets/manifest.ts` | modified | Adds the guidance asset key at the stable end of the registry. |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | regenerated | Shipping barrel includes the guidance bytes. |
| `packages/cli/src/public/features/agent/init/init-agent.ts` | modified | Universal canonical install, derived Claude mirror, root guide render. |
| `packages/cli/src/public/features/agent/init/init-agent_test.ts` | modified | Issue-separated guidance and host/canonical/mirror proofs. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS with format exception pending Tier-A | Test 22/22, check/lint clean; CLI is excluded from authoritative root fmt config. |
| Fitness | PASS | Durable `quality-gate.json` and `cli-publish-dry-run.json` at `2f4b8c00d...`. |
| Runtime | N/A | E2E/Aspire/Docker unauthorized. |
| Consumer | PASS | `scaffold-proof.json`: fresh 150-file workspace, host-all docs output and mirror equality. |

## Open Questions

- Supervisor: `[post-merge]` markers or explicit rejection for the three behavioural boxes?

## Drift and Debt

- Drift: two significant older-comment/re-intake conflicts, CLI formatter-policy mismatch, local
  scaffold docs-evidence normalization, and live-base advance recorded in `drift.md`.
- Debt: no new debt; existing CLI public-doc completeness debt is not deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
- Slice 1: `83c605b9dae1238e44f59be8feb8e6f5ec21990f` — harness research/plan.
- Slice 2: `2f4b8c00d664f0c03f22946d1e0315cb7819303e` — product implementation.
