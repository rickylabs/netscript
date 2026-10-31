# KV validation recipe

Use the structured test wrapper with --allow-all --unstable-kv --frozen. The shared abort contract lives in src/testing/watchable-kv-contract.ts, registered by kv-conformance, watch-confirm, watch-review and watch-reorder tests. Redis cases require NETSCRIPT_TEST_REDIS_URL; use unique namespaces already in the fixtures. Deno KV sibling abort tests live in watch-initial_test.ts and use 5-second deadline waits.
