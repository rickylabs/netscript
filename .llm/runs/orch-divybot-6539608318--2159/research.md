# Research

Issue #2159 has a plain-text Acceptance requirement: fault injection before commit and before effect
dispatch must produce one transition and every effect. No acceptance checkboxes exist to mirror.
Intake found no orchid-triage comment and no existing PR referring to #2159.
NetScript MCP find_guidance and search_docs were consulted in that order; repository code is the
precise source for the durability boundary.

Ordinary saga handlers call recordApplied before execution, then independently save envelope,
correlation, and history. The bridge also reserves an idempotency marker before engine execution.
Worker-command sagas already use SagaTransitionCommitPort with atomic replay, state, correlation,
history, and command intents. MemorySagaStore and PrismaSagaTransitionStore implement it; ordinary
KvSagaStore and PrismaSagaStore do not. KV supports Deno KV and Redis through KvStore.atomic.
PrismaSagaStoreClient has interactive transactions and the shipped schema already contains the
SagaRuntimeCommandAppliedKey model from #1932.

The projection decorator preserves the command capability only. It must preserve the atomic state
capability without advertising worker command support that the delegate lacks.

Effect recovery is a separate protocol: SagaOutboxPort is still reserved, and bridge dispatch holds
an in-memory compensation version ledger; scheduling and cascading bypass the command relay. A
partial outbox that records effects without restart ownership, acknowledgement fencing, bounded
claims, and scheduler deduplication would not prove the second acceptance boundary. The operator
explicitly authorizes slice 1 with one dependent follow-up when slice 2 cannot land coherently.
