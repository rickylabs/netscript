# Implementation Prompt: OMB wave-0 proofs

use harness

## SKILL

Read and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-cli`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, `.agents/skills/rtk`, and `.agents/skills/aspire` before acting.

## Required Reading

1. `supervisor.md`, `research.md`, `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, and
   `drift.md` in this run.
2. RFC #1123 §4 Wave 0 and §9 in `.llm/runs/plan-openapi-mcp-plugin--seed/rfc.md`.
3. Full issue bodies #1127, #1128, and #1129.
4. Harness run-loop, service overlay, runtime gates, evaluator definitions, and lane policy.

## Assignment

Execute only the approved S1–S3 proof experiments in order after `plan-eval.md` says `PASS`. Create
draft experiment/evidence/verdict files but do not commit, push, edit GitHub, or change
product/template source. Run no more than one AppHost at a time. Never stop a foreign resource or
any `aspire mcp start` process. Treat every skipped, incomplete, or missing proof as FAIL.

After each slice, update the run worklog/context and stop for the supervisor's separate Fable review
and sign-off. If the plan requires a product change, a lock/cache mutation, concurrent AppHosts, or
weaker evidence, write drift and return `FAIL_RESCOPE` without making that change.
