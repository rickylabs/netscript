# Worklog — issue #664 launcher permission parity

## Plan

PLAN-EVAL is owner-waived per the slice brief (carried drift D1). Initial preflight matched
`955b4abf639522c7da50bd15d20c6e999acb808f`; after the interrupted turn, the branch was rebased
onto `origin/main` at `d3f19101fc161665c5e49f6ebf4ce76872802de5` to integrate merged PR #668.
Issue #664 acceptance remains the contract.

One commit slice: grant `agentic:launch-codex-slice` environment permission and move the
sender-registry env/directory read before the dry-run branch, with a focused regression guard.
Prove it with the targeted test, scoped check/lint/format, task help, and a task dry-run.

Risks: dry-run must remain non-mutating; only the existing read is shared, while lease release/create
remain launch-only. Deferred: no changes to sender ownership semantics or other agentic tasks.

## Design

- Public surface: the existing `deno task agentic:launch-codex-slice` command and flags are unchanged.
- Domain vocabulary: sender registry, ownership observation, dry-run permission parity.
- Ports: `Deno.env` resolves `HOME`; `LocalSenderOwnershipAdapter` performs the shared read.
- Constants: no new finite values are needed.
- Commit slice: `deno.json`, launcher, compatibility guard, and this worklog; gates listed above.
- Deferred scope: ownership mutation and conflict behavior remain unchanged.
- Contributor path: task permissions live in root `deno.json`; launcher parity is guarded in
  `.llm/tools/agentic/compatibility-wrappers_test.ts`.

## Drift

- D1 (carried, owner-authorized): PLAN-EVAL waived; plan and Design checkpoint recorded here before
  implementation.

## Evidence

- `deno test --allow-read .llm/tools/agentic/compatibility-wrappers_test.ts`: PASS, 3 tests.
- Scoped check wrapper, exact launcher and guard paths: PASS, 1 file selected per invocation.
- Scoped lint wrapper, exact launcher and guard paths: PASS, 1 file selected per invocation.
- Scoped format wrapper, exact launcher and guard paths: PASS, 1 file selected per invocation.
- `deno task agentic:launch-codex-slice --help`: PASS through the task; rendered task includes
  `--allow-env` and the post-#668 route-mismatch option.
- `deno task agentic:launch-codex-slice ... --dry-run --pretty`: PASS through the task using this
  worktree and a dummy contract-valid brief; sender-registry env/directory preflight completed and
  output was `DRY-RUN ok` without sender ownership mutation.
- Red-before is established by the base task definition lacking `--allow-env` and the base launcher
  branching before `Deno.env.get('HOME')`; the focused guard asserts both corrected conditions.
