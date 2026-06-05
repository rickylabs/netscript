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
