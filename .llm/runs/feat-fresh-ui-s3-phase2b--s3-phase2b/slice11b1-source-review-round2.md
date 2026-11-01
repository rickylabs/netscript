**PASS**: Docs 11b1 source review, round 2. That's the 26 frozen source paths and the 7 build artifacts on the `3e88d487` working tree, uncommitted and unpushed. My one round-1 blocker is fixed by the right mechanism, I found no new blockers, and the failure streak resets to 0.

**The round-1 blocker is resolved** (`packages/fresh-ui/registry/lib/section-navigation.ts`)
- **The scroll container is now the box that actually scrolls** (lines 57–67).
  - It's the nearest ancestor whose computed `overflow-y` isn't `visible` or `clip` *and* that really overflows in the block axis (`scrollHeight > clientHeight + 1`), otherwise the viewport.
  - So the inset Shell's `.ns-dashboard__main { overflow: hidden }` (`registry/styles/layouts.css:610-616`) and wrappers with `overflow-x: hidden` alone now resolve to the viewport.
  - Real nested scrollers still qualify.
  - The same function is used for target tracking (line 163) and nav pinning (line 186), and it's re-evaluated on every update rather than cached.
- **Changes in eligibility are observed** (lines 142–153). The ResizeObserver watches the complete ancestor chains of the root and every target, including boxes that don't scroll yet. It rebinds only when the identities change. MutationObserver rediscovery stays in place for content and attribute changes.
- **Pinning is tightened** (lines 188–196). It requires a nav with positive height that intersects the real scrollport, and a top within 1px of the port's top plus the computed `top` inset. A sticky nav clipped by a non-scrolling `overflow: hidden` ancestor, or one off screen, correctly stays `rest`.
- **Unchanged:** pixel and percentage `scroll-padding`, `scroll-margin`, end-of-scroll, equal and refused candidate handling, the initial hash, the label and pinning tied to the accepted ID, and complete cleanup. There's no sentinel DOM, layout write, engine branch, new API, token, dependency or lock.

**The evidence is sufficient and fresh**
- **Red first:** 6 intended failures across Chromium, Firefox and WebKit on the real SSR `docs` + `inset` `SidebarShell` and on the plain `overflow-x: hidden` wrapper (`docs11b1-scrollport-red-matrix.json` plus its logs).
- **Corrected focused cases:** 24 passing (8 Chromium + 16 Firefox/WebKit), both schemes, 390 and 1280, LTR and RTL. They cover:
  - window current crossing with offsets;
  - end-of-scroll only at the real document end;
  - an off-screen nav staying `rest`;
  - eligibility changes in both directions driven only by ResizeObserver, through Web Animations, with 0 attribute mutations and 0 scroll events;
  - MutationObserver rediscovery without replacing nodes;
  - the nested, pixel, percentage and end-of-scroll cases kept as before.
- **Fresh broad runs after the fix:**
  - full package 786/0/0;
  - full Chromium 739 including touch;
  - affected Firefox/WebKit 200;
  - dedicated docs 140.

  All have 0 retries, 0 flaky, 0 skipped, 0 new allowances and 0 page or console errors.
- **Other gates:**
  - wrappers: 11 source plus 5+1 browser checks and 6 lint/format, 0 dropped;
  - working-tree quality, preflight, docs accuracy, export drift and docs prose all exit 0;
  - native publish succeeds with 0 slow types and no allowance;
  - site build: 260 HTML pages and 133 registry files.
- Doc-lint is re-compared fresh: the raw 124 under #2531, the exact 123 TypeScript identities with 0 new and 0 removed, plus 1 JSON limitation, not called green.
- The earlier 786, 731, 184 and 140 runs are explicitly historical. The working-tree quality result isn't presented as post-commit certification.

Everything else I approved in round 1 still holds: Toc and AnchorNav APIs and owned attributes, native links and `details`, the single responsive branch with own-branch focus, the discriminated `observe`/`state` union, caller composition into Shell, and registry closure.

**Non-blocking**: when an app makes `body` its scroller (`html, body { height: 100% }` with `body { overflow: auto }`), the loop stops at `body` and measures the viewport, so `end` may read as true. Consider treating `body` as a candidate when it, rather than `document.scrollingElement`, actually overflows, and record the pattern in the README if you leave it.

**Authorized next steps, in order**
1. The source commit with its run context, and no attribution footer.
2. The four canonical carriers, with the actual delta inspected.
3. Quality and native publish at the actual head.
4. The same evidence review.
5. The public audit.
6. Verify the remote, then the explicit-stage push with an exact lease and the #2538 comment, referencing #2416 only.

Still required after that:
- **11b2:** RuledGrid and Hero, the actual Desktop audit.
- **12:** the production declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the IMPL-EVAL and green CI at the exact head.

Runtime and required CI are still unproven. No READY, labels, closing keywords or merge.
