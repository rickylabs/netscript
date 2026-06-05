# Archetype 2 — Integration

## Doctrine Reference

- Axioms: A1, A2, A4, A5, A6, A7, A8, A9, A10, A11, A14.
- Primary sections:
  - `docs/architecture/doctrine/04-modules-and-helpers.md`
  - `docs/architecture/doctrine/05-folder-structure.md`
  - `docs/architecture/doctrine/06-archetypes.md#archetype-2--integration`
  - `docs/architecture/doctrine/07-composition-and-extension.md`
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-2, AP-3, AP-4, AP-5, AP-7, AP-8, AP-9, AP-11, AP-13, AP-14, AP-16, AP-17,
  AP-19, AP-20.
- Fitness functions: F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-14, F-15.

## When This Archetype Applies

Use this profile for packages that integrate with an external system: database, queue, KV, cron,
Aspire, telemetry, logging, or another system boundary. The package owns a small port only when the
package has a real external dependency axis or more than one credible adapter.

## Minimum Folder Shape

Use the canonical shape in `docs/architecture/doctrine/06-archetypes.md#archetype-2--integration`. The important
boundary is package-owned ports plus named adapters. A one-adapter package does not invent a port
unless the doctrine criteria are met.

## Skills to Activate

- `netscript-doctrine`
- `jsr-audit` when package publishability is in scope
- domain skill for the external system when available

## Read First

1. `docs/architecture/doctrine/06-archetypes.md#archetype-2--integration`.
2. `docs/architecture/doctrine/04-modules-and-helpers.md` adapter and port sections.
3. `docs/architecture/doctrine/07-composition-and-extension.md`.
4. The package README, exports, `deno.json`, and existing adapters.
5. Direct consumers that import the port or adapter.
6. Relevant debt entries.

## Required Gates in Order

1. Static gates: package/slice checks, `fmt --check`, lint, doc lint, publish dry-run when package
   scope.
2. Fitness gates: F-1 through F-12 as listed above, plus F-14 and F-15.
3. Runtime gates: optional, required when the adapter is exercised against a real backend or Aspire
   resource.
4. Consumer gates: required when ports, adapter names, exports, or defaults change.

## Anti-Patterns to Watch For

- AP-3: a port with every operation the backend can perform.
- AP-8: a DI container introduced for a small composition root.
- AP-9: shared helper flags replacing clear sibling adapters.
- AP-11: module-load-time clients, env reads, or implicit `Deno.openKv()`.
- AP-17: `interfaces/` folder instead of `ports/`.
- AP-19: README omits required permissions.

## False-Done States

- The adapter works in one test but the port belongs to the wrong package.
- A renamed `interfaces/` folder still contains unrelated contracts.
- Defaults are hidden inside constructors instead of the composition root.
- Consumer imports compile but runtime permission requirements are undocumented.

## Rescope Triggers

- More than one external technology must be supported.
- A direct class should become a port/adapters split.
- Consumer code relies on old adapter names or subpaths.
- Runtime validation requires services not available in the current run.

## Design Checkpoint Expectations

The design checkpoint names the external system, the port shape, the adapter set, the composition
root, required permissions, and consumer import impact.

The design section in `worklog.md` must include:

- port contract and named adapters,
- composition root location,
- constants for adapter variants or config enums,
- commit slices: port+contract first, then adapter(s), then consumer wiring,
- contributor path for adding a new adapter.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- the port belongs to the owning package, not scattered across consumers,
- defaults live in the composition root, not hidden in constructors,
- the README documents permissions and external system requirements,
- consumer imports compile and runtime permissions are declared.

## Historical Notes

Integration packages drift when helpers hide technology differences. Prefer two small adapters with
obvious names over one configurable helper with flags.
