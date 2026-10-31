# R3 focused proof and inherited evidence

The three listener test files run through run-deno-test.ts with --allow-all,
--unstable-kv and --frozen: listener-supervisor_test.ts, listener-recovery_test.ts,
worker-listener-health_test.ts. Real Redis enabled gives 21 passed, zero failures,
zero ignores. A private Redis process can use previously extracted Redis libraries;
its child-only library search path is needed. Always stop the owned process in
finally. No shared daemon changes. The worker typecheck selects136 files;
explicitly name the eight PR TypeScript files for lint/fmt (a loose regex can miss
listener-supervisor_test.ts). Negative-control evidence from R2 remains applicable
because runtime and test files match dfa2502be byte-for-byte.
