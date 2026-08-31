# Context Pack — S11 Public docs + README refresh for Aspire 13.5

- Branch: `docs/aspire-13-5-s11-public-docs-refresh`
- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s11`
- Corrected stack base: `c9e3fcbe8` (`test/aspire-13-5-s10-e2e-gate-upgrades`)
- Replayed range: 11 S11 commits formerly above old S10 head `a46ea16d0`; replay head
  `744473576`
- PR: #1771 (stacked on S10)
- Scope: 6 slices covering manifest sweep, dedicated Aspire pages, #1642 detached start how-to, observability/skills/reference/README/CONTRIBUTING update, terminology normalisation (#1000), diagram review, asset generation/gates, convergence rebase, docs_audit fixes, and main #1772 reconcile.
- Manifest coverage: 121 of 121 S11-owned manifest rows evaluated and recorded in `manifest-disposition.md` (0 deferred).
- Status: D-137 un-stack completed on corrected S10. Exact stacked ancestry, 11-commit range,
  range-diff mapping, zero overlap with 36 stale S5/S6/S8/S10 lineage commits, assets-barrel,
  scoped check/lint/fmt, repo-wide check (`failedBatches: 0`), docs links/build/accuracy/tests,
  publish assets, and Aspire version parity (`fail: 0`) are verified. The optional
  `check:agent-docs-prose` freshness check exits 1 because conflict rule 1 deliberately retains the
  corrected-S10 `prose.json.gz` and `provenance.json`; those generated files were not regenerated.
  No runtime, Aspire, Docker, AppHost, E2E runtime suite, PLAN-EVAL, evaluator rerun, or PR-base
  retarget was performed.


