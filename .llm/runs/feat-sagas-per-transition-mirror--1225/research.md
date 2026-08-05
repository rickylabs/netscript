# Research

- Live issue #1225 was read before repository work.
- Startup reconciliation is a finite Prisma scan in `plugins/sagas/streams/producer.ts`.
- The established post-durability hook is `ProjectingSagaStore.appendTransition`; it covers normal,
  scheduled, failure, and compensation transitions after the canonical ledger append.
- The missing seam is an adapter from `SagaInstanceProjectionPort` to the existing
  `StreamProducerPort`, composed beside the Prisma/KV read-model adapter.
- The tutorial warning is false after per-transition emission. Prisma remains necessary only for
  startup backfill of historical rows; live KV transitions can emit directly.

