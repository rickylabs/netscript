# Context Pack: 5d2 builders — `definePage` DSL decomposition

## Run Metadata

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Run ID         | `feat-package-quality-wave5-apps--5d2-builders`      |
| Branch         | `feat/package-quality-wave5-apps-5d2-builders`       |
| Current phase  | `plan` — revised and ready for PLAN-EVAL            |
| Archetype      | A3 Runtime/Behavior + A4 DSL/Builder + SCOPE-frontend |
| Scope overlays | frontend                                             |

## Current State

`design.md`, `plan.md`, and `drift.md` are revised in place.  
Phase-1 research is reused; measurement baselines stand.  
The plan now contains a locked one-plan decision, a 28-slice commit lock, the full A3 + SCOPE-frontend
gate set, a jsr-audit rubric, and completed design sections.

## Completed

- Read AGENTS.md, netscript-harness skill, umbrella plan, handover, phase-1 research, A3/A4/SCOPE-frontend archetypes, plan-gate matrix, run-loop.
- Analyzed PLAN-EVAL `FAIL_PLAN` verdict and resolved all blocking findings.
- Completed `design.md` §1–§7 (decomposition, DSL market bar, island/partial bridge, RFC-14 seams,
  browser validation, test decomposition, risks).
- Completed `plan.md` with locked decisions, 28-slice lock, gate mapping, jsr-audit rubric, and
  required tail section.
- Appended `drift.md` with D-5d2-1 (form-package visibility/JSDoc), D-5d2-2 (F-18 sub-barrel
  opt-outs), and D-5d2-3 (slow-type opt-in pending).

## In Progress

- Supervisor / PLAN-EVAL review of revised artifacts.

## Next Steps

1. PLAN-EVAL passes.
2. Implementation begins per slice lock (waits for 5d1 merge).
3. First implementation slice: add surface snapshot test and fix builders-local doc-lint errors.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| One plan, not two | Locked decision L-6 | 28 slices fit under the 30 cap; single coherent sequence. |
| Public surface unchanged | umbrella plan §Final public surface | No new exports, no renamed types. Surface snapshot test in slice 1 locks this. |
| Role-named subfolders | A4 archetype + handover | builder / runtime / navigation / types / internal under `define-page/`. |
| 5d2 fixes form-package leaks | Locked decision L-7 | Visibility + JSDoc only; drift D-5d2-1 records cross-unit touch. |
| No new subpath exports | Locked decision L-8 | Existing `./builders` export remains sufficient. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/design.md` | revised | all 7 sections complete |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/plan.md` | revised | 28 slices, gate set, tail section |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/drift.md` | revised | D-5d2-1, D-5d2-2, D-5d2-3 |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/context-pack.md` | revised | resume-ready state |
| `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/worklog.md` | revised | design checkpoint entry |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | planned | Slice 27 will run `deno check` + `deno publish --dry-run`. |
| Fitness | planned | Slices 25–26 will run `deno task arch:check` / per-script gates. |
| Runtime | planned | Slice 24 playground routes; slice 25 test suite. |
| Consumer | planned | No public API changes; surface snapshot test in slice 1 proves this. |

## Open Questions

- Exact fixture route names (deferred to slice 24; categories chosen).
- Whether to add slow-type opt-in in `packages/fresh/deno.json` (deferred to slice 26).

## Drift and Debt

- D-5d2-1: 5d2 touches form-package public surface visibility/JSDoc.
- D-5d2-2: F-18 sub-barrel opt-outs required for `builder/mod.ts`, `runtime/mod.ts`,
  `navigation/mod.ts`, `define-page/mod.ts`.
- D-5d2-3: Potential slow-type opt-in for `FieldDescriptorMap` / `RuntimeFormState`.

## Commits

- Pending: commit of revised `design.md`, `plan.md`, `drift.md`, `context-pack.md`, `worklog.md`.
