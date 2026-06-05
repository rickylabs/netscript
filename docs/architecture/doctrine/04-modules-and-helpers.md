# Modules, Adapters, and Helpers

Axioms governed: A6, A7.

A `packages/*` codebase fails one helper at a time. The discipline
is therefore strict: every helper must clear a justification bar,
and the bar is set high because Deno and `@std/*` already do most of
what tempts us to write helpers.

## The justification bar

A helper exists only if it does at least one of:

1. **Introduces a real test seam.** The helper isolates a side
   effect (filesystem, process, network, time) so tests can replace
   the implementation.
2. **Encodes a NetScript-specific policy.** Retry budgets, default
   timeouts, structured error normalization, evidence capture,
   correlation-id propagation.
3. **Hides a stable, non-trivial computation.** Schema diffing,
   topology parsing, dependency-graph traversal — things where the
   correctness criterion is non-obvious and the implementation is
   tested.
4. **Reduces a frequent, identical multi-line pattern.** *And* the
   pattern is identical, not "similar" (cf. the Wet Codebase
   doctrine — see
   [`../phase-0-research/03-frameworks-and-progressive-tradeoffs.md`](../phase-0-research/03-frameworks-and-progressive-tradeoffs.md)).

A helper that merely renames a Web Platform or `@std/*` primitive
is a regression and must be deleted.

## What "rename" looks like (forbidden)

```ts
// FORBIDDEN — pure rename of platform primitive
export function readJson(path: string): Promise<unknown> {
  return Deno.readTextFile(path).then(JSON.parse);
}

export function joinPath(...parts: string[]) {
  return parts.join('/');
}

export function uuid() {
  return crypto.randomUUID();
}

export function delayMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

Each of these has a one-line, documented `@std/*` equivalent
(`@std/jsonc` `parse`, `@std/path` `join`, `crypto.randomUUID()`
itself, `@std/async` `delay`). Adding a helper to rename them
*reduces* discoverability and *adds* a maintenance surface.

## What a justified helper looks like

```ts
// JUSTIFIED — encodes NetScript retry policy + emits evidence
export async function runWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  policy: RetryPolicy,
  ctx: RetryContext,
): Promise<RetryResult<T>> {
  // Wraps @std/async retry with our structured RetryResult,
  // propagates ctx.signal, emits ctx.reporter.attempt() for each try.
}
```

This helper:

- introduces a *seam* (the operation receives an injected signal),
- encodes a *policy* (the `RetryPolicy` is NetScript-shaped),
- emits *evidence* (every attempt is observable for telemetry),
- has tests proving the policy is honored.

A reviewer can defend each of those properties.

## The `@std/*` lookup table

Before writing any helper, check this list:

| You wrote / want to write              | Use instead                                    |
| -------------------------------------- | ---------------------------------------------- |
| `joinPaths`, `splitPath`               | `@std/path`                                    |
| `walkFiles`, `ensureDir`, `copy`       | `@std/fs`                                      |
| `readJson`, `parseJsonc`               | `@std/json`, `@std/jsonc`                      |
| `parseArgs`, `prompt`, `spinner`       | `@std/cli`                                     |
| `assert*`, custom error classes for tests | `@std/assert`                              |
| `delay`, `retry`, `pooledMap`, `deadline` | `@std/async`                                |
| `chunk`, `partition`, `groupBy`        | `@std/collections`                             |
| `formatDate`, `parseDate`, `differenceInDays` | `@std/datetime` (or `Temporal` when stable) |
| `slugify`, `dedent`, `levenshtein`     | `@std/text`                                    |
| `bytesToHuman`, `colorize`             | `@std/fmt`                                     |
| `parseYaml`, `parseToml`, `parseCsv`   | `@std/yaml`, `@std/toml`, `@std/csv`           |
| `loadEnv`                              | `@std/dotenv`                                  |
| Mocks, fake timers, BDD wrappers       | `@std/testing`                                 |
| Stream conversions                     | `@std/streams`                                 |
| Hex, base64, base58 encoding           | `@std/encoding`                                |
| UUIDs                                  | `crypto.randomUUID()`                          |
| Hashing                                | `crypto.subtle`                                |
| HTTP                                   | `fetch`, `Request`, `Response`, `Headers`      |
| Streams                                | `ReadableStream`, `TransformStream`            |
| Cancellation                           | `AbortController`, `AbortSignal`               |
| Deep copy                              | `structuredClone`                              |
| Immutability                           | `Object.freeze` + `readonly` types             |

A helper that duplicates any row above must justify *why* per the
bar. "Slightly different signature" is not a justification.

## Adapters — the seam to external systems

An *adapter* implements a *port* the package owns. The port is
named after the behavior the package needs from the outside world.

### Port shape

```ts
// packages/workers/src/ports/worker-store-port.ts
export interface WorkerStorePort {
  enqueue(job: PendingJob, signal: AbortSignal): Promise<JobId>;
  reserve(claim: ClaimRequest, signal: AbortSignal): Promise<ReservedJob | null>;
  ack(id: JobId, result: JobResult, signal: AbortSignal): Promise<void>;
  fail(id: JobId, error: NormalizedError, signal: AbortSignal): Promise<void>;
}
```

Properties:

- The port is in the package that *consumes* the behavior.
- Method names use the package's domain verbs.
- Every async method takes an `AbortSignal`.
- The port has no dependency on any specific adapter.

### Adapter shape

```ts
// packages/workers/src/adapters/kv-worker-store.ts
export class KvWorkerStore implements WorkerStorePort {
  constructor(private readonly kv: Deno.Kv, private readonly clock: Clock) {}

  async enqueue(job: PendingJob, signal: AbortSignal): Promise<JobId> { ... }
  async reserve(...) { ... }
  async ack(...) { ... }
  async fail(...) { ... }
}
```

Properties:

- The class name combines *adapter technology* and *port name*:
  `KvWorkerStore`, `PostgresWorkerStore`, `RedisWorkerStore`.
- The class implements the port; nothing more.
- Constructor injects the technology client (`Deno.Kv`, `Pool`,
  `Redis`) and any policy collaborators (`Clock`).
- No business policy in the adapter: if the policy belongs in the
  port, move it. If it belongs to a higher layer, hoist it there.

## Module organization within a package

The package's source tree is divided by *role*, not by technology.
Roles we name:

| Folder            | Role                                                          |
| ----------------- | ------------------------------------------------------------- |
| `domain/`         | Package types, identifiers, value objects. No imports of IO. |
| `ports/`          | Interfaces the package consumes.                              |
| `application/`    | Builders, runners, flows, orchestration logic.                |
| `adapters/`       | Implementations of ports for specific technologies.           |
| `runtime/`        | Per-request / per-instance context, lifecycle objects.        |
| `state/`          | State shape (for runtime/behavior packages only).             |
| `middleware/`     | Composable cross-cutting handlers.                            |
| `presets/`        | Preconfigured factory functions for common cases.             |
| `testing/`        | Public testing helpers (fakes, builders for tests).           |
| `tests/`          | Cross-cutting test suites.                                    |

Not every package uses every folder. (See
[`06-archetypes.md`](./06-archetypes.md).) The naming above is the
ubiquitous vocabulary across all packages — when a folder appears, it
plays the role described.

## File size discipline

A `.ts` file longer than ~300 lines is a flag. Longer than ~500
demands a refactor justification. Longer than ~800 is a doctrine
violation regardless of context.

The current monoliths in this repo (over 800 lines):

| File                                                       | LOC   |
| ---------------------------------------------------------- | ----- |
| `cli/src/commands/init/pipeline.ts`                        | 1,869 |
| `cli/src/templates/aspire/helpers/generators_test.ts`      | 1,472 |
| `workers/executor/task-executor.ts`                        | 1,287 |
| `cli/src/commands/init/pipeline_test.ts`                   | 1,260 |
| `cli/src/capabilities/plugin/official-plugin-copier.ts`    | 1,203 |
| `shared/utils/datetime.ts`                                 | 1,112 |
| `fresh/builders/mod.ts`                                    | 1,110 |
| `kv/tests/bridge_test.ts`                                  | 1,039 |
| `plugin/types.ts`                                          | 1,005 |
| `config/schema.ts`                                         | 945   |
| `sagas/transports/list-transport.ts`                       | 847   |

Every entry is on the doctrine remediation list. The remediation
template is identical across files: identify the concerns folded
together, name each as a folder/file, lift inline state into a
named state model, lift telemetry to a separate reporter, lift IO
to an adapter, lift policy to a separate module, and reduce the
original file to the orchestration entry point.

## `shared/utils/datetime.ts` — the canonical anti-helper

A 1,112-line `datetime.ts` is, by inspection, doing what
`@std/datetime` already does, plus what `Temporal` will soon do. The
remediation:

1. Read the file. Categorize each export: format, parse, arithmetic,
   timezone, locale.
2. For each category, find the `@std/datetime` (or `Temporal`)
   equivalent.
3. Replace the helper with a re-export, a thin policy wrapper, or
   nothing at all.
4. Delete the file when empty. Delete the import sites' indirection.

This single change demonstrates the doctrine in motion: the
codebase shrinks, the surface aligns with `@std/*`, and future
upgrades come for free.

## Helper checklist for review

- [ ] Justified by at least one of: test seam, NetScript policy,
      stable non-trivial computation, identical multi-line pattern
      with three or more sites.
- [ ] Does not duplicate any `@std/*` or Web Platform primitive.
- [ ] Lives in the right role folder; named for its role, not its
      technology.
- [ ] Has its own focused tests (or is so trivial that the
      consumer's tests cover it).
- [ ] No global mutable state. No singleton object held at module
      load.
- [ ] Accepts an `AbortSignal` if it can block on IO.

## Sources

- Wet Codebase, Sandi Metz / Dan Abramov — see
  [`../phase-0-research/03-frameworks-and-progressive-tradeoffs.md`](../phase-0-research/03-frameworks-and-progressive-tradeoffs.md).
- `@std/*` enumeration — see
  [`../phase-0-research/08-deno-and-jsr-as-target.md`](../phase-0-research/08-deno-and-jsr-as-target.md).
- Cockburn's port/adapter — see
  [`../phase-0-research/04-enterprise-pattern-canon.md`](../phase-0-research/04-enterprise-pattern-canon.md).
