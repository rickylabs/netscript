# Context Pack — RFC 0013 S3

- **RFC:** `rfcs/0013-orpc-v2-readiness.md` (owner-accepted 2026-11-27 in PR `#2674`)
- **Tracking Epic:** `#2672`
- **Sub-issue:** `#2708`
- **Slice:** Phase 0a Slice 3 (§4.1 items 5–6, §4.2, §4.4, §4.5)
- **Branch:** `feat/rfc-0013-s3-rpc-protocol-guard-redirect` (based on `origin/main` `bc4bf4522` post-S2 PR `#2707`)
- **Scope:**
  1. Server-only RPC-scoped `X-NetScript-RPC-Protocol` readiness:
     - `packages/service/src/primitives/rpc-protocol-guard.ts` (`ProtocolGuardPluginV1`, `order: 0 < 9e6` inside v1 `CORSPlugin`, mounted strictly on `createRPCHandler`, never `createOpenAPIHandler`, exempting `OPTIONS`, rejecting non-`orpc-v1` protocol headers with HTTP `426` + v2-compatible `ORPCError` JSON omitting `"status"`, appending `Vary: X-NetScript-RPC-Protocol` on matched RPC responses).
     - `packages/service/src/middleware/service-cors.ts` & `packages/service/src/builder/service-builder-impl.ts`: append `X-NetScript-RPC-Protocol` (case-insensitively deduplicated) to explicit `withCors({ allowHeaders })` preflights strictly on mounted RPC paths (`rpcPath` / `rpcAliases`), leaving non-RPC routes (`/raw`, `/health`, `/api/*` OpenAPI) and services without `.withRPC()` untouched.
     - Keep v1 `CORSPlugin` untouched and v1 SDK `RPCLink` header-neutral (`OMITTED_CONTRIBUTION_BASELINE` unchanged).
     - Update `packages/service/README.md:166-175` and RPC-path assertions in `packages/service/tests/cors-response-authority_test.ts`, plus add dedicated `packages/service/tests/rpc-protocol-guard_test.ts`.
  2. SDK redirect guard:
     - Enforce `redirect: 'error'` after `...init` spread at `packages/sdk/src/client/http-client-link.ts:192`.
     - Add live 2-server cross-origin 307 redirect test in `packages/sdk/tests/integration/http-redirect-guard_test.ts`.
