# Context pack

- Objective: implement locked #1354 Slice B only.
- Baseline: `850cc7757d11d420b9061dbe6a61536357ab77fe`.
- Branch: `feat/cli-fresh-manifest-seam`.
- Product ceiling: six enumerated handwritten paths. Owner ruling on 2026-09-02 makes regenerated
  carrier outputs ceiling-exempt; no other handwritten path is authorized.
- PLAN-EVAL: master plan already passed; local PLAN-EVAL is N/A.
- Current phase: implementation, pre-commit gates, lock review, and carrier generation complete;
  ready for the sign-off commit and post-commit carrier checks.
- Ceiling resolution:
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is an
  authorized generated carrier side effect. The original six-file product touch set remains intact.
