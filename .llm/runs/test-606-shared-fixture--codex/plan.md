# Plan

## Profile and scope

Archetype 6 test infrastructure. No product source, templates, public exports, or published behavior changes.

## Locked decisions

- Add one shared local-source fixture module under the scaffold e2e gates.
- Model packages as named sets of explicit import-specifier/entrypoint pairs; do not infer subpaths from filesystem scans.
- Parameterize the source workspace root and target generated config/import-map paths.
- Preserve published-mode branches exactly; invoke the helper only for local-source preparation.

## Open decisions

- Safe to defer: broader generated-project fixture consolidation beyond #597/#598.
- Safe to defer: product-level local-source behavior; explicitly out of scope.
- No must-resolve decisions remain.

## Slices

1. Shared fixture + unit tests + both call-site refactors. Proved by helper unit tests, scoped check/lint, and the two affected narrow e2e gates. Files: shared helper/test, `ui-ai-gates.ts`, `prepare-flow-b-fixture.ts`, run artifacts.

## Risks

- Relative-path semantics differ between copied project workspaces and repository source roots. Mitigation: explicit source base plus fixture package set and unit assertions.
- Flow-B subpath coverage can regress. Mitigation: preserve each existing explicit mapping and assert representative/full maps in tests.
- Generated JSON can be clobbered. Mitigation: merge existing imports and write only named targets.

## Gates

- Scoped check and lint wrappers for `packages/cli`.
- Helper unit tests.
- Narrow e2e gates covering `scaffold.ui-local-source` and `runtime.flow-b-fixture` with their prerequisites as reported by the gate planner.

## Deferred scope

Full `scaffold.runtime`, scaffold templates, CLI product source, and PR work are orchestrator-owned/out of scope.

