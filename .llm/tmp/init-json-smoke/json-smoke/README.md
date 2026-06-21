# JsonSmoke

A NetScript application scaffolded with `netscript init`.

## Quick Start

```bash
# Start the Fresh app directly (no Aspire orchestration)
deno task --cwd apps/dashboard dev
```

## Project Structure

```
json-smoke/
├── apps/dashboard/   # Fresh frontend (defineFreshApp)
├── contracts/        # Shared oRPC contracts (versioned)
├── plugins/          # Plugin registry and implementations
├── deno.json         # Workspace root configuration
└── netscript.config.ts  # NetScript framework configuration
```

## Commands

Use `packages/cli/bin/netscript-dev.ts` for local contributor workflows; `packages/cli/bin/netscript.ts` mirrors the published public CLI surface.

| Command | Description |
| --- | --- |
| `deno task --cwd apps/dashboard dev` | Start the Fresh app (Vite dev server) |
| `deno task check` | Type-check all workspace members |
| `deno task lint`  | Run linter |
| `deno task fmt`   | Format code |
| `deno task test`  | Run tests |
| `deno run -A packages/cli/bin/netscript-dev.ts --help` | Show local contributor CLI commands |
| `deno run -A packages/cli/bin/netscript.ts --help` | Show public CLI commands |

## Learn More

- [NetScript Documentation](https://github.com/rickylabs/netscript)
- [Deno Manual](https://docs.deno.com)
- [Fresh](https://fresh.deno.dev)
- [oRPC](https://orpc.unnoq.com)
