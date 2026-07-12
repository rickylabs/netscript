# The Public Surface — `mod.ts` as Enterprise Contract

Axioms governed: A1, A2, A3.

The published surface is the only part of a package the outside world
sees. It is also the only part the JSR audit, the doc score, and the
type checker enforce. Every other doctrine concern (folder shape,
helpers, base classes) follows from getting the surface right.

## What `mod.ts` is

`mod.ts` is the package's contract with its callers. It is:

- a *manifest* of named exports,
- a *map* into the package's documentation,
- a *boundary* across which dependencies become public.

It is not:

- a kitchen sink of every internal symbol,
- a barrel file forwarding from twenty other modules,
- a backwards-compatibility shim layer.

A reader who opens `mod.ts` should be able to learn what the package
does, what verbs it offers, and how to start using it without leaving
the file. If `deno doc <package>` is unreadable, `mod.ts` is broken.

## Surface axioms in operational form

### A1 — Design types first

Before writing a builder or a runtime class, write the types the
caller will see. This is a literal step in the workflow:

1. Sketch the public types in `types.ts` (or `mod.ts` if small).
2. Write the README's "Quick start" block as if those types existed.
3. Only then, implement.

This is *Readme Driven Development* applied to the package boundary.
Tom Preston-Werner: *until you've written about your software, you
have no idea what you'll be coding*.

### A2 — Simple over easy

A new caller arriving at a package gets:

- One named entry point (`createX`, `defineX`, or `startX` —
  pick the verb based on the archetype, see
  [`06-archetypes.md`](./06-archetypes.md)).
- One paragraph of explanation in the JSDoc.
- One runnable example showing the smallest real use.

We do not optimize for the sentence "look how easy this is." We
optimize for the sentence "I read the surface and I now know what
it does."

### A3 — 80% in one chained call

The smallest real example reads as:

```ts
import { defineSaga } from '@netscript/sagas';

const saga = defineSaga('user-registration')
  .initially((s) => s.on('UserRegistered').transitionTo('welcoming'))
  .during('welcoming', (s) => s.on('WelcomeEmailSent').complete())
  .build();
```

Advanced configuration unfolds via additional `withX()` methods. It
does not appear as required arguments to the entrypoint.

## Naming conventions

| Verb           | When to use                                                         |
| -------------- | ------------------------------------------------------------------- |
| `defineX(...)` | Returns a frozen *definition*. No runtime work yet. Builders.        |
| `createX(...)` | Constructs and returns a *runtime* object owning state and IO.       |
| `startX(...)`  | Constructs *and* starts a runtime; returns a `{ stop() }` handle.    |
| `useX(...)`    | Hook-style accessor inside a request/render/handler scope (Fresh).   |
| `withX(...)`   | Builder method only. Always returns a new builder; never mutates.    |

Anything that does not match should be renamed or removed.

### Type naming

- **Types and interfaces**: `PascalCase`. No `I` prefix. No `_T` suffix.
  `WorkerJob`, not `IWorkerJob` or `WorkerJobT`.
- **Plain object types** are preferred over `interface` for data; we use
  `interface` for ports/contracts that may be implemented by multiple
  classes.
- **Discriminated unions** for branching shapes:
  `type ResourceKind = 'service' | 'plugin' | 'package';`
- **Branded primitives** for identifiers that should not interchange:
  `type CorrelationId = string & { readonly __brand: 'CorrelationId' };`
- **Result-shaped returns** where failure is a normal outcome:
  `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };`.
  Use `throw` for programmer errors; use `Result` for expected failures
  the caller must consider.

### Method and function naming

- Verbs read as imperatives: `start`, `stop`, `apply`, `inspect`,
  `verify`, `summarize`.
- A boolean returner is a question: `isReady`, `hasMigrations`,
  `canRetry`. We do not use `getIsReady`.
- A side-effect-free getter omits `get`: `name`, `kind`, `version`.
  We use `get` only when computation is non-trivial or async.

### Subpath exports

Subpath exports are first-class. They split a large surface across
named entries that callers can import individually:

```jsonc
// deno.json
{
  "name": "@netscript/sagas",
  "exports": {
    ".": "./mod.ts",
    "./builders": "./src/builders/mod.ts",
    "./testing": "./src/testing/mod.ts",
    "./adapters/postgres": "./src/adapters/postgres/mod.ts"
  }
}
```

Why subpaths matter:

- **Bundle size.** Callers pay only for what they import.
- **Layering.** Adapter-specific code (Postgres, Redis) does not
  pollute the default surface.
- **Testing helpers** are separated from production exports; the JSR
  audit does not demand example coverage on testing-only utilities.

Rule: if a `mod.ts` would re-export more than ~20 named symbols,
*split into subpaths*. Twenty is a soft heuristic; the hard rule is
"can a reader skim the export list and recognize each name's role?"

## Documentation as part of the surface

Every public export has:

1. A JSDoc summary line (one sentence, present tense).
2. A `@param` for each non-obvious argument.
3. A `@returns` describing the shape and ownership of the result.
4. At least one `@example` block with idiomatic TypeScript that
   compiles. The example is the manual.

```ts
/**
 * Define a worker job that the runtime can dispatch by name.
 *
 * @example
 * ```ts
 * const sendEmail = defineJob('send-email')
 *   .input(z.object({ to: z.string().email() }))
 *   .handle(async (job) => {
 *     await emailClient.send(job.input);
 *   })
 *   .build();
 * ```
 */
export function defineJob(name: string): JobBuilder {
  // ...
}
```

The JSR doc score caps at 100. The doctrine treats anything below as
broken.

## What does not belong on the surface

- **Implementation classes that exist only because we needed to share
  state between functions.** Internal classes are not exported.
- **Test fakes and mocks.** They live under `./testing` and are
  imported through that subpath.
- **Constants that change between versions** (formatter strings,
  error message templates). They are private; if callers need to
  branch on them, expose a typed enum-like.
- **`I*`-style interface aliases for class fields.**
- **Re-exports of upstream packages** (`zod`, `@std/*`). If a caller
  needs Zod, they import Zod. We do not become a vendor.

## Stability levels

A published export is one of:

- **Stable** — semver covered. Breaking changes require a major bump.
- **Experimental** — declared via `@experimental` JSDoc tag. May
  break in a minor release. Never used by another `packages/*`
  package.
- **Internal** — not exported. Even if it is reachable through a
  subpath, the JSDoc declares `@internal` and the JSR audit excludes
  it from the public score.

The default is **stable**. Experimental status is opt-in and time-
limited.

### Deprecation and removal convention

A stable exported symbol scheduled for removal uses this machine-readable JSDoc form:

```ts
/**
 * @deprecated{removal: 0.2} Use `createCurrentThing` instead.
 */
export function createLegacyThing(): LegacyThing;
```

The value is the first `major.minor` release line in which the symbol must no longer be exported.
Deprecation must therefore land before that line, with migration guidance in the same JSDoc tag.
The public-surface diff gate warns when an export carrying this tag remains present at or beyond its
declared removal line. Removing the symbol is still a semver-major surface change and requires an
explicit major declaration until the stable-line policy makes that release intent authoritative.

## Sanctioned exception: slow-types for oRPC-bound packages

One exception to the "no slow types" bar is sanctioned and
documented. Packages that bind a NetScript contract or service
seam to oRPC's real `@orpc/contract` builder types (`oc`,
`Schema`, `AnySchema`, the `ContractProcedureBuilderWith*`
family) MAY set `--allow-slow-types` on their publish dry-run.

Rationale: those upstream types are `declare`d internals, so
`deno doc --lint` inherently emits `private-type-ref` "slow
types" diagnostics that only `--allow-slow-types` waives.
Binding to the real builder types is the *sound* implementation
— it removed a phantom `'~orpc': any` erasure in the base
contract seam. Demanding zero slow types would force that
unsound erasing cast back in. Soundness wins; the slow-types
diagnostic is the accepted cost.

The boundary is strict: this exception applies *only* to
oRPC-bound packages — `packages/contracts` and any plugin
`-core`/`services` package that extends the base contract or
service seam (`BaseContractRoute` / `BaseContractOutputRoute`
from `@netscript/contracts`). Any other package that sets
`--allow-slow-types` is a finding and must carry a debt entry.
The `audit-jsr-package.ts` fitness gate encodes this allow-list:
sanctioned packages report the slow-types diagnostic as an INFO
note; every other package still reports it as a WARN finding.

## Concrete repo examples

### `packages/fresh/builders/mod.ts` (1,110 LOC)

Verdict: a single 1,110-line file *is* the public builder surface.
It is currently the closest thing the repo has to a model package,
but the size means a reader cannot keep the surface in their head.
Doctrine remediation: split by builder concern (route builder,
component builder, query builder, etc.), expose them through
subpaths, keep the top-level `mod.ts` to a manifest.

### `packages/plugin/types.ts` (1,005 LOC)

Verdict: a single 1,000-line file labeled `types.ts`. By definition
it bundles unrelated types into one bag. Remediation: split per
concept (`plugin-definition.ts`, `plugin-loader.ts`,
`plugin-validation.ts`, `plugin-runtime.ts`). Re-export the public
ones from `mod.ts`. The JSR doc score for the package will rise
because each smaller file carries focused JSDoc.

### `packages/streams/` (5 files, 393 LOC)

Verdict: appropriate. A small contract package should not be
inflated.

## Surface checklist for review

Before merging a `packages/*` change that touches `mod.ts`:

- [ ] Every export has a JSDoc summary and at least one `@example`.
- [ ] Every export uses the verb conventions (`define`, `create`,
      `start`, `with`, `use`).
- [ ] The README's quick-start block compiles when copied verbatim.
- [ ] No `I*` interface prefixes; no `*_T` suffixes.
- [ ] No re-exports of upstream packages.
- [ ] Subpath exports are used if the symbol count exceeds 20 or
      the responsibilities exceed three.
- [ ] `deno doc <package>` reads end-to-end as a manual.
- [ ] `deno publish --dry-run` is clean — no portability
      warnings, and no slow types *unless* the package is
      oRPC-bound (see "Sanctioned exception" above).
