# Archetype Selection

Archetype profiles replace v1 task-category profiles for package and plugin work. The selected
archetype defines the validation shape; scope overlays add frontend, service, or docs-specific
checks.

Doctrine source: `docs/architecture/doctrine/06-archetypes.md`.

## Decision Order

Pick the smallest archetype that fits:

| Question                                                                                | Archetype                              |
| --------------------------------------------------------------------------------------- | -------------------------------------- |
| Does it only publish types, schemas, and small invariants?                              | `ARCHETYPE-1-small-contract.md`        |
| Does it wrap an external system behind package-owned ports/adapters?                    | `ARCHETYPE-2-integration.md`           |
| Does it own long-running stateful behavior, lifecycle, or supervised execution?         | `ARCHETYPE-3-runtime-behavior.md`      |
| Is the primary product a fluent DSL or builder API?                                     | `ARCHETYPE-4-dsl-builder.md`           |
| Is it a first-party package under `plugins/*`?                                          | `ARCHETYPE-5-plugin.md`                |
| Does it ship a binary or command-line flow?                                             | `ARCHETYPE-6-cli-tooling.md`           |
| Does it deploy an app to multiple targets behind a port/adapter seam + thin CLI router? | `ARCHETYPE-7-deploy-target-adapter.md` |

If two archetypes apply, choose the larger one and fold the smaller concerns inside it. Do not split
one package across two archetypes. Archetype 7 is a **composite** that folds Archetype 2 and
Archetype 6 for the deployment feature; a single-target CLI deploy flow with no port stays Archetype
6.

## Scope Overlays

Use overlays after selecting any applicable package/plugin archetype:

| Overlay             | Use                                                                  |
| ------------------- | -------------------------------------------------------------------- |
| `SCOPE-frontend.md` | Fresh, UI, route, browser, or visual workflow work                   |
| `SCOPE-service.md`  | `services/`, API handler, background runtime, or Aspire service work |
| `SCOPE-docs.md`     | RFC, README, knowledge base, run artifact, or doctrine-facing docs   |

## Required Output in Plans

Every `plan.md` for package/plugin work must include:

- selected archetype and justification,
- scope overlays,
- current doctrine verdict from doctrine file 10,
- required gates from `../gates/archetype-gate-matrix.md`,
- known debt entries from `../debt/arch-debt.md`,
- anti-patterns in scope by AP code.
