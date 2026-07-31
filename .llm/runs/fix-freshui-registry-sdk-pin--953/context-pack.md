# Context Pack: fresh-ui registry SDK subpath dependencies (#953 / #956)

## Run Metadata

| Field          | Value                               |
| -------------- | ----------------------------------- |
| Run ID         | `fix-freshui-registry-sdk-pin--953` |
| Branch         | `fix/freshui-registry-sdk-pin`      |
| Current phase  | `gate`                              |
| Archetype      | `6 - CLI / Tooling`                 |
| Scope overlays | `frontend`                          |

## Current State

All five slices are landed and the full gate set is green. The PR (#957) sits at `status:impl`
awaiting an IMPL-EVAL from a separate session; it is not eligible for `status:ready-merge` until
that verdict exists.

## Completed

- Research, plan, design checkpoint, drift (S1).
- `importEntryForDependency` + merge/prune symmetry + 5 unit tests (S2).
- Manifest pins → `0.0.1-beta.11` + 2 manifest-coupled lifecycle tests (S3).
- Guard rules — currency, export existence, range notes — + 6 guard tests (S4).
- `publish:readiness` fails on stale pins and unexported subpaths + 1 release test (S4 reconcile).
- Full gate set (S5).

## In Progress

- Nothing. The run is handed off.

## Next Steps

1. IMPL-EVAL in a separate session; on `PASS`, move `status:impl` → `status:impl-eval` →
   `status:ready-merge`.
2. File the range-pin follow-up issue (drift entry 4) and link it from the PR.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Normalise the import-map value to the package root | plan D1 | Executed proof; one entry serves root + all subpaths |
| Extend `check-netscript-jsr-specifiers.ts` | plan D2 | Already a `ci:quality` dependency |
| Currency vs. the workspace member's own version | plan D3 | Names the disagreeing package |
| Range pins reported, not failed | plan D4 | Skew, not breakage |
| Release-side gate lives in `publish-readiness.ts` | S4 reconcile | It already consumed the scan; a second `prepareRelease` gate was redundant |
| Evaluator passes `NOT_RUN` | plan D5 | Single-session run cannot self-certify |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `packages/cli/src/kernel/application/ui/registry-deno-json.ts` | changed | `ImportMapEntry` + `importEntryForDependency` |
| `packages/cli/src/kernel/application/ui/registry.ts` | changed | prune uses the same entry helper |
| `packages/cli/src/kernel/application/ui/registry-deno-json_test.ts` | new | 5 tests |
| `packages/cli/src/kernel/application/ui/registry-lifecycle_test.ts` | changed | 2 manifest-coupled tests |
| `packages/fresh-ui/registry.manifest.ts` | changed | 2 SDK pins → `0.0.1-beta.11` |
| `.llm/tools/validation/check-netscript-jsr-specifiers.ts` | changed | currency + export rules, range notes |
| `.llm/tools/validation/check-netscript-jsr-specifiers_test.ts` | changed | 6 new tests |
| `.llm/tools/release/publish-readiness.ts` | changed | specifier check fails on stale / unexported |
| `.llm/tools/release/publish-readiness_test.ts` | changed | stale-pin release test |
| `.llm/tools/release/prepare-release.ts` | changed | comment naming the residue hole |
| `.llm/runs/fix-freshui-registry-sdk-pin--953/**` | new | run artifacts |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | ------------ |
| Static      | `PASS`         | fmt 1869/0, lint 1724/0, check 2458/0, test 2243 passed |
| Fitness     | `PASS`         | `arch:check` exit 0, `publish:dry-run` Success, `quality:scan` ok |
| Runtime     | `N/A`          | not a release cut |
| Consumer    | `PASS`         | `/tmp/sdkprobe` `deno check` against published JSR |
| Evaluator   | `NOT_RUN`      | PLAN-EVAL and IMPL-EVAL both need a separate session |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: five entries — filed root cause incomplete; MCP beta.9 not reproducible; bump cannot see
  `.ts` residue; range-pin skew deferred; evaluator passes not run.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
