# Context Pack: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Current phase | `post-IMPL-EVAL repair` — generated bundle refreshed; awaiting fresh Tier-A and delta evaluation |
| Archetype | `3 — runtime behavior` slice; SDK inventory remains Archetype 2 |
| Scope overlays | `SCOPE-docs` for one authorized Query Bridge quotation |

## Current State

PLAN-EVAL is terminal PASS at evaluated head `ee1b44c6d`, with evaluator artifact `cd5193b66`.
S1 is Tier-A PASS at `0e4e26c51`; S2 is Tier-A PASS at `1cf76c6dd`; the complete implementation
received terminal IMPL-EVAL PASS at `0fed4d7ff`. Readiness CI then found the agent-docs bundle stale
because S3's authorized Query Bridge edit feeds its manifest. The canonical generator refreshed
only `prose.json.gz` and `provenance.json`; freshness and docs-site verification now pass. Evidence
is captured in `generated-assets-repair-report.md`.

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
- S2's real-KV proof passes, the full SDK suite passes 66/66, repo-root check passes 2,925 files,
  and repo-root test passes 4,203 tests with zero failures.
- S3's provider test passes 1/1 and mechanically ties the real module URL plus stable diagnostic
  bytes to the single-line Query Bridge fence.
- CacheStore get/set/delete JSDoc now describes mandatory evidence; the executed whole-ports sweep
  found no other evidence-contract drift.
- Final S3 root check/test pass at 2,925 files and 4,203/0/19; quality, architecture, exact-pin,
  publish dry-run, and JSR gates completed.
- Post-IMPL-EVAL generated bundle now records source commit `0fed4d7ff`; its freshness check reports
  `fresh=true` and no stale paths. Full docs-site verification, SDK lint, and SDK format pass.

## Next Steps

1. Commit and push only the two generated assets plus repair run artifacts by explicit refspec.
2. Post the bounded repair receipt on PR #1665.
3. Stop for the coordinator's fresh Tier-A and source-to-generated delta evaluation; do not launch
   or arrange either evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Write failure isolation | `plan.md` D1 | Real Deno KV >65,536-byte RED required |
| Telemetry fail-safe | `plan.md` D2 | Existing fail-loud test amended, not removed |
| Runtime cardinality | `plan.md` D3 | 256 / `overflow`; request-local decision flushes first inside operation span; composite construction only syntax-normalizes |
| Diagnostic | `plan.md` D4 | Hypothesis, not fact; keep module-local provider; normalize only dynamic URL before byte-comparing the authorized docs quote |
| JSDoc | `plan.md` D5 | Only CacheStore get/set/delete drift found |

## Files Changed

The bounded repair changes exactly the two authorized `.llm/assets/agent-docs/` files plus run
artifacts. It does not change the landed S1-S3 product, test, or site sources.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Repair PASS | SDK lint/fmt wrappers remain clean across 84 files |
| Fitness | S3 PASS with non-blocking warnings | quality scan has no findings; architecture has zero failures; JSR retains two known warnings |
| Runtime | S3 PASS | provider/docs proof 1/1; full SDK 66/66; repo-root 4,203 passed, 0 failed, 19 ignored |
| Consumer | Repair PASS | Agent-docs freshness reports no stale paths; full docs-site verify passes |

The supplemental repository-wide `surface:diff` invocation exits 1 against a stale workspace
baseline and reports widespread signature changes in untouched packages; it is not represented as
a pass or as an S1-specific verdict. The direct S1 export proof is an empty diff for
`packages/sdk/src/cache/mod.ts` and the SDK root barrel, with no helper re-export.

## Open Questions

- Fresh Tier-A and proportionate source-to-generated delta evaluation only. This implementation
  session does not arrange either one.

## Drift and Debt

- Drift: slice profile is Archetype 3 while doctrine inventory calls SDK Archetype 2; stricter
  runtime profile retained and logged.
- Baseline: exact six named raw doc-lint diagnostics remain expected red/no-regression evidence.
- D4 docs alignment is fully owned in-scope.
- The `@netscript/kv` singleton is process-global. S2's proof awaits both `closeKv()` and
  `resetKv()` in `finally`; repo-root test ordering remains green.
- S3's single-line Query Bridge fenced-code quotation remains unwrapped; the formatter does not
  reflow it and there is no markdownlint configuration.
- S1's admission/reset/prologue helpers are direct-file internals and must remain off both barrels.

## Commits

- `89be8da76` — plan/research/Design/scope-boundary bootstrap.
- `cd5193b66` — terminal PLAN-EVAL artifact on top of evaluated head `ee1b44c6d`.
- `0e4e26c51` — S1 implementation, accepted by Tier-A.
- S2 implementation — this slice's implementation/evidence commit; exact hash is recorded in the
  PR progress comment and coordinator handoff.
