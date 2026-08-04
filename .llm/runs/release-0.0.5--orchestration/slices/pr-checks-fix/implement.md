use harness

# Slice W3: pr-checks cross-attempt supersede — #1187 (recurrence count: five)

Implementation supervisor for the PR closing #1187. Read the issue + its two evidence comments
first — the defect has now cost this milestone five full CI cycles: stale attempt entries
shadow fresh successes for both `agentic:pr-checks` AND GitHub's own rules engine, forcing
full reruns or fresh-SHA pushes before every affected merge.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-tools`

## Milestone-run evaluator rule

Per milestone-run.md § Evaluator protocol + orchestrator ruling D6: no local formal PLAN-EVAL;
composed evaluation; mark the row accordingly.

## Deliverable = the four issue boxes

1. Rerun-attempt fixture (attempt-1 failure + attempt-2 success, same name) classifies
   retried-pass/superseded, not current-fail — RED on today's tool, GREEN after.
2. A job cancelled by a rerun whose latest attempt succeeded is not a current cancellation.
3. Verified against the live PR #1181 evidence recorded on the issue.
4. Genuinely red latest attempt still exits non-zero.

Resolution basis: `actions/runs/{id}/jobs?filter=latest` (proven correct all five times) or
per-attempt check-suite disambiguation. Repo tooling only (`.llm/tools/agentic/`); no
`packages/**`; scoped wrappers; no new lint-ignores.

## PR contract

Branch `fix/pr-checks-cross-attempt`, target `main`. Labels: `type:fix`, `area:tooling`,
`priority:p2`, one `status:`; milestone `0.0.5`. `Closes #1187` with quoted RED→GREEN fixture
output; tick all truthful template DoD boxes before handoff; no keyword-adjacent issue
references. Explicit-refspec push.
