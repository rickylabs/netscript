# Independent supporting9c0 evidence sign-off

PASS (supporting slice 9c0 evidence reconciliation at source commit `216a55f6`; no READY)

The public evidence matches the reviewed source and the gate set. The carriers ran in order after the source commit, and the run directory is clean.

- **Tests** (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9c0-validation.json`):
  - 357 adapter and contract tests and 42 runtime tests passed, with nothing failed or ignored and exit code 0.
  - The 117 browser cases passed with nothing failed, ignored or flaky, including the 32 new ownership cases, and with zero serious or critical axe findings.
  - The scope is limited to Utility/studio-utility at light/dark × 390/1280 plus the related touch controls, and the platform-control protocol is recorded: real adjacent Escapes with no DOM evaluation in between, `[true, false]`, exactly one `native-close`.
- **Wrappers:** source check, lint and format passed on 4 files each with nothing dropped, as did the browser check, fixture check and lint.
- **Other gates:** quality/architecture, preflight, docs accuracy and export drift passed. The docs site build is explicitly not applicable.
- **Negatives first** (`slice9c0-negative.json`):
  - It records `productionEditedBeforeNegative: false`.
  - Both expected failures are recorded: the controlled cancelable Escape refusal, and the forced close with an unchanged parent render, which showed one `native-close`, one wrong `escape-key` and no reopen.
- **Publication** (`slice9c0-publication-audit.json`):
  - The raw doc-lint still fails (exit 1, 124 diagnostics).
  - The 123 TypeScript diagnostics match exactly, with 0 new and 0 removed, attributed to accepted debt #2531.
  - The native publish dry-run passed with 0 slow types, and `ready: false`.
- **Carriers:** `gen:mcp-export-corpus` and `gen:publish-assets` were followed by all four freshness checks, all exit 0 at `216a55f6`. Since then only public evidence has changed, so the order is right.
- **Inventory:** 104/91/13/119 unchanged.
- **Privacy:** no absolute home paths or UUID-style identifiers in the run directory. `wholePhase2b` stays `IN_PROGRESS`.

Non-blocking: in `slice9c0-negative.json` the top-level `failed: 1` doesn't match the two failing cases listed. Make the summary 2 failed, or label the top level as "first observed failure", so the counts agree.

Next, run the privacy audit, then the evidence commit, push and PR comment. After that, the 9c-a shell design checkpoint is the next review. No phase 2b completion is implied.
