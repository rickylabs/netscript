# Restack7 actual fixture controls — before contrast correction

## 1. Surface

Use the existing shipped Button in the new SharedTrackExamples header and row
action slots. Keep the same type=button semantics, labels and caller-owned action
content. No framework, token, contract, callback, query or keyboard changes.

## 2. Vocabulary

Native semantics and native widget paint are different. The new fixture's bare
buttons inherit native WebKit dark text on a light native widget background.
Axe correctly reports1.81contrast against the required4.5. The actual shipped
Button already supplies the Utility foreground/background roles.

## 3. Ports

Reuse the Button already imported and used by this fixture module. Render ghost
small Buttons for Sort name, Edit and the long action. They remain real buttons
in the same native table slots, with intrinsic widths wider than the empty
action header. No CSS injection, raw color, new dependency or fake style.

## 4. Invariants

Keep strict axe and zero allowances. Retain every geometry tolerance, query
reference, native control, selection and keyboard assertion. Do not add an
engine branch or filter. Only the new fixture controls change; existing Keyboard
ownership controls and Orders composition remain exact.

## 5. Scope and gates

One existing fixture file changes within the existing twelve-file source scope.
The previous query-focused run stopped32passed/1failed/3notrun on axe after the
new WebKit geometry cases passed. Archive it as a failure. Focused36 all-engine
cases must pass on the styled fixture before broad runs.

Because fixture bytes change, abandon the667 byte-identical composition as a
current-source verdict. Preserve it as historical only. Run a fresh full667
Chromium matrix, including all88data-table cases, and the full320Firefox/WebKit
set on the final fixture/spec. Source/fixture/spec wrappers0drop, strict axe0,
retries/flaky0. Package765 and broader source proofs retain unchanged framework
bytes; refresh actual-head quality/publication and all carriers after source
commit as already required. Same independent source/evidence reviews precede push.

## 6. Deferred scope

No production DataGrid or native widget policy change is justified by this new
fixture paint error. Full11b/12/13 remains required. No READY or early promotions.

## 7. Contributor path

The existing SharedTrackExamples uses the real component callers would use.
Record the contrast failure and correction here; raw axe output stays private.
