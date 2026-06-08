# Drift Log — feat-package-quality-wave4-runtimes--4c-sagas

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a+4b pull-forward)

| Item | Status | Action for 4c |
|------|--------|---------------|
| `plugin-sagas-core` doc-lint = 397 (48 ptr + 349 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-sagas` doc-lint = 122 (71 ptr + 51 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| `plugin-sagas` tests = 0 | A5 ⇒ F-10 required | Build real test layer (manifest/CLI/Aspire/E2E/runtime). |
| 19-export core surface | F-5/F-16 challenge | Consumer scan; trim or justify each. |
| ports/adapters/transports/stores/middleware cluster | F-3 layering | Audit: transports swappable behind a port? |
| F-1 over-cap: services/routers/v1 **716** (biggest on board), redis-transport 481 | measured | Concept-split both; v1 router is also the #96 service-typing-drift area. |
| `sagas-core` missing `test` task; `plugin-sagas` missing `publish:dry-run` | F-6 | Add. `check` should enumerate all entrypoints. |
| `*-sagas-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 (saga invariants) + Runtime/Aspire required. |
| `sagas-core ./streams` re-exports plugin-streams-core | couples to 4a | Re-measure after 4a pull-forward. |
| `sagas-core ./integration/workers` couples to plugin-workers(-core) | couples to 4b | Re-measure after 4b pull-forward. |
| `plugin-sagas` README 99 LOC (<150) | F-7 | Lift. |
| Possible `4c-core`/`4c-plugin` split | sizing | Decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
