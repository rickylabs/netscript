# MessageScroller reader-frame fix — design before production change

The broader child merge gate found a real native input race, not a CSS rule
change. The896-case FF/WK run stops at450PASS/1FAIL/1interrupted/444notrun:
WebKit390light's second nativeHome remains at the end. Read-only12native-cycle
diagnostics reproduce11PASS/1FAIL with correct viewport focus, fixed geometry,
a1pixel native step then a jump back. Transparent forwarding of real scrollTo
records the component's own queued measure(true) pulling end-1 back to end.

A corrected, mode-verified private script-response prototype tests actual native
wheel(-1), Home/End and LatestEnter+Space/refocusHome in3engines×2schemes×2widths.
Original code fails8cases(Chromium/WebKit), passes4Firefox; the small reader-frame
candidate passes all12. Both branches load verified bodies at the actual
fixture.js route; no native scroll/key behavior is mocked. The earlier probe
used the wrong JS route and did not apply its candidate; it is preserved as a
precondition failure, not passing/disproving evidence. A previous held-pin idea
was not shipped because it would change endThreshold behavior unnecessarily.

1. Public contract: input-only frames must observe native scrolling and must
   never pull it back to the end. Observer-only growth/resize frames still follow
   only an already-pinned reader. Props/parts/attributes/values, finite threshold
   behavior, native key map, focus, latest action and SSR stay unchanged. No new
   contract field, token, CSS, dependency, listener, port or backend behavior.
2. Vocabulary: readerIntent remains the existing flag consumed by measurement.
   A readerFrame flag separately records that the queued animation frame has
   received user input, even if an early scroll event clears readerIntent. Any
   such coalesced frame is measurement-only; observer-only frames may follow.
3. Ports: existing native wheel/key/scroll events, existing rAF, ResizeObserver,
   MutationObserver and explicit latest action. Never prevent default, replace
   the native scroll controller, add a fixed delay, retry or browser-specific
   production branch. Keep cleanup and one pending frame per instance unchanged.
4. Constants: no new magic values. Existing endThreshold(default1)and key set
   remain byte-identical. Add one effect-local boolean; noteIntent marks it;
   rAF consumes it into the already-existing measure(follow)argument and clears
   it. The pinned.current=!down assignment and every threshold comparison stay
   unchanged. This avoids the rejected sticky-unpin/previous-position redesign.
5. Ordered changes/gates, fewer than30files:
   - SAME selected design review first; current full791Chromium/866package/
     140docs/67CLI all closedPASS on original frozen source. The cross failure
     is preserved and not called green. Record this intentional runtime exception
     to the earlier non-CSS byte-identity assumption before changing production.
   - Add a real native one-pixel wheel regression to existing ai-interaction
     browser spec, before product edits. Fully expose the viewport, use trusted
     wheel(-1)and existing scroll-event quiescence helper, require an actual
     movement away within the SAME1pxthreshold and data-scrollable=up. Retain
     all existing nativeHome/End/latest/focus tests. No event mock, timeout
     increase, sleep, retry, weaker assertion or test exclusion. Observe RED in
     current unmodified Chromium/WebKit first; Firefox may already pass because
     its event ordering differs. Then add readerFrame handling to MessageScroller
     plus one README sentence and regenerate source/assets/build canonically.
   - Refresh scoped product/browser wrappers and focused native AI checks across
     all3engines/bothschemes/3901280, then refreeze and run fresh FULLpackage,
     full maintainedChromium(now795 with added4cases), affectedFFWK(now904)
     and docs140, broaderquality/arch, preflight/accuracy/exports/site/CLI/root,
     exact123TS+1JSONdoc-debt attribution. The old all-pass frozen runs become
     historical source evidence after this runtime/test change.
   - Latest Eric/Cockpit budget policy is measured+about2%, not old4019/473.
     Current104component CSS is335569raw/44751gzip, unchanged by this runtime
     fix. Use literal ceil(measured×1.02):342281raw/45647gzip for this snapshot,
     each field with the exact dated2488ownerreason. Keep every byte/equality/
     gzip/assertion/5MBlogic. Add REAL authored+carrier CSS comment bloat controls
     that independently exceed raw and gzip limits; configured gate must reject,
     then restore exact source/carrier hashes and pass. No self-adjusting cap at
     runtime. Remeasure again after remainingDesktop/harness source is complete
     for final full-scope2%caps; do not label this interim snapshot final READY.
   - SAME source review, merge source commit, all4carriers/sixcommands, generated
     delta/current-head quality/nativepublish0slow after ALL generators/browsers
     close, SAME evidence review, privacy/a907ancestor assertion/plainpush2538.
6. Deferred: no other scroll controller redesign, new gesture state machine,
   scrollend dependency or altered pinning/threshold policy. No style extension
   implementation in this correction. FourDesktop audits, productionx/all-style
   harness and finalwholephase runtime/eval/exact-headCI still required. The
   latest owner accepts greenORpolicy-skippedCI, never failed/pending. No early
   READY/final report, PR merge, release, label or19promotions.
7. Contributor path: existing MessageScroller section in packages/fresh-ui/README.md,
   MessageScroller implementation and its native ai-interaction browser cases.
   Private prototypes/raw failures stay private; public notes use counts/portable
   paths only. This change restores the already-documented native input ownership.
