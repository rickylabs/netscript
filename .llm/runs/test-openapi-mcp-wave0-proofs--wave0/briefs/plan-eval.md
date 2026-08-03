use harness

# PLAN-EVAL brief — OMB wave-0 proofs

## SKILL

Read and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-doctrine`, and
`.agents/skills/netscript-tools`. This is a formal evaluator turn, not implementation.

You are the separate OPEN-model Qwen PLAN-EVAL session for `test-openapi-mcp-wave0-proofs--wave0`.
Follow `.llm/harness/evaluator/plan-protocol.md` exactly. Read the plan gate, verdict definitions,
this run's `research.md`, `plan.md`, `worklog.md` Design, service overlay, gate matrix, and debt
registry. Recheck at least one load-bearing research claim against current source/docs. Confirm the
proof-only N/A archetype, exact commit slices, false-green skip handling, shared-host mitigations,
no-product-change boundary, and all open decisions.

Write only this run's `plan-eval.md` using the harness template, with exactly one `PASS` or
`FAIL_PLAN` verdict. Do not implement a proof, edit the plan, commit, push, modify GitHub, run an
AppHost, touch `deno.lock`, or inspect credentials.

Perform every read and checklist step in this session yourself. Do not invoke the Agent/Task tool,
spawn a subagent, or delegate any work: the Claude CLI's default child model is closed and the
formal-evaluator request guard will terminate the turn if any child model is requested.
