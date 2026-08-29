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

Implementation is complete within the five-path ceiling. The generated barrel is current, focused
tests pass 22/22, scoped check/lint pass, and the real fresh-scaffold consumer proof passes. Slice 2
is ready to commit; durable asset/quality/publish gates then run against its immutable SHA.

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

- Slice 2 implementation commit and durable validation.

## Next Steps

1. Commit/push Slice 2 with an explicit full refspec.
2. Run durable asset freshness and quality/architecture gates against that SHA plus CLI publish dry-run.
3. Record the formatter-policy exception and final receipts in Slice 3.
4. Push, update draft PR evidence, and stop for Tier-A.

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
| Fitness | PENDING | Durable `quality:gate` after Slice 2 commit. |
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
