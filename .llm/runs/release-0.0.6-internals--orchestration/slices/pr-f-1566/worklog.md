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

- Bootstrap: complete; draft PR #1567 opened with required metadata and six indexed acceptance
  mappings.
- Tests: RED regression suite added. Before implementation it fails because the extracted
  `phase-eval-status.ts` production module does not yet exist; the named race and narrow-tolerance
  assertions define the required caller contract. Generation dedup is guarded structurally in the
  unchanged workflow script.
- Implementation: complete; pending implementation commit/push.
- Gates: complete except the required post-commit empty-status proof for asset freshness.
- IMPL-EVAL: owned by the separate orchestrator/evaluator transition; this agent leaves the PR draft.

## RED evidence

- `deno test --allow-read .github/scripts/phase-eval-status.test.ts` — exit 1 before the production
  module exists (`TS2307 Cannot find module .github/scripts/phase-eval-status.ts`).

## Implementation

- Added `phase-eval-status.mjs`: pure transition decision plus an injected operation caller.
- The caller reads live labels, removes only live `status:` labels, tolerates only an Octokit-style
  `404` with response message `Label does not exist`, and adds `status:impl-eval` once.
- The workflow checks out the live protected base ref with credentials disabled, imports that
  trusted module, and adapts the existing GitHub client operations. Dispatch/dedup code is unchanged.
- Targeted regression suite after implementation: 5 passed, 0 failed.

## Gate evidence

| Gate | Result |
| --- | --- |
| Script tests | `deno test --allow-read --allow-env --allow-write --allow-run .github/scripts/` — exit 0; 65 passed, 0 failed |
| Scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped format | Initial exit 1 on the new test import layout; formatted only the owned test/module, rerun exit 0; 6 files, 0 findings |
| Asset barrel | `deno task gen:assets-barrel` — exit 0; no generated file appeared in status. Final clean-status proof runs after the implementation commit. |
| Workflow YAML | `deno eval --no-lock` with `jsr:@std/yaml@^1.0.10` parsed `openhands-phase-eval.yml` — exit 0, `YAML_PARSE_OK` |

## Reconcile

- Slice S1: issue #1566 remained open; PR #1567 carries the sole closing keyword, six indexed
  evidence entries, and exactly one lifecycle label (`status:impl`). No new comments changed scope.
- Slice S2: no issue/PR feedback required readjustment. The PR remains draft for orchestrator-owned
  IMPL-EVAL; no skip, ready-merge, or impl-eval label was applied.
