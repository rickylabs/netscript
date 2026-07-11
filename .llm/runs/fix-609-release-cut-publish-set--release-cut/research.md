# Research

## Re-baseline

- Branch starts clean at `origin/main` (`720fcb7e`).
- PR #508 (`e6a847db`) already added `packages/ai` to the workspace release train before this slice.
- `publishWorkspace()` currently discovers publishable direct children of `packages/` and `plugins/`; current discovery includes `@netscript/ai` and `@netscript/plugin-ai-core`.
- The gap is therefore not a current hard-coded omission. It is the absence of an explicit audit proving that the effective publish set equals the intended JSR workspace set and explaining exclusions.
- Root workspace globs also include non-release workspaces (`examples/*`, `apps/*`, and `packages/cli/e2e`), so the audit must define the release intent precisely rather than equate all Deno workspace members with JSR packages.

## Markdown surface

- `coordinateVersionBump()` changes JSON and `deno.lock`; markdown is not rewritten or linted.
- Policy direction from #610 is version-neutral snippets. This slice should detect prerelease pins for `@netscript/*` in markdown and compare them with the proposed cut version.
- `docs/site/**` is deferred: violations must be reported separately and must not fail beta.6.
- Historical `.llm/runs/**`, scratch/worktrees, dependencies, and generated/cache trees are not release documentation surfaces.

## Design constraints

- No `packages/**` or `plugins/**` source changes.
- No network-dependent registry lookup is needed to prove the local release set.
- No publish command, tag, or GitHub Release.
- Preserve `deno.lock` exactly.

## Open questions resolved

- Intent authority: publishable direct `packages/*` and `plugins/*` members in the `@netscript/` scope, with explicit path/reason exclusions for intentional omissions.
- Markdown comparison: only a pin strictly behind the requested cut version is a violation; equal/newer pins are not stale.
- Deferred site findings are warnings in structured results/output, never silent skips.
