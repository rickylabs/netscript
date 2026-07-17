# Lesson: Design must be a gate, not just evidence

## Context

Package-quality Wave 0 (`@netscript/shared`) skipped Plan & Design even though `run-loop.md`
documented a Design checkpoint. Implementation was sound, but decisions that should have been
settled up front were settled during implementation, producing avoidable drift and a late
decision-shift.

## Root cause

Design lived as a `## Design` evidence section inside `worklog.md`, and the only evaluator pass ran
after implementation. Nothing blocked an agent from going straight to slices, and by the time the
evaluator could flag a missing or weak plan the cost was already paid. A carried-in audit that
predated PR #98 also gave false confidence that planning was "done."

## Rule

- Plan & Design is a gated phase ending in PLAN-EVAL (`gates/plan-gate.md`,
  `evaluator/plan-protocol.md`). No implementation slice is committed before a `PASS`.
- Carried-in plans/audits are starting skeletons; re-baseline against current `main` and record what
  changed before locking the plan.
- The reference for a well-run plan PR is netscript-start PR #95.

## Promotion

Promoted to `lessons/` because it is a stable, cross-run mechanic (every wave, every supervisor
program), per the harness promotion rule.

## A "fix-forward" that grows a tool surface is no longer a fix-forward

Source run: `beta10-non-dashboard--claude` (PR #715). IMPL-EVAL finding **F6**.

A stream can be briefed as a small directed fix — "repair the failing CI check, rewrite two READMEs"
— and then, legitimately following the evidence, grow into: two repo-tooling rewrites, a new CI
gate, a new validation tool, an exclusion change to root `deno.json`, and a public-docs rewrite. At
that point it is **new scope**, and the Plan-Gate applies to it, regardless of how it was briefed.

That run skipped it. It began at "Slice 1" with no `research.md`, no `plan.md`, no PLAN-EVAL, and no
`## Design` checkpoint of its own. The umbrella's earlier Plan-Gate covered none of the new surface.
What the opposite-family IMPL-EVAL then found was not a coincidence — its own synthesis was that the
missing Plan-Gate _"explains why the fmt mixed-batch invariant and the extra tagline scope were not
captured before implementation."_ **The process gap and the defects were one failure, not two:** a
design pass would have had to state the crash-vs-finding invariant explicitly, and stating it is
what makes the mixed-batch case obvious.

### Rule

- The Plan-Gate is triggered by **the scope you end up in**, not the scope you were briefed with. If
  a fix-forward acquires a new tool, a new gate, a new public-doc surface, or a change to root build
  config, **stop and gate it** before the next slice.
- The tell is cheap to check: _am I adding a file that will run in CI, or that a user will read?_ If
  yes, it needs a design statement of its invariants.
- **Never manufacture a retroactive plan to satisfy this.** Writing `plan.md` after the fact to
  clear a gate is evidence-faking, and it destroys the only signal the artifact carries. Record it
  as drift with the honest severity and move on — a truthful `FAIL` is worth more than a fabricated
  `PASS`.
