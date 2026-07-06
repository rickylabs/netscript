# NS One — NetScript design system ({{PKG}})

This design system is a 1:1 React-compiled sync of `@netscript/fresh-ui`'s copy-source registry.
Every component here exists as real, shipped Preact/Fresh source in the NetScript framework; the
canvas build only swaps the JSX runtime. Treat this document plus each card's `*.prompt.md` and
`*.tsx` as the prop-contract truth.

## Runtime contract on the canvas

- `_ds_bundle.js` exposes `window.React`, `window.ReactDOM`, and `window.{{GLOBAL_NAME}}` — every
  component is a property of `{{GLOBAL_NAME}}` (e.g. `{{GLOBAL_NAME}}.Badge`).
- Components accept `class` (not `className`) — they are Preact-authored; React passes `class`
  through to the DOM. Keep using `class` in prototypes so markup round-trips to Fresh unchanged.
- `_ds_bundle.css` is the full style closure: design tokens, base rules, layout objects, and every
  component's CSS. `styles.css` loads the DM Sans / DM Mono fonts.
- Preview stories live in `window.__dsPreview` per card; `?story=<Export>` renders one story.

## Layer ladder (shared with fresh-ui)

- **L0 tokens** — semantic `--ns-*` custom properties (`--ns-bg/fg/surface/card/border/muted`,
  intents `primary/accent/destructive/success/warning`, scales `--ns-space-*`, `--ns-radius-*`,
  `--ns-text-*`, fonts `--ns-font-sans` = DM Sans, `--ns-font-mono` = DM Mono).
- **L2 components** — emit semantic `ns-*` classes (BEM-ish variants: `ns-btn--primary`,
  `ns-badge--success`, …). Never import another L2 component.
- **L3 blocks** — page-level compositions (sidebar shells, page headers, stats grids).
- Layout objects from `layouts.css`: `.ns-stack`, `.ns-cluster`, `.ns-grid--*`, `.ns-split`,
  `.ns-toolbar`, `.ns-switcher`, `.ns-shell`, `.ns-section`, `.ns-sidebar`, `.ns-topbar`.

## Hard rules for new canvas work

1. **Theme-blind components**: style only via `--ns-*` vars and `ns-*` classes. Never raw hex, never
   a gray-ramp step directly — derive with `color-mix()` if a shade is missing.
2. **Light is the unthemed default** (warm cream brand look); dark is `[data-theme='dark']` on the
   root. Every screen must be designed in both.
3. State via `data-part` / `data-state` / `aria-*` attributes, native elements first (`<select>`,
   `<dialog>`, `<details>`) before invented JS state.
4. New components you invent on the canvas must follow the same class contract (`ns-<block>`,
   `ns-<block>--<variant>`, `ns-<block>__<part>`) and token vocabulary — they will be synced back
   into fresh-ui source from your markup and CSS.
5. Charts and data visualizations: token-driven colors only (`var(--ns-primary)`, intent colors),
   never hardcoded palettes.

## Where the truth lives

- `components/<group>/<Name>/<Name>.tsx` — the real converted source (typed props included).
- `components/<group>/<Name>/<Name>.prompt.md` — distilled usage: description, props, class set.
- This file — global conventions and rules.
