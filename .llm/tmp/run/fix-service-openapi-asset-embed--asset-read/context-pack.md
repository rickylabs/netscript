# Context Pack: service OpenAPI Scalar asset embed

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-service-openapi-asset-embed--asset-read` |
| Branch | `fix/service-openapi-asset-embed` |
| Current phase | `impl-eval` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `service` |

## Current State

Single implementation slice is pushed and PR #165 is open. Implementation commit:
`f02e153d83e69abfc77eae7f2798c3f5ef9f6a7d`: Scalar JS is embedded through a generated string
constant, `createScalarJs()` no longer performs a runtime asset read, and requested gates are green
except the literal user-provided wrapper command form which is incompatible with the current wrapper
CLI and was rerun in the supported equivalent form.

PR: `https://github.com/rickylabs/netscript/pull/165`
IMPL comment: `https://github.com/rickylabs/netscript/pull/165#issuecomment-4823686091`

## Completed

- Read harness, doctrine, JSR audit, Deno toolchain, repo tools, PR, and rtk skills.
- Re-baselined `main` to `057e27654e75d8ba782bff0bdc0624f3e29f828c`.
- Confirmed `openapi.ts` has the JSR-unusable runtime `Deno.readTextFile` asset read.
- Confirmed public signature `createScalarJs(): ServiceHandler`.
- Implemented generator target and generated `packages/service/src/primitives/scalar.generated.ts`.
- Removed raw `assets/scalar.min.js` from service publish include.
- Extended `check:assets-barrel` determinism coverage.
- Ran requested gates.

## In Progress

- Branch push, PR creation, and IMPL evidence comment.

## Next Steps

1. Launch/request separate-session IMPL-EVAL.
2. Evaluator should independently rerun the gate set and write `evaluate.md`.
3. Do not merge until IMPL-EVAL passes.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Embed Scalar JS as generated plain string const | user task / jsr-audit | No text imports or runtime path reads. |
| Keep `createScalarJs()` public signature | `deno doc` | No API change. |
| Remove raw Scalar asset from publish include | plan | Raw asset remains in repo for regeneration. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/fix-service-openapi-asset-embed--asset-read/*` | new | Harness artifacts. |
| `.llm/tools/generate-cli-assets-barrel.ts` | changed | Adds service generated output. |
| `deno.json` | changed | Extends `check:assets-barrel` file list. |
| `packages/service/deno.json` | changed | Drops raw Scalar asset from publish include. |
| `packages/service/src/primitives/openapi.ts` | changed | Serves `SCALAR_MIN_JS`; no runtime asset read. |
| `packages/service/src/primitives/scalar.generated.ts` | new | Generated embedded Scalar JS string constant. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | service check exit 0; assets determinism exit 0; release preflight exit 0; service tests exit 0. |
| Fitness | PASS | publish dry-run exit 0; doc filter shows unchanged `createScalarJs(): ServiceHandler`; no new casts/text imports. |
| Runtime | PASS | service tests 57 passed, 0 failed. |
| Consumer | PASS | service package check/tests cover builder use of `createScalarJs()`. |

## Open Questions

- None.

## Drift and Debt

- Drift: minor wrapper CLI drift: explicit `--unstable-kv` argument is unsupported because wrapper passes it by default; supported equivalent passed.
- Debt: existing Scalar size strategy and service slow-type debt remain.

## Commits

- f02e153d83e69abfc77eae7f2798c3f5ef9f6a7d: fix(service): embed scalar.min.js as string const (JSR-safe), drop readTextFile
