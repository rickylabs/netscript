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
- Implementation: complete and pushed through the orchestrator review fix.
- Gates: complete, including post-commit asset-barrel generation and empty-status proof.
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

## Orchestrator review fix

- Finding 1 confirmed: because `phase-eval-status.mjs` is not yet on `main`, this PR's own
  ready-for-review event cannot import the trusted-base module. The orchestrator will use the
  existing labeled path for this PR's evaluation; this implementation does not trigger it.
- Finding 2 accepted: evaluator dispatch is the primary work; status mutation and its trusted
  checkout are bookkeeping. Both bookkeeping steps now use `continue-on-error`, while the dispatch
  step explicitly depends only on a successful chain-token check and `!cancelled()`—not on checkout
  or transition outcomes. This preserves a hard failure when the required PAT is absent.
- The transition catches its error only to publish a `failure_reason` output, then rethrows so the
  step retains a truthful failure outcome. A following attributed summary step records actor, PR,
  head, checkout outcome, and reason before dispatch proceeds.
- Static regression coverage extracts the named workflow step blocks and asserts the non-blocking
  edges, diagnostic fields, trusted-base/credential boundary, and absence of bookkeeping outcome
  dependencies from dispatch. This proves the declared workflow policy; it is not a GitHub runner
  simulation.
- Acceptance reading: live issue #1566 box 1 remains truthful. Its specific concurrent-removal race
  is narrowly tolerated inside the caller, so that transition completes normally and applies
  `status:impl-eval` exactly once. Other errors still fail the transition step truthfully but no
  longer suppress evaluator dispatch.

### Review-fix gate evidence

| Gate | Result |
| --- | --- |
| Script tests | `deno test --allow-read --allow-env --allow-write --allow-run .github/scripts/` — exit 0; 66 passed, 0 failed |
| Scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Asset barrel | `deno task gen:assets-barrel` — exit 0; after review-fix commit `7170d574b3`, `git status --porcelain` was empty with exit 0 |
| Workflow YAML | `deno eval --no-lock` with `jsr:@std/yaml@^1.0.10` — exit 0, `YAML_PARSE_OK` |

- Review-fix reconcile: live issue wording supports box 1 without amendment; PR #1567 remains draft
  with exactly `status:impl`. No trigger, condition, model, trusted-base lookup, #1541, or #1564
  scope changed.
- Review-fix implementation commit: `7170d574b3`; pushed with explicit refspec. The orchestrator
  retains the labeled IMPL-EVAL transition and merge authority.

## Evaluator-run correction and self-contained landing

- Run `31598386001` disproved the prior end-to-end independence claim. `continue-on-error` worked:
  the failed transition remained legible, its attributed diagnostic ran, and the dispatch step
  started. Dispatch then failed because it requires a `status:impl-eval` labeled-event generation,
  which cannot exist when the transition does not apply the label. The dependency is through
  GitHub event history, not the step's declared `if:` condition.
- Owner-directed design: remove the checkout/import bootstrap and perform the cleanup inline in the
  trusted `github-script` step. The inline code paginates live labels, removes only live `status:`
  labels, tolerates only status 404 with exact message `Label does not exist`, rethrows everything
  else, and adds only `status:impl-eval`.
- `.github/scripts/phase-eval-status.mjs` remains the independently unit-tested behavioral contract.
  The workflow currently carries a transcription rather than importing it because this first
  landing must be self-contained before the helper exists on trusted `main`.
- The existing workflow-policy test is retained with its precise scope: it proves the failed
  transition is attributed and the dispatch step remains eligible under its declared conditions.
  It does not prove the event-history generation dependency is satisfied. A separate explicitly
  string-based parity assertion checks that the inline transcription and helper use the same exact
  missing-label message and terminal label, including their comparison/addition sites.
- `continue-on-error` and the attributed failure summary remain. They do not make label generation
  optional; they make future failures observable and allow the dispatch step to expose its own
  generation precondition instead of being skipped.

### Self-contained landing gate evidence

| Gate | Result |
| --- | --- |
| Script tests | `deno test --allow-read --allow-env --allow-write --allow-run .github/scripts/` — exit 0; 67 passed, 0 failed |
| Scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github/scripts --ext ts` — exit 0; 6 files, 0 findings |
| Asset barrel | `deno task gen:assets-barrel` — exit 0; after implementation commit `d7ea38f1cd`, `git status --porcelain` was empty with exit 0 |
| Workflow YAML | `deno eval --no-lock` with `jsr:@std/yaml@^1.0.10` — exit 0, `YAML_PARSE_OK` |

- Self-contained landing reconcile: PR #1567 is draft with exactly `status:impl`; the failed run
  facts changed the design but not issue #1566's six-box acceptance mapping. No manual OpenHands
  trigger, ready transition, waiver label, merge, #1541 action, or out-of-scope change occurred.
- Self-contained implementation commit: `d7ea38f1cd`; pushed with explicit refspec. The orchestrator
  owns the ready flip and automatic DeepSeek retry.
