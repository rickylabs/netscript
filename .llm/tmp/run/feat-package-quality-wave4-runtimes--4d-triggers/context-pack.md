# Sub-wave Context Pack — Wave 4 · 4d: triggers

Run ID: `feat-package-quality-wave4-runtimes--4d-triggers`
Sub-branch: `feat/package-quality-wave4-runtimes-4d` (forked off umbrella
`feat/package-quality-wave4-runtimes` @ `ee9f26b`).
PR target: the **umbrella** (NOT the track).
Role: SUPERVISOR-authored seed + pre-research. Locked slice authority = this sub-wave's
`plan.md` once PLAN-EVAL-approved.

## STATUS: IMPLEMENT IN PROGRESS — D19 COMPLETE, D20 NEXT

The plan is locked and PLAN-EVAL passed in a separate session (`plan-eval.md`, commit `bb985d0`).
Implementation is proceeding in the approved 23-slice order. 4d is the **last** sub-wave of Wave 4:
when it merges, the umbrella is at full-wave completeness and the supervisor merges the umbrella
to track `feat/package-quality`.

## Implementation progress

| Slice | Status | Evidence |
|-------|--------|----------|
| D1 | COMPLETE | Core F-6 task hygiene: `check` enumerates all 11 entrypoints; `test` task added. Raw `deno task check` PASS exit 0; raw `deno task test` PASS exit 0 with 13 passed / 0 failed. Implementation commit `7a4aefc`; docs commit `26ab7b0`. |
| D2 | COMPLETE | Plugin F-6 task hygiene: `check` enumerates all 10 entrypoints. Raw `deno task check` PASS exit 0. Implementation commit `23ecbe4`; docs commit `7b2fe54`. |
| D3 | COMPLETE | Core ptr-fix for builders plus domain re-exports. Raw `deno doc --lint src/builders/mod.ts` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `521c452`; docs commit `3785ef5`. |
| D4 | COMPLETE | Core ptr-fix for contracts/v1 and config with structural third-party handling. Raw `deno doc --lint src/config/mod.ts` PASS exit 0; raw `deno doc --lint src/contracts/v1/mod.ts` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `9d3505d`; docs commit `819a6df`. |
| D5 | COMPLETE | Core ptr-fix for ports, runtime, and adapters. Raw `deno doc --lint src/adapters/mod.ts` PASS exit 0; raw `deno doc --lint src/ports/mod.ts` PASS exit 0; raw `deno doc --lint src/runtime/mod.ts` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `da0cb30`; docs commit `762fe08`. |
| D6 | COMPLETE | Core ptr-fix for telemetry and testing. Raw `deno doc --lint src/telemetry/mod.ts` PASS exit 0; raw `deno doc --lint src/testing/mod.ts` PASS exit 0; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `2d45b05`; docs commit `aee486a`. |
| D7 | COMPLETE | Core JSDoc telemetry residual validation. Raw `deno doc --lint src/telemetry/mod.ts` PASS exit 0; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation marker commit `98a121f`; docs commit `64109d5`. |
| D8 | COMPLETE | Core JSDoc ports/domain/runtime/adapters. Raw `deno doc --lint` PASS exit 0 for `src/ports/mod.ts`, `src/domain/mod.ts`, `src/runtime/mod.ts`, and `src/adapters/mod.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `50cc79f`; docs commit `2d441c3`. |
| D9 | COMPLETE | Core JSDoc testing/contracts residual validation. Raw `deno doc --lint src/testing/mod.ts` PASS exit 0; raw `deno doc --lint src/contracts/v1/mod.ts` PASS exit 0; raw `deno task check` PASS exit 0. Implementation marker commit `f5e87be`; docs commit `476cec4`. |
| D10 | COMPLETE | Plugin ptr-fix public/mod, root mod, plugin/mod, aspire. Raw `deno doc --lint` PASS exit 0 for `src/public/mod.ts`, `mod.ts`, `src/plugin/mod.ts`, and `src/aspire/mod.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `437e605`; docs commit `35e3020`. |
| D11 | COMPLETE | Plugin ptr-fix runtime. Raw `deno doc --lint src/runtime/mod.ts` PASS exit 0 with inherited Fedify npm type-resolution warnings only; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `c20e9db`; docs commit `a4a7636`. |
| D12 | COMPLETE | Plugin ptr-fix CLI + streams. Raw `deno doc --lint` PASS exit 0 for `src/cli/composition/main.ts`, `streams/mod.ts`, and `streams/server.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `00af803`; docs commit `bd7e0bc`. |
| D13 | COMPLETE | Plugin ptr-fix services + scaffolding + constants residual. Raw `deno doc --lint` PASS exit 0 for `services/src/main.ts`, `src/scaffolding/mod.ts`, and `src/constants.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `225e05c`; docs commit `82b5b64`. |
| D14 | COMPLETE | Plugin runtime JSDoc residual validation. Raw `deno doc --lint src/runtime/mod.ts` PASS exit 0 with inherited Fedify npm type-resolution warnings only; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation marker commit `5d25e90`; docs commit `8e67f02`. |
| D15 | COMPLETE | Plugin CLI JSDoc residual. Raw `deno doc --lint` PASS exit 0 for `src/cli/composition/main.ts` and `src/cli/mod.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation commit `de55dab`; docs commit `775662b`. |
| D16 | COMPLETE | Plugin streams/scaffolding/constants JSDoc residual validation. Raw `deno doc --lint` PASS exit 0 for `streams/mod.ts`, `streams/server.ts`, `src/scaffolding/mod.ts`, and `src/constants.ts`; scoped `deno fmt --check` PASS exit 0; raw `deno task check` PASS exit 0. Implementation marker commit `da10d52`; docs commit `0feabec`. |
| D17 | COMPLETE | F-1 split `test-webhooks-e2e.ts` into focused e2e files. New files under `tests/e2e`: helpers 69 LOC, health 19, ingress 102, security 73. Raw `deno check --unstable-kv tests/e2e/*.ts` PASS exit 0; `deno test --allow-net --allow-env --unstable-kv tests/e2e` PASS exit 0 with 12 ignored unless `NETSCRIPT_RUN_WEBHOOK_E2E=1`; raw `deno task check` PASS exit 0. Implementation commit `c2df49a`; docs commit `d33e07c`. |
| D18 | COMPLETE | A5 manifest verification layer: `verify-plugin.ts` returns `{ ok, inspection, findings }` and exits 0/1 as main; `tests/public/manifest_test.ts` covers public manifest axes and verifier output. Raw `deno check --unstable-kv` PASS exit 0; direct verifier run PASS exit 0 with `ok: true`; direct manifest test PASS exit 0 with 1 passed / 0 failed; package `deno task test` PASS exit 0 with 1 passed / 0 failed / 12 ignored. Implementation commit `fb25c72`; docs commit `f54d787`. |
| D19 | COMPLETE | A5 CLI contribution test added in `tests/cli/cli_test.ts`. Raw `deno fmt --check` PASS exit 0, raw `deno check --unstable-kv` PASS exit 0, direct CLI test PASS exit 0 with 3 passed / 0 failed, and package `deno task test` PASS exit 0 with 4 passed / 0 failed / 12 ignored. Implementation commit `27083c9`. |
| D20 | NEXT | A5 test layer: Aspire contribution test and E2E gate manifest test. |

## Scope — 2 publishable units + the health seam (OQ-D resolved: in-scope here)

| Unit | Tier / archetype (confirm) | exports | src LOC | files | tests | README | docs/ | largest file | doc-lint (full-export) | dry-run |
|------|----------------------------|--------:|--------:|------:|------:|-------:|:-----:|--------------|----------------------:|:-------:|
| `@netscript/plugin-triggers-core` | core — **A3 (decide)** | 11 | 4,023 | ~55 | (confirm) | (confirm) | **MISSING** | (confirm) | **211** (46 ptr + 165 jsdoc) | PASS |
| `@netscript/plugin-triggers` | **A5** plugin | 10 | 2,897 | ~40 | **0** | (confirm) | **MISSING** | test-webhooks-e2e **424** | **138** (76 ptr + 62 jsdoc) | PASS |

Family doc-lint = **349** (the smallest Wave-4 family). Both `0.0.1-alpha.0`. (`ptr` =
private-type-ref.)

## Headline — smallest family, but TWO docs/ dirs missing + the health-probe seam

- **Fine-tuning, NOT a slow-type rebuild:** both PASS dry-run, 0 slow types (provenance #96). Work =
  349 doc-lint, the 0-test A5 plugin, **both units missing their `docs/` dir** (F-7 doc-score —
  unique to 4d; the other three families ship docs/), the webhook E2E file at 424 (F-1), and the
  health seam.
- **OQ-D RESOLVED (Wave 3 closeout): `triggers-health` is in-scope for 4d.** It is the downstream
  health consumer; A5 ⇒ **Runtime/Aspire validation REQUIRED**, including a live **`localhost:8093/
  health` probe** (confirm port at MEASURE-FIRST). Treat health-registration as the A5 runtime
  evidence.
- **`triggers-core` is A3.** Trigger firing/scheduling/dedup invariants ⇒ F-13 + live Runtime/Aspire
  validation REQUIRED.
- **Sizing — likely fits without split.** 349 is the lightest family and entrypoint counts are
  modest (11/10). A single combined plan MAY fit under cap, but the 2 missing docs/ dirs + the
  0-test plugin + health runtime evidence still push it — confirm split-vs-combined at the Plan Gate.

## The real work items for 4d

1. **Both `docs/` dirs are MISSING** — author architecture + usage docs for each unit (F-7). This is
   the distinguishing 4d workload; the other Wave-4 families already had docs/.
2. **Core archetype A3 (decide & declare).** Trigger firing/schedule/dedup invariants ⇒ F-13 +
   Runtime/Aspire validation + consumer-import required. Declare in `docs/architecture.md`.
3. **`plugin-triggers` has ZERO tests** (A5 ⇒ F-10 + Runtime/Aspire validation REQUIRED) — real test
   layer (manifest, CLI, Aspire, E2E gates, runtime). Note an existing `test-webhooks-e2e` (424)
   harness file exists but is NOT wired as a `test` task — verify.
4. **`triggers-health` seam.** Validate health registration end-to-end via the live probe
   (`localhost:8093/health` — confirm). This is the OQ-D deliverable.
5. **F-1 over-cap:** `test-webhooks-e2e` 424 (concept-split or move under a tests/ layout);
   re-measure other files at MEASURE-FIRST.
6. **F-6 task hygiene:** confirm `test` + `publish:dry-run` tasks on both; `check` enumerates all
   entrypoints.
7. **Private-type-ref:** 46+76 leaks — fix by type origin.

## Known-soft area (from #96)

`check:triggers` typing drift + generated-DB artifacts. Triage package-debt vs
generated-artifact/environment before scoping (umbrella `research.md` §0/§5).

## Private-type-ref fix strategy (Wave 3 LD-8 + 4a PLAN-EVAL precedent — APPLY)

46+76 leaks. Fix by **type origin** (do NOT blanket-export): first-party `@netscript/*` → type
re-export; third-party (e.g. `StandardSchemaV1`) → package-owned structural type; internal-leak →
F-5 trim; `@ignore` only for genuinely-internal incidental refs.

## MEASURE-FIRST (generator — re-run after the 4a + 4b + 4c pull-forward)

- Full-export `deno doc --lint` **per entrypoint** (attribute the 211/138). Supervisor pre-measure
  at `ee9f26b`: core 211 / plugin 138 (see `pre-research.md`).
- `deno publish --dry-run --allow-dirty` per unit (expect PASS).
- `deno check --unstable-kv` over all entrypoints.
- Consumer scan; confirm the missing-docs/ and test-task facts; probe the health port.

## Phase 0 reading

1. This pack + `pre-research.md` + umbrella `research.md` (§§0–8, esp. OQ-D resolution) +
   `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,5}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*`.
4. Canonical (STALE — intent + Concept-of-Done only): `plan_triggers.md`/`evaluate_triggers.md`,
   `plan_plugin-triggers.md`/`evaluate_plugin-triggers.md` (name map: umbrella `research.md` §7).
5. Focused code: `deno.json` + entrypoints. Prefer `deno doc` over whole-file reads.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL each a SEPARATE session. Handover = Research → Plan & Design.
- PLAN-EVAL routing Option A. Hard stop before code.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`. Record drift + renames in `drift.md`.

## Close

4d merges into the umbrella after IMPL-EVAL PASS. **4d is the last sub-wave** — on its merge the
supervisor brings the umbrella to full-wave completeness and merges the umbrella → track
`feat/package-quality` (`--no-ff`).
