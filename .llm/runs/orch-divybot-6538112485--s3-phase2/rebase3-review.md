PASS (third-rebase integration review, not the final IMPL-EVAL)

I found no blockers in what I could inspect. Three things can't be checked with read-only tools, and your separate gates have to settle them.

**Verified in the current tree:**

- **All 21 phase 2 components and the 2 support items** are in `registry.json`: Actions, Forms, Calendar/DatePicker, Navigation, Overlays, Item/Kbd/Collapsible, Chart/Carousel, plus `calendar-date` and `menu-items`. They match `POST_V1_COMPONENTS`/`POST_V1_SUPPORT`.
- **Themes:** all 24 `TOKEN_PRESETS` have their `theme-*` entries: 18 earlier presets plus the 6 Theme B additions from the second rebase. `theme-seed`, `theme-previews` and `theme-toggle` are intact.
- **Legacy guarantees are unchanged:**
  - `legacy-v1.json` is still compared exactly.
  - The only additive repair is `command-palette`.
  - The theme allowance comes from `TOKEN_PRESETS`.
  - The `theme-previews` historical-subset comparison and the separate full `PREVIEW_TOKEN_FILES` check are both still there.
  - The negative tests remain.
- **Dependency closure holds:** only the seven real runtime users declare the Fresh UI root dependency, and `render-ui` keeps its frozen dependencies.
- **No new token values or allowances in phase 2 files.** The phase 2 CSS still only references existing semantic properties. The AlertDialog destructive override uses existing tokens (and may simply be redundant if main's contrast fix covers it).

**Not verifiable with Read/Glob/Grep, so the gates must confirm:**

1. **The regenerated `packages/fresh-ui/registry.generated.ts`** is a base64 gzip carrier that can't be inspected as text. Whether it matches the combined sources has to come from `check:assets-barrel` and `registry:embed:check` passing at the rebased head.
2. **Whether main's contrast burn-down (`7ee9c3e`) and locked design renders (`538ccae`) survived** can't be confirmed without a diff against origin/main. This covers:
   - token sources (`tokens/**`, `contrast-pairs.json`);
   - shared component CSS, including the shared `floating.css` that phase 2 extended;
   - `tools/fresh-ui-browser/axe-baseline.json`.

   Before pushing, confirm that the rebased diff against `1d274c1` touches none of these except the intended phase 2 additions. Also confirm the existing gallery browser job and token/contrast checks pass unchanged.
3. **Record the outcomes in the public `rebase3-validation.json` evidence.**
