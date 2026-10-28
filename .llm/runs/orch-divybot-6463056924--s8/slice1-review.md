# Slice 1 independent review

**Verdict: PASS** (slice 1: tokens and fonts)

I found no blockers.

### Checked
- **Alias contexts:** `resolveVariable` reads the mode from each alias's own target collection (`tools/docs-site/generate-tokens.ts:47-60`). The modes are Studio, Utility, Neutral, Ink and Compact, plus the Value mode for primitives (`generate-tokens.ts:15-22`), and Light or Dark per scheme (`:88`).
  - It fails on missing variables, missing modes and alias cycles, and the tests cover all three (`generate-tokens_test.ts:25-46`).
  - A test confirms the same alias resolves to `#ffffff` in Light and `#18181a` in Dark (`generate-tokens_test.ts:13-14`).
- **Units:** sizes, line heights, tracking and widths come out in px. Icon stroke and weights stay unitless (`--ns-studio-icon-stroke: 1.5`), and Figma weight names map to 400/500/700 (`generate-tokens.ts:63-74`). Every number in `docs/site/styles/tokens.css` has the right unit.
- **Names, and nothing typed by hand:**
  - Only variables with a valid `var(--ns-…)` code syntax are emitted, and anything else is rejected (`generate-tokens.ts:94-99`).
  - Other theme packs are filtered out (`:95`), and a test asserts no `--ns-fluent-` tokens leak through.
  - The output carries a "do not edit" header and comes only from the copied snapshot. The `--check` mode compares without writing (`:127-131`).
- **Values match the handoff in both schemes:** the brand red and error reds, the ink marker, ring and underline, the overlay at 40% / 66%, the 544px measure and 720px wide column, the input border and the code scrollbar thumb.
- **Light/Dark root:** the generated CSS starts with `:root, :root[data-scheme="light"]` and has a separate dark block (`tokens.css:5-6,273`). The `<html>` tag carries all six context attributes with Light as the default when JavaScript is off (`base.vto:2`).
- **Saved theme:** the old `ns-theme` key and its light/dark values carry over unchanged. Reads and writes are wrapped so blocked storage doesn't break anything, and the toggle now flips `data-scheme` (`base.vto:15-24,190-203`).
- **Fonts:** all three are self-hosted WOFF2 files with `font-display: swap` (`docs/site/styles/fonts.css`). Host Grotesk is one variable file covering weights 400–700, and Fragment Mono has normal and italic, which covers the italic code comments. Both OFL files are present with copyright lines and no Reserved Font Names, so subsetting is allowed.

### Not blocking: for slice 2 and IMPL-EVAL
1. **The live site looks broken until slice 2 lands.** `docs.css` still uses old tokens the new set no longer defines, such as `--ns-text-base` and `--ns-leading-normal` (`docs.css:40-41`). It also styles `[data-theme="light"]`, which no longer matches now that `data-theme` is always `studio` (`docs.css:31,650+`). Slice 2 should leave zero undefined `--ns-*` references and no `data-theme="light|dark"` selectors.
2. **Name collisions are dropped silently.** Three Studio flavor stroke widths (`topbar-rule`, `table-head-rule`, `table-row-rule`) share a code-syntax name with a Scheme colour, and the colour wins. That's intended and tested, but any future collision would also vanish without warning. Failing on collisions outside those three pairs would make it fail-closed.
3. **Wrong fallback fonts on two tokens.** The fallback is picked from the token name, so `--ns-font-label` and `--ns-font-data` end up as `"Host Grotesk", monospace` (`generate-tokens.ts:75-80`). Eyebrows should use `--ns-font-mono`, as the handoff says.
4. **One unusable dark pair from the source data.** In Dark, `--ns-ink` and `--ns-ink-fg` are both `#eeeeee`, so they must never be used together.
5. **Plan the slice 5 red-policy check around `tokens.css`.** The generated file legitimately includes red-ish values in non-error roles, for example `--ns-block-pink` is `#e54d2e` in Dark. The red policy should check where roles are used, not every declaration in the generated file.
