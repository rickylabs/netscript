# Independent child merge PLAN-EVAL — PASS

**PASS**: the child merge10 plan is approved, with binding gate-sufficiency conditions. It's the same owner-authorized loop, and its failure count stays at 0.

**The plan items that hold** (`merge10-child-checkpoint.md`)
- **Lineage:** plain-merge the published parent `2be80639` into the original `1afd50cb`, which contains remote `a9078d68` and the reviewed `c3dba2ce`. No rebase or force-push, and both backups and the stash are preserved.
- **Nesting:** only main's exact single compound Utility root may be a nesting parent. No lists, new predicates or class-root scopes.
- **Budget:**
  - start from the parent's caps, 282,782 / 36,350;
  - run the *unchanged* gate first;
  - raise only a kind that fails, by child payload minus the parent's measured 278,763 / 35,877, keeping the 4,019 / 473 headroom;
  - the one-line reason is `gap components from #2488 and #2538`;
  - the 1-byte raw and gzip negatives, then the restore and positive gate;
  - the inventory, equality, gzip and both assertions unchanged. The 5MB cap gets no increase: if it fails, stop.
- **Sequence:** the carriers, quality and publish run at the actual head only after generators and browsers close. Then the same source and evidence reviews, the audit, the check that remote `a9078d68` is an ancestor, the plain push to #2538 and the status comment.
- **Labelling:** historical runs stay historical, and integration proof isn't presented as phase-13 acceptance.

**Binding conditions** (sufficiency is decided now, before any code)
1. **Run a fresh full maintained Chromium, not just the affected subset.**
   - This merge brings main's syntax changes across 46 shared CSS files into every child component, and the parent ran full Chromium fresh for its integration (318).
   - Run the full configured Chromium suite on the frozen merged source, including touch and the native-tab and wheel cases once each, with 0 retries, 0 flaky and 0 new allowances.
   - The earlier 791, 200 and 20 runs remain disclosed as old-base history only.
2. **Prove CSSOM parity in all three engines.**
   - Chromium-only parity can't detect a Firefox or WebKit parse difference in relaxed native nesting (`& [data-scope=…]`), which would silently drop a whole nested block.
   - Run the exhaustive ordered-rule comparison of selector, declaration and media plus computed specificity over all 90 CSS files against `1afd50cb` in Chromium, Firefox and WebKit.
   - Include the wrong-list negative control in each engine. Expect 0 differences and 0 invalid parents.
3. **Use the established affected Firefox/WebKit set, not a narrower one.** It's at least the union of the child's earlier cross-engine files:
   - `data-table`, `stats-grid`, `shell`, `native-close`;
   - Desktop window and tray;
   - the docs composition and navigation cases (Toc, AnchorNav, RuledGrid, Hero);
   - CodeBlock and fidelity.

   Both schemes at 390 and 1280, LTR and RTL inside the cases. List the selected files publicly with their counts.
4. **Settle the Window/Tray resolution explicitly.**
   - Enumerate every main Utility rule block for `desktop-window-chrome.css` and `desktop-tray-menu.css` that's absent from the child.
   - Prove each was already absent or replaced in the reviewed `c3dba2ce`, so it isn't reintroduced and there's no new silent deletion.
   - Any Window/Tray Utility rule main added *after* the child's base must be reviewed and kept or combined, not dropped. Expected: none, since #2558 is syntax-only. Record the list in drift.
5. **Prove the non-CSS sources are byte-identical.** Publish a hash comparison of every product TS, controller, fixture, config and lock file against `1afd50cb`, apart from the enumerated main-only and parent-only files. Main-only CLI and docs files must match main exactly.
6. **The rest of the gate list as proposed:**
   - the fresh full package suite, covering all 104 installed copies, SSR, contracts and the publish-size gate;
   - the scoped wrappers with 0 dropped;
   - broader quality/architecture, preflight, docs accuracy and export drift;
   - the site build and dedicated docs 140;
   - the configured root checks and the CLI tests;
   - native publish at the actual head with 0 slow types;
   - doc-lint at the exact 123 + 1 attribution under #2531.

**Next**
1. Commit the checkpoint.
2. Snapshot the original child sources.
3. Plain-merge `2be80639`.
4. Run the gates above in order.
5. This same source review, then evidence review.
6. The audit, the ancestry check and the plain push to #2538.
7. The status comment: merged head, caps, READY withheld and the owner's instruction seen.

Still required after that:
- **11b3b:** the four remaining Desktop audits.
- **12a/12b:** the production declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the final IMPL-EVAL and green CI at the exact head.

No early READY, final report, PR merge, tag, release or promotions of the 19 future items.
