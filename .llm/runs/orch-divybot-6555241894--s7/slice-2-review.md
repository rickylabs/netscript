# Slice 2 independent review

Same read-only Opus 5.5 high evaluator; substantive sign-off after correction.

**Verdict: PASS.** The routing blocker is fixed, and there are no remaining blockers for slice 2.

**The fix**
- **Shortcut now needs an explicit marker:** `packages/mcp/src/domain/docs/component-guidance.ts:16` returns `undefined` unless the question contains one of: Fresh UI, component(s), prop(s), keyboard, shortcut(s), or `ui:add`. The bare-verb path is gone.
- **Ranking policy untouched:** questions without a marker fall through to the existing ranker, and `GUIDANCE_RANKING_POLICY` is unchanged.
- **Positive cases still route:** each of the four still contains a marker: "Fresh UI … component", "keyboard … props", "component", "props".
- **New negative cases:** `packages/mcp/tests/component-guidance_test.ts:74-89` checks the three questions I gave (pagination, progress, search). Their top result must not be a `design-system/components/*` page. That checks the actual outcome, so it would also catch the ranker itself putting a component page first.
- **Run results:** 36 PASS, exit 0, across this test and the four locked guidance suites. That figure is from your report; I didn't rerun them.

**Non-blocking**
- **Redundant guard:** `component-guidance.ts:15` is now unnecessary, because line 16 already covers it.
- **Remaining overlap:** "props" and "keyboard" still count as markers. So a question like "What props does the search option accept?" would route to the Search component page. That is narrow and arguably intended. If it comes up, the fix is to require an exact component title as well when the only marker is "props" or "keyboard".

Everything I checked in the first slice 2 review still holds: verbatim `get_doc` coverage, the xref and callout fixes, the isolatedDeclarations annotations, the `Deno.readDir` traversal, the attested CSS exemption, and the CI wiring.

Slice 3 is still to come: the CLI init/token/render proof, every root `check:*` task and docs gate, release preflight, the runtime attempt, and the final IMPL-EVAL.
