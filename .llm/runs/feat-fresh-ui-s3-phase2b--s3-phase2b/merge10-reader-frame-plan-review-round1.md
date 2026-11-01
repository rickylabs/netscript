# Independent reader-frame and latest-budget PLAN-EVAL — PASS

**PASS**: the MessageScroller reader-frame fix and the owner's final budget policy are both approved, with binding conditions. It's the same owner-authorized loop, and its failure count stays at 0.

**Why the fix is right** (`packages/fresh-ui/registry/components/ui/message-scroller.tsx`)
- **The race is real and lives in the component, not in CSS.**
  - `noteIntent` sets `readerIntent` and schedules a frame (lines 102–105).
  - A native scroll event that arrives before that frame runs `measure(false)`. Line 82 clears `readerIntent`, and line 79 keeps `pinned` true because a 1px step is still within `endThreshold`.
  - The queued frame then calls `measure(true)` (line 89). Line 74 sees pinned and no intent and pulls the viewport back to the end.
  - That's the WebKit Home failure in your 12 diagnostic cycles (11 pass, 1 fail), and your prototype that ran the actual code reproduces it in Chromium and WebKit.
- **The fix is minimal and keeps existing semantics.**
  - One boolean local to the effect records that the queued frame came from input, and the frame passes `follow = false` for it.
  - Without the fix, an input frame already doesn't follow whenever no scroll event cleared `readerIntent`. The fix only extends that to the case where a scroll event cleared it.
  - Observer-only growth and resize frames and `latest()` (lines 60–64) still follow a pinned reader.
  - `pinned.current = !down`, every threshold comparison, `NATIVE_SCROLL_KEYS`, the listeners, cleanup, DOM, CSS, focus and SSR stay byte-identical. There's no `preventDefault`, no delay, retry or engine branch, and no new API.
- **The deliberate exception to child plan condition 5** (non-CSS byte identity against `1afd50cb`) is explicit and bounded. It covers only the product TSX, the spec, one README sentence and the regenerated carriers.

**Why the budget policy is acceptable** (`owner-final-budget-policy.md`)
- It's the owner's exact, dated decision. It supersedes the 4,019 / 473 headroom formula, and it was relayed with "do not wait for an answer".
- The plan applies it as an interim snapshot: 335,569 / 44,751 rounded up ×1.02 gives 342,281 / 45,647. Each field carries the dated reason line.
- Every byte, the equality checks, gzip, both assertions and the 5MB logic are unchanged, and there's no self-adjusting cap.
- It must be measured again after the remaining Desktop and harness work for the final caps, so it isn't presented as final.
- The independent controls are well constructed. Highly compressible bloat (raw only) exceeds the 6,712 raw headroom with negligible gzip growth. Seeded incompressible bloat (gzip only) exceeds the 896 gzip headroom while staying under the raw headroom.

**Binding conditions**
1. **The regression must assert the actual position, not just the attribute.**
   - At the end with `endThreshold=1`, `data-scrollable` is already `up`, so that attribute alone can't tell the bug from the fix.
   - After the trusted `wheel(-1)` and the existing scroll-quiescence helper, assert that `scrollHeight − clientHeight − scrollTop` is greater than 0 and at most `endThreshold`. Use a small fixed tolerance for fractional device pixels, declared in the test. Also assert `data-scrollable='up'`.
   - Show it **red on the unmodified source in Chromium and WebKit** first, and archive that run. Firefox may pass already.
   - Keep every existing Home, End, latest, Enter/Space and focus case unchanged. Don't add a sleep, retry, mock or wider tolerance.
2. **Contain the reader-frame flag.**
   - Only `noteIntent` sets it, which covers wheel, pointerdown, touchstart and the native key set through `keyIntent`.
   - Clear it when the frame runs and on cleanup.
   - Use it only as the `follow` argument for that one frame. It must never change `pinned`, `readerIntent` handling in `scroll()`, or threshold math.
   - Keep the existing browser cases proving that a pinned reader follows growth without input, and that `latest()` re-pins and follows.
3. **Rerun everything fresh after the edit.** The earlier full Chromium 791, package 866, docs 140 and CLI 67 become historical. On refrozen source, run:
   - the focused native AI checks in all three engines, both schemes, 390 and 1280;
   - the full package suite;
   - full maintained Chromium 795;
   - the **complete** affected Firefox/WebKit set of 904, to a terminal result with no stopped runs;
   - docs 140;
   - broader quality/architecture, preflight, docs accuracy, export drift, the site, CLI and root checks;
   - the exact doc-lint attribution.

   All of these with 0 retries, 0 flaky and 0 new allowances. Archive the 450/1/1/444 cross run as a failure.
4. **Bloat controls never land.**
   - Inject the bloat into a real authored CSS file and regenerate the carriers, so authored and shipped equality still holds.
   - Run the configured budget test and confirm it rejects only the intended kind.
   - Restore the exact source and carrier hashes, then show the positive gate passes.
   - The injected bloat is never committed.
   - Do it again with the final caps after the remaining scope.
5. **Align the parent before READY.** Parent #2488 still carries 282,782 / 36,350 from the earlier grant. Before READY, bring it under the owner's final policy:
   - measure the parent's own final payload;
   - set the cap to that ×1.02, rounded up, with the dated reason;
   - repeat the red-then-green controls;
   - a plain merge and push, with no rewrite.
6. **CI wording.** The owner accepts green *or* explicitly policy-skipped checks at the exact final head. Failed or pending checks still mean not ready. Record which checks were policy-skipped, and the policy that skipped each.

**Next**
1. The red-first regression.
2. The reader-frame edit, the README sentence and canonical regeneration.
3. The interim caps with the bloat controls.
4. Refreeze and run the fresh gates above.
5. This same source and evidence reviews.
6. The carriers, quality and publish after every job closes.
7. The audit, the check that `a9078d68` is an ancestor, the plain push to #2538 and the status comment.

Still required after that:
- **11b3b:** the four remaining Desktop audits.
- **12a/12b:** the production declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the final IMPL-EVAL and CI at the exact head that's green or policy-skipped.

No early READY, final report, PR merge, release, labels or promotions of the 19 future items.
