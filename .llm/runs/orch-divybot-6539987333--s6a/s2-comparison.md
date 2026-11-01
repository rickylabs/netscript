# S2 comparison

Actual Chromium 153 captures use the shipped Preact components and registry CSS. Final frozen-source run: 114 fixtures, 542 state measurements, both schemes, 390/1280 viewports, plus RTL and reduced motion. All cases reran after the invalid/hover and label-font corrections. State assertions include settled hover paint, 2px ink focus, disabled opacity, all shipped button heights, and invalid borders through interaction. Source images live under the Figma handoff review directory; private comparison HTML places each matching PNG beside actual light/dark output. No screenshot dump is committed.

| Shipped component | Matching Figma PNG | Compared result and visible gaps |
| --- | --- | --- |
| button | actions/review-button.png | Sharp, flat controls; semantic variant fills; shipped sm/md/lg/icon sizes. Figma xs and link variant are unshipped. Fixture text in icon-size Button is intentionally wider than the icon square; IconButton has the actual hidden label. |
| icon-button | actions/review-icon-button.png | Square control; no depth or movement. Only md is shipped. |
| input | forms/review-input.png | 32px control, input border, ink focus, red invalid; disabled muted. Only md and native input anatomy shipped; Figma sm and leading/trailing wrapper icons deferred. |
| textarea | forms/review-textarea.png | Sharp input surface, resizable, same state palette. Content/line count differs from reference. |
| select | forms/review-select.png | Sharp native select, same input/focus/invalid palette. Native popup uses platform UI; Figma custom list anatomy is not this contract. |
| checkbox | forms/review-checkbox.png | 16px indicator, token radius; invalid persists when checked; ink focus. Native checked state is authoritative. |
| switch | forms/review-switch.png | Token 32×18 track/14 thumb, ink selected, invalid border, reversed thumb travel in RTL. Only md is shipped. Off thumb follows surface/card per spec; reference raster looks darker. |
| label | forms/review-label.png | Label font roles, required/error red. srOnly variant deliberately invisible. |
| field | forms/review-field.png | Label font roles, small helper/error text. Existing vertical anatomy retained. |
| search | forms/review-search.png | Input hairline and mono keycap. Existing search is a launcher button; editable search anatomy belongs to another contract. |
| dropzone | forms/review-dropzone.png | Sharp dashed card, ink focus/drag selection. Contract test fixture includes a second native file input as children to test its slot, visible in the gallery; the component's own picker stays hidden. |
| filter-form | layout/review-filter-form.png | Sharp hairline card, no elevation, existing fields/actions. Different fixture content and width. |

Fonts are requested through the preset font imports. Text, icon glyphs, fixture layout and browser rasterization differ from Figma; no numerical pixel-diff threshold is asserted. NS One comparison: 262 fixtures × 2 schemes, identical computed geometry/paint before and after this slice. Browser values come from native pseudo-classes, not invented data-state simulation.
