# Context Pack

## Objective

Resolve #1812 by making the existing seventeen-entrypoint workers-core table visible to
`docs:exports-drift`, adopting an evidence-based coverage policy, regenerating derived docs, and
opening the harness PR at `status:impl`.

## State

- Baseline: `5197e70b7`
- PLAN-EVAL: N/A, justified in `plan.md` and `worklog.md`
- Implementation session: `01a05537-6ff3-7792-8d24-c0bd0a47b8e6`
- Coverage: `entrypoints-only`; 334 of 377 unique real exports are absent from the page
- All three generators and required functional/corpus/type-check gates pass with exit 0.
- Implementation commit: `f331e6a72`
- The complete required gate set passed at that implementation head; a final evidence-head pass,
  status/lock/provenance checks, push, PR, and separate-session IMPL-EVAL remain pending

## Scope guard

Do not change `packages/plugin-workers-core/**`, the other #1777 pages/mappings, or lifecycle status
beyond `status:impl`.
