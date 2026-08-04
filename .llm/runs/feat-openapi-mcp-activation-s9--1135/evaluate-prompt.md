use harness

## SKILL

- netscript-harness — run the separate-session IMPL-EVAL protocol and write the verdict artifact.
- netscript-doctrine — evaluate the owner-selected packages/mcp Archetype-2 column.
- netscript-cli — evaluate scaffolded app AGENTS.md and agent-init migration behavior.
- netscript-tools — verify wrapper-sourced gates, changed-file hygiene, and lock ownership.
- jsr-audit — verify the MCP package publish surface and doc-lint evidence.
- netscript-pr — verify PR #1232 closing keyword, checklist, acceptance evidence, labels, and milestone.

Perform formal IMPL-EVAL for run `feat-openapi-mcp-activation-s9--1135` on PR #1232. You are a
separate open-model evaluator. Do not modify implementation files, `deno.lock`, the issue, or the PR.

Read `.llm/harness/evaluator/protocol.md`, verdict definitions, the Archetype-2 profile, the full run
artifacts, `origin/main...HEAD`, and the PR commit/comment trail. Issue #1135's owner directive
explicitly replaces local PLAN-EVAL with the recorded milestone-run composed waiver; evaluate that
recorded waiver rather than requiring a literal `PASS` string.

Independently verify the two acceptance gates:

1. initialize, app-scoped AGENTS.md, and failure-path byte fixtures;
2. prior-release exact-pin migration remains old until re-init and restarted current host exposes
   all 21 tools including the OpenAPI triad.

Audit new ignores/casts, schema validity, noise/overreach in doctor findings, zero-install wording,
lock churn, and whether the migration fixture establishes the documented causal path. Re-run the
smallest safe gates needed; do not run `scaffold.runtime` concurrently because its recorded 71/71
one-pass evidence is fresh and the milestone serializes expensive gates.

Write `.llm/runs/feat-openapi-mcp-activation-s9--1135/evaluate.md` using the harness template with
exact verdict `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Also return the verdict and concise
findings in the final response. Do not commit or push.
