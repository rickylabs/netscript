# Context Pack: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Current phase | `implementation/S1` — PLAN-EVAL passed; S1 implemented and awaiting Tier-A review |
| Archetype | `3 — runtime behavior` slice; SDK inventory remains Archetype 2 |
| Scope overlays | `SCOPE-docs` for one authorized Query Bridge quotation |

## Current State

PLAN-EVAL is terminal PASS at evaluated head `ee1b44c6d`, with evaluator artifact `cd5193b66`.
Coordinator-authorized S1 implements only D2 and D3: fail-safe malformed evidence inside an active
span, per-report invalidation rollback, a 256-entry process namespace budget with fixed `overflow`,
and a first-overflow operation-span event. Draft PR #1665 remains open with `status:plan` and
milestone `0.0.7`; S2 and S3 remain unauthorized.

## Completed

- Required skills/doctrine/harness authorities read.
- `deno doc` public-surface inspection completed before source reads.
- Whole-repo cross-package/assertion census and ports JSDoc sweep completed.
- Base publish dry run and exact-specifier guard passed.
- Existing full-export doc-lint failure captured rather than hidden.
- `research.md`, `plan.md`, Design checkpoint, and `scope-boundary.md` written.
- Plan artifacts committed as `89be8da76`, pushed by explicit refspec, and published on draft PR
  https://github.com/rickylabs/netscript/pull/1665 with RESEARCH and PLAN phase comments.
- S1 implementation is confined to the three authorized cache sources, telemetry tests, README,
  and run artifacts.
- The telemetry-only wrapper passes 21/21; the expanded focused cache/query wrapper passes 32/32;
  structured SDK check, lint, and format wrappers pass.

## Next Steps

1. Commit and push S1, then stop for the coordinator's fresh Tier-A review.
2. Do not begin S2's real-KV limit test until separately authorized.
3. Do not begin S3's diagnostic, CacheStore JSDoc, provider test, or Query Bridge changes until
   separately authorized.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Write failure isolation | `plan.md` D1 | Real Deno KV >65,536-byte RED required |
| Telemetry fail-safe | `plan.md` D2 | Existing fail-loud test amended, not removed |
| Runtime cardinality | `plan.md` D3 | 256 / `overflow`; request-local decision flushes first inside operation span; composite construction only syntax-normalizes |
| Diagnostic | `plan.md` D4 | Hypothesis, not fact; keep module-local provider; normalize only dynamic URL before byte-comparing the authorized docs quote |
| JSDoc | `plan.md` D5 | Only CacheStore get/set/delete drift found |

## Files Changed

S1 changes only the three authorized cache source files, `cache-telemetry_test.ts`, this package's
README, and run artifacts. The new S2 test and every S3 path remain untouched.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S1 PASS | structured SDK check/lint/fmt wrappers |
| Fitness | S1 PASS with non-blocking warnings | quality scan has no findings; architecture check has zero failures |
| Runtime | S1 PASS | telemetry 21/21; expanded focused cache/query suite 32/32 |
| Consumer | Deferred by slice contract | repo-root test is forbidden in S1 and planned later |

The supplemental repository-wide `surface:diff` invocation exits 1 against a stale workspace
baseline and reports widespread signature changes in untouched packages; it is not represented as
a pass or as an S1-specific verdict. The direct S1 export proof is an empty diff for
`packages/sdk/src/cache/mod.ts` and the SDK root barrel, with no helper re-export.

## Open Questions

- S2/S3 authorization only. S1 must stop after its Tier-A handoff.

## Drift and Debt

- Drift: slice profile is Archetype 3 while doctrine inventory calls SDK Archetype 2; stricter
  runtime profile retained and logged.
- Baseline: exact six named raw doc-lint diagnostics remain expected red/no-regression evidence.
- D4 docs alignment is fully owned in-scope.
- The `@netscript/kv` singleton is process-global. S2 teardown must use `resetKv()` / `closeKv()` to
  prevent an in-memory KV from leaking into root-test ordering.
- S3's single-line Query Bridge fenced-code quotation must remain unwrapped; the formatter does not
  reflow it and there is no markdownlint configuration.
- S1's admission/reset/prologue helpers are direct-file internals and must remain off both barrels.

## Commits

- `89be8da76` — plan/research/Design/scope-boundary bootstrap.
- `cd5193b66` — terminal PLAN-EVAL artifact on top of evaluated head `ee1b44c6d`.
- S1 implementation — this slice's implementation/evidence commit; exact hash is recorded in the
  PR progress comment and coordinator handoff.
