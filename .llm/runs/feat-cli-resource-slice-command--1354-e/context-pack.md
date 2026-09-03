# Context Pack: Slice E — unregistered resource command

## Current State

Harness bootstrap and design are complete on integration base `0faae3fde`. The locked plan is
transcribed with `PLAN-EVAL: N/A`. Product scope is exactly five new files under
`packages/cli/src/public/features/generate/resource/`; `public-command-dependencies.ts` and all
registration surfaces are off-limits. PR #1664 is open at `9e0936440` and has zero intersections
with the reduced product set.

## Binding Decision

`--client` is the only selector and is forwarded unchanged into an injected
`ResourceClientResolver`. This slice implements no scan/default/auto-pick algorithm. Slice A's
`client-selector.ts` will implement that dependency when Slice F activates the command.

## Current Delivery State

The five authorized files are implemented and all canonical gates are green. The branch was
rebased onto `origin/main` at `9a191bdda`; Slices B (#1943) and D (#1948) are now in main and no
carried product or generated-corpus delta remains. Corpus regeneration/check passed at 35 packages,
273 subpaths, and 7,841 symbols. `public-command-dependencies.ts`, carriers, and `deno.lock` remain
untouched.

## Next

Formal native opposite-family IMPL-EVAL passed. Commit, push, and open the non-draft PR against
`main` with the required labels and milestone.
