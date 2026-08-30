# Research — test-scaffold-dynamic-route-gate--1616

## Re-baseline

- Re-derived against `main` @ `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` on 2026-08-30.
- The exact named command, `grep -rnE "createRouteReference\('/[^']*\[" packages/cli/src`, exits 1 with no matches.
- More precisely, default `netscript init` contains no dynamic route. Parameterized `ui:add page`
  can interpolate a caller-supplied dynamic segment, but neither the default scaffold nor its gates
  requests one.

## Default scaffold emission

- `app-route-seeds.ts` seeds only `/`, `/docs`, `/examples`, `/about`, and `/api` references.
- `router.ts.template`, the embedded asset, and `writeNormalizedAppFiles` likewise emit only static
  initial generated files and route templates. No default route asset filename is dynamic.
- The Fresh manifest generator maps `[id]` to `$id`, emits `createRouteReference`, and rewrites Form
  B/C pages with `definePage().withRoute(...)`, but only after scanning a consumer route file.

## #1576 mechanism re-derived

- The route types infer `[id]` as `{ id: string }`, so compile-time inference was green.
- Before fix `1ed78f508545c4197eb0deffab1714153bdb3a33`, runtime resolution returned `{}` without an
  explicit path schema and handlers did not pass the bound route. Generated Form-C references have
  route parsing functions but no explicit schema, so runtime and inferred type diverged.
- The href builder throws when a required param is absent. Rendering the bound href during a partial
  request therefore produced 500 with `missing path param project`.
- Current code passes the route and falls back to `route.safeParsePath(...)`; both the historical
  parent and current fix were inspected directly.

## Existing coverage and suite topology

- The Fresh browser fixture is hand-authored: it proves runtime binding and href rendering, but not
  CLI scaffold provenance.
- `scaffold.runtime` generates, checks, starts, and probes an actual generated app. Behavior gates
  run after `runtime.wait.app`; the catalog is reused by the sqlite runtime suite.
- Both runtime suites are expensive. Live HTTP needs the coordinator lease.
- Lease-free RED is achievable through semantic scaffold tests, gate-registration tests, and a pure
  probe unit that rejects the historical 500 and requires path/href markers. The exact live 500
  cannot be observed on fixed `main` without a runtime lease and a deliberate fix reversion.

## Focused baseline

The structured wrapper ran the scaffold writer/template, runtime gate/registry, and define-page
builder tests: **89 passed, 0 failed**. No Aspire, Docker, browser, `e2e:cli`, or runtime suite ran.

## Doctrine and public surface

- Archetype 6 plus the frontend overlay applies. Preserve the CLI kernel/surface boundary and
  existing E2E vocabulary; the doctrine verdict remains `Keep`.
- Seeding `/examples/orders/[id]` changes every new consumer's scaffold tree, generated references,
  and example navigation. This is a deliberate public scaffold-output decision.
- Published TypeScript exports, export maps, and JSDoc do not move. The existing
  `cli/public-api-doc-completeness` debt is unaffected; JSR surface audit is N/A for this plan.

## Plan conclusions

- Honor #1616 Reading A: seed a useful product example, not an E2E-only fixture.
- Separately prove generated compile-time `ctx.path.id` inference, live runtime population, and
  `makeHref({ id })` round-trip output.
- Add a critical gate to the existing runtime sequence. Run semantic/registry/probe-unit/repository
  gates lease-free; reserve the one-pass runtime command for leased merge-readiness.
- No workflow edit is needed, avoiding the PAT workflow-scope boundary.
