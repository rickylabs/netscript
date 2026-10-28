# Slice 2 review, round 1

**FAIL_FIX.** The output engine, the CSS cascade and NS One compatibility are sound, and I'd sign off on them. Two defects in the Figma deliverables block sign-off: both put wrong data into files that ship from `registry/theme/figma/`. This was a read-only review: I ran no gates and relied on the evidence in `slice-2-output.md` for test, check and publish results.

### Blockers

**1. Figma preset collections export rem values as if they were pixels.**
- `figmaValue` takes `value.value` from a dimension and ignores its unit (`src/tokens/adapters/format-figma.ts:29-31`).
- The NS One legacy primitives keep `rem` as their unit (`token-values.ts`, `legacyPrimitive`). As a result, `1rem` becomes FLOAT `1` in Figma, where FLOAT means pixels. Example: `text-base` is `Light: 1, Dark: 1` instead of 16 (`registry/theme/figma/ns-one.json:8209-8216`).
- This affects every `text-*` and `space-*` legacy role and their aliases (for example `text-body` and `leading-*`) in all 18 `figma/<preset>.json` files. Every non-NS-One preset still carries those NS One legacy names, so all 18 are wrong.
- **Fix:** convert rem to px in `figmaValue`, using the 16px base that `legacyPrimitive` already assumes for `em`. Throw on any unit you don't recognise. Add a test that every FLOAT dimension in each preset collection equals the resolved value in px.

**2. The exported Studio flavor collection still points four width variables at color variables.**
- `name-migrations.json` renames four Studio dimension roles to `-width` because their original CSS name collides with a Scheme color.
- The round-trip output re-emits the snapshot unchanged (`figma-collections.ts:11-13`, `format-figma.ts:7-24`). So `table/cell-rule` (a FLOAT) still has `codeSyntax: "var(--ns-studio-table-cell-rule)"` (`registry/theme/figma/studio-flavor.json:2377`). In `tokens.css` that variable is the color.
- The same happens for `table/head-rule`, `table/row-rule` and `topbar/rule`. A designer importing this collection gets width variables bound to color CSS variables.
- The test at `tests/tokens/output.test.ts:113-125` asserts output equals the unmigrated snapshot, so it currently locks the defect in.
- **Fix:** leave `tokens/figma/*.json` untouched, but apply `name-migrations.json` to `codeSyntax` when writing the output. Change the test to compare against the snapshot with the migrations applied. Add a check that every exported `codeSyntax` names a registered CSS variable of a matching type (COLOR to a color, FLOAT to a dimension or number).

### Verified, not blocking
- **Engine:** each of the 72 inputs gets its own Style Dictionary instance, with `brokenReferences: 'throw'`, the source schemas validated and semantic+context checked as alias-only and acyclic. The 50 files come from registered SD formats, and `buildTokens` does no file IO (`style-dictionary.ts:36-158`).
- **Runtime isolation:** only `tokens.ts` and scripts import the engine; runtime UI entrypoints don't.
- **CSS and NS One:** the legacy CSS and bridge are emitted unchanged first. `:root` is NS One light, and the final `[data-theme='dark']` block is kept. There are 18 language blocks for light and dark, a bare `[data-theme='studio']` alias for Utility, and `[data-scheme='dark']:not([data-theme])` for NS One dark. The selector specificity works.
- **CSS values:** legacy declarations come through via `$extensions.netscript.css`, which the tests check per name in both schemes. No `color-mix` weights have float noise.
- **Overrides:** they propagate into components, mixes and shadow recipes, with a test.
- **Data files:** `tokens.json` keeps the legacy root fields and adds presets, inputs and source densities. `fonts.json` lists only Google Fonts families. The theme items and the manifest wiring agree.
- **Publishing:** `deno.json` publishes `tokens/**/*.json` and `registry/**/*.json`, and exports `./tokens`.

### Non-blocking notes
- **Hex fallbacks don't do anything:** each new color writes a hex declaration and then an oklch declaration for the same custom property. The later declaration always wins, regardless of browser support, so the hex adds bytes but never acts as a fallback (`format-css.ts:17`).
- **Scopes are dropped in preset collections:** they are emitted with `scopes: []` even for roles whose source variables carry scopes. Copying the source scopes would make the computed collections easier to use in Figma.
- **No `data-density` selectors in CSS:** this is consistent with each preset's fixed density, but the README and template work should describe the attribute as informational.
- **Hard-coded font weights:** `formatFontImports` fixes the weight lists for three mono families in code (`format-data.ts:77-83`). Consider moving them into data.
- **Type cast:** `figma-collections.ts:12` uses `as FigmaCollection[]`. Validating the snapshots would avoid the cast.

I'll keep this session open for the fix round and the CLI, checks and migration slices.

# Slice 2 review, fix round

**PASS.** Both earlier blockers are fixed. I'm signing off on the output slice. I only read code and generated files; the test results come from the evidence you submitted.

### Blocker 1 (rem values exported as pixels): fixed
- `figmaValue` now converts dimensions by unit (`src/tokens/adapters/format-figma.ts:42-46`):
  - px passes through unchanged;
  - rem is multiplied by the 16px contract;
  - any other unit throws.
- Durations are normalised to ms, and any unexpected scalar object throws (`format-figma.ts:47-52`).
- The generated file now has NS One `text-base` as `Light: 16, Dark: 16` (`registry/theme/figma/ns-one.json:8209-8216`).

### Blocker 2 (width variables bound to color CSS names): fixed
- `formatFigmaCollection` applies `name-migrations.json` to the emitted `codeSyntax` (`format-figma.ts:12-20`).
- It throws if a migration no longer matches the source syntax.
- The source snapshots under `tokens/figma/` are untouched.
- All four exported variables now point to the `-width` names (`registry/theme/figma/studio-flavor.json:2377, 2533, 2740, 3112`).

### Fallback rework: no regression found
- Base declarations now write the computed hex for oklch and `color-mix` colors; `var()` aliases are left as they were (`format-css.ts:27-36`).
- Two `@supports` blocks come last and repeat the same selectors with the native values (`format-css.ts:80-91`; `tokens.css:34749` and `:57212`). The same selector with the same specificity appearing later wins, so modern browsers get the native value and older ones keep the hex.
- The old S0 CSS is still the first part of the file.

### Non-blocking check for the browser slice
`[data-theme='dark']` and `:root` have equal specificity. Today `[data-theme='dark']` wins because its block comes last, both in the base declarations and inside each `@supports` block. That only holds while every NS One color is native (oklch or `color-mix`) in both schemes or in neither, which is true now because both schemes come from the same sources. If a token were ever native in light only, the light value would override `[data-theme='dark']` in modern browsers. A one-line test asserting that every NS One name is native in both schemes or neither would lock this in. Otherwise, the browser baseline will catch it.

The recorded non-blocking items stay recorded: empty scopes in the preset collections until a role-scope contract exists, and the snapshots treated as trusted pinned exports. I'll keep this session open for the name/contrast checks, CLI and migration slices.
