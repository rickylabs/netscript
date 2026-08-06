# W3-C preflight — disambiguate model-rollout and release canaries

Observed on 2026-08-06 before dispatch:

- `agentic:provider-canary` and `agentic:rollout-canary` describe provider/model rollout
  verification, while the milestone workflow uses release canaries for immutable JSR prerelease
  cuts.
- Both concepts now coexist in the same operator surface and are ambiguous to a fresh orchestrator.
- Active task/docs/skills/generated references must be migrated or compatibly aliased; historical
  run evidence must remain immutable and be classified rather than rewritten.

## Required supervisor mission

1. Inspect the actual behavior of both model-rollout commands and lock names that state the
   operation precisely. Do not mechanically accept the issue's illustrative second name if behavior
   differs.
2. Define compatibility policy from live reference inventory. If external/consumer callers may
   exist, retain bounded deprecated aliases with explicit guidance and tests; otherwise prove
   removal safe.
3. Update task definitions, source help, agentic README, harness tooling index, canonical skills,
   generated/mirrored consumer surfaces, workflow references, fixtures, and operator examples.
4. Reserve unqualified release-canary language for the `netscript-release` workflow. Active AI
   rollout prose must use `model rollout`; historical evidence may mention old names only in an
   explicit history/compatibility context.
5. Add exhaustive active/reference classification tests and focused command/alias/runtime tests so
   neither rename silently breaks and future bare-AI-canary wording fails.
6. Run scoped agentic check/lint/fmt, full focused runtime tests, docs links/accuracy, skill mirror/
   consumer generation checks, and exact residue scan excluding immutable history by rule.
7. Open a draft PR with `Closes #1119` only after all four rows are evidenced; leave it at
   `status:impl-eval` for separate Qwen evaluation.

An alias without migration guidance preserves ambiguity; a rename that rewrites historical harness
evidence destroys provenance. Both are evaluator failures.
