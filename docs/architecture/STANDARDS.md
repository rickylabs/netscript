# NetScript Public-Surface & Naming Standards (v0.0.1-alpha)

> Status: **MUST** for every `@netscript/*` package shipping in the v0.0.1-alpha
> wave. Deviations require an entry in `arch-debt.md` plus a reason scoped to a
> later beta iteration.
>
> Authority: this file extends the Architecture Doctrine
> (`docs/architecture/doctrine/`) for cross-package
> consistency. Where this document conflicts with the doctrine, doctrine wins.

The single hardest goal of the alpha release is **uniform DX** across 24
packages so an engineer who knows one package immediately understands the
shape of any other.

This document is the contract every package's `mod.ts` must satisfy.

---

## 1. Package shape (canonical layout)

```
packages/<pkg>/
├── README.md                 # MUST — enterprise-grade (see § 6)
├── deno.json                 # MUST — see § 2
├── mod.ts                    # MUST — single public re-export hub (see § 3)
├── docs/                     # SHOULD when symbol count > 25 (see § 7)
│   ├── README.md             # Overview + ToC
│   ├── architecture.md       # Archetype, axioms, layering diagram
│   ├── concepts.md           # Domain glossary
│   ├── recipes/              # Task-oriented snippets
│   └── reference/            # API reference (auto-generated extracts)
├── src/                      # MUST when LOC > 600
│   ├── domain/               # types, schemas, invariants — no I/O
│   ├── ports/                # interfaces consumed by adapters/runtime
│   ├── application/          # use-cases composed from ports
│   ├── adapters/             # implementations of ports (per integration)
│   ├── runtime/              # long-lived behaviour, supervision (A3 only)
│   ├── presentation/         # CLI / Fresh / SDK output (A4/A6 only)
│   ├── presets/              # opinionated default compositions
│   ├── registry/             # dynamic discovery (A4 plugin/contract DSLs)
│   ├── diagnostics/          # debug/inspection helpers, redactors
│   ├── testing/              # public test fixtures (re-exported via ./testing)
│   └── internal/             # private — never exported from mod.ts
├── tests/                    # SHOULD — meaningful integration tests
│   ├── _fixtures/            # shared fixtures (no production import)
│   ├── domain/               # unit tests aligned with src/domain
│   ├── ports/                # contract tests (per port)
│   ├── adapters/             # adapter conformance suites
│   └── e2e/                  # end-to-end cross-port scenarios
├── examples/                 # SHOULD — runnable examples referenced from README
└── bin/                      # CLI/Tool packages only (A6)
```

**Forbidden folder names:** `utils/`, `helpers/`, `common/`, `lib/`,
`interfaces/`. Splits into `domain/types.ts`, `application/<use-case>.ts`, or
`adapters/<integration>.ts` based on the actual concern.

**Cardinality cap:** ≤ 12 immediate children per directory (doctrine F-DOCT-5).
Above that, introduce a sub-directory aligned to a domain concept.

---

## 2. `deno.json` standard

Every package MUST satisfy the JSR audit fields and these repo-wide invariants:

```jsonc
{
  "name": "@netscript/<pkg>",
  "version": "0.0.1-alpha.0",
  "license": "MIT",                                  // F-JSR-1
  "description": "<≤250 chars, ends with a period>", // F-JSR-4
  "exports": {
    ".": "./mod.ts",
    "./testing": "./src/testing/mod.ts"              // when applicable
  },
  "imports": {
    // 1. JSR/std before npm
    // 2. internal `@netscript/*` deps via path until monorepo handoff
    // 3. zero npm deps where a Web Platform / @std equivalent exists
  },
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "publish": {
    "include": ["README.md", "docs/**/*.md", "deno.json", "mod.ts", "src/**/*.ts"],
    "exclude": ["**/*_test.ts", "**/*.test.ts", "tests/**", "examples/**"]
  },
  "tasks": {
    "check":   "deno check --unstable-kv mod.ts",
    "test":    "deno test --allow-all tests/",
    "lint":    "deno lint",
    "fmt":     "deno fmt --check",
    "publish:dry-run": "deno publish --dry-run --allow-dirty"
  }
}
```

`include`/`exclude` lists are **mandatory** — `deno publish` ships everything
under cwd by default and that leaks tests + scratch files.

Version cadence: every package marches in lockstep —
`0.0.1-alpha.0 → alpha.1 → … → beta.0 → … → 0.1.0`. No package is allowed to
fork its version line during alpha.

---

## 3. `mod.ts` invariants (the shop window)

Every `mod.ts` MUST:

1. Begin with a `@module` JSDoc block ≥ 30 lines containing:
   - one-sentence purpose,
   - 80% path code example (the chained call axiom A3),
   - two `@example` sections (basic + advanced),
   - cross-link to the package README and the docs site URL once published,
   - links to dependent `@netscript/*` packages.
2. Re-export **only** named symbols from `src/public/*` (no `export *` from
   internal layers). Wildcard re-exports are allowed only from a curated
   `src/public/mod.ts` that itself re-exports named symbols.
3. Group exports in this order, separated by comment headers:
   ```ts
   // ── Definitions (Zod schemas / DSL constructors) ──
   // ── Types ──
   // ── Builders ──
   // ── Runtime ──
   // ── Adapters ──
   // ── Errors ──
   // ── Diagnostics ──
   ```
4. Have **zero** logic — `mod.ts` is barrel-only.
5. Stay ≤ 200 lines. If it exceeds that, the public surface is too wide; split
   into sub-entrypoints (`./adapters`, `./testing`, etc.).

---

## 4. Naming conventions (cross-package)

### 4.1 Functions

| Concern | Pattern | Example |
|---|---|---|
| Definition / declaration | `define<Noun>` | `defineTrigger`, `defineSagaStep`, `definePlugin` |
| Synchronous factory | `create<Noun>` | `createLogger`, `createConfigStore`, `createKvStore` |
| Async resource acquisition | `open<Noun>` / `connect<Noun>` | `openKv`, `connectDatabase` |
| Resolution from registry / env | `resolve<Noun>` | `resolveConfig`, `resolveSagaRunner` |
| Boolean | `is<Adjective>` / `has<Noun>` | `isReady`, `hasMigrations` |
| Event emission | `emit<Event>` | `emitTriggerEvent` |
| Subscription | `on<Event>(listener)` returning `() => void` | `onJobComplete` |
| Builder entry-point | `build<Noun>()` returning `…Builder` | `buildPipeline` |

**Forbidden prefixes:** `get` / `set` for anything that is not a plain
property accessor. Use `read…` / `write…` for I/O, `resolve…` for lookups,
`load…` for deferred initialisation.

### 4.2 Types

| Kind | Pattern | Example |
|---|---|---|
| Concrete output of `define…` | `<Noun>Definition` | `TriggerDefinition` |
| Concrete output of `create…` | `<Noun>` | `Logger`, `KvStore` |
| Builder | `<Noun>Builder` | `PipelineBuilder` |
| Options bag | `<Function>Options` | `CreateLoggerOptions` |
| Spec passed to `define…` | `<Noun>Spec` | `TriggerSpec` |
| Result discriminated union | `<Verb>Result` | `PublishResult` |
| Error class | `<Domain>Error` (extends `NetScriptError`) | `KvConflictError` |
| Port / contract | `<Noun>Port` | `KvStorePort`, `LoggerPort` |
| Adapter | `<Backend><Noun>Adapter` | `RedisKvAdapter` |

**Forbidden:** `IFoo` Hungarian-prefix interfaces (F-DOCT-7), `Foo_t` C-style
suffixes, single-letter generics (`<T>`) when the role isn't pure container —
prefer `<TPayload, TName extends string>`.

### 4.3 Files

- `kebab-case.ts` for every file.
- `<noun>.ts` for primary type/class container.
- `<noun>.adapter.ts` for adapter implementations.
- `<noun>.runner.ts` for runtime supervisors.
- `<noun>.spec.ts` is **forbidden** (collides with Jest); use `<noun>_test.ts`
  (Deno convention).
- `mod.ts` is the only allowed barrel inside any folder.

### 4.4 Constants

- `SCREAMING_SNAKE_CASE` only for compile-time literals exported from
  `domain/constants.ts`. All other module-scoped constants stay `camelCase`.

---

## 5. Public-surface patterns (when to use each)

The doctrine accepts five published-surface shapes. Each package must declare
which one(s) it uses in its `docs/architecture.md`.

| Shape | When to use | Canonical example |
|---|---|---|
| **Function family** | Stateless behaviour, no extension axes, 80% path is one call | `@netscript/streams` `createDurableStream(spec)` |
| **Builder (fluent)** | Multi-step deferred construction with optional steps | `@netscript/cli` `createPublicCli().withCommand(…)` |
| **Class hierarchy (abstract base + extensions)** | Long-lived stateful runtimes with lifecycle, supervision, named extension axes | `@netscript/workers` `BaseWorker`, `@netscript/sagas` `BaseSagaRunner` |
| **DSL (`define…`)** | Declarative artefacts consumed by a runtime; need IDE auto-complete and type narrowing | `@netscript/triggers` `defineTrigger`, `@netscript/plugin` `definePlugin` |
| **Registry** | Dynamic discovery of plugins/contracts/adapters | `@netscript/plugin` `PluginRegistry` |

### 5.1 When to switch from function to class

Use a class **only** when at least 2 of these hold:

1. The instance has a non-trivial lifecycle (`start`/`stop`/`dispose`).
2. The instance owns mutable in-memory state across calls.
3. Subclasses provide named extension axes (e.g. `protected onStep(ctx)` hook).
4. The instance is consumed by `instanceof` checks at framework boundaries.
5. Multiple operations share an expensive resource (connection pool,
   subprocess) that benefits from co-location.

A pure factory returning a frozen plain object is the default.

### 5.2 Abstract base class invariants (axiom A4)

When a class hierarchy is justified:

- The base class is a **stub-only contract**. Methods that subclasses must
  override are `abstract`. Methods that subclasses *may* override are
  `protected` with a sensible default. Public methods are `final`-by-convention
  (no `final` in TypeScript; document with `// @sealed`).
- The base class **does not call adapters directly**. It calls `protected`
  template methods on `this` that subclasses (or the runtime) wire up.
- The base class lives in `src/runtime/<noun>.base.ts`. Concrete defaults live
  in `src/runtime/<noun>.default.ts`.

```ts
// src/runtime/worker.base.ts
export abstract class BaseWorker<TPayload> {
  constructor(protected readonly options: BaseWorkerOptions) {}

  /** Override to perform the actual work. Must be idempotent. */
  protected abstract execute(payload: TPayload, ctx: ExecutionContext): Promise<void>;

  /** Override to customise crash policy. Default: bounded retry then DLQ. */
  protected onError(err: Error, payload: TPayload): RetryDecision {
    return { retry: true, after: this.options.retryDelay ?? 1_000 };
  }

  /** @sealed — call sites: Workers runtime supervisor */
  async run(payload: TPayload, ctx: ExecutionContext): Promise<void> { ... }
}
```

### 5.3 Forbidden patterns

- Configuration via global singleton modules — use composition root (A10).
- `default` exports of any kind. JSR penalises them (no auto-doc) and they
  break re-export ergonomics.
- Re-exporting third-party types under our own name without a wrapping reason.
- `any` in the public surface. Use `unknown` and narrow inside the function.
- Returning a tuple from a public function (`[result, error]`). Use a
  discriminated union or throw a typed error.

---

## 6. README.md standard (enterprise-grade)

Every README MUST contain these sections in this order, each with concrete
content (no "TODO"). Minimum length is 150 lines.

1. **Heading + 1-line tagline + JSR/MIT badges** — see template
2. **Overview** — what problem does this package solve, in 3 paragraphs
3. **Quickstart** — copy-pasteable working example (the 80% path, A3)
4. **Mental model** — diagram + 3-paragraph explanation of the abstractions
5. **API at a glance** — 1-paragraph + table of top-level exports linking to
   `docs/reference/`
6. **Common recipes** — 5–10 task-oriented snippets covering real use cases
7. **Configuration** — exhaustive options reference (or link)
8. **Testing** — how to use the `./testing` entrypoint, how to write unit
   tests against ports
9. **Observability** — log fields, metric names, OTEL span names
10. **Architecture** — link to `docs/architecture.md` plus archetype call-out
11. **Stability & versioning** — alpha → beta → stable graduation criteria
    aligned with the master `PLAN.md`
12. **Compatibility matrix** — Deno version, Node compat, browser compat
13. **Contributing** — link to monorepo CONTRIBUTING + how to run package tests
14. **License**

Code examples in the README MUST be imported into the doctest runner
(`tests/_fixtures/readme-examples_test.ts`) so the README never goes stale.

---

## 7. `/docs` folder structure (when ≥ 25 public symbols)

Packages with > 25 public symbols MUST ship a `docs/` folder. This becomes
the source for the future netscript.dev docs site. Structure:

```
docs/
├── README.md             # 1-screen intro + ToC
├── architecture.md       # Archetype, axioms, layered ascii diagram
├── concepts.md           # Glossary, mental model, invariants
├── getting-started.md    # 10-minute first-run guide
├── recipes/
│   ├── basic-usage.md
│   ├── testing.md
│   ├── observability.md
│   └── …
├── reference/
│   ├── README.md
│   ├── functions.md      # Auto-extracted JSDoc
│   ├── classes.md
│   ├── types.md
│   └── errors.md
└── advanced/
    ├── extending.md      # Extension axes
    ├── migration.md      # alpha → beta upgrade notes (added later)
    └── internals.md      # For contributors only
```

Every page begins with a frontmatter block consumed by the future docs site:

```md
---
title: <Page Title>
description: <≤160 chars>
package: "@netscript/<pkg>"
order: <int>
---
```

Reference pages are generated from `deno doc` output via a future
`.llm/tools/generate-reference.ts` (added in PLAN.md Wave 0).

---

## 8. Test coverage doctrine (meaningful tests only)

Every package MUST follow this layered test strategy. Coverage targets are
not LOC-driven — they're **behaviour-driven**: every public symbol must be
demonstrated, every port must have a contract test, every adapter must pass
the contract.

| Layer | Lives in | Goal | When required |
|---|---|---|---|
| Doctest of README examples | `tests/_fixtures/readme-examples_test.ts` | README never goes stale | every package |
| Domain unit | `tests/domain/*_test.ts` | Pure functions, schema invariants, error edge cases | when `src/domain/` exists |
| Port contract | `tests/ports/<port>_contract_test.ts` | Run **the same suite** against every adapter to prove conformance | every port |
| Adapter | invokes port contract suite with a backend instance | Each adapter passes the contract | every adapter |
| Application | `tests/application/<use-case>_test.ts` | Use-cases compose ports correctly with mock adapters | when use-cases exist |
| Runtime | `tests/runtime/<runtime>_test.ts` | Lifecycle (start/stop/crash/restart), supervision, idempotence | A3 packages only |
| Integration | `tests/integration/*_test.ts` | Real backend (in-memory or testcontainer) end-to-end | smoke-only at alpha |
| E2E | `tests/e2e/*_test.ts` | Multi-package scenario | only `@netscript/cli` at alpha |

Test conventions:

- Use `Deno.test` with a **scenario sentence** as the name:
  `"createKvStore: rejects keys longer than 2048 bytes"`.
- One assertion per logical claim. Use `assertEquals`, `assertRejects`,
  `assertSpyCalls`, etc. — no Jest globals.
- Adapter contract suites are imported, not duplicated:
  ```ts
  import { runKvContract } from "@netscript/kv/testing";
  runKvContract({ name: "redis", make: () => createRedisKvAdapter(...) });
  ```
- No mocks of internal modules — only mocks of *ports*. If you can't write a
  test without mocking an internal class, the architecture is wrong.
- No `it()` / `describe()` (Jest). No `should` (chai). Only `Deno.test`.

### Forbidden test patterns (we have many today)

- Tests that import private modules (`import { foo } from "../src/internal/x"`) — they pin internals.
- Tests that assert on log strings — assert on structured log fields.
- Tests that wait on real wall-clock timers without `FakeTime`.
- Tests that share global mutable state across `Deno.test` blocks.
- Tests with names like `"should work"`, `"happy path"`, `"basic"`. Always
  state the *behaviour* and *condition*.

---

## 9. Observability standard

Every adapter and runtime MUST emit, at the minimum:

- one structured log per public method invocation (level: `debug`),
- one structured log per error path (level: `error`),
- one OTEL span per public method, named `netscript.<pkg>.<method>`,
- one counter `netscript.<pkg>.<verb>.total` and one histogram
  `netscript.<pkg>.<verb>.duration_ms` per public verb.

Field names are standardised (see `@netscript/telemetry` README) — no per-package field names.

---

## 10. Diagnostics: every package ships an inspector

Every package SHOULD export `inspect<Noun>(target): InspectionReport` returning
a JSON-stable structure suitable for `console.log` and CLI rendering. The
report shape lives in `@netscript/shared` `InspectionReport<T>`. This is the
discoverability axis the cli relies on and what we'll wire to the future
admin dashboard.

---

## 11. Migration path for existing packages

Packages currently violating these rules (see `audit/_summary.json`) follow
this fixed sequence — each step is mechanical and reviewable:

1. Add missing `license`, `description`, `publish.include/exclude` to `deno.json`.
2. Move forbidden folders (`utils/`, `helpers/`, `interfaces/`) into
   doctrine-aligned folders, leaving stub re-exports + a debt entry.
3. Rename I-prefix interfaces, schedule a one-shot codemod (`.llm/tools/`).
4. Replace `export *` from internals with a curated `src/public/mod.ts`.
5. Eliminate slow types — explicit return types on every published function.
   Exception: oRPC-bound packages may keep `--allow-slow-types` (see the
   sanctioned exception in `docs/architecture/doctrine/02-public-surface.md`).
6. Write the README to spec § 6.
7. Write `docs/` to spec § 7 if symbol count > 25.
8. Write the test suite to spec § 8.
9. Run `deno publish --dry-run --allow-dirty` until clean.
10. Pin to `0.0.1-alpha.0` and queue for the wave defined in `PLAN.md`.
