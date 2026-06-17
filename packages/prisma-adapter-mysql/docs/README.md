---
package: '@netscript/prisma-adapter-mysql'
title: 'Prisma MySQL Adapter Documentation'
---

# Prisma MySQL Adapter Documentation

This directory documents the package-owned MySQL adapter surface for Prisma on Deno.

Use these pages when adding adapter behavior, reviewing permissions, or wiring the package into an
application.

## Sections

- [Architecture](./architecture.md) describes package boundaries and composition.
- [Concepts](./concepts.md) defines adapter vocabulary.
- [Getting started](./getting-started.md) shows the minimal setup path.
- [Recipes](./recipes/README.md) collects focused usage patterns.
- [Reference](./reference/README.md) summarizes exported symbols.

## Scope

The package owns the Prisma driver adapter bridge.

Generated Prisma clients, schemas, migrations, and application database lifecycle stay outside this
package.
