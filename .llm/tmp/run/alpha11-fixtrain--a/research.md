# Research

## Surface

- Branch: `fix/cli-core-alpha11-a`.
- Base: `origin/main` at `b4ce2bb0c8390a2c84a9d236c17ab7b6bb28c368`.
- Selected archetype: Archetype 6, CLI / tooling, because the slice changes `@netscript/cli`
  public command behavior and scaffold init flow.
- Doctrine verdict in scope: `packages/cli` is already recorded as Archetype 6 / Restructure debt.
  This slice is a defect fix inside the current structure and does not attempt the larger
  restructuring.

## Findings

- F-3: `packages/cli/src/public/features/root/public-command-tree.ts` hardcodes the Cliffy root
  program version to `1.0.0`.
- The installed package version is available as JSON metadata in `packages/cli/deno.json`; a static
  JSON import is JSR-safe and avoids `Deno.readTextFile` or `import.meta` path resolution.
- F-4: `DryRunFileSystemAdapter` exists in
  `packages/cli/src/kernel/adapters/scaffold/dry-run-fs.ts`, but public init currently receives the
  shared `DenoFileSystem` instance from
  `packages/cli/src/public/features/root/public-command-dependencies.ts`.
- `runInitPipeline` already skips format and git init when `validated.dryRun` is true. The guard is
  in place and should remain covered by tests.
- `validateOptions` intentionally skips existing target checks in dry-run mode, so the dry-run
  adapter must be selected before `executeInit` runs the validation and pipeline.

## Open Questions

- None for this slice. The implementation can stay within the current public init command boundary.
