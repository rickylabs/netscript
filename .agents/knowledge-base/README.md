# NetScript Agent Knowledge Base

> Doctrine reference: package/plugin architecture is governed by `docs/architecture/doctrine/` and
> `.llm/harness/debt/arch-debt.md`. This file describes current repo state; doctrine defines the
> target state.

This directory contains durable project context for agents working in this repository. It is the
migrated successor to the prior `.claude` knowledge pack.

Use these files for orientation and file discovery. Treat current source files,
`docs/architecture/`, and `.llm/harness/` as authoritative whenever they conflict with these notes.

## Currentness Rules

1. Prefer `docs/architecture/doctrine/` for package and plugin doctrine.
2. Prefer `.llm/harness/` for harness workflow, gates, evaluator protocol, and debt handling.
3. Prefer source files and `deno.json` import maps for exact current package names and paths.
4. Use `.agents/skills/*/SKILL.md` for procedural workflows such as JSR audit, Aspire, and harness
   runs.
5. If a knowledge-base fact diverges from the source tree, fix the knowledge-base entry in the same
   change or record the drift in the active harness run.

## Quick Navigation

| Document                                                 | Purpose                                                             | When to Read                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| [01-architecture.md](./01-architecture.md)               | System architecture, layers, data flows, tech stack                 | Starting any work, understanding the big picture |
| [02-contracts-and-types.md](./02-contracts-and-types.md) | Type system, Zod schemas, oRPC contracts, validation                | Working with APIs, adding endpoints, type issues |
| [03-packages.md](./03-packages.md)                       | Shared packages, exports, patterns, import aliases                  | Using or modifying any `@netscript/*` package    |
| [04-services.md](./04-services.md)                       | Microservice structure, handlers, cross-service calls               | Working on backend services                      |
| [05-frontend.md](./05-frontend.md)                       | Fresh 2 routing, DeferPage, islands, SSE, components                | Working on frontend UI                           |
| [06-infrastructure.md](./06-infrastructure.md)           | .NET Aspire, code generation, databases, deployment                 | Infrastructure changes, adding services          |
| [07-workers-and-sagas.md](./07-workers-and-sagas.md)     | Job, saga, trigger, and generated registry workflows                | Background jobs, workflows, scheduling           |
| [08-workflow-guide.md](./08-workflow-guide.md)           | Key files by task type (build, fix, debug, deploy)                  | Any development task - **read this first**       |
| [09-glossary.md](./09-glossary.md)                       | Definitions of all project-specific terms                           | Encountering unfamiliar terms                    |
| [10-project-map.md](./10-project-map.md)                 | Complete file inventory with line counts                            | Finding specific files                           |
| [11-cli-deployment.md](./11-cli-deployment.md)           | `@netscript/cli` — build pipeline, Servy, runtime overrides         | Windows deployment, CI/CD, operator config       |
| [12-cli-scaffold.md](./12-cli-scaffold.md)               | `netscript init`, DB, plugin, marketplace stubs, and scaffold smoke | CLI scaffold work, generated project smoke tests |

## Doctrine Status

**Architecture standards for `packages/` and `plugins/`** are maintained in:

→ **`docs/architecture/doctrine/`**

Use **`.agents/skills/netscript-doctrine/SKILL.md`** as the navigator for archetypes, axioms,
anti-patterns, fitness gates, and architecture debt.

The active debt registry is:

→ **`.llm/harness/debt/arch-debt.md`**

`netscript-standards` is a legacy shim and is no longer an authority.

For dependency behavior, prefer local dependency notes before web search:

→ **`.resources/deps-docs/`**

Use these docs to deep-dive technical concepts, package APIs, and NetScript internal package notes
before reaching for external sources.

## Critical Rules

1. **NEVER delete `deno.lock`, `package-lock.json`, or cache/lock files** without explicit user
   permission
2. **NEVER run `deno cache --reload`** or similar cache-clearing commands without asking
3. **Contract-first**: Define contracts before implementation
4. **No hardcoded URLs**: Use Aspire service discovery (`services__{name}__{protocol}__{index}`)
5. **Wrap, don't reinvent**: Use existing tools (Prisma, oRPC, Fresh, Fedify)
6. **Never reinvent upstream types**: Use the upstream type directly, or extend/compose from it

## Quick Commands

```bash
deno task dev              # Start everything via Aspire
deno task dev:frontend     # Frontend only (Vite HMR)
deno task generate         # Regenerate types + Aspire code
deno task check:apps       # Type check apps
deno task check:packages   # Type check packages
deno task check:plugins    # Type check plugins
deno task check:services   # Type check services
deno task check:workers    # Type check workers
deno task check:sagas      # Type check sagas
deno task check:triggers   # Type check triggers
# Note: manual `deno check` requires --unstable-kv flag for Deno.Kv types.
# The sub-tasks above already include this flag.
deno doc npm:<pkg>         # Introspect npm package exports (works with --filter <Symbol>)
deno doc --filter <Symbol> npm:<pkg>  # e.g. deno doc --filter StreamResponse npm:@durable-streams/client
deno task lint             # Lint
deno task fmt              # Format
deno task test             # Run tests
deno task arch:check       # Phase B+ doctrine fitness gate composite
deno task db:init          # First-time Postgres database setup
deno task db:migrate       # Run migrations
deno task db:seed          # Seed data
deno task db:generate      # Generate Prisma client
```

## Architecture at a Glance

```
Configuration:  netscript.config.ts + appsettings.json
                         |
Contracts:      contracts/versions/v1/ (Zod -> oRPC)
                         |
Services:       users(:3000) products(:3001) orders(:3002)
                         |
Plugins:        workers-api(:8091) sagas-api(:8092) triggers-api
                         |
Background:     scheduler + worker + saga-processor + trigger-processor
                         |
Frontend:       Fresh 2 + Preact + Vite (:8000)
                         |
Infrastructure: .NET Aspire + MySQL + Postgres + Garnet + OTEL
```
