# Codebase Verdict and Engineering-Doc Handoff

The doctrine pages above describe the target. This page closes the
loop: it walks the current `packages/*` and `plugins/*`,
labels each one against the doctrine, and tells the next agent — the
one who will write the *authoritative engineering reference* — what
to produce.

## Verdict per package

The verdict is one of:

- **Keep** — current shape is doctrine-aligned; only minor polish.
- **Refactor** — shape is nearly right; specific files need
  splitting or renaming.
- **Restructure** — shape is wrong; needs an archetype-shaped
  reorganization.
- **Rewrite (small)** — package is small enough that rewriting
  inside a doctrine-aligned skeleton is faster than refactoring.
- **Defer** — the package is barely used; verdict pending real use.

| Package                       | Archetype | LOC    | Verdict     | Headline action                                                        |
| ----------------------------- | --------- | ------ | ----------- | ---------------------------------------------------------------------- |
| `@netscript/streams`          | 1         | 393    | Keep        | Document delivery semantics in README.                                 |
| `@netscript/runtime-config`   | 1         | 415    | Refactor    | Split single-file `mod.ts`; add subpaths if exports grow.               |
| `@netscript/config`           | 1         | 1,968  | Refactor    | Split `schema.ts` (945) by concept; types per file.                     |
| `@netscript/aspire`           | 2         | 1,859  | Keep        | Rename `helpers/` to role-named folders.                                |
| `@netscript/cron`             | 2         | 1,732  | Refactor    | Rename `interfaces/` → `ports/`; rename adapter classes by tech.        |
| `@netscript/database`         | 2         | 3,336  | Refactor    | Same `ports/` rename; ensure single composition root.                   |
| `@netscript/queue`            | 2         | 3,534  | Refactor    | Lift `internal/` and `utils/` into role-named folders.                  |
| `@netscript/kv`               | 2         | 5,919  | Refactor    | Split `bridge_test.ts` (1,039); audit adapters.                         |
| `@netscript/prisma-adapter-mysql` | 2     | 1,340  | Keep        | Verify it implements a port owned by `@netscript/database`.             |
| `@netscript/logger`           | 2         | 1,203  | Keep        | Confirm port shape; consider folding into `telemetry`.                  |
| `@netscript/telemetry`        | 2         | 4,634  | Refactor    | Confirm port + adapter split; OTEL adapter as subpath export.           |
| `@netscript/watchers`         | 3         | 1,608  | Keep        | Confirm `AbortSignal` propagation; add `stop()` handle.                 |
| `@netscript/triggers`         | 3         | 3,637  | Restructure | Lift flat `*.ts` into `application/`, `state/`, `runtime/`.             |
| `@netscript/workers`          | 3         | 13,062 | Restructure | Split `task-executor.ts` (1,287); supervisor as separate module.        |
| `@netscript/sagas`            | 3         | 6,462  | Refactor    | Split `list-transport.ts` (847); compensation as builder method.        |
| `@netscript/fresh`            | 4         | 11,658 | Restructure | Split `builders/mod.ts` (1,110) per builder concern; subpath exports.   |
| `@netscript/fresh-ui`         | 4         | 2,911  | Keep        | Confirm runtime registry shape.                                         |
| `@netscript/sdk`              | 4         | 3,080  | Keep        | High cohesion already; minor naming review.                             |
| `@netscript/service`          | 4         | 1,633  | Refactor    | `presets/` named, `assets/` clarified.                                  |
| `@netscript/contracts`        | 4         | 1,484  | Keep        | Confirm version-axis shape; `crud/` folder review.                      |
| `@netscript/plugin`           | 4         | 1,951  | Restructure | Split `types.ts` (1,005); introduce `domain/` + `ports/`.               |
| `@netscript/cli`              | 6         | 38,436 | Restructure | Split `pipeline.ts` (1,869), `official-plugin-copier.ts` (1,203). Apply Archetype-6 layout. |
| `@netscript/shared`           | special   | 2,347  | Rewrite     | Replace `utils/datetime.ts` (1,112) with `@std/datetime`/`Temporal`; shrink to cross-package identifiers only. |
| `plugins/hello-world`         | 5         | 234    | Keep        |                                                                         |
| `plugins/sagas`               | 5         | 1,683  | Keep        | Doctrine-aligned shape already.                                         |
| `plugins/streams`             | 5         | 255    | Keep        |                                                                         |
| `plugins/triggers`            | 5         | 3,170  | Refactor    | Confirm `verify-plugin.ts` exists.                                      |
| `plugins/workers`             | 5         | 4,345  | Refactor    | Confirm `verify-plugin.ts` exists; review `worker/` vs `jobs/` split.   |

## Top-priority remediations

1. **`@netscript/cli`** — the CLI is the largest single package and
   the CLI E2E refactor is the proving ground. Its `pipeline.ts` and
   plugin-copier are the most expensive monoliths in the repo.
2. **`@netscript/workers`** — second-largest, with the
   `task-executor` monolith. The supervisor / executor / dispatcher
   split is the doctrine's exemplar for runtime/behavior packages.
3. **`@netscript/shared`** — replacing `utils/datetime.ts` with
   `@std/datetime` is the cleanest demonstration of A6 + A7 in the
   whole repo.
4. **`@netscript/plugin`** — `types.ts` 1,005-LOC split is the
   exemplar for "types come first; split per concept."
5. **`@netscript/fresh`** — `builders/mod.ts` 1,110-LOC split is
   the exemplar for Archetype 4 (DSL/Builder).

These five touch every doctrine concern: surface, base classes,
modules, folder structure, runtime, fitness functions. Doing them
first creates the templates the rest of the repo follows.

## What the next engineering reference must contain

The doctrine is a constitution. The next document is the
*engineering reference* — the authoritative implementation manual
that turns each doctrine clause into a concrete recipe. It is the
artifact a contributor reads alongside the doctrine. It must
include:

### 1. Recipe per archetype

For each of the six archetypes, a step-by-step starter:

- exact starter folder tree,
- exact `deno.json` template (name, version, exports, tasks),
- exact `mod.ts` skeleton with placeholder JSDoc,
- exact `README.md` template with the required sections,
- a `npm:`/`jsr:` dependency budget (what is allowed, what isn't),
- a sample fitness-function configuration block.

### 2. Recipe per role folder

For each role folder (`domain/`, `ports/`, `application/`,
`adapters/`, `runtime/`, `state/`, `middleware/`, `presets/`,
`registry/`, `diagnostics/`, `presentation/`, `testing/`,
`internal/`), a one-page recipe:

- what goes in,
- what does *not* go in,
- naming conventions for files inside,
- examples drawn from the in-repo packages.

### 3. Recipe per pattern

For each pattern named in Phase 0:

- composition root (factory)
- typed-token container (when escalated)
- stub-only base class
- thin dispatcher concrete class
- forwarding class for composition over inheritance
- typestate builder
- saga state machine
- supervisor + crash boundary
- error normalizer
- pipeline middleware
- registration over inheritance

…show the canonical TypeScript skeleton, the test skeleton, and the
fitness-function check that protects it.

### 4. Recipe per anti-pattern

For each AP-N in
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md):

- example of the violation,
- example of the fix,
- the fitness function that detects it,
- how to enter an `arch-debt.md` entry if the fix is deferred.

### 5. Concrete refactor playbooks

For each top-priority remediation:

- the current file's responsibilities, enumerated,
- the target shape (folder tree, file names, exported types),
- the migration sequence (what to extract first, what to extract
  last),
- the test plan (what semantic tests must remain green),
- the JSR-publish dry-run target.

### 6. Fitness-function source

The `.llm/tools/check-*.ts` scripts named in
[`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md),
implemented and integrated into `deno task arch:check`. The
engineering doc both describes and ships them.

### 7. Architectural debt registry

The `.llm/arch-debt.md` template plus the rules for when an entry
is required, what fields are mandatory, and how entries are closed.

### 8. Review checklist

The combined PR-review checklist drawn from every doctrine page.

### 9. Glossary

The ubiquitous-language glossary of NetScript terms — saga,
trigger, worker, plugin, contract, port, adapter, runtime, gate,
flow, supervisor — defined once, used everywhere.

### 10. Migration roadmap

A phased plan to bring the current repo into doctrine alignment:

- Phase A — establish fitness functions and `arch-debt.md` registry.
- Phase B — apply doctrine to the five top-priority packages above.
- Phase C — propagate to the remaining packages.
- Phase D — open the `@netscript/*` packages for external
  consumption (JSR publish at full doc score, semver discipline,
  release notes).

## Stop conditions

The doctrine is *not* permission to halt feature work and
restructure everything. The doctrine binds *new* code immediately
and *existing* code through the migration roadmap. A package may
remain in violation as long as:

- the violation is recorded in `arch-debt.md`,
- a time-bounded plan exists,
- new code added to that package does not deepen the violation.

A package emerges from violation when its file passes the relevant
fitness functions and the `arch-debt.md` entry is removed.

## Definition of done for the doctrine

The doctrine is complete when:

- `deno task arch:check` passes for every package without opt-outs
  except those that match an active `arch-debt.md` entry,
- every package's README declares its archetype and required
  permissions,
- every published package has JSR doc score 100,
- every published package's `deno publish --dry-run` is clean,
- the codebase walk above shows zero "Restructure" or "Rewrite"
  verdicts.

When that bar is met, NetScript packages can ship to JSR as the
public framework they are meant to be, and the doctrine becomes
self-enforcing through the gates rather than reliant on review
discipline.
