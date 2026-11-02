## IMPL-EVAL #2569, round 2 (same evaluator): **PASS**

I'm also signing off as slice supervisor. Three non-blocking findings are listed below. Review was read-only: I edited no source, carrier, run artifact or GitHub item.

### F1 is fixed
- **Round-1 probes:** I re-ran all 13 through `ReleaseEmbeddedDocsCorpus.findGuidance`. None reaches a component page now; they go to task guidance such as `database-migration`, `streams` and `reference/contracts`. All 13 are also negative tests in `packages/mcp/tests/component-guidance_test.ts`.
- **The matcher** (`packages/mcp/src/domain/docs/component-guidance.ts:18-36`) now accepts five signals: exact identity, compound CamelCase API name, adjacent UI context, a hyphenated registry name written literally, or a theme/render verb. A recognised workflow concept now blocks the last two, and blocks everything except exact, API-name or context matches. The sentence-start capital fallback is gone.
- **Positives** still route correctly in my probes: `DataTable`, `CommandPalette`, `FormField props`, `What are Button props?`, `ui:add button`, `command-palette`, "command palette keyboard shortcuts", "theme the toast", "the select component", "render a page header", "Pagination?" and "Pagination component".
- **Regex safety:** `identity` is no longer escaped before going into `RegExp`, but it comes from `words()`, which keeps only letters, digits and spaces. That is safe.

### Share fast path is correct
- **Shared links:** `tools/docs-site/fresh-ui/builder.ts:57-62` accepts a `?preset=` value only if it exactly equals a code built by the CLI's own `encodeUiPreset` (`generate.ts:158`). That is the code the validator would accept, so behaviour is unchanged. Any other value still goes through the lazily loaded `supportedPreset`. Manual import always uses the validator.
- **Browser test:** `refresh()` writes `?preset=<code>` with `history.replaceState` (`builder.ts:51-55`), so `page.reload()` really tests a shared link. The test checks that the decoder chunk is not loaded and that both budgets hold on reload, then that importing a code loads the decoder and never requests `catalog.json`.
- **Formatting churn** is gone: the browser spec diff is now +80/−1 (import edits plus the new test).

### Non-blocking findings (fix or record as follow-up; the coordinator decides)
- **N1, the render verb can still capture a few task questions.** The visual-action check at `component-guidance.ts:31-32` lets "render/theme [a|an|the] <component>" match when the question has no recognised workflow concept. That concept list is small (route-management, validated-form, cache-freshness, getting-started, extension-plugin, application-database, service-backed-ui), and phrasings it doesn't cover get through:
  - "How do I render a select query result in the CLI?" → `select`
  - "How do I render an empty state in a JSON API?" → `empty-state`
  - "How do I render a message in my HTTP handler?" → `message`
  - "How do I theme an alert email?" → `alert`

  At baseline these were not routed, so this is a small new regression. It is not blocking because it needs a UI verb right before a component noun, and several hits are arguably relevant. Suggested fix: keep "theme" but require "render" to be followed by a component word or the end of the clause, and add these as negatives.
- **N2, single-word names mid-sentence aren't recognised.** "How do I use Button?" → `ai/agent-tooling`, "How do I use the Select?" → `cli-reference`, "How do I use Pagination" → `reference/contracts`. This is not a regression (baseline missed these too), but removing the capital fallback entirely also dropped capitalised names in the middle of a sentence. Suggested fix: treat a capitalised component name that is not the first word as an API name, unless a workflow concept conflicts.
- **N3, the reload test can't fail if sharing breaks.** Before `page.reload()` in `tools/fresh-ui-browser/docs-tests/components.spec.ts`, add `expect(page.url()).toMatch(/[?&]preset=ns1_/)`. Otherwise removing `replaceState` would quietly turn the shared-link check into a plain `/create` reload.

Leftovers I accept as by design: a bare "Search" or "Progress" routes to the component (exact identity), and `<name> props` context overrides a workflow concept, which baseline also did.

### What I reviewed
- The full current diff from `125c26fc` plus `payload-budgets.ts` and `preset.ts`.
- The repaired matcher, the generic-ranker exclusion, the new tests, the builder fast path, how preset codes are generated, and the browser payload/shared-link test.
- My round-1 findings on code splitting, the static import closure, budgets, base path and unsupported-picker docs still hold.

### Commands I ran
- `.llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/mcp/tests/component-guidance_test.ts tools/docs-site/fresh-ui/generate_test.ts`: exit 0, 11 of 11 passed.
- `.llm/tools/run-deno-test.ts` on the 9 other guidance ranking suites (contract, corpus-load, evaluation, intent-regression, retrieval, terms, issue-2269, route-management, stream-retention): exit 0, 47 of 47 passed.
- In-memory `deno eval` probes of `findGuidance`: 40 cases in the main set plus 15 recall cases. Nothing was written to disk.
- Read-only inspection of the builder share logic and the generated `builder.js`.

### Not independently verified
I did not run any of these, so they are claimed only by the implementer:
- The full 248-test MCP/generator suite (rerun in progress on their side).
- Browser tests, including the stable-output rerun with the new shared-link check.
- Site build/rendered/freshness checks.
- The four carrier freshness checks, which are still pending the commit.
- Quality/arch gates.

The full CLI runtime E2E remains **UNPROVEN** locally: the Aspire doctor failed because Docker is unavailable. Required remote checks have not run, so this is not a statement that CI is ready.
