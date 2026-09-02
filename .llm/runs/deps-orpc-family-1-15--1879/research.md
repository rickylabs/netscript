# Research — deps-orpc-family-1-15--1879

## Re-baseline

- Carried-in source: issue #1879 and owner slice brief.
- Re-derived against `main` at `82a2527e27aa91baabf35e4b001ed8b6266308e6` on 2026-09-01.
- The baseline matches the supplied SHA. The root has six `^1.14.6` direct ranges and
  `@orpc/otel` at `^1.14.7`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The stable authority reports all seven direct packages behind `1.15.0`. | `deno task deps:latest --filter '@orpc/*'` (captured exit 0) |
| 2 | The baseline graph contains `@orpc/shared` at both `1.14.6` and `1.14.7`. | `deno why @orpc/shared` (captured exit 0) |
| 3 | oRPC specifiers occur in the root and 12 member manifests. | `rg -n '"@orpc/[^" ]+"\\s*:\\s*"[^"]+"' --glob deno.json .` |
| 4 | `packages/plugin-workers-core/deno.json` is among those manifests; its oRPC keys belong to #1879 while only its streams-core key belongs to sibling #1876. | Corrected key-level owner boundary plus manifest enumeration |

## Manifest inventory

- Owned oRPC keys: `deno.json`, `packages/bench/deno.json`, `packages/logger/deno.json`,
  `packages/plugin/deno.json`, `packages/plugin-auth-core/deno.json`, `packages/sdk/deno.json`,
  `packages/cli/e2e/deno.json`, `packages/plugin-ai-core/deno.json`,
  `packages/contracts/deno.json`, `packages/fresh/deno.json`, `packages/service/deno.json`, and
  `packages/cli/e2e/fixtures/desktop-native/deno.json`, plus
  `packages/plugin-workers-core/deno.json`.
- `plugins/triggers/deno.json` contains no `@orpc/*` specifier and remains untouched.
- The exact SDK fixture imports and six oRPC scaffold catalog values are authorized
  upstream/dependency-catalog declarations, not behavioral changes.

## jsr-audit surface scan

- N/A: dependency-manifest/lock maintenance only; no package export, type, or publish surface changes.

## Open questions

- None. Final integration with then-current `main` is mandatory before the final lock proofs.
