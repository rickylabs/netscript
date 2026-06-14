# Context Pack — 5d6-query

## Current Status

- Branch: `feat/package-quality-wave5-apps-5d6-query`
- PR: `https://github.com/rickylabs/netscript/pull/39`
- Agent role: implementation agent only; final IMPL-EVAL must be separate.
- PLAN-EVAL: `APPROVED` in `plan-eval.md`.
- Latest completed implementation slice: Slice 5 whole public-surface doc-lint rebaseline.

## Rebaseline Summary

- Root workspace exclusion blocker is gone: root `deno.json` no longer excludes `packages/fresh/`.
- Package dry-run passes from `packages/fresh`.
- Targeted `deno check --unstable-kv` for query/server/root passes.
- Package check wrapper passes for `packages/fresh`.
- Remaining expected failures:
  - scoped fmt: existing server `define-fresh-app` files need formatting.
  - package scoped lint: two builder fixture `require-await` findings remain from the rebaseline; the query `JSX` unused import was fixed in Slice 2.

## Slice 2 Summary

- `@netscript/fresh/query` now exports package-owned options/result/query-client/hydration/loader-data types.
- Raw upstream TanStack hook re-exports were replaced with wrapper functions.
- `deno doc --lint packages/fresh/query/mod.ts` passes.
- `deno check --unstable-kv packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts` passes.
- Query scoped fmt/lint wrappers pass.
- Package dry-run still passes.

## Slice 3 Summary

- `@netscript/fresh/server` now re-exports the streaming renderable, renderer, render stream, and boundary renderable types used by public server signatures.
- `deno doc --lint packages/fresh/server.ts` passes.
- `deno check --unstable-kv packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts` passes.
- Server barrel scoped fmt/lint wrappers pass.
- Package dry-run still passes.

## Slice 4 Summary

- Root `@netscript/fresh` now exports `CacheEntryLike` and `CachedListEntryLike` alongside the cache helper functions that expose those types.
- `deno doc --lint packages/fresh/mod.ts` passes.
- `deno doc --lint packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts packages/fresh/utils/mod.ts` passes.
- `deno check --unstable-kv packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts` passes.
- Package dry-run still passes.

## Slice 5 Summary

- Whole public-entrypoint doc-lint passes across the 13 approved `@netscript/fresh` exports.
- Package check passes.
- Package dry-run passes.
- Package-wide fmt still reports `server/define-fresh-app.ts` and `server/define-fresh-app.test.ts`.
- Package-wide lint still reports `require-await` in two builder fixtures.
- Planned whole-package doc-lint cleanup is retired for the current implementation state; final closeout should still rerun it after remaining source slices.

## Next Slice

Clean the narrow package fmt/lint residuals, then continue final root/package quality closeout.
