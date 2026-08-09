# Worklog: #1333

## Design

- **Public surface:** generated Fresh application structure and behavior; no framework export-map or
  public builder change planned.
- **Archetype/profile:** CLI/tooling Archetype 6 plus `SCOPE-frontend`.
- **Contract path:** generated database schema → versioned service contract → typed service client /
  query factory → route contract/resources/layers → QueryIsland/forms/views.
- **Ownership:** the canonical resource directory owns `(_lib)`, `(_shared)`, `(_components)`, and
  `(_islands)`; the CLI writer/manifest owns deterministic emission.
- **Runtime:** one token-granted full `scaffold.runtime` pass only after all non-Aspire gates.
- **Closure:** row 10 is observational and owned in substance by #1090; owner decision required
  before any closing keyword.

## Progress

- Clean branch created at `origin/main@35358886a`; upstream unset.
- Requested skills and harness/plan/frontend instructions read.
- Live #1333 acceptance body and owner follow-up read; #1090 measurement contract cross-checked.
- Current templates, writer, asset manifest, app-name resolution, DB contract seam, route seeds,
  focused tests, and runtime home gate opened before planning.
- Baseline measured: 50 app assets / 165,796 bytes; generated CLI barrel 283,217 raw / 62,035 gzip.
- `PLAN-EVAL: REQUIRED — pending owner-launched separate session.` No product source edited.

## Next handoff

Owner approved option A on 2026-08-09 and moved row 10 to #1090. Implementation of rows 1-9 is
authorized in S1-S6 order. S1 begins with omitted/explicit app-name negative controls.

## S1 — project-derived default app name

### Pre-fix RED

Command:

`deno test --no-lock --allow-all packages/cli/src/public/features/init/init-command_test.ts`

Raw exit **1**: 9 passed / 2 failed. The omitted-name assertion expected
`inventory-console-web` and received `dashboard`; the interactive prompt expected
`interactive-app-web` and advertised `dashboard`. The explicit `backoffice` authority control
passed in the same run.

### Implementation

- Added the pure `deriveDefaultAppName` domain rule and used it from shared option validation and
  the public interactive prompt.
- Omitted `inventory-console` becomes `inventory-console-web`; `storefront-web` and `web` do not
  duplicate the suffix; explicit `backoffice` remains authoritative.
- The derivation trims only the project prefix when necessary so a valid 64-character project name
  still emits a valid 64-character app name ending in `-web`.

### Gates

| Gate | Result |
| --- | --- |
| Focused domain + public + maintainer init tests | raw exit 0; 14 passed / 0 failed |
| Scoped check (`--unstable-kv --no-lock`) | raw exit 0; 5 files / 1 batch / 0 findings |
| Scoped lint | raw exit 0; 5 files / 1 batch / 0 findings |
| Scoped format | raw exit 0; 5 files / 1 batch / 0 findings |
| Package code-quality scan | raw exit 0; 0 findings / 6 existing allowances |

## S4 — discovery and retained living examples

### Implementation

- Home cards, home actions, and root navigation now derive the living `/design` and
  `/design/composition` destinations from `appRoutes`; the obsolete literal
  `/design/components` promotion path is gone.
- The examples registry promotes the canonical service resource flow through
  `appRoutes.serviceExample` while retaining the separate CRUD and telemetry examples.
- Generated app guidance now names the route contract, managed form, auth boundary, resource-local
  query module, and `withResource` composition instead of directing agents to a global `lib` file.
- The public-init golden asserts the canonical route plus both retained example route files exist.

### Gates

| Gate | Result |
| --- | --- |
| Focused route-template + public-init tests | raw exit 0; 4 tests / 25 steps / 0 failed |
| Scoped package check (`--no-lock`) | raw exit 0; 675 files / 6 batches / 0 findings |
| Scoped package lint | raw exit 0; 675 files / 4 batches / 0 findings |
| Scoped package format | raw exit 0; 675 files / 4 batches / 0 findings |
| Package code-quality scan | raw exit 0; 0 findings / 6 existing allowances |
| Package doctrine scan | raw exit 1; FAIL=50 WARN=51 INFO=1 |
| Exact `origin/main` doctrine baseline | raw exit 1; FAIL=50 WARN=51 INFO=1, byte-identical finding set |

The first scoped-check attempt used unsupported `--deno-arg=--no-lock` syntax and exited 1 before
running a check. The required corrected form, `--deno-arg --no-lock`, then executed and exited 0;
the failed invocation is not reported as a product verdict. Package doctrine remains red solely on
the exact pre-existing baseline and introduces no new finding in S1.

## S2 — resource-local contract and query topology

### Pre-fix RED

The focused public-init golden was extended first to require absence of
`apps/dashboard/lib/example-service.ts` and presence of resource-local `(_components)`,
`(_islands)`, `(_shared)`, and `(_lib)`. Against the old writer it exited **1** (0 passed / 1
failed), naming the still-present global `lib/example-service.ts` path. This is the required
rejection of the old topology, not merely acceptance of new folders.

### Implementation

- The init service example now writes `(_lib)/service-query.ts` and
  `(_lib)/route-contract.ts` beside its resource route and creates all four owned directories.
- Route, island, and shared-loader imports are relative to the resource-local query module.
- The route-contract seam owns typed path and search schemas for S3 composition.
- The same query template remains the source for `service add --with-client`, whose accepted #1373
  output stays `apps/<app>/lib/<service>.ts`; only init's obsolete global
  `lib/example-service.ts` shape is rejected.
- The canonical embedded template barrel was regenerated.

### Gates before commit

| Gate | Result |
| --- | --- |
| Focused templates/writer/public-init/client-scaffolder tests | raw exit 0; 9 tests / 22 steps / 0 failed |
| Scoped check (`--unstable-kv --no-lock`) | raw exit 0; 9 files / 1 batch / 0 findings |
| Scoped lint | raw exit 0; 9 files / 1 batch / 0 findings |
| Scoped format | raw exit 0; 9 files / 1 batch / 0 findings |
| Package code-quality scan | raw exit 0; 0 findings / 6 existing allowances |
| `check:assets-barrel` before commit | raw exit 1 because its final `git diff --exit-code` correctly saw the intended regenerated barrel; generator itself exited 0 |

`check:assets-barrel` must be rerun from the committed S2 head; that raw committed-head receipt is
posted on the PR and carried into the next worklog update.

Committed-head `deno task check:assets-barrel` exited **0** for S2.

## S3 — executable resource flow and state machine

### Implementation

- The service route now composes `withRouteContract`, typed path/search schemas, an auth-ready
  `viewer` resource, a search-aware prefetched `showcase` resource, layered server/island content,
  managed form state, telemetry, and partial navigation from one page builder.
- Both DB and memory variants render loading/error/empty/success query states. The DB rename path
  snapshots and optimistically updates the query cache, restores that exact snapshot on error, and
  invalidates through the contract-derived list key; the existing memory rollback is preserved.
- The managed form uses schema validation, CSRF state, invalid/success notices, a server mutation,
  and a provider-neutral authorization boundary. Generated apps now own their direct `zod`
  dependency through the root catalog.

### Falsifiability

| Mutation | Result |
| --- | --- |
| DB rollback restores `props.initialList` instead of saved `context.previous` | raw exit 1; DB rollback test failed |
| Managed form removes the `hasErrors` state branch | raw exit 1; invalid and success state tests failed |
| Managed form disables only the submitted-success state | raw exit 1; invalid-state test passed and success-state test failed |

Each mutation regenerated the embedded barrel before the focused test. The clean implementation
was restored and regenerated after the probes.

### Generated-consumer checks

The first memory-project check exited **1** with two actionable diagnostics: `zod` was not owned by
the generated app import map, and raw field-descriptor props were wider than the app-owned `Input`
contract. Adding catalog-owned `zod` and routing descriptor props through the existing
`getInputProps` adapter resolved both without casts or allowances.

| Generated variant | Result |
| --- | --- |
| Memory service workspace | raw exit 0; 108 selected files |
| Postgres service workspace after local schema generation | raw exit 0; 117 selected files |

Both were fresh no-Aspire scaffolds. Postgres schema generation used a non-contacting placeholder
`DATABASE_URL`; it started no AppHost or container.

### Gates

| Gate | Result |
| --- | --- |
| Focused config/template/public-init tests | raw exit 0; 6 tests / 40 steps / 0 failed |
| Scoped package check (`--no-lock`) | raw exit 0; 675 files / 6 batches / 0 findings |
| Scoped package lint | raw exit 0; 675 files / 4 batches / 0 findings |
| Scoped package format | raw exit 0; 675 files / 4 batches / 0 findings |
| Package code-quality scan | raw exit 0; 0 findings / 6 existing allowances |
