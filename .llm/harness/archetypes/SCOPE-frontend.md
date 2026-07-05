# Scope Overlay — Frontend

Use this overlay for Fresh routes, UI components, islands, dashboard pages, browser workflows, and
frontend package work.

## Doctrine Boundary

Application code is a consumer of the package/plugin doctrine unless it modifies `packages/` or
`plugins/`. When frontend work touches `@netscript/fresh`, `@netscript/fresh/ai` (the plugin-AI
stack's frontend surface), `@netscript/fresh-ui`, plugin UI contracts, or public builders, apply the
matching archetype profile first.

## Additional Read First

- `.claude/05-frontend.md`
- relevant Fresh/Fresh 2 docs in `.resources/deps-docs/`
- route files, islands, components, loaders, and API contracts touched by the work
- existing UI tests and screenshots when available

## Additional Gates

| Gate                       | Requirement                                             |
| -------------------------- | ------------------------------------------------------- |
| Route check                | Real route renders with representative data             |
| Browser validation         | Use Playwright or browser tooling for changed workflows |
| Loading/empty/error states | Verify each affected state, not only happy path         |
| Responsive check           | Validate mobile and desktop for changed views           |
| Contract check             | Affected API contracts and clients typecheck            |

## False-Done States

- Main route works but subpages or nested states remain broken.
- Static check passes but browser render blocks, flashes, or shows stale data.
- Visual change is verified only by reading code.
- Package builder changes are not checked against frontend consumers.

## Rescope Triggers

- UI task requires contract or service redesign.
- Fresh route behavior depends on package API changes not in the plan.
- Browser validation exposes broader navigation or data-loading failures.
