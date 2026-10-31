# Saga Prisma status parity — supervisor

Baseline: `462f15c099c3d2d4600c4442111dce51edf0d4b2` (current main, includes #2517).
Branch: `orch/divybot-6542833423`; issue #2382; coordinator #2474 (mc009e).
Implementation: assigned OpenAI Codex session, feature tier, requested high effort.
Evaluator/slice reviewer: separate Anthropic Claude session, `claude-opus-5-5`, high effort, read-only, stdin closed; reused across review rounds. Sign-off requires its substantive review.

## Routing

Resolved `deno task agentic:matrix --tier feature --json` before writing this file. Implementation primary: sol/xhigh; fallback muse_spark_1_3/xhigh. Plan evaluator primary glm_5_3/provider_default, fallback fable_5_1/low. Implementation evaluator primary muse_spark_1_3/xhigh, fallback opus_5/xhigh. Feature plan max 2 rounds; implementation max 5 rounds; reuse evaluator.
Owner override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only." This preserves different vendor family/session independence. No other route is inferred.

## Permitted write surface

- `.llm/runs/orch-divybot-6542833423--2382/**`: plan, research, design, evidence, evaluator prompts/verdicts, context, drift, lessons/memory.
- `plugins/sagas/src/runtime/saga-instance-projection.ts` and projection regression tests.
- `plugins/sagas/services/src/instance-query.ts`, `routers/v1-helpers.ts`, and instance read/query regression tests.
- `plugins/sagas/database/**`: schema and forward data migration through existing tooling, if research proves that shape appropriate.
- `plugins/sagas/README.md`: compatibility/upgrade instructions.
- `.divybot-final-report.tmp` → `.divybot-final-report.md`: excluded final publication handoff.

No assignment file or lock changes may be committed. No labels/milestones, local scaffold.runtime, merge, tag or release. Public artifacts use repository-relative paths and omit machine/session identifiers. Runtime E2E is coordinator-owned CI.
