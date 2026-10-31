**Verdict: PASS (round 2), with three conditions that must be met before the token slice is signed off. The implementation evaluation will check them.**

The corrections appended to the plan resolve B1–B3. I checked them against the export and the code. No finding requires replanning. One type decision in the plan (C1) conflicts with the vendored DTCG schema, so it has to be settled before that slice is signed off. I read only the run files, the export and the token code. I made no edits and ran nothing.

## How B1–B3 and N1–N7 were resolved

- **B1 (code overriding Figma values): resolved.**
  - The plan removes `applyPresetOverlay` and `PRESET_ROLE_MAPS` (which covers bloom, liquid and fluent), keeps the legacy mapping for NS One only, and lets old pack-only names survive only when Figma exports no name of its own.
  - A test that every exported name equals its source value will catch any regression.
  - `shadow/x` exists in Theme set with `--ns-shadow-x` (`theme-set.json:2972`). That replaces the brutal-only special case and correctly gives Brutal 4 and Studio its flavor value.
- **B2 (chart surfaces undefined): resolved.**
  - Every surface the plan names exists in Scheme: `card-bg`, `card`, the four `cupertino-surface-*`, the five `liquid-surface-*`, and `fluent-solid-base`.
  - The foreground sets match the source's checking method (`variables-change.md:634-637`).
  - The plan states that faithful themes don't borrow the pack roles of the themes that inspired them. That fits the existing pack-ownership check in the contrast code.
- **B3 (preset settings and ids): resolved.**
  - All six new presets now have a full settings table, and the ids are unique against `studio-ledger` and `studio-signal`.
  - The four value changes for bloom, cupertino, liquid and terminal are recorded in `drift.md`.
  - Constants `FIGMA_THEME_SET` and `FIGMA_THEME_COLLECTIONS` drive `figmaModes`.
- **N1–N7: all covered.** The plan now defines when a faithful preset is eligible, adds the per-scheme contrast filter, lists every gate, guards against duplicate names, records provenance for exclusions and token metadata, and adds the constants.

## Conditions before the token slice is signed off

**C1. The planned type for `--ns-weight-em` is not valid DTCG.**
- The plan registers it as a "DTCG string font-style/weight descriptor". But the vendored `schemas/format.json:107-121` lists the allowed types (color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, strokeStyle, border, transition, shadow, gradient, typography), and there is no `string`. `tokens:validate` checks against that schema, so this would fail.
- The source makes this awkward. The `type/em/style` value is `Italic` in most modes, but Signal, Brutal and Terminal alias `type/body/style`, which is a weight. The other nine `--ns-weight-*` names are all `fontWeight` (`role-manifest.json:893-901`).
- **Fix:** the cleanest option follows the `-width` precedent, since code owns names: add a `name-migrations.json` entry that gives the style its own name, with a stated DTCG representation and a test. The alternative is to state a schema-valid encoding explicitly. Either way, record the decision in the worklog before coding the name, rather than inventing a type during implementation.

**C2. Several value changes are missing from `drift.md`.** Removing `applyPresetOverlay` also changes:
- all seven `studio-*` presets, because `primary`, `primary-hover` and `primary-fg` stop pointing at `studio-primary-*`;
- `fluent`, because its `PRESET_ROLE_MAPS` entry goes away;
- Brutal's shadow x;
- the Bloom and Liquid scalars, for example Bloom `radius-card` changes from 22 to 32.

These are correct under "Figma owns values", but they are public value changes and should be listed alongside the four id changes.

**C3. State the type contracts for the public API before coding.** `TokenPreset` is exported (`tokens.ts:31`), so its shape is part of the published `@netscript/fresh-ui` API. Before coding:
- say whether the new Theme set field is required or optional;
- update the doc comment on `themeMode` ("Active mode in the Figma Theme collection"), because for set B it holds a Theme B mode;
- make `TokenContrastPair.schemes` optional and additive, as planned;
- make the new token metadata fields (selected Theme set, theme collection, theme mode) additive and pass `deno doc --lint`.

## New gates this plan adds

On top of the gates already in the brief:
- a check that every exported name equals its source value, which guards against overlays;
- a check that reversing the collection order produces identical output, and that any duplicate name other than the Theme / Theme B / Theme set triple fails;
- validation of the new per-scheme filter on contrast pairs (unknown or empty values fail);
- negative controls that delete a chart or syntax pair, or weaken a threshold;
- exclusions regenerated from zero, with strict exact matching;
- a check that each faithful preset is eligible, reporting the actual result for all three;
- the token CSS bounds and the 6,000-byte gzip budget for default NS One CSS;
- the JSR audit and doc lint, with inherited findings reported separately;
- every root `check:*` task (including the review-threads check), regenerating the four carriers, and reverting `docs/site` `deno.lock` churn.

## Notes (not blocking)

- Put the exact paths of the failing-pairs report (JSON and Markdown) in `plan.md`, so the READY comment can cite them.
- Add a test that changing the inactive Theme collection's mode doesn't change the output. This proves the "declared default" rule.
