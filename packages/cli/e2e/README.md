# @netscript/cli-e2e

Doctrine archetype: **6 - CLI / Tooling**.

This package owns NetScript CLI capability smoke suites. It is additive to the existing
`@netscript/cli` package and keeps `.llm/tools/scaffold-e2e-test.ts` as an independent behavioral
baseline while the product-grade suite matures.

## Quick Start

```bash
deno task e2e:cli suites
deno task e2e:cli run scaffold.service --format pretty
deno task e2e:cli run scaffold.plugins --cleanup --format pretty
```

Programmatic use:

```ts
import { defineCliE2eSuite, SCAFFOLD } from '@netscript/cli-e2e';

const suite = defineCliE2eSuite()
  .withId(SCAFFOLD.PLUGIN)
  .withWorkspace((workspace) => workspace.withRepoRoot('.'))
  .withScaffold((scaffold) => scaffold.withOfficialPluginSuite())
  .build();
```

## Command Surface

| Command               | Purpose                    |
| --------------------- | -------------------------- |
| `suites`              | List built-in suites       |
| `gates <suite>`       | List suite gates           |
| `run <suite>`         | Run a complete suite       |
| `gate <suite> <gate>` | Run one gate for debugging |

The first complete scenario is `scaffold.plugins`. It validates generated project scaffolding,
official plugin addition, database workflow, Aspire runtime boot, HTTP behavior checks, and cleanup.

## Built-in Suites

| Suite                     | Coverage                                      |
| ------------------------- | --------------------------------------------- |
| `scaffold.service`        | init, generated service discovery, typecheck  |
| `scaffold.contracts`      | init, generated contract discovery, typecheck |
| `scaffold.infrastructure` | init, database init/generate/seed, typecheck  |
| `scaffold.plugins`        | full scaffold, plugins, DB, runtime behavior  |
| `scaffold.runtime`        | full scaffold runtime behavior path           |

## Required Permissions

The CLI entrypoint is intended to run with `--allow-all` because smoke tests create files, spawn
`deno`, `aspire`, and `docker`, and call local HTTP endpoints. Narrower permissions for the current
implementation are:

- `--allow-read`
- `--allow-write`
- `--allow-run`
- `--allow-env`
- `--allow-net`
- `--allow-sys`

## Docker Cleanup

Before a smoke run starts, the suite snapshots existing Docker container IDs. After the run
completes, it stops the generated Aspire AppHost and removes only containers that were created after
that snapshot. Existing containers from the main checkout are left untouched.
