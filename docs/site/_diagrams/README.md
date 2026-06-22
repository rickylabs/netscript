# Diagram sources (`_diagrams/`)

Diagrams in the docs site are **committed static SVGs**, not client-side Mermaid
(locked decision OD1). This folder is the underscore-prefixed source-of-truth
that **Lume ignores** (it is never published).

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

The component emits `<figure><img …/><figcaption>…</figcaption></figure>`, so
the diagram is visible with JavaScript off and is a diffable asset in review.

## Render and check

Rendering is **not** part of `deno task build`. The published site depends only
on the committed SVGs under `assets/diagrams/`, keeping the build
dependency-free and offline-safe. The build does validate that every
`comp.diagram` reference points at an existing committed SVG.

The pinned renderer is `@mermaid-js/mermaid-cli@10.9.1`. Local and CI installs
should use the same pin:

```
npx --yes @mermaid-js/mermaid-cli@10.9.1 --version
```

To re-render after editing a `.mmd`:

```
deno task diagrams:render
```

To prove the committed SVGs match their Mermaid sources:

```
deno task diagrams:check
```

`render.ts` shells out to the pinned Mermaid CLI via `npx`. If that toolchain is
unavailable it prints instructions and exits non-zero; it never runs implicitly
inside the docs build.
