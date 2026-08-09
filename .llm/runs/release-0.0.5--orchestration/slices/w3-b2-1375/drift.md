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

## 2026-08-09 — aggregate fitness roots do not cover the changed MCP package

- **What:** The planned repository-wide quality/doctrine gates executed successfully but their root
  lists do not inspect this slice's MCP changes.
- **Source:** Orchestrator measurement and issue #1403.
- **Expected:** `quality:gate` and `arch:check` provide slice evidence for publishable MCP/CLI work.
- **Actual:** Quality scan covers owned CLI source but omits MCP; architecture check covers neither
  owned package. Direct MCP scans are required.
- **Severity:** major gate-coverage debt, external to #1375.
- **Action:** report; do not change stable-cut root lists. Fix only findings in this slice's lines.
- **Evidence:** Direct quality scan exited `0` with no findings/allowances. Direct doctrine exposed
  and led to repair of the owned `tool-contracts.ts` A8 line-cap regression; rerun exit `1` contains
  only untouched pre-existing F-16/A9/A14 findings assigned to #1403 triage.
