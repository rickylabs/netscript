# Research

Baseline `6a1d84a6e04c0d39df3926528e0380e267316aee`, Deno 2.9.7.
Issue #2524 has no triage duplicate. PR #2503 is merged; its retained run
`.llm/runs/orch-divybot-6539987333--s6a/` provides browser recipes and zero-diff
legacy evidence. No open or merged follow-up PR found for #2524.

Utility root selectors repeat in component, island and layout CSS. They intentionally
outweigh shared legacy selectors (Card, invalid/focus controls, Badge). Zeroing their
specificity would change behavior. Native CSS nesting shares exactly the existing
root selector and preserves both specificity and order, without a runtime attribute
or synchronizing new theme state. Group only contiguous Utility rules; retain
unscoped rules and media boundaries in their original order.

The reported QueryResult duplication was fixed by the hydration repair in #2503:
`render-resource-slice.ts` passes `QUERY_RESULT_TEMPLATE` and
`QUERY_RESULT_SUCCESS_RETURN` into ResourceIsland placeholders. Add an output-level
regression proving both real generators consume that same body exactly once.

Existing size gate: `packages/fresh-ui/tests/publish-size.test.ts`, executed by the
Fresh UI package suite in CI. Add raw and gzip CSS budgets here using actual embedded
registry CSS, with authored/published byte parity so stale carriers cannot hide growth.

JSR: no new exports, dependencies or slow-type contracts. The source CSS ships via
embedded registry assets. Regenerate canonical carriers and run the package audit,
native publish-size test and release preflight. Existing README/export metadata retained.

Memory consulted before implementation: prior Utility environment/browser/surface/
carrier notes and Claude read-only evaluation note. RTK and browser node_modules
are absent; Deno 2.9.7, Node, gh and Claude are available.
