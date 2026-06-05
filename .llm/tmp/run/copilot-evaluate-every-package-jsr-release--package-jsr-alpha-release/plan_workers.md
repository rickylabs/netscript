# Plan — `@netscript/workers`

> Wave **4** · Archetype **A3 — Runtime/Behavior** · Pattern **Abstract base + Default + Registry**
> Pair: [`evaluate_workers.md`](./evaluate_workers.md) · master: [`PLAN.md`](./PLAN.md)
> Standards: [`harmonisation/STANDARDS.md`](./harmonisation/STANDARDS.md) · Surface: [`harmonisation/PUBLIC-SURFACE-PATTERNS.md`](./harmonisation/PUBLIC-SURFACE-PATTERNS.md) · Docs: [`harmonisation/DOCS-STRUCTURE.md`](./harmonisation/DOCS-STRUCTURE.md)

## 1. Concept of done (alpha quality bar)

This package is publish-ready at `0.0.1-alpha.0` when **all nine** PLAN.md § 12 criteria hold:

- [ ] Public surface is immediately understandable, naming follows STANDARDS § 4.
- [ ] Every export carries JSDoc with `@param`/`@returns`/`@example`; `mod.ts` opens with the 80%-path `@module` block.
- [ ] README has all 14 STANDARDS § 6 sections, ≥ 150 lines, code samples are doctest-imported.
- [ ] `deno publish --dry-run --allow-dirty` succeeds (slow-types: 50 → 0).
- [ ] Doctrine FAILs = 0; archetype declared in `docs/architecture.md`.
- [ ] Tests follow STANDARDS § 8 (doctest + unit + port contract + adapter conformance).
- [ ] Logger fields + OTEL spans + metric names match telemetry standard.
- [ ] `mod.ts` exports an `inspect<Noun>(target): InspectionReport`.
- [ ] Internal layering passes `check-doctrine.ts`; files within size cap; no global mutable state.

## 2. Target folder tree

```
packages/workers/
├── README.md
├── deno.json
├── mod.ts                            # barrel only — re-export from src/public/
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── concepts.md
│   ├── getting-started.md
│   ├── recipes/
│   └── reference/
├── src/
│   ├── public/
│   │   └── mod.ts                    # curated re-exports
│   ├── domain/                       # Zod schemas, errors, value objects, invariants
│   ├── ports/                        # interfaces consumed by adapters
│   ├── application/                  # use-cases composing ports
│   ├── adapters/                     # implementations of ports (per backend)
│   ├── runtime/                       # supervisors, lifecycle, state machines
│   ├── diagnostics/                  # inspect<Noun>(), redactors
│   ├── testing/                      # public test fixtures (re-exported via ./testing)
│   └── internal/                     # private — never exported
├── tests/
│   ├── _fixtures/
│   │   └── readme-examples_test.ts   # imports README code blocks
│   ├── domain/                       # unit tests aligned with src/domain
│   ├── ports/                        # contract tests per port
│   ├── adapters/                     # adapter conformance — invokes port contracts
│   └── application/                  # use-case tests
└── examples/                         # runnable examples referenced from README
```

## 3. Target public surface (`mod.ts`)

```ts
// mod.ts — A3 runtime: abstract base + default + DSL + registry
/**
 * @module
 *
 * <One-sentence purpose>. Subclass {@link BaseWorkers} or use {@link DefaultWorkers}.
 *
 * @example Use the default
 * ```ts
 * import { DefaultWorkers, defineWorkers } from "jsr:@netscript/workers@^0.0.1-alpha.0";
 * const def = defineWorkers({ name: "demo", ... });
 * const runtime = new DefaultWorkers({ definition: def });
 * await runtime.start();
 * ```
 *
 * @example Subclass for custom behaviour
 * ```ts
 * class MyWorkers extends BaseWorkers<MyPayload> {
 *   protected async execute(payload, ctx) { ... }
 *   protected onError(err, payload) { return { retry: false }; }
 * }
 * ```
 */

// ── Definitions (DSL) ──
export { defineWorkers, type WorkersDefinition, type WorkersSpec } from "./src/public/mod.ts";

// ── Runtime base + default ──
export {
  BaseWorkers,
  type BaseWorkersOptions,
  type ExecutionContext,
  type RetryDecision,
} from "./src/public/mod.ts";
export { DefaultWorkers, type DefaultWorkersOptions } from "./src/public/mod.ts";

// ── Registry ──
export { WorkersRegistry, type WorkersRegistryOptions } from "./src/public/mod.ts";

// ── Errors ──
export { WorkersError, WorkersAlreadyStartedError, UnknownWorkersError } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspectWorkers } from "./src/public/mod.ts";

### Supervision contract (explicit)
- `BaseWorkers` is the abstract supervision root — subclasses implement `execute(payload, ctx)`
- `DefaultWorkers` is the default concrete — uses `defineWorkers` definition
- `WorkersRegistry` resolves frozen definitions at runtime
- Interaction with `@netscript/queue`: Workers consume from queue, queue supervises worker pool
- Crash boundary: `onError(err, payload)` returns `{ retry: boolean, after?: number }`
- Runtime supervisor (from `@netscript/queue`) restarts workers on `retry: true`
- See `docs/architecture.md` for ascii diagram of supervision tree
```

Composition:

1. `defineWorkers` produces a frozen `WorkersDefinition` (declarative).
2. `new DefaultWorkers({ definition })` or `class My extends BaseWorkers<P>`.
3. `WorkersRegistry` registers/resolves definitions for the framework supervisor.


## 4. Test coverage plan

**Required test layers** (STANDARDS § 8):

1. **Doctest of README examples** — `tests/_fixtures/readme-examples_test.ts` imports each ```ts``` block from README to prevent doc rot.
2. **Domain unit tests** — every Zod schema, error class, and pure function in `src/domain/` has a unit test asserting the invariant it embodies.
3. **Port contract tests** — for each interface in `src/ports/`, write `tests/ports/<port>_contract_test.ts` exporting `run<Port>Contract({ make })`. Adapter tests invoke this suite to prove conformance.
4. **Adapter conformance** — for each adapter in `src/adapters/`, `tests/adapters/<backend>_test.ts` runs the port contract suite with that adapter wired.
5. **Runtime lifecycle tests** — every abstract base / default class has tests for `start` → `execute` → `stop`, crash → `onError` → retry, and idempotence.
6. **Supervision tests** — registry resolves, freezes, rejects duplicates; runtime supervisor wires definition + adapter correctly.

**Forbidden patterns** (see STANDARDS § 8):
- imports from `src/internal/` in tests
- Jest/Vitest globals (`describe`, `it`, `expect`)
- test names like `"happy path"`, `"works"`, `"basic"`
- shared global mutable state across `Deno.test` blocks
- assertions on log strings (assert structured fields instead)

**Coverage target:** 100% of public symbols invoked at least once via doctest + dedicated test, plus every error path triggered at least once.

## 5. Slice list (mechanical sequence)

1. **README scaffold** — write all 14 STANDARDS § 6 sections, ≥ 150 lines.
2. **Description** — add `"description"` to deno.json (≤ 250 chars, ends with period).
3. **Slow-types refactor** (50 problems) — add explicit return types to every published function; replace inferred `z.infer` chains with declared `<Noun>Definition` interfaces with slot generics. See PUBLIC-SURFACE-PATTERNS § 4.
4. **Folder vocabulary** — migrate forbidden folders (`utils/`, `helpers/`, `interfaces/`) into doctrine-aligned folders (`domain/`, `application/`, `adapters/`).
5. **Barrel discipline** — `mod.ts` is too large or has logic; curate via `src/public/mod.ts` and re-export named symbols only.
6. **Inspection diagnostic** — export `inspectWorkers(target): InspectionReport` from mod.ts.
7. **Final dry-run** — `deno publish --dry-run --allow-dirty` must succeed.
8. **Pin version** — set `"version": "0.0.1-alpha.0"`; run `release-readiness.ts` and confirm 0 fail.

## 6. Gate matrix

| Gate | Source | Today | Target |
|---|---|---:|---:|
| JSR FAIL | `audit/readiness/jsr/packages__workers.json` | 2 | 0 |
| JSR WARN | same | 2 | ≤ 2 |
| Doctrine FAIL | `audit/readiness/doctrine/packages__workers.json` | 1 | 0 |
| Doctrine WARN | same | 12 | ≤ 5 |
| Standards FAIL | `audit/readiness/standards/packages__workers.json` | 4 | 0 |
| Standards WARN | same | 22 | ≤ 10 |
| `deno publish --dry-run` | `audit/dry-run/workers.txt` | FAIL | OK |
| Slow types | same | 50 | 0 |

## 7. Naming map (current → target)

| Current | Issue | Suggested |
|---|---|---|
| `getExecutionState` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getJobRegistry` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getShutdownManager` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getTaskExecutor` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getTaskRegistry` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getWorkflowState` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |
| `getWorkersStreamProducer` | `get` prefix used for non-property accessor | `consider `read…`/`resolve…`/`load…`` |

## 8. Documentation deliverables

- `README.md` — all 14 STANDARDS § 6 sections (currently *missing*)
- `docs/README.md` (ToC)
- `docs/architecture.md` (archetype declaration + ascii diagram + axiom call-outs)
- `docs/concepts.md` (glossary)
- `docs/getting-started.md` (10-min walk-through)
- `docs/recipes/` (≥ 3 task recipes; required for this package)
- `docs/reference/` (auto-generated stub at alpha; Wave 0 generator lands later)

## 9. References

- PLAN.md — wave 4, archetype A3 — Runtime/Behavior
- doctrine — `.llm/research/architecture-doctrine-docs-v2/doctrine/`
- standards — `harmonisation/STANDARDS.md`
- patterns — `harmonisation/PUBLIC-SURFACE-PATTERNS.md`
- docs spec — `harmonisation/DOCS-STRUCTURE.md`
- audit data — `audit/readiness/{jsr,doctrine,standards}/packages__workers.json`
