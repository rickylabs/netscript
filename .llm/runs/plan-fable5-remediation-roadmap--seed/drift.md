# Drift Log — plan-fable5-remediation-roadmap--seed

Append-only. Newest last.

## D-1 (2026-08-08, minor, owner directive)

Owner overrides `planning_decisions` effort from lane-policy default **low** to **high** for this
run (long-range meta-framework roadmap). Recorded in `supervisor.md` § overrides.

## D-2 (2026-08-08, significant, owner directive)

Owner explicitly **waives PLAN-EVAL and IMPL-EVAL** for this planning-only seed run. The seed-run
stage G hard stop (`plan-eval.md = PASS` before any board mutation) is vacuously safe because the
run performs **zero board mutation** by charter; the owner personally reviews the plan and decides
on later adversarial passes and filing. No formal evaluator, OpenHands, OpenRouter, or substitute
evaluator session is launched. Recorded in `supervisor.md` and `worklog.md`.

## D-3 (2026-08-08, minor, owner directive)

Claude Workflows for research/synthesis fan-out run **Opus 5** subagents (owner directive),
overriding the `claude_workflow` lane default (Opus 4.8 · low). Contributors only, never
evaluators; supervisor reviews all output before commit. This also invokes the CLAUDE.md
documentation-authoring-adjacent exception: the workflow lane touches **no `packages/`/`plugins/`
source** — output is run-dir planning artifacts only.

## D-4 (2026-08-08, minor, charter deviation from seed-run exemplar)

Stage F (adversarial) and stages G–H are not executed in this run by owner direction. The run ends
at plan-lock + handoff artifacts (stages A–E + I equivalent). The deliverable set is the
`fable-5-remediation-plan/` subtree requested in the charter, which supersedes the exemplar's
folder taxonomy (permitted — seed-run.md fixes stage contracts, not folder names).

## D-5 (2026-08-08, significant, owner ratification)

The owner subsequently ratified the locked plan in-turn and explicitly instructed Stage-H board
filing. This supersedes D-4 only for Stage H: `FILING-MANIFEST.md` was committed before mutation,
the milestone train was executed, 41 issues were filed, and existing-owner amendments were added.
PLAN-EVAL and IMPL-EVAL remain owner-waived for this planning/filing run; the waiver does not carry
into implementation. See `fable-5-remediation-plan/FILING-LOG.md`.
