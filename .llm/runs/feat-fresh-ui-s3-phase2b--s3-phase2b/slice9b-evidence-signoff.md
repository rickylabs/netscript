# Independent slice9b evidence sign-off

PASS (slice 9b evidence reconciliation at source commit `8c5bcc25`; no READY)

The public evidence matches the reviewed source and the gate set. The carriers were run in the right order relative to the source commit, and the run directory is clean.

- **Tests** (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9b-validation.json`):
  - 354 contract and primitive tests and 18 installed-registry tests passed, with nothing failed or ignored and exit code 0.
  - The 21 browser cases passed with nothing ignored and no flaky results, including one real touch drag, and with zero serious or critical axe findings.
  - The browser scope is recorded as Utility/studio-utility, light/dark at 390/1280, plus touch at 390, so it doesn't overclaim.
  - The lifecycle checks are recorded: real pointer capture before a direction change, hiding at zero extent, restore, unmount, and the component's own observer counts.
- **Wrappers:** source check, lint and format passed on 11 files each with nothing dropped, which also fills the gap I noted in 9a. The browser check, fixture check and lint also passed.
- **Other gates:** quality/architecture, preflight, docs accuracy and docs export drift all passed with exit 0. The docs site build is explicitly marked not applicable because the docs site didn't change, which is the right way to record it.
- **Publication** (`slice9b-publication-audit.json`):
  - The raw doc-lint still fails (exit 1, 124 diagnostics), attributed to accepted debt #2531.
  - The 123 TypeScript diagnostics match exactly, with 0 new, 0 removed and 0 new for the `primitives` entry point.
  - The native publish dry-run passed with 0 slow types.
  - `runtimePublishProof: false` and `ready: false` keep the claims honest.
- **Carriers:** `gen:mcp-export-corpus` and `gen:publish-assets` were followed by all four freshness checks, all exit 0 at source commit `8c5bcc25`. Since then only public evidence and carriers have changed, so the order is right.
- **Inventory:** 104 total, 91 shipped, 13 pending, 119 native items.
- **Budget:** 23 source files plus run metadata is inside the 30-file limit.
- **Privacy:** no absolute home paths or UUID-style identifiers in the phase 2b run directory. `wholePhase2b` stays `IN_PROGRESS`.

Before slice 9c begins, run the privacy audit, then the evidence commit, the push and the PR comment.
