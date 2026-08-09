# Research: #1359

- Live issue acceptance was read from `gh issue view 1359`; it requires the corrected mapping,
  both link sites, removal of the stale assertion, and a duplicate-target negative check.
- `router.ts.template` maps both `serviceExample` and `crudExample` to
  `routes.examples.serviceExample`.
- `generateRouteManifestSeed()` already declares `routePatterns.examples.crud.$route` as
  `/examples/crud`; `generateRoutesSeed()` exposes it as `routes.examples.crud.$route`.
- Both `routes/index.tsx.template` and `routes/examples/index.tsx.template` call
  `appRoutes.crudExample.href()`.
- `route-templates_test.ts` currently asserts the defect verbatim.
- `embedded.generated.ts` is a generated mirror; `deno task gen:assets-barrel` is its canonical
  producer.
- Boundary: #1333 owns CRUD product/IA questions; #1354/#1357 own other route/page behavior.

