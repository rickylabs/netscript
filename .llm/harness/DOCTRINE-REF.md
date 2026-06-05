# Doctrine Reference

Harness v2 is derived from the NetScript Architecture Doctrine. The doctrine is
the source of truth for `packages/` and `plugins/`; the harness is the run-time
operating model that makes agents apply it.

## Primary Files

| File | Use |
|------|-----|
| `.llm/research/architecture-doctrine-docs-v2/doctrine/01-thesis-and-axioms.md` | Thesis and A1-A14 |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/02-public-surface.md` | Public exports, `mod.ts`, README and JSR surface |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/03-base-and-derived-classes.md` | Stub-only bases, inheritance limits |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/04-modules-and-helpers.md` | Helpers, adapters, Web Platform and `@std/*` first |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/05-folder-structure.md` | Role vocabulary, layering, file shape |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/06-archetypes.md` | Six package archetypes and selection order |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/07-composition-and-extension.md` | Composition roots, constructor injection, extension axes |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/08-runtime-state-failure.md` | Stateful runtime, supervision, cancellation, failure |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/09-anti-patterns-and-fitness-functions.md` | AP-1..AP-20 and F-1..F-15 |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/10-codebase-verdict-and-handoff.md` | Current verdict per package and debt seed |

## Axiom Digest

This digest is a navigation aid only. Read the doctrine file before making or
evaluating a package/plugin change.

| Axiom | Navigation summary |
|-------|--------------------|
| A1 | Public types are designed before implementation. |
| A2 | Published boundaries optimize for one concern, not hidden convenience. |
| A3 | The 80 percent case is one chained call; advanced cases unfold one method deeper. |
| A4 | Base classes are stub-only contracts; concrete classes delegate. |
| A5 | Composition over inheritance by default. |
| A6 | Helpers require a real justification. |
| A7 | Web Platform and `@std/*` come before local substitutes. |
| A8 | Folders and files each name one concern. |
| A9 | The six archetypes determine the minimum viable package shape. |
| A10 | Composition root over container; constructor injection by default. |
| A11 | Extension axes are named before abstraction. |
| A12 | Durable workflows are state machines. |
| A13 | Crash boundaries are explicit. |
| A14 | Tests, static gates, JSR gates, and fitness functions preserve the doctrine. |

## Scope Boundary

The doctrine governs `packages/` and `plugins/`. Harness runs can also touch
apps, services, background workers, and infrastructure; those use the relevant
scope overlay and normal validation gates unless they modify a package/plugin
surface.
