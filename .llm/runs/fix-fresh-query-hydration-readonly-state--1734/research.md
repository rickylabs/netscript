# Research — fix-fresh-query-hydration-readonly-state--1734

## Re-baseline

- Carried-in source: issue #1734 and owner brief.
- Re-derived against `main` @ `21d516224fe35e92957f0998ee848bbf2024eda0` on 2026-08-30.
- The checkout starts clean at the exact stated base; the issue reproduction remains current.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Pinning Fresh's query-core import to `5.102.8` makes the exact no-lock hydration check fail with TS2345 at `hydration.ts:43`; restoring `^5.101.0` restores the checkout. | `deno check --unstable-kv --no-lock packages/fresh/src/application/query/hydration.ts` with the temporary pin |
| 2 | `hydrate` accepts `unknown` in 5.101.0 and `Partial<DehydratedState>` in 5.102.8; both versions export mutable core `DehydratedState` arrays. | `deno doc --filter hydrate npm:@tanstack/query-core@<version>` |
| 3 | The current stable wrapper reports query-core 5.102.8 while Fresh declares `^5.101.0`. | `deno task deps:latest -- --filter @tanstack/query-core` |
| 4 | NetScript's public `DehydratedState` intentionally exposes readonly `unknown[]` fields and is re-exported from `@netscript/fresh/query`. | `query-types.ts:34-39`; `query/mod.ts` |
| 5 | A shallow mutable copy is insufficient because its elements remain `unknown`; an assertion would erase the exact safety this issue requires. A private runtime guard can validate and narrow each entry before cloning it for TanStack. | upstream `MutationState`, `QueryState`, and hydration declarations via `deno doc` |
| 6 | The package is established Archetype 4 with a current `Keep` verdict. | doctrine files 06 and 10 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all 16 `packages/fresh/deno.json` exports.
- Planned public surface change: none; `DehydratedState` and the query subpath exports remain byte-for-byte stable.
- Baseline residue: the structured doc-lint currently reports 45 inherited diagnostics; the JSR
  audit reports one slow-type warning and one unrelated `src/runtime/ai` cardinality warning.
- Slice risk: importing an unexported upstream type or changing the package-owned readonly state
  would leak TanStack's contract. The plan avoids both.

## Open questions

- None. Invalid entries will fail closed at the hydration boundary rather than be asserted into
  TanStack's internal type. This preserves the published contract and adds no compatibility cast.
