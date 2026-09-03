# Context Pack: scaffold Fresh production build catalog resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-build-catalog-zod--0.0.7` |
| Branch | `fix/scaffold-build-catalog-zod` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `frontend` |

## Current State

Issue #1971 is reproduced at the requested baseline. Native Deno resolves the generated app's
`zod` catalog mapping, but Fresh's upstream production loader returns literal `catalog:`. Before
codegen the same build fails earlier because init does not seed its declared database Zod entrypoint.
The repair and alternatives are locked; PLAN-EVAL is N/A for this fully determined mechanical fix.

## Completed

- Skill/doctrine/harness bootstrap and explicit-baseline verification.
- Exact issue reproduction and app catalog reachability inventory.
- Fresh/Deno resolver ownership and differential proof.
- Plan and Design checkpoint.

## In Progress

- Commit and push the deterministic RED test plus current run evidence to draft PR #1974.

## Next Steps

1. Push the RED commit and comment its expected failing evidence on draft PR #1974.
2. Implement D1/D3, run focused and full requested gates, and prove both consumer builds.
3. Push GREEN, make PR non-draft, post phase summary, and stop for separate IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| App Zod mapping is explicit npm materialization from workspace catalog authority | `plan.md` D1 | No second version constant. |
| Init seeds disposable Zod CRUD schemas | `plan.md` D3 | Real codegen overwrites exact path. |
| No `packages/fresh` changes | `research.md` findings 6–7 | Failing resolver belongs upstream. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-scaffold-build-catalog-zod--0.0.7/*` | new/updated | Harness context and evidence only. |
| `packages/cli/src/kernel/templates/app/generators-config_test.ts` | changed | RED semantic app-import regression. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Baseline focused PASS | `worklog.md` |
| Fitness | Pending | GREEN phase |
| Runtime | Local runtime lease prohibited; hosted pending | Implement brief |
| Consumer | RED reproduced twice | `worklog.md` raw excerpts |

## Open Questions

- None before implementation.

## Drift and Debt

- Drift: none.
- Debt: no new/deepened debt; existing unrelated CLI debts retained.

## Commits

- See the draft PR's commit list + per-slice PR comments.
