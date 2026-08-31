# Context Pack: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Current phase | `second post-eval repair` — CLI barrel refreshed; fourth generated link reported |
| Archetype | `3 — runtime behavior` slice; SDK inventory remains Archetype 2 |
| Scope overlays | `SCOPE-docs` for one authorized Query Bridge quotation |

## Current State

PLAN-EVAL is terminal PASS at evaluated head `ee1b44c6d`, with evaluator artifact `cd5193b66`.
S1 is Tier-A PASS at `0e4e26c51`; S2 is Tier-A PASS at `1cf76c6dd`; the complete implementation
received terminal IMPL-EVAL PASS at `0fed4d7ff`. The first post-eval repair refreshed the canonical
agent-docs bundle. The delta evaluation passed at `72d57229f`, after which readiness CI exposed the
third link: the CLI's generated embedding. This second repair refreshes only that authorized barrel.
An explicit downstream check found a fourth, out-of-scope stale generated file at
`packages/mcp/src/publish-assets.generated.ts`; it remains untouched.

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
- CLI `agent-docs.generated.ts` now embeds the same source commit, byte counts, and prose SHA;
  `check:assets-barrel` and CLI type-check pass.
- The CLI lint/format wrappers are not green verdicts: Deno excludes the package from those root
  gates, and even explicit touched-file wrapper runs exit 2 as excluded targets.
- `check:publish-assets` names only the out-of-scope MCP generated fallback as stale. Searches found
  no fifth checked-in generated artifact after that file.

## Next Steps

1. Commit and push only the MCP generated publish asset plus repair run artifacts by explicit
   refspec.
2. Post the fourth-link closure receipt on PR #1665.
3. Stop for coordinator-run fresh Tier-A and final asset-chain delta evaluation; do not launch or
   arrange either evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Write failure isolation | `plan.md` D1 | Real Deno KV >65,536-byte RED required |
| Telemetry fail-safe | `plan.md` D2 | Existing fail-loud test amended, not removed |
| Runtime cardinality | `plan.md` D3 | 256 / `overflow`; request-local decision flushes first inside operation span; composite construction only syntax-normalizes |
| Diagnostic | `plan.md` D4 | Hypothesis, not fact; keep module-local provider; normalize only dynamic URL before byte-comparing the authorized docs quote |
| JSDoc | `plan.md` D5 | Only CacheStore get/set/delete drift found |

## Files Changed

The final bounded repair changes exactly `packages/mcp/src/publish-assets.generated.ts` plus run
artifacts. It does not change the canonical prose assets, CLI barrels, landed S1-S3
source/tests/docs, or any hand-written package/plugin source.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Final repair mixed | MCP check passes 115 files. Unfiltered MCP lint/fmt wrappers exit 1 at intentionally invalid doctor fixture configs with zero findings; excluding only those fixtures passes 110 files with zero findings |
| Fitness | S3 PASS with non-blocking warnings | quality scan has no findings; architecture has zero failures; JSR retains two known warnings |
| Runtime | S3 PASS | provider/docs proof 1/1; full SDK 66/66; repo-root 4,203 passed, 0 failed, 19 ignored |
| Consumer | Final cascade PASS | Agent-docs, assets-barrel, and publish-assets checks all pass on the same content state; no fifth checked-in mirror found |

The supplemental repository-wide `surface:diff` invocation exits 1 against a stale workspace
baseline and reports widespread signature changes in untouched packages; it is not represented as
a pass or as an S1-specific verdict. The direct S1 export proof is an empty diff for
`packages/sdk/src/cache/mod.ts` and the SDK root barrel, with no helper re-export.

## Open Questions

- None within implementation scope. Fresh Tier-A and the final asset-chain delta evaluation remain
  coordinator-owned; this session arranges neither.

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
