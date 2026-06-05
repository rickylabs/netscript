# Extension Axes

Sagas-core exposes extension points only where the architecture names a real axis. The `./abstracts`
subpath contains stub-only abstract bases for those axes.

## Allowed Bases

| Axis          | Port                   | Base                    |
| ------------- | ---------------------- | ----------------------- |
| Transport     | `SagaTransportPort`    | `AbstractSagaTransport` |
| Store         | `SagaStorePort`        | `AbstractSagaStore`     |
| Bus           | `SagaBusPort`          | `AbstractSagaBus`       |
| Agent runtime | `SagaAgentRuntimePort` | `AbstractAgentRuntime`  |

These bases do not provide behavior. Every member is abstract. They exist to give external
implementers a stable type to extend while keeping runtime logic in concrete packages.

## Not Allowed In Group E

- No outbox abstract base. The T2 port is reserved, but the base waits for a concrete outbox
  implementer.
- No history abstract base. The T3 port is reserved, but the base waits for a concrete history
  implementer.
- No clock base. `SagaClockPort` is small enough for direct implementation.
- No publisher base. `SagaPublisherPort` is implemented by plugin-layer and testing code directly.
- No protected shared state or protected helpers on abstract bases.
- No default methods that silently swallow missing functionality.

## Implementing A Transport

```ts
import { AbstractSagaTransport } from '@netscript/plugin-sagas-core/abstracts';
import type {
  SagaTransportHandler,
  SagaTransportSubscription,
} from '@netscript/plugin-sagas-core/ports';
import type { SagaMessage } from '@netscript/plugin-sagas-core/domain';

export class MyTransport extends AbstractSagaTransport {
  readonly id = 'my-transport';

  start(): Promise<void> {
    throw new Error('Implement transport startup.');
  }

  stop(_reason?: string): Promise<void> {
    throw new Error('Implement transport shutdown.');
  }

  publish(_topic: string, _message: SagaMessage): Promise<void> {
    throw new Error('Implement transport publishing.');
  }

  subscribe(
    _topic: string,
    _handler: SagaTransportHandler,
  ): Promise<SagaTransportSubscription> {
    throw new Error('Implement transport subscription.');
  }
}
```

Concrete implementations may also implement the port directly. Extending the base is optional.

## Versioning

If a port gains a method, the corresponding abstract base can gain an explicit default that throws
`SagasError.notImplemented()`. That is a versioning tool, not a shortcut for current Group E bases.
Current bases remain abstract-only.
