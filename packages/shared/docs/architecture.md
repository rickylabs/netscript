---
title: Shared Architecture
description: Architecture notes for the NetScript shared contract package.
package: '@netscript/shared'
order: 2
---

# @netscript/shared Architecture

`@netscript/shared` is the foundation package for NetScript package and plugin contracts.

## Public surface

The package publishes one root export:

```ts
export * from './src/public/mod.ts';
```

The root exports contract primitives, pagination schemas, shared error schemas, validation helper
factories, error helpers, schema interfaces, and diagnostics.

## Folder split

- `src/domain/` contains constants, data shapes, result types, schema interfaces, and shared error
  data.
- `src/application/` contains Zod-backed helper factories and the oRPC base contract primitive.
- `src/diagnostics/` contains JSON-stable package inspection.
- `src/public/` contains the package barrel.

## Dependency boundary

Runtime values are backed by Zod and oRPC.

Published type signatures use package-owned types such as `SharedSchema` and `BaseContractProcedure`
so generated JSR docs do not expose dependency-private type graphs.

## Legacy workspace path

The `utils/` folder remains in the repository for existing plugin worktrees that import
`@shared/utils`.

That folder is excluded from the package publish include set and is not part of the JSR export map.
The former datetime helper was removed instead of wrapped because Temporal is stable in the target
Deno runtime and packages should use Temporal directly or define local clock ports.

## Fitness gates

This package is expected to pass:

- `deno publish --dry-run --allow-dirty`
- `deno doc --lint packages/shared/mod.ts`
- `deno run --allow-read tools/fitness/check-netscript-standards.ts --root packages/shared --text`
- `deno test --allow-all packages/shared`
- `deno task check`
