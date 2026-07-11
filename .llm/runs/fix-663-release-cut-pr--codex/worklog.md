# Worklog — issue #663

## Design

- Public surface: `createReleasePullRequest(version, body, dependencies?)` performs only the final
  release-PR API operation; `release:cut` remains the CLI entry point.
- Domain vocabulary: `ReleasePrDependencies` is the narrow token-resolution and GitHub transport
  test seam.
- Ports: the existing agentic `resolveGithubToken`, `githubRequest`, and `buildPullRequestBody`
  primitives; tests inject the token resolver and transport.
- Constants: release PR base is `main`; head is `release/cut-<version>`; repository is
  `rickylabs/netscript`.
- Commit slices: S1 replaces `gh pr create` with the shared API path, proves success and non-fatal
  failure with unit tests, and records scoped check/lint evidence.
- Deferred scope: no release cut, publish operation, PR opening, or unrelated release-tool changes.
- Contributor path: edit the final PR operation in `.llm/tools/release/cut.ts`; transport behavior
  is covered beside the existing release-cut unit tests.

PLAN-EVAL is owner-waived per the slice brief (carried drift D1). This plan is recorded before
implementation in accordance with that waiver.

## Implementation

- Replaced the final `gh pr create` subprocess with the agentic suite's
  `resolveGithubToken` + `githubRequest` REST path.
- Reused `buildPullRequestBody` for the established PR payload shape: base `main`, head
  `release/cut-<version>`, and the unchanged generated body content read from `.llm/tmp/`.
- Kept branch creation, staging, commit, and push ordered before PR creation. Token/API failures
  are caught, print the pushed-branch/manual-PR fallback, and return without failing the cut.
- Added injected token/transport tests for successful creation and non-fatal HTTP failure.

## Validation

| Gate | Command | Result |
| --- | --- | --- |
| Release unit tests | `deno test --allow-read --allow-write --allow-env --allow-run --allow-net /home/codex/repos/ns-b8-663/.llm/tools/release/cut_test.ts` | PASS — 5 passed, 0 failed |
| Scoped check | `run-deno-check.ts --file .../cut.ts --file .../cut_test.ts --ext ts` | PASS — 2 files, 1 batch, 0 findings |
| Scoped lint | `run-deno-lint.ts --file .../cut.ts --file .../cut_test.ts --ext ts` | PASS — 2 files, 1 batch, 0 findings |
| Scoped format | `run-deno-fmt.ts --file .../cut.ts --file .../cut_test.ts --ext ts` | PASS — 2 files, 1 batch, 0 findings |

No actual release cut was run.

## Reconcile

- S1: issue #663 remains open with both acceptance boxes pending coordinator/evaluator evidence;
  no PR was opened per the slice brief. Implementation scope still fully matches the issue.

## Drift

- D1 (carried): PLAN-EVAL owner-waived by the orchestrator; implementation proceeds from the plan
  above without a separate PLAN-EVAL session.
