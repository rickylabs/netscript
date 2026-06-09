# Supervisor Pre-Research — Wave 4 · 4c: sagas

Author: SUPERVISOR (architectural + read-only measurement pass), 2026-06-08.
Measured at umbrella `ee9f26b` (carries merged Wave 3). **Not** a PLAN-EVAL artifact and
**not** a substitute for the generator's MEASURE-FIRST (re-run after the 4a **and** 4b
pull-forwards — sagas depends on both).

## Measured baseline (read-only sweep, `ee9f26b`)

| Unit | exports | full-export doc-lint | breakdown | dry-run | src LOC | files | tests | README | docs/ | tasks |
|------|--------:|---------------------:|-----------|:-------:|--------:|------:|------:|-------:|:-----:|-------|
| `plugin-sagas-core` | 19 | **397** | 48 private-type-ref + 349 missing-jsdoc | PASS (0 slow) | 6,768 | 80 | 5 | 166 | ✓ | check, publish:dry-run (**no test task**) |
| `plugin-sagas` | 12 | **122** | 71 private-type-ref + 51 missing-jsdoc | PASS (0 slow) | 2,396 | 30 | **0** | 99 | ✓ | check, test, dev, start (**no publish:dry-run**) |

Family doc-lint = **519**.

Doc-lint command (all entrypoints), run from each package dir:
- core: `deno doc --lint ./mod.ts ./src/builders/mod.ts ./src/domain/mod.ts ./src/ports/mod.ts ./src/runtime/mod.ts ./src/adapters/mod.ts ./src/transports/mod.ts ./src/stores/mod.ts ./src/middleware/mod.ts ./src/integration/workers.ts ./src/integration/publisher.ts ./src/telemetry/mod.ts ./src/config/mod.ts ./src/contracts/v1/mod.ts ./src/streams/mod.ts ./src/presets/mod.ts ./src/abstracts/mod.ts ./src/testing/mod.ts ./src/agent/mod.ts`
- plugin: `deno doc --lint ./mod.ts ./src/public/mod.ts ./src/plugin/mod.ts ./src/cli/mod.ts ./src/scaffolding/mod.ts ./e2e/mod.ts ./src/aspire/mod.ts ./src/runtime/mod.ts ./contracts/v1/mod.ts ./services/mod.ts ./streams/mod.ts ./streams/server.ts`
  (confirm exact subpaths against `deno.json` at MEASURE-FIRST — names approximate.)

## Interpretation

- **Missing-jsdoc dominates core (349/397)** across 19 entrypoints — the classic "root undercounts"
  pattern. The private-type-ref share is comparatively low on core (48) but high on the plugin (71).
- **Both PASS dry-run, 0 slow types** → no slow-type rebuild. Work = doc-surface + the 0-test A5
  plugin + structure (the 716/481 over-cap splits) + the 19-export surface challenge.
- **Sizing — split near-certain.** 519 family doc-lint + 19/12 entrypoints + the **716-LOC
  `services/routers/v1.ts`** (largest file on the whole board) + `redis-transport` 481 + the 0-test
  plugin. Recommend the Plan & Design phase **plan for a `4c-core` / `4c-plugin` split** and confirm
  at the Plan Gate.
- **`sagas-core` is the canonical A3/F-13 unit.** Saga state machine + compensation + transport
  swappability are the runtime invariants. Live Runtime/Aspire validation REQUIRED.

## Exports map (the F-5/F-16 challenge target)

`plugin-sagas-core` (19): `. ./builders ./domain ./ports ./runtime ./adapters ./transports
./stores ./middleware ./integration/workers ./integration/publisher ./telemetry ./config
./contracts/v1 ./streams ./presets ./abstracts ./testing ./agent`. The **ports/adapters/transports/
stores/middleware** cluster is the F-3 layering audit (transports swappable behind a port?).
`./integration/workers` couples to 4b; `./streams` couples to 4a — re-measure after both pulls.

`plugin-sagas` (12): `. ./public ./plugin ./cli ./scaffolding ./e2e ./aspire ./runtime
./contracts ./services ./streams ./streams/server`.

## Carried caveats

- `netscript-start#96` left `check:services` failing on service-router typing drift +
  generated-DB artifacts — `services/routers/v1.ts` (716) is the A5 service layer; triage
  package-debt vs generated-artifact/environment before scoping (umbrella `research.md` §0/§5).
- `unanalyzable-dynamic-import`: plugin ×2 (non-blocking; accept-and-document vs resolve).
- Private-type-ref fix strategy = Wave 3 LD-8 + 4a PLAN-EVAL precedent (split by type origin; see
  `context-pack.md`).

## NOT done here (generator owns)

Per-entrypoint doc-lint attribution (which of the 19 carry the 397), the consumer scan for the F-5
trim decisions, the 0→real test-layer design, and the 716/481 concept-splits. Re-run the full sweep
after the 4a + 4b merges are pulled forward (the `./streams` and `./integration/workers` surfaces
change).
