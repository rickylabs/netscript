# Restack7 native trace file placement — independent design review

**PASS**: moving the three native-close cases into one new file is approved before you move them. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The runner's error is real, and the fix is the one it asks for.**
  - I read the installed runner (`tools/fresh-ui-browser/node_modules/playwright/lib/common/index.js:1584-1586`). It rejects any worker-scoped option set inside a `describe` with "Cannot use({ … }) in a describe group, because it forces a new worker. Make it top-level in the test file or put in the configuration file."
  - `trace` is worker-scoped, so my approved nested placement couldn't load. The trace settings object itself was right.
  - Recording 0 executed cases, with nothing reported as green, is honest.
- **Putting the setting at the top of a dedicated file is the narrowest legal placement.**
  - It touches no global or sibling trace setting, adds no helper or product change, and changes no keys.
  - The refusal, axe, keyboard and every other case stay in their original files on the default `retain-on-failure` setting.
- **Counts are consistent with the config.**
  - The gap config's four light/dark × 390/1280 projects pick up all of `gap-tests/`, and the touch project's `testMatch` doesn't include the new file. The three cases therefore move as 12 Chromium executions out and 12 in, which keeps the full run at 667.
  - The targeted Firefox/WebKit set grows by the Dialog and Sheet cases: 2 cases × 2 engines × 4 projects = 16, so 304 becomes 320.
  - The focused run is 3 engines × 2 schemes × 2 widths × 3 cases = 36.
  - `workers: 1, retries: 0` in the config backs the 0 retries / 0 flaky requirement.
- **Removing the three originals prevents duplicates.** Shell's forced-close case has no file-level setup it depends on, so its body moves as it is.

**Conditions you must meet**
1. **Move the bodies unchanged.**
   - Keep the code identical apart from indentation, including the adjacent-Escape comments (`shell.spec.ts:299`, `dialog-ownership.spec.ts:82`).
   - Keep the original test titles.
   - Copy the per-kind `beforeEach` exactly: the scheme from the project name, then navigation and the heading check.
   - Remove the now-empty nested `describe` and its `test.use` from `shell.spec.ts:292-296`, and remove the Dialog/Sheet equivalent, so no rejected placement is left behind.
2. **Put the explanation at the top of the new file.**
   - Explain why snapshots are off: Firefox snapshot inspection grants activation between the two Escapes.
   - Note that forcing snapshots from the command line would invalidate this native control.
3. **Make the cross-engine selection explicit.** The Firefox/WebKit run isn't defined in a checked-in config. Record that its targeted file list includes `native-close.spec.ts`, and give the actual 320 terminal count rather than an inferred one.
4. **Prove all of these with terminal runs:**
   - the focused 36 in all three engines with the exact trace settings object, and Firefox reporting `[true,false]` and closing;
   - the full Chromium 667;
   - the targeted Firefox/WebKit 320;
   - scoped check, lint and format on the new file plus the three old specs, 0 dropped;
   - 0 retries and 0 flaky.

   If Firefox still reports `[true,true]` with screenshots and sources on, stop and redesign. Don't add an engine branch, sleep, retry, forced close or weaker assertion.
5. **RTL control.** The corrected control is accepted as terminal PASS:
   - the `Overview 12` link sits at x 111, width 279, inside the modal's x 110–390;
   - removing the one override moves it outside the viewport;
   - the first attempt matched nothing because CSSOM normalizes quotes.

   The public `restack7-negative.json` must still carry its verdict and counts in place of "pending".

**Next**
1. Move the cases.
2. Run the focused 36, then the full Chromium 667 and targeted Firefox/WebKit 320, plus the wrappers.
3. Come back to me for the same source and evidence reviews.
4. Commit, run the carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

The package suite's 765 passes remains valid while production source stays unchanged.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
