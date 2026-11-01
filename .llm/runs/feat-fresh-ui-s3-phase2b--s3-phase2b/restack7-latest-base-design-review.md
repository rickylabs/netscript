**PASS**: the latest-base addendum is approved as bookkeeping: rebase the parent onto `6a1d84a6`, then replay the child. It must still follow the terminal marker gates and the source review. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The base advance is narrow.** Main's #2554/#2555 change 25 paths: theming guidance, templates, their tests and carriers. Nothing changes in Fresh UI's renderer, CSS, browser source, dependency or import maps.
- **The single preview conflict is derived.** The merge-tree preview against parent `426c5d09` shows one conflict, the generated MCP publish-assets carrier. Regenerating it through its existing canonical generator is the established rule, with no side selection.
- **The order is correct.** First the terminal marker, package and browser gates and the source review, then the reviewed commit. Then the parent rebase, then the child replay.
  - Each push happens only after the public audit has passed, with the remote refs re-checked and an exact lease against `426c5d09…` for the parent and `d0d8d922…` for the child.
- **Reuse is labelled correctly.** The 765, 667 and 320 runs can be reused as predecessor runs on identical source and are never called new runs. Main's CLI, web-scaffold and agent-conventions changes get targeted runs of their own.

**Conditions you must meet**
1. **Byte equality is what permits reuse.** After *each* rebase, compare byte for byte against the reviewed pre-rebase source:
   - all of `packages/fresh-ui/`;
   - all of `tools/fresh-ui-browser/`, excluding test results;
   - the root, Fresh UI and docs `deno.json` and import maps;
   - all three locks.

   Record the counts publicly. Any difference voids reuse for whatever that byte affects, and those runs must happen fresh.
2. **The parent gets its own gates before its push:**
   - main's maintained paths preserved exactly, and topic lock delta 0;
   - the derived conflict regenerated;
   - all four carrier checks;
   - quality and native publish at the actual parent head;
   - main's targeted CLI tests;
   - the same evidence review.

   Child evidence doesn't stand in for parent evidence, and the reverse is also true.
3. **Check the new docs against the topic, not just mechanically.**
   - The new theming page must be accurate for what parent and child ship: Utility family and flavor namespaces, preset and theme names, and the components it mentions.
   - Docs accuracy and export drift are the gate. Any mismatch with the topic is recorded as drift and fixed in topic docs, never by editing main's maintained text away.
   - It must not contradict the locked additive, declared-extension rule for slice 12.
4. **Run the docs browser suite fresh where it applies.** If the docs Playwright suite (`docs.playwright.config.ts`) belonged to the earlier required gate set, rerun it with the 260-page build. Docs content changed, so that reuse isn't allowed. Otherwise state its scope explicitly.
5. **Stop on anything unexpected.** Any maintained conflict besides the publish-assets carrier stops the rebase for a substantive review. That includes a semantic overlap with topic README or guidance files that git merged cleanly.
6. **Refresh at both new heads:**
   - the 260-page docs build;
   - preflight, docs accuracy and exports drift;
   - quality/architecture;
   - native publish with 0 slow types;
   - all four committed-source carriers;
   - main's targeted CLI tests plus the installed Fresh UI consumer cases.

   Doc-lint stays as attributed #2531 debt and isn't called green. Draft-skipped CI isn't green.
7. **Records.** Keep the old base and gate records as dated history. Record the new base, both new heads, the byte-equality counts, and which runs are reused versus fresh.

**Next**
1. Bring the marker work to terminal results.
2. The same source review.
3. The reviewed commit.
4. The parent rebase, its gates and review, then the audited exact-lease push.
5. The child replay, its gates and review, then the audited exact-lease push, and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
