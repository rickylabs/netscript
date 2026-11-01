# Slice9b contract checkpoint — Resizable

1. Public surface: one Resizable registry component with direction horizontal(default)/vertical,
startContent/endContent slots, grip(defaulttrue), required label naming the primary panel,
optional labelledBy for a visible heading, controlled size or uncontrolled defaultSize
(default280horizontal/160vertical), onSizeChange(pixel proposal), minSize(default80),
maxSize(defaultInfinity), endMinSize(default80), step(default10), native root props/class.
Validate finite nonnegative sizes/minima, positive finite step, max finite or Infinity,
maxSize>=minSize, and nonblank fallback label. Changing direction resets active drag;
uncontrolled size remains caller-initialized, with bounds applied to rendered geometry.

2. Vocabulary: primary/start panel, secondary/end panel, available extent, bounded pixel
proposal, measured separator value and native pointer capture. Direction refers to panel
arrangement; separator ARIA orientation is the inverse. No collapse mode is promised.

3. Ports: Preact useId/state/ref/effect, native ResizeObserver, focus/key events and pointer
capture. Hosts own controlled state and child actions. No new drag dependency/backend.
Before hydration/positive measurement, render a static decorative handle (aria-hidden,
no role or value attributes, tabIndex-1). Once measured, expose the focusable APG separator
with primary panel aria-controls, matching label/labelledby, derived percentage min/max/now
and pixel aria-valuetext. Never invent a server-measured width. Both panels retain native
child controls; primary group carries the same accessible name as the separator.

4. Constants: closed direction axis, existing border/card/muted/ring/card-padding roles;
ledger defaults280/160; grip12x16 (rotated for vertical arrangement), actual10px Lucide
grip-vertical geometry and24px handle hit target. Add this one required shared glyph to
Icon paths/contract/fixtures, preserving source/license and exact equivalent circle paths.
No token values or dependency versions change. Installed item declares the existing FreshUI
package runtime dependency because it imports Icon from its public primitives subpath.

5. Commit/gates: under30sourcefiles across component/CSS, truthful L10/Z1 typed+JSON
contracts, Icon, registry/style/layout collection, explicit post-v1/install coverage,
contract fixtures, real browser fixtures/spec and contributor README. Strict checker
already selects resizable; no undeclared data attributes allowed. Test both axes/RTL,
Home/End/arrow bounds, controlled acceptance/refusal, actual pointer and touch capture,
parent resize/unmount cleanup, native child focus, required ARIA geometry and all grip
states. Install actual ui:add bytes then check/lint/SSR. Scoped wrappers plus quality/arch,
strict axe, Utility captures, publication/export-doc review for the new Icon member,
preflight/docs accuracy/carriers and independent source/evidence sign-off.

6. Deferred: collapse/Enter/F6 are outside this resize-only contract. The APG draft also
describes collapse, so document the subset explicitly; do not claim full collapse support.
No new native runtime process, token changes, framework drag layer or backend. All remaining
S3 units remain active. No source edits until checkpoint review. Source commit, carriers,
evidence/privacy push/comment before the next unit.

7. Contributor path: packages/fresh-ui/src/contracts/README.md documents the native resize
API/controlled units/hydration boundary, provider and meaningful browser proof.

## Bounds and geometry locked

Measure panel-group content extent minus its computed row/column gap (the border-width
token). Use a two-column/row grid with that gap and an absolutely positioned separator
centered on it, so the24px hit target does not consume panel space. Native logical insets
mirror the start panel in RTL. Reserve min(endMinSize,available/2) for the secondary;
maximumStart=min(maxSize,max(0,available-reserve));minimumStart=min(minSize,maximumStart).
Clamp displayed/proposed size to that interval. This adapts impossible tiny containers
without overflowing or reporting impossible ARIA bounds. Panel content min-size0/overflow
auto. Pointer gesture snapshots actual displayed size and physical coordinate; pointerID
capture owns moves/up/cancel/lostcapture. LTRRight/RTLLeft grow primary; verticalDown grows.
Home/End choose current bounds. Controlled callbacks propose values, but the visible size
stays parent-owned apart from necessary viewport clamping. ResizeObserver updates extent;
cleanup disconnects and releases only this handle's active capture.

## Research authority

[W3C APG splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)
was read directly: primary naming/controls, focusable separator and numeric values;
its example remains a draft. Resize-only keyboard scope remains the approved L10 map.
[Official Lucide grip geometry](https://github.com/lucide-icons/lucide/blob/main/icons/grip-vertical.svg)
was fetched from the source repository: six radius1 circles at x9/15,y5/12/19;
represent exactly as closed arc paths for the existing path-only Icon API.
Ledger-layout overrides spec grip size14->10; canonical review is review-resizable.png.
