# Saga declarations / issue 2374

- Date: 2026-10-31. Role: implementation, feature tier, supplied leaf profile.
- Branch: `orch/divybot-6543282848`; baseline main: `14816a409e31505bc528714332b0bf4670be2fcb`.
- Authoritative scope: issue #2374, B1, coordinator #2474 (mc009e).
- Write surface: `plugins/sagas/src/cli/**`, matching `plugins/sagas/src/adapter/**` doctor check, `plugins/sagas/tests/**`, `plugins/sagas/README.md`, this run directory. CLI integration tests only if needed to prove root generation propagation; record additions as drift first.
- Implementer: OpenAI Codex, owner-requested high reasoning. Matrix queried with `deno task agentic:matrix --tier feature --json`.
- Matrix default implementation: sol/xhigh; plan evaluation: glm_5_3/provider_default then fable_5_1/low; implementation evaluation: muse_spark_1_3/xhigh then opus_5/xhigh.
- Owner override (verbatim): “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Evaluator: separate Anthropic Claude session, maintained across rounds using resume; max two plan rounds and five implementation rounds. Evaluator supplies substantive review before implementation slice commit. Coordinator owns final sign-off and merge.
- No labels/milestones changed. Explicit issue-specific operator directives override generic dispatcher closure/fan-out boilerplate: PR begins Refs, no closing keyword, stop at READY. Local full E2E prohibited; request coordinator CI scaffold.runtime verdict.
- Private launcher logs/session continuity remain outside tracked/public artifacts. No private host, port, operator path or session ID is published.
