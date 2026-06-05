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

This skill is a navigator. The doctrine remains authoritative; read the relevant
doctrine file before changing or evaluating package/plugin code.

## When to Use

- Work touches or describes `packages/` or `plugins/`.
- Public `@netscript/*` exports need design or review.
- Package READMEs or JSR readiness need evaluation.
- Architecture debt entries need creation or closure.
- Harness plans/evaluations for package or plugin work.

## When Not to Use

- For app, service, frontend, or infrastructure work that does **not** change or
  evaluate package/plugin surfaces — use the relevant scope overlay or domain
  skill instead.
- For JSR publishability audits — use `jsr-audit`.
- For harness orchestration — use `netscript-harness`.

## Key Concepts

| Concept | Meaning |
|---------|---------|
| **Doctrine** | The 10-file architecture specification under `docs/architecture/doctrine/`. Append-only. |
| **Archetype** | One of six package shapes (1 Small Contract … 6 CLI/Tooling). Determines minimum viable structure. |
| **Axiom** | A1–A14: foundational assumptions every package must respect. |
| **Anti-Pattern (AP)** | AP-1..AP-20: common mistakes the evaluator checks for. |
| **Fitness Gate (F)** | F-1..F-18: automated checks per archetype. |
| **Layering** | `domain` → `ports` → `application` → `adapters` → `presentation`. |
| **Debt** | Recorded violations in `.llm/harness/debt/arch-debt.md` with owner, target, and closing gate. |

### Archetype Selection

Use `.llm/harness/archetypes/README.md` for the run-time decision tree.

| Archetype | Use |
|-----------|-----|
| 1 Small Contract | types, schemas, invariants, little runtime |
| 2 Integration | external systems, ports, adapters |
| 3 Runtime/Behavior | long-running behavior, state, lifecycle, supervision |
| 4 Public DSL/Builder | fluent builders and definition APIs |
| 5 Plugin Package | first-party `plugins/*` packages |
| 6 CLI/Tooling | binaries, commands, scaffold/deploy flows |

If two archetypes apply, choose the larger one and fold the smaller concern
inside it.

### Axiom Quick Reference

| Axiom | Summary |
|-------|---------|
| A1 | Public types first. |
| A2 | Simple over easy at published boundaries. |
| A3 | 80 percent path is one chained call. |
| A4 | Base classes are stub-only contracts. |
| A5 | Composition over inheritance. |
| A6 | Helpers must be justified. |
| A7 | Web Platform and `@std/*` first. |
| A8 | One concern per folder; one reason per file. |
| A9 | Archetype drives package shape. |
| A10 | Composition root over container. |
| A11 | Name extension axes before abstraction. |
| A12 | Durable workflows are state machines. |
| A13 | Crash boundaries are explicit. |
| A14 | Tests and gates preserve doctrine. |

### Layering Quick Reference

Source: doctrine file 05.

- `domain/` imports no package implementation.
- `ports/` imports `domain/` only.
- `application/` imports `domain/` and `ports/`; not `adapters/`.
- `adapters/` imports `domain/`, `ports/`, and external clients.
- `presentation/` imports `application/` and `domain/`; not `adapters/`.
- `testing/` imports public surface and testing adapters only.

### Folder Vocabulary

Use doctrine file 05 for definitions. Allowed role names include:

`domain`, `ports`, `application`, `adapters`, `runtime`, `state`,
`middleware`, `presets`, `registry`, `diagnostics`, `presentation`, `testing`,
`internal`, `tests`, and `examples`.

Generic `utils`, `helpers`, `common`, `lib`, and `interfaces` folders are
doctrine findings unless a migration plan and debt entry explicitly cover them.

## Workflow

1. Identify the affected package/plugin surfaces.
2. Select the smallest archetype that fits (use `.llm/harness/archetypes/README.md`).
3. Read the relevant doctrine file(s) from the table below.
4. Apply the axiom and anti-pattern checks.
5. Verify layering and folder vocabulary.
6. Record any new or deepened debt.

## Common Pitfalls

- **Treating archetype as a folder template** — The archetype is a design
  constraint, not a checklist of folders to create. Every file must trace back
  to a concept named in the design checkpoint.
- **Duplicating doctrine into skills** — Skills point to doctrine files; they do
  not copy passages. The doctrine is the single source of truth.
- **Ignoring debt registry** — New violations must be recorded with a closing
  gate and owner. Unrecorded violations are `FAIL_DEBT`.

## What NetScript doesn't do yet

> **Status: draft — pending user approval before becoming mandatory.**

- **Private JSR packages** — Not yet available. Workaround: use public packages
  with scoped names and internal documentation. Tracked by JSR.
- **Automated fitness gate scripts** — Phase A; gates are run manually or
  reported as `PENDING_SCRIPT`. Workaround: manual evidence in `worklog.md`.
- **Cross-package refactoring assistant** — No automated tool renames symbols
  across packages. Workaround: `grep` + manual refactor.
- **Visual architecture diagram generation** — No tool generates diagrams from
  the doctrine. Workaround: maintain diagrams manually in `docs/`.

## Reference Files

| File | Load when |
|------|-----------|
| `.llm/research/architecture-doctrine-docs-v2/doctrine/01-thesis-and-axioms.md` | Starting any doctrine-aware run |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/02-public-surface.md` | Exports, `mod.ts`, README, JSR docs |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/03-base-and-derived-classes.md` | Classes, inheritance, runners |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/04-modules-and-helpers.md` | Helpers, adapters, `@std/*`, Web Platform |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/05-folder-structure.md` | Folder shape, layering, naming |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/06-archetypes.md` | Archetype selection |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/07-composition-and-extension.md` | Composition root, DI, extension axes |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/08-runtime-state-failure.md` | Stateful runtimes, sagas, workers, triggers |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/09-anti-patterns-and-fitness-functions.md` | AP catalog and F gates |
| `.llm/research/architecture-doctrine-docs-v2/doctrine/10-codebase-verdict-and-handoff.md` | Current verdicts and remediation priorities |
| `.llm/harness/archetypes/README.md` | Run-time archetype decision tree |
| `.llm/harness/gates/archetype-gate-matrix.md` | Required gates per archetype |
| `.llm/harness/evaluator/anti-pattern-catalog.md` | Evaluator wording for AP findings |
| `.llm/harness/debt/arch-debt.md` | Persistent architecture debt registry |

## Checklist

- [ ] The correct archetype is selected and justified.
- [ ] Relevant doctrine file(s) were read before making changes.
- [ ] Layering rules are respected (no forbidden imports).
- [ ] Folder vocabulary uses allowed role names only.
- [ ] New or deepened debt is recorded in `arch-debt.md`.
