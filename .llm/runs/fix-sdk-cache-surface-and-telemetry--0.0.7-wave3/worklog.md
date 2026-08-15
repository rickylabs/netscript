# Worklog: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Archetype | `3 — runtime behavior` slice over doctrine-inventory Archetype 2 SDK |
| Scope overlays | none |

## Design

### Public Surface

- Preserve all existing `@netscript/sdk`, `/cache`, `/ports`, and `/query` TypeScript signatures.
- Runtime contract changes: successful source data survives optional cache-persistence failure;
  malformed telemetry evidence degrades to an error/incomplete span signal; namespace values above
  the process budget collapse to `overflow`.
- Published prose change: README explicitly documents fail-safe evidence and namespace budget.
- API-adjacent diagnostic: uninitialized provider error contains `import.meta.url` and a
  two-instance hypothesis.

### Domain Vocabulary

- `CacheWriteTopologyReport` / `CacheReadTopologyReport` /
  `CacheInvalidationTopologyReport` — mandatory provider evidence, unchanged types.
- Namespace admission decision — internal normalized namespace plus optional first-overflow warning
  id; not exported from package entrypoints.
- Evidence-invalid signal — existing `outcome=error` and `topologyComplete=false`, recorded without
  application throw.

### Ports

- `CacheStore` remains the only persistence seam. No new port is introduced.
- `CacheTelemetry` remains the span/event seam. The cardinality warning uses this seam, not console
  or a new logger dependency.

### Constants

- Internal namespace budget: `256`.
- Internal collapsed namespace: `overflow`.
- Internal overflow event: `cache.namespace.overflow`.
- Existing public syntax max: `CACHE_NAMESPACE_MAX_LENGTH = 80` unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Fail-safe evidence + in-span descriptor validation + cardinality bound | focused telemetry tests, SDK wrappers | declared cache files plus granted README/telemetry test |
| 2 | Real Deno KV write-limit isolation | real RED/GREEN test, root test | `cache-query.ts` plus granted new KV-limit test |
| 3 | Module diagnostic + CacheStore JSDoc | focused test, doc/publish checks | declared provider/store plus granted provider test |
| 4 | Merge-readiness evidence | full gate plan | run artifacts only |

### Deferred Scope

- Per-action `no-store`, branded operation IDs, and duplicate-module ownership are separate
  published-surface decisions.
- No Aspire/Docker/CLI E2E or release action is authorized for this leaf.

### Contributor Path

Future cache-provider authors implement `CacheStore`, return mandatory bounded reports, and import
the server cache surface through `@netscript/sdk/cache`. Query authors use generated static
`resource.action` namespaces or a static composite default. A new persistence adapter belongs
behind `CacheStore`; it must not change source-query success semantics.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15 | Plan | Research | Re-baselined call graphs, evidence reaches, producers, cross-package consumers/assertions, ports docs, and JSR surface. |
| 2026-08-15 | Plan | Design | Locked five issue contracts; wrote scope-boundary report. No product code changed. |
| 2026-08-15 | Plan | Draft PR | Committed plan artifacts as `89be8da76`, pushed by explicit refspec, and opened draft PR #1665 with milestone `0.0.7`, exactly one `status:plan`, and RESEARCH/PLAN phase comments. |
| 2026-08-15 | Plan repair | Tier-A `FAIL_FIX` | Repaired T-1 deferral across every normalization site, T-2 invalidation rollback/final-incomplete semantics, T-3 exact raw six-diagnostic doc-lint baseline, and T-4 named accepted site-doc drift. Exact four-file scope grant recorded; no product code changed. |

## Decisions

See `plan.md` D1-D5. The topic orchestrator granted exactly the four additional files in
`scope-boundary.md`; no others. PLAN-EVAL is selected and pending, and implementation is forbidden
until the coordinator separately grants it.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Package publish dry run at base | PASS | `deno publish --dry-run --allow-dirty` from `packages/sdk` |
| Exact NetScript specifiers at base | PASS | `scanned=2361 allowances=1 ranges=0 failures=0` |
| JSR audit at base | PASS with 2 warnings | existing src cardinality + slow-type banner |
| Raw full-export/cache doc lint at plan head | FAIL (pre-existing, expected exit 1) | Exact six named diagnostics locked in `plan.md`; zero-new comparison required, never a PASS |
| Product implementation gates | NOT_RUN | plan-only phase |

## Handoff Notes

- Inspect D1's real Deno KV RED and D2's replacement of the deliberate fail-loud guard first.
- Scope is settled at exactly four additional files; enforce the six named raw doc-lint baseline
  and the accepted site-doc follow-up without widening it.
- Do not treat the draft PR or green publish dry run as PLAN-EVAL.
- Draft PR: https://github.com/rickylabs/netscript/pull/1665
