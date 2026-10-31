PASS (slice 7b: Chart and Carousel, not the final phase evaluation)

I found no blockers in these two components.

- **Chart (`chart.tsx`):**
  - **Validation:** it requires one to three series, and every data point needs one finite value per series; anything else throws.
  - **Scale:** the value range always includes zero. The area baseline sits at `y(0)`, so negative values and all-zero data draw correctly, and a single data point gets a centred marker.
  - **States:** loading (`role=status` skeleton plus `aria-busy`), empty (the existing EmptyState), hover (`hover` can also be forced for preview renders), and rest.
  - **Accessibility:** the SVG is one `role=img` with its own title and description. The hover cursor and tooltip are `aria-hidden` extras for pointer users. Every exact value is available without JavaScript through a native `details` with a captioned table using row and column headers. The `aria-label` axe flagged on an unroled `g` has been removed, not suppressed.
  - **Contract parts** match the D9 part list, including `series-1…3`, `area` and `line`, `cursor`, `tooltip`, `legend`, `data`/`data-trigger`/`table`, `skeleton` and `empty`.
- **Carousel (`carousel.tsx`):**
  - **No callback loops:** `select` exits early when the index doesn't change, so the scroll that `go` causes (instant `scrollBy`) resolves to the same slide.
  - **Slide-count changes** (`slides.length`/`orientation`) clamp the index once and call `onIndexChange` only when the clamp actually changes it.
  - **Resizing:** the ResizeObserver keeps the current slide aligned and is disconnected on cleanup.
  - **Boundary buttons** use `aria-disabled` with a guard on the current index, so focus stays on them at the first or last slide.
  - **Dots** have 8 px visible marks inside 24 px hit areas and mark the current slide with `aria-current`.
  - **Inert slides:** only the current slide is reachable after hydration, and all slides are reachable before it.
  - **Scrolling** is plain native overflow with scroll snap: no autoplay, no global listeners, no gesture code. The arrows mirror in right-to-left layouts, and vertical dots sit beside the viewport.
- **Registry:**
  - `chart` depends on `empty-state` and `skeleton`.
  - Both components are in `registry.json` and the reviewed additions list.

Non-blocking:

1. **Chart number formatting.** `TICK_FORMAT` uses `Intl.NumberFormat(undefined, …)` and the values use `toLocaleString()` with no locale. Server and client can format differently, which can change text during hydration. Consider a `locale` prop, as Calendar and DatePicker have.
2. **Carousel focus while swiping.** If a link inside the current slide has focus and the user swipes away, that slide becomes `inert` and the browser drops focus to `body`. A browser case for this, or a note, would make the behavior explicit.
