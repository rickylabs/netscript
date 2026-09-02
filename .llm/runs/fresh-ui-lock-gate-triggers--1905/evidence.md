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
2. **Deliberately stale private lock fails the gate: pending live teeth demonstration.** The run
   id, failing step, and emitted `::error::` line will be recorded below. This will not be claimed
   as trigger-isolation proof.
3. **The `--lock=` class is enumerated: proven now** by the baseline enumeration above.

## Required Post-Merge Verification for Box 1

After this workflow change merges, open a one-shot PR to `main` whose diff consists only of:

- one actual mirrored member manifest change (for example `packages/sdk/deno.json`), and
- a deliberately stale edit to an existing entry in `packages/fresh-ui/deno.lock`.

Expected result: `fresh-ui-quality` starts because of the new member-manifest glob, the classifier
sets `needs_fresh_ui=true`, and the frozen-lock step fails. Close the one-shot PR without merging,
delete its branch, then link its Actions run on issue #1905 before checking acceptance box 1.

## RED Proof

Pending slice 1.

## GREEN Gates

Pending slice 2.

## Stale-Lock Teeth Demonstration

Pending slice 3.

