# Browser policy review — PASS

Independent Claude Opus 5.5 high effort, read-only, same reviewer after one correction.

**PASS**

All three round-1 blockers are fixed and I found no new blockers.

**F1 (negative controls prove the baseline matching): fixed.**
- `accessibility.ts` matches individual serious/critical nodes by rule, impact and target, never whole rules.
- `design.spec.ts` sends all four controls through the same scan and the same `verifyAccessibility` call that normal runs use:
  - **New rule:** a real unnamed button triggers `button-name`.
  - **New target under a known rule:** real low-contrast text under `color-contrast` gets the new target `#axe-negative-control`.
  - **Duplicate:** an extra copy of an existing node in the scan results is rejected.
  - **Stale:** one fewer existing node is rejected.
- `axe-negative-controls.json` shows each control fails with the exact fingerprint change: the two new findings at 0→1, the duplicate at 1→2, the stale allowance at 1→0.
- `accessibility_test.ts` repeats these as fixed fixtures. CI runs it through the `fresh-ui-browser-contract` gate before the browser gate.

**F2 (the ratchet can only go down): fixed.** The validator takes every fingerprint from both the scan and the baseline and fails on any count difference. New, extra, missing and reduced findings all fail.
- Routes not in the baseline, and `FRESH_UI_AXE_STRICT=1`, both allow zero findings.
- The axe-core version is checked against the baseline at runtime.
- `record-axe-baseline.ts` refuses to:
  - overwrite an existing output;
  - accept negative-control results;
  - accept mixed engine or browser versions, or an incomplete or duplicated matrix.
  
  It records the source commit and writes a candidate marked pending review.
- No negative-control or strict setting appears in the workflow, so CI runs the normal policy.

**F3 (honest reporting): fixed.**
- Plan decision 5 and `drift.md` describe the exact-baseline policy.
- The README and the baseline's `review` field both say the gallery is not axe-clean.
- The baseline assigns every existing debt group to a later slice of epic #2412: `color-contrast` to tokens v2, and `aria-required-children` and `listitem` to the DesktopTrayMenu component slice.
- Full `axe.json` reports, with every impact level, are uploaded.
- No existing gate is removed or weakened.

The eight normal cases passing under exact equality shows the committed baseline matches the real scans exactly.

**Not blocking, check at IMPL-EVAL:**
- **CI may not match the local baseline.** The baseline came from a local Linux Chromium run, and CI requires exact equality. Font or rasterisation differences on the runner could change contrast results or selectors. The first CI run must match exactly. If it doesn't, re-record from the CI artifacts (the recorder supports moved artifact paths) and review that change. Don't loosen the check.
- **Leftover plan wording.** The risk line still says "make only minimal corrections …" and the debt section still says "No new architecture debt is accepted". Drift records the change, but rewording these to "existing accessibility debt recorded in `axe-baseline.json`" would keep the plan consistent.
- **PR Definition of Done.** The draft PR body isn't on disk, so I couldn't check it. Its Definition of Done needs the same "matches the reviewed S0 baseline, not axe-clean" wording.
- **Browser version.** The Chromium version is recorded but not checked at runtime. Exact equality still fails closed on any change it causes, so this is only about clearer error messages.

I wrote no files and ran no commands.
