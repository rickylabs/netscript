# Issue 2401 — Aspire watch lifecycle

- Role: implementation; OpenAI Codex, feature tier, owner-requested high effort.
- Branch: `orch/divybot-6541778987`; baseline: `4e018ad0bab9b9b90daf4764a035fd3ff879b9fa`.
- Profile: dispatcher-supplied leaf; no repository profiles loaded.
- Write surface: this run directory; Aspire CLI adapters/callers and tests in `packages/cli/`, `packages/mcp/`; shipped templates/resources under `packages/cli/`; Aspire reference/troubleshooting docs; focused Aspire runtime gate helpers under `.llm/tools/` if inventory proves necessary.
- Local excluded delivery files: `.divybot-final-report.tmp` → `.divybot-final-report.md`. Assignment file excluded from all commits.
- Matrix inspected with `deno task agentic:matrix --tier feature --json`. Implementation primary `sol`, fallback `muse_spark_1_3`; plan evaluation `glm_5_3` then `fable_5_1`; implementation evaluation `muse_spark_1_3` then `opus_5`.
- Explicit owner override: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Evaluator family Anthropic differs from implementation family OpenAI. Same evaluator resumed across rounds. Limits: two plan rounds, five implementation rounds; two consecutive terminal failures stop.
- Coordinator owns labels, milestone, expensive scaffold.runtime CI gate, and merge. No local scaffold runtime execution.
- Public artifacts exclude private machine/session data. Evaluator raw state stays in project run storage outside Git.
