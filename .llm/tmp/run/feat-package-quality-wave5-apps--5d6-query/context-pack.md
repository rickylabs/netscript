# Context Pack — 5d6-query

## Current Status

- Branch: `feat/package-quality-wave5-apps-5d6-query`
- PR: `https://github.com/rickylabs/netscript/pull/39`
- Agent role: implementation agent only; final IMPL-EVAL must be separate.
- PLAN-EVAL: `APPROVED` in `plan-eval.md`.
- Latest completed implementation slice: Slice 2 query bridge public types and wrappers.

## Rebaseline Summary

- Root workspace exclusion blocker is gone: root `deno.json` no longer excludes `packages/fresh/`.
- Package dry-run passes from `packages/fresh`.
- Targeted `deno check --unstable-kv` for query/server/root passes.
- Package check wrapper passes for `packages/fresh`.
- Remaining expected failures:
  - `packages/fresh/server.ts` doc-lint: 4 errors.
  - `packages/fresh/mod.ts` doc-lint: 4 inherited utils errors.
  - scoped fmt: existing server `define-fresh-app` files need formatting.
  - package scoped lint: two builder fixture `require-await` findings remain from the rebaseline; the query `JSX` unused import was fixed in Slice 2.

## Slice 2 Summary

- `@netscript/fresh/query` now exports package-owned options/result/query-client/hydration/loader-data types.
- Raw upstream TanStack hook re-exports were replaced with wrapper functions.
- `deno doc --lint packages/fresh/query/mod.ts` passes.
- `deno check --unstable-kv packages/fresh/query/mod.ts packages/fresh/server.ts packages/fresh/mod.ts` passes.
- Query scoped fmt/lint wrappers pass.
- Package dry-run still passes.

## Next Slice

Implement the server public-surface cleanup for streaming renderable, renderer, and error-boundary public types.
