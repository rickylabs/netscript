# Drift Log — feat-package-quality-wave4-runtimes--4b-workers

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a pull-forward)

| Item | Status | Action for 4b |
|------|--------|---------------|
| `plugin-workers-core` doc-lint = 460 (180 ptr + 280 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-workers` doc-lint = 143 (83 ptr + 60 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| `plugin-workers` tests = 0 | A5 ⇒ F-10 required | Build real test layer. |
| 17-export core surface | F-5/F-16 challenge | Consumer scan; trim or justify each. `./contracts`==`./contracts/v1` duplicate alias → candidate fold. |
| F-1 over-cap: workers.contract 501, worker/scheduler 469 | measured | Concept-split (per-layer for `.contract.ts` if warranted). |
| `plugin-workers` missing `publish:dry-run` task | F-6 | Add. `check` should enumerate all entrypoints. |
| `*-workers-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 + Runtime/Aspire required. |
| `workers-core ./streams` re-exports plugin-streams-core | couples to 4a | Re-measure after 4a pull-forward. |
| Possible `4b-core`/`4b-plugin` split | sizing | Decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
