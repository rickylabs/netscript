# Research

Baseline is main `6b7f152f6ac2bbdddcd5f4eb896b3d9f8aaf2db4`; no carried-in implementation.
Issue #2290 has three acceptance bullets and no covering PR or orchid-triage comment.

Consulted existing environment/validation memory first. RTK is absent; Deno and Claude are
available. No external memory connector is exposed, so scoped memory notes are retained here.
Consulted NetScript MCP `find_guidance` with the task intent, then `search_docs` for authz
contract authorizer. It points to contract-local access policy and the service auth seam.
Public API inspected with `deno doc --filter AuthzDecision packages/service/src/auth/mod.ts`.

`contract-authorizer.ts` compiles a contract once and returns `authz.no-contract-procedure` for
unmatched requests. `auth-middleware.ts` authenticates first and serializes every denial as 403.
`ProcedurePolicyResolver` shares matching with authentication; matched access declarations take
precedence over global protected prefixes. Raw routes are exact authentication-required policies.
Active REST/RPC projections, RPC aliases, internal audience guards, and raw routes must continue
to win over retirement. `ProcedureIndex.claims` claims the entire RPC mount, so it cannot be used
to reject individual retired RPC paths. Retirement therefore applies only after normal resolution.

JSR scan: only @netscript/service changes; export keys and dependencies stay fixed. Its existing
slow-types exemption is sanctioned. Public additions need explicit types, JSDoc, examples,
full-export doc lint, audit-jsr-package and member publish dry-run. No new runtime permissions.
