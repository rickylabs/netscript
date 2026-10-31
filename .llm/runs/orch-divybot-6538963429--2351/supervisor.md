# A2 Redis listener delivery

- Assignment: issue #2351; coordinator #2474; feature tier; supplied leaf profile.
- Implementer: Codex, OpenAI family, requested xhigh reasoning.
- Baseline: `b0b8f3f7282d073d92d64acdee522ea34bba4c5c`; branch `orch/divybot-6538963429`, target `main`.
- Evaluator/slice reviewer: separate read-only Claude session, owner-requested `claude-opus-5-5`, high effort. No self-certification.
- Routing queried with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh; plan evaluation glm_5_3 then fable_5_1; implementation evaluation muse_spark_1_3 then opus_5. The explicit owner evaluator override below governs both evaluation phases. Loop limits: two plan rounds, five implementation rounds; two consecutive terminal failures stop the leaf.
- Write surface: `packages/queue/adapters/redis.adapter.ts`, `packages/queue/adapters/_redis-*.ts`, `packages/queue/tests/**`, `packages/queue/ports/message-queue.ts`, `packages/queue/README.md`, `docs/site/background-processing/how-to/tune-worker-runtime.md`, and this run directory. Generated export/doc carriers may change only through the repository generators, recorded as drift before execution. Any further surface requires a recorded drift decision before writing.
- Runtime resources: only explicitly created, run-owned Redis/Garnet test resources; stop those on completion. No local scaffold.runtime run.
- Public evidence omits machine identities, endpoints, absolute operator paths and session identifiers. Local evaluator prompts/logs belong in project runs outside tracked source.
- Delivery: draft PR early, commit/push per slice, independent final evaluation of exact pushed head, ready for review, READY issue reply; coordinator owns labels/milestone and merge.

## Exact owner override

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.

> The PR body starts with: Refs https://github.com/rickylabs/netscript/issues/2351 (never Fixes or Closes).

These explicit task-specific operator instructions take precedence over the generic assignment footer and repository defaults. No labels/milestones are changed by this leaf.
