# Independent migration review

## Round1

**FAIL_FIX — one blocker.** The theme root, the legacy and modern hosts, design-preview isolation, ramps from the token output, the static script, the scaffold wiring and the axe delta all hold up. The only blocker is a CSS specificity bug that breaks button size and icon variants in every preset except NS One. I only read code, docs and the private logs; I ran nothing.

### Blocker: the new-language button rule overrides the small, large and icon variants
- **Where:** `packages/fresh-ui/registry/components/ui/button.css:160-164`. The selector `:root[data-theme]:not([data-theme='ns-one']):not([data-theme='light']):not([data-theme='dark']) .ns-btn` has specificity (0,6,0). The size variants at `:139-157` (`.ns-btn--sm`, `.ns-btn--lg`, `.ns-btn--icon`) are only (0,1,0), so the new rule always wins. In every new-language preset:
  - small and icon buttons get the full `--ns-component-button-height` as their minimum height, instead of a smaller one;
  - the variants' horizontal padding is replaced by `--ns-control-padding-x`;
  - `.ns-btn--icon`'s `gap: 0` is replaced by `--ns-control-gap`. The comment at `:154-155` says exactly this gap pushes the glyph about 4px off centre.
- **Where it shows:** the mobile sidebar trigger uses `ns-btn--ghost ns-btn--icon ns-btn--sm` (`registry/islands/SidebarToggle.tsx:73`). It renders in the Studio Utility layout at 390px, Utility is the target default, and every other new preset is affected the same way.
- **Why the gates missed it:**
  - `component-proof/` compares NS One specimens only, so it can't see this;
  - the browser matrix covers Utility only on `/design/tokens` (`tools/fresh-ui-browser/settings.ts:10`);
  - axe doesn't check geometry.
- **Fix:**
  1. Lower the preset rule's specificity, for example by wrapping the qualifier in `:where(...)`, so the variant classes win again. Alternatively, add matching variant rules in the same scope: small buttons use the existing `--ns-control-height-sm` role, and icon buttons stay square with `gap: 0`.
  2. Add a regression test that measures the computed height, padding and gap of a small icon button under one new-language preset. The existing Utility 390px case, which already renders `SidebarToggle`, is one place to do it. NS One results must not change.

### Verified and acceptable
- **One app-owned theme root.** `lib/theme.ts` reads the generated `tokens.json`, `theme-preset.json` and `fonts.json`. A requested preset is accepted only if it exists in the generated presets, and only under `/design/`. Every other route uses the configured preset, which is NS One by default.
  - The `(design)` middleware returns 404 outside development, so production never renders a preview.
  - Each design route builds its token model per request from the generated output, with no mutable module state, no token engine and no backend in the UI.
- **The shell and its script.** `_app.tsx` sets `data-theme` to the language, plus `data-scheme`, `data-density` and the optional `data-flavor`. It emits font links from `fonts.json`. The inline script is a static constant with no interpolated data.
- **The toggle.** `ThemeToggle` reads `data-scheme` first and falls back to a legacy `data-theme` of light or dark. It also updates `data-theme` on a legacy host but never overwrites a language value. The `ns-theme` storage key is unchanged, and the old `[data-theme='dark']` selectors remain in `tokens.css`, so app copies keep working without a `ui:migrate` step.
- **Scaffold wiring.** The new template is registered in the asset manifest and the template loader, and `write-app-files.ts:243` always writes it. Every design route and the layout import it. The fresh-app type check and the 29 CLI tests pass.
- **Ramps and captions.** Ramps come from the generated `ramps` and `allRamps` lists rather than a fixed table. Captions and the sidebar label follow the active preset.
- **Other components keep NS One's geometry.** The card and input preset rules use the same NS One exclusion and don't collide with any variant classes. NS One's computed styles and pixels match S0.
- **Axe delta.**

  | Case | Change |
  | --- | --- |
  | `/design/components` light, 1280 and 390 | Two stale warning-badge fingerprints lowered from 1 to 0 |
  | Four Studio Utility cases | Empty allowance maps (`axe-baseline.json:198-201`) |
  | Everything else | No other fingerprint changed; no new or increased serious or critical finding |

  The validator still matches individual nodes and fails on stale allowances (`accessibility.ts:8-38`), so no gate was weakened.
- **Full runtime gate.** You ran `scaffold.runtime` exactly once and reported it honestly as unproven, because Docker and Aspire aren't available on this host. No gate replaced it, and the leak report left the unknown-owner processes untouched. That matches what the assignment allows.

### Non-blocking
- For presets other than the default, the token model shows light-scheme values even in dark mode (`(_shared)/tokens.ts:64`). The swatches themselves render live, so only the printed values are affected.
- `/design?preset=` with no trailing slash ignores the preset because of the `startsWith('/design/')` check. Navigation links also drop the preview query.

I'll keep this session open for the fix round.

## Fix round

**PASS.** The button blocker is fixed. I read code and evidence only; I ran nothing. You can go ahead with the migration sign-off commit and push.

### What I verified
- **Variants win again** (`packages/fresh-ui/registry/components/ui/button.css:138-181`):
  - The preset qualifier is now wrapped in `:where(...)`, so the new-language default rule (`:140-144`) has the same specificity as a plain class (0,1,0).
  - That rule comes before `.ns-btn--sm`, `.ns-btn--lg` and `.ns-btn--icon` (`:146-164`), so the size variants override its padding and gap again.
  - Later rules, still under `:where`, set the new-language geometry:
    - small buttons use `--ns-control-height-sm` (`:167-169`);
    - icon buttons are square at `--ns-component-button-height` with zero padding and zero gap (`:171-176`);
    - small icon buttons are square at `--ns-control-height-sm` (`:178-181`). This is the only two-class rule, so it correctly beats the single-class icon rule.

  I traced the cascade for the mobile sidebar trigger (ghost, icon and small): it resolves to a small square with zero padding and zero gap.
- **NS One is untouched.** The qualifier still excludes `ns-one` and the legacy `light`/`dark` hosts, and the plain variant declarations are unchanged. The eight NS One specimen comparisons from the earlier pass still apply.
- **The regression test is real.** In both Studio Utility 390px cases, `tools/fresh-ui-browser/tests/design.spec.ts:64-91` measures the actual trigger button. It asserts the rendered width and height equal the computed `--ns-control-height-sm`, all four paddings are `0px`, and gap is `0px`. If the token were missing, the measured size wouldn't match the expected value and the test would fail, so it can't pass trivially.
- **The fix-round evidence matches.** The browser run shows 12 passed. The browser type check shows 7 files with 0 findings. The quality receipt is `PASS` with exit code 0 at the recorded parent. The axe cases are still only the two reviewed reductions plus the four Utility cases with no allowances. `slice-5-migration.md` has a section recording the fix round.

### Non-blocking
- Large icon buttons in new-language presets now render at the default icon size. That's acceptable, but nothing tests it.
- The two notes from the first round still stand: preview values for non-default presets are printed from the light scheme, and the `/design` index page with no trailing slash ignores the preview query.
- Update `slice-5-migration.md:3` from "review pending" to this PASS when you sign off.
- The full `scaffold.runtime` gate is still unproven on this host because Docker and Aspire aren't available. That is reported honestly, not claimed as a pass, and no gate was weakened.

This ends my slice reviews. The final IMPL-EVAL is a separate step after the migration slice is committed.
