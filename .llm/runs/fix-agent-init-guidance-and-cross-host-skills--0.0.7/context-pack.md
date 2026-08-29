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

Tier-A accepted the checkpoint and selected `[post-merge]` for all three behavioural boxes. Exact
current `main` `8b1e42f725919457c64781d5973fd419017fab13` is merged without rebasing at
`a04e505f4bd837c4237cd98e55d143f61f11816a`. All four shared derivatives regenerate idempotently,
all four shared checks exit 0, focused tests/check/lint and fresh scaffold proof pass, and the five
product paths are byte-identical to accepted head `83d24ba57...`. Structured fmt retains the
previous accepted legacy-style exception (exit 1, three whole-file findings).

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
- Merged current `main` without rewriting the attested author commits.
- Regenerated agent-doc prose, assets barrel, MCP export corpus, and publish assets in the required order.
- Re-ran all shared and product evidence against the merged tree.

## In Progress

- Final integration evidence commit, PR closing-keyword update, and explicit push.

## Next Steps

1. Commit the integration evidence without changing product paths.
2. Push with the explicit full feature-branch refspec.
3. Add the three authorized closing keywords and `[post-merge]` follow-up statement to draft PR #1729.
4. Report exact final head and stop for the fresh opposite-family IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Five-path product ceiling | `research.md` / `plan.md` | Any extra product path is rescope. |
| Canonical `.agents`, conditional derived `.claude` | #1675 / D1-D2 | Canonical emitted for every host. |
| Universal root guidance | #1672/#1674/#1675 / D3-D7 | Pointer surface, existing marked upsert. |
| Behavioural acceptance | Tier-A decision | All three are `[post-merge]`; one unfamiliar-agent wave measures them together. |
| Current-main integration | Tier-A integration brief | Merge, never rebase; regenerate shared derivatives only through generators. |

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
| Static | PASS with retained format exception | Merged-tree test 22/22 and check/lint clean; fmt reports the same three legacy whole-file findings. |
| Fitness | PASS | Durable `quality-gate.json` and `cli-publish-dry-run.json` at `2f4b8c00d...`. |
| Runtime | N/A | E2E/Aspire/Docker unauthorized. |
| Shared derivatives | PASS | Four required `check:` tasks each exited 0 after ordered regeneration. |
| Consumer | PASS | Fresh merged-tree 150-file workspace, host-all docs output and mirror equality; complete command exited 0. |

## Open Questions

- None for the author lane. Fresh opposite-family IMPL-EVAL remains external.

## Drift and Debt

- Drift: two significant older-comment/re-intake conflicts, CLI formatter-policy mismatch, local
  scaffold docs-evidence normalization, and live-base advance recorded in `drift.md`.
- Debt: no new debt; existing CLI public-doc completeness debt is not deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
- Slice 1: `83c605b9dae1238e44f59be8feb8e6f5ec21990f` — harness research/plan.
- Slice 2: `2f4b8c00d664f0c03f22946d1e0315cb7819303e` — product implementation.
- Integration merge: `a04e505f4bd837c4237cd98e55d143f61f11816a` — exact current `main`, no rebase.
