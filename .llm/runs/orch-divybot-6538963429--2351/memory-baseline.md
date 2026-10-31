# Baseline validation

At main b0b8f3f, structured run-deno-test over packages/queue/tests with both real backend environment variables: 144 passed, 0 failed, 3 CI-only sentinels ignored, exit 0. Use --allow-all --unstable-kv through the wrapper. Backend suite includes lease crash/heartbeat/outage tests and delayed promotion.

Full queue export-map doc lint already exits 1 for one private-type-ref in packages/kv/types/watchable-kv.ts. Queue root, Redis adapter, ports and errors are clean individually. Preserve this baseline distinction in evidence; do not claim full doc lint green or repair unrelated KV API as part of A2.
