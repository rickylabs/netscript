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
- A tag `v0.0.2` clean-room reproduction also tracked both route artifacts and passed literal
  `deno task check`; the reported historical RED could not be reproduced honestly.

## Implementation evidence

### #1016 — `96d300650`

- `scaffold.infrastructure` writes the hostile parent config, generates the database client,
  type-checks the generated workspace, and receives HTTP 200 from the Fresh development server.
- Full suite: `Summary: passed=9 failed=0`.
- Counterfactual: removing the generated root and app tsconfigs made database generation fail with
  `File 'astro/tsconfigs/strict' not found` and made the development probe fail with HTTP 500.
- Pushed and recorded on PR #1081 before beginning #1021.

### #1021 — `2e6ce30c0`

- The CI gate creates a generated project, commits it, clones it to a fresh OS temporary directory,
  verifies the route artifacts, and runs README literal `deno task check`.
- Observed: `clean clone ran README command verbatim: deno task check`.
- Missing-binary regression: `1 passed, 0 failed`; `Deno.Command` `NotFound` becomes an explicit gate
  diagnostic.
- Pushed and recorded on PR #1081 before beginning #1039.

### #1039 — `a3ad1296d`

- All seven AI starters are explicitly omitted, alternated, or documented structural.
- Black-box real install: `1 passed, 0 failed`; emitted sample paths are absent and the structural
  generated workspace passes `deno check --unstable-kv`.
- Parent-commit counterfactual: `0 passed, 1 failed` because `ai/tools/echo.ts` was emitted.
- Pushed and recorded on PR #1081.

## Merge readiness

- Root `deno task check`: passed (cached verdict after unchanged inputs).
- Scoped CLI E2E lint/fmt and AI check/lint/fmt wrappers: zero findings.
- `scaffold.infrastructure --cleanup --format pretty`: 9 passed, 0 failed.
- Root test initially found a run-owned, root-readable Postgres fixture cleanup artifact after 2,516
  tests passed. The exact fixture/container was removed; the failing teardown scanner then passed.
- `agentic:leak-check`: Aspire ok, Docker ok, no survivors.
- `deno task quality:gate`: passed; existing doctrine/catalog warnings remained non-failing.
- GitHub's first deno-only run exposed an invalid CI placement: `scaffold.infrastructure` reached
  `database.init` without Aspire and failed. The hostile-parent gates were moved into the existing
  Aspire-backed `scaffold.runtime` sequence; the clean-clone README gate remains deno-only.
- Root `deno task test` final rerun: `2517 passed (564 steps)`, `0 failed`, `16 ignored`.
- Final `agentic:leak-check`: Aspire ok, Docker ok, `survivors: []`.
