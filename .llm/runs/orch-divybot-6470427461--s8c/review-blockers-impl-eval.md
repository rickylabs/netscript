**Verdict: PASS — the blocker-fix pass is accepted for review. This is not a merge or release certification.**

I found no technical blockers in the danger/security semantics, the icons, the surface-contrast badge roles, the style-policy exception, the docs-site lock or the carriers.

### Callout type contract and security notices

- **One contract drives everything.** `tools/docs-site/callout-types.ts:2-38` defines each type's label, tone, icon and Markdown marker. A missing type defaults to Note. An explicit unknown type throws instead of quietly becoming Note.
- **All three consumers use it.** The Vento component (`docs/site/_components/callout.vto:2-5`), the accessible-name pass (`docs/site/_config.ts:246-252`) and the twin serializer (`docs/site/_plugins/ai-tooling.ts:230-240`) all read this one contract. So Danger renders destructive with octagon-alert, gets the accessible name "Danger: …", and serializes as `[!CAUTION]`.
- **Every authored type is covered.** `tools/docs-site/callout-types_test.ts:4-29` scans the real docs corpus, more than 100 callouts. It fails on dynamic or unknown types and requires that all seven contract types actually appear. Unknown rejection is also tested directly (`:31-42`).
- **Both ERP security notices are now caution.** In `docs/site/tutorials/erp-sync/03-polyglot-transform.md:144` and `:249`, both are `caution`. The browser test (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:1352-1377`) checks the destructive tone, the octagon-alert icon and exactly one `[!CAUTION]` plus title header for each in the twin.
- **Each type has its own icon.**
  - The icons are info, lightbulb, message-square-warning, triangle-alert, octagon-alert (caution and danger only) and circle-X (error).
  - The unit test compares the actual SVG geometry of every pair, and the browser test checks `data-icon` and the shapes (`docs.spec.ts:1327-1346`).
- **The owner's label and geometry requirements still hold.** The single label, 18px glyph in a 22px box, 8px gap and body alignment are all kept, and the earlier owner tests remain.

### Surface contrast for kind badges

- **The aliases are generated, not hand-written.** `tools/docs-site/generate-tokens.ts:149-173` emits `--ns-studio-api-kind-{keyword,function,type,number}-text`. It keeps the exported step 11 unless that falls below 4.5:1 on code background, canvas or `surface`, in which case it uses Figma's step 12 from the same ramp. If even step 12 fails, generation stops.
- **The resulting values are in `docs/site/styles/tokens.css:254-257` and `:724-727`.** Light function, type and number use step 12. Light keyword and all dark roles stay on step 11.
- **Nothing existing changed.** The code-syntax roles are unchanged and the 281 old declarations are untouched. `tools/docs-site/syntax-contrast_test.ts:36-70` checks independently that the syntax roles are exactly as exported, that each alias has the expected step, and AA on canvas, code and surface.
- **The browser test uses the real surface.** It sets the table to `--ns-surface` and checks paint against the aliases (`docs.spec.ts:1107-1118`).
- **The spec and manifest match the implementation.** The DESIGN.md paragraph (`docs/design-system/themes/studio/DESIGN.md:335-339`) and its role manifest (`:687`) record the owner-authorised docs-adapter policy under #2450.

### The orange-12 style-policy exception

- **Why it's needed.** Light orange 12 (`#582d1d`) falls inside the policy's red-hue band, which is hue ≤18°.
- **How narrow it is.** The exception (`tools/docs-site/style-policy.ts:13-14`, `143-158`) only skips one exact value of one variable, and only for values supplied by a token layer. The browser setup reads that value independently from `figma-variables/primitives.json`, `color/orange/l/12` (`docs.spec.ts:518-555`).
- **What still fails.** Redefining the variable to another red, or to `--ns-destructive-text`, still fails as red outside an error state (`docs.spec.ts:675-676`). Raw authored paint still fails as raw colour, and the three real controls still exit 1 with the expected findings (`review-blockers-negative-controls.json`).

### Lock and carriers

- **The locks are as instructed.** The seven native lightningcss pins stay in `docs/site/deno.lock`, and the root lock is unchanged. This follows your latest instruction.
- **The carrier changes are fully explained.** `review-blockers-carrier-comparison.json` shows the same 207 entries with every row's integrity verified. Non-site bytes are identical to both the previous baseline and main, and the MCP export corpus is unchanged. Exactly three rows changed: the gallery (unknown example replaced with Danger), the Studio page (the DESIGN.md paragraph) and the ERP tutorial. That is consistent with the icons being `aria-hidden`, so other twins don't change.
- **The normal main merge preserved all upstream paths.**

### Still pending (not certified)

- **After the sign-off commit:**
  - a clean-git native docs build that must leave `git status` clean and the root lock unchanged;
  - assets-barrel freshness.
- **The normal push,** then hosted CI and a fresh artifact at the current head.
- **The full CLI E2E (`scaffold.runtime`).** It's still unproven locally because Docker is unavailable. #2450 and #2453 remain deferred.

The evidence in `review-blockers-evidence.json` was reported to me; I didn't observe it. It covers:
- 124 browser tests with 36 axe audits and zero serious or critical findings;
- 16 tooling tests and 4 workflow tests;
- links, caveats, exports, 671 snippets and quality;
- reproducibility, with only the known #2453 differences.
