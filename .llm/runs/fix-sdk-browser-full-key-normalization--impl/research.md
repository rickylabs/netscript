# Research — fix-sdk-browser-full-key-normalization--impl

## Re-baseline

- Carried-in source: issue #1824 and the owner-provided source findings.
- Re-derived against `origin/main` @ `dea44991120a2c5da96a89df0f68d69c455c035e` on 2026-08-31.
- What changed vs the carried-in version: no semantic drift. The line locations moved with `main`,
  but the SDK browser builder still preserves invalid identifier characters while Aspire replaces
  every non-ASCII-alphanumeric/non-underscore character with `_`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `createBrowserServiceEnvKey()` interpolates `serviceName` unchanged. | `packages/sdk/src/discovery/browser-env.ts` |
| 2 | Aspire normalizes resource and endpoint segments with `/[^a-zA-Z0-9_]/g`. | `packages/aspire/src/application/build-vite-env-var-name.ts` |
| 3 | The SDK shorthand already maps hyphens to underscores and must remain unchanged. | `createBrowserServiceShortEnvKey()` and regression test |
| 4 | Server discovery preserves resource hyphens and matches Aspire server output; it must remain unchanged. | `createServerServiceEnvKey()` and regression test |
| 5 | Neither production package depends on the other; Aspire's doctrine verdict explicitly requires SDK-independent contribution ports. | both package `deno.json` files; doctrine file 10 |
| 6 | The SDK browser-key builder is internal to `browser-env.ts`, not exported from `@netscript/sdk/discovery`. | `packages/sdk/src/discovery/mod.ts`; `deno doc --filter createBrowserServiceEnvKey ...` reports no node |
| 7 | Issue #1824 is open, already carries the requested labels/status and milestone number 27, and has no acceptance checkboxes. | GitHub issue #1824 fetched 2026-08-31 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/sdk/deno.json`, `packages/sdk/src/discovery/mod.ts`,
  `packages/aspire/deno.json`, and `packages/aspire/src/application/mod.ts`.
- Slow-type / surface risks: none introduced. The fix changes an internal function body and tests;
  it does not change either export map, add a public symbol, alter package metadata, or add a
  dependency. Package-wide publish/doc audits are outside this behavior-only slice.

## Open questions

- None. A production import in either direction is forbidden. The cross-package assertion instead
  lives in SDK tests and consumes Aspire's existing public `@netscript/aspire/application` subpath;
  package manifests and published sources remain dependency-free.
