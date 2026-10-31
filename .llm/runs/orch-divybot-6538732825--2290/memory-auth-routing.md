# Auth routing memory — 2026-10-31

The strict contract authorizer is packages/service/src/auth/contract/contract-authorizer.ts.
Authn and authz share ProcedurePolicyResolver; matching access metadata outranks global prefix
coverage. Unknown authenticated paths previously returned authz.no-contract-procedure as 403.
ProcedureIndex.claims covers an entire RPC mount: do not use it to reject retired RPC paths.
Current procedures, raw-route declarations and internal guards must precede retired lookup.
Baseline structured auth tests: 220 passed. Baseline quality:gate, full-export service doc lint and
member publish:dry-run all exit 0. Code-quality warnings are baseline warnings, not failed gates.
