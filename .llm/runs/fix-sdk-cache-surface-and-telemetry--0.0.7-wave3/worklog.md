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
| 1 | Fail-safe evidence + in-span descriptor validation + cardinality bound | focused telemetry tests, SDK wrappers | declared cache files plus pending README/telemetry test approval |
| 2 | Real Deno KV write-limit isolation | real RED/GREEN test, root test | `cache-query.ts` plus pending new test approval |
| 3 | Module diagnostic + CacheStore JSDoc | focused test, doc/publish checks | declared provider/store plus pending provider test approval |
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

## Decisions

See `plan.md` D1-D5. PLAN-EVAL is selected and pending; implementation is forbidden until a
separate evaluator returns `PASS` and the topic orchestrator rules on scope.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Package publish dry run at base | PASS | `deno publish --dry-run --allow-dirty` from `packages/sdk` |
| Exact NetScript specifiers at base | PASS | `scanned=2361 allowances=1 ranges=0 failures=0` |
| JSR audit at base | PASS with 2 warnings | existing src cardinality + slow-type banner |
| Full SDK doc lint at base | FAIL (pre-existing) | private-type refs; see `research.md` and `scope-boundary.md` |
| Product implementation gates | NOT_RUN | plan-only phase |

## Handoff Notes

- Inspect D1's real Deno KV RED and D2's replacement of the deliberate fail-loud guard first.
- Decide the additional README/test files and doc-lint baseline before approving implementation.
- Do not treat the draft PR or green publish dry run as PLAN-EVAL.

