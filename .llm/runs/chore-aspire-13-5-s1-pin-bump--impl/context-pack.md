# Context Pack: Aspire 13.5 S1 pin bump and parity gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s1-pin-bump--impl` |
| Branch | `chore/aspire-13-5-s1-pin-bump` |
| Current phase | Tier-A repair complete — supervisor re-review pending |
| Archetype | `6 — CLI/tooling` |
| Scope overlays | none |

## Current State

The atomic Aspire train is implemented on draft PR #1727. Coordinator Tier-A review found two parity false-green gaps; the bounded repair now fails on missing non-archival manifest paths and unauthorized 13.5.x versions across all seven pin-bearing phase-1 paths. The repaired phase-1 receipt is GREEN with fail=0; all 66 missing paths are archival.

## Completed

- Issue #1713 and locked research decisions re-baselined.
- Harness bootstrap, Design checkpoint, archetype, gate set, and PLAN-EVAL N/A recorded.
- Phase-aware parity tool/test, task/catalog wiring, immutable manifest input, and RED receipt completed.
- Slice 1 commit `95680776…` pushed; draft PR and commit-trail comment created.
- Atomic pin edits, CI phase-1 wiring, scoped validation, quality/architecture checks, assets freshness, and GREEN receipt completed.
- Slice 2 commit `4e30264fa…` pushed with its commit-trail comment.
- Accepted Browsers preview debt appended; handoff artifacts finalized for independent evaluation.
- CI run `33276629736` proved Aspire CLI 13.5.3 install/preflight and `runtime.aspire-restore` in both tiers before an unchanged Fresh hydration TS2345 blocked generated quality checking.
- Test-first Tier-A repair completed: 6/6 parity tests plus scoped check/lint/fmt and repaired GREEN receipt.

## In Progress

- Third commit is being amended with the bounded Tier-A repair; supervisor re-review remains external.

## Next Steps

1. Supervisor reruns fresh exact-head Tier-A review of the bounded repair.
2. Owning Fresh fix clears the generated hydration baseline, then CI runtime tiers rerun.
3. A separate Fable session performs IMPL-EVAL; coordinator owns readiness and merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Target 13.5.3 train | research D-1 | No mixed Aspire trains |
| Phase-1 classes | research D-13 | Fail only scaffold constants, CI, root config |
| Runtime in CI only | implementation brief | No local AppHost or host CLI action |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/chore-aspire-13-5-s1-pin-bump--impl/` | new | Harness state and evidence |
| `.llm/tools/validation/check-aspire-version-parity.ts` | new | Phase-aware structured parity gate |
| `.llm/tools/validation/check-aspire-version-parity_test.ts` | new | Classification and phase contract tests |
| `deno.json`, `.llm/tools/gates/catalog.ts` | changed | Task and durable gate allowlist |
| `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` | new | Exact blob imported from the draft-of-record ref |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slice 1 PASS | focused test/check/fmt; RED parity receipt expected FAIL |
| Fitness | PASS | scoped owned-file wrappers, `quality:scan`, `arch:check` |
| Runtime | BLOCKED_BASELINE | Actions run `33276629736`; Aspire setup passed, Fresh generated check failed |
| Consumer | PASS | asset generation/freshness and generator assertions |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: research artifacts are absent from the implementation baseline; exact remote-ref import required.
- Debt: Browsers preview entry will be appended in slice 3.

## Commits

- `95680776…` — RED parity contract and receipt.
- `4e30264fa…` — atomic 13.5 train and exact GREEN receipt.
- Third commit at current branch HEAD: accepted preview debt, Tier-A parity repair, and evaluator handoff.
