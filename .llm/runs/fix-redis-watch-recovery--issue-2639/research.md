# Research

Full issue2639 read. Main still b0eb07957 after fresh fetch. Public WatchStream lazily starts and optionally exposes ready; watch is a current-state primitive, not a durable mutation log. Existing errors KvConnectionError/KvClosedError inherit KvError but are not public exports. Connection manager already resets ended primary clients but not ended subscribers. Both use native bounded reconnect attempts; subscriptions hold the ended client and only handle message events. WatchBatchQueue has no terminal failure path. Existing lease tests cover independent releases, shared subscription and startup consistency but no real outage.

Pinned ioredis5.11.1 readyHandler sets status ready before automatic resubscription. A correct state reread must follow SUBSCRIBE acknowledgement rather than raw ready. @std/async/retry has native AbortSignal support. Reuse these contracts and existing error classes. Runtime reproduction not yet claimed; actual owned Redis server stop/restart test comes first.

Doctrine archetype3 (watch lifecycle), folding integration2; existing adapters/redis boundary. No new backend or abstraction. Existing KV bridge/legacy-value debt is unchanged. No saga transport or Redis Streams work.


## Actual baseline outcome

Two real-server tests fail on unchanged main product source after observing native subscriber status end. Restarted Redis answers PING but the existing iterator never reports the now-missing key within10seconds. Leaving Redis down never yields KvConnectionError within35seconds: the deadline itself rejects instead. Both are genuine iterator hangs, not connection/bootstrap failures. The uniquely labelled container remains alive only to keep its endpoint fixed; Redis server itself is stopped and started with native commands. Exact container identity and label fence teardown. Both test containers removed. Native short-gap oracle is a transaction that kills the real subscriber and writes storage before any new subscription can be accepted; no mock backend.

Short-gap oracle also fails on unchanged main: native MULTI kills exactly one real pub/sub connection then SETs the envelope before any resubscription; the next batch times out. This proves reconnect state loss without a mocked backend or a publication race. Total baseline: three distinct failing runtime regressions, no bootstrap failure. Final resource label scan empty.
