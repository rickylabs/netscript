---
package: '@netscript/prisma-adapter-mysql'
title: 'Architecture'
---

# Architecture

Archetype: 2

`@netscript/prisma-adapter-mysql` is an Archetype 2 integration package.

It wraps a MySQL driver behind Prisma's driver adapter protocol.

## Boundaries

The package owns:

- adapter factory construction
- MySQL pool configuration
- connected adapter lifecycle
- transaction connection checkout and release
- MySQL field and value conversion
- MySQL error mapping
- server capability detection

The package does not own:

- Prisma schema generation
- generated Prisma clients
- migrations
- application configuration loading
- secret management
- real database provisioning

## Composition

Consumers create `PrismaMySqlAdapterFactory` through the `PrismaMySql` export.

Prisma calls `connect()` on the factory.

The factory creates the underlying MySQL pool and returns an internal connected adapter.

The connected adapter is represented publicly by `PrismaMySqlConnectedAdapter`.

## Public Surface

The package root exports stable, package-owned names.

Implementation helpers are not exported from the root because they depend on Prisma internal driver
utility types.

This keeps JSR documentation focused on the supported adapter surface.

## Permissions

The adapter requires network permission at runtime.

The package does not read environment variables or files by itself.

Consumers need `--allow-env` only when their application reads credentials.

Consumers need `--allow-read` only when their application reads TLS certificate files.
