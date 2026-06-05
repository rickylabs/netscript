# Archetype 1 — Small Contract

## Doctrine Reference

- Axioms: A1, A2, A6, A7, A8, A9, A14.
- Primary sections:
  - `doctrine/02-public-surface.md`
  - `doctrine/04-modules-and-helpers.md`
  - `doctrine/05-folder-structure.md`
  - `doctrine/06-archetypes.md#archetype-1--small-contract`
  - `doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-2, AP-7, AP-9, AP-13, AP-14, AP-15, AP-16, AP-20.
- Fitness functions: F-1, F-5, F-6, F-7, F-8, F-10, F-11, F-12, F-14, F-15.

## When This Archetype Applies

Use this profile for packages whose value is a clear public contract: types,
schemas, branded identifiers, parse/validation helpers, and small invariants.
If the work introduces adapters, runtime lifecycle, state, or a fluent API as
the main product, select a larger archetype.

Current examples are listed in `doctrine/06-archetypes.md` under "Archetype
assignments for current packages."

## Minimum Folder Shape

Use the canonical shape in `doctrine/06-archetypes.md#archetype-1--small-contract`.
The review question is not whether every folder exists; it is whether the
package stayed small and avoided invented layers.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when publishability or JSR score is in scope

## Read First

1. This profile.
2. `../gates/archetype-gate-matrix.md`.
3. `doctrine/06-archetypes.md#archetype-1--small-contract`.
4. `doctrine/02-public-surface.md`.
5. The package README, `mod.ts`, `deno.json`, and tests.
6. Relevant debt entries in `../debt/arch-debt.md`.

## Required Gates in Order

1. Static gates: narrow `deno check`, package slice check, `deno fmt --check`,
   `deno lint`, `deno doc --lint`, `deno publish --dry-run` when package scope.
2. Fitness gates: F-1, F-5, F-6, F-7, F-8, F-10, F-11, F-12, F-14, F-15.
3. Runtime gates: none by default.
4. Consumer gates: optional unless exports, names, or validation semantics
   changed.

## Anti-Patterns to Watch For

- AP-1: one schema/type file that grows into a bag of concepts.
- AP-2: helpers that rename Zod, Web Platform, or `@std/*` primitives.
- AP-7: telescoping parse or factory functions.
- AP-9: premature abstraction across two similar schemas.
- AP-14: re-exporting upstream libraries as part of the package surface.
- AP-16: `utils/`, `helpers/`, or `common/` folders.

## False-Done States

- The package compiles but the README does not document the type table or
  permissions.
- A single large `schema.ts` remains because "it is only types."
- The public surface exports every internal type instead of a curated contract.
- Validation changed but consumer examples were not checked.

## Rescope Triggers

- The package needs adapters or external IO.
- The package needs lifecycle, state, or background work.
- The exported symbol count suggests subpaths or a split package.
- The current doctrine verdict is `Restructure` or `Rewrite`.

## Design Checkpoint Expectations

The design checkpoint names the contract boundary first: public types, exported
schemas, README sections, and semantic tests. Implementation follows that
surface.

The design section in `worklog.md` must include:

- public surface (types, schemas, parse/validate functions),
- constants for finite domain values,
- commit slices with gates,
- contributor path for adding a new type or schema.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- the README documents the type table and permissions,
- the public surface exports a curated contract, not every internal type,
- no single schema file has grown into a bag of unrelated concepts,
- validation semantics are tested, not just compilation.

## Historical Notes

Small packages are allowed to remain small. Adding generic layers to make them
look enterprise-shaped is a doctrine violation, not a maturity upgrade.
