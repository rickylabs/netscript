# Diagram sources (`_diagrams/`)

Diagrams in the docs site are **committed static SVGs**, not client-side Mermaid
(locked decision OD1). This folder is the underscore-prefixed source-of-truth that
**Lume ignores** (it is never published).

## How it works

1. Author a diagram as a Mermaid source here: `_diagrams/<name>.mmd`.
2. Render it to a committed SVG: `assets/diagrams/<name>.svg`.
3. Reference it from a page with the component:

   ```
   {{ comp.diagram({
        src: "/assets/diagrams/<name>.svg",
        alt: "concise description for screen readers",
        caption: "short visible caption"
      }) }}
   ```

The component emits `<figure><img …/><figcaption>…</figcaption></figure>`, so the
diagram is visible with JavaScript off and is a diffable asset in review.

## Rendering is a SEPARATE dev step

Rendering is **not** part of `deno task build`. The published site depends only on
the committed SVGs under `assets/diagrams/`, keeping the build dependency-free and
offline-safe. To (re)render after editing a `.mmd`:

```
deno run -A docs/site/_diagrams/render.ts
```

`render.ts` shells out to `@mermaid-js/mermaid-cli` (`mmdc`) via `npx`. If that
toolchain is unavailable it prints instructions and exits non-zero — it never
breaks the site build.

> The sample `request-lifecycle.svg` shipped here is hand-authored (theme-neutral
> mid-tone strokes that read on both light and dark) to prove the pipeline without
> requiring the renderer to be installed.
