# Archetype 5 — Plugin Package

## Doctrine Reference

- Axioms: A1, A2, A5, A7, A8, A9, A10, A11, A12, A13, A14.
- Primary sections:
  - `docs/architecture/doctrine/05-folder-structure.md`
  - `docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`
  - `docs/architecture/doctrine/07-composition-and-extension.md#plugin-discovery-and-loading`
  - `docs/architecture/doctrine/08-runtime-state-failure.md` when plugin contributes runtime work
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-3, AP-8, AP-9, AP-10, AP-11, AP-13, AP-14, AP-16, AP-19, AP-20.
- Fitness functions: F-1, F-3, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-13 when runtime
  declarations require it, F-14, F-15.

## When This Archetype Applies

Use this profile for first-party `plugins/*` packages. The plugin contributes contracts, services,
database/schema pieces, jobs, sagas, triggers, streams, or verification to the NetScript host.

## Minimum Folder Shape

Use the canonical shape in `docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`. The package
reuses sibling package contracts instead of redefining them and exposes explicit service/background
entrypoints.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when the plugin is published or exported
- `aspire` when runtime/service validation is required

## Read First

1. `docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`.
2. `docs/architecture/doctrine/07-composition-and-extension.md#plugin-discovery-and-loading`.
3. Sibling package contracts the plugin re-exports or consumes.
4. Plugin `contracts.ts`, `mod.ts`, `deno.json`, verification file, services, database files, and
   runtime declarations.
5. Host loader or consumer code that discovers the plugin.
6. Relevant debt entries.

## Required Gates in Order

1. Static gates: plugin check slice, package check if sibling contracts changed, fmt, lint, doc
   lint, publish dry-run when relevant.
2. Fitness gates: listed F gates; F-13 only when runtime declarations require saga/worker/runtime
   invariants.
3. Runtime gates: required when plugin services, workers, sagas, triggers, or database contributions
   are touched.
4. Consumer gates: required for plugin loader, host imports, and sibling package contracts.

## Anti-Patterns to Watch For

- AP-11: plugin load side effects or implicit discovery magic.
- AP-14: redefining sibling package contracts instead of re-exporting.
- AP-16: generic folders that hide plugin contributions.
- AP-19: service/database permissions not declared.
- AP-1: `mod.ts` or `contracts.ts` accumulating every plugin concern.

## False-Done States

- Plugin compiles but `verify-plugin.ts` is missing or stale.
- Runtime declarations changed without host/loader validation.
- Database schema contribution exists but is not referenced from the expected plugin folder.
- The plugin redefines a worker/saga/trigger contract already owned elsewhere.

## Rescope Triggers

- A plugin change requires sibling package contract redesign.
- Host loader semantics need to change.
- Runtime validation requires Aspire resources not available in session.
- The plugin folder shape is wrong enough to require restructuring first.

## Design Checkpoint Expectations

The design checkpoint names every contribution axis: contracts, service entrypoints, database,
jobs/sagas/triggers/streams, verification, host discovery, and consumer impact.

The design section in `worklog.md` must include:

- contribution axes with named files per axis,
- sibling package contracts consumed or re-exported,
- constants for plugin config, event kinds, or schema identifiers,
- commit slices: contracts first, then service/runtime contributions, then verification, then host
  integration,
- contributor path for adding a new contribution axis.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- `verify-plugin.ts` exists and passes,
- runtime declarations are validated against host loader expectations,
- database schema contributions reference the expected plugin folder,
- sibling contracts are re-exported, not redefined.

## Historical Notes

Plugins are integration points. A green plugin-only check is not enough when the host loader or
sibling package contract changes.
