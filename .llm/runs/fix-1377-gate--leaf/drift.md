# Drift Log: #1377 gate half

Append-only.

## 2026-08-12 — strict direct-subcommand census finds four additional prose gaps

- **What:** Executing the existing public command catalog and checking root/immediate-child paths
  against the public CLI reference surfaces found four paths with no exact occurrence:
  `netscript deploy start`, `netscript deploy stop`, `netscript deploy status`, and
  `netscript deploy uninstall`.
- **Source:** `createPublicCommandRegistry()` materialized through `PublicCliCommandCatalog`; focused
  search over `docs/site/reference/cli/commands.md`, `docs/site/cli-reference.md`, and `docs/site`.
- **Expected:** PR-C had landed all content required for the strict subcommand gate to be green.
- **Actual:** 87 of 91 root/direct-child paths have an exact occurrence; these four do not.
- **Severity:** significant.
- **Action:** defer to PR-C/orchestrator as a sequencing dependency. PR-D will neither author the
  prose nor weaken the predicate. PLAN-EVAL must assess the boundary before implementation.
- **Evidence:** `research.md` finding 9; `plan.md` D-7.
