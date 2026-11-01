# Restack7 selection-precondition refinement — before spec edit

## 1. Public surface

Keep DataGrid body activation, native selection and child controls unchanged.
The existing double-click regression keeps every original assertion: selecting
First activates once; a later body click activates once more. Explicitly establish
that the selected range has been cleared by a real physical click before testing
that later ordinary body activation.

## 2. Vocabulary and measured cause

WebKit's fresh single click has detail1, not a triple-click. During click dispatch
it still exposes the earlier selected range; it collapses that range afterward.
The existing row guard correctly preserves a noncollapsed range during dispatch.
Chromium/Firefox expose the already-collapsed range during that click. The first
cross run passed175 then failed this older expectation, with144notrun. No product
failure is inferred from a test that omitted its selection-clear precondition.

## 3. Ports and native proof

Use only actual pointer clicks and the existing Selection API observation.
Twelve direct controls cover all3 engines, both schemes and390/1280. Each
double-click selects First and activates once; clicking the existing page heading
physically clears selection without activating the row; the original body click
then activates exactly once. All12 pass. Portable result is in
restack7-selection-control.json; native event-order diagnostics remain private.

## 4. Constants and invariants

Insert one native heading click, assert selection.isCollapsed and that Rows opened
is still1, then retain the original cell.click and expected2. Keep the original
double-click, selected-text and first-activation assertions. No browser branch,
sleep, retry, synthetic event, removeAllRanges, callback/range timing workaround,
key mapping or production edit. The product continues to protect active text
selection. This is an explicit test precondition, not a native-policy override.

## 5. Commit and gates

One existing data-table spec changes after the current immutable-source Chromium
matrix is terminal. Scoped check/lint/fmt0drop and a focused12case run under the
actual checked-in trace settings prove the final procedure in every engine/
scheme/width. Rerun the complete320targeted Firefox/WebKit set on that spec.

The ongoing667Chromium run keeps its original source and must finish before the
spec changes. If it passes, propose retaining it as explicitly predecessor
rendered-source proof: every component/CSS/fixture byte is identical, all other
test bodies are unchanged and the modified case is proved by the12focused final
runs including all4Chromium projects. Do not claim the667 ran after the procedure
change. The same evaluator must approve this evidence composition. If it requires
a fresh full667 run, execute it. The full final phase13 merge gate remains required.
Full package765 and broader proof stay valid through unchanged production bytes.
Same source and committed-source evidence reviews remain mandatory before push.

## 6. Deferred scope

No new component-runtime or keyboard policy belongs to this test refinement.
No assertion waiver or Native Desktop success claim. Full11b/12/13 still required,
with declared x extensions and immutable base contracts; no READY or early nineteen
promotions.

## 7. Contributor path

The existing test explains the native selection-clear precondition next to the
physical click. Keep all behavior in the existing DataGrid and its actual browser
fixture. Raw logs stay private; the run records portable verdicts/counts.
