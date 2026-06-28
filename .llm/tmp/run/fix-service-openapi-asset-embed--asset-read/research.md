# Research — fix-service-openapi-asset-embed--asset-read

## Re-baseline

- Carried-in source: user task #147 release:preflight finding.
- Re-derived against `main` @ `057e27654e75d8ba782bff0bdc0624f3e29f828c` on 2026-06-28.
- What changed vs the carried-in version:
  - The bug is still present exactly in `packages/service/src/primitives/openapi.ts`.
  - The locked generator already embeds CLI, plugin, and Fresh UI assets through plain string constants.
  - Root `deno.json` has `gen:assets-barrel`, `check:assets-barrel`, and `release:preflight` tasks.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `createScalarJs()` currently reads `../../assets/scalar.min.js` at request time from an `import.meta.url`-derived URL. | `rg -n "scalarJsUrl|scalarJsCache|Deno\\.readTextFile" packages/service/src/primitives/openapi.ts` |
| 2 | `createScalarJs()` is a public export with signature `createScalarJs(): ServiceHandler`; the signature must not change. | `deno doc --filter createScalarJs packages/service/mod.ts` |
| 3 | The existing LOCKED asset mechanism is `.llm/tools/generate-cli-assets-barrel.ts`: read the asset at generation time, render `JSON.stringify(content)` into a generated `.ts` barrel, format through `formatTypeScript()`, commit the generated result. | `.llm/tools/generate-cli-assets-barrel.ts` |
| 4 | `packages/service/deno.json` currently includes `assets/scalar.min.js` in `publish.include`; after embedding, the runtime source should publish through `src/**/*.ts` and the raw asset should not ship. | `jq '.publish' packages/service/deno.json` |
| 5 | `deno.json` `check:assets-barrel` currently diffs the three existing generated outputs and must include the service generated file for determinism. | `jq '.tasks["check:assets-barrel"]' deno.json` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/service/mod.ts` public export `createScalarJs`.
- Slow-type / surface risks:
  - Existing service package slow-type carve-out remains accepted debt; this slice does not change exported types.
  - Runtime asset reads from `import.meta.url` are not JSR-safe over `https:` consumers and are the release:preflight blocker.
  - Text imports with `with { type: 'text' }` are forbidden for this repo because authenticated `deno publish` graph build rejects them.

## Open questions

- None. The implementation mechanism and gate set are locked by the task and existing repo precedent.
