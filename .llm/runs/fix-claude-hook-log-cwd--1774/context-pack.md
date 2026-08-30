# Context Pack: Claude hook cwd independence

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`       |
| Branch         | `fix/claude-hook-log-cwd-independent` |
| Current phase  | `implementation / S4 GREEN`           |
| Archetype      | N/A — repository agentic tooling      |
| Scope overlays | none                                  |

## Current State

S3 is pushed at `f8e6ad0c94381e8fe9d5d50e8ec94c5d5a9e3139` with the required historical RED. S4
applies the plan-evaluated exec-form and launch-root-output repair. The S3 fixture blob remains
`fbabb838c26a601cf50ef9b1ade4cc9d16ffbb83` and now passes all nine cases. The mandatory Claude
surface gate and its machine-readable invocation both exit 0 with the hook lock check green.

## Completed

- Loaded all owner-selected skills and the harness activation/run-loop/plan-gate authorities.
- Verified clean tracked baseline, no upstream branch, valid GitHub identity, and issue #1774.
- Re-derived both event failures and recorded raw output.
- Corrected `${CLAUDE_PROJECT_DIR}` to its documented session launch-root contract; it does not
  follow `EnterWorktree`.
- Confirmed minimum permission classes and deferred the sibling `wslHome()` defect to #1776.
- Locked `plan.md` and the complete `worklog.md` Design checkpoint.
- Selected PLAN-EVAL as an owner-required hard stop.
- Synchronized draft PR #1775 to `status:plan-eval` with milestone `0.0.7`, the required labels, and
  a PLAN phase comment; no evaluator was dispatched.
- Preserved `plan-eval.md` bit-identically while amending only generator-owned run text.
- Left the branch on its original base; the owner reports current `main` is inert for this surface
  and explicitly prohibited rebasing.
- Received separate-session cycle-2 PLAN-EVAL `PASS` and fast-forwarded to its artifact-only verdict
  commit without altering either evaluator-owned file.
- Added the S3 live-configuration fixture for both handlers, both cwd classes, positive RED decoys,
  negative GREEN decoys, bounded permissions, and the exact six-file host-path scan.
- Applied the evaluator-requested Markdown formatting correction to `research.md` and included it in
  this slice's full changed-file format receipt.
- Committed and pushed S3, posted its PR slice evidence, and moved the draft PR to exactly one
  `status:impl` label.
- Converted both live handlers to host-neutral exec form with the exact named env/write contract.
- Anchored event output to the session launch root when `CLAUDE_PROJECT_DIR` exists, retaining cwd
  only for direct non-Claude invocation.
- Aligned the direct task, validator child command, logger help, and agentic README.
- Reconciled two pre-existing stale generated Claude skill mirrors with the canonical sync task so
  the mandatory aggregate gate is reproducibly green.

## In Progress

- Commit and push the S4 GREEN repair without altering the S3 fixture.

## Next Steps

1. Preserve the S4 repair as an independently pushed commit and PR slice comment.
2. Run the complete S5 structured gate set, including the usable root test.
3. Stop for supervisor Tier-A and separately dispatched IMPL-EVAL; do not self-evaluate.

## Key Decisions

| Decision                          | Source               | Notes                                                                           |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Combined settings + logger repair | `research.md`        | Settings-only and script-only are each incomplete.                              |
| Launch-root-only repair           | `plan.md` D1/D3      | Session launch checkout wins over nested/foreign cwd; no `EnterWorktree` claim. |
| `wslHome()` deferred              | `plan.md` D9 / #1776 | Confirmed sibling defect; tracked launcher contract.                            |
| Exact permission contract         | `plan.md` D5         | Three named env keys, launch-root hook-log subtree, no read grant.              |
| Unchanged RED→GREEN fixture       | `plan.md` D7–D8      | Both events; nested failure plus reachable decoy RED/GREEN evidence.            |

## Files Changed

S4 changes the five planned product/config/doc files plus the two deterministic generated Claude
skill mirrors required to make the mandatory pre-existing sync check green. It updates only
generator-owned run artifacts beyond that; `.github/workflows/**` and launcher/home code are
untouched.

## Gates

| Gate family | Current status | Evidence                                                       |
| ----------- | -------------- | -------------------------------------------------------------- |
| Static      | GREEN          | Unchanged fixture: exit 0, 9 passed, 0 failed.                 |
| Fitness     | GREEN          | Claude surface public + JSON gates exit 0; lock unchanged.     |
| Runtime     | GREEN          | Launch-root, nested-cwd, and decoy cases pass for both events. |
| Consumer    | NOT_RUN        | No published package/plugin consumer surface.                  |

## Open Questions

- None. The repair is locked by the passed plan gate.

## Drift and Debt

- Drift: the corrected launch-root premise, owner-selected planning route, and repo-REST PR-sync
  fallback are recorded in `drift.md`. The fetched `origin/main` moved beyond the owner-stated SHA,
  but a path audit confirms no hook-owned surface drift; the branch remains intentionally unrebased.
  The mandatory gate also exposed two baseline-stale generated skill mirrors; their deterministic
  canonical sync is recorded as S4 drift.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
