**Verdict: PASS**

The repair fixes both blockers, and I found no new ones in slice 2.

### Blocker 1 (the unrelated generic table) is fixed

- `docs/site/_config.ts:170` now skips any table that already has `ns-api-table`. Tables rendered by the `apiTable` component keep their own `data-variant`, whether generic or object.
- `docs/site/_config.ts:174-177` only marks a plain Markdown table as an API symbols table when at least one of its `Kind` cells is a recognised API kind. A table whose `Kind` column holds something else is left untouched.
- `tools/fresh-ui-browser/docs-tests/docs.spec.ts:721-726` visits the add-a-plugin page. It asserts that the "Official plugins" table keeps `data-variant="generic"` and has zero `.ns-api-kind` tags, so a regression would fail the test.

### Blocker 2 (the `component` kind) is fixed

- `.llm/runs/orch-divybot-6470427461--s8c/plan.md` now maps `component` to the syntax function role in both places: the slice 2 description (line 10) and the slice 6 final mapping (line 14). That mapping is now function/method/component → syntax function.
- `.llm/runs/orch-divybot-6470427461--s8c/drift.md:7` records where this came from: the real `component` rows (`Icon`, `DataGrid`, `RenderUiSurface`). It also states that slice 6's contrast and computed-role checks include `component`.

The rest of slice 2 is unchanged from my last review and still holds: names and signatures use the full text colour, each kind keeps its visible label, kind tags use only the approved intermediate status tokens, and the reference test checks this.

I haven't seen the post-repair build or browser rerun, so this verdict is based only on the source above.
