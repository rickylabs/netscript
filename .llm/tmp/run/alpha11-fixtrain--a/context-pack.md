# Context Pack

## Status

Slice A implementation committed on `fix/cli-core-alpha11-a`.

## Scope

- F-3: replace hardcoded public CLI version with static JSON import from `packages/cli/deno.json`.
- F-4: make public `init --dry-run` use `DryRunFileSystemAdapter` and prove no target files are
  written.

## Constraints

- No new type casts.
- Do not modify `deno.lock` unless required.
- Stage explicit paths only.
- Push with `git push origin HEAD:refs/heads/fix/cli-core-alpha11-a`.

## Commits

- `383cc40a` fixes F-3/F-4 and adds focused regression coverage.
