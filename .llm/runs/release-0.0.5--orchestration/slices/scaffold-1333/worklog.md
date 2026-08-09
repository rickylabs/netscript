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

## S6 — size, publish, and closure evidence before runtime

### Byte ceilings

| Surface | Observed | Ceiling | Result |
| --- | ---: | ---: | --- |
| App template sources | 176,362 bytes | 197,796 | within by 21,434 |
| CLI embedded asset barrel | 294,190 bytes | 330,000 | within by 35,810 |
| MCP embedded docs corpus (unchanged) | 253,535 bytes / 12 docs | 262,144 | within by 8,609 |

No document or useful example was dropped.

### Integration finding

The first full CLI sweep exited 1 at 679 passed / 1 failed because the JSON-init presentation test
still expected `apps/dashboard`; product output correctly followed S1 with
`apps/json-smoke-web`. The exact assertion was updated, the focused test passed, and the full sweep
then passed 680/680. This is recorded in drift rather than concealed as a clean first run.

### Non-Aspire gates

| Gate | Result |
| --- | --- |
| Full CLI source + E2E tests | raw exit 0; 680 passed / 494 steps / 0 failed |
| Scoped CLI+E2E check (`--no-lock`) | raw exit 0; 823 files / 7 batches / 0 findings |
| Scoped CLI+E2E lint | raw exit 0; 823 files / 5 batches / 0 findings |
| Scoped CLI+E2E format | raw exit 0; 823 files / 5 batches / 0 findings |
| Decisive CLI source quality | raw exit 0; 0 findings / 6 existing allowances |
| Package doctrine | raw exit 1; existing 50 FAIL / 51 WARN / 1 INFO; runtime gate size debt recorded |
| Aggregate `quality:gate` (non-decisive) | raw exit 0 |
| Publish assets | raw exit 0 |
| Asset barrel / clean generated diff | raw exit 0 |
| NetScript JSR specifiers | raw exit 0; scanned 2,329 / allowances 1 / failures 0 |
| CLI doc lint | raw exit 0; 3 entrypoints / 0 diagnostics |
| CLI JSR dry-run | raw exit 0; existing dynamic-import warnings only |
| Root publish dry-run | raw exit 0; manifest and lock diff empty afterward |

Closure remains pending the token-granted runtime browser proof. Until that passes, the PR must
reference #1333 rather than close it.

Review threads: raw exit 0; 0 threads / 0 unanswered.

## EXPENSIVE-GATE-REQUEST

All non-Aspire gates are complete. Request the single serialized grant for exactly:

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`

The run will be bracketed by leak checks and will not begin until the orchestrator commits a durable
grant row.

## Serialized runtime receipt — ledger row 70

The orchestrator committed and pushed ledger row 70 at `78000169a` before the grant reached this
thread. Exactly one execution was made at feature head `2150421e4`; the red run was not retried.

| Receipt | Result |
| --- | --- |
| Pre-run leak check | raw exit 0; no run-owned resources; stale foreign `redis-jfgcbtaf` owned by `/home/codex/repos/w6-review-desk` reported and left untouched |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | raw `$?` exit 1; 16 passed / 1 failed / 2 skipped / 19 total steps |
| Post-run leak check | raw exit 0; no run-owned survivors; the same foreign Redis container remained untouched |
| Manifest and lock hygiene | `git diff --name-only -- '**/deno.json' deno.json deno.lock '**/deno.lock'` returned empty |

The two skips were expected `DEFERRED` work from #1398:

- `behavior.otel.stream-consumer`: `workers-combined` does not install the stream mutation hook.
- `behavior.otel.traces`: TC-14 requires the deferred Flow-B stream-consumer record.

`behavior.project-boundary-dev` failed before the browser reference gate. The probe defaults its
optional app argument to `dashboard`, while the gate registry passes only the project root; S1 now
correctly derives the generated app as `prod-local-test-web`, so canonicalizing the nonexistent
`apps/dashboard` cwd failed. Cleanup still passed. Because the harness is fail-fast,
`behavior.app-reference` (`BEHAVIOR_APP_REFERENCE`) did not execute and has no verdict; Windows
Chrome/WSL interop was not reached.

This is a runtime integration finding, not authority to consume a second token. Row 9 remains
unevidenced, and the PR continues to use `Refs #1333` rather than a closing keyword.

## Gate-70 repair — generated app identity reaches every scaffold probe

### Implementation and sweep

- `probe-project-boundary-dev.ts` now requires both project root and app name; the caller supplies
  `generatedAppName(context)` and there is no fallback identity.
- `verify-mcp-endpoint-directory.ts` now requires the generated app name in addition to project root
  and AppHost path; its runtime caller supplies the same derived value.
- The requested sweep found a third stale consumer: `verify-clean-clone-readme.ts` scaffolded the
  omitted-name project `generated-readme-fixture` but checked `apps/dashboard/.generated/*`. It now
  derives the app name through the same S1 domain rule.
- A source-policy test scans every TypeScript scaffold gate and rejects `apps/dashboard` or a bare
  `appName = 'dashboard'` default. It deliberately does not ban Aspire-dashboard telemetry names or
  prose; `aspire-dashboard-telemetry.ts` is explicitly excluded because that dashboard is a
  different resource.

### Falsifiability

| Mutation | Result |
| --- | --- |
| Reintroduce `apps/dashboard/.generated/manifest.ts` in the clean-clone probe | raw exit 1; source-policy test named `verify-clean-clone-readme.ts:61` and the forbidden generated-app path |
| Restore the project-derived path | raw exit 0; 1 passed / 0 failed |

The earlier S4 falsifiability table remains present: the obsolete `/design/components` promotion
literal fails the route golden at raw exit 1, and the restored typed route passes at raw exit 0.
The S4 doctrine sentence now correctly says the slice introduces no new finding in S4.

### Gates

| Gate | Result |
| --- | --- |
| Focused callers, identity policy, and clean-clone error contract | raw exit 0; 20 passed / 0 failed |
| Scaffold-gate identity sweep | `rg` raw exit 1 (zero forbidden matches) |
| Scoped E2E check (`--no-lock`) | raw exit 0; 149 files / 2 batches / 0 findings |
| Scoped E2E lint | raw exit 0; 149 files / 1 batch / 0 findings |
| Scoped E2E format | raw exit 0; 149 files / 1 batch / 0 findings |
| Canonical asset barrel | raw exit 0; generated assets unchanged |

No AppHost, container, or `e2e:cli` command ran. Gate 70 remains the sole runtime verdict;
`behavior.app-reference` still has no verdict because fail-fast never reached it.

Reconcile: the owner-accepted gate-70 finding and its hidden consumers are now represented in code
and the run record. PR #1427 remains draft at `status:impl` with `Refs #1333`; a fresh serialized
grant and real runtime verdict remain owner-controlled.

## S5 — generated quality and browser/runtime acceptance

### Implementation

- The canonical route accepts deterministic `preview` states for loading, error, empty, success,
  optimistic, rollback, and confirmed UI, while normal requests continue to use live query state.
- A new runtime gate renders the home, design composition, and every resource state through a real
  headless Chrome/Chromium process at 1440×900 and 390×844, asserting semantic DOM markers.
- Runtime wait/home/UI/browser gates derive the generated Aspire app name through the same S1
  `deriveDefaultAppName` rule instead of the obsolete hard-coded `dashboard` identity.
- The generated quality runner now opts into `no-explicit-any`; its negative matrix probes the rule
  and verifies both check and lint cleanup.
- Enabling that rule exposed clean-scaffold lint debt in the memory templates; the unused transition
  table, unnecessary `async` callbacks, and mutable array binding were corrected without allowances.

### Falsifiability and generated consumers

| Proof | Result |
| --- | --- |
| Old browser DOM without rollback marker | raw exit 1; missing `data-state="rollback"` |
| Deliberate generated `any` source | raw exit 1; selected file, `no-explicit-any` |
| Clean recovery after removing `any` | raw exit 0; 108 selected files |
| Fresh memory generated check | raw exit 0; 108 selected files |
| Fresh memory generated lint | raw exit 0; 108 selected files |
| Fresh Postgres product check after local Prisma/Zod generation | raw exit 0; 112 selected files |
| Fresh Postgres product lint including `no-explicit-any` | raw exit 0; 112 selected files |

The first full generated quality-matrix development attempt correctly failed its final AppHost
check because a fresh, un-restored scaffold has no `aspire/node_modules/typescript`. The actual
runtime suite orders `runtime.aspire-restore` before this gate; no AppHost/container was started and
the complete verdict is reserved for the serialized one-pass run.

### Gates before commit

| Gate | Result |
| --- | --- |
| Focused template/generated-quality/runtime/browser suite | raw exit 0; 56 tests / 25 steps / 0 failed |
| Scoped CLI+E2E check (`--no-lock`) | raw exit 0; 823 files / 7 batches / 0 findings |
| Scoped CLI+E2E lint | raw exit 0; 823 files / 5 batches / 0 findings |
| Scoped CLI+E2E format | raw exit 0; 823 files / 5 batches / 0 findings |
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

### Falsifiability

| Mutation | Result |
| --- | --- |
| Replace `appRoutes.designComposition.href()` with the obsolete `/design/components` promotion literal, then regenerate the canonical barrel | raw exit 1; the index-route golden rejected the old literal |

The clean source was restored, the canonical barrel regenerated, and the same focused golden then
passed at raw exit 0 with 1 test / 25 steps / 0 failed.

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
the exact pre-existing baseline and introduces no new finding in S4.

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
