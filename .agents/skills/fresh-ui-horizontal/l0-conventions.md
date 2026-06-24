# L0 Platform Contract

L0 is the platform contract for `@netscript/fresh-ui`: the rules every layer above it relies on. It
is imported package surface, not copy-source registry code.

## Purpose

L0 provides:

- the token consumption conventions (see also [`theme-authoring.md`](theme-authoring.md));
- the `data-part`, `data-state`, ARIA, and native-element rules;
- the motion rules;
- a deliberately small set of behavior primitives: `VisuallyHidden`, `SrOnly`, and `Show`.

L0 is not a wrapper library for HTML elements. Preact JSX intrinsics already provide typed platform
elements; a wrapper is added only when it encodes behavior or enforces an accessibility contract.

## Layer rules

| Layer                    | Ownership         | Import rule                                      |
| ------------------------ | ----------------- | ------------------------------------------------ |
| L0                       | package           | platform elements and Preact types only          |
| L1 (runtime)             | package           | may import L0                                    |
| L2 (registry components) | consumer (copied) | may import L0/L1; **must not import another L2** |
| L3 (registry blocks)     | consumer (copied) | may import L0–L2                                 |
| L4 (application)         | consumer          | anything                                         |

When two L2 items need the same thing: shared **behavior** moves down to L0/L1; shared
**composition** moves up to L3. This keeps every copied file independently deletable.

## Attribute contract

Interactive state is expressed with platform attributes, not classes:

- `data-part` names stable component parts (`data-part='content'`);
- `data-state` names visual state (`data-state='open'`);
- ARIA attributes describe accessibility state;
- event handlers, refs, and these attributes come from L1 prop getters.

L1 emits data attributes, ARIA attributes, refs, and handlers — it never emits `ns-*` component
classes. L0 and L2 may emit classes only where the class is part of the styling contract. Registry
CSS selects on `data-part`/`data-state` for runtime-driven styling and on `ns-*` classes for
copy-owned styling.

## Native-first rule

Prefer Web Platform behavior before adding JavaScript state:

- semantic elements first; native controls for forms;
- platform `dialog`, popover, and `details` behavior where available (Sheet and Dialog are
  `dialog`-backed; Popover/Tooltip use the Popover API and CSS anchor positioning with a CSS-only
  `position: fixed` fallback — no positioning polyfill);
- runtime code exists only for behavior the platform does not provide.

## Token rule

Component CSS and markup consume only the semantic vocabulary:

- CSS: `--ns-*` variables, optionally composed with `color-mix()`;
- markup: `*-ns-*` Tailwind utilities from the theme bridge;
- raw hex / `rgb()` / `hsl()` / `oklch()` literals and stock or arbitrary Tailwind color utilities
  are forbidden outside `registry/theme/`;
- documented exceptions carry a `ds-allow-raw-color` or `ds-allow-color-utility` marker on the
  offending line.

Enforced by the fitness gates `check-ds-no-raw-hex.ts` and `check-ds-color-utilities.ts` (workspace
`.llm/tools/fitness/`).

## Motion rule

Every animation declares its reduced-motion behavior:

- **infinite loops** (progress sweep, skeleton shimmer) become a static treatment under
  `prefers-reduced-motion: reduce`;
- **essential indicators** (spinner) keep animating but slow down;
- **one-shot enter/exit** animations with `fill-mode: forwards` collapse to
  `animation-duration: 0.01ms` so end states still apply — never `animation: none`, which would
  strip the fill-mode end state.

## Copy fidelity

Registry sources are the truth; copies installed into an app must be content-identical (compare with
`diff --strip-trailing-cr` — checkout line endings may differ). The only sanctioned divergence is
relative import depth in copied islands/components, which the CLI rewrites for the target layout.
Any other edit makes the file L4 code — fine, but it no longer reconciles against the registry.
