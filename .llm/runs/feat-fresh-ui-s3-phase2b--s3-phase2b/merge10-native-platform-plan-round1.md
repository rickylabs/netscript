# Independent native platform PLAN-EVAL — PASS

**PASS**: the native-platform correction is approved, with binding conditions. That covers one NavigationMenu pointer rule plus test-setup changes in the forms, calendar and overlays specs. It's the same owner-authorized loop, and its failure count stays at 0. The 1252/28 focused run stays archived as a failure.

**Why each part holds**
- **OTP: removing the `grantPermissions` call is correct, not a weakening.** Firefox and WebKit's Playwright ports don't support that permission name. Your native probe shows real `writeText`, Ctrl/Cmd+V, sanitization and submit working in all three engines from trusted input, with no grants or mocks. Every editing, clipboard, paste and `FormData` assertion stays.
- **Modal browser-chrome boundary: the classification is acceptable as written.**
  - The failing step is Tab or Shift+Tab leaving the page at a modal's edge, into browser chrome. That's user-agent and automation behavior, not product behavior.
  - Your isolated, fresh-page comparison of a bare `<dialog>` against the product reproduces Firefox's stuck chrome boundary and WebKit's extra stop on the `DIALOG` itself outside the product. That's consistent with the upstream Playwright issue, which is context only, not a waiver.
  - The product stays fully proved in all three engines: open, selection, `:modal`, inert outside content, backdrop, Escape, focus return, callbacks and strict axe all stay in the original cases, which also gain *interior* Tab and Shift+Tab.
  - Moving only the exact chrome-boundary blocks into two named cases asserted in maintained Chromium, without `test.skip`, a maintained exclusion or deleted assertions, is the right separation.
- **NavigationMenu: the mechanism is native-first and minimal.**
  - Tracing shows WebKit never focuses the summary when the click lands on a non-interactive descendant, while focus placed directly in the content exits and closes correctly. A blur or animation-frame fix would therefore have been speculative.
  - Making the component's own label and chevron parts `pointer-events: none` sends the click to the native `summary`. The mode-verified prototype fails at baseline in WebKit and passes in all three engines, and keyboard activation still passes.
  - The TSX, handlers, API, parts, enums, key map and tokens don't change. `navigation.spec.ts` stays byte-exact and keeps the real pointer path.

**Binding conditions**
1. **The new rule's selector is narrow.**
   - It targets only the component's own scoped label and chevron parts inside its `summary` (`[data-scope=…][data-part=…]`), in the base layer.
   - No Utility theme predicate, selector-list parent or `:where()`. Nothing on links, content or caller-supplied interactive nodes.
   - Confirm no existing NavigationMenu rule depends on `:hover` or pointer events on those two parts. Hover on the summary still applies, but hover on the parts themselves would stop.
   - Record it as the single intentional exception to CSS parity: 89 files hash-identical, NavigationMenu's original rules and specificities unchanged, plus exactly this rule, verified in all three engines.
2. **Prove it red then green on real source.** The existing unchanged native navigation case is red in all 4 WebKit projects before the edit, as already observed and archived, and green in all 12 projects with real source CSS and no injection.
3. **Publish the separation.**
   - Name the two boundary cases distinctly, for example with a `browser-chrome boundary` suffix.
   - List in validation that they're asserted in maintained Chromium and not selected in the private Firefox/WebKit matrix, with the reason and the bare-`<dialog>` reference counts.
   - Publish an assertion multiset comparison for the two modal specs: every original assertion is present, the moved ones appear exactly once, and the interior Tab and Shift+Tab ones are added.
   - Leave the original scenario names and contract keyboard metadata unchanged.
   - Interior Tab and Shift+Tab must assert actual movement between interior controls in both directions, never wrapping at the chrome edge.
4. **Budget, because product CSS changed.**
   1. Generate the assets and prose canonically.
   2. Measure all 90 CSS files fresh.
   3. Set the literal `ceil(measured × 1.02)` caps, each with the exact dated reason line.
   4. Run the real authored-CSS controls (raw only and gzip only) with the carriers, an exact restore and the positive gate.

   The 5MB cap and every-byte logic stay unchanged.
5. **Gates, all fresh with no readset reuse now that product CSS changed:**
   1. Scoped wrappers.
   2. The 56-case real-source setup and pointer proof without injection.
   3. The complete expanded focused set of 1,288.
   4. Package 866, docs 140, CLI 67, quality/architecture, root checks, preflight, docs accuracy, export drift, the site and exact doc-lint.
   5. Full maintained Chromium 803 and affected Firefox/WebKit 904.

   All with 0 retries, 0 flaky, 0 skipped, no allowances, timeouts or relaxed assertions. Then:
   - the same source review before the merge source commit;
   - the carriers, quality and native publish at the actual head after every job closes;
   - the same evidence review;
   - the audit, the check that `a9078d68` is an ancestor, and the plain push to #2538.

**Still bound:** the owner's final 2% caps with the global guard and the 5MB cap unchanged, aligning the parent before READY, CI at the exact head that's green or explicitly policy-skipped, and all of 11b3b, 12a, 12b and 13. No early READY or final report.

## Implementation evidence clarification

The trace records the native summary as document.activeElement after the click.
The observed WebKit failure is that subsequent Tab does not move from it. The
review's phrasing about the summary not receiving focus is not a direct trace
fact. The controlled evidence is narrower: changing only pointer ownership on
the noninteractive label/chevron restores the unchanged native Tab path, while
keyboard activation also passes. No internal browser focus-cursor mechanism is
claimed. This clarification does not change the approved source or gate scope.
