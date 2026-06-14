# Extract: Popover API + CSS Anchor Positioning

> Source: developer.mozilla.org/en-US/docs/Web/API/Popover_API, developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning, oddbird.net/2025/05/06/polyfill-updates/
> Fetch date: 2026-06-11

## Key Facts

1. **Popover API**: Baseline (Newly available, Jan 2025). All major browsers support `popover` attribute, `popovertarget`, `togglePopover()`, `showPopover()`, `hidePopover()`, `beforetoggle`/`toggle` events.
2. **Popover = always non-modal**. For modal, use `<dialog>`.
3. **Interest invokers** (hover/focus): `interestfor` attribute + `interest`/`loseinterest` events — for tooltip-like behavior without JS.
4. **Anchor positioning**: Chrome + Safari shipped; Firefox 145 behind flag (NOT Baseline yet).
5. **OddBird polyfill**: `@oddbird/css-anchor-positioning` v0.6.0 (May 2025). Supports `position-area` (all 50 keywords), `anchor()`, `anchor-size()`, `inside/outside` keywords.
6. **Polyfill size**: Built size was reduced by half in v0.5.0 (no exact KB given, but "half" implies ~tens of KB, not hundreds).
7. **Polyfill limitation**: Only affects elements/styles present when polyfill runs; dynamic content requires re-running. This is a known issue for React-like frameworks.
8. **@starting-style**: Used with `transition-behavior: allow-discrete` for popover entry/exit transitions.

## Implication for Plan D-2 / R2

- Popover API is safe for Tier P (Baseline).
- Anchor positioning is NOT safe without fallback (Firefox flag).
- OddBird polyfill is viable but has the dynamic-content caveat (Fresh partials may need care).
- **Decision**: For tooltips/popovers, use Popover API + anchor positioning with a CSS `position: fixed` + `inset` fallback for non-supporting browsers. The polyfill is optional debt; the CSS fallback is lighter and sufficient for the "degrade gracefully" requirement.
- `@starting-style` transition recipe is confirmed working for popover show/hide animations.
