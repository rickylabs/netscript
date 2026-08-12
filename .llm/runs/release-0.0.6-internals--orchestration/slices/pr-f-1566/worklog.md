# PR-F #1566 Worklog

## Identity

- Worktree: `/home/codex/repos/ns006-labelrace`
- Branch: `fix/1566-phase-eval-label-race`
- Base: `e67c1ba13`
- Implementation route: Codex · GPT-5.6 Sol · low
- Supervising orchestrator: Claude · Opus 5 · high, `/home/codex/repos/netscript-006-internals`

## Plan gate

PLAN-EVAL: N/A. This is a small deterministic automation fix with the defect, design, scope,
acceptance criteria, and required gates fully specified in issue #1566 and `implement.md`.

## Design

- Public surface: `.github/scripts/` exports a pure label-transition decision and a thin injected
  GitHub-operation caller; the workflow imports and invokes the caller.
- Domain vocabulary: live issue-label names, the `status:` prefix, the terminal
  `status:impl-eval` label, and the missing-label REST error classification.
- Ports: injected `listLabelsOnIssue`, `removeLabel`, and `addLabels` operations provide the only
  external seam used by tests and the workflow caller.
- Constants: the status prefix and terminal label are named module constants.
- Commit slices:
  1. Bootstrap the tracked slice artifacts and draft PR.
  2. Add RED regression tests for the removal race, narrow tolerance, generation dedup, and terminal
     single-status state.
  3. Implement live-label cleanup and workflow integration, then run the six required gates.
- Deferred scope: generation dispatch logic, workflow triggers/conditions, model resolution,
  trusted-base resolution, #1564 range computation, and PR #1541 are unchanged.
- Contributor path: extend the decision/caller module and its adjacent test file; keep workflow
  inline code limited to client adaptation and invocation.

## Progress

- Bootstrap: in progress.
- Tests: pending.
- Implementation: pending.
- Gates: pending.
- IMPL-EVAL: owned by the separate orchestrator/evaluator transition; this agent leaves the PR draft.

