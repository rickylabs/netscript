# Stable streams producers need a persisted session epoch

Issue #2338, C1: a duplicate 204 acknowledges a previously committed tuple; it does not compare the current payload with earlier bytes. A recreated producer cannot safely reuse both epoch zero and sequence zero for changed documents. The supported `initialEpoch` option lets application storage allocate a strictly higher epoch per path/producer session. Explicit epochs fence stale producers; legacy omission keeps existing auto-claim behavior. The first changed append establishes the new epoch without a dummy record or invented claim endpoint.

Keep serialized event bytes and identity unchanged during retries; distinguish that guarantee from caller-owned source equality filtering and from cross-process crash recovery. Replayed application operations can still append under a newly allocated epoch. Document the checkpoint boundary rather than imply producer-side semantic deduplication.

Use the reference server for acceptance and full-runtime-revert controls. Its Node HTTP shutdown can wait on idle keep-alive sockets under Deno after multiple tests; use Connection: close on test requests instead of removing cleanup or ignoring sanitizers. Confirmed by independent review and twenty repeated focused suites.

Public API/docs additions also require native generated MCP and prose-carrier refresh. The sdk/streams re-export changes transitively. No local scaffold runtime was run: the coordinator owns the CI e2e-cli verdict and merge.
