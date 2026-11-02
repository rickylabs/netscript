PASS (slice 7b follow-up, not the final phase evaluation)

Both non-blocking items are fixed, and I found no regressions.

- **Chart number formatting:**
  - `chart.tsx` now takes a `locale` prop defaulting to `en-US`, used the same way on server and client (lines 30-31 and 50).
  - Both formatters, plain and compact, are built from it in a `useMemo` keyed on `locale` (lines 54-59). No unlocalised `toLocaleString()` calls remain.
  - The D9 contract declares `locale` as text with default `en-US`.
- **Carousel focus while scrolling:**
  - `select` (`carousel.tsx:51-61`) now checks whether the outgoing slide contains the focused element. If it does, it moves focus to the scroll viewport with `preventScroll: true` before the slide becomes inert, so focus no longer drops to `body`.
  - Focus on the previous, next and dot buttons, or anywhere outside the carousel, is left alone.
  - The early exit when the index doesn't change, the clamping and the scroll alignment are unchanged, so there's still no callback loop.

On the tests, the SSR locale check, the locale-switch browser case and the wheel-scroll case that checks focus lands on the viewport cover these changes.

The browser wrapper refresh and the cropped screenshots are still outstanding. They don't change behavior, but the wrapper refresh still has to land.
