# Base Classes, Derived Classes, and the Stub-Only Contract

Axioms governed: A4, A5.

A base class is a contract for a lifecycle that multiple concrete implementations must honor. It is
_not_ utility inheritance, code sharing, or a place to hide cleverness. The discipline below makes
the difference between a base class that earns its place and one that becomes the next 1,000-line
monolith.

## When a base class is appropriate

Use a base class only when _all four_ hold:

1. **A real subtype hierarchy exists.** There are at least two genuine concrete types that vary
   along a named axis: deploy target (`windows-service`, `docker`), database engine (`postgres`,
   `mysql`), runtime kind (`aspire`, `bare`), saga store (`memory`, `kv`, `postgres`).
2. **Callers will encounter the polymorphism.** A consumer chooses one concrete type at composition
   time. If the only "subtype" is private, just use a plain class.
3. **The lifecycle is invariant across subtypes.** Every subtype follows the same sequence of
   phases. The base names them; the subtype implements them.
4. **The base class lives in the same package as its subtypes.** Cross-package implementation
   inheritance is forbidden (Bloch Item 18).

If any of those four fail, do not introduce a base class. Use a discriminated union, a strategy
interface, or a plain class with constructor injection.

## The stub-only rule

> Base classes contain abstract methods only.

A base class has:

- **Abstract method declarations** — the lifecycle stubs.
- **Readonly identity fields** — `id`, `kind`, `version` — declared `abstract readonly` so subtypes
  are forced to provide them.
- **Type parameters** — for plan, definition, evidence, result.

A base class does _not_ have:

- Concrete method implementations.
- Mutable fields.
- Constructor parameters that imply state.
- Logging, telemetry, retry, error normalization, or filesystem code.
- A "convenience" `run()` method that orchestrates the abstract methods. Orchestration belongs to a
  _runner_, not the base.

The reason is simple: every concrete method on a base class is a piece of behavior the base imposes
on every subtype, every test, and every future subtype we have not invented yet. If the behavior is
truly universal, it can be a free function the runner calls _around_ the subtype.

### Example — a stub-only deploy base

```ts
export abstract class DeployFlowBase<TDefinition, TPlan, TEvidence> {
  abstract readonly id: DeployFlowId;
  abstract readonly target: DeployTarget;

  abstract define(context: DeployDefinitionContext): TDefinition;
  abstract plan(context: DeployPlanningContext, definition: TDefinition): TPlan;
  abstract build(context: DeployBuildContext, plan: TPlan): Promise<void>;
  abstract package(context: DeployPackageContext, plan: TPlan): Promise<void>;
  abstract install(context: DeployInstallContext, plan: TPlan): Promise<void>;
  abstract start(context: DeployStartContext, plan: TPlan): Promise<void>;
  abstract inspect(context: DeployInspectionContext, plan: TPlan): Promise<TEvidence>;
  abstract verify(
    context: DeployVerificationContext,
    evidence: TEvidence,
  ): Promise<DeployVerification>;
  abstract summarize(
    context: DeploySummaryContext,
    verification: DeployVerification,
  ): DeploySummary;
}
```

Notice what is missing: there is no `run()`, no `try/catch`, no default implementation of
`summarize()` that subtypes inherit. The _runner_ (a separate class) iterates the lifecycle,
captures evidence, and routes errors to the supervisor.

## Concrete classes are thin dispatchers

A concrete subtype:

- Lives in the same package as its base.
- Has identity fields as `readonly` constants.
- Constructor-injects the modules it delegates to.
- Implements each abstract method as **one line of delegation** to a named module.

### Example — Postgres database scaffold flow

```ts
export class PostgresDatabaseScaffoldFlow extends DatabaseScaffoldFlowBase<
  PostgresDefinition,
  PostgresPlan,
  PostgresEvidence
> {
  readonly id = 'database.scaffold.postgres';
  readonly engine = 'postgres' as const;

  constructor(
    private readonly planner: PostgresDatabasePlanner,
    private readonly prisma: PrismaWorkflowAdapter,
    private readonly schema: DatabaseSchemaProbe,
    private readonly assertions: DatabaseAssertions,
    private readonly summarizer: DatabaseSummaryReporter,
  ) {
    super();
  }

  define(ctx: ScaffoldDefinitionContext) {
    return this.planner.define(ctx);
  }
  plan(ctx: ScaffoldPlanningContext, def: PostgresDefinition) {
    return this.planner.plan(ctx, def);
  }
  prepare(ctx: ScaffoldPreparationContext, plan: PostgresPlan) {
    return this.schema.prepare(ctx, plan);
  }
  scaffold(ctx: ScaffoldExecutionContext, plan: PostgresPlan) {
    return this.provision(ctx, plan);
  }
  provision(ctx: DatabaseProvisionContext, plan: PostgresPlan) {
    return this.prisma.provision(ctx, plan);
  }
  migrate(ctx: DatabaseMigrationContext, plan: PostgresPlan) {
    return this.prisma.migrate(ctx, plan);
  }
  generate(ctx: DatabaseGenerationContext, plan: PostgresPlan) {
    return this.prisma.generate(ctx, plan);
  }
  seed(ctx: DatabaseSeedContext, plan: PostgresPlan) {
    return this.prisma.seed(ctx, plan);
  }
  inspectSchema(ctx: DatabaseSchemaContext, plan: PostgresPlan) {
    return this.schema.inspect(ctx, plan);
  }
  inspect(ctx: ScaffoldInspectionContext, plan: PostgresPlan) {
    return this.inspectSchema(ctx, plan);
  }
  verify(ctx: ScaffoldVerificationContext, evidence: PostgresEvidence) {
    return this.assertions.verifyPostgres(ctx, evidence);
  }
  summarize(ctx: ScaffoldSummaryContext, verification: ScaffoldVerification) {
    return this.summarizer.summarize(ctx, verification);
  }
}
```

Every method body is one line. The injected modules — planner, prisma, schema, assertions,
summarizer — own the _complexity_.

### Why this shape works

- **Reading the class tells you the lifecycle.** Twelve method names, twelve delegations. A reviewer
  can verify "Postgres follows the lifecycle" in thirty seconds.
- **Every step is independently testable.** The injected modules have their own tests; the flow
  itself is tested with mocks.
- **Adding a new engine (MySQL) is mechanical.** Same shape, same delegation, different injected
  modules.
- **The class never grows.** New behavior goes into modules, not into the class body.

## Forbidden inheritance shapes

### Cross-package inheritance

```ts
// FORBIDDEN
import { BaseFlow } from '@netscript/cli';

export class MyCustomFlow extends BaseFlow {/* ... */}
```

A `packages/*` package never asks consumers to subclass its base class from outside the package.
Extension across packages happens through _interfaces and registration_, not inheritance. (See
[`07-composition-and-extension.md`](./07-composition-and-extension.md).)

### Multi-level base lattices without a real subtype distinction

```ts
// FORBIDDEN unless every layer names a real distinction
abstract class FlowBase { ... }
abstract class CapabilityBase extends FlowBase { ... }
abstract class ScaffoldCapabilityBase extends CapabilityBase { ... }
abstract class PluginScaffoldCapabilityBase extends ScaffoldCapabilityBase { ... }
class WorkerPluginScaffoldCapability extends PluginScaffoldCapabilityBase { ... }
```

If `FlowBase` and `CapabilityBase` do not correspond to caller- visible distinctions, collapse them.
We allow at most _two_ levels (`Base` → `Concrete`) by default, and a third level only if there is a
genuine subtype hierarchy in the middle (e.g. `ScaffoldFlowBase` → `DatabaseScaffoldFlowBase` →
`PostgresDatabaseScaffoldFlow`, because `DatabaseScaffoldFlowBase` adds the `engine` axis and its
own database-specific abstract methods).

### Utility-bag inheritance

```ts
// FORBIDDEN
abstract class HasLogger {
  protected logger: Logger;
  // ...
}
class MyService extends HasLogger { ... }
```

If you want a logger, _inject_ it through the constructor. Never use inheritance to acquire a field.

### Methods that orchestrate

```ts
// FORBIDDEN on a base class
abstract class FlowBase {
  async run(ctx: FlowContext) {
    const def = this.define(ctx);
    const plan = this.plan(ctx, def);
    try {
      await this.execute(ctx, plan);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
```

The `run()` method belongs on a separate `FlowRunner` class that takes a base instance as input. The
supervisor concerns (error normalization, telemetry, retries) live in the runner. The base class
stays stub-only.

## Composition over inheritance — the forwarding shape

Bloch's recommendation in pure form. When you want to extend a class's behavior, do not subclass it.
Hold an instance and forward.

```ts
// Instead of subclassing AspireSession to add retry behavior,
// hold one and forward:
export class RetryingAspireSession {
  constructor(
    private readonly inner: AspireSession,
    private readonly policy: RetryPolicy,
  ) {}

  start(req: AspireStartRequest) {
    return this.policy.run(() => this.inner.start(req));
  }

  wait(resource: string) {
    return this.policy.run(() => this.inner.wait(resource));
  }
}
```

The forwarding class:

- holds the original instance,
- exposes the same shape (or a narrower one),
- adds the new behavior at well-defined seams.

This is the default path. We use inheritance only for the stub-only contract case described above.

## Concrete repo examples

### `packages/workers/executor/task-executor.ts` (1,287 LOC)

Verdict: almost certainly a class that has accumulated lifecycle, state, telemetry, and dispatch.
The doctrine remedy:

- Extract a `TaskExecutorBase` if multiple executor variants exist; keep it stub-only.
- Move dispatch logic into `task-dispatcher.ts`.
- Move error normalization into `task-error-normalizer.ts`.
- Move telemetry into `task-telemetry-reporter.ts`.
- Make `TaskExecutor` itself a thin dispatcher that constructor- injects the above.

If only one executor exists, do _not_ introduce a base. Just split the class into modules.

### `packages/sagas/transports/list-transport.ts` (847 LOC)

Verdict: a single 847-line transport file is implementing one transport in one place. Likely shape
after refactor:

- `list-transport.ts` (the class, ~150 LOC).
- `list-transport-state.ts` (state shape).
- `list-transport-encoder.ts` (serialization).
- `list-transport-poller.ts` (polling loop with `AbortSignal`).
- `list-transport-acker.ts` (ack/nack semantics).

The transport class becomes a thin orchestrator over the modules.

## Spine versus layer-2 abstracts (R-BASE-L2)

The stub-only rule applies to the **spine** of a package — the small set of top-level abstracts that
name the lifecycle every implementer must honor (`DeployFlowBase`, `DatabaseScaffoldFlowBase`,
`UseCase`, `Registry`, `CliCommand`). The spine is stub-only by construction.

A package may also benefit from **layer-2 abstracts**: a sub-base that sits between the spine and
the concretes, capturing _demonstrated_ shared behavior across two or more concretes. A layer-2
abstract is allowed to carry concrete method bodies, but only under the conditions below.

**When a layer-2 abstract earns its place:**

1. **Two or more concrete subclasses already exist.** Layer-2 abstracts are a _de-duplication_ tool,
   not a forecasting tool. Do not introduce one before the duplication is in the codebase.
2. **The shared logic improves the readability of the concretes.** The concretes after the lift are
   smaller, name fewer fields, and read top-to-bottom. If the concretes shrink by less than 30%, the
   lift is not worth the inheritance.
3. **The shared logic does not orchestrate the lifecycle.** A layer-2 abstract may compute, format,
   validate, or wire shared parameters. It does not call the abstract methods of its own subclasses
   (that is the runner's role; see the spine rule).
4. **The abstraction names a real sub-axis.** The layer-2 abstract has a noun other than `Base`
   (`ScaffoldCommand`, `ListCommand`, `Pipeline`, `PipelineStep`). If the only honest name is
   `FooBase` or `AbstractFoo`, collapse and use a free function.

**What layer-2 abstracts may contain:**

- Concrete method bodies that _all_ subclasses use unmodified.
- Protected helper methods that subclasses call but never override.
- Constructor parameters that wire shared collaborators.
- Default field values where every subclass shares the default.

**What layer-2 abstracts must not contain:**

- Calls to the spine's abstract methods (no `run()` shape).
- Mutable shared state across instances.
- Logic that varies per subclass via a flag (`if (this.kind === ...)`); that is the
  discriminated-union anti-pattern in disguise.
- Methods that subclasses override but cannot disable. Every protected method on a layer-2 abstract
  is documented as either _override-allowed_ or _final_.

**Inheritance depth budget.** The default cap of two levels in § _Multi-level base lattices_ extends
to three when a layer-2 abstract earns its place: `Spine → Layer-2 → Concrete`. Four or more levels
remain forbidden.

**Co-location.** Layer-2 abstracts live with their concretes per R-FOLD-AD-COLOC. The folder is
named after the plural concept (`scaffold-commands/`, `pipelines/`, `list-commands/`).

### Example — `ScaffoldCommand` as a layer-2 abstract

```ts
export abstract class ScaffoldCommand<TInput, TResult> extends CliCommand<TInput, TResult> {
  protected abstract readonly subjectName: string;

  protected dryRunFlag(): CommandFlag<boolean> {
    return { name: 'dry-run', kind: 'boolean', default: false };
  }

  protected forceFlag(): CommandFlag<boolean> {
    return { name: 'force', kind: 'boolean', default: false };
  }

  protected resolveProjectRoot(input: TInput, cwd: WorkspacePort): Path {
    return cwd.findProjectRoot(input.path);
  }
}
```

`ScaffoldCommand` is layer-2: it sits between `CliCommand` (spine, stub-only) and the per-feature
scaffold commands (`InitCommand`, `ContractAddCommand`). It carries shared flag definitions and a
shared root-resolution helper. The concrete commands no longer re-declare flags or repeat root
resolution. The spine remains stub-only; the layer-2 abstract carries the demonstrated shared
behavior.

## Base-class checklist

Before introducing or modifying a base class:

- [ ] At least two real subtypes exist (or are imminently planned) and vary along a named axis.
- [ ] The base class has only abstract methods, abstract readonly identity fields, and type
      parameters — **unless** it is a layer-2 abstract that satisfies R-BASE-L2.
- [ ] No concrete method bodies on a spine abstract. No mutable fields. No protected utilities.
- [ ] Layer-2 abstracts (R-BASE-L2): two or more concretes already exist, shared logic does not
      orchestrate the lifecycle, the abstraction names a real sub-axis, the helper budget is
      documented as override-allowed or final.
- [ ] Lives in the same package as every subtype.
- [ ] Concrete subtypes' method bodies are one-line delegations.
- [ ] No `run()` / `execute()` / `orchestrate()` method on the base — that belongs to a runner.
- [ ] Total inheritance depth is two, or three only when each intermediate layer names a real
      subtype distinction.
