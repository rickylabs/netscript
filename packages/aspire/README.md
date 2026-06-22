# @netscript/aspire

SDK-neutral Aspire diagnostics, configuration parsing, and TypeScript AppHost helpers for NetScript plugin packages.

## Install

```sh
deno add jsr:@netscript/aspire
```

Composition, config, schema, type, adapter, and testing APIs live on typed subpaths:
`@netscript/aspire/application`, `@netscript/aspire/config`, `@netscript/aspire/schema`,
`@netscript/aspire/types`, `@netscript/aspire/adapters`, and `@netscript/aspire/testing`.

## Quick example

The root entrypoint exposes the diagnostic contract. Inspect an Aspire target and render its
JSON-stable report:

```ts
import { inspectAspire } from '@netscript/aspire';

const report = inspectAspire('./dotnet/AppHost');

console.log(report.summary);
console.log(report.details);
```

`inspectAspire()` accepts a builder, a resource list, or a path-like label and returns an
`InspectionReport` suitable for CLI rendering. No Aspire SDK types appear in any signature —
every function takes plain data and returns plain data.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/aspire/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
