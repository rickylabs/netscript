# Extract: @zag-js/preact API + Contract

> Source: zagjs.com/overview/introduction, zagjs.com/components/react/combobox, npmjs.com/package/@zag-js/preact
> Fetch date: 2026-06-11

## Key Facts

1. **@zag-js/preact v1.41.2 exists**, actively published (same monorepo as react/vue/svelte), 119 versions, 4 dependencies.
2. Zag architecture: `machine` (behavior logic) + `connect` (maps to JSX props) + `collection` (for listbox/combobox) per component.
3. Framework adapters provide `useMachine(machine, props)` + `normalizeProps`.
4. **SSR**: Zag machines are framework-agnostic statecharts; the adapter handles hydration. No explicit SSR notes on the site, but statechart-based machines are inherently SSR-safe (no DOM refs in machine logic).
5. **Per-machine packaging**: Each component is its own npm package (`@zag-js/combobox`, `@zag-js/popover`, etc.). This means tree-shaking is automatic; only imported machines bundle.
6. **Prop-getter contract** (from combobox example): `api.getRootProps()`, `api.getLabelProps()`, `api.getControlProps()`, `api.getInputProps()`, `api.getTriggerProps()`, `api.getPositionerProps()`, `api.getContentProps()`, `api.getItemProps({ item })`.
7. **Data attributes**: `data-part="root|label|control|input|trigger|content|item"`, `data-state="open|closed"`, `data-highlighted`, `data-disabled`, `data-invalid`, `data-focus`, `data-scope="combobox"`.
8. **Accessibility**: Full WAI-ARIA compliance, keyboard interactions documented per component.

## Implication for Plan D-2

- `@zag-js/preact` is real, current, and the API shape (`useMachine` + `connect` + `normalizeProps`) maps cleanly to a Fresh island.
- Per-machine packaging means the bundle cost is scoped to the machines imported; combobox is ~one package.
- The `data-part`/`data-state` vocabulary ALIGNS with our existing fresh-ui contract (getTriggerProps/getContentProps, data-part/data-state).
- **SSR risk is low**: statecharts don't touch DOM until connected. The spike slice (run 1, slice 10) should confirm Fresh island hydration works.
