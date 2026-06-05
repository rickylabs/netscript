# Public CLI

The public CLI is the `netscript` command. It is designed for generated NetScript workspaces and
uses published package references by default.

## Entry Points

Repository execution:

```bash
deno run -A packages/cli/bin/netscript.ts <command>
```

Installed execution:

```bash
netscript <command>
```

Library composition:

```ts
import { createPublicCli } from '@netscript/cli';

const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(['service', 'list']);
```

## Command Groups

- `init`
- `contract`
- `db`
- `deploy`
- `generate`
- `plugin`
- `service`

## Workspace Contract

Public commands operate on the project root passed by flag or discovered from the current working
directory. They do not require a checkout of the NetScript repository and do not copy package source
from a local monorepo.

Generated workspaces use package imports that are suitable for publication and CI. Commands that
modify files report their changes and preserve existing files unless an overwrite flag is provided.

## Related Docs

- [Command reference](./commands.md)
- [Permissions](./permissions.md)
- [Troubleshooting](./troubleshooting.md)
