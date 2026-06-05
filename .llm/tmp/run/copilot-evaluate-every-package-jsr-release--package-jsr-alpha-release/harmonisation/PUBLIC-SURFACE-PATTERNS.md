# NetScript Public-Surface Patterns Catalogue (v0.0.1-alpha)

> Status: **MUST** — every `@netscript/*` package's
> `docs/architecture.md` declares which of these patterns it uses, and its
> `mod.ts` exports MUST conform to the chosen pattern's stub template.

This document is the catalogue of accepted public-surface shapes in the
NetScript framework. It complements `STANDARDS.md` (which covers naming,
deno.json, README, tests) by codifying *the structural shape of the API
itself*.

---

## Pattern selection decision tree

```
Does the symbol have lifecycle (start/stop/dispose) or own mutable state?
├── No  → Function family (§ 1)  ← default
└── Yes → Does subclassing add named extension axes?
         ├── Yes → Abstract base + concrete default (§ 3)
         └── No  → Builder (§ 2)

Is the symbol declarative metadata consumed by a runtime?
└── Yes → DSL `define…` (§ 4) ← independent of above

Is the symbol "discover and pick one of many"?
└── Yes → Registry (§ 5) ← composes with any of the above
```

---

## 1. Function family

**When**: stateless behaviour, no extension axes, the 80% path is one
chained call (axiom A3).

**Examples**: `@netscript/streams` `createDurableStream(spec)`,
`@netscript/logger` `createLogger(opts)`, `@netscript/kv` `openKv(opts)`.

**Stub template**:

```ts
// src/public/mod.ts (curated barrel)
export { createLogger, type Logger, type CreateLoggerOptions } from './create-logger.ts';

// src/application/create-logger.ts
import type { LoggerPort } from '../ports/logger-port.ts';
import { ConsoleLoggerAdapter } from '../adapters/console-logger.adapter.ts';

/**
 * Creates a fully-configured {@link Logger} from `options`.
 *
 * @example Basic
 * ```ts
 * const log = createLogger({ level: "info" });
 * log.info("starting");
 * ```
 *
 * @example With trace context
 * ```ts
 * const log = createLogger({
 *   level: "debug",
 *   destination: ConsoleLoggerAdapter,
 *   correlation: () => Trace.current(),
 * });
 * ```
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const dest = options.destination ?? ConsoleLoggerAdapter;
  return Object.freeze({
    info: (msg, fields) => dest.write({ level: 'info', msg, fields }),
    warn: (msg, fields) => dest.write({ level: 'warn', msg, fields }),
    error: (msg, fields) => dest.write({ level: 'error', msg, fields }),
    debug: (msg, fields) => dest.write({ level: 'debug', msg, fields }),
    child: (bindings) => createLogger({ ...options, bindings }),
  } satisfies Logger);
}

export interface CreateLoggerOptions {
  readonly level?: 'debug' | 'info' | 'warn' | 'error';
  readonly destination?: LoggerPort;
  readonly bindings?: Record<string, unknown>;
  readonly correlation?: () => { traceId: string; spanId: string } | undefined;
}

export interface Logger {
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  debug(msg: string, fields?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}
```

**Invariants**:

- Return type is **explicit** (no inferred return).
- `Logger` is an interface (not a class) — instances are frozen plain objects.
- Options bag is `<Function>Options` (STANDARDS § 4.2).
- Ports/adapters live in dedicated files; the factory just wires them.

---

## 2. Builder (fluent)

**When**: multi-step deferred construction with optional steps, where the
final shape is constructed conditionally.

**Examples**: `@netscript/cli` `createPublicCli().withCommand(…)`,
`@netscript/service` `buildService().withRoute(…).withPlugin(…)`.

**Stub template**:

```ts
// src/public/mod.ts
export { buildService, type ServiceBuilder, type Service } from './build-service.ts';

// src/application/build-service.ts
export function buildService(name: string): ServiceBuilder {
  return new ServiceBuilderImpl(name);
}

export interface ServiceBuilder {
  withRoute<TName extends string>(route: RouteDefinition<TName>): ServiceBuilder;
  withPlugin<TPlugin extends PluginDefinition>(plugin: TPlugin): ServiceBuilder;
  withMiddleware(mw: Middleware): ServiceBuilder;
  build(): Service;
}

class ServiceBuilderImpl implements ServiceBuilder {
  readonly #routes: RouteDefinition[] = [];
  readonly #plugins: PluginDefinition[] = [];
  readonly #middlewares: Middleware[] = [];
  constructor(private readonly name: string) {}

  withRoute(route: RouteDefinition): ServiceBuilder {
    this.#routes.push(route);
    return this;
  }
  withPlugin(plugin: PluginDefinition): ServiceBuilder {
    this.#plugins.push(plugin);
    return this;
  }
  withMiddleware(mw: Middleware): ServiceBuilder {
    this.#middlewares.push(mw);
    return this;
  }
  build(): Service {
    return new Service(this.name, [...this.#routes], [...this.#plugins], [...this.#middlewares]);
  }
}
```

**Invariants**:

- The interface (`ServiceBuilder`) is what's exported. The implementation
  class is **internal** (no `export`).
- Every `with…` method returns the **same** interface type. No accumulator
  generics threading through chained calls (that triggers slow-types).
- `.build()` produces an immutable result.
- Fluent methods MUST be named `with…` (STANDARDS § 4.1). Forbidden: `add…`,
  `set…`, `register…` for chained options.

---

## 3. Abstract base + concrete default (class hierarchy)

**When**: long-lived stateful runtime with lifecycle, supervision, and
named extension axes (axiom A4).

**Examples**: `@netscript/workers` `BaseWorker`, `@netscript/sagas`
`BaseSagaRunner`, `@netscript/triggers` `BaseTriggerHandler`.

### 3.1 Decision: function vs class

Use a class **only** when at least 2 of these hold:

1. The instance has a non-trivial lifecycle (`start`/`stop`/`dispose`).
2. The instance owns mutable in-memory state across calls.
3. Subclasses provide named extension axes (e.g. `protected onStep(ctx)` hook).
4. The instance is consumed by `instanceof` checks at framework boundaries.
5. Multiple operations share an expensive resource (connection pool,
   subprocess) that benefits from co-location.

Otherwise, function family (§ 1) is correct.

### 3.2 Stub template

```ts
// src/public/mod.ts
export {
  type Worker,
  BaseWorker,
  type BaseWorkerOptions,
  type ExecutionContext,
  type RetryDecision,
} from './worker.ts';
export { DefaultWorker, type DefaultWorkerOptions } from './default-worker.ts';

// src/runtime/worker.base.ts
/**
 * Contract every `@netscript/workers` worker satisfies. Subclass {@link BaseWorker}
 * to inherit the canonical lifecycle, supervision, retry, and DLQ behaviour.
 */
export interface Worker<TPayload> {
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  readonly status: 'idle' | 'running' | 'stopped';
}

/**
 * Base class for NetScript workers. Subclasses MUST override {@link execute}
 * and MAY override {@link onError}, {@link onStart}, {@link onStop}.
 */
export abstract class BaseWorker<TPayload> implements Worker<TPayload> {
  #status: 'idle' | 'running' | 'stopped' = 'idle';

  constructor(protected readonly options: BaseWorkerOptions) {}

  /** Override to perform the actual work. Must be idempotent. */
  protected abstract execute(payload: TPayload, ctx: ExecutionContext): Promise<void>;

  /** Override to customise crash policy. Default: bounded retry then DLQ. */
  protected onError(err: Error, _payload: TPayload): RetryDecision {
    return { retry: true, after: this.options.retryDelay ?? 1_000, max: this.options.maxRetries ?? 3 };
  }

  /** Override for warm-up. Called once before first {@link execute}. */
  protected onStart(): Promise<void> { return Promise.resolve(); }

  /** Override for cleanup. Called once after the last {@link execute}. */
  protected onStop(): Promise<void> { return Promise.resolve(); }

  /** @sealed — call sites: framework supervisor */
  async start(): Promise<void> {
    if (this.#status !== 'idle') throw new WorkerAlreadyStartedError();
    this.#status = 'running';
    await this.onStart();
  }

  /** @sealed */
  async stop(_reason?: string): Promise<void> {
    if (this.#status !== 'running') return;
    this.#status = 'stopped';
    await this.onStop();
  }

  get status(): 'idle' | 'running' | 'stopped' { return this.#status; }
}

export interface BaseWorkerOptions {
  readonly name: string;
  readonly retryDelay?: number;
  readonly maxRetries?: number;
}

export interface ExecutionContext {
  readonly attempt: number;
  readonly logger: Logger;
  readonly span: Span;
  readonly signal: AbortSignal;
}

export interface RetryDecision {
  readonly retry: boolean;
  readonly after?: number;
  readonly max?: number;
}

// src/runtime/default-worker.ts
/**
 * Default concrete {@link BaseWorker} that delegates to a callback. Use when
 * you don't need a subclass identity.
 */
export class DefaultWorker<TPayload> extends BaseWorker<TPayload> {
  constructor(options: DefaultWorkerOptions<TPayload>) {
    super(options);
    this.#callback = options.run;
  }
  readonly #callback: (payload: TPayload, ctx: ExecutionContext) => Promise<void>;

  protected execute(payload: TPayload, ctx: ExecutionContext): Promise<void> {
    return this.#callback(payload, ctx);
  }
}

export interface DefaultWorkerOptions<TPayload> extends BaseWorkerOptions {
  readonly run: (payload: TPayload, ctx: ExecutionContext) => Promise<void>;
}
```

**Invariants**:

- The base class file (`worker.base.ts`) holds **only** the abstract class
  + its types. No concrete behaviour beyond the lifecycle skeleton.
- The concrete default lives in a sibling file (`default-worker.ts`).
- Public lifecycle methods (`start`, `stop`) are documented `@sealed` and
  contain only orchestration — they delegate to `protected` hooks.
- Subclasses get **named extension axes** (`execute`, `onError`, `onStart`,
  `onStop`) — never a single `customize(opts)` god-method.
- Mutable state (`#status`) is private (`#` prefix), exposed via getter.
- The abstract class **does not import adapters**. It calls `protected`
  hooks that the runtime supervisor wires up.
- Generics are slot generics (`<TPayload>`) at the class level only — no
  generic threading through method signatures that would cause slow-types.

### 3.3 Forbidden

- Classes that violate Liskov (subclass throws on a parent's method).
- Inheritance ≥ 3 deep (use composition).
- Public mutable fields on the base.
- Protected static helpers shared between base and unrelated subclasses
  (use a sibling utility module imported by both, or a domain object).
- Calling adapters from the base — adapters are wired in via the runtime
  supervisor, never directly accessed by the base.

---

## 4. DSL `define…`

**When**: declarative artefacts the runtime consumes; need IDE auto-complete
and type narrowing.

**Examples**: `@netscript/triggers` `defineTrigger`,
`@netscript/plugin` `definePlugin`, `@netscript/sagas` `defineSaga`.

**Stub template**:

```ts
// src/public/mod.ts
export { defineTrigger, type TriggerDefinition, type TriggerSpec } from './define-trigger.ts';

// src/domain/define-trigger.ts
import type { ZodType } from 'zod';

/**
 * Declarative description of a trigger consumed by the {@link TriggerRunner}.
 * Use {@link defineTrigger} to construct.
 */
export interface TriggerDefinition<TName extends string = string, TPayload = unknown> {
  readonly kind: 'trigger';
  readonly name: TName;
  readonly payload: ZodType<TPayload>;
  readonly handler: (payload: TPayload, ctx: TriggerContext) => Promise<void>;
  readonly schedule?: TriggerSchedule;
  readonly metadata: TriggerMetadata;
}

export interface TriggerSpec<TName extends string, TPayload> {
  readonly name: TName;
  readonly payload: ZodType<TPayload>;
  readonly handler: (payload: TPayload, ctx: TriggerContext) => Promise<void>;
  readonly schedule?: TriggerSchedule;
  readonly metadata?: Partial<TriggerMetadata>;
}

/**
 * Define a trigger. The returned {@link TriggerDefinition} is consumed by
 * {@link createTriggerRuntime} or by `definePlugin` in `@netscript/plugin`.
 */
export function defineTrigger<TName extends string, TPayload>(
  spec: TriggerSpec<TName, TPayload>,
): TriggerDefinition<TName, TPayload> {
  return Object.freeze({
    kind: 'trigger' as const,
    name: spec.name,
    payload: spec.payload,
    handler: spec.handler,
    schedule: spec.schedule,
    metadata: { addedAt: new Date(), ...spec.metadata },
  });
}
```

**Invariants**:

- Function signature has explicit slot generics; return type is the public
  `<Noun>Definition` interface (never inferred).
- The returned object is **frozen** (`Object.freeze`).
- Tag field (`kind: 'trigger'`) lets registries discriminate via union.
- Spec input has its own type (`<Noun>Spec`) — never `<Noun>DefinitionInput`,
  never inline `{…}` parameter type.
- No options bag — DSL inputs are positional spec objects only.

---

## 5. Registry

**When**: dynamic discovery of plugins/contracts/adapters.

**Examples**: `@netscript/plugin` `PluginRegistry`,
`@netscript/triggers` `TriggerRegistry`,
`@netscript/contracts` `ContractRegistry`.

**Stub template**:

```ts
// src/public/mod.ts
export { PluginRegistry, type PluginRegistryOptions } from './plugin-registry.ts';

// src/runtime/plugin-registry.ts
/**
 * In-memory registry of {@link PluginDefinition}s. Constructed via the
 * composition root and shared across the application.
 *
 * @example
 * ```ts
 * const registry = new PluginRegistry();
 * registry.register(definePlugin({ name: "hello-world", ... }));
 * const plugin = registry.resolve("hello-world");
 * ```
 */
export class PluginRegistry {
  readonly #items = new Map<string, PluginDefinition>();
  readonly #frozen = false;

  constructor(_options: PluginRegistryOptions = {}) {}

  register(definition: PluginDefinition): void {
    if (this.#frozen) throw new RegistryFrozenError();
    if (this.#items.has(definition.name)) {
      throw new DuplicatePluginError(definition.name);
    }
    this.#items.set(definition.name, definition);
  }

  resolve(name: string): PluginDefinition {
    const item = this.#items.get(name);
    if (!item) throw new UnknownPluginError(name);
    return item;
  }

  list(): readonly PluginDefinition[] {
    return [...this.#items.values()];
  }

  freeze(): void { (this as { '#frozen': boolean })['#frozen'] = true; }
}
```

**Invariants**:

- The registry **owns** the lookup map; consumers receive read-only views
  (`list()` returns `readonly`).
- `register` is idempotent only if explicitly documented; default is reject
  duplicates with `Duplicate<Noun>Error`.
- Registries are **freezable** (`.freeze()`) — after composition root is
  built, the registry should be immutable for the rest of the lifecycle.
- No ambient global state — registries are created per composition root
  (axiom A10).

---

## 6. Combining patterns

Patterns compose:

- A package can ship a **DSL** (`defineTrigger`) feeding a **registry**
  (`TriggerRegistry`) consumed by an **abstract base + default** runtime
  (`BaseTriggerRunner` / `DefaultTriggerRunner`).
- A package can ship a **builder** (`buildService`) whose `.build()`
  returns a frozen output produced by a function-family helper.
- A package can ship a **function family** that internally uses a **builder**
  (cli has both: `createPublicCli` is a function but its config object is
  built by an internal builder).

The layering rule: lower-level patterns (function family, DSL, registry)
should not depend on higher-level patterns (builder, abstract base) of the
same package.

---

## 7. Per-archetype default pattern map

This is the v0.0.1-alpha mapping every package's `mod.ts` should match.
Deviations require an entry in `arch-debt.md`.

| Archetype | Default pattern | Examples |
|---|---|---|
| **A1** Small Contract | Function family + DSL | shared, contracts, runtime-config, streams, config |
| **A2** Integration | Function family + ports + adapter contract | logger, telemetry, aspire, kv, database, queue, cron |
| **A3** Runtime/Behavior | Abstract base + default + registry | watchers, triggers, workers, sagas |
| **A4** DSL/Builder | Builder + DSL + registry | sdk, service, fresh, fresh-ui, plugin |
| **A5** Plugin | DSL on top of @netscript/plugin | plugins/* |
| **A6** Tooling | Builder + composition root | cli |

---

## 8. Anti-patterns explicitly forbidden

1. **God-method customization**: a single `customize(opts)` accepting a 50-key
   options bag. Use named extension axes.
2. **Hidden mutation**: a function-family API that mutates the input options.
3. **Inheritance for code reuse**: extending a base class purely to share a
   helper. Use composition or a domain object.
4. **Configuration via global module state**: `setLogger(loggerInstance)` on a
   module export. Use composition root.
5. **Overloaded factory**: `createX(string)` and `createX(opts)` both valid.
   Pick one; if you must accept multiple shapes, take a discriminated union.
6. **Untyped extension hook**: `protected hook(...args: any[]): any`. Use a
   typed `<Hook>Spec` and a typed return.
7. **Tuple results**: `[result, error]`. Use a discriminated union or throw
   a typed error.
8. **`default` exports**: penalised by JSR scoring; break re-export ergonomics.
9. **`as any` to satisfy the type checker** at the published boundary. Lift
   the type or rethink the abstraction.
10. **Re-exporting third-party types under your own name**: don't rebrand
    `Zod.ZodType` as `NetScriptSchema` unless the wrapping reason is
    documented.
