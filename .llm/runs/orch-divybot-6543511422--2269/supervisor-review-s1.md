**S1 supervisor review, issue 2269 (read-only, blockers only): PASS**

### My two S1 fixes are in place
- **No eager corpus load.** The generated `publish-assets.generated.ts` holds only the version, the README and the fixed provenance. It has no carrier import, no top-level decode and no NUL bytes. Pages decode lazily through `loadReleaseDocsSource()` and are checked against the hash fixed at generation time. The decompression-counter test runs `cli.ts` in a fresh child process and checks that only the README is decompressed.
- **Search no longer hides partial matches.** `saturatedOccurrences` still counts any substring, as main did, so `createReadinessHandler` matches the query `ReadinessHandler`. Whole-word hits get full, saturated weight. Substring-only hits get a 5% share, so they still score above zero. The phrase boost requires the whole phrase as a word match and only changes rank. The `ReadinessHandler` regression test checks that `pages/services-sdk/services` comes back with no `fallback`. That makes the zero-result "No seam documented" answer honest again.
- **Everything else still holds:** the single shared corpus behind `@netscript/mcp/docs`, MCP with no dependency on the CLI, slug lookup with exact match first and then the form with or without `pages/` (with `/index` stripped), citations on all four docs tools, the cited zero-result fallback for `withReadinessCheck`, the all-page slug walk, `.mdx` handling identical in both corpora, and the drift notes.
- **Concept hack removed.** The `{ heading: 'learn', title: 'netscript' }` route hint is gone from `guidance-concepts.ts`.

### Not approved: second fixture change, deferred to S2 (not an S1 blocker)
`guidance-evaluation.json` now expects `pages/tutorials/storefront/04-checkout-saga#step-3-scaffold-the-checkout-saga` as the third result for the plugin intent ("add a capability NetScript does not ship"). That checkout-saga section has nothing to do with that intent. The fixture now just records whatever the engine returns, which locks in an unrelated result and weakens the golden set. I only approved replacing the getting-started expectation, not this one.

S2 has to either:
- make the third slot a concrete, related plugin page, such as `orchestration-runtime/how-to/add-a-plugin` or the `reference/plugin` page, or
- change that case to check only the two plugin routes, keeping the case count and determinism checks.

The same goes for the failing score-only case "pick direct application ownership versus a reusable integration". Fix the ranking, not the expectation.

The full guidance suite is still red (76 passed, 1 failed). That has to be green before the final IMPL-EVAL. This review covers S1 only; it does not certify S2 or merge readiness. I didn't run the gates myself; the pass counts above are as you reported them.

VERDICT: PASS (S1 slice)
