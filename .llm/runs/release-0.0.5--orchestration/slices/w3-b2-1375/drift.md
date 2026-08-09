# Drift Log — W3-B2 #1375 MCP documentation corpus plumbing

## 2026-08-09 — PLAN-EVAL corrections before implementation

- **What:** The evaluator identified textual overlap with #1376 in two files, a setup-error risk in
  not-yet-existing-symbol REDs, inconsistent byte-budget notation, and an incorrect docs file count.
- **Source:** PR #1401 PLAN-EVAL comment `5229304606`.
- **Expected:** Symbol-level separation; S1 included future adapter/generator assertions; “256 KiB”
  and `256_000`; 171 release docs files.
- **Actual:** Both branches edit `packages/mcp/cli.ts` and `packages/mcp/README.md`; future-symbol
  tests belong in S2; exact budget is 262,144 bytes; provenance lists 166 files.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Updated `plan.md`, `research.md`, `worklog.md`, and `plan-eval.md` before any product
  source or test implementation.
