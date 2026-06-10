# @netscript/cli-e2e

Doctrine archetype: **6 - CLI / Tooling**.

This package owns NetScript CLI capability smoke suites. It is additive to the existing
`@netscript/cli` package and keeps `.llm/tools/scaffold-e2e-test.ts` as an independent behavioral
baseline while the product-grade suite matures.

## Quick Start

```bash
deno task e2e:cli suites
deno task e2e:cli
deno task e2e:cli run scaffold.service --format pretty
deno task e2e:cli run scaffold.plugins --format pretty
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
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

| Command               | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| _(no subcommand)_     | Run the full merge-readiness suite with cleanup |
| `suites`              | List built-in suites                            |
| `gates <suite>`       | List suite gates                                |
| `run <suite>`         | Run a complete suite                            |
| `gate <suite> <gate>` | Run one gate for debugging                      |

The bare `deno task e2e:cli` command runs `scaffold.runtime` with cleanup enabled. That full
merge-readiness scenario validates generated project scaffolding, official plugin addition, database
workflow, generated type checks, Aspire runtime boot, HTTP behavior checks, OTEL behavior, and
cleanup. The narrower `scaffold.plugins` suite stops after plugin scaffold and host-diagnostic
checks.

`gate <suite> <gate>` is a narrow debugging command. It does not automatically run prerequisite
gates, so dependent gates such as `database.init`, `database.generate`, runtime waits, and behavior
checks require an existing generated project via matching `--smoke-root` and `--name` options. CI
and requested PR checks should use
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` instead of invoking
`database.init` directly.

## Built-in Suites

| Suite                     | Coverage                                                   |
| ------------------------- | ---------------------------------------------------------- |
| `scaffold.service`        | init, generated service discovery, typecheck               |
| `scaffold.contracts`      | init, generated contract discovery, typecheck              |
| `scaffold.infrastructure` | init, database init/generate/seed, typecheck               |
| `scaffold.plugins`        | init, official plugins, registry generation, plugin doctor |
| `scaffold.runtime`        | full scaffold runtime behavior path                        |

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
