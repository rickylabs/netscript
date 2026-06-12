# Theme Authoring Contract

A theme is a complete assignment of the semantic `--ns-*` vocabulary,
delivered as CSS variable blocks for light and dark schemes. **NS One** is
the reference implementation, not a special case: anything NS One does, a
third-party theme may do differently, as long as the vocabulary is fully
assigned.

## What a theme must provide

1. **Every semantic slot.** Components assume the full vocabulary exists:
   surfaces (`--ns-bg`, `--ns-surface`, `--ns-surface-raised`, …), text
   (`--ns-fg`, `--ns-muted-fg`, …), borders (`--ns-border`,
   `--ns-border-hover`, `--ns-border-strong`), intent colors
   (`--ns-primary`, `--ns-secondary`, `--ns-success`, `--ns-warning`,
   `--ns-destructive` with their `*-fg` pairs), focus (`--ns-ring`), plus
   the non-color scales: `--ns-space-*`, `--ns-radius-*`, `--ns-font-*`,
   `--ns-shadow-*`. The authoritative list is `registry/theme/tokens.json`.
2. **A light and a dark block.** NS One scopes light on `:root` and dark on
   `[data-theme='dark']`. A theme may choose other scoping, but both schemes
   must be complete; components are never scheme-aware.
3. **Ramps as raw material.** Primitive ramps (`--ns-gray-1..12` and
   friends) belong to the theme. The theme maps ramps onto semantic slots.
   Components must not read ramps directly — the rare documented exceptions
   (for example a backdrop scrim) carry a `ds-allow-raw-color` /
   `ds-allow-color-utility` marker and survive theme swaps because every
   theme defines the same ramp names.
4. **The Tailwind bridge.** If the consuming app uses Tailwind v4, the theme
   ships a `theme-bridge.css` with an `@theme inline` block that maps the
   semantic vocabulary to `*-ns-*` utilities (`bg-ns-surface`,
   `text-ns-fg`, …). The bridge is mechanical: one utility per semantic
   slot, no extra opinions.

## How NS One is built

NS One is generated, not hand-written:

- Source: a DTCG token document (Style Dictionary v5 input).
- Build: `deno task tokens:build` (`scripts/build-tokens.ts`), with
  `deno task tokens:check` verifying artifacts are current.
- Outputs in `registry/theme/`:
  - `tokens.css` — light + dark variable blocks;
  - `theme-bridge.css` — Tailwind v4 `@theme inline` bridge;
  - `tokens.json` — the resolved token tree (the vocabulary contract);
  - `styles.css` — aggregator that imports the above.

Color ramps are authored in OKLCH with hex fallbacks, so the generated
artifacts legitimately contain raw color literals — `registry/theme/` is
the **only** place raw colors are allowed, and the fitness gates exclude it
for that reason.

## Authoring a new theme

1. Start from `registry/theme/tokens.json` to enumerate the required slots.
2. Either fork the DTCG source and rebuild, or hand-write a `tokens.css`
   that assigns every slot for both schemes. Generated is preferred —
   hand-written themes drift.
3. Keep the same scoping selectors as the app expects (`:root` +
   `[data-theme='dark']` for NetScript apps using the `theme-toggle`
   island).
4. Regenerate or copy the Tailwind bridge with your values. Utility names
   never change — only the values behind them.
5. Validate on the living reference routes (`/design/tokens`,
   `/design/components`): flip light/dark, check focus rings and disabled
   states, and run the reduced-motion and 390px passes. A theme that
   requires component changes is a broken theme — file the gap against the
   vocabulary instead.

## What a theme must NOT do

- Rename, add, or remove semantic slots (vocabulary changes are package
  API changes and go through the registry, not a theme).
- Style components directly (no `.ns-button` overrides inside theme files —
  themes assign variables only).
- Depend on a specific component's existence.
