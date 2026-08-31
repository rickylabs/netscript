# Research — fix-sdk-cli-key-normalization-residuals--1833

## Re-baseline

- Carried-in source: issue #1833 and merged #1831 baseline `bd9d463b4`.
- Re-derived against `origin/main` @ `ee0e626bb945e2d9af58e49bd7bbdf714d0785c3` on 2026-08-31.
- Current `main` is one harness-only commit ahead of #1831; no files under the owned SDK, Aspire,
  or CLI deploy-build paths changed. The branch was fast-forward rebased before edits.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | SDK full browser keys already replace every non-identifier character via `normalizeViteIdentifierSegment()`, but shorthand keys replace only `-`. | `packages/sdk/src/discovery/browser-env.ts` |
| 2 | Aspire applies the same normalizer to both `full` and `shorthand`. | `packages/aspire/src/application/build-vite-env-var-name.ts` |
| 3 | CLI deploy prebuild skips full keys for hyphenated names and separately replaces only hyphens in shorthand keys. | `packages/cli/src/public/features/deploy/build/build-windows-prebuild.ts` |
| 4 | The existing SDK↔Aspire pin covers only `sagas-api` and `workers.api/v2`, so it does not protect punctuation positions or underscore multiplicity. | `packages/sdk/tests/discovery/env-ordering_test.ts` |
| 5 | Server discovery deliberately interpolates the raw service name (`services__sagas-api__http__0`) and must not share the browser normalizer. | `packages/sdk/src/discovery/service-url.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/sdk/deno.json`, `packages/sdk/src/discovery/mod.ts`,
  `packages/aspire/deno.json`, `packages/aspire/src/application/mod.ts`, and `packages/cli/deno.json`.
- Slow-type / surface risks: none introduced. The plan adds no export-map entry, public package
  symbol, dependency, version, or JSDoc contract. The CLI imports the existing published
  `@netscript/aspire/application` builder and keeps its new pure test seam internal to a feature
  module.
- Publish/doc-lint commands are N/A for this focused behavioral fix because the public JSR surface
  is unchanged; the user-selected gates cover the affected source and consumers.

## Open questions

- None. The issue supplies the normalization contract, boundary, corpus, and required gates.

