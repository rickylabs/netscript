# Context Pack: scaffold Fresh production build catalog resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-build-catalog-zod--0.0.7` |
| Branch | `fix/scaffold-build-catalog-zod` |
| Current phase | `corrective implementation` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `frontend` |

## Current State

The original RED/GREEN is committed and pushed. Hosted e2e-cli run 33706833254 exposed a Deno 2.9
type error in the emitted cleanup script: `Deno.errors.DirectoryNotEmpty` does not exist. The
corrective slice now removes the Zod directory recursively, treats only `NotFound` as benign, and
type-checks the emitted script in the focused scaffolder test. The exact local `scaffold.service`
suite passes 5/5, including `generated.service-check`.

## Completed

- Skill/doctrine/harness bootstrap and explicit-baseline verification.
- Exact issue reproduction and app catalog reachability inventory.
- Fresh/Deno resolver ownership and differential proof.
- Plan and Design checkpoint.
- Deterministic RED commit `0fa3f6e564747a737cd0683071af7124d642e010`.
- GREEN focused tests (35/35), exact two-build consumer proof, `quality:gate`, and repo check.
- Corrective emitted-sample RED reproducing hosted TS2339.
- Corrective GREEN focused tests (35/35), scoped check, and exact static scaffold tier (5/5).

## In Progress

- Commit corrective slice 3 and capture immutable-head receipts before push.

## Next Steps

1. Push corrective slice 3 and post its exact-head receipts on PR #1974.
2. Hosted tiers rerun on push; separate opposite-family IMPL-EVAL must evaluate the new head.
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
| `packages/cli/src/kernel/adapters/database/scaffolder.ts` | changed | Disposable Zod contract plus Deno 2.9-compatible recursive seed cleanup. |
| `packages/cli/src/kernel/templates/database/generate-db-deno-json.ts` | changed | Cleanup permission covers known generated seed paths. |
| focused CLI tests | changed | Semantic app import, seed, cleanup, generated task, and emitted-script typecheck coverage. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Corrective check/tests PASS; exact `scaffold.service` PASS 5/5 | `worklog.md`, `drift.md` |
| Fitness | `quality:gate` PASS | `worklog.md` |
| Runtime | Local runtime lease prohibited; hosted pending | Implement brief |
| Consumer | Exact init/build/codegen/build PASS (`0/0/0/0`) | `worklog.md` raw excerpts |

## Open Questions

- None before implementation.

## Drift and Debt

- Drift: Prisma non-empty output behavior and emitted Deno error mismatch resolved; baseline CLI
  lint/fmt exclusion recorded.
- Debt: no new/deepened debt; existing unrelated CLI debts retained.

## Commits

- See the draft PR's commit list + per-slice PR comments.
