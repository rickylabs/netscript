# Drift & Diagnostic Notes — RFC A (`plan/rfc-orpc-router-client-pipeline-2671`)

No framework runtime or build drift was encountered during Round-0 authoring or Round-1 revision.

## Notable Architectural Observations (Pre-existing on `main` `87965d800`, source-inspected)

1. **Uncorrelated `requestId` between Hono and oRPC:** `packages/logger/middleware.ts` extracts/generates `X-Request-ID` on Hono context, while `packages/logger/orpc-plugin.ts` (`createRequestId()` at line 371) generates a separate random 8-char `requestId` per RPC invocation. Addressed in RFC A Stage 1a.
2. **Redundant `CORSPlugin` in `packages/service/src/primitives/handlers.ts:112`:** `createRPCHandler` and `createOpenAPIHandler` still mount oRPC's default `new CORSPlugin()`, forcing `packages/service/src/middleware/service-cors.ts` to snapshot and restore 6 CORS headers on every response. Addressed in RFC A Stage 1a.
3. **`ServiceBuilderImpl.buildRpcContext()` overwrite order:** `packages/service/src/builder/service-builder-impl.ts:336-341` spreads `...this.contextFactory(c)` *before* `principal: c.get('principal')`, so HTTP-edge scoped branding (`VerifiedPrincipalRecord`) must happen inside `createAuthnMiddleware`.
4. **Global `INTERNAL_PRINCIPALS` WeakSet without audience check:** `packages/service/src/auth/internal-credential/internal-credential-authenticator.ts:15,108-110` checks `INTERNAL_PRINCIPALS.has(principal)` without verifying `principal.claims.audience === currentServiceName`. Safe on HTTP today only because principals never cross services; RFC A §3.4 closes this explicitly before any in-process router-client delegation.
5. **Silent `defined: false` downgrade on router-level `ORPCError` without schema-matching `data` (oRPC v1 only):** Verified empirically against `@orpc/server@1.15.5` + `@netscript/contracts` `commonErrorMap`. On oRPC v2 (`2.0.0-beta.53`, per PR #2674 prototype evidence), `ORPCError` drops constructor `defined` and reconciles via `reconcileORPCError`.
6. **Cross-RFC alignment note (PR #2674 / issue #2672):** Companion PR #2674's Phase 0 note that RFC A Stage 1 deletes `contract-procedure-index.ts`'s 4 v1-only imports must be updated during PR #2674's own review round to reflect B3 (edge index retained on v1, migrated to native `RPCMatcher` + `OpenAPIMatcher` on v2). PR #2674 was intentionally left untouched during RFC A Round 1.
