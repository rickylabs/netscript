# Context Pack: S1 — Package Quality (supervisor)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality--supervisor` |
| Branch | `feat/package-quality` (off `main`) |
| Current phase | `implement` (Waves 0, 0b, 1 `merged`; Wave 2 in Plan & Design — draft PR #8) |
| Archetype | per wave (A1–A6) + `SCOPE-docs.md` |
| Scope overlays | `SCOPE-docs.md` |

## Current State

S1 runs in the public repo `rickylabs/netscript` off `feat/package-quality`
(@ `4c57867`). **Waves 0, 0b, and 1 are `merged`; Wave 2 is `active` (Plan &
Design, draft PR #8).** Goal unchanged: bring all **27 publishable units** to the
alpha bar (`deno publish --dry-run` 0 slow-types, `deno doc --lint` clean,
README ≥ 150 LOC, `/docs` per STANDARDS § 7, archetype matrix green).

Progress: **4 / 27 units merged** (`shared`; `runtime-config`, `config`,
`contracts`). Wave 2 covers the next **8** A2 adapter units.

## Completed

- Supervisor scaffold (`plan.md`, `phase-registry.md`, 7 waves → 27 units).
- **Wave 0** (`@netscript/shared`) merged — PR #3 / `eb8ae44`.
- **Wave 0b** (inserted) merged — harness two-gate model + `.agents` docs/skills
  (PR #4 `82ad2a2`, PR #5 `d5d8e5f`, D4 drop `76fbeb7`).
- **Wave 1** (contracts & schemas) merged — PR #7 / `4c57867`; all 3 units 0 slow
  types; e2e:cli `41/0/0`.

## In Progress

- **Wave 2 — Integration adapters** (logger, telemetry, aspire, kv, database,
  prisma-adapter-mysql, queue, cron). Reviewer-staged: branch+worktree
  `wave2-adapters`, nested run `feat-package-quality-wave2-adapters--adapters`
  (seeded `research.md` + `context-pack.md`), draft **PR #8**. Agent doing
  Research → Plan & Design; **stops at PLAN-EVAL**.

## Next Steps

1. Wave 2 agent runs the `MEASURE-FIRST` re-baseline, resolves OQ-1 (sub-wave
   split) + OQ-2..OQ-7, writes `plan.md` + `worklog.md` Design checkpoint.
2. **Separate-session PLAN-EVAL** against `gates/plan-gate.md` — verify full A2
   matrix + `< 30`-slice budget. No slice before `PASS`.
3. On `PASS`: implement Wave 2 slices (per the sub-wave decision) → IMPL-EVAL → merge.
4. Proceed Wave 3 → Wave 6 in order; never start a wave before the prior is `merged`.

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
| Static | GREEN through Wave 1 | per-wave nested `worklog.md`; Wave 1 all 0 slow types |
| Fitness | GREEN through Wave 1 | A1 matrix per Wave 1 nested run |
| Runtime | N/A | S1 is not a runtime run (Aspire E2E is S4); `e2e:cli` used as merge-readiness gate |
| Consumer | GREEN through Wave 1 | Wave 1 re-checked `cli`, `plugins/sagas`, `plugins/workers` |

## Open Questions

- Confirm whether any `*-core` unit already at 0 slow-types still needs a README
  / `/docs` pass (likely yes — STANDARDS § 6–7 gate it regardless).

## Drift and Debt

- Drift: 1 seeded entry (29→27 surface reconciliation).
- Debt: inherit `.llm/harness/debt/arch-debt.md` (telemetry instrumentation,
  config plugin schema, aspire `./helpers`) — close per owning wave.

## Commits

- See `commits.md` (appended per wave).
