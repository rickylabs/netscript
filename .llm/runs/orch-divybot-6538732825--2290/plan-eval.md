# Independent PLAN-EVAL

**PLAN-EVAL, issue #2290 (feature tier, cycle 1)**

I checked the plan's semantics against the source. The 401 refusal still comes before any typed response, for anonymous callers, malformed credentials and the standalone-authz missing-principal case. Route precedence matches how requests are actually dispatched: active REST/RPC procedures, aliases, raw routes and internal guards are all checked before the retirement lookup. The research note is also right that `ProcedureIndex.claims` claims the whole RPC mount, so it can't be used for retirement. The new 404 doesn't reveal more to authenticated callers than the existing 403 messages already do. Adding an optional `code` to `AuthzDecision` is backwards compatible. Deferring parameterized retirement is safe, because the 404 already meets the acceptance criteria. The exact raw-path matching rules don't open a bypass: any encoding mismatch still ends in a denial. The research and design sections are present and current.

Two checklist boxes fail:

1. **Gate set selected — unchecked.**
   - The Archetype 2 row in `.llm/harness/gates/archetype-gate-matrix.md` lists **consumer import validation** as required. The plan doesn't name it.
   - Slice 1 edits the service README, `docs/site/reference/service/index.md` and `docs/site/tutorials/workspace/05-route-authz.md`, and adds root exports. The tests that check exactly those files aren't in the gate set:
     - `.llm/tools/docs/guarded-client-docs_test.ts` runs the tutorial's code blocks and checks its required text markers.
     - `packages/service/tests/_fixtures/readme-examples_test.ts` checks the README examples.
     - `deno task docs:exports-drift` compares the root exports with the reference page. The new constant and type would trip it.
     - `deno task docs:snippets` and `deno task docs:readme-fences` cover the edited code blocks.
   - The plan says it will "inspect CI state without waiting", so these can't be left to CI. The third acceptance item (the docs) has no gate that proves it.
   - **Fix:** add these gates, plus a named consumer-import check (for example the deps prod-install / publish-surface import), to slice 1's local gate list.

2. **jsr-audit planned surface — incomplete.**
   - The resolver hands the auth middleware only `ProcedurePolicyResolution` and `ProcedureAccessPolicy`, and both are exported from the package root and `./auth`. So the `retired?: true` tag in decision 3 lands on public surface unless it's kept internal (for example, by checking identity against a frozen internal policy object). The worklog's public-surface list leaves this out.
   - **Fix:** say where the marker lives. If it's public, list it on the planned surface with JSDoc/doc-lint coverage and state that the overlay authorizer's resolutions never carry it. If it's internal, say how authorization recognises it without changing the exported types.

Both fixes are edits to the plan only. Neither changes the locked design.

VERDICT: FAIL_PLAN
