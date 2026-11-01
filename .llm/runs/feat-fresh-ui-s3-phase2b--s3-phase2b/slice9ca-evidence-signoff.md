# Independent9c-a evidence sign-off

PASS (slice 9c-a evidence reconciliation at source commit `1de3962b`; no READY)

The public evidence matches the reviewed source, including the final `navLabel` change, and the gate set. The carriers and quality receipt were recorded after the commit, in order, and the run directory is clean.

- **Tests** (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9ca-validation.json`):
  - 418 related contract, runtime and registry tests, 3 final installed-consumer tests and 356 final contract-catalog tests passed, with nothing failed or ignored.
  - The 40 Chromium browser cases passed with nothing failed, ignored or flaky. The scope is recorded honestly: Utility/studio-utility at light/dark × 390/1280, a focused 768 case, the exact 640/641 and 1024/1025 transitions, and RTL at 390.
  - Firefox and WebKit each passed 1 case, explicitly limited to custom-control availability, malformed requests and two-shell isolation, with no product test skipped.
  - The Fresh production consumer passed 2/0 at 390/1280.
  - Zero serious or critical axe findings, zero allowances, 24 captures.
- **Wrappers:** source check, lint and format passed on 12 files each, plus the browser check, fixture check and lint, and the final catalog check, all with nothing dropped.
- **Gates at the committed source:** quality/architecture passed with exit 0 at `1de3962b`, and preflight, docs accuracy and docs export drift passed. The docs site build is explicitly not applicable.
- **Publication** (`slice9ca-publication-audit.json`):
  - The raw doc-lint still fails with 124 diagnostics; the 123 TypeScript diagnostics match exactly, with 0 new and 0 removed, under debt #2531.
  - The native publish dry-run passed with 0 slow types.
  - `runtimePublishProof: false` and `ready: false`.
- **Carriers:** `gen:mcp-export-corpus` and `gen:publish-assets` were followed by all four freshness checks, all exit 0 at `1de3962b`. Since then only public run records have changed.
- **Inventory and budget:** 104/91/13 with 120 native items (one support library). 27 source files is inside the 30-file limit, and the run metadata doesn't count toward it.
- **Privacy:** no absolute home paths or UUID-style identifiers in the phase 2b run directory. The owned consumer process is stopped and the raw captures stay private. `wholePhase2b` stays `IN_PROGRESS`.

Non-blocking: `slice9ca-review.md` only holds the first source PASS. Append a one-line record of the final `navLabel`/desktop-toggle change PASS, so the public review trail shows the exact bytes that were committed.

Next come the evidence commit, push, PR comment and reconcile note, then 9c-b (StatsGrid/DataTable audit). The AI, Docs, Desktop, extension and harness slices and the final gates are all still required.
