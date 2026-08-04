# Research — fix-streamdb-wrapper-type-erasure--w5-v2

## Re-baseline

- Carried-in source: live issue #1235 and the W5-V2 owner brief.
- Re-derived against `origin/main` @ `3677973bca448ada0b3982495cabed5261b1acb2` on 2026-08-04.
- The live issue agrees with the brief: the wrapper defect is long-standing on 0.0.4 and two 0.0.5
  canaries; multi-`from` typing is explicitly refuted and excluded.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `NetScriptStateSchema<TDef>` maps every collection value to `unknown`, and `NetScriptStreamDB<TDef>` repeats that erasure in `collections`. | `packages/fresh/src/runtime/streams/create-stream-db.ts` |
| 2 | Upstream `createStreamDB<TDef>()` returns `StreamDB<TDef>` whose collection map extracts each `CollectionDefinition` value type. | `@durable-streams/state@0.3.1/src/stream-db.ts`; direct control compile fixture |
| 3 | The canary documentation uses the exact failing `query.from({ i: db.collections.myEntity })` call and promises typed collections. | `docs/site/web-layer/defer-streaming-ui.md` |
| 4 | Existing tests prove URL/auth/schema wiring only; they do not compile-check the documented query or compare wrapper inference with the upstream control. | `packages/fresh/src/runtime/streams/create-stream-db_test.ts`; `packages/fresh/tests/type-fixtures/` |
| 5 | URL construction, auth injection, schema runtime validation, and factory selection are independent of the erased public generics. | `packages/fresh/src/runtime/streams/create-stream-db.ts` |
| 6 | The current branch is exactly at `origin/main`; `deno.lock` already has an unrelated unstaged queue entry. | raw `git status`, `git diff -- deno.lock`, and `git merge-base` at bootstrap |

## jsr-audit surface scan

- Surface scanned: `@netscript/fresh/streams` export map and `createNetScriptStreamDB` via
  `deno doc --filter`.
- Planned public-surface change: replace local `unknown` projections with explicit indexed access
  to exported upstream `StateSchema` / `StreamDB` types while retaining the same runtime factory.
- Slow-type / surface risks: exported generic aliases can create `private-type-ref` or slow-type
  diagnostics if inference is left implicit. The plan requires explicit exported return types,
  full-export `deno doc --lint`, JSR package audit, and package publish dry-run.
- Publish file-list risk: none; the compile fixture lives under the already excluded
  `tests/type-fixtures/` path.

## Open questions

- None. The issue, upstream control, public contract, excluded behavior, and gate set are all
  resolved before implementation.
