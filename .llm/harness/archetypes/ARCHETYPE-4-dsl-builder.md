# Archetype 4 — Public DSL / Builder

## Doctrine Reference

- Axioms: A1, A2, A3, A6, A8, A9, A10, A11, A14.
- Primary sections:
  - `doctrine/02-public-surface.md`
  - `doctrine/05-folder-structure.md`
  - `doctrine/06-archetypes.md#archetype-4--public-dsl--builder`
  - `doctrine/07-composition-and-extension.md`
  - `doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-2, AP-7, AP-8, AP-9, AP-11, AP-13, AP-14, AP-15, AP-16, AP-19, AP-20.
- Fitness functions: F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-14, F-15.

## When This Archetype Applies

Use this profile when the package's primary product is a fluent definition API, builder, or public
DSL. The quick start should demonstrate the 80 percent case as one coherent chain. If the builder
materializes a long-running runtime, add the relevant runtime gates.

## Minimum Folder Shape

Use the canonical shape in `doctrine/06-archetypes.md#archetype-4--public-dsl--builder`. The builder
must be split by concern: entry function, builder class, state, validation, definition factory, and
runtime only when needed.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when published surface changes
- frontend skills only when the DSL drives UI code or Fresh routes

## Read First

1. `doctrine/06-archetypes.md#archetype-4--public-dsl--builder`.
2. `doctrine/02-public-surface.md`.
3. `doctrine/07-composition-and-extension.md`.
4. The README quick start, `mod.ts`, builders, definition types, and tests.
5. Consumers that call the builder chain.
6. Relevant debt entries.

## Required Gates in Order

1. Static gates: package/slice check, fmt, lint, doc lint, publish dry-run.
2. Fitness gates: F-1 through F-12 as listed above, plus F-14 and F-15.
3. Runtime gates: optional; required when the DSL starts, configures, or materializes runtime
   behavior.
4. Browser validation: required when the DSL drives Fresh/frontend route output.
5. Consumer gates: required for builder method, definition, export, or subpath changes.

## Anti-Patterns to Watch For

- AP-1: a builder barrel that contains all concerns.
- AP-7: long positional constructor/factory arguments instead of typed builder state.
- AP-9: typestate or generics added before a broken-order problem exists.
- AP-14: re-exporting Zod or upstream DSL dependencies.
- AP-15: names that expose implementation roles instead of caller vocabulary.

## False-Done States

- The chain compiles but the README example no longer matches the public API.
- `build()` returns a mutable object.
- Validation exists only at runtime when typestate was needed to prevent broken order.
- Subpath exports are not checked after splitting builders.

## Rescope Triggers

- A single builder file must be split before adding behavior.
- The package is actually runtime/behavior with a builder facade.
- Consumer examples show incompatible method names or order.
- JSR doc score would fall because exported methods lack examples.

## Design Checkpoint Expectations

The design checkpoint writes the caller-facing chain before implementation, names the definition
object, lists validation points, identifies whether typestate is needed, and defines consumer import
checks.

The design section in `worklog.md` must include:

- the fluent API shape (entry function, `with*()` methods, `build()`),
- definition type and builder state type,
- validation rules and where they fire,
- commit slices: definition+builder core first, then sub-builders, then materialization/runtime,
  then consumer examples,
- contributor path for adding a new builder method or sub-builder.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- the README quick-start example matches the current public API,
- `build()` returns an immutable definition,
- builder files are split by concern (entry, state, validation, factory),
- consumer examples compile and demonstrate the 80% case.

## Historical Notes

Builder packages fail by accumulating "just one more method" in one file. The profile treats file
boundaries as part of the API design.
