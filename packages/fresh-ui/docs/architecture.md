# Architecture

This document records package architecture decisions for `@netscript/fresh-ui`.

Archetype: 3

`packages/fresh-ui` is **Archetype 3 — Runtime/Behavior** with the frontend overlay. It owns
stateful interactive lifecycle behavior plus copy-source registry data, while preserving a small
imported public surface.

## ADR 0001: Tiered Interactivity And Zag Adoption

- **Status:** Accepted
- **Date:** 2026-06-12
- **Scope:** `packages/fresh-ui` runtime and registry component strategy

### Context

`@netscript/fresh-ui` ships two different frontend surfaces:

- imported runtime modules (`./interactive`, `./primitives`) that own reusable behavior;
- copy-source registry files that consumers own after `ui:add`.

The package already exposes a prop-getter contract shaped like Zag: hooks return element props,
stable `data-part` names, `data-state`, ARIA state, refs, and handlers. The open decision was
whether every interactive component should move to Zag or whether platform-backed components should
stay native.

### Evidence

Run 5c1 Slice 10 proved the Zag/Fresh integration path before this ADR:

- `npm:@zag-js/preact@1.41.2` and `npm:@zag-js/combobox@1.41.2` type-check in a Fresh 2 island.
- Direct Fresh SSR returned HTTP 200 with server-rendered combobox and listbox markup.
- The original Vite hydration blocker was Windows MAX_PATH in the deeply nested run directory, not a
  Zag, Fresh, Vite, Deno, or esbuild incompatibility.
- Short-path rehosting at `%TEMP%\zag-spike-5c1` proved hydrated interaction: typing opened the
  listbox, options were visible, clicking an option committed the value, `role=status` updated, the
  listbox closed, and the console was clean except for favicon 404.
- Root lock hygiene remained clean in the closeout proof.

Evidence files:

- `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike-evidence.md`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-hydration-evidence.md`
- `.llm/tmp/docs/zagjs-preact-api.md`

### Decision

`@netscript/fresh-ui` uses a tiered interactivity model:

- **Tier P: platform-backed behavior.** Keep native-backed components on Web Platform primitives
  when the platform carries the hard behavior correctly: `dialog`, `sheet`, `drawer`, `accordion`,
  `popover`, `tooltip`, and `tabs`.
- **Tier Z: Zag-backed behavior.** Adopt `@zag-js/preact` plus per-machine packages only for
  machine-class widgets where the Web Platform does not provide enough behavior: `combobox`, rich
  `select`, `menu`, `date-picker`, `tags-input`, `tree-view`, and custom `slider` cases where native
  range input is insufficient.
- **No new hand-rolled machines.** New complex widgets must use a proven upstream machine unless a
  component-specific ADR documents why the platform or Zag cannot satisfy the contract.

The existing seven native-backed components are not migrated to Zag as part of this decision. Their
public hook/component shapes stay stable, and their internal platform implementation remains the
preferred runtime until a browser-platform limitation is demonstrated with evidence.

### Consequences

- The package keeps zero-extra-runtime paths for platform components and avoids shipping Zag cost
  into every consumer.
- Future Tier Z components add only the machine packages they import; per-machine dependencies must
  be declared in the registry manifest so `ui:add` can update consumer `deno.json` imports.
- Tier Z islands must prove SSR, hydration, keyboard interaction, reduced-motion behavior where
  visual motion exists, and bundle impact before shipping.
- L1 runtime contracts continue to expose prop getters and `data-part`/`data-state` attributes so
  native-backed and Zag-backed components remain visually and ergonomically consistent.
