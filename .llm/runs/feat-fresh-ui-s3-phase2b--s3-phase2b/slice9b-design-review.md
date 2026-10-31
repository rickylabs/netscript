# Independent slice9b design review

PASS (slice 9b design checkpoint: Resizable)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9b-checkpoint.md`) covers all seven items concretely and stays inside approved decision 2 and the L10 contract. Implementation may start.

- **Public surface:**
  - `direction` (horizontal by default), `startContent`/`endContent`, `grip`, a required `label` with optional `labelledBy`, `size`/`defaultSize` with the ledger defaults of 280/160, `onSizeChange` as a pixel proposal, `minSize`/`maxSize`/`endMinSize`/`step`, and validated inputs.
  - Controlled refusal is real: the visible size stays with the parent.
  - It doesn't promise collapse, and the APG subset (resize only, no Enter/F6 collapse) is explicitly documented.
- **Hydration and ARIA:**
  - Before measurement, a static decorative handle (`aria-hidden`, no role or values, not focusable) avoids reporting a made-up server width.
  - Once measured, it becomes a focusable APG separator with `aria-controls` pointing at the primary panel, a label or labelledby matching the primary group, percentage min/max/now and a pixel `aria-valuetext`.
  - Its orientation is the inverse of the panel arrangement, which is correct.
- **Geometry and bounds:**
  - A grid with a token-width gap, and an absolutely positioned 24 px hit target, so the handle doesn't take panel space.
  - Logical insets mirror the layout in RTL.
  - The end panel is guaranteed `min(endMinSize, available/2)`, and the start size is clamped into `[min(minSize, max), min(maxSize, available − reserve)]`. Tiny containers can't overflow or report impossible ARIA bounds.
- **Input:**
  - Pointer capture is per pointer ID and handles move, up, cancel and lost capture.
  - Drags work from a snapshot of the displayed size.
  - Arrow keys follow the visual direction (in RTL, Left grows the start panel), and Home/End go to the current bounds.
  - Cleanup disconnects the ResizeObserver and releases only this handle's own capture.
- **Icon and registry:**
  - The `grip-vertical` glyph is the real Lucide geometry (six radius-1 circles drawn as closed arc paths), keeping the notice and adding it to the Z1 icon contract.
  - The item declares the existing root runtime dependency because it imports from `primitives`.
- **Gates:** under 30 files, the strict checker already covers `resizable`, a real `ui:add` install with check, lint and SSR, both axes and RTL, controlled acceptance and refusal, real pointer and touch input, resize and unmount cleanup, child focus, strict axe, Utility captures, publication and export-doc review for the new Icon member, preflight and docs accuracy, and the carriers.

**Implementation risks to watch (advice only):**

1. **Touch dragging.** Set `touch-action: none` on the active separator or handle. Without it, touch browsers start a pan or scroll and send `pointercancel` before capture takes effect. The touch test should prove a drag, not just a tap.
2. **The `Infinity` default can't go in JSON.** Don't put `default: Infinity` in the typed L10 contract. `contracts.json` turns it into `null`, so the lossless round-trip test fails. Leave the default out and describe it ("unbounded") instead.
3. **No undeclared state attributes.** The strict checker rejects anything beyond L10's canonical axes. Don't add `data-dragging`, `data-state` or similar unless that axis goes into the L10 contract first. Prefer `:focus-visible`, `:hover` and `:active` for styling.
4. **Single source for the accessible name.** If `labelledBy` is given, use it for both the separator and the primary group, and still require a non-blank `label` as the fallback, as you've specified. Test that both elements end up with the same accessible name.
5. **Bounds when the container resizes.** When it shrinks below the current size, clamp the displayed size without calling `onSizeChange`, so a controlled parent isn't asked to accept a geometry-only change. Document whether the size is re-proposed on the next interaction.
