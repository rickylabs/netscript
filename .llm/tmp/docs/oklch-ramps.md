# Extract: OKLCH Ramp Derivation

> Source: evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl, oklch.com
> Fetch date: 2026-06-11

## Key Facts

1. **OKLCH axes**: `L` (perceived lightness, 0–1), `C` (chroma, 0–~0.37 for sRGB), `H` (hue angle, 0–360), `a` (opacity).
2. **Ramp generation**: Keep hue `H` constant, vary `L` in perceptually uniform steps (e.g., 0.05 increments), keep `C` at a safe sRGB value (~0.1–0.15 for most hues).
3. **Perceptual uniformity**: Unlike HSL, OKLCH lightness is consistent across hues — no unexpected contrast shifts.
4. **Gamut mapping**: Browsers render closest supported color for out-of-gamut OKLCH values. For design systems, keep chroma within sRGB-safe bounds unless targeting P3.
5. **CSS Color 5 relative colors**: `oklch(from var(--accent) calc(l + 0.1) c h)` for hover states.
6. **DTCG color object**: Can encode OKLCH as `{ "colorSpace": "oklch", "components": [L, C, H], "hex": "#fallback" }`.

## Implication for Plan D-3 Phase 2

- Phase 2 OKLCH ramp derivation: pick hue (e.g., copper = ~30°), set chroma ~0.12 (sRGB safe), generate 12 steps from L=0.05 to L=0.95.
- The DTCG source should use the color object format with `hex` fallback populated.
- SD v5 custom format can read OKLCH components and emit both `oklch()` and hex fallback in CSS.
- Phase 1 (hex parity) is mechanical transcription; phase 2 is a formula-driven replacement of the same token names.
