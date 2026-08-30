# Context Pack: Aspire 13.5 S1 pin bump and parity gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s1-pin-bump--impl` |
| Branch | `chore/aspire-13-5-s1-pin-bump` |
| Current phase | S1 bounded review fix complete — push and supervisor refreeze pending |
| Archetype | `6 — CLI/tooling` |
| Scope overlays | none |

## Current State

The atomic Aspire train is implemented on PR #1727. The PostgreSQL tier of hosted run `33328727942`
passed 67 gates and failed only because the live DB endpoint gate still required consecutive
persistent allocations to differ. The bounded correction now accepts Aspire 13.5 stable allocation
reuse while proving the second receipt matches a fresh live topology, the live users environment
uses that endpoint, `/health` is ready, and telemetry remains correlated.
Review comment `r3890336485` then identified that the phase-2 peer-version check still used substring
matching. The bounded repair now compares parsed version tokens exactly, so `13.5.30` cannot satisfy
the required `13.5.3` pin.

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
- Test-first convergence correction completed: RED on the missing comparison function, GREEN
  29/29, package E2E check, scoped lint/fmt, architecture, and quality gates all exit 0.
- Test-first exact-token review fix completed: semantic RED reproduced the `13.5.30` false positive;
  GREEN passes 9/9 focused tests and the parity task exits 0.

## In Progress

- One bounded review-fix commit is ready to push; supervisor refreeze and hosted tier rerun remain external.

## Next Steps

1. Push the exact-token review fix and post the structured PR implementation comment.
2. Supervisor refreezes the new head and reruns the hosted tiers.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Target 13.5.3 train | research D-1 | No mixed Aspire trains |
| Phase-1 classes | research D-13 | Fail only scaffold constants, CI, root config |
| Runtime in CI only | implementation brief | No local AppHost or host CLI action |
| Stable first/second allocation is valid | Aspire 13.5 change log and persistent-resource docs | Prove live second-start endpoint use instead of requiring port churn |

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
