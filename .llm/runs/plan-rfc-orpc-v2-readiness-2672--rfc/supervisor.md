# Supervisor Record — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

- **Run ID:** `plan-rfc-orpc-v2-readiness-2672--rfc`
- **Issue:** `https://github.com/rickylabs/netscript/issues/2672`
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2674`
- **Companion RFC:** PR `#2673` (tracking issue `#2671`)
- **Branch:** `plan/rfc-orpc-v2-readiness-2672`
- **Base commit:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (`main`)
- **Milestone:** `0.0.10` (Phase 0a targets `0.0.10`; Phase 2 cut-over targets `0.1.0`)
- **Primary deliverable:** `rfcs/0000-orpc-v2-readiness.md`
- **Status:** Round-1 fix complete addressing all 8 Fable 5.2 blockers (B1–B8) and advisory items; ready for Round-2 review by Gemini Hydrogen.

## Route & Lane Assignment

| Role | Assigned model / lane | Notes |
| --- | --- | --- |
| Author / research lane | Neon | Drafted RFC B + throwaway `2.0.0-beta.53` prototype (deleted cleanly); completed Round-1 fixes + standalone v2 behavior probes (`probes/v2-behavior-probes.ts`); zero committed edits to `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. |
| Round-1 reviewer | Fable 5.2 | Returned `CHANGES_REQUESTED` (`issuecomment-7170652451`) with 8 blockers (B1–B8), `1.16.5` verification, and advisory items. |
| Round-2+ reviewer | Gemini Hydrogen | Re-checks Round-1 revision and subsequent rounds per owner routing. |

## Round-1 Blocker Closure Checklist

- [x] **B1:** Mixed v1/v2 RPC silent corruption (`bigint` → `"10"`, error degradation) decided via Phase 0a `X-NetScript-RPC-Protocol` fail-closed `426` guard + blue-green gateway routing / empirically verified `OpenAPILink` JSON-only bridge (dual-major `/api/rpc/v2` mount dropped); proven in Probe B1.
- [x] **B2:** GET-first query policy decided: explicit contract-declared `GET` allow-list (`getOpenAPIMeta(proc)?.method === 'GET'`) + `GetMethodCsrfProtectionHandlerPlugin` + `SameSite=Lax|Strict` invariant (opt-out `allowGetRpc: false` for `SameSite=None`), replacing `inferRPCMethodFromContractRouter`; proven in Probe B2.
- [x] **B3:** `CORSPlugin` removal moved OUT of Phase 0a (preserving tested v1 origin-reflection behavior in `cors-response-authority_test.ts`) and reclassified as an explicit breaking security tightening at `0.1.0` with opt-in `RPCHandlerConfig.cors`; Security §1 corrected.
- [x] **B4:** All 6 silent runtime changes mapped with exact files & required behavior tests (`rootInterceptors` → `routingInterceptors`, server-side `error.status` readers, `400` unmapped status fallback + status-map conflict rule, ignored `defined: true` constructor option, middleware deduplication removal + RFC A context-symbol guard, `['~orpc']` layout changes) + 3 advisory rows (pathless prefixes, OpenAPI `3.2.0` / `base`, 15 s keep-alive); proven in Probe B4.
- [x] **B5:** Replaced invented names with real upstream `@orpc/tanstack-query@2.0.0-beta.53` names (`streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`, `fnOptions`) and custom `queryFn` guidance for `refetchMode: 'replace'` (not `'reset'`).
- [x] **B6:** Removed invalid `baseContract.use(...)` syntax; redesigned around `@orpc/openapi/extensions/route` (with explicit limits) + type-valid `.meta(accessMeta(...))` & `defineContractErrors(...)`; proven in Probe B6.
- [x] **B7:** Decided single redirect policy: **`redirect: 'error'`** enforced after `...init` spread in `http-client-link.ts:192` (rejecting `'manual'` because it resolves `undefined`), consistent with PR #2659; Security §2 corrected; proven with foreign-origin 307 server in Probe B7.
- [x] **B8 + Phase 0 split + Advisories:** Dropped `>60%` claim in favor of deduplicated counts (186 raw → 99 unique sites / 25 files in groups 1–11); replaced Phase 1/2 shadow CI contradiction with maintained `chore/orpc-v2-shadow` branch + achievable Phase 2 GA gate; defined `0.1.0` GA + `0.0.x` 90-day `release/orpc-v1` version scheme; split Phase 0a (safe) vs Phase 0b (held); recorded `1.16.5` run & dependency-age note; fixed milestone `0.0.10`, table row count (19), e2e pins, `.llm/tools/deps/scan-npm-catalog-compliance.ts`, codemod limits & acceptance corpus, `getErrorHttpStatus` MessagePort/router-client caveat, raw `ORPCError` re-export removal, and removed nonexistent public `createServiceClient` `fetch` option.
