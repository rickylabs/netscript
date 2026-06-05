# Concepts

`@netscript/shared` is a vocabulary package.

## Shared schema

A shared schema is any runtime validation value that supports the small documented contract exported
as `SharedSchema`.

The current implementation uses Zod, but package docs and public signatures avoid depending on Zod
class names. This keeps JSR documentation stable and prevents dependency-private types from becoming
part of the NetScript public contract.

## Shared object schema

`SharedObjectSchema` extends `SharedSchema` with `extend()`.

This is enough for consumers that need to compose endpoint-specific filters with the shared
pagination query schema.

## Shared procedure

`BaseContractProcedure` is an opaque oRPC contract procedure marker.

It intentionally exposes only the public `~orpc` marker needed by oRPC implementers. Consumers
should compose procedures through `baseContract` instead of depending on the full dependency type.

## Published surface

The JSR package publishes only the root entry point.

Workspace-only aliases such as `@shared/utils` are compatibility debt for later plugin waves and are
not exported by the package.
