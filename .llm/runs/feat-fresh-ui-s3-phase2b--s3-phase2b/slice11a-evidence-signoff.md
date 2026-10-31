# Independent Docs11a committed-source evidence review

PASS (slice 11a evidence reconciliation at source commit `dbcb96ff`; no READY)

The public evidence matches the reviewed source and reports the carrier result truthfully. I approve the evidence-only commit, the audited normal push and comment, and then the parent and child rebase recovery.

- **Carrier count is truthful:**
  - `slice11a-validation.json` records `sourceFiles: 28` and `generatedCarriersAfterSource: []`. That matches your raw clean status before the evidence edits.
  - The Icon corpus change I said might appear didn't happen, and the record says so rather than claiming either a predicted file or a false zero.
  - Either way, the authority is `check:mcp-export-corpus` (with the other three freshness checks) passing with exit 0 against the committed source `dbcb96ff`. That proves the corpus is consistent with the committed source.
  - The only change after my source PASS is the README note on JSON-versus-HTML quote escaping that I suggested.
- **Tests:**
  - 603 final contract and installed tests and 5 current installed tests passed, both with nothing failed or ignored and exit code 0.
  - **Chromium:** 32 cases passed with nothing failed, ignored or flaky. The scope covers real native clipboard write and read of known text, missing and rejected APIs, out-of-order, path, copy and unmount races, native keys and focus, escaped scalars, native nested lists and annotations, real media ratio, width and caption, RTL and long content.
  - **Firefox and WebKit:** 32 cases on the same 8 scenarios with the final CSS. Real native writes pass, read-back is disclosed as Chromium-only (permissions), and it's not full dark or preset certification.
  - Zero serious or critical axe findings, zero allowances, zero console errors, 40 captures.
- **Wrappers:** source check, lint and format passed on 14 files each, plus the browser fixture check (2), spec check (1), lint (3) and format (3), all with nothing dropped.
- **Gates at the commit:**
  - Quality/architecture and native publish (exit 0, 0 slow types) both passed at `dbcb96ff`.
  - Preflight, docs accuracy and export drift passed, and the site build covered 259 pages.
- **Carriers:** all six generation and freshness tasks passed with exit 0 after the source commit.
- **Debt:** `slice11a-publication-audit.json` records `ACCEPTED_EXISTING_FAILURE` under #2531 (raw exit 1, 124 diagnostics, 123 unchanged with 0 new and 0 removed, plus the one JSON limitation). Not called green.
- **Honest status:**
  - Review threads: 0 unanswered.
  - Inventory 104/100/4/129.
  - `runtime` is `NEW_HEAD_UNPROVEN`, `requiredRemoteCI` is `PENDING_DRAFT_CHECKS_SKIPPED`, `wholePhase2b` is `IN_PROGRESS` and `ready` is `false`.
- **Privacy:** no absolute home paths or UUID-style identifiers in the phase 2b run directory.

Non-blocking: set `independentEvidenceReview` to this PASS in the evidence commit.

**Next:**
1. The mandatory public audit, then the evidence commit, normal push and PR #2538 comment.
2. Before any further implementation, rebase the parent onto main `43aa891e` (resolving #2488's conflicts) and restack the child. Keep all combined behavior and main's Utility styling, and send it through the same independent integration review.

11b (Toc/AnchorNav/RuledGrid/Hero, the Desktop audit and the original Shell Toc integration), 12 (the declared extensions and all-style harness) and 13 (final runtime, whole-phase and CI) are still required. No labels and no early promotions.
