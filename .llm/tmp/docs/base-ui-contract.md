# Extract: Base UI 1.0 Composition Contract

> Source: base-ui.com/react/handbook/composition, base-ui.com/react/utils/use-render
> Fetch date: 2026-06-11

## Key Facts

1. **Render prop / `useRender`**: Components accept `render` prop to override the default element. Custom component must forward `ref` and spread all received props.
2. **Prop merging**: `mergeProps` merges event handlers (all invoked), `className` (joined), `style` (joined). External props overwrite internal ones.
3. **State → data-* attributes**: `stateAttributesMapping` converts state properties to `data-*` attributes automatically.
4. **Composition**: `render` props can be nested deeply (Tooltip → Dialog → Menu → Button).
5. **TypeScript**: `useRender.ComponentProps` for public props (includes `render`); `useRender.ElementProps` for internal props.

## Implication for Plan D-1/D-4

- Base UI validates our direction: contract-first composition via data-attributes + prop merging is the modern standard.
- Our L0-as-contract (conventions + data-part/data-state) is MORE appropriate for Preact/Fresh than React-centric `render` props, because Preact JSX intrinsics are already fully typed and wrappers add indirection.
- The `data-scope="combobox"` + `data-part="trigger"` pattern from Zag/Base UI should be adopted as our standard vocabulary.
