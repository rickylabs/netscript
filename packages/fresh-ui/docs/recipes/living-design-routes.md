# Recipe: Living Design Routes

A consuming Fresh app should expose the installed design system on real app routes. These pages are
not marketing pages; they are validation surfaces for tokens, copied registry items, composition
rules, theme switching, reduced motion, and small viewport behavior.

## Routes

- `/design/tokens`: show the semantic token vocabulary and active theme values.
- `/design/components`: render every registry item, including style-only seams through nearby
  components that consume them.
- `/design/composition`: show layout objects, allowed composition patterns, and layer boundaries.

## Checks

Run browser validation against the real routes:

- HTTP 200 for every design route.
- No console errors.
- Theme flip in both directions.
- `390x844` viewport with no horizontal overflow.
- `prefers-reduced-motion: reduce` for routes containing animation.

The NetScript playground uses these routes as the proof surface for fresh-ui visual changes. Keep
examples operational and domain-real so regressions are visible without reading source.
