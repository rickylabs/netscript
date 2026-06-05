# Maintainer CLI

`netscript-dev` is the local contributor and maintainer binary for working inside the NetScript
repository. It is not exported by the published package.

## Entry Point

```bash
deno run -A packages/cli/bin/netscript-dev.ts <command>
```

## Commands

`netscript-dev` exposes the full public project command set (`db`, `deploy`, `generate`, `plugin`,
`service`, `contract`) plus maintainer-only commands that depend on local repository state.

### `netscript-dev init`

Creates a scaffolded workspace using local repository package sources.

```bash
deno run -A packages/cli/bin/netscript-dev.ts init --target ./tmp/demo
```

### `netscript-dev sync packages`

Copies local package sources into an existing scaffolded workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync packages --target ./tmp/demo
```

### `netscript-dev sync plugin`

Copies an official plugin source tree from the repository into a workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync plugin --target ./tmp/demo --plugin workers
```

### `netscript-dev sync templates`

Regenerates helper templates in a workspace.

```bash
deno run -A packages/cli/bin/netscript-dev.ts sync templates --target ./tmp/demo
```

### `netscript-dev probe monorepo`

Reports repository-local capabilities and source roots.

```bash
deno run -A packages/cli/bin/netscript-dev.ts probe monorepo
```

### `netscript-dev test scaffold`

Runs scaffold validation for a selected fixture.

```bash
deno run -A packages/cli/bin/netscript-dev.ts test scaffold --fixture smoke
```

## Boundary

Maintainer commands may inspect repository layout, copy local package sources, and invoke local
generation scripts. Public `netscript` commands do not depend on those capabilities.
