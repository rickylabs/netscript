# Worklog — issue #694

## Plan

- Identity: WSL Codex implementation lane, branch `fix/694-cut-tmp-mkdir`, worktree
  `/home/codex/repos/ns-b9-694`; no PR is opened by this lane.
- Preflight: the worktree was clean on `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d`, which
  satisfies the required `eac57c5f` base prefix.
- Acceptance contract: `createReleasePr` must create `.llm/tmp` recursively before writing the
  generated PR body, and a unit test must prove the fresh-worktree case where that directory is
  absent.
- One implementation slice: extract the body-file write into the existing release tool, add the
  recursive directory creation, and cover it with a temp-root unit test. Prove the slice with the
  focused release tests plus scoped check/lint (and owned-file format if needed).
- Deferred: no release cut, branch/commit/push/PR API execution, scaffold runtime, `deno.lock`
  changes, or unrelated release-tool refactors.

PLAN-EVAL is owner-waived per the slice brief (carried drift D1). This plan and the Design
checkpoint are recorded before implementation.

## Design

- Public surface: the existing `release:cut` task and `createReleasePr` flow remain unchanged;
  the body-file writer is an internal testable seam in `.llm/tools/release/cut.ts`.
- Domain vocabulary: release version, generated PR body, body file, fresh worktree, scratch
  directory.
- Ports: direct Deno filesystem operations remain at this release-tool boundary; no new external
  port is needed for a directory-creation regression.
- Constants: the existing `.llm/tmp/release-cut-<version>-body.md` naming convention and body
  template remain unchanged.
- Commit slice: one bounded implementation/test/worklog slice, proven by the focused unit test and
  scoped TypeScript check/lint wrappers.
- Deferred scope: release orchestration, GitHub transport, publish gates, and full E2E remain
  orchestrator-owned or explicitly out of scope.
- Contributor path: update the body-file writer beside `createReleasePr`; extend
  `.llm/tools/release/cut_test.ts` with a temp-root test for filesystem preconditions.

## Drift

- D1 (carried, owner-authorized): PLAN-EVAL is waived for this implementation slice.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Fresh-worktree PR body unit test | PASS | `deno test --allow-read --allow-write --allow-env --allow-run --allow-net /home/codex/repos/ns-b9-694/.llm/tools/release/cut_test.ts` — 6 passed, 0 failed; the new test verifies `.llm/tmp` is absent before the write and present afterward. |
| Scoped TypeScript check | PASS | `deno run --allow-read --allow-run /home/codex/repos/ns-b9-694/.llm/tools/run-deno-check.ts --root /home/codex/repos/ns-b9-694/.llm/tools/release --ext ts,tsx` — 21 files, 1 batch, 0 failed batches/findings; wrapper invoked `deno check --quiet --unstable-kv`. |
| Scoped lint | PASS | `deno run --allow-read --allow-run /home/codex/repos/ns-b9-694/.llm/tools/run-deno-lint.ts --root /home/codex/repos/ns-b9-694/.llm/tools/release --ext ts,tsx` — 21 files, 0 findings. |
| Owned-file format | PASS | `deno run --allow-read --allow-run /home/codex/repos/ns-b9-694/.llm/tools/run-deno-fmt.ts --file /home/codex/repos/ns-b9-694/.llm/tools/release/cut.ts --file /home/codex/repos/ns-b9-694/.llm/tools/release/cut_test.ts --ext ts` — 2 files, 0 findings. |
| Release execution | NOT RUN | No actual release cut, GitHub PR creation, publish, or branch-cut flow was executed, per the slice brief. |
| Full scaffold runtime E2E | DEFERRED | Orchestrator-owned and unrelated to this internal release-body filesystem fix. |

## Reconcile

- Issue #694 remains the sole scope; no PR or GitHub metadata was opened or changed by this lane.
- The implementation stays within the locked one-slice plan: recursive body-directory creation,
  fresh-worktree coverage, and no release orchestration changes.
- No new architecture debt, dependency change, or `deno.lock` change was found; final status and
  lock hygiene are clean before commit.
