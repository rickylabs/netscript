# Extract: Adobe React Aria Patterns

> Source: react-spectrum.adobe.com/react-aria/
> Fetch date: 2026-06-11

## Key Facts

1. **Interaction model**: Press (not just click), focus visible, hover, keyboard navigation, typeahead, selection/collection model.
2. **Styling via data attributes**: `[data-pressed]`, `[data-selected]`, `[data-focus-visible]`, `[data-disabled]`, `[data-invalid]`.
3. **Form integration**: Components support `name`, `form`, validation states, `isRequired`, `isInvalid`.
4. **Accessibility**: ARIA Authoring Practices Guide compliance, extensive screen reader testing, mobile touch behavior normalization.
5. **Composition**: Context-based provider pattern (`ButtonContext.Provider`, `TextContext.Provider`) for custom patterns.

## Implication for Plan D-2

- Our Tier P components must honor the same interaction details: press vs click, focus visible, keyboard typeahead.
- The `data-focus-visible` (not `data-focus`) selector is the correct accessibility pattern for focus rings.
- Form integration (`name` prop, validation states) should be part of the L0 contract.
- These patterns are already largely present in Zag machines (which React Aria inspired); our hook contract should expose the same state attributes.
