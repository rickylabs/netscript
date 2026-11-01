# Independent source review — round 1

**PASS**: child merge10 integration source review, round 1. That's working tree `c8218a99` with `MERGE_HEAD` `2be80639` (the published parent) and main `0af8fd9e`, before the commit. I found no blockers, and the loop's failure streak stays at 0.

**Why it holds**
- **Lineage and preservation.** It's a normal merge with no rebase or force-push.
  - Remote child `a9078d68` and the reviewed Desktop `c3dba2ce` stay in the ancestry, and there are no unmerged paths.
  - The 711 source hashes and 9 compiled hashes match their bookends.
  - The parent's main-only CLI, docs and design-guidance changes are preserved, and the three locks are identical to main.
  - Window/Tray CSS is byte-identical to the reviewed replacement, and the disposition record shows 0 semantic additions after the base.
- **MessageScroller** (`registry/components/ui/message-scroller.tsx:69-140`) matches the approved design exactly.
  - One local flag, `readerFrame`, is set only in `noteIntent` (line 108), consumed and cleared when the frame runs (lines 91–93), and cleared on cleanup (line 137).
  - It feeds only the frame's `follow` argument. `pinned.current = !down`, `readerIntent`, the threshold math, the key set, the listeners, DOM, CSS and SSR are unchanged.
  - The trusted one-pixel wheel regression failed red first in 8 Chromium and WebKit contexts, Firefox already passed 4, and all 12 are now green on real source.
- **The NavigationMenu rule** (`navigation-menu.css:16-19`) is the single approved exception.
  - Its selector is `.ns-navigation-menu summary > [data-scope='navigation-menu']:is([data-part='label'], [data-part='chevron'])` with `pointer-events: none`. Specificity is 0,3,1, and it touches only the component's own direct parts.
  - There's no theme predicate, selector-list parent or `:where()`.
  - The 14 original rules are intact, the 89 other CSS files are hash-identical, and `navigation.spec.ts` is byte-exact. The real click, Tab, Tab-out path was red in 4 WebKit projects and is green in all 12.
  - All three engines confirm the scope, that a foreign control is untouched, and that summary hover paint is unchanged.
  - The claim stays modest: the summary *is* the active element after the click, but Tab stays stuck, and no stronger cause in the engine is asserted.
- **The fixtures** follow the approved mechanical scope: Button replacements, imports, headless paint pairs that reference tokens only, and wrappers that keep the existing generic screenshot targets unique. That's fixture-side, as condition 2 required. A generic-locator audit covered 121 references, and no assertion was loosened, no controller changed and no button was nested.
- **The native spec setup** follows the approved plan.
  - Only the OTP permission grant was removed, and the real write, paste, sanitization and `FormData` assertions remain.
  - The two browser-chrome boundary blocks moved into named cases asserted in maintained Chromium. The original modal cases run in all three engines with every original assertion plus interior Tab and Shift+Tab.
  - The assertion multiset goes from 186 to 196 with 0 lost, and each moved block appears exactly once. There's no maintained skip or exclusion, no preference change and no production engine branch, and the public keyboard metadata is unchanged.
- **The budget follows the owner's final policy** (`packages/fresh-ui/tests/publish-size.test.ts:9-15`).
  - Measured 335,788 / 44,819 × 1.02, rounded up, gives exactly 342,504 / 45,716. Each field carries the exact dated reason.
  - Inventory, equality, compression, both assertions and the 5MB logic are unchanged.
  - Real authored-CSS controls reject raw only (343,829 / 45,015) and gzip only (339,329 / 48,435), each only for its own kind. The exact restore and the positive gate pass, and no bloat is committed.
- **Every current gate ran fresh and closed:**
  - real-source native 56;
  - expanded focused 1,288 (440 / 424 / 424);
  - full maintained Chromium 803;
  - full affected Firefox/WebKit 904;
  - package 866, docs 140 and CLI 67.

  All have 0 failed, skipped, flaky or retried. The scoped wrappers dropped 0 files. Quality/architecture, preflight, docs accuracy, export drift and ten root checks exit 0. The site builds 260 HTML pages and 135 artifacts. Doc-lint is the exact 123 + 1 with 0 new / 0 removed under #2531. Both thread gates have 0 unanswered.

**Authorized next steps, in order**
1. The normal merge source commit, staged by explicit path, plain message and no attribution.
2. The six canonical commands covering all four carriers, with the actual delta inspected.
3. Durable quality and native publish at the actual head, after every job has closed.
4. The same evidence review.
5. The public audit, all counts 0.
6. Confirm `a9078d68` is an ancestor of the local head, then plain push to #2538.
7. The status comment: merged head, caps, the owner's READY instruction seen, READY withheld.

**Still required, and not claimed:**
- aligning the parent's own 2% caps before READY;
- **11b3b:** the four remaining Desktop audits;
- **12a:** the production declared x-extensions;
- **12b:** the all-style harness;
- **13:** the final whole-phase runtime run, the IMPL-EVAL and CI at the exact head that's green or explicitly policy-skipped.

No labels, closing keywords, READY, final report, merges or promotions.
