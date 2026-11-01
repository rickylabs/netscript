# Restack7 dynamic selection marker — before framework correction

## 1. Public surface

Keep native DataGrid table/row semantics, caller tracks, selected background,
hover, checkbox, callback and marker roles. Replace only the selected row's
absolute pseudo-element rail with token-identical inset paint. No public prop,
contract, keyboard, event, ARIA or dependency change.

## 2. Domain vocabulary and observed failure

Visual review of the terminal320 cross-engine screenshots found the actual
Orders selection row misaligned in WebKit. A direct actual-renderer probe
measures144.21875px maximum cell x/width drift after selecting the row, while
computed columns still say subgrid. Header and unselected row retain their
tracks. Chromium/Firefox retain zero drift. Existing wide tests cover static
selected fixtures, and dynamic neutrality covers narrow layout; that is the
missing assertion, not evidence that the current source is ready.

## 3. Ports and prototype evidence

Use native CSS inset box-shadow, with existing --ns-space-0-5 and --ns-marker.
LTR uses a positive horizontal inset; :dir(rtl) uses its negative. No new token,
raw color, conditional browser rule or layout child. Native row backgrounds and
hover remain unchanged. A twelve-control actual-renderer probe compares three
engines and baseline/no-pseudo/gradient/shadow: only WebKit baseline drifts;
removing the pseudo and either paint candidate restores zero drift. Removing
all paint also removes the rail, so that control is not a positive solution.

The proposed inset paint additionally passes24 prototype cases: three engines,
light/dark390/1280 and LTR/RTL. Every case has zero geometric drift and exact
rail pixels over the declared width, with a different adjacent background pixel.
These are private injected prototypes, not final-source gate verdicts.

## 4. Constants and invariants

Preserve the marker's existing role, width and logical edge. Decode real row
screenshot PNGs through native createImageBitmap/Canvas for rail assertions,
using the existing marker color/width resolved on a valid body-level probe.
Do not insert a probe into TR. The prior invalid-span probe was independently
shown not to repair the bug; do not claim that it masked the failure.

Keep all old background/hover/native-checkbox/native-child assertions and the
0.75px geometry tolerance. Test the actual Orders composition with its host
selection callback, bulk actions, mixed fractional tracks and ActionMenu. Check
wide header/body x/width equality and before/selected/reset geometry; in narrow
layout compare identical cell content before/selected/reset. Cover both directions
at the actual project width, with no forced viewport or engine branch. Retain
Keyboard ownership counts and existing narrow marker checks, replacing their
pseudo implementation check with stronger actual-pixel proof.

## 5. Ordered source scope and gates

The fourteen-file restack footprint remains: change the existing CSS, canonical
CSS carrier and existing browser spec, not another component API or new file.
After design approval, add the regression first and prove that current unmodified
CSS fails the actual WebKit wide case. Then apply inset paint and regenerate
canonically. Run the focused selection cases in all three engines/schemes/widths,
plus a private missing-rail negative control. Run source/fixture/spec wrappers
with zero dropped files, fresh full package765 and fresh full667Chromium plus
320Firefox/WebKit on frozen final bytes, strict axe unchanged, zero retries/flaky.

The just-completed667Chromium/320cross and previous765package remain historical
before this production-CSS correction. Archive complete trees. They passed their
assertions but do not certify the uncovered dynamic-wide behavior. Do not reuse
them as a final-source execution after the paint change. Refresh broad source
gates, actual-head quality/publication, all carriers and same independent source/
evidence reviews before an exact-leased audited push.

## 6. Deferred scope

No token, native widget, browser preference, custom layout engine or global CSS
redesign. Main's later documentation advance remains the separate bounded base
addendum. Full Docs/Desktop, production extensions, all-style harness and final
runtime/whole-phase/exact-head CI still remain. No READY or early promotions.

## 7. Contributor path

Read this observed-failure checkpoint with restack7-source-summary.md. Public
proof retains counts and portable explanations; raw logs, coordinates per node,
images, evaluator transport and private prototype sources stay private.
