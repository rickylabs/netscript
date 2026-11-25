# Supervisor Record — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

- **Run ID:** `plan-rfc-orpc-v2-readiness-2672--rfc`
- **Issue:** `https://github.com/rickylabs/netscript/issues/2672`
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2674`
- **Companion RFC:** PR `#2673` (tracking issue `#2671`)
- **Branch:** `plan/rfc-orpc-v2-readiness-2672`
- **Base commit:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (`main`)
- **Milestone:** `0.0.10` (Phase 0a targets `0.0.10`; Phase 2 cut-over targets `0.1.0`)
- **Primary deliverable:** `rfcs/0000-orpc-v2-readiness.md`
- **Status:** Round-2 fix complete addressing all 5 Gemini Hydrogen Round-2 blockers (N1–N5) and all 3 advisories; ready for Round-3 PLAN-EVAL by Gemini Hydrogen.

## Route & Lane Assignment

| Role | Assigned model / lane | Notes |
| --- | --- | --- |
| Author / research lane | Neon | Drafted RFC B + throwaway `2.0.0-beta.53` prototype (deleted cleanly); completed Round-1 (B1–B8) and Round-2 (N1–N5 + Advisories #1–#3) fixes + standalone v2 behavior probes (`probes/v2-behavior-probes.ts`); zero committed edits to `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. |
| Round-1 reviewer | Fable 5.2 | Returned `CHANGES_REQUESTED` (`issuecomment-7170652451`) with 8 blockers (B1–B8), `1.16.5` verification, and advisory items. |
| Round-2+ reviewer | Gemini Hydrogen | Round-2 PLAN-EVAL (`6501e41c`) confirmed B3/B5/B7 resolved, B1/B2/B4/B6/B8 partial, and raised N1–N5 + 3 advisories; re-checks Round-2 revision in Round 3. |

## Round-2 Blocker Closure Checklist (N1–N5 + Advisories #1–#3)

- [x] **N1 (B1 CORS preflight):** Made Phase 0a (`0.0.10`) server-only (`withCors({ allowHeaders })` auto-includes `X-NetScript-RPC-Protocol`, v1 `OPTIONS`-exempt reverse `426` guard, `Vary` on `200`/`426`, zero new client header so cross-origin `GET` stays preflight-free and `OMITTED_CONTRIBUTION_BASELINE` stays untouched); at `0.1.0`, v2 `RPCLink` emits `orpc-v2`, `RPCHandlerConfig.cors` auto-includes the header, v2 `426` guard exempts `OPTIONS` (returning `204`), and emits `Vary: X-NetScript-RPC-Protocol` on `200` GET & `426`. Proven failing-then-passing in Probe B1.
- [x] **N2 (Phase 0a item 4 + B4):** Kept v1 runtime interceptor attachment on `rootInterceptors` behind shared NetScript helper `attachRootHandlerInterceptor` (flipping to `routingInterceptors` only at `0.1.0`), mounting plugins into a real `RPCHandler` in `plugin_test.ts:101`; moved `500` unmapped-code normalization to unconditional `createDefault500ErrorStatusMap` Proxy on `createRPCHandler`/`createOpenAPIHandler` (works even without `serviceName` or with `errorHandling: false`, preserves custom `err.code`); wired `errorStatusMap` into `TracingPluginOptions`/`LoggingPluginOptions`/`ErrorHandlingPluginOptions`; added full v1-vs-v2 interceptor, `error.status`, `resolveErrorHttpStatus`, conflict-merge, and standalone `500` checks to Probe B4.
- [x] **N3 (B2 verbs & `allowGetRpc: false` pairing):** Specified mandatory paired client `transportPolicy: { method: () => 'POST' }` when a service sets `allowGetRpc: false`; preserved `POST`/`PUT`/`PATCH`/`DELETE` (`RPC_DEFAULT_ALLOW_METHODS`) + contract `GET`/`HEAD` in server `allowMethods` and `GET`/`HEAD→GET`/`POST`/`PUT`/`PATCH`/`DELETE` in SDK inference (`transport-policy_test.ts:35`, `create-crud-contract.ts:367-378`). Proven in Probe B2.
- [x] **N4 (B6 server-free contracts, `policyMeta`, & key alignment):** Removed `@orpc/openapi/extensions/route` from `@netscript/contracts` (avoiding `@orpc/server` runtime dependency in browser bundles and `import type`/direct `oc` hazards); adopted server-free `routeMeta` (`defineMeta('~openapi', ...)`), `accessMeta` (`defineMeta('access', ...)` → `.meta.access`), and `policyMeta` (`defineMeta('policy', ...)` → `.meta.policy`) keeping `packages/contracts/deno.json` strictly on `[@orpc/contract, zod]`. Proven against `getOpenAPIMeta` and `OpenAPIGenerator` in Probe B6.
- [x] **N5 (B8 e2e lock fixtures & scoped CI gate):** Updated Phase 0a item 1 so isolated temp-dir tests (`locked-probes_test.ts`, `install-generated-probe_test.ts`) read an active locked `@orpc/client` entry before pruning `1.15.0`, and scoped `.llm/tools/deps/scan-npm-catalog-compliance.ts` CI failures specifically to `@orpc/*`.
- [x] **Advisories #1–#3:** Refreshed PR `#2674` body with non-empty `## Breaking change and migration` section passing `check-breaking-migration.ts`; aligned §5 with RFC A head `bd8d51c0` & Prior Art with PR `#2659` head `f8c8d8fd`; updated Unresolved Question #1, `0.0.12+` `release/orpc-v1` numbering, and `plugins/sagas/services/src/routers/v1-handlers.ts:193`.

## Round-1 Blocker Closure Checklist

- [x] **B1:** Mixed v1/v2 RPC silent corruption (`bigint` → `"10"`, error degradation) decided via Phase 0a `X-NetScript-RPC-Protocol` fail-closed `426` guard + blue-green gateway routing / empirically verified `OpenAPILink` JSON-only bridge (dual-major `/api/rpc/v2` mount dropped); proven in Probe B1.
- [x] **B2:** GET-first query policy decided: explicit contract-declared `GET` allow-list (`getOpenAPIMeta(proc)?.method === 'GET'`) + `GetMethodCsrfProtectionHandlerPlugin` + `SameSite=Lax|Strict` invariant (opt-out `allowGetRpc: false` for `SameSite=None`), replacing `inferRPCMethodFromContractRouter`; proven in Probe B2.
- [x] **B3:** `CORSPlugin` removal moved OUT of Phase 0a (preserving tested v1 origin-reflection behavior in `cors-response-authority_test.ts`) and reclassified as an explicit breaking security tightening at `0.1.0` with opt-in `RPCHandlerConfig.cors`; Security §1 corrected.
- [x] **B4:** All 6 silent runtime changes mapped with exact files & required behavior tests (`rootInterceptors` → `routingInterceptors`, server-side `error.status` readers, `400` unmapped status fallback + status-map conflict rule, ignored `defined: true` constructor option, middleware deduplication removal + RFC A context-symbol guard, `['~orpc']` layout changes) + 3 advisory rows (pathless prefixes, OpenAPI `3.2.0` / `base`, 15 s keep-alive); proven in Probe B4.
- [x] **B5:** Replaced invented names with real upstream `@orpc/tanstack-query@2.0.0-beta.53` names (`streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`, `fnOptions`) and custom `queryFn` guidance for `refetchMode: 'replace'` (not `'reset'`).
- [x] **B6:** Removed invalid `baseContract.use(...)` syntax; redesigned around `@orpc/openapi/extensions/route` (with explicit limits) + type-valid `.meta(accessMeta(...))` & `defineContractErrors(...)`; proven in Probe B6.
- [x] **B7:** Decided single redirect policy: **`redirect: 'error'`** enforced after `...init` spread in `http-client-link.ts:192` (rejecting `'manual'` because it resolves `undefined`), consistent with PR #2659; Security §2 corrected; proven with foreign-origin 307 server in Probe B7.
- [x] **B8 + Phase 0 split + Advisories:** Dropped `>60%` claim in favor of deduplicated counts (186 raw → 99 unique sites / 25 files in groups 1–11); replaced Phase 1/2 shadow CI contradiction with maintained `chore/orpc-v2-shadow` branch + achievable Phase 2 GA gate; defined `0.1.0` GA + `0.0.x` 90-day `release/orpc-v1` version scheme; split Phase 0a (safe) vs Phase 0b (held); recorded `1.16.5` run & dependency-age note; fixed milestone `0.0.10`, table row count (19), e2e pins, `.llm/tools/deps/scan-npm-catalog-compliance.ts`, codemod limits & acceptance corpus, `getErrorHttpStatus` MessagePort/router-client caveat, raw `ORPCError` re-export removal, and removed nonexistent public `createServiceClient` `fetch` option.
