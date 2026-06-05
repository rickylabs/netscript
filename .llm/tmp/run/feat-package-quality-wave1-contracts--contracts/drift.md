# Drift Log: Wave 1 — Contracts & schemas

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-06-06 — Research re-baseline

- **What:** The canonical audit (`.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`) claimed slow-type counts of 35, 30, and 1 for config, contracts, and runtime-config. Re-derivation against `feat/package-quality` shows **0 slow types for all three**.
- **Source:** `deno publish --dry-run --allow-dirty` per package.
- **Expected:** Slow types exist and need fixing.
- **Actual:** Workspace `compilerOptions.isolatedDeclarations: true` already enforces explicit types; all slow types were eliminated in prior waves.
- **Severity:** minor
- **Action:** accept — plan updated to reflect real state; slices for slow-type fixes removed.
- **Evidence:** `research.md` findings #1, #12, #21.

## 2026-06-06 — `runtime-config` archetype confirmation

- **What:** Stale audit suggested `runtime-config` might pull toward Archetype 2 (Integration) due to `@std/path` and `Deno.*` usage.
- **Source:** `docs/architecture/doctrine/06-archetypes.md` decision tree.
- **Expected:** Might need ports/adapters.
- **Actual:** Single file-system edge, no second backend planned. Value is still "clarity of types." Archetype 1 confirmed.
- **Severity:** minor
- **Action:** accept — locked in plan.md L1.
- **Evidence:** `plan.md` § Archetype.

## 2026-06-05 — PLAN-EVAL gate-set adjustment

- **What:** The plan's selected Archetype-1 fitness gate set omitted **F-14 (Console-log lint)** and **F-17 (Abstract-derived co-location)**, both marked `required` for Arch 1 in `gates/archetype-gate-matrix.md`.
- **Source:** PLAN-EVAL checklist walk vs. `.llm/harness/gates/archetype-gate-matrix.md`.
- **Expected:** Gate set lists every `required` Arch-1 gate.
- **Actual:** F-14 and F-17 missing; F-14 is materially relevant because L5 removes `runtime-config` console usage and F-14 is its proving gate.
- **Severity:** minor
- **Action:** adjust — added F-14 (mapped to L5) and F-17 (PENDING_SCRIPT, no violation) to `plan.md` §Fitness Gates + Validation Plan and `worklog.md` gate table. Plan-Gate "Gate set selected" box now satisfied; verdict PASS.
- **Evidence:** `plan-eval.md`, `plan.md` §Fitness Gates.

## 2026-06-06 — Config slices 12-13 gate dependency

- **What:** Slice 12 exports `SagaGroupInput` and names `deno doc --lint mod.ts` as its gate, but
  that gate still fails on the known 32 `types.ts` property JSDoc errors assigned to slice 13.
- **Source:** `deno doc --lint mod.ts` after exporting `SagaGroupInput`.
- **Expected:** Slice 12 gate passes after the private-type-ref export fix.
- **Actual:** The private-type-ref issue is fixed, but doc-lint remains blocked until slice 13 adds
  the missing JSDoc. The only honest green gate is after slices 12 and 13 are both present.
- **Severity:** minor
- **Action:** combine the implementation evidence for slices 12 and 13, then continue with slice
  14 in order.
- **Evidence:** `worklog.md` progress rows for slices 12 and 13.

## 2026-06-06 — Config merge subpath type exports

- **What:** Slice 14 planned to export `DatabaseEntry`, `ServiceContributionEntry`, and
  `AppContributionEntry`, but `mergePartialConfig()` also publicly names `NetScriptConfig`.
- **Source:** `deno doc --lint src/merge/mod.ts`.
- **Expected:** Exporting the three contribution entry types is enough.
- **Actual:** Exporting `NetScriptConfig` makes its referenced config section types public through
  the `./merge` subpath too, so the subpath must export the config type family used by
  `NetScriptConfig`.
- **Severity:** minor
- **Action:** export the referenced config types from `src/merge/mod.ts`; keep runtime behavior
  unchanged.
- **Evidence:** `deno doc --lint src/merge/mod.ts` passed after expanding the type exports.

## 2026-06-06 — Config plugin schema public annotation

- **What:** Slice 15 planned to remove `z.ZodType` public annotations by using inferred schema
  types.
- **Source:** `deno doc --lint src/schema/plugins/mod.ts`.
- **Expected:** Removing explicit `z.ZodType` annotations is enough.
- **Actual:** Doc-lint requires explicit types for exported schema constants, and
  `ReturnType<typeof z.object<...>>` still leaks private Zod internals. A local
  `PluginSettingsSchema<T>` parse/safeParse contract keeps the public surface documented without
  naming Zod internals.
- **Severity:** minor
- **Action:** expose schema constants as `PluginSettingsSchema<T>`; runtime values remain Zod
  schemas.
- **Evidence:** `deno doc --lint src/schema/plugins/mod.ts` passed.
