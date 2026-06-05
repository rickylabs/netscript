# Context Pack: Wave 1 — Contracts & schemas

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave1-contracts--contracts` |
| Branch | `feat/package-quality-wave1-contracts` |
| Base | `feat/package-quality` (Wave 0 `shared` + Wave 0b harness/docs merged) |
| Phase | Research / Plan & Design (not started) |
| Units | `@netscript/config`, `@netscript/contracts`, `@netscript/runtime-config` |
| Archetype | 1 — Small Contract (confirm per unit) |
| Scope overlay | none (package wave) |

## Goal

Bring the 3 units to the S1 alpha bar: `deno publish --dry-run` with **0 slow-types**,
`deno doc --lint` clean, README >= 150 LOC, `/docs` per STANDARDS § 7, archetype gate matrix
green per unit. **S1 STOPS at publish-clean dry-run — do NOT publish.**

## Status

Branch + run dir scaffolded by the reviewer. `research.md` is a **reviewer seed** — verify against
the current tree and extend. `plan.md` / `worklog.md` / `drift.md` / `commits.md` to be scaffolded
by the generator from `.llm/harness/templates/`.

## Operating reminders (harness v2, 8-phase)

- Run loop is now **8 phases** with a **Plan-Gate**. Do NOT commit an implementation slice before
  **PLAN-EVAL** returns `PASS` (separate session). See `.llm/harness/workflow/run-loop.md` § 4 and
  `.llm/harness/gates/plan-gate.md`.
- `jsr-audit` is a **Plan-Gate checklist item** for this package wave — apply its rubric to the
  PLANNED public surface before slicing.
- The canonical audit under `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
  is a **stale skeleton** (predates the plugin-platform merge) — re-baseline, do not trust counts.
- Doctrine now lives at `docs/architecture/doctrine/` (not `.llm/research/...`).
