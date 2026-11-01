# Restack7 selected-surface contrast — before source correction

## 1. Public surface

Keep native table geometry, the approved inset rail, selection, callbacks and
all contract items. Make DataGrid-owned small column labels readable on selected
surfaces by composing80%of their existing muted foreground with20%of foreground.
Use the existing outline Button for caller-owned body actions in the DataGrid
browser fixture. No global Button or theme-token value changes are proposed.

## 2. Vocabulary and measured failure

The inset-source package suite passes765 and Chromium passes667, but full cross
fails171PASS/1FAIL/148notrun in light WebKit390: selected hovered labels have4.44
contrast against4.5. Explicit native row hover reproduces the failure in all
three engines. The issue is a selected surface; moving the pointer away would
hide the behavior from the gate and is not the correction.

A label-only private prototype fixes Orders but still leaves a caller ghost
Button below contrast on hovered selected Keyboard rows. Ghost rest deliberately
uses muted foreground; its own hover uses foreground. Outline uses foreground
in both states. The host chooses a variant suitable for its selected surface.

## 3. Ports and ownership

DataGrid paints only its own .ns-data-grid__cell-label. Reuse the same existing
role-composition pattern as contextual CodeBlock ink. Do not redefine a global
role, introduce a self-referential custom property, paint foreign component
classes from DataGrid, or change Button internals.

The fixture owns three body-Button expressions: Cell action, Row action and the
SharedTrackExamples Edit/long action. Change only their ghost variant to outline,
keeping small size, type, labels, handlers, position and native element. Sort
headers, bulk actions, Stats/Shell controls and inert adversarial content stay
unchanged. The prior condition about a failing ghost Button receives a separate
read-only Button/source ownership review in this same design continuation.

## 4. Constants and invariants

Existing --ns-muted-fg and --ns-fg,80/20contextual composition, no token writes.
Keep the fixed rail channel tolerance1, opposite-edge/missing-rail negatives,
0.75px geometry, all old background/hover/checkbox/keyboard/count assertions,
strict axe and zero allowances. No engine branch, browser preference or injected
CSS in the delivered tests. Private prototype injections are not final gates.

## 5. Ordered scope and proof

Fourteen source/carrier files remain. After independent design approval, add one
focused selected-surface accessibility regression to the existing spec first.
Use native Space to select/reset real Orders, Keyboard first and Keyboard custom
rows, in both directions at each actual project width. Audit nonhover and explicit
hover with the unchanged serious/critical axe threshold; verify row state,
checkbox and opened counters. Prove red on the current unmodified source.

Then apply only the own-label contextual rule and the three caller variant
changes, regenerate canonically and rebuild. Run focused60 cases and every24
axe-bearing WebKit case across light/dark390/1280 BEFORE broad matrices. Those
counts include the new contrast regression. Run fresh package765, full671
Chromium and328Firefox/WebKit on frozen final source with0retries/flaky and
unchanged strict axe. Refresh wrappers with0drop and broad source gates, then the
same source review, source commit, actual-head carriers/quality/publication and
same evidence review. The separately approved latest-base addendum follows its
required sequence. Each push requires the public audit and exact remote lease.

## 6. Deferrals

No token redesign, all-preset color certification, global Button restyling,
native bridge or event-policy rewrite. Current-scope final axe must be zero;
this is not a new waiver. Full Docs/Desktop, extensions/all-style harness and
final whole-phase/runtime/current-required-CI remain mandatory. No READY.

## 7. Contributor path

This checkpoint records the missing explicit-hover coverage and the boundary
between DataGrid-owned labels and caller-owned controls. Keep raw prototypes,
logs and screenshots private. The current source summary will report final
terminal counts and distinguish every historical run.


The completed actual-renderer prototype has raw exit0 and72audits:36baseline,
36candidate, across three engines, two schemes, two widths and three selected
row targets. All36candidate audits have zero serious/critical findings. This
uses private role composition and actual existing outline variant selection;
production source remains unchanged, so final-source gates are still pending.
