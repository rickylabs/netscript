# Restack7 native Escape instrumentation — independent design review

**PASS**: the Restack 7 native-Escape trace refinement design is approved ahead of the trace edits. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The cause is in the test tooling, and you measured it.**
  - Your six bare controls (`restack7-native-trace-control.json`) isolate a single variable. Only Firefox with trace DOM snapshots reports cancelability `[true,true]` and stays open. The same engine without snapshots reports `[true,false]` and closes, and Chromium and WebKit close either way.
  - Three direct Firefox Shell runs without snapshots close, with one Escape proposal and one native-close proposal.
  - So the snapshots grant user activation between the two physical Escapes and change the behavior being measured. It isn't an application key-policy bug.
  - Both specs already say this about manual DOM queries (`shell.spec.ts:299`, `dialog-ownership.spec.ts:82`). This extends the same rule to automatic snapshots.
- **The fix is the narrowest one available.**
  - Only the three adjacent double-Escape cases change: Shell "forced native close…" (`shell.spec.ts:292-319`) and the Dialog and Sheet instances of `platform-close-wins-and-next-parent-render-reconciles` (`dialog-ownership.spec.ts:75-103`).
  - They get a nested `describe` with `test.use({ trace: { mode: 'retain-on-failure', snapshots: false, screenshots: true, sources: true } })`.
  - Both configs stay `retain-on-failure` (`gap.playwright.config.ts:24`, `playwright.config.ts:36`). Sibling tests, assertions, keys, the browser branch and runtime are all unchanged.
  - There are no retries, sleeps, synthetic `cancel` events or forced-close fallback. All of these are correctly excluded.
- **The original assertions carry the proof.** `[true,false]` cancelability, exactly one `native-close`, hidden-then-reopened on an accepted parent render, `aria-expanded` and focus all stay. Failure traces still keep actions, screenshots and sources.
- **The RTL locator fix is a fixture correction.** Changing the new `Overview` locator to `Overview 12` is right: the expanded nav's accessible name includes the visible count. The viewport assertion stays, and nothing in the product changes.

**Conditions you must meet**
1. **Scope placement:**
   - in `dialog-ownership.spec.ts`, nest the trace scope inside the existing per-kind `describe` so its `beforeEach` (navigation and scheme) still applies;
   - wrap only `platform-close…`, not the refusal, uncontrolled, disabled or axe cases;
   - in `shell.spec.ts`, wrap only the forced-close case.
2. **Prove the option is actually in effect.** `trace` is a worker-scoped option, so overriding it in a `describe` runs those tests in a separate worker.
   - The focused all-engine run must show the previously failing Firefox case passing.
   - Sibling tests must stay on the default trace config: no global or sibling changes in the diff.
   - Report retries and flaky as 0, so no retry can hide a failure.
3. **Use the exact final configuration.** The six bare controls changed only `snapshots`. The proof for this design is therefore the focused run of all three original cases with the exact `screenshots: true, sources: true` object, in Chromium, Firefox and WebKit across the schemes and widths you have. If Firefox still reports `[true,true]` with screenshots on, stop and redesign; don't weaken anything.
4. **Correct the public record.** `restack7-negative.json` still says `rtlShell.legacyTransformControl: "pending terminal measurement"`. Before the evidence review, replace it with the actual result of your scoped-removal control, as a verdict and count only.
5. **Gates:**
   - scoped check, lint and format on the two specs with 0 dropped;
   - the full Chromium refresh of 667 cases and the current cross-engine 304, both measured terminal results with no stopped runs counted as passed;
   - the full package suite;
   - the broader gates, then the same source and evidence review.

   Stop the debug server you started and positively own before the full Playwright rerun. Leave anything foreign untouched.

**Non-blocking**: in the comment next to the nested scope, note that forcing snapshot tracing from the command line would bring this Firefox artifact back, so whoever runs it next isn't confused.

**Next**
1. Make the trace edits to the two existing spec files, keeping the total change under 30 files.
2. Run the focused cases in all three engines, then the full matrices.
3. Come back to me for the same source and evidence reviews.
4. Commit, run the carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
