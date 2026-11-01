# Restack7 native query precision — before geometry spec refinement

## 1. Public surface

Keep DataGrid CSS, native elements, breakpoints and all other production bytes
unchanged. The existing wide rule width >640px exactly complements max-width640px.
The geometry tests must check the mode the native engine actually evaluates,
while never deriving their expected mode from the component under test.

## 2. Vocabulary and measured cause

At physical widths640.25/640.5/640.75, WebKit's native container queries choose the
narrow mode; Chromium/Firefox choose wide. Both queries partition every tested
width exactly once in every engine. At641 and900 all choose wide, and at640 or
below all choose narrow. Waiting two native animation frames does not change it.
This is native query precision, not missing CSS or a timing race.

## 3. Independent primitive reference

Twenty-one controls cover3engines and7boundary widths. A separate bare CSS
container, with its own name and selectors unrelated to DataGrid, measures the
two native queries. Exactly one marker is active in every case, and the actual
component table mode matches it in all21. Native narrow cases fit their viewport,
including fixed-width fixtures. Raw geometry/traces stay private; portable counts
are in restack7-query-control.json. No new production defect is established.

The spec may create a temporary, hidden, aria-hidden native query reference in
the host document; it must remove both its element and style in finally. It owns
no component data-scope/part, registry style or provider. A local helper in this
existing spec is test-only and has no module-load side effects. Expected mode
comes only from this independent primitive, then asserts the component matches.

## 4. Invariants

Assert exactly one query is active; widths<=640 are narrow and>=641 are wide.
At actual wide widths, retain every cell boundary/content-start, fixed-width
overflow, native control and selected-marker assertion with the same0.75px limit.
Add641 explicitly, so all engines exercise wide alignment near the boundary.
Fractional cases remain640.25/640.5/640.75; none may be skipped.

At native narrow widths, assert stacked data cells, equal selected/unselected
cell geometry, visible native header/selection controls and no horizontal overflow.
For empty/loading cases, assert full row content width after native padding;
wide cases keep their existing full-track overflow and complete status span.
The existing explicit640px narrow test stays. Keep native keys, roles and axe.

No UA/engine branch, breakpoint or production rewrite, tolerance increase,
arbitrary sleep, retry or forced layout mode. The reference must fail if neither/
both modes apply or component CSS selects a mode different from the primitive.
A broken component cannot self-select an easier assertion branch.

## 5. Scope and gates

Only the existing data-table spec changes. All original selection/activation,
native table and drag-selection cases remain; the native query helper is used
only by the two new geometry cases. File hooks and other test bodies stay exact.
Focused final36case runs cover the three refined cases(selection plus two
geometry tests) in all3engines×2schemes×2widths, under actual default trace settings.
Then run full320targetedFirefox/WebKit to terminal and scoped wrappers0drop.

Propose extending the approved667 predecessor evidence composition to these
three test bodies plus one side-effect-free local helper. Every component/CSS/
fixture byte remains identical; all other case bodies/hooks are exact. The final
focused36 includes all12changed Chromium executions. Label667 as predecessor spec,
identical rendered source; never claim it ran after these test refinements.
If the evaluator requires a fresh full667, run it. Phase13 full final matrix remains
mandatory. Full765 package and broader gates retain unchanged-production proof.
Same source/evidence reviews and committed-source checks still precede push.

## 6. Deferred scope

No production fix, native query replacement or false wide-at640.5 claim is justified.
No assertion waiver or registered alternate style. Full11b/12/13 and the owner
declared-extension/base-contract rules remain required; no READY or early promotions.

## 7. Contributor path

Keep the independent native reference and its explanation in the existing
data-table spec. Document native precision and exact evidence scope in this run.
Raw receipts stay private and public reports stay portable and repo-relative.

## Narrow selection comparison isolates the same content

Native narrow action slots remain caller-owned auto tracks. In all3engines the
short Edit action and the long activity action have different intrinsic widths,
so comparing the complete cell rectangles of those two different-content rows
would test content equality rather than selection neutrality. Actual narrow
measurements show this difference in every engine, with or without the selected
paint. Do not force those slots to a new fixed width.

For each narrow boundary, prove selection neutrality on the existing live
Keyboard ownership fixture: measure the same row, use its real checkbox/Space
with the existing accepting state callback to select it, and remeasure identical
cell rectangles/content starts. Reset through the same control. Three native
controls already show exact equality before/after selection in all engines.
This keeps fixture and production bytes unchanged. The five geometry fixtures
still each require stacking, visible header controls and no horizontal overflow;
their per-row logical first-content start and final action edge remain aligned.
Wide cases retain complete cross-row/header geometry equality.
