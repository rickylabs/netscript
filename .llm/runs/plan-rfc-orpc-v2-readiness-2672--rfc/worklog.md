# Worklog — RFC B: oRPC v2 readiness and migration strategy

- **Date:** 2026-11-25
- **Tracking issue:** `#2672` (`0.0.10`)
- **Draft PR:** `#2674`
- **Base `main` SHA:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Companion RFC:** PR `#2673` (tracking issue `#2671`)

## Owner Mandate (verbatim, private prefix elided for public repository)

> "I'd put a neon lane to evaluate the migration to orpc router client including auth and others and also being orpc V2 ready (two RFC) reviewer Fable 5.2 including what it implies for our downstream consumers (without citing […] )"

*(Note: the private repository prefix in the owner's prompt is elided as `[…]` for public-repo hygiene, matching existing RFC worklog precedent.)*

## Round-0 Baseline & Round-1 Review (Fable 5.2)

- Round-0 draft committed at `1349e509aeb748f6dd5872429dbb05ca9c2113f7` on PR `#2674`.
- Fable 5.2 PLAN-EVAL (`issuecomment-7170652451`) returned `CHANGES_REQUESTED` with 8 blockers (B1–B8), a `1.16.5` baseline run, Phase 0a/0b split guidance, and advisory items.

## Round-1 Revision Evidence Ledger

### 1. Source & Upstream Verification (`2.0.0-beta.53` & `main` `87965d800`)

- Inspected `@orpc/tanstack-query@2.0.0-beta.53/dist/procedure-utils.d.ts` confirming exact method names `streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`.
- Inspected `@orpc/openapi@2.0.0-beta.53/dist/extensions/route.d.ts` confirming `@orpc/openapi/extensions/route` module augmentation restoring `.route(meta: OpenAPIMeta)`.
- Inspected `@orpc/server@2.0.0-beta.53/dist/plugins/get-method-csrf-protection.js` and `adapters/standard/rpc-handler-codec.js` (confirming `GetMethodCsrfProtectionHandlerPlugin.isAllowed` Fetch Metadata logic and `status: getOwn(this.errorStatusMap, error.code) ?? 400`).
- Inspected `@orpc/contract@2.0.0-beta.53/dist/{error-utils.d.ts,meta-utils.d.ts}` confirming `reconcileORPCError(map, error)` and `defineMeta(name, merge)`.
- Inspected NetScript files: `packages/sdk/src/internal/transport-policy.ts`, `packages/sdk/src/client/http-client-link.ts`, `packages/sdk/src/query-client/create-service-query-utils.ts`, `packages/service/src/primitives/{handlers.ts,openapi.ts}`, `packages/service/tests/cors-response-authority_test.ts`, `packages/telemetry/src/orpc/{tracing-plugin.ts,error-plugin.ts}`, `plugins/auth/services/src/routers/v1-handlers.ts:97`, `packages/cli/e2e/src/application/gates/scaffold/{install-generated-probe_test.ts,locked-probes_test.ts,service-client-runtime-probe.ts}`.
- Executed `.llm/tools/deps/scan-npm-catalog-compliance.ts` (read-only) confirming existing `WARN DEPS-NPM-CATALOG` coverage across all 11 workspace manifests and inline `@orpc/*` test pins.

### 2. Standalone Empirical Behavior Probes (`probes/v2-behavior-probes.ts`)

- Executed with `mise exec -- deno test --no-lock --no-config -A` (zero edits to `deno.json` / `deno.lock`):
  - **B1:** Reproduced `1.15.5` `RPCLink` → `2.0.0-beta.53` `RPCHandler` `bigint` `10n` → `"10"` and `"nope"` → `"Not Found"`, verified `X-NetScript-RPC-Protocol` `426` guard (explicit v1, missing header, reverse v2→v1), and verified `OpenAPILink@1.15.5` → `OpenAPIHandler@2.0.0-beta.53` for JSON-safe payloads.
  - **B2:** Verified default `RPCHandler` rejects `GET` (`matched: false`), and verified explicit contract `GET` allow-list + `GetMethodCsrfProtectionHandlerPlugin` across all 6 request shapes.
  - **B4:** Verified `rootInterceptors` silently ignored vs `routingInterceptors` executing; unmapped error code returning HTTP `400`; `defined: true` ignored vs `reconcileORPCError`; duplicate middleware running twice on v2 vs context-symbol guard running once.
  - **B6:** Verified `@orpc/openapi/extensions/route` + `defineMeta` powering `.route(...)` + `.meta(accessMeta(...))`.
  - **B7:** Verified default v2 `RPCLink` follows cross-origin `307` leaking `x-api-key`, `traceparent`, and body; `redirect: 'manual'` resolves `undefined`; `redirect: 'error'` throws `TypeError` with 0 foreign hits.

## Validation Table (Round-1 Fix)

| Check | Command | Result |
| --- | --- | --- |
| Standalone v2 Behavior Probes (B1, B2, B4, B6, B7) | `mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts` | PASS (`5 passed \| 0 failed`, 33 ms) |
| Workspace `deno.json` & `deno.lock` untouched | `git status -s` | PASS (docs & `.llm/runs/` only) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-v2-readiness.md --pretty` | PASS (`broken-links=0 broken-anchors=0`) |
| Privacy & closing-keyword scan | Pattern scan on all modified/added files | PASS (`0 hits`) |
