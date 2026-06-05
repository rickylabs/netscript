# Context Pack: S1 — Package Quality (supervisor)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality--supervisor` |
| Branch | `feat/package-quality` (off `main`) |
| Current phase | `plan` (scaffolded; awaiting Wave 0 launch) |
| Archetype | per wave (A1–A6) + `SCOPE-docs.md` |
| Scope overlays | `SCOPE-docs.md` |

## Current State

S1 runs in the public repo `rickylabs/netscript`. S0 is merged to `main`
(`9aced47`). This branch (`feat/package-quality`) carries the prepared S1
supervisor scaffold and the run artifacts. No wave has started yet. The goal is
to bring all **27 publishable units** (23 packages + 4 plugins, all
`0.0.1-alpha.0`) to the alpha bar: `deno publish --dry-run` with **0 slow-types**,
`deno doc --lint` clean, README ≥ 150 LOC, `/docs` per STANDARDS § 7, archetype
gate matrix green per unit.

## Completed

- S1 supervisor `plan.md` + `phase-registry.md` (7 waves, reconciled to 27 units).
- Carried the master program run + the canonical package-jsr run into this repo.
- Seeded `worklog.md`, `drift.md` (reconciliation entry), `commits.md`.

## In Progress

- None. Clean hand-off boundary; Wave 0 not yet launched.

## Next Steps

1. **Wave 0 baseline re-audit**: `deno run -A tools/fitness/release-readiness.ts
   --out .llm/tmp/run/feat-package-quality--supervisor/audit --include-plugins`;
   log the delta vs the 2026-05 inventory in `drift.md`.
2. Launch **Wave 0** (`@netscript/shared`) per `supervisor.md` § 2: branch
   `feat/package-quality-wave0-foundation`, nested sub-run, Design checkpoint,
   slices, gates, **separate evaluator**, merge `--no-ff`.
3. Proceed Wave 1 → Wave 6 in order; never start a wave before the prior is `merged`.

## Key Decisions

| Decision | Source | Notes |
|----------|--------|-------|
| Nest, don't rewrite, the canonical run | `RELEASE-PROGRAM.md` § 10 S1 | `…package-jsr-alpha-release/` |
| 0 slow-types is the bar (drop `--allow-slow-types`) | S1 card gates | per unit dry-run |
| Lockstep `0.0.1-alpha.0` | program invariant | no unit forks its line |

## Files Changed

| Path | Status | Notes |
|------|--------|-------|
| `.llm/tmp/run/feat-package-quality--supervisor/worklog.md` | new | this run |
| `.llm/tmp/run/feat-package-quality--supervisor/context-pack.md` | new | this file |
| `.llm/tmp/run/feat-package-quality--supervisor/drift.md` | new | seeded reconciliation |
| `.llm/tmp/run/feat-package-quality--supervisor/commits.md` | new | seeded |

## Gates

| Gate family | Current status | Evidence |
|-------------|----------------|----------|
| Static | PENDING | Wave 0 baseline re-audit not yet run |
| Fitness | PENDING | per-wave |
| Runtime | N/A | S1 is not a runtime run (Aspire E2E is S4) |
| Consumer | PENDING | proven as each wave's dependents re-check |

## Open Questions

- Confirm whether any `*-core` unit already at 0 slow-types still needs a README
  / `/docs` pass (likely yes — STANDARDS § 6–7 gate it regardless).

## Drift and Debt

- Drift: 1 seeded entry (29→27 surface reconciliation).
- Debt: inherit `.llm/harness/debt/arch-debt.md` (telemetry instrumentation,
  config plugin schema, aspire `./helpers`) — close per owning wave.

## Commits

- See `commits.md` (appended per wave).
