# Plan & Design — READY FOR REVIEW

Archetype 3, saga state-machine specialization. Deliver slice 1 of #2159; keep Refs-only.

## Locked decisions

- Generalize the existing SagaTransitionCommitPort rather than invent another persistence path.
  Distinguish atomic state/replay support from worker-command outbox support; unsupported commands
  must fail before any write. Existing durable worker composition remains strict.
- Every configured engine store must advertise atomic state/replay support before handler execution.
  Commit state, correlation ownership, history and applied digest together after handler success.
  No pre-handler reservation or failure cleanup. Preserve storeless process-local compatibility.
- Add an optional read-only applied-digest lookup as a pure-handler fast path; the atomic commit
  remains authoritative under races. Digest identity matches #1932's saga-inbound-v1 identity.
- KV uses one compare-and-swap operation checking state, correlation and replay identity. A loser
  distinguishes duplicate replay from optimistic concurrency and throws for retry on the latter.
  Apply the existing terminal retention policy to the atomic rows; open markers never expire.
- Ordinary Prisma uses one interactive transaction and the existing applied-key schema. Reuse the
  raw Prisma transition adapter's existing transaction and marker protocol.
- Preserve atomic capabilities through projection/recording decorators, including an atomic commit
  operation in recording evidence. Keep projection repair policy outside this leaf's ownership.

## Slices

1. Atomic applied key + state + correlation + history in KV (including Redis), ordinary Prisma,
   existing command Prisma, memory and decorators; engine and bridge routing. Add persisted-process
   SIGKILL proof after handler/before commit, rollback/CAS tests and negative controls. Commit/push
   only after focused gates and independent slice review; update worklog and context together.
2. Deferred under the owner's explicit partial-delivery clause: recoverable scheduled/cascaded
   effects through SagaOutboxPort. One follow-up: "feat(sagas): atomically persist and recover
   scheduled and cascaded effects". Scope: same-commit serialized effect intents alongside #1932
   commands; stable keys, bounded/fenced claim and acknowledgement, startup dispatcher lifecycle,
   scheduler deduplication, compensation ordering, persisted KV/Redis/Postgres crash and replay
   proofs after state commit and before dispatch. Coordinator files it.

## Gates and risks

Run structured package tests/check/lint/fmt, consumer runtime tests, doc lint, quality:scan and
arch:check. Test real persisted KV first, Redis and Postgres where their suite providers are
available. Record unavailable gates unproven; never claim memory tests as real backend evidence.
No local scaffold.runtime: explicitly forbidden. Request the coordinator's e2e-cli CI gate because
runtime wiring changes. Review exact pushed head with the independent evaluator before READY.

Risks: stricter store contract affects custom adapters; document migration and fail before handlers.
Pure handlers can rerun on CAS races; only committed transitions are exactly-once-effective.
Old orphaned reservation markers are not evidence of an atomic commit and must not be trusted.
Effect loss after commit remains explicit unproven acceptance, covered by the single follow-up.
No new architecture debt is accepted; deferred product functionality stays on #2159.
