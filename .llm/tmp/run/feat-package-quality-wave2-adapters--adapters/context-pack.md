# Context Pack: Wave 2 — Integration adapters (A2)

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave2-adapters--adapters` |
| Branch | `feat/package-quality-wave2-adapters` |
| Base | `feat/package-quality` @ `4c57867` (Wave 0 + 0b + Wave 1 merged) |
| Phase | **Research → Plan & Design ONLY** (stop at Plan-Gate; do not implement) |
| Units (8) | `logger`, `telemetry`, `aspire`, `kv`, `database`, `prisma-adapter-mysql`, `queue`, `cron` |
| Archetype | 2 — Integration (all eight) |
| Scope overlay | `SCOPE-docs.md` (README ≥ 150 + `/docs` per STANDARDS § 7) |

## Goal

Bring the 8 A2 units to the S1 alpha bar: `deno publish --dry-run` with **0
slow-types**, `deno doc --lint` clean, README ≥ 150 LOC, `/docs` per STANDARDS
§ 7, archetype A2 matrix green per unit, each adapter's `./testing` port-contract
entrypoint present. **S1 STOPS at publish-clean dry-run — do NOT publish, bump
versions, or wire OIDC.**

## Authority (nest, do not rewrite)

- `phase-registry.md` → **Wave 2** card (units, order, success criteria, inherited debt).
- Supervisor `plan.md` (S1) → Fitness Gates + Validation Plan + Axioms.
- `gates/plan-gate.md` + `evaluator/plan-protocol.md` → the Plan-Gate you must pass.
- `archetypes/ARCHETYPE-2-integration.md` → A2 folder shape, gate order, false-done states.
- Carried-in nested `plan_{logger,telemetry,aspire,kv,database,queue,cron}.md` — **STALE counts, re-baseline before trusting.**
- `docs/architecture/STANDARDS.md` §6–7, `docs/architecture/DOCS-STRUCTURE.md`, `docs/architecture/PUBLIC-SURFACE-PATTERNS.md`, `docs/architecture/doctrine/06-archetypes.md#archetype-2--integration`.

## Status (this phase)

- [x] `research.md` — reviewer-seeded **structural** re-baseline (all 8 units), stale audit flagged, dynamic gates marked `MEASURE-FIRST`.
- [x] `context-pack.md` — this file.
- [ ] **Research step 1** — run `tools/fitness/release-readiness.ts` + per-unit `deno publish --dry-run` / `deno doc --lint`; record REAL numbers; log drift.
- [ ] `plan.md` — locked decisions, **open-decision sweep (resolve OQ-1..OQ-7)**, commit slices (< 30 — see OQ-1), risk register, **full A2 gate set**, deferred scope.
- [ ] `worklog.md` — Design checkpoint: per-unit port/adapter shape, composition root, required permissions, consumer-import impact, vocabulary renames.
- [ ] `drift.md` — re-baseline delta + every subpath/folder rename.
- [ ] `commits.md` — scaffold (no commits yet).
- [ ] **Open draft PR → STOP for separate-session PLAN-EVAL.** Do not commit an implementation slice before PLAN-EVAL `PASS`.

## Key findings (structural re-baseline — confirm dynamics first)

| Unit | README | `/docs` | Tests | Folder vocab flag | Likely effort |
|------|-------:|:-------:|:-----:|-------------------|---------------|
| logger | 202 ✓ | ✗ | ✓ | flat (no `src/`) | docs + tasks |
| telemetry | 233 ✓ | ✓ | ✓ | canonical | **verify + docs-parity** |
| aspire | 369 ✓ | ✓ | ✓ | `./helpers` alias (drop) | **verify + drop alias** |
| kv | 155 ⚠ | ✗ | ✓ | `bridges/`,`core/` (AP-16?) | docs + layering |
| database | **✗** | ✗ | **✗** | **`interfaces/` AP-17** | **heavy (from scratch — the "runtime-config")** |
| prisma-adapter-mysql | **123 ✗** | ✗ | **✗** | `examples/`, `skipLibCheck` | README + docs + tests |
| queue | 251 ✓ | ✗ | ✓ | **`interfaces/` AP-17, `utils/` AP-16** | docs + renames |
| cron | 175 ✓ | ✗ | ✓ | **`interfaces/` AP-17** | docs + rename |

## The decision that gates everything else: OQ-1 (slice budget)

Wave 1 used **27 slices for 3 units**. 8 units at that density blows the
Plan-Gate `< 30 slices` cap. **Resolve OQ-1 first.** Reviewer recommendation:
**split Wave 2 into sub-waves** so each sub-PR stays reviewable and under cap, e.g.

- **2a — observability/host (verify-heavy):** logger · telemetry · aspire
- **2b — data (heavy):** kv · database · prisma-adapter-mysql
- **2c — messaging:** queue · cron

If you split, this run produces the **plan for the whole wave** but the draft PR /
implementation proceeds **sub-wave by sub-wave**, each with its own Plan-Gate-clean
slice list (< 30) and its own evaluator pass. Record the split decision in
`drift.md` + escalate per `supervisor.md` § 4 if it changes the registry's Wave-2
single-group assumption.

## A2 gate set (select ALL — do not under-select; this is the Wave 1 PLAN-EVAL trap)

Per `archetypes/ARCHETYPE-2-integration.md`:
- **Static:** package/slice `deno check`, `fmt --check`, `lint`, `deno doc --lint`, `deno publish --dry-run` (0 slow types).
- **Fitness:** **F-1..F-12 + F-14 + F-15** (file size, no console in non-presentation, ports-not-interfaces, named adapters not flagged helpers, composition-root defaults, etc.).
- **Consumer:** required for every `interfaces/`→`ports/` rename, `utils/`→role rename, aspire `./helpers` drop, and any adapter/subpath change. Grep + `deno check` each consumer (`packages/cli`, `plugins/*`, `services/*`, `sdk`).
- **Runtime:** where an adapter is exercised against a real backend/Aspire resource.
- **Merge-readiness:** `deno task e2e:cli` PASS before the wave (or each sub-wave) is merge-ready (AGENTS.md).

## Operating reminders

- **Re-baseline, do not trust the carried-in counts** (the Wave 0/1 lesson). Run the dry-run/doc-lint sweep first; the seed marks them `MEASURE-FIRST`.
- **No back-compat shims** (alpha): rename `interfaces/`→`ports/`, drop aspire `./helpers`, delete dead aliases — fix consumers, don't alias.
- **Defensive I/O** (Wave 1 review): timers/polling/connections (cron, queue, kv, db) need abort/cleanup + malformed-input tests.
- **Runnable docs** (DOCS-STRUCTURE): `jsr:` specifiers + `tests/_fixtures/docs-examples_test.ts` doctests; JSDoc examples cite real exports.
- **Disjoint write scope:** stay within `packages/{logger,telemetry,aspire,kv,database,prisma-adapter-mysql,queue,cron}/` + this run dir. Consumer edits only where a rename forces them.
- **Do NOT self-evaluate.** Finish Research + Plan & Design, open the draft PR, and **hand off to a separate PLAN-EVAL session.** No implementation slice before PLAN-EVAL `PASS`.
