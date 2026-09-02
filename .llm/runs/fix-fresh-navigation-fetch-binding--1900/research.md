# Research — fix-fresh-navigation-fetch-binding--1900

## Re-baseline

- Carried-in source: issue #1900 and the staged `implement.md` diagnosis.
- Re-derived against `origin/main` @ `e938ecd31fd1c909f23bb7dd60029a302ce8d428` on 2026-09-01.
- What changed vs the carried-in version: nothing material. Current `origin/main` still captures
  `platform.getFetch()` without a receiver and calls it at both the pass-through and intercepted
  partial-fetch paths.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The raw fetch is retained for final-disposal identity restoration, so replacing it with only a bound function would change an existing semantic. | `coordinator.ts` constructor and `dispose()` identity guard |
| 2 | Both transport call sites must use the receiver-preserving callable. | `coordinator.ts` `interceptFetch()` pass-through and partial paths |
| 3 | Existing doubles are receiver-insensitive plain functions. | `coordinator_test.ts` `TestPlatform` construction sites |
| 4 | Production navigation code contains no `.abort(`, `AbortController`, or `.cancel(`. | focused `rg` over `packages/fresh/src/runtime/navigation` excluding tests |
| 5 | `@netscript/fresh/navigation` exports exactly seven symbols: two values and five types. | `deno doc packages/fresh/src/runtime/navigation/mod.ts` and `mod.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh/src/runtime/navigation/mod.ts` and the package export map.
- Slow-type / surface risks: none introduced by the planned change. The seven-symbol public surface,
  JSDoc, entrypoint, and export map remain untouched.
- Publish-file risk: the added regression is a colocated `_test.ts` change and remains excluded by
  the package publish configuration.

## Open questions

- None. The issue supplies the defect, required semantic invariant, regression shape, file bounds,
  and hosted-browser ownership.
