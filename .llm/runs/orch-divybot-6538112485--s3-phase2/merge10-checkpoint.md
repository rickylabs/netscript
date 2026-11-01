# Owner-authorized merge integration — new review loop

The preceding loop ended at FAIL_PLAN / FAIL_RESCOPE and remains terminal.
Cockpit now explicitly authorizes the missing policy decision: consolidate first,
then raise raw/gzip caps only by measured growth if needed, with the exact gap
reason beside the constant. This opens a new authorized integration loop; it is
not a third attempt to approve the rejected inventory-credit proposal. Keep the
SAME separate evaluator; no new reviewer/session. New-loop failure count: 0.

## Exact owner decision

> COORDINATOR (Cockpit): main now has PR 2558 (6a6a82e15): Utility CSS consolidated under one scope with native nesting, plus raw and gzip size budgets in packages/fresh-ui/tests/publish-size.test.ts (gzip headroom only 473 bytes). When you merge origin/main (plain merge, never rebase or force-push), your new components will likely break that budget. Fix order: (1) apply the 2558 consolidation pattern to your new components' Utility selectors (native nesting under the single scope); (2) only if it still does not fit, raise the raw and gzip limits by the measured amount with a one-line reason at the constant: gap components from #2488. Never weaken or skip the check. Then post READY with the head sha on #2416.

1. Public surface: preserve all approved component props, parts, variant values,
   keys, callbacks, CSS selector/declaration meaning and current main changes.
   No token value, dependency/version/lock, native SDK, runtime or API change.
   The only gate-policy change allowed is a measured raw/gzip cap increase after
   consolidation. The full component/extension/runtime objective remains intact.
2. Vocabulary: a merge commit retains published remote ancestry. The old
   unpublished rebased candidate is backup-only. Native nesting factors an
   identical existing selector into a single scope while preserving specificity,
   ordered rules and media order. Do not add a new theme predicate to unscoped
   base component rules or replace the root with zero-specificity where().
3. Ports: raw Git fetch/merge/plain push; current canonical registry and carrier
   generators; native CompressionStream and the existing size test; browser
   ordered CSSOM comparison plus real fixtures and configured structured gates.
   Existing same read-only Opus5.5 high evaluator remains the review port.
4. Constants: retain original main caps220000raw/27000gzip until a consolidated
   candidate is actually measured. Main0af8 payload215981raw/26527gzip leaves
   4019/473headroom. If a kind still fails, add only its measured total CSS growth
   over that baseline to its original cap, preserving that existing headroom,
   with a one-line reason at the constant: gap components from #2488. Do not add
   arbitrary headroom, credits, skips, exclusions or flags. If a kind fits, keep
   that kind's original limit. The original five-MB gate stays unchanged.
5. Ordered commits and gates:
   - Start parent delivery from actual remotec5877ff8 on a new local integration
     branch. Preserve the old local parent31bc1b74 and carrier stash/private
     exact copy; leave unknown native diagnostics untouched. Carry all stop and
     owner-policy records into the integration run before changing source.
   - SAME PLAN-EVAL first. Then plain merge origin/main0af8. Resolve only known
     maintained syntax overlap by preserving both main consolidation and our
     reviewed feature behavior; regenerate derived conflicts from source. Prove
     main-only/non-CSS preservation and3locks. Never push a rewritten lineage.
   - Consolidate repeated existing Utility-root selectors, including reviewed
     CodeBlock edits. Inspect every added component CSS. Where its existing
     class scope is factorizable, use native nesting without changing selector
     meaning; keep BEM siblings/global rules/media order independent. Record
     files with no repeated Utility root as already not duplicating that scope.
     Ordered CSSOM must match the reviewed pre-merge parent for all74CSSfiles;
     actual Utility/legacy browser acceptance must remain intact.
   - Generate assets and execute the real unchanged size gate at old caps after
     nesting. Only an observed overrun triggers the authorized measured increase.
     Run the final gate, independent raw/gzip overrun negative controls and
     source/carrier inventory equality; restore exact hashes and positive gate.
   - Fresh integrated parent package, source wrappers, broader quality/arch,
     browser/docs, preflight/accuracy/exports, all4carriers and native publication
     at actual source HEAD; SAME source/evidence review, public audit, assert
     remote ancestry and plain push HEAD to existing PR2488 branch. Comment.
   - Child original lineage1afd50cb already contains remotea907 and reviewed
     Desktopc3d. Merge the published parent into it, never rebase; preserve its
     17 added identities,6Desktop API contracts and existing owner x policy.
     Apply the same consolidation/measure-first policy to the full child and
     repeat applicable fresh integrated gates/SAME review/audit/plain push2538.
6. Deferred: integration does not complete11b3b(the four remaining Desktop
   audits),12a/12b(production declared x extensions and every-style base/extension/
   keyboard harness),or13(whole-phase runtime/final review/exact-head greenCI).
   Resume those only after this integration is terminal. No READY or canonical
   final report until the entire assignment is implemented and verified. Owner's
   later19promotions remain after Utility canary. No merge/tag/release by us.
7. Contributor path:packages/fresh-ui/README.md and existing publish-size.test.ts
   explain maintained surface and actual byte gate; this checkpoint records the
   owner policy and integration preservation. No new abstraction or credit list
   in test code. All raw transports/receipts remain private; public audit reports
   verdict/counts only, with portable paths and no session IDs/thumbprints.
