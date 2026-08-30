# Context Pack

## Objective

Resolve #1793 by making five single-root package reference pages visible to `docs:exports-drift`,
adopting their evidence-based coverage policies, regenerating derived docs, and opening the
harness PR at `status:impl`.

## State

- Baseline: `96d44758d`
- PLAN-EVAL: N/A, justified in `plan.md` and `worklog.md`
- Implementation session: `01a054ae-d5dc-79f2-8e14-9ee4c4b14cab`
- Coverage: `runtime-config` complete; the other four entrypoints-only for the reasons in
  `research.md`
- All three generators and required functional/corpus/type-check gates pass with exit 0.
- Final whitespace/lock checks, commit, push, PR, and separate-session IMPL-EVAL: pending

## Scope guard

Do not change `packages/**`, the other #1777 pages/mappings, or lifecycle status beyond
`status:impl`.
