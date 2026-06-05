# Context Pack: Wave 1 — Contracts & schemas

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave1-contracts--contracts` |
| Branch | `feat/package-quality-wave1-contracts` |
| Base | `feat/package-quality` (Wave 0 `shared` + Wave 0b harness/docs merged) |
| Phase | **Plan & Design — PLAN-EVAL PASS (adjusted)** |
| Units | `@netscript/config`, `@netscript/contracts`, `@netscript/runtime-config` |
| Archetype | 1 — Small Contract (all three) |
| Scope overlay | none (package wave) |

## Goal

Bring the 3 units to the S1 alpha bar: `deno publish --dry-run` with **0 slow-types**, `deno doc --lint` clean, README ≥ 150 LOC, `/docs` per STANDARDS § 7, archetype gate matrix green per unit. **S1 STOPS at publish-clean dry-run — do NOT publish.**

## Status

- [x] `research.md` — re-baselined with REAL dry-run numbers (0 slow types all three)
- [x] `plan.md` — locked decisions, open-decision sweep, risk register, gate set selected
- [x] `worklog.md` — Design checkpoint with public surface, domain vocabulary, 27 commit slices
- [x] `drift.md` — re-baseline drift logged
- [x] `commits.md` — scaffolded (no commits yet)
- [x] `plan-eval.md` — **PLAN-EVAL PASS** (Arch-1 gate set adjusted: added F-14 Console-log, F-17 Abstract-derived co-location)

## Key findings (re-baselined)

| Unit | Slow types | `deno doc --lint` | README LOC | `/docs` | Tests |
|------|-----------:|------------------:|-----------:|---------|-------|
| `@netscript/config` | **0** | 33 errors | 255 ✓ | partial | exists |
| `@netscript/contracts` | **0** | 21 errors | 424 ✓ | partial | exists |
| `@netscript/runtime-config` | **0** | 34 errors | **0** ✗ | **missing** ✗ | **missing** ✗ |

## Locked decisions (8)

1. All three stay Archetype 1.
2. `runtime-config/mod.ts` splits into `src/domain/`, `src/application/`, `src/diagnostics/`.
3. `config/helpers.ts` → `src/domain/saga-inputs.ts`.
4. `contracts/helpers/` → `src/application/` by role.
5. `runtime-config` console usage → structured diagnostics (return values).
6. Fix `private-type-ref` by exporting referenced types.
7. Remove Zod internal (`z.ZodType`) from public signatures.
8. Keep `crud/` at package root (subpath export stability).

## Commit slices

27 slices ordered by dependency: runtime-config (1–10), config (11–18), contracts (19–24), cross-cutting (25–27).

## Operating reminders

- **Plan-Gate is a hard stop.** No implementation slice before PLAN-EVAL returns `PASS`.
- PLAN-EVAL is a **separate session**.
- `jsr-audit` rubric applied to planned surface; risks named.
