**PASS**: the Restack 7 committed-source evidence at source commit `19d6d1d7` reconciles. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The commit contains exactly the reviewed source.**
  - The 14 reviewed files in `19d6d1d7` match the frozen hashes byte for byte (`restack7-committed-evidence.json`: `committedFrozenSourceDifferences: 0`).
  - No code was edited after the round-2 source PASS.
  - The message is a plain conventional commit with no attribution.
- **The carriers were measured after the commit.** All six generate-and-check commands exited 0: `gen:mcp-export-corpus`, `gen:publish-assets` and the four checks. The generated delta and the tracked working-tree delta are both a measured 0, and no generator touched source, config, locks, schema or pins.
- **Quality and publish ran at the right head.** Durable quality/architecture passes with exit 0 and its `gitHead` is `19d6d1d7`. The native member publish dry run passes with exit 0 and 0 slow types at the same head, without a slow-type allowance.
- **Reuse is labelled correctly.** The render proofs are explicitly labelled as pre-commit working-tree runs on bytes now committed unchanged, never as new runs at `19d6d1d7` (worklog lines 632–642). Those are the 765 package, 675 Chromium and 336 Firefox/WebKit runs plus the focused 72 and the 24 axe-bearing WebKit cases. No rerun is needed because the code didn't change.
- **Failures are retained honestly.** The 763/2 run from the wrong environment, the interrupted runs and the red-first negatives stay recorded in private. Doc-lint remains the raw 124 under #2531, with the exact 123 TypeScript identities plus 1 JSON limitation and 0 new / 0 removed, and isn't called green. Runtime and required CI at the exact head are still unproven.

**Conditions you must meet**
1. **The untracked Chromium core dump in the browser tool directory.**
   - Leaving it untouched because its ownership isn't proven is correct under the repo's leave-it-alone rule for unknown-owner entries.
   - Stage the evidence commit by explicit path only, never `git add -A` or `.`.
   - Confirm it's outside every published package's include set.
   - Point it out to the owner. A core dump can contain process memory, so whoever owns it should decide whether to delete it.
   - Keeping core dumps disabled for future browser launches you own is the right prevention.
2. **The public audit still comes before each push,** covering zero sensitive added lines plus the whole run.

**Authorized, in order**
1. The bookkeeping evidence commit.
2. The approved docs-only reconciliation, after freshly re-checking latest main is still `6a1d84a6`. If main has moved, the addendum's scope has to be reassessed before any base write.
3. The **parent** rebase, compared byte for byte against its *own* pre-rebase head. The comparison covers:
   - every maintained Fresh UI and browser-tool path;
   - the root, Fresh UI and docs configs and maps;
   - all three locks.

   Main's 25 maintained docs and template paths are preserved exactly. Only derived conflicts are regenerated, through the canonical generators. Any unexpected maintained or semantic conflict comes back to this same review. Then the parent's own-head gates:
   - quality and native publish;
   - all four carriers;
   - the 260-page docs build, preflight, docs accuracy and export drift;
   - main's new CLI tests plus the installed-consumer cases;
   - the same evidence review;
   - the public audit, re-checking the remote, and the exact-lease push against `426c5d09…`.
4. The **child** replay onto the new parent, with the same discipline against its own pre-rebase head `19d6d1d7` and its own gates and review. Then the public audit, re-checking the remote, the exact-lease push against `d0d8d922…`, and the #2538 comment, referencing #2416 only.

Earlier render proofs may be reused only where bytes are completely equal, labelled as predecessor runs and never as new ones. No product feature work before the terminal restack push and comment.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the production declared x-extensions and the all-style base, extension and browser harness.
- **13:** the whole-phase one-pass runtime run, the same IMPL-EVAL and green required CI at the exact head.

No READY, labels, closing keywords, early promotions of the 19 future items or merge.
