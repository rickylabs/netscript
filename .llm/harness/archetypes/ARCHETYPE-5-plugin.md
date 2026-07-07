# Archetype 5 — Plugin Package

**Thinness law (framing for this whole profile).** Convention-bearing primitives — contracts, base
services, schema/runtime conventions, event/kind vocabularies — live in `@netscript/*` **core**. A
first-party `plugins/*` package is **thin userland glue**: it **wires and composes** core-owned
primitives into a concrete integration and **re-exports** sibling contracts; it does **not** redefine
contracts, re-implement a core convention, or own what core should own. The reference shape is
`auth-core` + its thin adapters: the core package carries the convention, the plugin/adapter is the
minimal wiring that binds it to a provider. Read every section below through that lens — a plugin
that "owns" a contribution axis is a smell, not the target.

## Doctrine Reference

- Axioms: A1, A2, A5, A7, A8, A9, A10, A11, A12, A13, A14.
- Primary sections:
  - `docs/architecture/doctrine/05-folder-structure.md`
  - `docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`
  - `docs/architecture/doctrine/07-composition-and-extension.md#plugin-discovery-and-loading`
  - `docs/architecture/doctrine/08-runtime-state-failure.md` when plugin contributes runtime work
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-3, AP-8, AP-9, AP-10, AP-11, AP-13, AP-14, AP-16, AP-19, AP-20, AP-22,
  AP-23, AP-24, AP-25.
- Fitness functions: F-1, F-3, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-13 when runtime
  declarations require it, F-14, F-15, F-16, F-17, F-18, F-19.

(These references point INTO doctrine; the authoritative prose lives there. This profile states the
thinness law and points at doctrine — it does not rewrite doctrine.)

## When This Archetype Applies

Use this profile for first-party `plugins/*` packages. The plugin **wires** a slice of NetScript
capability — services, database/schema, jobs, sagas, triggers, streams, verification — by
**composing core-owned contracts and conventions**, not by originating them. Its job is to bind
core primitives to a concrete integration and expose explicit service/background entrypoints; the
contracts and conventions it uses are imported from `@netscript/*` core and sibling packages.

## Minimum Folder Shape

Use the canonical shape in
`docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`. The package **reuses
sibling package contracts instead of redefining them** and exposes explicit service/background
entrypoints. The folder is composition wiring around imported primitives, not a second home for
contracts that belong in core.

Note: real first-party `plugins/*` place their contribution folders (`contracts/`, `services/`,
`database/`, `jobs/`, `streams/`) at the top level as siblings of `src/`, together with top-level
`mod.ts` and `verify-plugin.ts`. As of #306 (doctrine-revamp lane) this layout is **reconciled into
doctrine**: `06-archetypes.md#archetype-5--plugin-package` now states the same top-level-siblings
shape as authoritative, so doctrine and this profile agree. This profile follows doctrine; it does
not rewrite it.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when the plugin is published or exported
- `aspire` when runtime/service validation is required

## Read First

1. The **core-owned contracts and conventions** the plugin wires — the base contract/service in
   `@netscript/*` and any sibling package contracts it re-exports or consumes. Establish what core
   already owns before reading the plugin, so you can see whether the plugin thinly reuses it.
2. `docs/architecture/doctrine/06-archetypes.md#archetype-5--plugin-package`.
3. `docs/architecture/doctrine/07-composition-and-extension.md#plugin-discovery-and-loading`.
4. Plugin `contracts.ts`, `mod.ts`, `deno.json`, verification file, services, database files, and
   runtime declarations — reading them as wiring over the core primitives from step 1.
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

- **Fat plugin owning what core should own**: the plugin defines a contract, base service, schema
  convention, or event/kind vocabulary that is convention-bearing and therefore belongs in
  `@netscript/*` core. Push it down into core and have the plugin import it (thinness law; cf. the
  `auth-core` + adapters reference shape).
- **Plugin re-implements a core convention instead of importing it**: re-deriving a
  loading/registration/schema/runtime convention locally rather than reusing the core-owned one.
  Import the convention; do not fork it.
- AP-11: plugin load side effects or implicit discovery magic.
- AP-14: redefining sibling package contracts instead of re-exporting.
- AP-16: generic folders that hide plugin contributions.
- AP-19: service/database permissions not declared.
- AP-1: `mod.ts` or `contracts.ts` accumulating every plugin concern.
- AP-22: sub-directory `mod.ts` barrel re-exporting a contribution folder instead of the
  package-root surface.
- AP-23: plugin discovery/registration wiring that inlines service or handler bodies instead of
  referencing them.
- AP-24: switch-over-kind dispatch (engine/event/adapter) instead of a typed registry populated at
  composition.
- AP-25: `Deno.*` / `console.*` / `fetch` side effects in a non-edge plugin file instead of an
  injected port.

## False-Done States

- Plugin compiles but `verify-plugin.ts` is missing or stale.
- Runtime declarations changed without host/loader validation.
- Database schema contribution exists but is not referenced from the expected plugin folder.
- The plugin **redefines or re-implements** a contract/convention (worker/saga/trigger contract,
  loading/schema convention) already owned by core or a sibling — a fat-plugin false-done: it looks
  complete but has duplicated what it should have imported.

## Rescope Triggers

- A plugin change requires sibling package contract redesign.
- Host loader semantics need to change.
- Runtime validation requires Aspire resources not available in session.
- The plugin folder shape is wrong enough to require restructuring first.
- Convention-bearing logic discovered inside the plugin belongs in core — pushing it down is a
  core-package change, not a plugin edit.

## Design Checkpoint Expectations

The design checkpoint names, for each axis the plugin wires, **which core/sibling primitive it
composes and re-exports** (never redefines): contracts, service entrypoints, database,
jobs/sagas/triggers/streams, verification, host discovery, and consumer impact.

The design section in `worklog.md` must include:

- the axes the plugin wires, with the named core/sibling primitive each one composes and the plugin
  files that wire it,
- sibling package contracts consumed or **re-exported** (explicitly: none redefined),
- constants for plugin config, event kinds, or schema identifiers — sourced from core vocabularies
  where core owns them,
- commit slices: reuse-core-contracts first, then service/runtime wiring, then verification, then
  host integration,
- contributor path for adding a new wired axis (which core primitive to import, where to wire it).

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- `verify-plugin.ts` exists and passes,
- runtime declarations are validated against host loader expectations,
- database schema contributions reference the expected plugin folder,
- sibling and core contracts are **re-exported/imported, not redefined**, and no convention-bearing
  logic that belongs in core was re-implemented in the plugin.

## Historical Notes

Plugins are **thin integration points**, not capability owners. A green plugin-only check is not
enough when the host loader or a sibling/core contract changes — and it is actively misleading when
the plugin passed only because it re-implemented a convention core should own. The fat-plugin failure
mode (owning contracts/conventions that belong in `@netscript/*` core) is the highest-value thing to
catch in review; the `auth-core` + adapters split is the reference for how thin the plugin should be.
