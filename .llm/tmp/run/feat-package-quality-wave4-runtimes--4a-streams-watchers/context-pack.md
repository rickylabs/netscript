# Sub-wave Context Pack — Wave 4 · 4a: streams + watchers

Run ID: `feat-package-quality-wave4-runtimes--4a-streams-watchers`
Sub-branch: `feat/package-quality-wave4-runtimes-4a` (off umbrella
`feat/package-quality-wave4-runtimes` @ `ee9f26b`, which carries the merged Wave 3
`@netscript/plugin` surface).
PR target: the **umbrella** `feat/package-quality-wave4-runtimes` (NOT the track).
Role: SUPERVISOR-authored seed for the generator. The locked slice authority is this
sub-wave's `plan.md` once written + PLAN-EVAL-approved. This pack is context, not a plan.

## Scope — 3 publishable units (the wave's foundation sub-wave)

| Unit | Tier / archetype (to confirm) | exports | src LOC | files | tests | README | docs/ | largest file |
|------|-------------------------------|--------:|--------:|------:|------:|-------:|:-----:|--------------|
| `@netscript/plugin-streams-core` | core — **A1 vs A3 (decide)** | 3 | 816 | 16 | 2 | 170 | ✓ | create-durable-stream 262 |
| `@netscript/plugin-streams` | **A5** plugin | 5 | 579 | 13 | **0** | 128 | ✓ | services/main 154 |
| `@netscript/watchers` | **A3** standalone | 1 | ~1,621¹ | 13¹ | 3 | **0** | **✗** | file-watcher 310 |

¹ `watchers` is flat at the package root (no `src/`); a `src/`-only walk reports 0 LOC.
The flat layout is itself the structural finding (see §"watchers structural lift").
All three release `0.0.1-alpha.0`.

## Why this sub-wave first

`streams` is foundational: `workers-core` exports `./streams`; `plugin-{triggers,sagas}`
export `./streams` + `./streams/server`; `sagas-core` exports `./streams`. `watchers`
underpins file-watching used by streams/triggers and is tiny + standalone. Opening 4a
first also exercises the **A3 runtime-validation path once, early** (warm-up), before the
two long-pole cores (4b workers, 4c sagas) and the terminal triggers sub-wave (4d).

## ⚠️ This wave is fine-tuning, NOT a slow-type rebuild

The `*-core` + `plugins/*` layout is the output of the platform rewrite
`rickylabs/netscript-start#96` (merged 2026-05-26). **All 9 Wave 4 units publish-dry-run
PASS with 0 slow types** at the umbrella base — the canonical "before" counts are stale.
So 4a's real work is: full-export **doc-lint** debt, the A5 **zero-test** gap, the
**`watchers` structural lift**, F-6 task hygiene, F-1 file-size, docs scaffold, doctested
READMEs — and the archetype decision below. See umbrella `research.md` §0/§3.

## The three real work items for 4a

1. **Core archetype decision (A1 vs A3) — gate-set hinge.** Registry says `*-core` is
   A1/A4; canonical `plan_streams.md` says **A1** ("was Wave 1"). If `plugin-streams-core`
   is a pure type/contract + factory surface (`createDurableStream`, topic schema) it may
   be A1 (F-2/3/4/9/13 n/a, runtime val n/a, consumer-import optional). If it owns
   **runtime stream behavior**, it is **A3** ⇒ **F-13 + live Runtime/Aspire validation
   required**. Decide per unit in Plan & Design, declare in each `docs/architecture.md`,
   record the gate delta in `drift.md`. (Recommendation in umbrella `research.md` §4:
   treat cores as A3 unless provably a pure contract surface.)
2. **`plugin-streams` has ZERO tests** (A5 ⇒ F-10 test-shape **required** + Runtime/Aspire
   validation **required**). Build a real test layer, not a doctest sprinkle. F-2/F-4 n/a
   for A5; F-13 subtype; consumer-import required.
3. **`watchers` structural lift** (the "rough unit"): no README, no `docs/`, no `deno.json`
   tasks, flat root layout, no description — but already 0 slow types. Lift to a
   `src/public/` tree, README ≥150 doctested, docs scaffold, full task block. A3 ⇒ F-13 +
   runtime if it owns watch-loop behavior.

## MEASURE-FIRST (generator's first step, before locking effort)

- Full-export `deno doc --lint` over **every** `exports` entrypoint of all 3 units. Root
  undercounts massively (Wave 3 `@netscript/plugin`: root 11 vs full 8-entrypoint 120/93).
  Record real per-entrypoint numbers in this run's `research.md`/`drift.md`.
- `deno publish --dry-run --allow-dirty` per unit (expected PASS — confirm it holds).
- `deno check --unstable-kv` over all entrypoints.
- Test adequacy vs archetype layers: `plugin-streams` starts from **zero**.
- Runtime/Aspire validation for the A3/A5 surfaces (real stream behavior, not just types).

## Consumer-import (zero-consumer rule before any surface trim)

`plugin-streams` maps `@netscript/plugin` → `packages/plugin/mod.ts` (the Wave 3 root
barrel, validated doc-lint-clean at Wave 3 IMPL-EVAL — no drift). Before trimming any
`*-core` entrypoint, grep `packages/cli`, the A5 plugins, `services/`, and `apps/` for
real use (Wave 3 `./loader`/`./abstracts`/`./testing` zero-consumer lesson). Alpha allows
no-shim removal, but prove zero external use first.

## Phase 0 reading (read only what the slice needs)

1. This pack + umbrella `research.md` (§§0–8) + `split-strategy.md` + `drift.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{1,3,5}-*.md` + `SCOPE-*` +
   `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*` — package-quality is **architectural, not type/lint cleanup**
   (esp. `package-quality-archetype.md`, `sub-wave-orchestration.md`, `validation.md`).
4. Canonical (stale — structural intent + Concept-of-Done only, NOT metrics), via the name
   map in umbrella `research.md` §7: `plan_streams.md`/`evaluate_streams.md`,
   `plan_plugin-streams.md`/`evaluate_plugin-streams.md`, `plan_watchers.md`/`evaluate_watchers.md`.
5. Focused code per unit: `deno.json` + the `exports` entrypoints. Prefer
   `deno doc <module>` / `deno doc --filter <symbol>` over whole-file reads.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session. Evaluator ≠ generator.
- Handover for 4a = **Research → Plan & Design** (this is NOT an implementation handover).
  Research (MEASURE-FIRST) → Plan & Design → PLAN-EVAL hard stop → then implement.
- PLAN-EVAL routing = **Option A** (one PLAN-EVAL over the combined Wave 4 plan; Wave 2
  precedent). Re-confirm at the Plan Gate.
- Supervisor does not run gates/PLAN-EVAL/IMPL-EVAL/scoring.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`.
- Record every plan deviation + folder rename in this run's `drift.md`.

## Close

4a merges into the umbrella `feat/package-quality-wave4-runtimes` via its own Draft PR
after separate-session IMPL-EVAL PASS. 4b (workers) forks off the 4a-merged umbrella.
The umbrella merges to the track **once**, at full Wave 4 completeness.

## References

- Umbrella run: `feat-package-quality-wave4-runtimes--umbrella/{research,split-strategy,context-pack,worklog,drift}.md`.
- Supervisor: `.llm/tmp/run/feat-package-quality--supervisor/phase-registry.md` (Wave 4).
- Gate matrix: `.llm/harness/gates/archetype-gate-matrix.md`; archetypes `ARCHETYPE-{1,3,5}-*.md`.
- Sizing risk (PLAN-EVAL): if `watchers`' lift + the streams pair exceeds budget, split
  `watchers` into its own micro sub-wave (archetype-independent of streams) — `split-strategy.md` §"Open sizing risk".
