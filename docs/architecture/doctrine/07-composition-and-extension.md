# Composition and Extension

Axioms governed: A10, A11.

A package becomes an architecture when other code starts to depend on it. The doctrine here governs
two questions:

1. _How is the package itself composed?_ (Composition root, constructor injection, when to escalate
   to a container.)
2. _How do consumers extend the package?_ (Extension axes, named variability, registration, refusal
   of premature abstraction.)

## Composition root — `createX()` over containers

The **composition root** is the single place a package wires its collaborators. By default it is a
plain function:

```ts
// packages/workers/src/application/create-worker-runtime.ts
export function createWorkerRuntime(options: WorkerRuntimeOptions): WorkerRuntime {
  const clock = options.clock ?? new SystemClock();
  const store = options.store ?? new KvWorkerStore(options.kv ?? Deno.openKv(), clock);
  const queue = options.queue ?? new KvWorkerQueue(store, clock);
  const supervisor = new WorkerSupervisor(options.supervisorPolicy ?? defaultSupervisorPolicy());
  const telemetry = options.telemetry ?? createNoOpTelemetry();
  const executor = new WorkerExecutor(store, queue, supervisor, telemetry, clock);
  return new WorkerRuntime(executor, store, queue, telemetry);
}
```

Properties:

- One function. One file.
- Defaults are explicit and named.
- Each `?? new X(...)` is a documented decision: "if the caller did not provide one, here is what we
  use."
- The function returns the runtime; the caller owns its lifecycle.
- No global state. No module-load-time side effects.

This is the .NET `IServiceCollection` pattern stripped to its essence. We pay none of the ceremony,
we keep all of the discipline.

## When to escalate to a container

A typed container (the shape of `needle-di` or `@brad-jones/deno-net-container`) is permitted only
when _all three_ hold:

1. **Many modules contribute providers.** The composition root would have to import dozens of files,
   and the wiring grows non-linearly with feature count.
2. **Runtime composition is ordered or dependent.** Some providers must be created before others,
   and the order is data-driven (e.g. plugin A registers a provider that plugin B consumes).
3. **Lifetimes matter at the type level.** A scoped service must not leak into a singleton; the
   compiler should help us catch it.

If only one or two of those hold, use a plain factory. A typed container costs more than people
realize: extra ceremony at the composition root, harder traceability when a wire fails, and a
performance and bundle cost on every consumer.

When a container _is_ warranted, it must:

- be a plain TypeScript module (no decorators required for the caller),
- use _typed tokens_ (`const WorkerStorePort = createToken<WorkerStorePort>()`) rather than string
  keys,
- expose a single `register(...)` per provider plus a `resolve(token)` surface, and
- be testable by replacing tokens, not by mocking the container.

The doctrine _does not_ mandate building a NetScript container. Until a real composition need
appears, we use factories.

## Constructor injection as the universal seam

Every collaborator that has a _test seam_ worth keeping is constructor-injected. The injection rule:

> If you can imagine a test that wants to replace this collaborator — replace it with a fake clock,
> a recording reporter, an in-memory store — it is an injected constructor parameter. Not a field.
> Not a default. A parameter.

The corollary: a class with five fields and a no-arg constructor is suspicious. Either nothing is
injected (the class is a value object, fine) or injection has been hidden behind a hidden default
(the class is hard to test, not fine).

## Extension axes — name the variability before abstracting

When you find yourself wanting an interface, ask: _what varies_? Write the name down. If the name is
generic ("base", "plugin", "capability"), the abstraction is premature.

Concrete extension axes we already have or anticipate:

| Axis name          | Variants today / planned                |
| ------------------ | --------------------------------------- |
| Database engine    | postgres, mysql, sqlite                 |
| Saga store         | memory, kv, postgres                    |
| Worker store       | memory, kv, postgres                    |
| Trigger transport  | kv, postgres, redis (future)            |
| Deploy target      | windows-service, docker, cloud (future) |
| Runtime kind       | aspire, bare-deno, ci-runner            |
| Plugin kind        | api, worker, saga, trigger              |
| Contract version   | v1, v2, …                               |
| Telemetry exporter | otel, console, none                     |
| Resource source    | local, jsr                              |
| Frontend framework | fresh (today), future expansion         |

For each axis, the doctrine demands:

1. **A typed identifier** (`type DatabaseEngine = 'postgres' | 'mysql'`).
2. **A factory function** that maps the identifier to the concrete collaborator
   (`createDatabaseAdapter(engine, options)`).
3. **A registration mechanism** if the axis is open to consumers (e.g. plugin authors registering a
   new database engine — this is rare, so think hard before opening the axis).

If you cannot name the axis cleanly, do not abstract. Two adapters with two file paths and a
discriminated union are perfectly fine.

## Registration over inheritance for cross-package extension

Consumers of a `packages/*` package extend it by _registering_, not by _subclassing_.

```ts
// FORBIDDEN: cross-package implementation inheritance
import { DeployFlowBase } from '@netscript/cli';
class CloudDeployFlow extends DeployFlowBase { ... }

// REQUIRED: register against an axis
import { registerDeployTarget } from '@netscript/cli';
import { createCloudDeployFlow } from './my-cloud-deploy.ts';

registerDeployTarget('cloud', (ctx) => createCloudDeployFlow(ctx));
```

The package owns the base class. The consumer provides a _factory_ for the new variant. The
factory's _return type_ is a contract the package's runner consumes. There is no inheritance across
the package boundary.

This rule is non-negotiable because:

- Subclassing imports the base's _implementation_; the base is then forced to make its protected
  fields part of its public contract (cf. Bloch 18).
- Subclassing fragments the package's surface across consumer packages, so a JSR audit cannot keep
  the surface coherent.
- Registration scales: the package can validate the registration at composition time, log it, and
  reject duplicates with a clear error.

## Plugin discovery and loading

NetScript plugins use _file-system-based discovery_ under `plugins/`. The doctrine for the loader:

- Plugin packages declare metadata through a typed `definePlugin()` builder (Archetype 4 surface).
- The loader resolves plugins explicitly. There is no "auto discovery from `node_modules`" magic.
- A loaded plugin contributes a _named registration_ against one or more extension axes (a
  `plugin-workers` plugin contributes worker job definitions; a `plugin-sagas` plugin contributes
  saga definitions).
- Duplicate names across plugins are rejected with a structured error referencing both contributors.
- Plugin load order is deterministic. Order-dependence between plugins is forbidden and asserted.

## Configuration as a typed boundary, not a global

Each package owns a typed configuration shape:

```ts
export interface WorkerRuntimeOptions {
  readonly kv?: Deno.Kv;
  readonly clock?: ClockPort;
  readonly store?: WorkerStorePort;
  readonly queue?: WorkerQueuePort;
  readonly telemetry?: TelemetryPort;
  readonly supervisorPolicy?: SupervisorPolicy;
}
```

Properties:

- `readonly` everywhere; the runtime never mutates the options object.
- Optional fields with documented defaults.
- No environment variables read inside the package; the _caller_ reads env, validates with Zod (or
  `@netscript/runtime-config`), and passes typed options.
- Defaults are pure functions in the package; the caller can inspect them
  (`defaultSupervisorPolicy()` is exported).

Anti-pattern: a package that calls `Deno.env.get()` inside its runtime to read configuration. This
couples the package to the process environment and breaks portability across consumers.

## Optional dependencies and progressive enhancement

When a package can use a collaborator if present and degrade gracefully if not, the option is a
_named optional_, not a try/catch inside the runtime:

```ts
// GOOD
const telemetry = options.telemetry ?? createNoOpTelemetry();
runtime.recordSpan(telemetry, 'job.execute', () => execute(job));

// BAD
let telemetry;
try {
  telemetry = await import('@netscript/telemetry');
} catch { /* nothing */ }
```

The package's contract is "here is the no-op default." The caller upgrades by passing a real
implementation. This shape composes; try/catch-import does not.

## Concrete repo examples

### `packages/sagas` — composition root

The current `factory/create-saga-bus.ts` is the right shape. The doctrine endorses it. Improvements:
ensure every collaborator (store, transport, middleware, telemetry) is a constructor parameter with
a default; export the default factory functions so callers can inspect what they are getting.

### `packages/cli` — extension via registration

The CLI's plugin and database extension axes today are partially file-discovered. The doctrine
direction:

- Define typed axes (`DatabaseEngine`, `DeployTarget`, `RuntimeKind`).
- Expose `registerX(name, factory)` functions.
- The CLI's flows resolve the factory at composition time, not at flow-definition time. (Today's
  `pipeline.ts` mixes these phases.)

## Composition declarativity (R-COMP-DECL)

A composition root is _declarative_ code: a sequence of `new X(...)` expressions and named defaults.
The body of a composition file does not contain control flow that decides _what_ to wire — only
control flow that supplies _defaults_ via `?? new Default(...)`.

The shape constraint:

- A composition file's top-level body contains **only**: imports, type declarations for options,
  optional default factories, and the `createX()` function itself.
- The `createX()` function body is a flat sequence of `const x = ?? new ...` bindings followed by a
  single `return new Runtime(...)` expression.
- No inline class definitions in the composition file. No configuration parsing (defer to the
  caller). No conditional branches that switch on user input. No side effects at module load.

Per-archetype rules add presentational constraints (e.g. for CLI archetype, see R-A6-N5: composition
body is exclusively a declarative class returning the top-level command list, no inline `.command()`
chains). The general rule is: if reading the composition file does not let the reader predict the
runtime graph, the file has earned logic it should not own.

**What composition declarativity prevents:**

- 300-line composition files that build commands, parse flags, and dispatch actions inline. The
  composition is no longer a wiring document; it is application code that happens to live in the
  factory.
- Hidden ordering: a composition that conditionally creates X before Y depending on caller input has
  smuggled application logic into the wiring layer.
- Stale wiring: when wiring lives in many places, no single file describes the runtime graph, and
  refactors break adapters that were wired three indirections away.

**The auditor test.** Open the composition file. Read top-to-bottom once. The reader should be able
to draw the dependency graph from memory. If the reader needs to chase imports and follow control
flow, the composition has lost declarativity.

## Extension-points manifest (R-COMP-EXT-MANIFEST)

A package with **two or more** extension axes (registries, plugin factories, named-variant maps)
exports a single `extension-points.ts` (or `extension-points/index.ts` if many) at a documented
path. The manifest:

- Re-exports every `Registry` class (or registration token) the package owns.
- Documents each extension axis with a one-line summary and a link to the registry's primary class.
- Names the file the auditor and contributor open first when asked "where do I add a new variant?".

The manifest is **not** a barrel for the package's public surface — that role belongs to `mod.ts`.
The manifest is a discoverability document, audited separately. A package may keep its registries
internal (not exported in `mod.ts`) and still publish a manifest for maintainers and AI agents.

```ts
// packages/cli/src/kernel/extension-points.ts

/**
 * @module
 * Extension points for `@netscript/cli`.
 *
 * Each export is the registry class for one extension axis. To
 * add a new variant: implement the registry's element interface
 * and call `register(...)` at composition time.
 */

export { PluginKindRegistry } from './application/registries/plugin-kind-registry.ts';
export { DbEngineRegistry } from './application/registries/db-engine-registry.ts';
export { TemplateRegistry } from './application/registries/template-registry.ts';
export { OutputRendererRegistry } from './application/registries/output-renderer-registry.ts';
export { DeployTargetRegistry } from './application/registries/deploy-target-registry.ts';
```

**Audit rule:** every `Registry` subclass under the package's `src/` is either exported from
`extension-points.ts` or is declared explicitly internal (and the auditor can verify the
declaration). A registry that is neither in the manifest nor explicitly internal fails the audit.

## Composition and extension checklist

- [ ] Composition root is a single `createX()` function.
- [ ] Composition declarativity (R-COMP-DECL): the composition file body is wiring only — no inline
      application logic, no conditional branches over user input, no side effects at module load.
- [ ] Every collaborator with a test seam is a constructor parameter (with a documented default if
      optional).
- [ ] No environment access inside the package; configuration is typed options.
- [ ] Extension axes are named with typed identifiers; factories map identifier → adapter.
- [ ] Cross-package extension uses _registration_, not inheritance.
- [ ] Extension-points manifest (R-COMP-EXT-MANIFEST): a package with ≥ 2 extension axes exports a
      documented `extension-points.ts` aggregating every registry.
- [ ] No typed container unless three conditions hold (many providers, ordered composition,
      lifetimes that must be enforced at the type level).
- [ ] Optional dependencies use `?? defaultX()`; never try/catch imports.
