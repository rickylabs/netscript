# Supervisor

- Issue: #1366, box 6; coordinator #2474 (mc009e).
- Implementer: OpenAI Codex, owner-assigned feature tier, high effort.
- Branch: orch/divybot-6544332029; base: main d54879b (exact SHA recorded in context).
- Evaluator: independent Anthropic Claude, read-only, opus override below; no self-certification.
- Write surface: packages/plugin/src/{domain,ports,adapters,runtime,presentation,health}/; packages/plugin/tests/health/; packages/plugin/README.md; plugins/{sagas,triggers}/src/runtime/ and tests/runtime/; docs/site/orchestration-runtime/child-health.md; this run directory. Generated carriers only if canonical gates require them, with explicit drift entry.
- Assignment and final-report handoff files are never committed.
- No labels, milestones, merge, release, local scaffold.runtime, lock/cache deletion or reload.
- Public artifacts contain only repository-relative paths and no operator/session identifiers.

## Routing

Queried `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh, plan evaluation glm_5_3/provider_default then fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Owner overrides both evaluation phases verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Feature limits: two PLAN-EVAL rounds and five IMPL-EVAL rounds; stop after two consecutive terminal failures. Same evaluation session is resumed across rounds. Final evaluation pins the exact pushed head.
