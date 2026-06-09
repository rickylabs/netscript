# Sub-wave Context Pack — Wave 4 · 4b: workers

Run ID: `feat-package-quality-wave4-runtimes--4b-workers`
Sub-branch: `feat/package-quality-wave4-runtimes-4b` (forked off umbrella
`feat/package-quality-wave4-runtimes` @ `ee9f26b`, which carries the merged Wave 3
`@netscript/plugin` surface).
PR target: the **umbrella** `feat/package-quality-wave4-runtimes` (NOT the track).
Role: SUPERVISOR-authored seed + pre-research. The locked slice authority is this
sub-wave's `plan.md` once written + PLAN-EVAL-approved.

## STATUS: IMPLEMENTATION IN PROGRESS

PLAN-EVAL returned PASS on 2026-06-09. Implementation is proceeding in the locked 27-slice
order. Slices C1-C10 are complete and pushed. Latest implementation commit: `941b21a`
(`docs(workers-core): document testing workflow APIs`), with targeted doc-lint 0/0/0 for
testing, executor, and workflow and raw core 16-entrypoint check passing.

## Scope — 2 publishable units (long pole #1)

| Unit | Tier / archetype (confirm) | exports | src LOC | files | tests | README | docs/ | largest file | doc-lint (full-export) | dry-run |
|------|----------------------------|--------:|--------:|------:|------:|-------:|:-----:|--------------|----------------------:|:-------:|
| `@netscript/plugin-workers-core` | core — **A3 (decide)** | **17** | 7,060 | 87 | 5 | 315 | ✓ | workers.contract **501** | **460** (180 ptr + 280 jsdoc) | PASS |
| `@netscript/plugin-workers` | **A5** plugin | 9 | 2,426 | 20 | **0** | 260 | ✓ | worker/scheduler **469** | **143** (83 ptr + 60 jsdoc) | PASS |

Family doc-lint = **603**. Both `0.0.1-alpha.0`. (`ptr` = private-type-ref.)

## Headline — this is the largest doc-debt + the surface-sprawl challenge

- **Fine-tuning, NOT a slow-type rebuild:** both units `deno publish --dry-run` PASS, 0 slow
  types (provenance `netscript-start#96`). Real work = the 603 doc-lint, the 0-test A5 plugin,
  F-1 over-cap (501/469), F-6 task hygiene, and the **17-export surface challenge**.
- **⚠️ SIZING — split is near-certain.** 603 doc-lint across a 17-entrypoint core + a 9-entrypoint
  plugin will almost certainly bust the `<30`-slice Plan-Gate cap. Plan & Design should expect to
  **split 4b into `4b-core` and `4b-plugin`** (the split-strategy "Open sizing risk" escalation).
  Decide at the Plan Gate from the per-entrypoint MEASURE-FIRST sweep.

## The real work items for 4b

1. **Core archetype A3 (decide & declare).** Canonical `plan_workers.md` = A3 (Runtime/Behavior).
   A3 ⇒ **F-13 (runtime invariants) + live Runtime/Aspire validation REQUIRED + consumer-import
   required**. Confirm against the runtime nature (job dispatcher, executor, scheduler), declare
   in `docs/architecture.md`, record the gate delta in `drift.md`.
2. **17-export surface challenge (F-5 + F-16 hard).** Is each of `./builders ./contracts ./registry
   ./state ./executor ./workflow ./streams ./presets ./shutdown ./schemas ./telemetry ./abstracts
   ./testing ./config ./runtime` a real, documented, alpha-intended consumer contract — or an
   internal layer leaking as an entrypoint? **Prove consumers first** (grep `packages/cli`, the A5
   plugins, `services/`, `apps/`) before any trim — alpha allows no-shim removal, but the Wave 3
   `./loader`/`./abstracts`/`./testing` zero-consumer lesson applies. Don't blanket-export to clear
   private-type-ref; weigh each against F-16.
3. **`plugin-workers` has ZERO tests** (A5 ⇒ F-10 test-shape + Runtime/Aspire validation REQUIRED).
   Real test layer (manifest, CLI, Aspire registration, worker/scheduler), not a doctest sprinkle.
4. **F-1 over-cap:** `workers.contract` 501, `worker/scheduler` 469 — concept-split (or per-layer
   treatment for `.contract.ts`/generated/service files, A6-style).
5. **F-6 task hygiene:** `plugin-workers` lacks `publish:dry-run`; `check` tasks should enumerate
   every entrypoint (the Wave 3 F-6 pattern).
6. **`unanalyzable-dynamic-import`** (non-blocking, like Wave 3's manifest-resolver): workers-core
   ×1, plugin-workers ×2 — accept-and-document vs make-resolvable per unit.

## Known-soft area (from #96)

`netscript-start#96` left `check:workers` failing on worker-job **typing drift** + generated-DB
artifacts. Determine genuine package debt vs environment (generated artifacts) before scoping;
the A5 service/runtime layer is the suspect.

## Private-type-ref fix strategy (Wave 3 LD-8 + 4a PLAN-EVAL precedent — APPLY)

180+83 private-type-ref leaks. Fix by **type origin**, do NOT blanket-export:
- **First-party `@netscript/*`** types → explicit **type re-export** through the barrel
  (F-15/AP-14 target third-party libs, not first-party).
- **Third-party** types (e.g. `StandardSchemaV1` from `@standard-schema/spec`) → **package-owned
  structural type** (Wave 3 `PluginPayloadSchema` precedent). Never re-export third-party.
- **Internal layer leaking as public** → the real fix is often F-5 surface trim, not export.
- `@ignore` only for genuinely-internal incidental refs.

## MEASURE-FIRST (generator's first step — re-run after the 4a pull-forward)

- Full-export `deno doc --lint` over **every** entrypoint, **per entrypoint** (locate which of the
  17 carry the 460). Supervisor pre-measure: 460 core / 143 plugin at `ee9f26b` (see `pre-research.md`).
- `deno publish --dry-run --allow-dirty` per unit (expected PASS — confirm).
- `deno check --unstable-kv` over all entrypoints.
- Consumer scan for the F-5 challenge (see item 2).

## Phase 0 reading

1. This pack + `pre-research.md` + umbrella `research.md` (§§0–8) + `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,5}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*` (package-quality is architectural, not lint cleanup).
4. Canonical (STALE — intent + Concept-of-Done only): `plan_workers.md`/`evaluate_workers.md`,
   `plan_plugin-workers.md`/`evaluate_plugin-workers.md` (umbrella `research.md` §7 name map).
5. Focused code: each unit's `deno.json` + entrypoints. Prefer `deno doc <module>` /
   `deno doc --filter <symbol>` over whole-file reads.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session. Evaluator ≠ generator.
- Handover = **Research → Plan & Design** (NOT implementation). PLAN-EVAL hard stop before code.
- PLAN-EVAL routing = Option A (combined Wave 4 plan; Wave 2 precedent).
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`. Record drift + renames in `drift.md`.

## Close

4b merges into the umbrella after separate-session IMPL-EVAL PASS. **4c (sagas) forks off the
4b-merged umbrella** (sagas depends on workers via `./integration/workers`). If split, `4b-plugin`
forks off the `4b-core`-merged umbrella.
