# Evidence: Fresh UI private-lock gate triggers

## Baseline Enumeration

Re-derived at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` on 2026-09-02.

- Root workspace globs are `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`, and
  `apps/*`.
- `packages/fresh-ui/deno.lock` contains 37 `workspace.members`: 31 under `packages/` (including
  `packages/cli/e2e`) and 6 under `plugins/`.
- It contains zero members under `examples/` and zero under `apps/`. Neither `examples/` nor
  `apps/` exists at this base head, so those declared future globs cannot currently stale the
  private lock.
- Exactly three lockfiles exist outside historical `.llm/runs/**`: root `deno.lock`,
  `packages/fresh-ui/deno.lock`, and `docs/site/deno.lock`.
- Searching every `deno.json`, `deno.jsonc`, and `.github/**` file outside `.llm/runs/**` finds
  only one explicit `--lock=<file>` gate: the `packages/fresh-ui/deno.json` `check`, `test`, and
  `tokens:build` tasks use `--lock=deno.lock --frozen` (`lock:update` names the same file with
  `--frozen=false`). There is no third `--lock=` gate.
- `docs/site` is not a root workspace member. Its source-format build/test tasks explicitly use
  `--no-lock`; no task consumes `docs/site/deno.lock` through `--lock=`.

Verdict: `packages/fresh-ui/deno.lock` is the only second lockfile consumed frozen over the root
workspace graph. The complete current trigger class is therefore `packages/*/deno.json`, the
explicit nested member `packages/cli/e2e/deno.json`, `plugins/*/deno.json`, and root `deno.lock`.

## Acceptance Mapping

1. **Member-manifest-only PR triggers `fresh-ui-quality`: not honestly provable pre-merge.** The
   classifier half will be proven by unit tests and the trigger lists by parsed-YAML structural
   tests. A live implementation PR cannot isolate the new trigger because its diff also changes
   `.github/workflows/fresh-ui-quality.yml`, which was already a triggering path.
2. **Deliberately stale private lock fails the gate: proven now.** Disposable PR #1919 and run
   `33620426788` provide the live teeth evidence below. This is not trigger-isolation proof.
3. **The `--lock=` class is enumerated: proven now** by the baseline enumeration above.

## Required Post-Merge Verification for Box 1

After this workflow change merges, open a one-shot PR to `main` whose diff consists only of:

- one actual mirrored member manifest change (for example `packages/sdk/deno.json`), and
- a deliberately stale edit to an existing entry in `packages/fresh-ui/deno.lock`.

Expected result: `fresh-ui-quality` starts because of the new member-manifest glob, the classifier
sets `needs_fresh_ui=true`, and the frozen-lock step fails. Close the one-shot PR without merging,
delete its branch, then link its Actions run on issue #1905 before checking acceptance box 1.

## RED Proof

The classifier expectations were committed before implementation as
`8bdb7f0afdf51e0d63bfbdd021658d5ff81f5a27`. That exact commit was checked out detached in a
throwaway worktree and run with:

```text
deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts
```

Real exit code: `1` (captured directly from the command substitution, never through a pipeline).
Result: `61 passed | 1 failed`. The only failure was
`Fresh UI private-lock inputs contribute to needs_fresh_ui`, at the first input
`packages/sdk/deno.json`, with actual `false` versus expected `true`. The separate root
`deno.json` toolchain regression assertion passed.

## GREEN Gates

Every exit code was captured directly from the command substitution before printing output.

| Gate | Real exit code | Result |
| --- | ---: | --- |
| `deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts` | 0 | 62 passed, 0 failed |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/validation/fresh-ui-quality_test.ts` | 0 | 2 passed, 0 failed |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github --ext ts` | 0 | 11 files, 0 failed batches/findings |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github --ext ts` | 0 | 11 files, 0 findings/refusals |
| `deno test --allow-read --filter 'Fresh UI workflow trigger paths' .llm/tools/validation/fresh-ui-quality_test.ts` | 0 | YAML trigger document parsed; 1 passed, 1 filtered out |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/validation/fresh-ui-quality_test.ts` | 0 | 1 file, 0 findings/refusals |

The structural YAML test reads the arrays from the parsed document at
`workflow.on.pull_request.paths` and `workflow.on.push.paths`. It proves both arrays are equal and
contain:

```text
packages/*/deno.json
packages/cli/e2e/deno.json
plugins/*/deno.json
deno.lock
```

It also proves both lists retain `packages/fresh-ui/**` before its Markdown and MDX negations.
Classifier coverage proves all four paths contribute `needs_fresh_ui=true`, while the existing
root `deno.json` toolchain contribution remains true. The pre-existing unknown-path safety test
also remains green, so the change narrows no existing fail-open escalation.

## Stale-Lock Teeth Demonstration

Disposable branch `ci/fresh-ui-lock-gate-teeth-1905` was created from implementation commit
`099d504023dbb95c964824352bacc1d9c5ddc058`. Its only additional change edited the existing
`packages/sdk` workspace entry in `packages/fresh-ui/deno.lock` from
`npm:@orpc/client@^1.15.0` to the valid but stale `npm:@orpc/client@^1.14.0`; the lock was not
regenerated.

- Disposable PR: #1919, opened draft to `main`, then moved through the workflow's supported
  `ready_for_review` event because draft PRs are deliberately skipped by the classify-job guard.
- Fresh UI run: [33620426788](https://github.com/rickylabs/netscript/actions/runs/33620426788),
  conclusion `failure`.
- Failing job: `fresh-ui-quality`, job id `100216039828`.
- Failing step: `Frozen package type-check`.
- Gate receipt: `fresh-ui-check`, outcome `FAIL`, real exit code `1`.
- Frozen diagnostic: `The lockfile is out of date`, showing the exact `^1.14.0` → `^1.15.0`
  correction.
- Emitted workflow command:

```text
::error::Fresh UI private lock is stale. Review the dependency diff, then run deno task --cwd packages/fresh-ui lock:update and commit packages/fresh-ui/deno.lock.
```

GitHub rendered that command in the job log as:

```text
##[error]Fresh UI private lock is stale. Review the dependency diff, then run deno task --cwd packages/fresh-ui lock:update and commit packages/fresh-ui/deno.lock.
```

After capture, PR #1919 was closed unmerged, the remote and local disposable branch were deleted,
and the throwaway worktree was removed. The initial draft-open run `33620345492` was skipped, as
expected from the draft guard; it is not evidence. The failing `ready_for_review` run proves the
gate's teeth only. Because the disposable PR also contained the workflow-file change from #1917,
it cannot and does not prove isolated member-manifest triggering.
