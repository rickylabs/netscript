# Reusable investigation notes

- Native KV saga atomicity covers state/history/correlation/replay only. `KvSagaStore.transitionCommitCapabilities.transitionOutbox` is unsupported and `commitTransition` rejects worker commands. Do not use MemorySagaStore to imply durable KV worker-command support.
- Reference durable-stream server under Deno can hang at shutdown with keep-alive sockets. Existing first-party idempotency tests add `connection: close` in the injected HTTP transport; reuse that pattern with sanitizers enabled.
- The generated-client saga fixture runner is `packages/plugin-sagas-core/tests/fixtures/transition-store/provider-fixture.ts`; templates can import repo files through `REPO_URL`. It maps workspace exports before generating Prisma and preserves the committed lock graph.
- Minimal userland PostgreSQL on this environment: download the Debian postgresql-15 package into project runs, extract with dpkg-deb, use the extracted initdb/pg_ctl against an owned temp cluster and Unix socket. Existing libpq/runtime dependencies suffice. No sudo or Docker daemon is available.
- Native Prisma projection with querySource=prisma must project even when archiveToDb returns false; it nests business state and stores canonical lifecycle separately.
- A producer restart probe is a meaningful red control only when it primes sequence zero before the new session. Ignoring initialEpoch on canary.8 reports delivered twice but appends once. In the integrated flow, the worker's own retry can repair the missing first append, so assert a single handler invocation to prevent a false-green recovery claim.
- Native saga supervisor owns/closes its injected canonical store at stop. Reopen KV store connections per runner lifetime; keep projection/inspection on a separate handle. resetKv models a new process module singleton while preserving replay storage.
- Structured test wrapper flag is --output before --. --report-output is only a deno task test forwarding alias.
