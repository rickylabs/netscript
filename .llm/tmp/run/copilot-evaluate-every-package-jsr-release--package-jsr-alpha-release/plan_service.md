# Plan — `@netscript/service`

> Wave **5** · Archetype **A4 — DSL/Builder** · Pattern **Builder + Registry**
> Pair: [`evaluate_service.md`](./evaluate_service.md) · master: [`PLAN.md`](./PLAN.md)
> Standards: [`harmonisation/STANDARDS.md`](./harmonisation/STANDARDS.md) · Surface: [`harmonisation/PUBLIC-SURFACE-PATTERNS.md`](./harmonisation/PUBLIC-SURFACE-PATTERNS.md) · Docs: [`harmonisation/DOCS-STRUCTURE.md`](./harmonisation/DOCS-STRUCTURE.md)

## 1. Concept of done (alpha quality bar)

This package is publish-ready at `0.0.1-alpha.0` when **all nine** PLAN.md § 12 criteria hold:

- [ ] Public surface is immediately understandable, naming follows STANDARDS § 4.
- [ ] Every export carries JSDoc with `@param`/`@returns`/`@example`; `mod.ts` opens with the 80%-path `@module` block.
- [ ] README has all 14 STANDARDS § 6 sections, ≥ 150 lines, code samples are doctest-imported.
- [ ] `deno publish --dry-run --allow-dirty` succeeds (slow-types: 26 → 0).
- [ ] Doctrine FAILs = 0; archetype declared in `docs/architecture.md`.
- [ ] Tests follow STANDARDS § 8 (doctest + unit + port contract + adapter conformance).
- [ ] Logger fields + OTEL spans + metric names match telemetry standard.
- [ ] `mod.ts` exports an `inspect<Noun>(target): InspectionReport`.
- [ ] Internal layering passes `check-doctrine.ts`; files within size cap; no global mutable state.

## 2. Target folder tree

```
packages/service/
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
│   ├── presentation/                  # builders, fluent surface, DSL helpers
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
// mod.ts — A4 DSL/Builder
/**
 * @module
 *
 * <One-sentence purpose>.
 *
 * @example Build
 * ```ts
 * import { buildService } from "jsr:@netscript/service@^0.0.1-alpha.0";
 * const result = buildService("name")
 *   .with...(...)
 *   .build();
 * ```
 */

// ── Builders ──
export { buildService, type ServiceBuilder, type Service } from "./src/public/mod.ts";

// ── DSL / definitions ──
export { defineService, type ServiceDefinition, type ServiceSpec } from "./src/public/mod.ts";

// ── Registry (when applicable) ──
export { ServiceRegistry } from "./src/public/mod.ts";

// ── Errors ──
export { ServiceError } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspectService } from "./src/public/mod.ts";
```


## 4. Test coverage plan

**Required test layers** (STANDARDS § 8):

1. **Doctest of README examples** — `tests/_fixtures/readme-examples_test.ts` imports each ```ts``` block from README to prevent doc rot.
2. **Domain unit tests** — every Zod schema, error class, and pure function in `src/domain/` has a unit test asserting the invariant it embodies.
3. **Port contract tests** — for each interface in `src/ports/`, write `tests/ports/<port>_contract_test.ts` exporting `run<Port>Contract({ make })`. Adapter tests invoke this suite to prove conformance.
4. **Adapter conformance** — for each adapter in `src/adapters/`, `tests/adapters/<backend>_test.ts` runs the port contract suite with that adapter wired.
5. **Runtime lifecycle tests** — every abstract base / default class has tests for `start` → `execute` → `stop`, crash → `onError` → retry, and idempotence.
6. **Supervision tests** — registry resolves, freezes, rejects duplicates; runtime supervisor wires definition + adapter correctly.
7. **DSL / builder ergonomics tests** — `defineService` rejects malformed specs; `buildService` enforces required steps (typed at compile time and at runtime).

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
3. **Slow-types refactor** (26 problems) — add explicit return types to every published function; replace inferred `z.infer` chains with declared `<Noun>Definition` interfaces with slot generics. See PUBLIC-SURFACE-PATTERNS § 4.
4. **Test scaffold** — write doctest + domain unit + port contract tests per § 4 of this plan.
5. **Barrel discipline** — `mod.ts` is too large or has logic; curate via `src/public/mod.ts` and re-export named symbols only.
6. **Inspection diagnostic** — export `inspectService(target): InspectionReport` from mod.ts.
7. **Final dry-run** — `deno publish --dry-run --allow-dirty` must succeed.
8. **Pin version** — set `"version": "0.0.1-alpha.0"`; run `release-readiness.ts` and confirm 0 fail.

## 6. Gate matrix

| Gate | Source | Today | Target |
|---|---|---:|---:|
| JSR FAIL | `audit/readiness/jsr/packages__service.json` | 2 | 0 |
| JSR WARN | same | 0 | ≤ 2 |
| Doctrine FAIL | `audit/readiness/doctrine/packages__service.json` | 0 | 0 |
| Doctrine WARN | same | 1 | ≤ 5 |
| Standards FAIL | `audit/readiness/standards/packages__service.json` | 6 | 0 |
| Standards WARN | same | 7 | ≤ 10 |
| `deno publish --dry-run` | `audit/dry-run/service.txt` | FAIL | OK |
| Slow types | same | 26 | 0 |

## 7. Naming map (current → target)

_(no obvious naming violations detected from public surface scan — verify manually against STANDARDS § 4)_

## 8. Documentation deliverables

- `README.md` — all 14 STANDARDS § 6 sections (currently *missing*)
- `docs/README.md` (ToC)
- `docs/architecture.md` (archetype declaration + ascii diagram + axiom call-outs)
- `docs/concepts.md` (glossary)
- `docs/getting-started.md` (10-min walk-through)
- `docs/recipes/` (≥ 3 task recipes; required for this package)
- `docs/reference/` (auto-generated stub at alpha; Wave 0 generator lands later)

## 9. References

- PLAN.md — wave 5, archetype A4 — DSL/Builder
- doctrine — `.llm/research/architecture-doctrine-docs-v2/doctrine/`
- standards — `harmonisation/STANDARDS.md`
- patterns — `harmonisation/PUBLIC-SURFACE-PATTERNS.md`
- docs spec — `harmonisation/DOCS-STRUCTURE.md`
- audit data — `audit/readiness/{jsr,doctrine,standards}/packages__service.json`
