# Worklog: sdk cache surface and telemetry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cache-surface-and-telemetry--0.0.7-wave3` |
| Branch | `fix/sdk-cache-surface-and-telemetry` |
| Archetype | `3 — runtime behavior` slice over doctrine-inventory Archetype 2 SDK |
| Scope overlays | `SCOPE-docs` for the single authorized Query Bridge quotation |

## Design

### Public Surface

- Preserve all existing `@netscript/sdk`, `/cache`, `/ports`, and `/query` TypeScript signatures.
- Runtime contract changes: successful source data survives optional cache-persistence failure;
  malformed telemetry evidence degrades to an error/incomplete span signal; namespace values above
  the process budget collapse to `overflow`.
- Published prose change: README explicitly documents fail-safe evidence and namespace budget.
- API-adjacent diagnostic: uninitialized provider error contains `import.meta.url` and a
  two-instance hypothesis.
- Published diagnostic quotation: Query Bridge uses `<resolved import.meta.url>` for the sole
  variable segment; the provider test normalizes that segment and byte-compares the complete block.

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
| 3 | Module diagnostic + synchronized Query Bridge quotation + CacheStore JSDoc | focused test with docs byte comparison, doc/publish checks | declared provider/store plus granted provider test and one site page |
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
| 2026-08-15 | Plan repair | Tier-A `FAIL_FIX` | Repaired T-1 deferral across every normalization site, T-2 invalidation rollback/final-incomplete semantics, and T-3 exact raw six-diagnostic doc-lint baseline. Initial T-4 scope treatment was superseded by the coordinator's fifth-path grant. No product code changed. |
| 2026-08-15 | Plan repair | T-4 superseding ruling | Added the single Query Bridge page to D4 and locked the dynamic-URL placeholder strategy plus automated byte-comparison proof. Exact five-additional-path scope recorded. |
| 2026-08-15 | PLAN-EVAL | PASS | Terminal PASS at evaluated head `ee1b44c6d`; evaluator artifact committed as `cd5193b66`. Coordinator authorized S1 only. |
| 2026-08-15 | S1 | D2 implementation | Made malformed lookup/write/invalidation evidence fail-safe inside the active span. Invalidation evidence is staged per report and merged only after complete validation. |
| 2026-08-15 | S1 | D3 implementation | Added the 256-entry process registry, fixed `overflow` collapse, first-overflow span event, and operation-span prologue. Internal admission/reset/prologue helpers remain off both public barrels. |
| 2026-08-15 | S1 | Focused proof | Telemetry-only suite passed 21/21; expanded cache/query suite passed 32/32. Required rollback, return-value, overflow, composite, reset, and descriptor-order cases are all exercised in `cache-telemetry_test.ts`. |
| 2026-08-15 | S1 review | Tier-A PASS | S1 accepted at `0e4e26c51`; coordinator authorized S2 only. |
| 2026-08-15 | S2 | Real-KV RED | New proof failed before the product edit with the real Deno KV `TypeError: Value too large (max 65536 bytes)` through `KvCacheStore.set()` and `CacheQuery.fetchAndCache()`. Structured JSON is preserved in `s2-report.md`. |
| 2026-08-15 | S2 | D1 implementation | Changed only the post-loader persistence catch to record the existing read/write provider-error vocabulary and return resolved data. Loader, lookup, background refresh, and explicit `setCachedData()` failure behavior remain fail-loud. |
| 2026-08-15 | S2 | Real-KV GREEN | The same real-Deno-KV test passes, proves the exact payload returns, one loader call, error/incomplete `cache.write` span event, uncached follow-up miss, and awaited `closeKv()` plus `resetKv()` teardown. |
| 2026-08-15 | S2 | Reconcile | PR body now explicitly names the approved D2 `assertRejects` contract inversion. Draft state, acceptance boxes, labels, milestone, and issue state were not changed; S3 remains unauthorized. |
| 2026-08-15 | S2 review | Tier-A PASS | S2 accepted at `1cf76c6dd`; coordinator authorized the final S3 slice only. |
| 2026-08-15 | S3 | D4 implementation | Added the evaluated provider module URL and duplicate-SDK-instance hypothesis while retaining the browser hint and module-local provider ownership. Synchronized the Query Bridge quotation with one dynamic URL token. |
| 2026-08-15 | S3 | D4 proof | The adjacent provider test captures the real error, verifies the exact module URL, normalizes only that URL, and byte-compares the complete single-line documentation fence. |
| 2026-08-15 | S3 | D5 implementation | Repaired only `CacheStore.get`/`set`/`delete` JSDoc to describe mandatory read/write/invalidation evidence. The executed ports tag/evidence sweep found no other evidence-contract drift. |
| 2026-08-15 | S3 | Reconcile | S1/S2 files remain byte-identical. Full focused/root/publish gates were run; the known stale `surface:diff` and exact six raw doc-lint diagnostics remain honestly red. PR metadata is updated after the S3 push; draft state, acceptance boxes, labels, milestone, and issue states remain unchanged. |
| 2026-08-15 | Post-IMPL-EVAL repair | Agent-docs bundle | Readiness CI exposed branch-caused generated drift from the authorized Query Bridge source edit. Regenerated only `prose.json.gz` and `provenance.json` with `gen:agent-docs-prose`; the immediate porcelain check contained exactly those two assets. |
| 2026-08-15 | Post-IMPL-EVAL repair | Validation | Agent-docs freshness and full docs-site verification pass; SDK lint/fmt remain clean; both raw doc-lint invocations retain exactly the pinned three-plus-three baseline diagnostics. No root/Aspire/Docker/CLI E2E or evaluator was run. |
| 2026-08-15 | Second post-eval repair | CLI agent-docs barrel | Readiness CI exposed the third asset-chain link. `gen:assets-barrel` changed only `packages/cli/src/kernel/assets/agent-docs.generated.ts`; the immediate porcelain output named exactly that path. |
| 2026-08-15 | Second post-eval repair | Downstream audit | `check:publish-assets` check-only mode found a fourth stale link at `packages/mcp/src/publish-assets.generated.ts`. It remains untouched and is reported for a new scope ruling. Whole-repo generator/consumer searches found no fifth checked-in generated artifact. |
| 2026-08-15 | Final post-eval repair | MCP publish assets | Coordinator granted the fourth link. `gen:publish-assets` changed only `packages/mcp/src/publish-assets.generated.ts`; the immediate porcelain output named exactly that path. |
| 2026-08-15 | Final post-eval repair | Cascade closure | Publish-assets, assets-barrel, and agent-docs freshness all pass together. MCP check passes. Unfiltered MCP lint/fmt wrappers hit intentionally invalid doctor fixture configs; excluding only those fixtures passes 110 files with zero findings. Exact six SDK doc-lint baseline diagnostics remain unchanged. An executed downstream search found no fifth checked-in mirror. |

## Decisions

See `plan.md` D1-D5. The topic orchestrator granted exactly the five additional paths in
`scope-boundary.md`; no others. PLAN-EVAL, S1 Tier-A, and S2 Tier-A passed. The coordinator
authorized and this slice completed S3 within its exact four-file implementation boundary.

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Package publish dry run at base | PASS | `deno publish --dry-run --allow-dirty` from `packages/sdk` |
| Exact NetScript specifiers at base | PASS | `scanned=2361 allowances=1 ranges=0 failures=0` |
| JSR audit at base | PASS with 2 warnings | existing src cardinality + slow-type banner |
| Raw full-export/cache doc lint at plan head | FAIL (pre-existing, expected exit 1) | Exact six named diagnostics locked in `plan.md`; zero-new comparison required, never a PASS |
| S1 SDK check wrapper | PASS | 83 files; 0 failed batches; 0 diagnostics |
| S1 telemetry test wrapper | PASS | 21 passed; 0 failed |
| S1 expanded cache/query test wrapper | PASS | 32 passed; 0 failed |
| S1 SDK lint wrapper | PASS | 83 files; 0 findings |
| S1 SDK format wrapper | PASS | 83 files; 0 findings |
| S1 quality scan | PASS | no findings; 7 existing allowances |
| S1 architecture check | PASS with warnings | zero failures; the existing SDK source-directory cardinality warning remains non-blocking. Final compaction keeps both changed cache sources below the 500-line cap. |
| Repository-wide surface diff | FAIL (baseline mismatch, not an S1 pass) | Exit 1 reports widespread undeclared signature drift across many untouched packages; it cannot isolate this leaf. The slice-specific barrel diff is empty, and no admission/reset/prologue helper is re-exported. |
| S2 real-KV RED | EXPECTED FAIL | Structured exit 1; one failure with the real Deno KV 65,536-byte `TypeError` |
| S2 real-KV GREEN | PASS | Structured exit 0; 1 passed, 0 failed |
| S2 SDK check wrapper | PASS | 84 files; 0 failed batches; 0 diagnostics |
| S2 SDK test wrapper | PASS | 66 passed; 0 failed |
| S2 SDK lint wrapper | PASS | 84 files; 0 findings |
| S2 SDK format wrapper | PASS after one corrected formatting finding | Final: 84 files; 0 failed batches; 0 findings |
| S2 repo-root check | PASS | 2,925 files; 25 batches; 0 failed batches; 0 diagnostics |
| S2 repo-root test | PASS | 4,203 passed; 0 failed; 19 ignored; 4,222 total |
| S2 quality gate | PASS with existing warnings | quality scan has no findings; architecture check has zero failures |
| S3 D4 provider/docs test | PASS | 1 passed; 0 failed; exact URL extraction and normalized byte comparison |
| S3 SDK check wrapper | PASS | 84 files; 1 batch; 0 failed batches; 0 diagnostics |
| S3 SDK test wrapper | PASS | 66 passed; 0 failed |
| S3 SDK lint wrapper | PASS | 84 files; 0 findings |
| S3 SDK format wrapper | PASS | 84 files; 0 failed batches; 0 findings |
| S3 repo-root check | PASS | 2,925 files; 25 batches; 0 failed batches; 0 diagnostics |
| S3 repo-root test | PASS | 4,203 passed; 0 failed; 19 ignored; 4,222 total; known queue flake not observed |
| S3 quality scan | PASS | no findings; 7 existing allowances; no allowance failures |
| S3 architecture check | PASS with warnings | exit 0; all package/plugin `FAIL=0`; existing SDK cardinality warning remains |
| S3 exact NetScript specifiers | PASS | 2,361 scanned; 1 allowance; 0 ranges; 0 failures |
| S3 workspace publish dry run | PASS | exit 0; all SDK entrypoints checked |
| S3 JSR audit | PASS with 2 known warnings | existing SDK source-cardinality and slow-type-banner warnings |
| S3 raw doc lint | FAIL (expected baseline, no regression) | Both commands exit 1 with the exact six named diagnostics and no additional diagnostic |
| Repair agent-docs freshness | PASS | Exit 0; `fresh=true`, `stalePaths=[]`, provenance source commit `0fed4d7ff` |
| Repair docs-site verify | PASS | Source/render checks pass; 35,342 internal links and 18 caveat markers resolve |
| Repair SDK lint/format wrappers | PASS | 84 files; zero lint occurrences, format findings, or failed batches |
| Repair raw doc lint | FAIL (expected baseline, no regression) | Combined and cache-only commands each exit 1 with their exact three named diagnostics; zero new |
| Second repair assets barrel | PASS | Exit 0; regenerate-then-diff clean across all seven outputs with the authorized CLI delta staged |
| Second repair agent-docs freshness | PASS | Exit 0; `fresh=true`, `stalePaths=[]`, source commit `0fed4d7ff` |
| Second repair CLI check wrapper | PASS | 883 files; 8 batches; zero failed batches or diagnostics |
| Second repair CLI lint/format wrappers | NOT A PASS | Both exit 2 because Deno excludes CLI targets; explicit one-file runs are also excluded. Diagnostic batch-size-1 lint additionally exposes seven unrelated E2E fixture catalog failures. |
| Second repair raw doc lint | FAIL (expected baseline, no regression) | Both invocations retain exactly the pinned three-plus-three diagnostics; zero new |
| Downstream publish-assets audit | FAIL (out-of-scope generated drift) | Exit 1 names only `packages/mcp/src/publish-assets.generated.ts`; no mutation performed |
| Final repair publish-assets | PASS | Exit 0; canonical output is current |
| Final repair assets barrel | PASS | Exit 0; all seven barrel outputs reproduce without a diff |
| Final repair agent-docs freshness | PASS | Exit 0; `fresh=true`, `stalePaths=[]`, source commit `0fed4d7ff` |
| Final repair MCP check wrapper | PASS | 115 files; one batch; zero failed batches or diagnostics |
| Final repair MCP lint/format wrappers | RED at fixture config discovery; bounded supplemental PASS | Unfiltered 115-file runs exit 1 with zero findings because doctor fixtures intentionally carry invalid workspace configs; excluding only those fixtures passes 110 files with zero findings |
| Final repair raw doc lint | FAIL (expected baseline, no regression) | Both invocations retain exactly the pinned three-plus-three diagnostics; zero new |

## Handoff Notes

- Inspect D1's real Deno KV RED and D2's replacement of the deliberate fail-loud guard first.
- Scope is settled at exactly five additional paths; update only the named Query Bridge quotation
  in D4 and enforce its automated byte-comparison proof without sweeping other site docs.
- S2's proof awaits both `closeKv()` and `resetKv()` in `finally`; the green repo-root suite confirms
  an `:memory:` KV does not leak into later files.
- S3's Query Bridge quotation is a deliberately single-line fenced-code entry. `deno
  fmt` does not reflow it and no markdownlint configuration exists; a later formatter pass must not
  wrap it.
- Keep S1's internal namespace admission, reset, and prologue helpers off `src/cache/mod.ts` and the
  root barrel.
- Draft PR: https://github.com/rickylabs/netscript/pull/1665
- The post-IMPL-EVAL generated-assets repair is recorded in
  `generated-assets-repair-report.md`; stop for the coordinator's fresh Tier-A and delta evaluation.
- The second repair and the newly discovered fourth asset-chain link are recorded in
  `assets-barrel-repair-report.md`; the MCP generated file needs a separate scope ruling.
- The coordinator granted and the final repair closed that fourth link. Evidence is recorded in
  `publish-assets-link4-repair-report.md`; no fifth checked-in mirror was found.
