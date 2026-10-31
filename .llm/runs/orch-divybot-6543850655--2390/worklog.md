# Worklog

## Design

1. Public surface: no new exports; issue-2390 tests exercise existing native seams.
2. Vocabulary: document admission, publish-receipt job, recorded receipt, producer session/epoch. Business `state.status` differs from canonical `metadata.status`.
3. Ports: existing SagaStorePort/atomic capability, SagaInstanceProjectionPort, SagaDeliveryQueuePort, CommandOutboxRelayStore, WorkerJobCommandRequest, StreamProducerPort. No new production abstraction.
4. Constants: named synthetic saga/job/message IDs, stream topic/path, correlation/producer ID; reuse canonical lifecycle vocabulary.
5. Slices: run plan (PLAN-EVAL); integrated fixture/providers (structured gates + quality + independent review); evidence/lesson/READY (historical controls and exact-head evaluation).
6. Deferred scope: consumer code, KV worker-outbox implementation, wider effects, release/merge.
7. Contributor path: shared projected-receipt fixture under `plugins/sagas/tests/runtime/fixtures/`; provider entrypoints supply stores only.

## Authority and routing

Owner override, verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Override normal feature evaluator routes; preserve session/vendor independence. Maximum 2 PLAN-EVAL / 5 IMPL-EVAL rounds; final verdict binds pushed SHA. No labels/milestones. Specific operator instructions require Refs-only PR and coordinator closure despite generic assignment closing-keyword boilerplate.

## Bootstrap

Assignment/AGENTS read, memory consulted, MCP guidance/search complete, clean baseline. RTK missing; direct bounded commands. KV worker-outbox limitation included in plan. PLAN-EVAL pending; implementation not started.
