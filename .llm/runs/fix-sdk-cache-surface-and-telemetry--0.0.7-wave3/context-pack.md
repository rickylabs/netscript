# Context Pack: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Current phase | `plan` — scope granted, awaiting separate PLAN-EVAL |
| Archetype | `3 — runtime behavior` slice; SDK inventory remains Archetype 2 |
| Scope overlays | none |

## Current State

Research and plan are complete at `main@baf1cdf67`. No product code has been implemented. Five
contracts are locked: isolate post-loader persistence failure; fail-safe malformed evidence inside
a span; cap namespaces at 256 with fixed `overflow`; include module identity plus a two-instance
hypothesis; repair CacheStore evidence JSDoc. Tier-A plan review repairs now specify request-local
overflow deferral, per-report invalidation rollback, exact raw doc-lint baselines, and named
accepted site-doc drift. Draft PR #1665 is open with `status:plan` and milestone `0.0.7`.

## Completed

- Required skills/doctrine/harness authorities read.
- `deno doc` public-surface inspection completed before source reads.
- Whole-repo cross-package/assertion census and ports JSDoc sweep completed.
- Base publish dry run and exact-specifier guard passed.
- Existing full-export doc-lint failure captured rather than hidden.
- `research.md`, `plan.md`, Design checkpoint, and `scope-boundary.md` written.
- Plan artifacts committed as `89be8da76`, pushed by explicit refspec, and published on draft PR
  https://github.com/rickylabs/netscript/pull/1665 with RESEARCH and PLAN phase comments.

## Next Steps

1. Preserve the exact grant: README plus three test files named in `scope-boundary.md`, no others.
2. Separate topic-orchestrator-owned PLAN-EVAL reads the repaired research/plan/Design and returns
   `PASS` or `FAIL_PLAN`.
3. Only after PLAN-EVAL passes, resume this exact Codex thread for ordered implementation slices.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Write failure isolation | `plan.md` D1 | Real Deno KV >65,536-byte RED required |
| Telemetry fail-safe | `plan.md` D2 | Existing fail-loud test amended, not removed |
| Runtime cardinality | `plan.md` D3 | 256 / `overflow`; request-local decision flushes first inside operation span; composite construction only syntax-normalizes |
| Diagnostic | `plan.md` D4 | Hypothesis, not fact; keep module-local provider |
| JSDoc | `plan.md` D5 | Only CacheStore get/set/delete drift found |

## Files Changed

Only run artifacts under this run directory. The pre-existing `codex-thread-ids.md` was preserved.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Plan baseline only | publish dry run PASS; doc lint pre-existing FAIL |
| Fitness | Plan baseline only | JSR audit PASS with warnings; exact pins PASS |
| Runtime | NOT_RUN | implementation prohibited |
| Consumer | Search census complete; gates NOT_RUN | repo-root test planned |

## Open Questions

- PLAN-EVAL verdict only. Scope and doc-lint handling are resolved by the coordinator.

## Drift and Debt

- Drift: slice profile is Archetype 3 while doctrine inventory calls SDK Archetype 2; stricter
  runtime profile retained and logged.
- Baseline: exact six named raw doc-lint diagnostics remain expected red/no-regression evidence.
- Accepted drift: `FOLLOWUP-DOC-QUERY-BRIDGE-DIAGNOSTIC` updates the stranded exact message quote
  outside this leaf's grant.

## Commits

- `89be8da76` — plan/research/Design/scope-boundary bootstrap.
- See draft PR #1665's live commit list and phase comments. No implementation commit exists.
