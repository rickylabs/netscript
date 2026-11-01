# Independent caller button PLAN-EVAL — PASS

**PASS**: the scoped caller-button fixture correction in `tools/fresh-ui-browser/gap-ai-interaction-fixture.tsx` is approved, with binding conditions. It's the same owner-authorized loop, and its failure count stays at 0.

**Why it holds**
- **The failure is in fixture paint, not product code.** The bare `<button>`s the fixture passes as caller actions and host controls take WebKit's native dark-scheme widget paint, at 1.81:1. That's the same class of failure as the earlier DataGrid, Stats and Shell fixtures. MessageScroller and Questionnaire don't paint the controls their callers supply. The reader wheel and Home cases passed in the failing project.
- **The fix is the established precedent.**
  - The shipped `Button` is already imported (line 6) and already used by the host-flow controls (lines 294–310).
  - It spreads remaining props onto a native `<button>` and supports `type='button' | 'submit' | 'reset'`, so reset and submit behavior, `FormData` and the disabled fieldset's native behavior carry over.
  - Its inner label `span` stays inside the button, so MessageScroller's `keyIntent` exclusion for Space via `closest('button,a')` still applies.
  - I checked `gap-tests/ai-interaction.spec.ts`. No locator uses a bare `[data-part='root']` or a `button` tag selector that the Button's markers could now match. The `input,textarea` count (line 289), the viewport and stream locators, and the radio-reference comparisons (lines 679–698) are unaffected.
- **Nothing in the product changes.** No CSS, API, token, global reset, mock, allowance or skip. The strict axe assertion is unchanged.

**Binding conditions**
1. **Make it a mechanical replacement.**
   - Change only `<button …>…</button>` to `<Button …>…</Button>` at the plain call sites. Those are lines 23–28, 110, 124, 139, 149, 164, 173–174, 193–194, 209–210, 223 and 234.
   - Keep each one's explicit `type`, because `Button` defaults to `button`, so reset and submit must stay explicit. Keep its handlers, label text and position.
   - Don't touch the existing `Button` sites, the native radio reference, inputs or `form` elements.
   - Record a mechanical diff restricted to those sites.
2. **Pick the variant by measurement.** Use the default or an existing variant, and let the strict axe in all three engines and both schemes decide. Don't use `ghost` over a tinted surface unless axe shows it passes there, given the DataGrid selected-hover finding.
3. **Record the exception.** Add this consuming fixture to the child's list of intentional exceptions to non-CSS byte preservation, next to the reader-frame files, in drift and validation. Archive the 168/1/23 focused run publicly as a failed run.
4. **Rerun everything fresh on the refrozen source.**
   1. Scoped fixture check, lint and format, 0 dropped, then rebuild.
   2. The complete 192 focused AI cases in all three engines, both schemes, 390 and 1280, run to a terminal result.
   3. Then every previously bound gate:
      - full package 866;
      - full maintained Chromium 795;
      - the complete affected Firefox/WebKit 904;
      - docs 140;
      - quality/architecture, preflight, docs accuracy, export drift, the site, CLI and root checks, and doc-lint attribution;
      - after the source commit, the carriers, quality and publish at the actual head.

      All with 0 retries, 0 flaky and 0 new allowances.
   - The reader regression's red result (8) stays valid as historical proof that it was red first. Its green result must come from this fresh focused run, not the earlier 12.
   - The CSS bloat controls stay valid while product CSS bytes are unchanged. Re-run them with the final 2% caps after the remaining scope, as already bound.

**Still bound:** the owner's final policy of 2% headroom with the dated reason and red-then-green proof, aligning the parent before READY, CI that's green or explicitly policy-skipped at the exact final head, and the remaining 11b3b, 12a/12b and 13. No early READY.
