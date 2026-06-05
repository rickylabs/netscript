# Scaffolding And Operations

The sagas plugin owns the generated runtime registry path. This is important because workers should
not emit or own saga registries.

## Generated Registry

The default generated registry path is:

```text
.netscript/generated/plugin-sagas/saga-registry.ts
```

The generated file imports userland fluent saga definition modules and exports:

- `sagaRegistry`
- `registry`

Both are readonly maps keyed by saga id. The runtime runner can load either export.

## CLI Commands

The CLI model exposes three commands:

| Command             | Purpose                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| `generate-registry` | Inspect saga source roots and emit the generated static registry.                   |
| `inspect`           | Report discovered saga source metadata.                                             |
| `codemod`           | Produce or write migration edits from legacy saga imports to the new package split. |

The local backend uses an injected project-files boundary. Filesystem access stays in the CLI
adapter and does not leak into the manifest, runtime, or scaffolding modules.

## Scaffolded Files

`SagaDefinitionScaffolder` creates fluent userland definitions that import from
`@netscript/plugin-sagas-core`. `SagaConfigScaffolder` creates config-owned saga group entries using
the config builder surface.

The plugin scaffold manifest declares the runtime registry generation script:

```text
src/cli/generate-runtime-registries.ts
```

The generated registry imports only core domain types. It does not import the plugin runtime SDK or
legacy saga package.

## Operational Gates

The plugin exposes E2E gate definitions through `@netscript/plugin-sagas/e2e`:

- `sagas.health`
- `sagas.roundtrip`

The health probe calls `/health`. The roundtrip probe publishes a synthetic message to
`/api/v1/sagas/publish`. Probe code is the only E2E location that uses process environment values
and direct HTTP fetch.

## Migration Discipline

During Group E, some legacy service and stream files still point at the old saga package. Those are
removed by the locked migration slices after the plugin layer is complete.

New `src/` plugin code follows these rules:

- No saga bus or saga registry singleton accessors.
- No public upstream saga bus package exports.
- No direct worker-owned saga registry generation.
- No userland imports from the plugin package for saga definitions.
- Runtime state belongs to a composition root or a `SagaRuntimeSupervisor` instance.
