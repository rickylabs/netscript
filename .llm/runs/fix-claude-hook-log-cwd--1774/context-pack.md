# Context Pack: Claude hook cwd independence

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`       |
| Branch         | `fix/claude-hook-log-cwd-independent` |
| Current phase  | `implementation / S3 RED`             |
| Archetype      | N/A — repository agentic tooling      |
| Scope overlays | none                                  |

## Current State

Cycle-2 PLAN-EVAL returned `PASS` at `2e5f50f0`; evaluator artifacts are present through `2cfc0b4c9`
and remain untouched by this generator. S3 adds the unchanged-live-settings fixture and records its
expected RED: launch-root invocations pass, while nested-cwd `PreToolUse` and `Stop` each fail with
`Module not found`. Both temporary-decoy assertions pass, proving the relative command reaches the
exact cwd-relative decoy before the repair.

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

## In Progress

- Commit and push the S3 failing fixture without changing production configuration.

## Next Steps

1. Preserve the RED fixture as an independently pushed S3 commit and PR slice comment.
2. Apply the S4 launch-root repair without editing the S3 fixture.
3. Run the complete S5 gate set and stop for supervisor Tier-A/IMPL-EVAL dispatch.

## Key Decisions

| Decision                          | Source               | Notes                                                                           |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Combined settings + logger repair | `research.md`        | Settings-only and script-only are each incomplete.                              |
| Launch-root-only repair           | `plan.md` D1/D3      | Session launch checkout wins over nested/foreign cwd; no `EnterWorktree` claim. |
| `wslHome()` deferred              | `plan.md` D9 / #1776 | Confirmed sibling defect; tracked launcher contract.                            |
| Exact permission contract         | `plan.md` D5         | Three named env keys, launch-root hook-log subtree, no read grant.              |
| Unchanged RED→GREEN fixture       | `plan.md` D7–D8      | Both events; nested failure plus reachable decoy RED/GREEN evidence.            |

## Files Changed

S3 adds `claude-hook-log_test.ts` and updates generator-owned run artifacts only. Product/config
implementation files remain at baseline until the RED commit is pushed.

## Gates

| Gate family | Current status | Evidence                                                               |
| ----------- | -------------- | ---------------------------------------------------------------------- |
| Static      | RED            | Structured fixture: exit 1, 7 passed, 2 nested-cwd failures.           |
| Fitness     | PARTIAL        | Host-path and current permission assertions pass; GREEN gates pending. |
| Runtime     | RED            | Both launch-root cases and both decoys pass; both nested cases fail.   |
| Consumer    | NOT_RUN        | No published package/plugin consumer surface.                          |

## Open Questions

- None. The repair is locked by the passed plan gate.

## Drift and Debt

- Drift: the corrected launch-root premise, owner-selected planning route, and repo-REST PR-sync
  fallback are recorded in `drift.md`. The fetched `origin/main` moved beyond the owner-stated SHA,
  but a path audit confirms no hook-owned surface drift; the branch remains intentionally unrebased.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
