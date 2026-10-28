# Slice 1 review, round 1

**FAIL_FIX.** The resolver core is sound, but four of your review areas have real defects: the NS One gap rules, the preset maps, genuine DTCG values and the override layer. I only read files; I ran no gates and no generator.

### Blockers

1. **The NS One gap rule is broken in three ways.**
   - **Existing NS One values are overwritten.** The intent hover/text rule at `figma-token-source.ts:308-317` never checks whether NS One already defines the role. So `primary-hover` (legacy `copper-7`) becomes `{context.*.primary}` and `secondary-hover` (`slate-6`) becomes `secondary`, in both schemes (`presets.tokens.json:2976`, `:3004`, `:9865`). That breaks "old declarations stay unchanged."
   - **NS One picks up Studio values.** NS One is defined as `language('ns-one', 'Studio')` (`token-presets.ts:40`). Any core role that has no legacy value and no mapping keeps its Figma Studio / Neutral / Ink / Comfortable value. For example, NS One `text-body` is `Theme/type/body/size` in mode `Studio` (`presets.tokens.json:4364`). This affects:
     - every text, leading, weight and tracking role for body, caption, display, heading, kpi, kpi-sm, label, small, strong and title;
     - 12 of the 15 density roles, including `card-padding`, `badge-height` and `table-row-height`;
     - `accent-solid-hover`, `fg-subtle` and both `state-disabled-*` roles.
   - **Three map keys never apply.** `subtle-fg`, `disabled-container` and `disabled-fg` (`preset-role-map.ts:103,112-113`) don't match the Figma names `fg-subtle`, `state-disabled-container` and `state-disabled-fg`.
   - **Fix:** every NS One role outside the packs must either be a legacy role or alias an NS One role or primitive. Add a test that fails when any NS One context token carries Figma metadata, and one that checks the legacy declarations still equal `legacy.json`.

2. **Bloom and Liquid still inherit the shared Tonal and Glass values for `fg-subtle`.** Both overlays map `subtle-fg` (`preset-role-map.ts:18,60`), which is not a registered role. So `fg-subtle` keeps the shared-mode value, and an unregistered `subtle-fg` token appears in `presets.tokens.json` but not in the semantic tier. **Fix:** rename the key to `fg-subtle`, and make `alias()` throw when the name is not a registered role.

3. **The Terminal key tokens are not implemented.** `component.tokens.json` sets `key` to primary / primary-fg / input-border for every preset and scheme, and there is no Terminal map. Dark Terminal therefore renders the pale lime key that `terminal/DESIGN.md:394-398` rules out. **Fix:** add scheme-aware semantic key roles, defaulting to primary / primary-fg / input-border. Map Terminal dark to `muted` (fill), `primary-text` (text) and `input-border` (edge), and point the component `key` tokens at those roles.

4. **The `ease-*` tokens are not genuine DTCG values.** Their legacy values are transition shorthands, such as `"300ms cubic-bezier(0.34, 1.56, 0.64, 1)"`. `token-values.ts:66` types them as `duration` and keeps only the milliseconds. The easing curve survives only in `$extensions.netscript.css`. **Fix:** use a DTCG `transition` value (duration, delay `0ms`, cubicBezier timing, with `ease` as `[0.25, 0.1, 0.25, 1]`), or split each into a duration token plus a cubicBezier token.

5. **App overrides can create cycles and point at missing tokens.** `validateSemanticOverride` (`resolve-tokens.ts:104-117`) checks the tier, the name, the type and alias-only syntax. It does not check what the alias points to. So `semantic.primary: {semantic.primary}`, a two-token loop, or an unknown target all pass, although the plan says override validation rejects cycles. **Fix:** walk each override's alias chain over the merged document, reject cycles and unknown targets, and add negative tests for both.

6. **Four presets differ from the approved source table, and nothing records it.** Fluent, Brutal, Filigrane and Pixel use Neutral × Ink. The table says Neutral×Blue, Sand×Orange, Sand×Tomato and Sand×Orange. This changes an emitted value: `accent-solid-hover` comes from the Base accent collection (`base-accent.json:465`). **Fix:** follow the table, or record the deviation and its effect on `accent-solid-hover` in `drift.md` (PLAN-EVAL note 3 supports treating those columns as labels only).

### Non-blocking
- "All 72 inputs build" only proves the sources merge; no alias is resolved. A cheap extra test would check that every semantic alias target exists in all 36 preset × scheme contexts.
- Liquid's dark success text is a retyped `#71d083` literal. It should alias the Glass dark core `success-text` value so its provenance is kept.
- The node-role literals for Liquid, Bloom, Tonal and Cupertino carry no source metadata.
- Bloom's type mapping covers only body, heading and kpi; the other type roles keep Tonal values. Worth a note in the run artifacts.
- Fluent maps `primary-text` in addition to the "exact seven" aliases plus hover. Drop it or record it.

### Verified
- Each Figma alias hop resolves in its target collection's active mode. Cycles fail, and float rounding and SemiBold normalization are covered by tests.
- All seven Studio rows match the approved table.
- Bloom `ring` → `control-outline`; Cupertino `switch-thumb` plus its 24/26 radii; Liquid's exact radii and type sizes; Pixel bands; Fluent's seven aliases plus hover.
- The official schemas have the designtokens.org `$id`s and compile in separate Ajv instances. The malformed-dimension and bad-version controls fail as expected.
- The semantic tier is alias-only. Overrides keep their metadata and can't change type or leave the semantic tier.
- Unknown theme and density contexts are rejected. Each preset's density is fixed: comfortable and compact inputs give the same result.
- The lock's specifier map has only the two pinned entries, `npm:ajv@8.20.0` and `npm:colorjs.io@0.5.2`. I didn't diff the rest of the lock.

I'll keep this session open for the fix round and the later slices.

# Slice 1 review, round 2

**FAIL_FIX — one blocker left.** Five of the six original blockers are closed. NS One is closed except for one wrong mapping, which is the blocker below. This was a read-only review: I read the changed files and the tests, and spot-checked the generated sources.

### Remaining blocker: every NS One `leading-*` role is set to the same 24px
`applyLegacyGaps` sends every `leading-*` role to `text-2xl`, which is 1.5rem (`figma-token-source.ts:391`). The generated sources confirm it: `leading-body`, `leading-display` and `leading-kpi` all point to `{context.light.text-2xl}` (`presets.tokens.json:1022`, `:1054`, `:1094`). That pairs badly with the new NS One sizes:
- `text-display` is 36px and `text-kpi` is 30px, so their line height ends up smaller than the font size. Multi-line text in those roles would overlap.
- `text-caption` is 12px, so its line height becomes 2×.

The gap rule asks for an alias to an *appropriate* existing NS One value, not one font size reused for every line height. No current NS One declaration uses these roles yet, so there's no regression today. The problem shows up as soon as shared components adopt them under the default theme.

**Fix:** give each `leading-*` role its own alias to an existing NS One dimension that is at least as large as the paired text size. One option, using the legacy scale:

| Role | Text size | Line height | Ratio |
| --- | --- | --- | --- |
| caption | 12px | `text-lg` (18px) | 1.5 |
| small, label | 14px | `text-xl` or `space-5` (20px) | ≈1.43 |
| body, strong | 16px | `text-2xl` (24px) | 1.5 |
| heading, kpi-sm | 20px | `text-2xl` (24px) | 1.2 |
| title | 24px | `space-8` (32px) | ≈1.33 |
| kpi | 30px | `space-9` (36px) | 1.2 |
| display | 36px | `space-10` (40px) | ≈1.11 |

Then add a test that, for NS One, each resolved `leading-<role>` is at least its `text-<role>`.

### Closed
- **NS One:** legacy names are skipped, so `primary-hover` and `secondary-hover` keep their legacy values. Every other non-pack role maps to legacy vocabulary: type, tracking, density, `accent-solid-hover`, `fg-subtle` and `state-disabled-*`. A new test compares every legacy declaration and rejects any Figma metadata on NS One core roles. The font weights are lifted literals with a source description, which I accept, since 500/600 weights appear in the existing component CSS.
- **Bloom and Liquid overlays:** now map `fg-subtle`, and `alias()` throws on any unregistered role.
- **Terminal keys:** `terminal-key-*` is registered for every preset. Dark Terminal resolves to `muted` / `primary-text` / `input-border`, and `component.key` reads these roles (`component.tokens.json:480-517`). There is a test.
- **`ease-*` tokens:** now real `transition` values with duration, delay and cubicBezier. `ease` becomes `[0.25, 0.1, 0.25, 1]`, and the spring curve is kept and tested.
- **Override validation:** checks the whole merged alias graph and rejects unknown targets, self-cycles and two-token cycles, with tests for each.
- **Base gray × accent modes:** Fluent, Brutal, Filigrane and Pixel now match the approved table (`token-presets.ts:52-56`).

The non-blocking items from last round (Liquid provenance, node-literal descriptions, Bloom's own type scale) are addressed. Moving unchanged shared roles into `semantic.tokens.json` doesn't affect correctness, because the theme layer is applied after it and the alias-edge test covers all 72 inputs.

I'll keep this session open to re-check just the `leading` change.
