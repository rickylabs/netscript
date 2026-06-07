---
title: Database Architecture
description: A2 integration architecture for @netscript/database.
package: '@netscript/database'
order: 1
---

# Database Architecture

`@netscript/database` implements Archetype 2 (Integration). It owns database adapter contracts and
ships named adapters and helper entrypoints for Prisma-backed database integrations.

## Layer Diagram

```text
mod.ts / subpaths
  |
  +-- ports/        DatabaseAdapter and shared database contracts
  +-- adapters/     postgres, mssql, mysql implementations
  +-- extensions/   SQL JSON Prisma extension
  +-- scripts/      schema and migration tooling entrypoints
  +-- tracing       Prisma tracing helpers
  +-- testing/      mock adapter and adapter contract runner
```

## Public Surface Map

| Entrypoint                       | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `@netscript/database`            | Root utility and common adapter exports.        |
| `@netscript/database/ports`      | Contracts consumed by adapters and tests.       |
| `@netscript/database/adapters/*` | Technology-specific adapter implementations.    |
| `@netscript/database/extensions` | SQL JSON extension and field registry helpers.  |
| `@netscript/database/scripts`    | Prisma schema generation and migration helpers. |
| `@netscript/database/tracing`    | Prisma query tracing helpers.                   |
| `@netscript/database/testing`    | Mock adapter and contract runner.               |

## Axioms In Play

- A1: public contracts are explicit and exported through `ports/`.
- A7: adapters wrap Prisma and driver APIs directly instead of reimplementing drivers.
- A8: `interfaces/` was renamed to `ports/` so the folder name describes its role.
- A10: callers own configuration and resource lifecycle.

## Anti-Patterns Avoided

- AP-11: adapters do not create a global client at module load time.
- AP-17: the package no longer has an `interfaces/` folder.
- AP-19: README documents permissions for network, scripts, and pure type usage.
