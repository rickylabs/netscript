---
name: netscript-doctrine
description: >
  Navigator for the NetScript Architecture Doctrine. Use for any work that
  writes, reviews, plans, or evaluates framework-layer code in packages/ or
  plugins/, and for docs that describe package/plugin architecture. Points to
  doctrine sections, archetypes, anti-patterns, fitness gates, layering rules,
  folder vocabulary, and architecture debt handling without duplicating the
  doctrine text.
---

# NetScript Doctrine Skill

This skill is a navigator. The doctrine remains authoritative; read the relevant doctrine file
before changing or evaluating package/plugin code.

## Activation

Use this skill when work touches or describes:

- `packages/`
- `plugins/`
- public `@netscript/*` exports
- package READMEs or JSR readiness
- architecture debt entries
- harness plans/evaluations for package or plugin work

For app, service, frontend, or infrastructure work, use this skill only when the work changes or
evaluates package/plugin surfaces.

## Doctrine Files

| File                                                                   | Load when                                   |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| `docs/architecture/doctrine/01-thesis-and-axioms.md`                   | Starting any doctrine-aware run             |
| `docs/architecture/doctrine/02-public-surface.md`                      | Exports, `mod.ts`, README, JSR docs         |
| `docs/architecture/doctrine/03-base-and-derived-classes.md`            | Classes, inheritance, runners               |
| `docs/architecture/doctrine/04-modules-and-helpers.md`                 | Helpers, adapters, `@std/*`, Web Platform   |
| `docs/architecture/doctrine/05-folder-structure.md`                    | Folder shape, layering, naming              |
| `docs/architecture/doctrine/06-archetypes.md`                          | Archetype selection                         |
| `docs/architecture/doctrine/07-composition-and-extension.md`           | Composition root, DI, extension axes        |
| `docs/architecture/doctrine/08-runtime-state-failure.md`               | Stateful runtimes, sagas, workers, triggers |
| `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` | AP catalog and F gates                      |
| `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`        | Current verdicts and remediation priorities |

## Archetype Selection

Use `.llm/harness/archetypes/README.md` for the run-time decision tree.

| Archetype            | Use                                                  |
| -------------------- | ---------------------------------------------------- |
| 1 Small Contract     | types, schemas, invariants, little runtime           |
| 2 Integration        | external systems, ports, adapters                    |
| 3 Runtime/Behavior   | long-running behavior, state, lifecycle, supervision |
| 4 Public DSL/Builder | fluent builders and definition APIs                  |
| 5 Plugin Package     | first-party `plugins/*` packages                     |
| 6 CLI/Tooling        | binaries, commands, scaffold/deploy flows            |

If two archetypes apply, choose the larger one and fold the smaller concern inside it.

## Axiom Quick Reference

| Axiom | Summary                                      |
| ----- | -------------------------------------------- |
| A1    | Public types first.                          |
| A2    | Simple over easy at published boundaries.    |
| A3    | 80 percent path is one chained call.         |
| A4    | Base classes are stub-only contracts.        |
| A5    | Composition over inheritance.                |
| A6    | Helpers must be justified.                   |
| A7    | Web Platform and `@std/*` first.             |
| A8    | One concern per folder; one reason per file. |
| A9    | Archetype drives package shape.              |
| A10   | Composition root over container.             |
| A11   | Name extension axes before abstraction.      |
| A12   | Durable workflows are state machines.        |
| A13   | Crash boundaries are explicit.               |
| A14   | Tests and gates preserve doctrine.           |

## Anti-Pattern Quick Reference

Use `.llm/harness/evaluator/anti-pattern-catalog.md` for evaluator wording. Use doctrine file 09 for
full definitions and examples.

## Fitness Gates

Gate definitions live in `.llm/harness/gates/fitness-gates.md`; the matrix lives in
`.llm/harness/gates/archetype-gate-matrix.md`.

Phase A note: script files are not implemented yet. Record gates as `PENDING_SCRIPT` with manual
evidence until later phases add scripts.

## Layering Quick Reference

Source: doctrine file 05.

- `domain/` imports no package implementation.
- `ports/` imports `domain/` only.
- `application/` imports `domain/` and `ports/`; not `adapters/`.
- `adapters/` imports `domain/`, `ports/`, and external clients.
- `presentation/` imports `application/` and `domain/`; not `adapters/`.
- `testing/` imports public surface and testing adapters only.

## Folder Vocabulary

Use doctrine file 05 for definitions. Allowed role names include:

`domain`, `ports`, `application`, `adapters`, `runtime`, `state`, `middleware`, `presets`,
`registry`, `diagnostics`, `presentation`, `testing`, `internal`, `tests`, and `examples`.

Generic `utils`, `helpers`, `common`, `lib`, and `interfaces` folders are doctrine findings unless a
migration plan and debt entry explicitly cover them.

## Debt Handling

Use `.llm/harness/debt/arch-debt.md` and `.llm/harness/templates/debt-entry.md`.

Rules:

- record violations that cannot be fixed in the current run,
- require owner, target, reason, linked plan, status, and closing gate,
- do not deepen existing debt without updating its entry,
- close entries only with gate evidence.
