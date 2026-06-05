# PLAN-EVAL Protocol

PLAN-EVAL is the harness's first evaluator pass. It judges the **plan**, not the
code, and runs at the Plan-Gate before any implementation slice is committed.
PLAN-EVAL is always a **separate session** from the generator and from IMPL-EVAL.

## Inputs

Read, in order:

1. `gates/plan-gate.md` — the checklist you enforce.
2. `evaluator/verdict-definitions.md` — verdict meanings, including `FAIL_PLAN`.
3. The run's `research.md`, `plan.md`, and the `## Design` section of
   `worklog.md`.
4. The selected archetype profile, any scope overlays, and
   `gates/archetype-gate-matrix.md`.
5. `debt/arch-debt.md` for relevant open debt.

## Procedure

1. Verify `research.md` exists and that any carried-in material was re-baselined
   against current `main`. Spot-check at least one load-bearing finding against
   the tree.
2. Walk the `gates/plan-gate.md` checklist box by box. For each, cite the plan
   location that satisfies it or mark it unchecked.
3. Run the open-decision sweep yourself: list any decision the plan leaves open
   that would force rework if deferred. If you find one the plan did not flag,
   that is an automatic unchecked box.
4. (Package/plugin waves) Confirm the jsr-audit surface scan is present and that
   each named risk has a slice that addresses it.
5. Confirm commit slices are ordered, sized (< 30), and each names its proving
   gate and files.

## Output

Write `plan-eval.md` from `templates/plan-eval.md`. Emit exactly one verdict:

- `PASS` — every checklist box satisfied; implementation may begin.
- `FAIL_PLAN` — list each unchecked box and the specific fix required.

Do not evaluate code, run the implementation gate set, or comment on slices that
do not yet exist. That is IMPL-EVAL's job (`evaluator/protocol.md`).

## Loop limit

Two `FAIL_PLAN` cycles are allowed. After the second, escalate to the user with
the unresolved items.
