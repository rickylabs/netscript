# Drift Log — feat-package-quality-wave4-runtimes--4d-triggers

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a+4b+4c pull-forward)

| Item | Status | Action for 4d |
|------|--------|---------------|
| `plugin-triggers-core` doc-lint = 211 (46 ptr + 165 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-triggers` doc-lint = 138 (76 ptr + 62 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| **Both units missing `docs/` dir** | F-7 | Author architecture + usage docs for each (distinguishing 4d workload). |
| `plugin-triggers` tests = 0 | A5 ⇒ F-10 required | Build real test layer. `test-webhooks-e2e` (424) exists but unwired — verify. |
| OQ-D: `triggers-health` in-scope | resolved (Wave 3 closeout) | Validate health registration via live probe `localhost:8093/health` (confirm port). A5 runtime evidence. |
| 11/10 export surfaces | F-5/F-16 challenge | Consumer scan; trim or justify each. |
| F-1 over-cap: test-webhooks-e2e 424 | measured | Concept-split or move under tests/ layout. |
| `*-triggers-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 (trigger/schedule/dedup invariants) + Runtime/Aspire required. |
| F-6 task hygiene | confirm | `test` + `publish:dry-run` on both; `check` enumerates all entrypoints. |
| Combined-vs-split | sizing | Likely combined (lightest family); decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
