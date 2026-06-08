# Sub-wave Context Pack — Wave 4 · 4c: sagas

Run ID: `feat-package-quality-wave4-runtimes--4c-sagas`
Sub-branch: `feat/package-quality-wave4-runtimes-4c` (forked off umbrella
`feat/package-quality-wave4-runtimes` @ `ee9f26b`).
PR target: the **umbrella** (NOT the track).
Role: SUPERVISOR-authored seed + pre-research. Locked slice authority = this sub-wave's
`plan.md` once PLAN-EVAL-approved.

## ⏳ STATUS: PREPARED IN PARALLEL — DO NOT LOCK YET

Forks off the umbrella. Before this plan locks: **4a AND 4b must merge into the umbrella**,
then **pull the umbrella forward** (`git merge feat/package-quality-wave4-runtimes`) and re-run
MEASURE-FIRST. Reason: sagas **depends on workers** (`./integration/workers`) and on streams
(`sagas-core ./streams`) — both settle at the 4a/4b merges.

## Scope — 2 publishable units (long pole #2)

| Unit | Tier / archetype (confirm) | exports | src LOC | files | tests | README | docs/ | largest file | doc-lint (full-export) | dry-run |
|------|----------------------------|--------:|--------:|------:|------:|-------:|:-----:|--------------|----------------------:|:-------:|
| `@netscript/plugin-sagas-core` | core — **A3 (decide)** | **19** | 6,768 | 80 | 5 | 166 | ✓ | redis-transport **481** | **397** (48 ptr + 349 jsdoc) | PASS |
| `@netscript/plugin-sagas` | **A5** plugin | 12 | 2,396 | 30 | **0** | 99 | ✓ | services/routers/v1 **716** | **122** (71 ptr + 51 jsdoc) | PASS |

Family doc-lint = **519**. Both `0.0.1-alpha.0`. (`ptr` = private-type-ref.)

## Headline — saga runtime invariants + the 716-LOC router + ports/adapters discipline

- **Fine-tuning, NOT a slow-type rebuild:** both PASS dry-run, 0 slow types (provenance #96). Work =
  519 doc-lint, the 0-test A5 plugin, F-1 over-cap (the **716-LOC `services/routers/v1.ts` is the
  largest file on the whole board**), the **19-export surface challenge**, and the
  ports/adapters/transports/stores/middleware layering audit.
- **`sagas-core` is the canonical F-13 case.** A3 ⇒ **F-13 (saga/runtime invariants) + live
  Runtime/Aspire validation REQUIRED**. Saga state transitions, compensation, and transport
  swappability are the invariants to assert.
- **⚠️ SIZING — split is near-certain.** 519 doc-lint + 19 entrypoints + the 716-LOC router split +
  the 0-test plugin → plan for a **`4c-core` / `4c-plugin`** split (split-strategy "Open sizing
  risk"). Confirm at the Plan Gate.

## The real work items for 4c

1. **Core archetype A3 (decide & declare).** Saga runtime invariants are the canonical F-13 case.
   A3 ⇒ F-13 + Runtime/Aspire validation + consumer-import required. Declare in
   `docs/architecture.md`; gate delta in `drift.md`.
2. **19-export surface challenge (F-5 + F-16).** Confirm the **ports/adapters split is clean
   (F-3 layering)** and transports are swappable behind a port: `./ports ./adapters ./transports
   ./stores ./middleware`. Are `./streams ./presets ./agent ./abstracts ./integration/workers
   ./integration/publisher` all alpha-intended public API? Prove consumers before trimming.
3. **`plugin-sagas` has ZERO tests** (A5 ⇒ F-10 + Runtime/Aspire validation REQUIRED) — real test
   layer (manifest, CLI, Aspire, E2E gates, runtime).
4. **F-1 over-cap — the two biggest:** `services/routers/v1.ts` **716** (concept-split mandatory;
   also the A5 service layer flagged by #96 typing drift), `redis-transport` **481** (likely a
   ports/adapter concern-split). README `plugin-sagas` is only 99 LOC (< 150 → lift).
5. **F-6 task hygiene:** `sagas-core` lacks a `test` task; `plugin-sagas` lacks `publish:dry-run`;
   `check` should enumerate all entrypoints.
6. **`unanalyzable-dynamic-import`:** plugin-sagas ×2 (accept-and-document vs resolve).

## Known-soft area (from #96)

`plugin-sagas` `services/routers/v1.ts` (716) is the A5 service layer; #96 left service-router
typing drift. Triage package-debt vs generated-artifact/environment before scoping.

## Private-type-ref fix strategy (Wave 3 LD-8 + 4a PLAN-EVAL precedent — APPLY)

48+71 leaks. Fix by **type origin** (do NOT blanket-export): first-party `@netscript/*` → type
re-export; third-party (e.g. `StandardSchemaV1`) → package-owned structural type; internal-leak →
F-5 trim; `@ignore` only for genuinely-internal incidental refs.

## MEASURE-FIRST (generator — re-run after the 4a + 4b pull-forward)

- Full-export `deno doc --lint` **per entrypoint** (attribute the 397/122). Supervisor pre-measure
  at `ee9f26b`: core 397 / plugin 122 (see `pre-research.md`).
- `deno publish --dry-run --allow-dirty` per unit (expect PASS).
- `deno check --unstable-kv` over all entrypoints.
- Consumer scan for the F-5 19-export challenge.

## Phase 0 reading

1. This pack + `pre-research.md` + umbrella `research.md` (§§0–8) + `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,5}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*`.
4. Canonical (STALE — intent + Concept-of-Done only): `plan_sagas.md`/`evaluate_sagas.md`,
   `plan_plugin-sagas.md`/`evaluate_plugin-sagas.md` (name map: umbrella `research.md` §7).
5. Focused code: `deno.json` + entrypoints. Prefer `deno doc` over whole-file reads.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL each a SEPARATE session. Handover = Research → Plan & Design.
- PLAN-EVAL routing Option A. Hard stop before code.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`. Record drift + renames in `drift.md`.

## Close

4c merges into the umbrella after IMPL-EVAL PASS. **4d (triggers) forks off the 4c-merged
umbrella** (runs LAST). If split, `4c-plugin` forks off the `4c-core`-merged umbrella.
