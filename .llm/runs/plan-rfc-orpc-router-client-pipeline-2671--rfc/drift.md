# Drift & Diagnostic Notes — RFC A (`plan/rfc-orpc-router-client-pipeline-2671`)

No framework runtime or build drift was encountered during this evaluation RFC.

## Notable Architectural Observations (Pre-existing on `main` `87965d800`, source-inspected)

1. **Uncorrelated `requestId` between Hono and oRPC:** `packages/logger/middleware.ts` extracts/generates `X-Request-ID` on Hono context, while `packages/logger/orpc-plugin.ts:278` generates a separate random 8-char `requestId` per RPC invocation. Addressed by the RFC's unified `NetScriptProcedureContext.requestId`.
2. **Redundant `CORSPlugin` in `packages/service/src/primitives/handlers.ts:112`:** `createRPCHandler` and `createOpenAPIHandler` still mount oRPC's default `new CORSPlugin()`, forcing `packages/service/src/middleware/service-cors.ts` to snapshot and restore 6 CORS headers on every response. Addressed by removing the handler-level `CORSPlugin` and keeping CORS exclusively at the HTTP edge.
3. **`ServiceBuilderImpl.buildRpcContext()` overwrite order:** `packages/service/src/builder/service-builder-impl.ts:336-341` spreads `...this.contextFactory(c)` *before* `principal: c.get('principal')`, so user `.withContext()` cannot wrap or replace `principal`. Documented in RFC A §2.1 so HTTP-edge branding happens inside `createAuthnMiddleware`.
4. **Silent `defined: false` downgrade on router-level `ORPCError` without schema-matching `data`:** Verified empirically in `probes/router-client-parity.probe.ts` against `@orpc/server@1.15.5` + `@netscript/contracts` `commonErrorMap`. Documented in RFC A §3.4.
