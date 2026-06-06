# Escalation — Wave 2 sub-wave split (OQ-1)

| Field | Value |
|-------|-------|
| Date | 2026-06-07 |
| Trigger | Wave 2 generator Plan & Design resolved OQ-1 by splitting the wave |
| Category | Dependency-graph change + rescope (group structure) |
| Source | `…/feat-package-quality-wave2-adapters--adapters/plan.md` § Locked decisions 1; `drift.md` row 2026-06-06 OQ-1 |
| Status | **RESOLVED 2026-06-07** — Option A; PLAN-EVAL `PASS` (cycle 2, PR #8 comment 4640656448) |

## What triggered it

Wave 1 spent 27 slices for 3 units. Wave 2 has 8 units; at comparable density it
exceeds the Plan-Gate `< 30` slice hard cap. The generator resolved OQ-1 by
splitting Wave 2 into **three sub-waves**, each (per the plan) with its own branch,
PR, Plan-Gate, and evaluator pass:

| Sub-wave | Units | Branch | Slices (plan table) |
|----------|-------|--------|---------------------|
| 2a — observability/host | logger, telemetry, aspire | `feat/package-quality-wave2-adapters-2a` | 10 |
| 2b — data | kv, database, prisma-adapter-mysql | `feat/package-quality-wave2-adapters-2b` | 23 |
| 2c — messaging | queue, cron | `feat/package-quality-wave2-adapters-2c` | 17 |

Each sub-wave's slice count is `< 30`. Dependency order **2a → 2b → 2c** is forced
by the natural chain (kv → logger; queue → kv). The existing draft **PR #8** was
opened for a single Wave-2 group.

## Impact assessment (escalation.md § 3)

1. **Affects a pending group's plan?** No pending top-level wave (3–6) changes.
2. **Changes group ordering?** Yes — Wave 2 becomes an ordered sub-sequence 2a→2b→2c.
3. **Changes the dependency graph?** Within Wave 2 only; Wave 3 still depends on "Wave 2 complete" (all three sub-waves merged).
4. **User decision needed?** Yes — see Decision below.

Because answers 2–4 are "yes", supervisor.md § 4 requires briefing the user before
launching implementation.

## Decision required — PLAN-EVAL routing

The generator wrote **one combined `plan.md`** covering all three sub-waves
(shared research, shared gate selection, all 7 OQ resolutions). Two routing options:

- **Option A (recommended): 1 PLAN-EVAL now over the combined plan.md, then 3 sub-PRs
  each with its own IMPL-EVAL.** The planning is a single coherent artifact; one
  PLAN-EVAL validates the split, the OQ resolutions, the full A2 matrix, and that
  each sub-wave is `< 30`. Implementation forks into 2a→2b→2c, each a separate
  reviewable code increment merged independently with its own IMPL-EVAL (code differs
  per sub-PR; planning does not). Lightest faithful path: 1 PLAN-EVAL + 3 IMPL-EVALs.
- **Option B (plan's literal text): 3 PLAN-EVALs + 3 IMPL-EVALs**, splitting the
  combined plan into three. More sessions; largely redundant since the three share
  research/gates/OQ resolutions.

## Resolution (2026-06-07)

- [x] Routing option chosen: **Option A** — 1 PLAN-EVAL over the combined plan + 3 IMPL-EVALs (one per sub-PR). Confirmed by the PLAN-EVAL PASS comment: "Implementation may proceed slice-by-slice per the 2a → 2b → 2c sub-wave decision, each with its own IMPL-EVAL."
- [x] `phase-registry.md` Wave 2 card updated to the 2a/2b/2c sub-group structure.
- [x] PLAN-EVAL dispatched (separate session, via PR #8 comment): cycle 1 `FAIL_PLAN` (judged the pre-plan staging state — plan.md absent), then generator wrote plan + Design checkpoint (`1933bce`), cycle 2 **`PASS`**.
- [x] Escalation filed before first sub-wave PR (this file) — satisfies the evaluator's non-blocking follow-up #2.

### PLAN-EVAL in-place fixes (cycle 2, by the evaluator per instruction #10)

1. **Gate set** — added **F-16 / F-17 / F-18** to the plan's A2 fitness set (the plan table had stopped at F-15). The matrix marks all three `required` for Arch 2.
2. **kv slice clarified** — `packages/kv/adapters/` already exists, so slice 2b-1 is a *merge into* `adapters/`, not a clean rename.

### Carried follow-up for every sub-wave implementer (evaluator note)

- Re-run `deno publish --dry-run --allow-dirty` (slow-types) and `deno doc --lint` at slice time across **every** `exports` entrypoint (root + all subpaths), not only `mod.ts`. The PLAN-EVAL evaluator had no `deno` available, so the recorded re-baseline numbers are accepted as generator evidence, not independently re-run.

### Doc-drift to fix (cross-cutting, promote)

- `archetypes/ARCHETYPE-2-integration.md`'s gate list disagrees with `gates/archetype-gate-matrix.md` (matrix has F-16/F-17/F-18 required; archetype doc list lagged). **Matrix governs.** Reconcile the archetype doc or add a debt entry so Wave 3+ does not re-inherit the stale list. See supervisor `drift.md`.
