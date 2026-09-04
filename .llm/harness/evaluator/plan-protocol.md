# PLAN-EVAL Protocol

PLAN-EVAL conditionally evaluates the plan before implementation. Select it for genuinely critical
or complex architecture, public-contract, multi-package, destructive, release/runtime, or unresolved
design decisions. Routine mechanical work records `PLAN-EVAL: N/A` with a concrete reason.

The evaluator is a separate session from the generator. Select it from the workload tier in
`workflow/lane-policy.md`; skip candidates from the selected plan generator's vendor family and use
the first healthy, capable, allowance-proven transport in the canonical provider order. The
supervisor triggers the evaluator. Record tier, requested and observed route identity, fallback
reason, session, and exact head. OpenRouter paid-training eligibility is allowed by owner preference
and is not a routing blocker.

## Inputs

Read, in order:

1. `gates/plan-gate.md` — the checklist you enforce.
2. `evaluator/verdict-definitions.md` — verdict meanings, including `FAIL_PLAN`.
3. The run's `research.md`, `plan.md`, and the `## Design` section of `worklog.md`.
4. The selected archetype profile, scope overlays, and `gates/archetype-gate-matrix.md`.
5. `debt/arch-debt.md` for relevant open debt.

## Procedure

1. Verify `research.md` exists and carried-in material was re-baselined against current `main`.
   Spot-check at least one load-bearing finding against the tree.
2. Walk `gates/plan-gate.md` box by box. Cite the plan location or mark the box unchecked.
3. Run the open-decision sweep yourself. Any unflagged decision that could force rework is an
   automatic unchecked box.
4. For package/plugin waves, confirm the jsr-audit surface scan and one slice per named risk.
5. Confirm commit slices are ordered, sized below 30 files, and name files plus proving gates.

## Verdict and loop policy

Write `plan-eval.md` from `templates/plan-eval.md` and emit exactly one verdict:

- `PASS` — every checklist box is satisfied; implementation may begin.
- `FAIL_PLAN` — list every unchecked box and its specific correction.

Re-steer the same evaluator session on every iteration. For a fixable plan, follow the tier policy:

| Tier            | Policy                                                              |
| --------------- | ------------------------------------------------------------------- |
| simple          | no PLAN-EVAL                                                        |
| straightforward | no roundtrip; evaluator immediately edits the plan                  |
| feature         | maximum two cycles; evaluator edits a fixable plan on cycle two     |
| complex         | maximum three cycles; evaluator edits a fixable plan on cycle three |
| architecture    | maximum one cycle; a second failure is an owner decision            |

A total rejection or genuinely human-only choice escalates instead of being edited in place. Do not
evaluate code or implementation gates; those belong to IMPL-EVAL.
