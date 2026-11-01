**FAIL_FIX**: Docs 11b1 source review, round 1. That's the 26 frozen source paths on the `3e88d487` working tree. The failure streak is now 1. A second consecutive terminal failure on this leaf ends the loop and goes to the owner, with no third attempt.

There is one material blocker. The rest of the unit is sound.

**Blocker: passive tracking picks the wrong scroll container, so `observe` reports the wrong section in the shipped inset Shell**

- **Where:** `packages/fresh-ui/registry/lib/section-navigation.ts:57-63`. `scrollport()` returns the nearest ancestor whose computed `overflow-y` matches `auto|scroll|hidden`, with no check that it actually scrolls.
- **Why that's wrong:**
  - `overflow: hidden` boxes that never scroll match.
  - So does `overflow-x: hidden` alone, because CSS turns the other axis's `visible` into a computed `auto`. That's a common page-wrapper pattern.
- **The shipped case:** Fresh UI's own `SidebarShell` with `sidebarVariant='inset'` sets `.ns-dashboard__main { overflow: hidden }` (`packages/fresh-ui/registry/styles/layouts.css:610-616`). That main area grows with its content, and the document does the scrolling.
- **What happens there:**
  - `scrollBounds()` (lines 66–76) measures against `main`'s moving box rather than the viewport.
  - `end` is always true, because `scrollHeight - clientHeight - scrollTop <= 1` holds for a box that can't scroll.
  - The end-of-scroll branch (line 171) then qualifies every heading inside `main`'s box. The last linked heading becomes the proposed current at every viewport position, and the crossing test compares against a top edge that moves with the page.
  - `AnchorNav` pinning goes through `scrollport(element)` (lines 182–190) and gets the same wrong bounds.
- **Why it blocks:** this breaks the unit's core optional feature in the original Shell Toc integration, inside a shipped composition. The current tests use only a real window scroller and a real nested scroller, so they don't catch it.

**Required fix**, inside the existing 26-path unit with no new API
1. **Red first.** Add browser regressions that fail on the current source, in Chromium plus focused Firefox and WebKit:
   - a real `SidebarShell` in `docs` layout with `sidebarVariant='inset'`, with Toc and AnchorNav set to `observe` and the headings in content;
   - a plain caller wrapper with `overflow-x: hidden` that doesn't scroll.
   - In both, scroll the *window* and assert that current follows the heading crossing the viewport top, including offsets. Assert end-of-scroll selects the last section only at the real document end, and AnchorNav `scrolled` only when actually pinned. Cover LTR and RTL at 390 and 1280.
2. **Pick the scroll container that actually scrolls.**
   - Choose the nearest ancestor whose computed `overflow-y` isn't `visible` or `clip` *and* which actually overflows in the block axis (`scrollHeight > clientHeight`, within 1px). Otherwise use the viewport.
   - Apply the same rule to target tracking and AnchorNav pinning.
   - Keep the real nested-scroller case, the pixel and percentage `scroll-padding`, `scroll-margin` and end-of-scroll exactly as they are.
   - Use no sentinel DOM, layout writes or engine branch.
   - A target's scroll container can change from scrollable to not, through content or resize. Make sure the ResizeObserver and MutationObserver rediscovery re-evaluates it, so the choice isn't cached forever.
3. **Fresh gates on frozen bytes.**
   1. The red-first controls archived as expected failures.
   2. The focused cases in all three engines.
   3. The full package suite.
   4. Full Chromium, the affected Firefox/WebKit Docs and Shell files, and the dedicated docs suite.
   5. Wrappers with 0 dropped.
   6. Quality, preflight, docs accuracy and export drift, and native publish with 0 slow types.
   7. The exact #2531 doc-lint comparison.
   8. This same source review.

   Every current 786, 731, 184 and 140 run becomes historical.

**Everything else holds, with no other blockers**
- **Toc** (`registry/components/ui/toc.tsx`):
  - native links with no `preventDefault`, hash, focus or scroll writes;
  - `Item.state` preview limited to `rest | hover` and overridden by the root-owned `current`;
  - owned attributes written after the spread (lines 48–57 and 124–138);
  - one responsive branch, with focus handed off only within its own branch;
  - a native uncontrolled `details` whose `open` is never written;
  - the summary marker only when a measured current exists.
- **AnchorNav** (`anchor-nav.tsx`):
  - the discriminated `observe`/`state` union, with measured state winning at runtime (line 97);
  - `data-state` and `data-level` stripped from links;
  - native links only.
- **The shared library:**
  - same-document resolution by origin, path and query, with safe decoding;
  - discovery by ID with no selector interpolation;
  - nearest-root ownership through `closest('nav, [role="navigation"]')`;
  - controlled `null`, equal-candidate suppression and refused-candidate deduplication;
  - the initial hash proposed once after hydration;
  - the measured label and pinning tied to the accepted ID;
  - complete cleanup of the frame, observers and listeners.
- **Composition and evidence:**
  - Shell composes through its existing slots at the caller;
  - no L2-to-L2 imports, tokens, dependencies or locks;
  - the four red-first controls and evidence honestly labelled.

**Next**
1. Make the scroll-container fix and the red-first regressions.
2. Run the fresh gates.
3. Bring it back to this same source review for round 2.

No commit or push before that.

Still required after that:
- **11b2:** RuledGrid and Hero, the actual Desktop audit.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the IMPL-EVAL and green CI at the exact head.

No READY.
