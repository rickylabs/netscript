# Drift Log: #1709 lint partial-exclusion fail-closed

Append-only. This leaf's product envelope remains exactly four paths.

## 2026-08-28 — format wrapper has the analogous mixed-batch false green

- **What:** The mandatory read-only audit proved `run-deno-fmt.ts` also accepts a partially excluded
  mixed batch as green and changes verdict with batch size.
- **Source:** Temporary project with `fmt.exclude: ["generated/"]`, excluded unformatted
  `generated/bad.ts`, and included clean `clean.ts`; current wrapper at
  `.llm/tools/run-deno-fmt.ts:420-602`.
- **Expected:** Supervisor research left fmt untested and the leaf contract required a planning
  audit without authorizing mutation.
- **Actual:** Mixed batch reports `filesSelected: 2`, one batch, zero findings, exit 0; identical
  selection at batch size 1 exits 2. An included-path copy of the bad text produces a real format
  finding and exit 1.
- **Severity:** significant
- **Action:** defer; explicit coordinator rescope is required before any fmt source/test mutation.
- **Evidence:** `research.md` findings 9-10 and `worklog.md` planning gate table.
