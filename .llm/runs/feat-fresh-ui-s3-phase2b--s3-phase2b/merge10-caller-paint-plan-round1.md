# Independent complete caller-control PLAN-EVAL — PASS

**PASS**: the complete caller-control fixture paint correction (18 consuming fixtures, 84 plain button sites) is approved, with binding conditions. It's the same owner-authorized loop, and its failure count stays at 0.

**Why it holds**
- **It's the same class of failure, with the same proven fix.** Bare caller buttons in the general Actions composition, AI and DocsStructure routes take WebKit's native dark-scheme widget paint at 1.81:1. Controls the products paint already pass. So the fix belongs in the consuming fixtures, not in product CSS, tokens or a global reset.
- **The mechanism is right.**
  - Using the shipped `Button` keeps native semantics. It spreads remaining props onto a native `<button>`, keeps `type` (`button`, `submit` or `reset`), `name`, `value`, `form`, `disabled`, `class` and `style`, and its inner label `span` stays inside the button.
  - A multiline search finds **0** plain `<button … ref=…>` sites in the browser fixtures. That matters because `Button` doesn't forward refs (`button.tsx` has no `forwardRef`).
  - The headless Dialog, Sheet and ActionMenu `Trigger` and `Close` stay the same headless controllers, with no `asChild` and no nested buttons. Painting their native surface through the public `style` attribute with the existing `--ns-primary` / `--ns-primary-fg` pair is legitimate caller composition, and adds no undeclared data axis.
  - You verified that `.ns-btn` without a variant doesn't paint, so a class alone wasn't enough.
- **The scope is right.** Exactly the 18 inventoried files, no changes to the already-painted DataTable, Shell or Stats fixtures, strict axe unchanged, and no allowances, skips or test-logic changes. You're waiting for every current browser job to close and archiving the full failures first.

**Binding conditions**
1. **Keep the mechanical diff provable.**
   - Each converted site changes only the tag, plus a `Button` import where it's missing, and keeps its `type` explicit.
   - No converted site may gain or need a `ref`. If one does, paint it with the inline pair instead.
   - The paint pair is one named, read-only local constant per file, used only in the navigation and dialog-ownership fixtures, containing only the existing `background` and `color` token references, no raw values, used only on headless `Trigger`/`Close` call sites.
   - Publish counts: 18 files, 84 tag sites, import lines, paint-pair sites, and 0 other changed lines.
2. **Audit the generic locators before running.** `Button` adds `data-scope='button'`, `data-part='root'` and `data-state='rest' | 'disabled'`. List every spec locator that consumes these 18 fixtures and selects by an unscoped `[data-part=…]`, `[data-state=…]` or `[data-scope=…]`. For example, `gap-tests/fidelity.spec.ts:88` screenshots `matrix.locator('[data-part="root"]')`, and the calendar and docs-primitives specs use similar patterns. Confirm that none now matches a Button, because Playwright's strict mode would otherwise fail or the wrong node would be selected. If one does, fix it in the fixture, never by loosening the spec.
3. **Run the gates in this order.**
   1. Scoped check, lint and format on all 18 files, 0 dropped, then rebuild.
   2. The complete focused union of every strict-axe and native keyboard, form, close and scroll case that consumes these fixtures, in all three engines, both schemes, 390 and 1280.
   3. A fresh full maintained Chromium 795 and a fresh full affected Firefox/WebKit 904, with 0 retries, 0 flaky, 0 skipped and 0 new allowances.

   The reader's 192 focused cases are included in the final 795 and 904.
4. **Reuse is allowed only where the readsets prove these files aren't inputs.**
   - **May be reused,** provided you record a readset proof that the product, CSS, carriers, docs and site hashes are unchanged and that none of these gates reads the 18 files:
     - package 866 (no `packages/fresh-ui/tests` file imports `tools/fresh-ui-browser`);
     - docs 140 (its config and specs don't load the gap fixtures);
     - CLI 67;
     - preflight, docs accuracy and export drift;
     - the exact doc-lint comparison;
     - CSSOM parity plus bloat.
   - **Must be rerun,** because the browser tool is part of their input:
     - the configured root checks, at least `check:aspire-host-ports`, which classifies `tools/fresh-ui-browser/` as scanned tooling (`.llm/tools/validation/aspire-surface-manifest.ts:413-417`);
     - quality/architecture, including the `.llm/tools/validation/fresh-ui-quality_test.ts` that references the browser tool.

     Quality and publish at the actual head after the source commit are required anyway.
5. **Records.** Archive the current 904, 795, 866 and 140 outcomes, including the cross-engine failures, without calling any of them green. Add the 18 files to the child's list of intentional exceptions to non-CSS byte preservation, in drift and validation.

**After the source commit:**
- every canonical carrier with the delta inspected;
- quality and native publish at the actual head, after all jobs close;
- the same source and evidence reviews;
- the audit, the check that `a9078d68` is an ancestor, and the plain push to #2538.

**Still bound:** the owner's final policy of 2% caps with the dated reasons and the global guard unchanged, aligning the parent before READY, CI at the exact final head that's green or explicitly policy-skipped, and the remaining 11b3b, 12a/12b and 13. No early READY.
