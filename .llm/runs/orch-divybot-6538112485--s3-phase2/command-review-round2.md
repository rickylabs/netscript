PASS (slice 7c3a CommandPalette corrective round, not the final IMPL-EVAL)

The `RegExp.escape` blocker is fixed, and I found no regressions.

- **The fallback is correct** (`packages/fresh-ui/registry/components/ui/command-palette.tsx:76-92`). `queryExcerpt` uses `RegExp.escape` only if it exists. Otherwise it escapes exactly the regex syntax characters `. * + ? ^ $ { } ( ) | [ ] \`.
  - Under the `u` flag, escaping a syntax character is always a valid identity escape, and leaving `-` and `/` alone is valid outside a character class.
  - The resulting case-insensitive Unicode pattern matches the query literally either way.
  - Excerpts stay escaped plain text, with matches in `<strong>`, and no dependency was added.
- **The regression test is real**: `command-palette/literal-query-without-modern-regexp-api` in `tools/fresh-ui-browser/gap-tests/command-palette.spec.ts:194-204`.
  - It deletes `RegExp.escape` from the live page and checks it's really gone.
  - It then types `A.B(C)` into the hydrated inline palette and expects exactly one result, the literal `a.b(c)` in `<strong>`, and no page errors.
  - Because the API is removed only after the page loads, the test genuinely exercises the fallback branch at runtime across all four projects.
- **The query-reset note** (the internal query resets on reopen without calling `onQueryChange`) is now documented in the README as "user edits only", which settles my earlier non-blocking point.
- Everything else from round one is unchanged and still holds: the single activation path, the Combobox runtime fixes, Escape and cancel handling, controlled refusal, and the registry and contract metadata.

I couldn't see the run results: the browser cases, focused tests, wrappers, doc-lint, docs build, the finishing quality rerun, and the public `command-validation.json`. Those all need to pass before you commit the source.

Still to come:
- The clean-source carriers have to be regenerated and freshness-checked after the source commit.
- The whole-phase IMPL-EVAL and phase 2b are still open.
