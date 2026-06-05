# JSR Publishing

The package metadata lives in `packages/cli/deno.json`.

## Exported Entry Points

Published exports:

- `@netscript/cli` -> `./mod.ts`
- `@netscript/cli/scaffolding` -> `./scaffolding.ts`
- `@netscript/cli/testing` -> `./testing.ts`

Repository-only files are excluded from the public export map:

- `packages/cli/maintainer.ts`
- `packages/cli/bin/netscript-dev.ts`

## Validation

Run package checks from `packages/cli`:

```bash
deno task check
deno task publish:dry-run
```

The publish dry run command is:

```bash
deno publish --dry-run --allow-dirty --no-check=remote
```

The package should also document successfully:

```bash
deno doc packages/cli/mod.ts packages/cli/testing.ts
```

## Include And Exclude Rules

The publish configuration includes package docs, entrypoints, binaries, TypeScript sources, and
template assets. It excludes tests, e2e fixtures, snapshots, and maintainer-only entrypoints.

Before publishing a release, make sure dependent `@netscript/*` packages are available on JSR at the
versions referenced by this package.
