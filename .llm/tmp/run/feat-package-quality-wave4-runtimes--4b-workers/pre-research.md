# Supervisor Pre-Research — Wave 4 · 4b: workers

Author: SUPERVISOR (architectural + read-only measurement pass), 2026-06-08.
Measured at umbrella `ee9f26b` (carries merged Wave 3). **Not** a PLAN-EVAL artifact and
**not** a substitute for the generator's MEASURE-FIRST (re-run after the 4a pull-forward).

## Measured baseline (read-only sweep, `ee9f26b`)

| Unit | exports | full-export doc-lint | breakdown | dry-run | src LOC | files | tests | README | docs/ | tasks |
|------|--------:|---------------------:|-----------|:-------:|--------:|------:|------:|-------:|:-----:|-------|
| `plugin-workers-core` | 17 | **460** | 180 private-type-ref + 280 missing-jsdoc | PASS (0 slow) | 7,060 | 87 | 5 | 315 | ✓ | check, test, publish:dry-run |
| `plugin-workers` | 9 | **143** | 83 private-type-ref + 60 missing-jsdoc | PASS (0 slow) | 2,426 | 20 | **0** | 260 | ✓ | check, test, dev, start, test:api (**no publish:dry-run**) |

Doc-lint command (all entrypoints), run from each package dir:
- core: `deno doc --lint ./mod.ts ./src/builders/mod.ts ./src/contracts/v1/mod.ts ./src/registry/mod.ts ./src/state/mod.ts ./src/executor/mod.ts ./src/workflow/mod.ts ./src/streams/mod.ts ./src/presets/mod.ts ./src/shutdown/mod.ts ./src/domain/public-schema.ts ./src/telemetry/mod.ts ./src/abstracts/mod.ts ./src/testing/mod.ts ./src/config/mod.ts ./src/runtime/mod.ts`
- plugin: `deno doc --lint ./mod.ts ./src/aspire/mod.ts ./src/cli/composition/main.ts ./contracts/v1/mod.ts ./src/scaffolding/mod.ts ./services/src/main.ts ./streams/mod.ts ./streams/server.ts ./worker/mod.ts`

## Interpretation

- **460 = the largest single-unit doc-debt in Wave 4.** Dominated by missing-jsdoc (280) across the
  17 entrypoints, plus 180 private-type-ref. This is exactly the "root undercounts massively"
  thesis (umbrella `research.md` §3): the headline is the full-export number, not the root mod.ts.
- **Both PASS dry-run, 0 slow types** → no slow-type rebuild. The work is doc-surface + tests +
  structure, with a real **F-5/F-16 surface challenge** on the 17-export core.
- **Sizing:** 603 family doc-lint + 17/9 entrypoints + the 0-test plugin + 2 over-cap files makes a
  single `<30`-slice plan unlikely. Recommend the Plan & Design phase **plan for a `4b-core` /
  `4b-plugin` split** and confirm at the Plan Gate. A jsdoc pass can clear many errors per
  entrypoint in one slice, so 460 ≠ 460 slices — but the entrypoint count + tests + over-cap splits
  still pressure the cap.

## Exports map (the F-5/F-16 challenge target)

`plugin-workers-core` (17): `. ./builders ./contracts ./contracts/v1 ./registry ./state ./executor
./workflow ./streams ./presets ./shutdown ./schemas ./telemetry ./abstracts ./testing ./config
./runtime`. Note `./contracts` and `./contracts/v1` both point at `src/contracts/v1/mod.ts`
(duplicate alias — candidate to fold). `./streams` re-exports `@netscript/plugin-streams-core`
(settles at the 4a merge — re-measure after pull-forward).

`plugin-workers` (9): `. ./aspire ./cli ./contracts ./scaffolding ./services ./streams
./streams/server ./worker`.

## Carried caveats

- `netscript-start#96` left `check:workers` failing on worker-job typing drift + generated-DB
  artifacts — triage package-debt vs environment before scoping (umbrella `research.md` §0/§5).
- `unanalyzable-dynamic-import`: core ×1, plugin ×2 (non-blocking; accept-and-document vs resolve).
- Private-type-ref fix strategy = Wave 3 LD-8 + 4a PLAN-EVAL precedent (split by type origin; see
  `context-pack.md`).

## NOT done here (generator owns)

Per-entrypoint doc-lint attribution (which of the 17 carry the 460), the consumer scan for the F-5
trim decisions, the test-layer design, and the over-cap concept-splits. Re-run the full sweep after
the 4a merge is pulled forward (the `./streams` surface changes).
