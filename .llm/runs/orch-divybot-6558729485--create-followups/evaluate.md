## IMPL-EVAL #2569, round 3 (same evaluator): **PASS**, with slice supervisor sign-off

All three round-2 findings (N1–N3) are fixed and covered by tests, and I found nothing new. Review was read-only: no source, carrier, run artifact or GitHub edits.

### What changed and whether it holds
- **N1, render/theme verb** (`packages/mcp/src/domain/docs/component-guidance.ts:31-32`): the component name must now be the last word of the question. It also sits behind the workflow-concept guard at `:28`.
  - All four task questions from round 2 (SQL result, JSON API, HTTP handler, alert email) now go to task guidance.
  - "theme the toast" and "render a page header" still route to their components.
- **N2, capitalised single-word names** (`:33-35`): this needs three things together. The question must end with the capitalised API name (case-sensitive), the name must follow "use", "install" or "add" (optionally "the"), and the workflow-concept guard applies.
  - Fixed: "use Button?", "use the Select?", "use Pagination", "install Toast?" and "add the Alert?" now route to their components.
  - Still negative, as they should be: lower-case or mid-sentence forms such as "add search to my service", "add pagination?", "install markdown?", "add Progress to a worker job", "use Search in the MCP server" and "add a Select for the database provider".
- **N3, reload check** (`tools/fresh-ui-browser/docs-tests/components.spec.ts:316`): the test now runs `await expect(page).toHaveURL(/[?&]preset=ns1_/)` before `page.reload()`. If `replaceState` breaks, the shared-link check fails instead of quietly testing a plain reload.

### Accepted by design
"How do I render a message?" with no other context routes to the `message` component. That is a reasonable answer to a question that names only the component, the same way bare "Search" routes to `search`. No action needed.

### Commands I ran
- `.llm/tools/run-deno-test.ts -- --allow-all --unstable-kv` on `component-guidance_test.ts`, `generate_test.ts` and the 9 guidance ranking suites (contract, corpus-load, evaluation, intent-regression, retrieval, terms, issue-2269, route-management, stream-retention): exit 0, 58 of 58 passed.
- An in-memory `deno eval` of 45 `findGuidance` probes. Every round-1 and round-2 negative, plus 10 new ones, stays off component pages, except the bare "render a message?" above. All 17 positives route correctly. Nothing was written to disk.
- I re-read the matcher delta and the N3 assertion. In round 2 I had already reviewed the builder fast path, the generator and the static closure, and the delta you describe leaves them unchanged.

### Not independently verified
I did not run any of these, so they are claimed only by the implementer:
- The full 248-test MCP/generator suite and the full browser suite (22 pass, 6 existing skips) on the final source; both are still rerunning on your side.
- Site build, rendered and freshness checks.
- The four carrier freshness checks, which still need the generated outputs committed first.
- Quality and architecture gates.

The full CLI runtime E2E remains **UNPROVEN** locally (the Aspire doctor fails because Docker is unavailable). This PASS is not a statement that remote CI is ready. READY still requires the required checks to be green or policy-skipped.
