# Independent merge PLAN-EVAL — PASS

**PASS**: the merge-integration plan in `merge10-checkpoint.md` is ready to carry out, with four binding conditions. This is a new loop opened by an explicit owner decision, not a third attempt at the per-identity credit plan that ended at `FAIL_PLAN` / `FAIL_RESCOPE`. The new loop's failure count stays at 0.

**Why it holds**
- **It resolves the escalated conflict on the owner's own terms.** The Cockpit grant quoted at lines 10–12 is the missing policy decision: plain merge, consolidate first with #2558's native nesting, and only if the check still fails, raise the raw and gzip limits by the measured amount with the stated one-line reason. Never weaken or skip the check.
  - The plan adds nothing beyond that: no credit list or abstraction in test code, no exclusions, skips or flags.
  - The byte inventory, the authored and shipped equality, both kinds of check and the 5MB cap stay unchanged.
- **Lineage is safe.**
  - It starts from the actual remote `c5877ff8` on a new local branch and plain-merges `0af8fd9e`, with no rebase or force-push.
  - The old rewritten `31bc1b74`, the carrier stash and its private copy, and the child lineage `1afd50cb` (containing remote `a9078d68` and the reviewed `c3dba2ce`) are all preserved.
  - Remote ancestry is asserted before any push, and the unknown diagnostics are left alone.
- **The order is right.** Consolidate, then prove CSSOM parity, then measure with the *unchanged* gate at the old caps. Only an observed overrun triggers the increase, and only for the kind that fails. Then come the raw and gzip overrun negatives, the restore and the final positive gate.
- **The cap formula is anchored to the actual measurement.** For each failing kind, new cap = original cap + (consolidated measured payload − main's 215,981 / 26,527). That's a measured amount, keeping main's existing 4,019 / 473 headroom exactly, with nothing arbitrary added.
- **Semantics are protected.** No new theme predicate on unscoped base rules, no root of zero specificity, BEM siblings and global and media order kept independent, and ordered CSSOM parity over all 74 files plus real browser acceptance.

**Binding conditions**
1. **Nest only under main's exact single root selector.**
   - Nested specificity is computed as if the parent were wrapped in `:is()`. That's identical for main's one compound selector `:root:is([…], […], […])`, but nesting under a *selector list* would take that list's maximum specificity for every rule.
   - So the parent must always be exactly main's single compound root. Never nest under a list, and never add `:where()`.
   - Your CSSOM comparison must expand nested rules to their absolute selectors and also compare each rule's computed specificity against the reviewed pre-merge parent. Matching text alone isn't enough.
   - Enumerate any CSS semantic change that comes from main. Zero is expected, since #2558 is syntax-only. Record files whose Utility root appears only once as not consolidated.
2. **Make the cap change transparent.**
   - The comment at each raised constant uses the owner's exact line: `gap components from #2488`.
   - Disclose in the #2488 body and comment: main's baseline, the consolidated measured payload, the measured growth, the resulting cap and the unchanged headroom.
   - State the interpretation plainly: "measured amount" means measured CSS growth over main's baseline, so main's headroom is kept rather than consumed.
   - A kind that fits keeps main's original constant.
3. **The child gets its own measurement.**
   - After the published parent is merged into `1afd50cb`, consolidate the child's 17 identities with the same rule, then measure again with the unchanged gate at the parent's caps.
   - Raise only by the child's *additional* measured growth over the merged parent payload, and only for a kind that fails.
   - The one-line reason may name both PRs, for example `gap components from #2488 and #2538`, since the grant covers "your new components". Keep it to one line, with the same disclosure on #2538.
   - Run the 0-credit negatives, the restore and the positive gate again.
4. **Don't post READY.** The grant ends with "Then post READY with the head sha on #2416". That conflicts with the assignment's own rule: READY only after the whole goal is done and every required check is green at the exact head, while 11b3b, 12a/12b and 13 remain.
   - Don't silently ignore it, and don't comply either.
   - After each integration push, post a status comment, with `Refs #2416` only, stating:
     - the merged head;
     - the measured cap disposition;
     - that READY is withheld until the remaining units and green CI at the exact head are done;
     - that the instruction was seen.

**Next**
1. Plain merge `0af8fd9e` onto the remote-based branch.
2. Resolve only known overlaps, preserving both sides, and regenerate derived files.
3. Prove main-only and non-CSS preservation and the three locks.
4. Consolidate, then prove CSSOM parity including specificity.
5. Measure at the old caps, and only then apply any authorized increase.
6. Run the negatives, the restore and the positive gate.
7. The fresh integrated gates at the actual head, the same source and evidence review, the public audit, the ancestry assertion, the plain push to #2488 and the comment.
8. Then the child, under the same discipline.

Still required after integration:
- **11b3b:** the four remaining Desktop audits.
- **12a/12b:** the production declared x-extensions and the all-style base, extension and keyboard harness.
- **13:** the whole-phase runtime run, the final IMPL-EVAL and green CI at the exact head.

No READY, labels, closing keywords, merge, tag or release by us, and no early promotions of the 19 future items.
