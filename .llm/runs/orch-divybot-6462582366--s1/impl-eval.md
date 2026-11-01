# IMPL-EVAL

## Round1

**Verdict: FAIL_FIX.** There is one blocker. Everything else in your checkpoint list holds up on inspection.

## Blocker: every app ships the token CSS for all 18 presets, which makes its stylesheet about 180× bigger

- **Where:**
  - `packages/fresh-ui/src/tokens/adapters/format-css.ts:39-93`. `formatTokensCss` writes every preset and scheme into one file:
    - the legacy fixture;
    - `:root`, holding the full selected preset;
    - 36 attribute blocks, each with about 903 declarations;
    - a final `[data-theme='dark']` block;
    - then the same selectors again in two `@supports` copies.
  - `style-dictionary.ts:97` uses that format for every build, including the CLI app build, since `tokens.css` is in `APP_TOKEN_FILES` (`token-output.ts:65-71`).
  - The committed `registry/theme/tokens.css` is about 57,500 lines with 56,919 `--ns-` declarations. The `@supports` blocks start at lines 34749 and 57212, and every primitive ramp is declared again in each of the 36 blocks. That is roughly 2 MB of CSS, against about 310 declarations in S0.
  - `registry/theme/styles.css:2` imports this file on every page.
  - All 18 items in `theme-items.json` install that same file, including the NS One default. An app on one preset therefore downloads and parses render-blocking CSS for 18 presets × 2 schemes.
- **Why it blocks:** the owner ranks performance third among the golden rules, and this lands in the scaffold's default output. GUIDELINES §8 also plans for "adding a theme installs *its* token CSS". The size and duplication were never measured or recorded in the plan, the decisions or the evidence.
- **Required fix (one round):**
  1. **App and registry `tokens.css`:** keep the legacy NS One fixture, the legacy `[data-theme='dark']` block, and the light and dark blocks of the configured preset (modern selectors plus the NS One fallback). Nothing else.
  2. **Other presets:** generate per-preset CSS files, e.g. `presets/<id>.css`, through Style Dictionary formats.
     - Each theme item installs its own preset CSS.
     - The design preview links the requested preset's stylesheet only when `appTheme()` picks a non-configured preset on `/design/*`. Today that choice happens in `lib/theme.ts.template`, `_app.tsx.template` and `(design)/_layout`.
  3. **Regression test:** a deterministic test that the NS One app `tokens.css` contains no other preset's selectors. A Utility app build should contain only Utility plus NS One compatibility. Add a bound on the number of effective contexts and declarations.
  4. **Re-run:**
     - `tokens:check`/`tokens:validate`, which now cover more than 50 outputs, so update the count;
     - the NS One declaration diff;
     - the 12-case browser/axe run, keeping the Utility preview at zero allowances;
     - the 8-pair component proof;
     - the actual scaffold `tokens init/build/clean` override proof.

  Don't change any Figma value, any exclusion, or the legacy selectors.

## Verified and not blocking

- **Sources and resolver:** DTCG 2025.10 in three tiers. A single resolver document has 18 presets × light/dark × 2 requested densities (72 inputs), and each preset fixes its own density, gray and accent.
  - The official schemas are vendored and validated with Ajv.
  - Figma aliases are resolved in the target collection's active mode.
  - The alias-only check covers the source tiers that a later modifier overwrites.
  - Unknown modifiers, contexts, pointers and reference cycles all fail.
- **App override:** the semantic-only override applies last.
  - Context aliases and derivation operands are redirected to the overridden semantic token, so the change reaches the CSS `var()` references, the JSON, the component tier, `color-mix()` and the shadow recipes (`output.test.ts:84-111`).
  - Primitive, component, unknown, type-changed, metadata-changing and raw values are rejected.
- **Style Dictionary and outputs:** Style Dictionary 5.7.1 resolves each context through a real format hook, and 50 outputs come from registered formats. The builder does no IO.
  - The Figma export keeps the original index and collection shape and the migrated `-width` names.
  - Dimensions are converted to px and durations to ms, and an unknown unit fails.
- **Names:** `role-manifest.json` (903 names and types) is checked independently. The importer and build never write it.
  - Unknown, missing, duplicate and type-changed names all fail.
- **Contrast:** text is held to 4.5 and boundaries and focus to 3.
  - The required ring, input-border and border-control coverage is enforced per preset.
  - Coverage of foreground and background roles is complete, and the 5 decorative roles carry stated reasons.
  - **Exclusion policy:** exclusions match exactly on preset, scheme, pair, threshold, 12-decimal ratio and both rendered colors. Duplicate, stale or unused entries fail, and there are no ring exclusions.
  - The 406 entries are 389 Figma plus 17 inherited S0, with a regression test that NS One entries are genuinely legacy.
  - All three negative controls run the real checker, and the CI step goes through the allowlisted gate catalog.
- **CLI:** `tokens build|clean|init` depend on `FileSystemPort` and a `TokenEnginePort` whose adapter imports `@netscript/fresh-ui/tokens` lazily.
  - Paths are bounded to the app.
  - Init checks the full write plan before writing anything.
  - Clean removes only the five known generated files.
- **Migration:**
  - Fonts and preset axes come from generated JSON.
  - The root uses `data-theme`, `data-scheme`, `data-density` and `data-flavor`.
  - The legacy light/dark selectors and toggle hosts still work, and NS One remains the default.
  - The design route builds a fresh model per request from the token output, and the preview query only applies on `/design/*` and only to known presets.
  - The browser spec still runs whole-page axe with no rule exclusions. The only baseline changes are the two light component-gallery reductions, and the four Utility cases have no allowances.

## Limitations

- **Full runtime E2E is unproven, not passed.** The single required run of `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited 1 at the Aspire preflight because the Docker daemon was unavailable, including for cleanup inspection. The brief allows reporting this; the unchanged CI/runtime gate must still pass before merge.
- I ran nothing. My evidence is code, tests and the tracked run artifacts. I accepted the private receipts and hashes as reported, without re-executing them.
- **Advisory, not blocking:**
  - The non-default preset preview shows light-scheme value text in dark mode.
  - The CLI depends on `jsr:@netscript/fresh-ui@0.0.8`, which only works if both packages are released together.

No merge, tag, release or label change.

## Single fix round

**Verdict: PASS.** The performance blocker is fixed, and the contracts it touched still hold. You're authorized to make the sign-off commit, push, and hand off READY. No merge, tag, release or label changes.

## What the fix does

**App CSS now carries only what the app uses.** `format-css.ts:39-91` writes the legacy NS One fixture, then the configured preset's light and dark blocks, and adds the two NS One compatibility contexts only when the configured preset isn't NS One. The hex-first fallbacks and the oklch/`color-mix()` blocks guarded by `@supports` are kept. I checked the selector order and specificity:
- **NS One app:** an `ns-one` + dark root gets NS One dark, which beats the light `:root` selectors. Legacy `[data-theme='dark']` ties with `:root` and wins by coming later.
- **Utility app:** the Utility blocks are more specific than `:root`, and no NS One compatibility selector matches a `data-theme='studio'` root.
- **Preview:** a preview preset's language selector always beats the main stylesheet's `:root`, whichever file loads first.

**Measured result:** the NS One app's CSS is 130 KB and 3,035 declarations (2 contexts), down from 2.47 MB and 56,919. Utility, including NS One compatibility, is 260 KB and 6,045 declarations.

**Regression test** (`output.test.ts:22-59`), built on real Style Dictionary output:
- the NS One app CSS references only the `ns-one`, `light` and `dark` themes, has exactly 2 contexts, and stays under 4,000 declarations and 200 KB;
- every preset's CSS has 2 or 4 contexts and stays under 7,000 declarations and 400 KB;
- Utility's flavor set is exactly `utility`, and a Utility build's `tokens.css` is byte-identical to `presets/studio-utility.css`;
- each theme item's copy sources are unique, and each installs its own preset CSS as `tokens.css`.

The total is now 68 outputs from 72 inputs, and the 23-entry `APP_TOKEN_FILES` list is asserted.

**Previews load only when asked for:**
- `appTheme()` returns a single `/presets/<id>.css` link, and only for an allowed, non-configured preset on `/design/*`.
- `_app` renders that link only when present, and the design spec asserts 0 preview links on normal pages and exactly 1 for the Utility preview.
- This uses Fresh's existing static file serving; there is no new route or import glob.
- `registry.manifest.ts` imports only the lightweight `token-output.ts` domain module, so Style Dictionary stays out of runtime imports.

**CLI:**
- `tokenOutputFile` sends the 18 preview files to `static/presets/` and the five core files to `assets/`, and every path is checked to stay inside the app.
- Clean removes only that list of 23 files. The proof shows an unrelated file in `static/presets/` survived.
- The sanitized proof also shows: the override alias reached all 18 previews, a raw value was rejected with all 23 hashes unchanged, the rebuild matched, and the registry copied the selected CSS byte for byte.

**Unchanged:** Figma values, schemas, the 903-role registry, 4,066 contrast uses, the 406 exact exclusions, and the NS One legacy declarations (round-1 output tests still pass). Browser and axe evidence: 12/12 pass, no new or increased findings, Utility still has no allowances, and the 8 component pairs are pixel-identical.

## Limitations, not blocking

- **Full runtime E2E is still unproven, not passed.** The single required run of `scaffold.runtime` stopped at the Aspire preflight because Docker wasn't available on this host. That is the exception the brief allows; the CI runtime gate is still required before merge.
- **Small legacy change in non-NS-One apps:** `[data-theme='light']` now resolves to NS One light instead of the configured preset's light. This matches the existing rule that `[data-theme='dark']` means NS One dark, and no shipped app depends on the old behavior. NS One apps are unchanged.
- The two round-1 advisories stay recorded: the non-default preview prints light-scheme values in dark mode, and the two packages need a coordinated release version.
- I ran nothing. This review is based on code, tests and tracked evidence; I took the private receipts as reported.

## CI/review follow-up

Same independent Anthropic-family read-only evaluator, high effort, closed stdin:
FAIL_FIX identified four additional explicit client-navigation links overriding the
preview body setting. One repair updated all five design Button links and added
a real gallery-Button navigation/Back case with exact font assertions. Re-evaluation
returned **PASS**, with no new blockers. All 24 browser cases and 213 package tests
pass. Typed JSON embedding, native color spaces, optional hex fallbacks and retained
source values were reviewed. Durable summaries/hashes are in ci-followup.json.
The full runtime host-prerequisite exception remains UNPROVEN.

## Review-blocker continuation final IMPL-EVAL

PASS at source ad53106e59d69cd7c3f81464d7f8103dbb18cdf0, independent Claude Opus 5.5, high effort, read-only, closed stdin. Full verdict: review-fix-impl-eval.md. Both blockers and all ten inexpensive findings are resolved. Current-head browser receipt24 PASS completed after the verdict. Full runtime remains UNPROVEN at host preflight; READY is for review only, never a merge or release authorization.
