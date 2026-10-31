# Independent slice review — FAIL_FIX

**SLICE NOT APPROVED.** There is one blocking finding. Everything else in scope checks out.

## Blocking finding

**The darker NS One `--ns-destructive` makes dark-mode error text fail AA in the default theme, and the zero-failure report can't see it.**

- **Where:** `packages/fresh-ui/tokens/legacy.json` (`semantic.destructive` → `oklch(58% 0.165 28)`, rendered as `#c9493f`). That value carries through to `registry/theme/tokens.css` and `presets/ns-one.css`. NS One is the default theme: the two files have identical content.
- **Who uses it as text:** shipped components set `color: var(--ns-destructive)`, so the fill colour is used as a text colour:
  - `registry/components/ui/form-field.css:15,33` (error text and its icon)
  - `label.css:11` (the required-field asterisk)
  - `toast.css:87,128`
  - `alert-styles.css:88`
  - `markdown.css:191`
  - `badge.css:44`
- **Measured with the package's own contrast adapter, NS One dark:**

| Pair | Before (red-5 `#d9584c`) | Now (`#c9493f`) | AA minimum |
|---|---|---|---|
| On bg (gray-12) | 5.197 | 4.298 | 4.5 |
| On card (gray-10) | 4.553 | 3.766 | 4.5 |

  Light gets better (3.695 → 4.468) but still fails.
- **Why the report misses it:** `contrast-pairs.json` only checks `destructive-text` as text. That role now maps to red-5 in dark (5.19 on bg), but only `badge.css:69` actually uses it.
- **Why no token value can fix it:** in NS One dark, white text on the fill needs luminance ≤ 0.183, while the fill read as text on gray-12 needs ≥ 0.186. One value can't do both jobs.
- **This is inherited debt the slice made worse:** with the same uncovered use, other themes already fail too, e.g. tactile dark 3.53, brutal dark 3.33, studio-cloud dark card 3.95. NS One dark passed before this slice.

**Repair — pick one before sign-off:**
1. **Preferred, needs your approval** (the files are outside the recorded write surface): switch those component text uses to `var(--ns-destructive-text)`. Then add a check that fails if component CSS uses fill roles (`--ns-destructive`, `--ns-primary`, …) as `color:`, or add pairs that model that use. `destructive-text` reaches at least 5.19:1 in every theme and scheme, so this also clears the inherited failures above.
2. **If the scope stays tokens-only:** record the regression in `drift.md` with the ratios above, open a follow-up issue, and get your explicit acceptance. The PR and report must not claim no regression for the default theme.

## Checked and correct

- **Import is verbatim:** all 11 files in `tokens/figma/` are byte-identical to the export directory at `af775ddd318e130832a2288dd7a84205c07c480f`. The `provenance.json` SHA256 values match, PR and commit point to #2506, and the unchanged collections keep their hashes.
- **Inactive policy from #2500:**
  - An exemption needs an explicit annotation.
  - It only applies to disabled text roles (`state-disabled-*` or `*-disabled`) at a 4.5 threshold.
  - Exempt uses are still measured and still count toward the total.
  - An exemption can't use up a source exclusion.
  - Stale or unknown exemptions fail validation.
  - The new `exempt-active` negative control runs the real checker.
  - No component uses the 6 exempted roles.
- **Accent:** the `accent-fg/accent-solid-hover` pair is gone and the source role is kept. No component uses `accent-solid-hover`, and `accent-fg/accent-hover` is still checked.
- **Liquid:** the 3 invalid pairs on tinted-primary are replaced by one: `liquid-primary-fg/liquid-material-tinted-primary`, white on 0.94-alpha blue, which passes.
- **Other NS One changes:**
  - Primary and secondary hover now pass with near-black labels and are still darker than their base colours.
  - Ring and input-border meet 3:1.
  - Dark `destructive-text` maps to red-5.
- **Report and tests:** 0 failures and 0 exclusions across all 48 theme/scheme combinations, with 58 exempt uses (56 below AA). I ran `tests/tokens/contrast.test.ts` and `contrast-report.test.ts` through `run-deno-test.ts`: 9 passed, 0 failed, and the policy file was unchanged.
- **Contract and paths:** no new exports or ports. The type and report additions are additive. The run artifacts I read contain no absolute paths or session identifiers.

## Not blocking

- `legacy.json` / `tokens.css` now has bare `oklch()` semantic values with no hex fallback, unlike the primitives. The generated block later in the file sets hex values, so it works, but it doesn't match the existing style.
- `packages/fresh-ui/tokens/figma/README.md` is still untracked. Commit it so the copied export stays complete.
- New run files (`memory-gates.md`, `resource-verdict.json`, `runtime-verdict.md`) appeared while I was reviewing. I left them for the final IMPL-EVAL.
