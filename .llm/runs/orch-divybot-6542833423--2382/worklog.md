# Worklog

## Routing override

Owner grant verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only." Implementation assigned Codex at high effort. Matrix resolution and feature loop policy recorded in supervisor.md; separate vendor/session preserved.

## Design

1. Public surface: existing instance list/get return SagaInstanceStatus identically for KV/Prisma; generated Prisma SagaInstance gains scalar status. No route/export additions.
2. Domain vocabulary: existing SAGA_INSTANCE_STATUSES, SagaInstanceStatus, SagaInstanceProjection, PrismaRecord; scalar status is runtime lifecycle; nested state remains business state; isCompleted retained for cleanup.
3. Ports: existing SagaInstanceProjectionPort, PrismaSagaInstanceProjectionClient and SagaServiceDatabaseClient, KV adapter, database sidecar migration functions. No new ports.
4. Constants: canonical statuses imported from core; projection version remains existing SAGA_INSTANCE_PROJECTION_VERSION=2; SQL finite literals mirror the canonical set and test enforces parity.
5. Commit slices: S0 bootstrap/draft; S1 canonical schema/writer/query + tests/docs with scoped and quality gates; S2 evidence/lesson/context and final exact-head review. Files/gates enumerated in plan.md and permitted supervisor surface.
6. Deferred: state-machine changes, KV redesign, history recovery, unrelated B1 work, local scaffold.runtime; coordinator owns labels/milestones and merge.
7. Contributor path: plugins/sagas/README.md Instance API state migration -> existing writer and mapper.

## Bootstrap

Baseline confirmed current main includes #2517. Issue/comments and PR search checked: no duplicate full implementation. Memory consulted; MCP guidance/docs asked before design. rtk absent on this host (confirmed from environment and prior memory), using raw commands with bounded output. No product files changed before PLAN-EVAL.

S0 reconcile: issue #2382 acceptance read live; coordinator #2474 owns labels/milestones/E2E. No mutation of those surfaces.
