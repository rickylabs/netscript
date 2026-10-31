# Saga transition protocol

Use `isSagaAtomicStore` for atomic canonical state/replay and retain `isSagaTransitionStore` for
worker-command intents. `transitionOutbox: unsupported` must reject nonempty commands before writes.
KV marker key is nested under applied/instance/transition-v1/digest, never the raw-key depth.
Engine `usesAtomicReplay` bypasses bridge reservations and injected pre-handler applied stores for
all stored sagas. The atomic marker identity reuses #1932's saga-inbound-v1 hash. Ordinary Prisma uses
createMany(skipDuplicates) in the same transaction as state/correlation/history; client guard requires
the shipped marker delegate. Projection failure after commit remains a separate repair concern.
Production crash proofs use SagaRuntimeSupervisor with default durable factory and explicit durable
bridge/applied stores. Pause at commitTransition (legacy save for negative controls), SIGKILL, reopen
the same persistence and deliver twice. Expect one transition and two handler calls across the crash.
