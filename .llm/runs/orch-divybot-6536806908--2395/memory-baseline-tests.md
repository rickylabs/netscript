# Baseline focused test recipe

`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/queue/tests/redis-adapter-dlq_test.ts packages/queue/tests/envelope_test.ts packages/queue/tests/abort-cleanup_test.ts`

Baseline: exit 0, seven tests pass. The test wrapper records raw child exit and compact TAP
results. Supply NETSCRIPT_TEST_REDIS_URL for real Redis delayed/lease tests; CI already sets it.
