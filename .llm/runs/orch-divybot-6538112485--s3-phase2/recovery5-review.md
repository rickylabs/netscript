# Independent rebase review

PASS (integration recovery 5: rebase onto main `d54879b8`, head `640fd2f`)

The merge kept both sides correctly: no conflict markers are left, both debt entries are intact, and nothing was deleted or suppressed.

- **Debt registry (`.llm/harness/debt/arch-debt.md`):**
  - It contains no conflict markers, and none remain anywhere in the tracked tree.
  - Main's `packages/cli — CLI-INSTALL-PERSISTENCE-SELECTION-SHAPE` entry (line 3188) and the topic branch's `packages/fresh-ui — … (fresh-ui-doc-export-baseline-2531)` entry (line 3207) both appear as separate sections.
  - The neighbouring Fresh UI entries from main (`TOKEN-EXPORT-DIRECTORY-CARDINALITY` and the token emphasis style entry) are kept.
  - Entry 2531 stays Open, with its owner, target, linked evidence, cost and closing gate unchanged. No new waiver or suppression appears.
- **Product source:** I can't run a diff with read-only tools. Your report that all 612 files under `packages/fresh-ui` and `tools/fresh-ui-browser` are byte-identical to the backup branch is consistent with the only conflict being the debt registry. On that basis the earlier phase 2a reviews and the IMPL-EVAL still apply to the product source, but their test counts (608 package, 302 browser) were measured on the old base.
- **Scope:** no phase 2b source edits are in this branch, and no READY or runtime claim is made for the new head. The hosted `31cc758` runtime counts remain predecessor evidence only.

Before pushing the rebase (not READY):

1. Rerun the carrier generation and freshness checks against the combined source: prose, corpus, assets barrel and publication carriers. Main's new commits can change shared docs and generated inputs even though no Fresh UI source changed.
2. Get a green full Fresh UI package run on the combined head. Main's guards, such as the colour-role and registry tests, now apply to unchanged phase 2a source, as happened in recovery 4.
3. Record the outcomes in the run's public evidence, as counts and verdicts only with no machine paths. The required remote checks at the reported head stay pending and must not be counted green while draft-skipped.

A fresh 302-case browser matrix isn't required before the push, because no browser-facing source changed. It must still run at the final phase 2a/2b head as part of the normal gates.
