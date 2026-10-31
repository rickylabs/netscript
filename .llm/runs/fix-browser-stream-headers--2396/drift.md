# Drift

2026-10-31: Adopt existing PR branches instead of opening a duplicate on the dispatcher branch,
as explicitly required by the operator adoption instructions. Existing draft 2421 satisfies the
early draft review surface. Owner addendum keeps 2422/2423 non-draft. Explicit Refs-only policy
wins over the generic closing-keyword template. Final canonical publication uses the requested
file handoff. RTK absent; raw focused inspection is the available fallback.

2026-10-31 PLAN-EVAL round 1: FAIL_PLAN on trigger/post-publish handling, workflow push
capability, sibling review ownership and unnamed new file scope. Plan now records exact
new S3 paths and canonical carriers before writing them; assigns sibling read-only review;
verifies workflow scope; delegates CI label arming to the coordinator as explicitly authorized;
and proposes canonical post-publish production-gate debt for the first 0.0.9 canary.
No implementation began; same evaluator is re-steered for round 2.
