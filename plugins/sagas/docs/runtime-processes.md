# Runtime Processes

The plugin runtime process is separate from the core runtime engine. Core owns `createSagaRuntime()`;
the plugin owns the executable background process that loads a generated static registry and
supervises the runtime lifecycle.

## Supervisor

`SagaRuntimeSupervisor` owns one runtime instance:

1. Resolve saga definitions from an injected list or loader.
2. Create a runtime through an injected factory or the core `createSagaRuntime()`.
3. Register definitions.
4. Start the runtime.
5. Stop the runtime with an explicit reason.

The supervisor exposes immutable snapshots:

```ts
import { SagaRuntimeSupervisor } from '@netscript/plugin-sagas/runtime';

const supervisor = new SagaRuntimeSupervisor({
  definitions,
});

await supervisor.start();
const snapshot = supervisor.snapshot();
await supervisor.stop('deploy-restart');
```

The snapshot contains status, adapter, definition count, and the last failure message if startup
failed.

## Runner

`startSagaRunner()` creates a supervisor configured from the generated registry module:

```ts
import { startSagaRunner } from '@netscript/plugin-sagas/runtime';

const supervisor = await startSagaRunner({
  adapter: 'native',
  registryModule: './.netscript/generated/plugin-sagas/saga-registry.ts',
});
```

`runSagaRunner()` is the executable process loop. It starts the runner, waits for shutdown, then
stops the runtime.

The executable entrypoint is:

```text
plugins/sagas/src/runtime/saga-runner.ts
```

Aspire registers this path as the `sagas-runner` background resource.

## Registry Module Shape

The generated module may export any of these names:

- `sagaRegistry`
- `registry`
- `definitions`
- `default`

`sagaRegistry` and `registry` may be `ReadonlyMap<string, SagaDefinition>`. `definitions` and
`default` may be arrays of `SagaDefinition` values. The loader validates that every entry has the
minimum `SagaDefinition` shape before registration.

## Environment

The runner reads only two environment values:

| Variable                | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `SAGAS_ADAPTER`         | Optional `native` runtime adapter selection.             |
| `SAGAS_REGISTRY_MODULE` | Optional registry module specifier override.             |

If `SAGAS_ADAPTER` is omitted, the core runtime default is native. Unsupported adapter values fail
fast with `SagasError.validationFailed()`.

## Shutdown

The process waits for Deno shutdown signals only when `runSagaRunner()` is used or the entrypoint is
run directly. Windows uses `SIGINT` and `SIGBREAK`. Other platforms use `SIGINT` and `SIGTERM`.

Imports are side-effect-light: importing `@netscript/plugin-sagas/runtime` does not start a runtime,
load a registry, or install signal handlers.
