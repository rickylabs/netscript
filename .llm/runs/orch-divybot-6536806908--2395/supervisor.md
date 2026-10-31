# Redis queue lease recovery — #2395

Implementation: Codex, feature tier, Sol xhigh; baseline a410a81 (main).
Branch: `orch/divybot-6536806908`; PR targets main. Coordinator: #2474.
The supplied dispatcher leaf profile is authoritative; repository profiles are not loaded.

Write surface: this run directory; `packages/queue/adapters/redis.adapter.ts`;
`packages/queue/adapters/_redis-lease*.ts`; `packages/queue/ports/message-context.ts`;
`packages/queue/ports/message-queue.ts`; `packages/queue/adapters/_envelope.ts`;
`packages/queue/tests/redis-*`; `packages/queue/tests/_fixtures/redis-lease*`;
`packages/queue/README.md`; queue public export barrels if required for lease types.
The listener's concurrency structure is owned by #2351 and remains outside this change.
Assignment and final-report handoff files are never committed.

Routing inspected with `deno task agentic:matrix --tier feature --json`.
Owner evaluator override, quoted verbatim in worklog: separate Claude Opus 5.5 high
PLAN-EVAL and IMPL-EVAL, read-only, stdin closed. Vendor/session independence is mandatory.
Raw evaluator identity and transport data remain outside Git; only sanitized evidence is retained.
