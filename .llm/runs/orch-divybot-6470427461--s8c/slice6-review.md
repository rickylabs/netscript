**Verdict: PASS**

I found no blocking issues in slice 6. Path chips and #2451 weren't evaluated, as you asked.

### Token authority and compatibility with old declarations

- **The generator selects Theme set A.** `tools/docs-site/generate-tokens.ts:15-24` adds `Theme set: 'A'` and a `Theme B` context to the modes. It still emits only from Theme, Density, Studio flavor and Scheme, so no second theme scale is produced.
- **The export is wired in.** `tools/docs-site/figma-variables/index.json` lists the new `theme-b.json` and `theme-set.json` collections (modes A and B). `scheme.json` defines `code/bg` and the `code/syntax/*` roles with `codeSyntax`, so every new colour comes from the export.
- **The fixture is genuinely pre-s8c.** In `tools/docs-site/fixtures/pre-s8c-tokens.css`, the status and scroll-thumb declarations sit on exactly the same lines as the pre-slice `tokens.css` I checked during PLAN-EVAL (53, 71, 162, 239, 274, 338, 356, 447, 524, 559).
- **Every old declaration is checked.** `tools/docs-site/generate-tokens_test.ts:59-85` asserts 281 declarations per scheme and compares each full line byte for byte. `--ns-input-border` is the only exception, with exact old and new values asserted. It is recorded as owner scope in `.llm/runs/orch-divybot-6470427461--s8c/drift.md:9`.

### Syntax roles and AA contrast

- **The contrast maths can't round a failure up to a pass.** `tools/docs-site/contrast.ts` computes the unrounded WCAG sRGB ratio, rejects non-opaque paint, and uses a 4.5 threshold.
- **All seven roles are tested on both backgrounds in both schemes.** `tools/docs-site/syntax-contrast_test.ts:5-21` checks each role against `code/bg` and against `surface/bg`, which resolves to `--ns-bg`, the actual page and table canvas. It also checks IMPORTANT text on its subtle background.
- **The closest case still passes.** Light `number` is `#cc4e00` on white, about 4.51:1.
- **No syntax colour is red.** Its hue is about 23°, and dark `#ffa057` about 26°. Both are outside the style policy's red band of ≤18° or ≥340°, so the existing negative controls still apply.
- **Code backgrounds and the hljs mapping are consistent.**
  - Plain fences (`docs/site/styles/docs.css:427`) and framed blocks (`docs/site/styles/components.css:393`) both use `--ns-code-bg`.
  - The hljs mapping (`docs.css:496-521`) only reads the generated roles.
- **The browser test checks every highlighted token.** `tools/fresh-ui-browser/docs-tests/docs.spec.ts:816-860` checks each token's computed colour against the role set, its actual `pre` background, and AA.

### API kinds and signatures

- **The final kind map is in place.** `tools/docs-site/api-kinds.ts` matches the locked plan (`component` maps to the syntax function role) and adds `apiKindRole`.
- **Both table paths emit the role.** `data-syntax-role` comes from `docs/site/_components/apiTable.vto:14` and from the Markdown table transform in `docs/site/_config.ts:235`. The CSS (`components.css:541-552`) paints each role on `--ns-code-bg`.
- **Signature highlighting works as intended.** `_config.ts:170` widens the highlighter's selector. `_config.ts:241-245` adds `language-typescript` in an `afterRender` listener. In Lume 2.5.4, `afterRender` fires before processors run, so highlighting sees the class. No `type` value contains HTML that highlight.js could strip.
- **Names stay in the foreground colour.** The `code` elements keep `--ns-fg` (`docs.spec.ts:700-722`), and only the highlighted child spans take syntax colours.
- **Kind tags are fully tested.** `docs.spec.ts:862-901` asserts the role map, computed paint against the generated role, AA on both the tag and table backgrounds, and that signature keywords are highlighted. It also confirms that class, function, interface, type, const and component all appear.

### IMPORTANT callout

- **The triplet is applied.** `components.css:483-489` applies the generated violet `--ns-important-*` triplet.
- **The tone split is unchanged.** Only the head (icon, eyebrow, title) takes the violet, while the body keeps `--ns-fg` and links stay ink. `docs.spec.ts:637-680` now asserts this for IMPORTANT alongside the other tones.

I haven't seen the browser rerun after the corrected fresh-ui signature assertion. This verdict is based on the source and tests above.

## Visual and style-policy addendum

**Verdict: PASS**

This delta introduces no blocking regressions.

### Callout icons

- **The SVGs follow the tone colour.** `docs/site/_components/callout.vto:6` draws them with `stroke="currentColor"` and `fill="none"`, so each icon inherits its head's tone colour. That colour is still a generated role, and the body keeps `--ns-fg`.
- **They pass the style policy.** `currentColor` and `none` are both on its allowed list (`tools/docs-site/style-policy.ts:32-41`), so the new SVG attributes don't create false findings.
- **They stay hidden from assistive tech, and the type contract is unchanged.** The `span` and the `svg` are both `aria-hidden`, so the icons add nothing to screen-reader output or Markdown twins. Type normalisation, the `error` alias and the fallback for unknown types are unchanged (`callout.vto:2-4`).

### Gallery links

- **The links are real anchors.** `docs/site/fixtures/callouts.md:16` and `:32` now use real `<a>` elements with root-relative `href`s, which the existing base-path step rewrites. The ink-link assertion now runs against real links instead of passing vacuously.
- **The gallery is still internal.** `internal: true` remains, so the earlier exclusion from search and twins still applies.

### Style policy

- **Only exact error and destructive values pass.** `style-policy.ts:180-184` now accepts only exact `error`/`destructive` attribute selectors, quoted or unquoted, plus exact `aria-invalid="true"` or `.ns-error`.
  - Substring impostors such as `errorish` or `destructive-decoration` are no longer accepted.
  - Chromium serialises CSSOM attribute selectors with double quotes, so the real rules still match: `.ns-callout[data-tone="destructive"]` and `[data-variant="error"]`.
- **Inline-style ancestry includes `data-tone`.** `style-policy.ts:88-90` adds it, with an empty value when the attribute is absent. An empty value never matches the exact pattern, so absent attributes can't count as error states.
- **Negative controls only got tighter.** The new controls (a red syntax keyword, an info tone using the destructive role, prefix impostors) are additions. The legal destructive and logo cases are still accepted, and no existing control was relaxed.

I haven't run or seen the 32 targeted checks you report as passing. This verdict is based on the source above.
