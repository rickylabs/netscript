# PLAN-EVAL — Wave 6 `@netscript/cli` A6-v2 promotion

> Skeleton for the **evaluator session** (separate from the generator). Follow
> `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` + `archetypes/ARCHETYPE-6-cli-tooling.md`
> + `gates/archetype-gate-matrix.md`. Read `research.md`, `plan.md`, `worklog.md` (§Design), `drift.md`.
> Emit exactly **PASS** or **FAIL_PLAN**. Hard stop before any implementation.

## Inputs reviewed

- [ ] research.md (1,609 lines)
- [ ] plan.md
- [ ] worklog.md (§Design)
- [ ] drift.md
- [ ] context-pack.md

## Plan-Gate checklist

| Item | Verdict | Notes |
| ---- | ------- | ----- |
| Research present & current | | |
| Decisions locked (LD-1..LD-8) | | |
| Open-decision sweep (5 maintainer Qs; only Q2 "must resolve now", resolved to slice 2) | | |
| Commit slices (<30, each names what-it-proves + gate + files) | | |
| Risk register present (R-1..R-15) | | |
| A6 gate set selected (F-1..F-18 incl. F-CLI-3/4/27) | | |
| Deferred scope explicit (cli publish withheld; new deploy targets; toolchain pins) | | |
| jsr-audit surface scan (cli publish withheld but dry-run green) | | |
| Single-file ownership vs upgrade run (LD-8) unambiguous | | |
| Slice-2 load-bearing gate (`scaffold.runtime` 41/41 blocks merge) present | | |
| AP-1 closure path defined (slice 6.5 verdict) | | |

## A6-specific scrutiny

- [ ] No surface↔surface import introduced (F-CLI-3) — writers under `maintainer/features/codegen/`.
- [ ] Kernel never imports surfaces (F-CLI-4).
- [ ] `CliCommandRegistry` concrete to Cliffy (LD-2) closes F-CLI-27.

## Verdict

`<PASS | FAIL_PLAN>`

## If FAIL_PLAN

- Cycle: `<1|2>` of 2 (then escalate).
- Required changes:
