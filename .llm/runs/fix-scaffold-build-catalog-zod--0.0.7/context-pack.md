# Context Pack: scaffold Fresh production build catalog resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-build-catalog-zod--0.0.7` |
| Branch | `fix/scaffold-build-catalog-zod` |
| Current phase | `impl-eval handoff` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `frontend` |

## Current State

The RED regression is committed and pushed. GREEN materializes the app's Zod npm target from the
single workspace-catalog authority, seeds the Zod contract required by the immediate production
route graph, and clears only known seed artifacts before real codegen. The exact clean consumer
sequence now exits `0/0/0/0`; PLAN-EVAL remains N/A for this fully determined mechanical fix.

## Completed

- Skill/doctrine/harness bootstrap and explicit-baseline verification.
- Exact issue reproduction and app catalog reachability inventory.
- Fresh/Deno resolver ownership and differential proof.
- Plan and Design checkpoint.
- Deterministic RED commit `0fa3f6e564747a737cd0683071af7124d642e010`.
- GREEN focused tests (35/35), exact two-build consumer proof, `quality:gate`, and repo check.

## In Progress

- Commit GREEN and capture immutable-head receipts before the final push.

## Next Steps

1. Push GREEN, make PR #1974 non-draft, and post the implementation summary.
2. Hosted tiers and the separate opposite-family IMPL-EVAL supply the remaining evidence.
3. Do not merge in this generator session.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| App Zod mapping is explicit npm materialization from workspace catalog authority | `plan.md` D1 | No second version constant. |
| Init seeds disposable Zod CRUD schemas | `plan.md` D3 | Real codegen overwrites exact path. |
| No `packages/fresh` changes | `research.md` findings 6–7 | Failing resolver belongs upstream. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-scaffold-build-catalog-zod--0.0.7/*` | updated | Harness context, drift, and evidence. |
| `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts` | changed | Explicit app npm target derived from root catalog authority. |
| `packages/cli/src/kernel/adapters/database/scaffolder.ts` | changed | Disposable Zod contract plus exact-file seed cleanup. |
| `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts` | changed | Cleanup permission covers known generated seed paths. |
| focused CLI tests | changed | Semantic app import, seed, cleanup, and generated task coverage. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Check/tests/repo check PASS; lint/fmt wrapper baseline refusal recorded | `worklog.md`, `drift.md` |
| Fitness | `quality:gate` PASS | `worklog.md` |
| Runtime | Local runtime lease prohibited; hosted pending | Implement brief |
| Consumer | Exact init/build/codegen/build PASS (`0/0/0/0`) | `worklog.md` raw excerpts |

## Open Questions

- None before implementation.

## Drift and Debt

- Drift: Prisma non-empty output behavior resolved; baseline CLI lint/fmt exclusion recorded.
- Debt: no new/deepened debt; existing unrelated CLI debts retained.

## Commits

- See the draft PR's commit list + per-slice PR comments.
