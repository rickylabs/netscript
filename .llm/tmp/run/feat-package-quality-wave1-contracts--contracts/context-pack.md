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
- [x] Slice 1 — `runtime-config` domain types scaffolded; `deno doc --lint src/domain/types.ts` passed.
- [x] Slice 2 — `runtime-config` loader extracted; `deno check src/application/loader.ts` passed.
- [x] Slice 3 — `runtime-config` watcher extracted with no `console.*` in `src/`; `deno check src/application/watcher.ts` passed.
- [x] Slice 4 — `runtime-config` structured summary added; `deno check src/diagnostics/summary.ts` passed.
- [x] Slice 5 — `runtime-config` root barrel rewritten; `deno doc --lint mod.ts` passed.
- [x] Slice 6 — `runtime-config` `deno.json` metadata/tasks/publish config added; `deno publish --dry-run --allow-dirty` passed.
- [x] Slice 7 — `runtime-config` README added; line-count gate returned 346 lines.
- [x] Slice 8 — `runtime-config` docs scaffold added; docs file-list gate returned 8 files.
- [x] Slice 9 — `runtime-config` tests added; `deno test --allow-all` passed with 8 tests.
- [x] Slice 10 — `runtime-config` gate sweep passed after lint/format/example fixes; current README line count is 339.
- [x] Slice 11 — `config/helpers.ts` renamed to `src/domain/saga-inputs.ts`; `deno check mod.ts` passed.
- [x] Slices 12-13 — `SagaGroupInput` exported and remaining `types.ts` JSDoc added; `deno doc --lint mod.ts` passed.
- [x] Slice 14 — config merge subpath private-type-ref fixed; `deno doc --lint src/merge/mod.ts` passed.
- [x] Slice 15 — config plugin schemas documented and Zod internal public type leak removed; `deno doc --lint src/schema/plugins/mod.ts` passed.
- [x] Slice 16 — config docs recipes and advanced page added; docs file-list gate returned 7 files.

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
