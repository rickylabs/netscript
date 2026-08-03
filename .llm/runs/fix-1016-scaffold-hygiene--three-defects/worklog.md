# Worklog

## Design

### Public surface

No command names, exported APIs, or package entrypoints change. Observable contracts are generated project boundaries, generated README correctness, and starter-resource sample classification.

### Domain vocabulary

- Hostile parent config: `{ "extends": "astro/tsconfigs/strict" }` directly above a scaffolded project.
- Project boundary: root `tsconfig.json` and `apps/<app>/tsconfig.json` terminating upward lookup.
- Sample policy: `omit` or `alternate` from `InstallStarterSamplesPolicy`.
- Structural starter: required for a type-correct installed plugin even with samples disabled.

### Ports and existing seams

Reuse the CLI E2E command/process/file-system gates and plugin adapter `InstallStarterResource` contract. Introduce no new port or framework abstraction.

### Constants and extension axes

No new global constants. Existing CLI suite/gate IDs and plugin starter-resource registry remain authoritative. AI starter resources are the extension axis being explicitly classified.

### Archetype-6 checkpoint applicability

This slice introduces no spine/layer-2 abstract, command, registry, composition root, or new feature folder. Existing five-spine and vertical-feature catalogs are unchanged; the contributor path is the existing scaffold gate/fixture plus adjacent generator tests. No permission change.

### Archetype-5 checkpoint applicability

The AI adapter continues to compose `@netscript/plugin/adapter` contracts; it defines no core convention. Starter metadata and alternate scaffolding remain thin adapter wiring. No sibling contract is redefined.

### Commit slices

See `plan.md`: #1016, #1021, #1039, then merge-readiness evidence. Each issue slice pushes and comments before the next begins.

### Deferred scope

#1017 transport/plumbing, adjacent scaffolds, route-generation redesign, broad CI additions.

### Contributor path

Add scaffold boundary cases beside existing CLI E2E fixture gates; add starter policies directly beside each resource in the plugin adapter and prove behavior through the black-box install suite.

## Research evidence

- Current-main scaffold emitted both boundary configs.
- Current-main generated clean clone tracks both route artifacts and passes literal `deno task check`.
- No implementation has started; PLAN-EVAL pending.
