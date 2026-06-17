# Sub-wave Split Strategy — Wave 4 (9 units)

Run ID: `feat-package-quality-wave4-runtimes--umbrella`
Author: SUPERVISOR, 2026-06-08. **Proposal** — PLAN-EVAL confirms the final split
(Wave 2 precedent: split is a Plan-Gate decision, routed Option A).

## Why split (same trigger as Wave 2)

9 units far exceed the Plan-Gate `< 30`-slice cap (Wave 2's 8 units split into
2a/2b/2c at 10/23/17 slices). Wave 4 splits along the **atomic core+plugin pair per
runtime family** — the seam the registry already names ("released as atomic core+plugin
sub-waves (streams, workers, sagas, triggers) + watchers").

## Dependency order (from `deno.json` exports)

- `streams` is foundational: `workers-core` exports `./streams`; `plugin-{triggers,sagas}`
  export `./streams` + `./streams/server`; `sagas-core` exports `./streams`.
- `workers` precedes `sagas`: `sagas-core` exports `./integration/workers`.
- `watchers` underpins file-watching used by streams/triggers; tiny + standalone.
- `triggers` last by design: owns the triggers-health runtime caveat + most exposed to
  Wave 3's final surface.

→ **streams/watchers → workers → sagas → triggers.**

## Proposed sub-waves

| Sub | Units | Tier/Arch | ~src LOC | Why grouped / ordered |
|-----|-------|-----------|---------:|-----------------------|
| **4a — foundation** | `plugin-streams-core`, `plugin-streams`, `watchers` | core+A5+A3 | ~3,000 | Smallest core (816) + its plugin (579) + the rough standalone `watchers` (~1,621, the structural-lift unit). Foundation everything else imports. Warm-up that also exercises the A3 runtime-validation path once, early. |
| **4b — workers** | `plugin-workers-core`, `plugin-workers` | core+A5 | ~9,500 | Long pole #1 (17-export / 7,060-LOC core + 2,426 plugin). Depends on streams. The challenge pass on surface sprawl lives here. Likely near the slice cap alone. |
| **4c — sagas** | `plugin-sagas-core`, `plugin-sagas` | core+A5 | ~9,200 | Long pole #2 (19-export / 6,768-LOC core + 2,396 plugin, incl. the 716-LOC v1 router). Depends on workers (`./integration/workers`) + streams. |
| **4d — triggers** | `plugin-triggers-core`, `plugin-triggers` | core+A5 | ~6,900 | Runs LAST. Owns triggers-health (A5 ⇒ runtime validation required) and is most exposed to Wave 3's final `@netscript/plugin` surface + OQ-D verdict. |

Total ≈ 28.6k src LOC across 4 sub-waves. Each sub-wave: own branch off the umbrella,
own worktree, own Draft PR → umbrella, own separate-session IMPL-EVAL. Umbrella merges
**once** into the track at full-wave completeness (Wave 2 model; stand up before merging).

### Open sizing risk (for PLAN-EVAL)

- **4b and 4c may each individually exceed `< 30` slices** given the 17/19-export surfaces +
  doc-lint debt + file-size splits + the 0-test A5 plugin. If a generator's MEASURE-FIRST
  doc-lint sweep shows large per-entrypoint debt, **escalate to split the core and plugin
  into separate sub-waves** (e.g. 4b-core / 4b-plugin). Decide at the Plan Gate per sub-wave,
  not up front.
- **4a**: if `watchers`' structural lift + the streams pair exceeds budget, split `watchers`
  into its own micro sub-wave (it is archetype-independent of streams).

## PLAN-EVAL routing (Wave 2 Option A precedent)

Recommend **Option A**: one PLAN-EVAL over the combined Wave 4 plan (archetype decisions +
split + slice lists), then one IMPL-EVAL per sub-wave. Re-confirm after the post-Wave-3
reconciliation round, since the triggers archetype/runtime scope may shift on the OQ-D verdict.

## Branch model (mirrors Wave 2, applied once Wave 3 merges)

```
feat/package-quality                              (S1 track → main)
└── feat/package-quality-wave4-runtimes             ← THIS umbrella (Draft PR → track, BLOCKED on Wave 3)
    ├── feat/package-quality-wave4-runtimes-4a        ← streams + watchers (opened FIRST, post-reconciliation)
    ├── feat/package-quality-wave4-runtimes-4b        ← workers   (forks off 4a-merged umbrella)
    ├── feat/package-quality-wave4-runtimes-4c        ← sagas     (forks off 4b-merged umbrella)
    └── feat/package-quality-wave4-runtimes-4d        ← triggers  (forks off 4c-merged umbrella; LAST)
```

Sub-branches fork off the umbrella in dependency order (each off the prior sub-wave's
merge, as Wave 2 did 2b←2a, 2c←2b) so each inherits the locked plan + upstream renames.

## Gate emphasis per archetype (from the matrix)

- **Cores (likely A3):** F-13 (saga/runtime invariants) + **Runtime/Aspire validation
  required** + consumer-import required — new vs Waves 2–3. Confirm archetype first (research §4).
- **A5 plugins:** F-2/F-4 n/a; F-13 subtype; **Runtime/Aspire validation required**;
  Browser n/a; consumer-import required; F-10 test-shape required (the 0-test gap).
- **`watchers` (A3):** full structural lift + F-13/runtime if it owns watch-loop behavior.
- All tiers: full-export `deno doc --lint` (MEASURE-FIRST), F-1 file-size, F-6 task hygiene,
  docs scaffold, doctested README.
