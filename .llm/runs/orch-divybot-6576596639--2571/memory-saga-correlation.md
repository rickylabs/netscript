# App-owned saga transition rules

Saga `.on()` handlers are synchronous projections. Keep network writes in the
durable worker. A cascaded `send()` does not carry the originating request's
correlation key; define `.correlate(message => validatedBusinessKey)` so order,
payment and shipping reach the same persisted instance. Without it, the first
instance remains running and the two cascades create unrelated instances.

The worker can await that genuine saga state before applying committed order
updates. Its execution progress remains visible while the saga runs. Never infer
completion from configured handlers or show all steps complete on installation.
