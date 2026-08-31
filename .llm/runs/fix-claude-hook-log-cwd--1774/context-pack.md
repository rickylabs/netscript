# Context Pack: Claude hook cwd independence

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`       |
| Branch         | `fix/claude-hook-log-cwd-independent` |
| Current phase  | `implementation / S5 handoff`         |
| Archetype      | N/A — repository agentic tooling      |
| Scope overlays | none                                  |

## Current State

S3 is pushed at `f8e6ad0c94381e8fe9d5d50e8ec94c5d5a9e3139` with the required historical RED. The
repair is pushed at `ba04b03878cc1269c242e81019c44a17c182dc10`; the S3 fixture remains
byte-identical and GREEN. S5 passes the focused 24-test hook/launcher set, 23-file type check,
three-file changed source lint, mandatory Claude gate, direct fallback probe, explicit no-`any`
scan, and root suite (4,284 passed / 19 ignored / 0 failed). The full-Claude lint diagnostic is not
a verdict: root config excludes `.llm/**`, and an override exposes three pre-existing findings in
untouched files.

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
- Committed and pushed the S4 repair, then posted its PR slice evidence without changing draft or
  `status:impl` state.
- Ran the focused hook/launcher tests (24/24), scoped type check (23 files), changed-source lint
  (3/3, zero findings), mandatory Claude gates, direct cwd fallback, no-`any`, and the full root
  test (4,284 passed).
- Counted the complete 12-file implementation change set for final formatting: 10 authored files are
  processed, while two generated Claude skill mirrors are explicitly excluded and sync-checked.
- Kept Aspire, Docker, browser, `e2e:cli`, and `scaffold.runtime` at `NOT_RUN` under the lease
  boundary.

## In Progress

- Commit and push the S5 evidence-only handoff slice and post its PR comment.

## Next Steps

1. Preserve S5 as an independently pushed evidence-only commit and PR slice comment.
2. Verify the remote head, draft/status labels, evaluator hashes, and clean worktree.
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

The implementation union is 12 files: the six planned owned files, four generator-owned run
artifacts, and two deterministic generated Claude skill mirrors required by the mandatory sync gate.
No workflow, source skill, launcher/home, evaluator-owned, package, or plugin file changed.

## Gates

| Gate family | Current status | Evidence                                                               |
| ----------- | -------------- | ---------------------------------------------------------------------- |
| Static      | GREEN          | Focused 24/24; check 23 files; changed lint 3 files; root 4,284/4,284. |
| Fitness     | GREEN          | Claude public + JSON gates, no-host/no-`any`, and lock checks pass.    |
| Runtime     | GREEN          | Launch-root, nested-cwd, decoy, and direct fallback probes pass.       |
| Consumer    | NOT_RUN        | No published package/plugin consumer surface.                          |

## Open Questions

- None. The repair is locked by the passed plan gate.

## Drift and Debt

- Drift: the corrected launch-root premise, owner-selected planning route, and repo-REST PR-sync
  fallback are recorded in `drift.md`. The fetched `origin/main` moved beyond the owner-stated SHA,
  but a path audit confirms no hook-owned surface drift; the branch remains intentionally unrebased.
  The mandatory gate also exposed two baseline-stale generated skill mirrors; their deterministic
  canonical sync is recorded as S4 drift. The scoped lint plan assumed `.llm/**` was lint-enabled;
  the config exclusion and three unrelated override findings are recorded without widening #1774.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.
