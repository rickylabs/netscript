# Supervisor Pre-Research — Wave 4 · 4d: triggers

Author: SUPERVISOR (architectural + read-only measurement pass), 2026-06-08.
Measured at umbrella `ee9f26b` (carries merged Wave 3). **Not** a PLAN-EVAL artifact and
**not** a substitute for the generator's MEASURE-FIRST (re-run after the 4a + 4b + 4c
pull-forwards — 4d runs last).

## Measured baseline (read-only sweep, `ee9f26b`)

| Unit | exports | full-export doc-lint | breakdown | dry-run | src LOC | files | tests | docs/ |
|------|--------:|---------------------:|-----------|:-------:|--------:|------:|------:|:-----:|
| `plugin-triggers-core` | 11 | **211** | 46 private-type-ref + 165 missing-jsdoc | PASS (0 slow) | 4,023 | ~55 | (confirm) | **MISSING** |
| `plugin-triggers` | 10 | **138** | 76 private-type-ref + 62 missing-jsdoc | PASS (0 slow) | 2,897 | ~40 | **0** | **MISSING** |

Family doc-lint = **349** (lightest Wave-4 family). Largest file seen: plugin
`test-webhooks-e2e` **424**.

Doc-lint command (all entrypoints), run from each package dir:
- core: `deno doc --lint ./mod.ts ./src/adapters/mod.ts ./src/builders/mod.ts ./src/config/mod.ts ./src/contracts/v1/mod.ts ./src/domain/mod.ts ./src/ports/mod.ts ./src/public/mod.ts ./src/runtime/mod.ts ./src/telemetry/mod.ts ./src/testing/mod.ts`
- plugin: `deno doc --lint ./mod.ts ./src/aspire/mod.ts ./src/cli/mod.ts ./src/public/mod.ts ./src/plugin/mod.ts ./src/runtime/mod.ts ./src/scaffolding/mod.ts ./services/mod.ts ./streams/mod.ts ./streams/server.ts`
  (confirm exact subpaths against `deno.json` at MEASURE-FIRST — names approximate.)

## Interpretation

- **349 = the lightest Wave-4 family**, but 4d carries a workload the others don't: **both units are
  missing their `docs/` dir** (F-7 doc-score). The other three families (workers/streams/sagas) ship
  docs/. Authoring two docs/ trees is the distinguishing 4d cost.
- **Both PASS dry-run, 0 slow types** → no slow-type rebuild.
- **OQ-D resolved → `triggers-health` is in-scope.** A5 ⇒ Runtime/Aspire validation REQUIRED,
  including a live **health probe** (`localhost:8093/health` — confirm port). This is the runtime
  evidence for the plugin.
- **Sizing — likely combined (no split).** 349 + modest entrypoint counts (11/10) likely fits one
  plan under cap, unlike 4b/4c. But the 2 missing docs/ dirs + 0-test plugin + health runtime
  evidence still pressure it — confirm at the Plan Gate.

## Exports map (the F-5/F-16 challenge target)

`plugin-triggers-core` (11): `. ./adapters ./builders ./config ./contracts/v1 ./domain ./ports
./public ./runtime ./telemetry ./testing`.

`plugin-triggers` (10): `. ./aspire ./cli ./public ./plugin ./runtime ./scaffolding ./services
./streams ./streams/server`.

## Carried caveats

- `netscript-start#96` left `check:triggers` typing drift + generated-DB artifacts — triage
  package-debt vs environment before scoping (umbrella `research.md` §0/§5).
- `test-webhooks-e2e` (424) exists but is NOT wired as a `test` task — verify and wire / split.
- Private-type-ref fix strategy = Wave 3 LD-8 + 4a PLAN-EVAL precedent (split by type origin; see
  `context-pack.md`).

## NOT done here (generator owns)

Per-entrypoint doc-lint attribution (which of the 11/10 carry the 211/138), the consumer scan, the
two docs/ authoring jobs, the 0→real test-layer design, the health-probe validation, and the
over-cap split. Re-run the full sweep after the 4a + 4b + 4c merges are pulled forward.
