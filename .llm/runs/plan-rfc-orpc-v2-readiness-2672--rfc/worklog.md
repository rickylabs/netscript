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

## Round-2 Review (Gemini Hydrogen) & Round-2 Fix Evidence Ledger

- Gemini Hydrogen Round-2 PLAN-EVAL (reviewed head `6501e41c1793af2564094fccb9b9d6b390f79094`) confirmed **B3**, **B5**, and **B7** resolved, **B1**, **B2**, **B4**, **B6**, and **B8** partial, reproduced the `186 raw` → `99 unique sites` in `25 files` count and `--isolatedDeclarations` trial, and raised five blocking findings (**N1–N5**) plus three advisories.

### 1. Additional Source & Upstream Verification (Round 2)

- Re-inspected `packages/service/src/middleware/service-cors.ts:17-26`, `packages/sdk/tests/integration/client-contribution-adapter_test.ts:25-30,389-406` (`OMITTED_CONTRIBUTION_BASELINE`), `packages/telemetry/tests/orpc/plugin_test.ts:85-130`, `packages/telemetry/src/orpc/{tracing-plugin.ts:23-65,276,error-plugin.ts:164-275}`, `packages/service/src/primitives/handlers.ts:77-191`, `packages/sdk/src/internal/transport-policy.ts`, `packages/sdk/tests/transport-policy_test.ts:1-60`, `packages/contracts/{deno.json,src/domain/procedure-meta.ts,src/application/contract-primitives.ts,crud/create-crud-contract.ts:351-378,tests/procedure-meta-independence_test.ts}`, `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:64-106`, `plugins/sagas/services/src/routers/v1-handlers.ts:186-198`, `packages/cli/e2e/src/application/gates/scaffold/{locked-probes_test.ts:1-40,install-generated-probe_test.ts:1-55}`, `.llm/tools/deps/scan-npm-catalog-compliance.ts`, and `.llm/tools/validation/check-breaking-migration.ts`.
- Inspected cached `@orpc/openapi@2.0.0-beta.53/dist/{extensions/route.js,meta.js,index.js}` and `package.json` (confirming `route.js:3` imports `@orpc/server` at runtime while `getOpenAPIMeta` reads `meta['~openapi']`), and `@orpc/server@2.0.0-beta.53/dist/adapters/standard/rpc-handler-codec.js` (confirming `getOwn(this.errorStatusMap, error.code) ?? 400`).

### 2. Round-2 Standalone Behavior Probes (`probes/v2-behavior-probes.ts`)

- **B1 + N1:** Reproduced naive `426` guard returning `426` on CORS `OPTIONS` preflight, then verified `OPTIONS`-exempt guard + `CORSHandlerPlugin` with `withProtocolHeaderAllowed(...)` returning `204` with `Access-Control-Allow-Headers: Authorization, Content-Type, X-NetScript-RPC-Protocol`, `Vary: X-NetScript-RPC-Protocol` on BOTH `200` `GET` and `426` responses, and `426` rejection of headerless v1 clients (allowing `0.0.10` to stay zero-preflight / server-only).
- **B2 + N3:** Verified `PUT`, `PATCH`, `DELETE`, and `HEAD→GET` parity (`200`) under updated `allowMethods` and SDK inference helper (`transport-policy_test.ts:35`, `create-crud-contract.ts:367-378`), plus verified `allowGetRpc: false` rejects unpaired `GET` (`404`) and succeeds (`200`) when paired with client `transportPolicy: { method: () => 'POST' }`.
- **B4 + N2:** Verified in real `RPCHandler` instances that v1 `1.15.5` runs `rootInterceptors` and ignores `routingInterceptors` while v2 runs `routingInterceptors` and ignores `rootInterceptors`; verified `mergeErrorStatusMaps` fail-fast on conflict; verified unconditional `createDefault500ErrorStatusMap` Proxy on standalone `RPCHandlerV2` and `OpenAPIHandlerV2` (zero `ErrorHandlingPlugin`) returns HTTP `500` while preserving `code: 'CUSTOM_INFRA_FAILURE'`; verified `'status' in err === false` and `resolveErrorHttpStatus` for `TracingPlugin`/`LoggingPlugin`/`ErrorHandlingPlugin`.
- **B6 + N4:** Verified server-free `routeMeta` (`defineMeta('~openapi', ...)`), `accessMeta` (`defineMeta('access', ...)`), and `policyMeta` (`defineMeta('policy', ...)`) using ONLY `@orpc/contract` produce exact `.meta.access` & `.meta.policy` keys, match `getOpenAPIMeta`, and generate OpenAPI `3.2.0` documents via `OpenAPIGenerator` (`{ base: { info } }`) with zero `@orpc/server` dependency in `@netscript/contracts`.
- **N5 & Advisories #1–#3:** Separated isolated temp-dir e2e tests (`locked-probes_test.ts`, `install-generated-probe_test.ts`) from workspace `catalog:` consolidation, scoped catalog CI failure to `@orpc/*`, refreshed PR `#2674` body with `## Breaking change and migration`, aligned §5 with RFC A head `bd8d51c0` & Prior Art with PR `#2659` head `f8c8d8fd`, aligned `0.0.12+` `release/orpc-v1` numbering, and cited `plugins/sagas/services/src/routers/v1-handlers.ts:193`.

## Validation Table (Round-2 Fix)

| Check | Command | Result |
| --- | --- | --- |
| Standalone v2 Behavior Probes typecheck (`--no-lock --no-config`) | `mise exec -- deno check --no-lock --no-config .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts` | PASS (exit 0) |
| Standalone v2 Behavior Probes (B1+N1, B2+N3, B4+N2, B6+N4, B7) | `mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts` | PASS (`5 passed \| 0 failed`, 32 ms) |
| Workspace `deno.json` & `deno.lock` untouched | `git status -s` / `git diff --stat deno.lock deno.json` | PASS (docs & `.llm/runs/` only) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-v2-readiness.md --pretty` | PASS (`docs=1 broken-links=0 broken-anchors=0 orphans=0`) |
| Privacy & closing-keyword scan | Pattern scan on RFC + `.llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/` | PASS (`0 hits`) |

## Round-3 Review (Sol 6.2 xhigh) & Fix Round 3 Evidence Ledger

- Sol 6.2 xhigh Round-3 PLAN-EVAL (`issuecomment-7201965825`, reviewed head `d0982419665e4a43076c1444cd874bbc4b655fed` against `origin/main` `00325a531`) confirmed **N3** resolved, reproduced all 5 probes on Deno `2.9.8` (including with v1 moved to `1.16.6`), and raised 6 blocking/drift items: **N1** (stale-client `426` decoding in real `1.16.6`/`beta.53` links + CORS headers missing on `426` + blue-green preflight path), **N2** (`createDefault500ErrorStatusMap` Proxy clobbering `PAYLOAD_TOO_LARGE` `413` and `TOO_MANY_REQUESTS` `429` to `500`), **N4** (Phase 0b `.meta(routeMeta(...))` leaving native route empty & inferring `POST` on `1.16.6`), **N5** (`locked-probes_test.ts:30-39` & `install-generated-probe_test.ts:69` using `1.16.6` as the frozen rejection control on `00325a531` + standalone `desktop-native` shipped import map), **§4.6 semver** (`^0.0.10` excludes `0.0.12`), and **`#2690` main drift** (`^1.16.6` landed on `00325a531`, Deno `2.9.8` via `#2689`).

### 1. Additional Source & Upstream Verification (Round 3, 2026-11-26)

- Inspected `@orpc/client@1.16.6/dist/shared/client.{B7SEju5B,DHrvRzXF}.mjs` (`StandardRPCLinkCodec.decode`, `isORPCErrorJson` requiring `{ defined, code, status, message, data }` inside `{ json }`), `@orpc/client@2.0.0-beta.53/dist/{adapters/standard/rpc-link-codec.js,error-utils.js}` (`isORPCErrorJson` forbidding `"status"` and requiring `{ defined, code, message, data }` inside `{ json }`), `@orpc/server@2.0.0-beta.53/dist/{plugins/cors.js,adapters/standard/rpc-handler-codec.js,adapters/standard/plugin.js}` (`CORSHandlerPlugin` `name = '~cors'` prepending `corsHeadersInterceptor`/`preflightInterceptor`, and exported 23-code `COMMON_ERROR_STATUS_MAP`), and `@orpc/server@1.16.6/dist/plugins/index.mjs` (`CORSPlugin` `order = 9e6` unshifting into `rootInterceptors`).
- Inspected `origin/main` (`00325a531`) directly: `deno.json` (`^1.16.6` catalog, workspace members excluding `desktop-native`), `deno.lock` (23 `@orpc/*` npm entries still retaining `1.15.0` + transitive `1.15.5`), `packages/contracts/{deno.json,package.json}` (unused `"@orpc/server": "catalog:"`), `packages/cli/e2e/fixtures/desktop-native/deno.json`, `packages/cli/e2e/src/adapters/native-desktop/{fixture-workspace.ts,fixture-contract-driver.ts}` (#1926 shipped standalone import map check), and `packages/cli/e2e/src/application/gates/scaffold/{locked-probes_test.ts,install-generated-probe_test.ts}`.
- Verified `jsr:@std/semver@1` on Deno `2.9.8`: `^0.0.10` satisfies only `0.0.10` (`0.0.11`/`0.0.12` false), while `~0.0.10` and `>=0.0.10 <0.1.0` satisfy `0.0.10`–`0.0.13` and exclude `0.1.0`.

### 2. Round-3 Standalone Behavior Probes (`probes/v2-behavior-probes.ts`, `1.16.6` vs `2.0.0-beta.53`, Deno `2.9.8`)

- **B1 + N1:** Reproduced naive bare-JSON `426` guard omitting `Access-Control-Allow-Origin`, causing `1.16.6` `RPCLink` to decode `MALFORMED_ORPC_ERROR_RESPONSE` and `beta.53` `RPCLink` to throw `MalformedResponseError`. Proved `ProtocolGuardHandlerPlugin` (`before: ['~cors']` on v2; `order: 0 < 9e6` on v1, matching outer Hono `withCors()` ordering) emits `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, and merged `Vary: X-NetScript-RPC-Protocol, Origin` on `204` preflights, `200` responses, AND `426` rejections; proved wire-compatible `ORPCError` JSON envelopes decode cleanly as `ORPCError('CLIENT_UPGRADE_REQUIRED', { status: 426 })` in real `@orpc/client@1.16.6` and `ORPCError('CLIENT_PROTOCOL_UNSUPPORTED')` with `ResponseError(426)` in real `@orpc/client@2.0.0-beta.53`; and proved the cross-origin blue-green gateway preflight path (`OPTIONS` routed to Phase 0a v1 blue pool → `204` allowing `X-NetScript-RPC-Protocol`, followed by `GET` with `orpc-v2` routed to v2 green pool → `200`).
- **B4 + N2:** Seeded `mergeErrorStatusMaps` and `createDefault500ErrorStatusMap` from complete upstream `COMMON_ERROR_STATUS_MAP` (23 built-in codes) and updated `resolveErrorHttpStatus` to check `errorStatusMap` + `COMMON_ERROR_STATUS_MAP` before `500`; proved `PAYLOAD_TOO_LARGE` (`413`) and `TOO_MANY_REQUESTS` (`429`) survive unchanged in standalone `RPCHandlerV2`, standalone `OpenAPIHandlerV2`, AND `resolveErrorHttpStatus` (even with `{}` custom map) alongside `ORDER_LOCKED` (`409`) and unknown `CUSTOM_INFRA_FAILURE` (`500` preserving `code`).
- **B6 + N4:** Added failing control on `@orpc/contract@1.16.6` proving `.meta({ '~openapi': { method: 'GET', ... } })` leaves `~orpc.route` empty and infers `'POST'`; proved Phase 0b v1.16.6 contracts retaining `.route(...)` alongside `accessMeta`/`policyMeta`/`defineContractErrors` preserve `'GET'` inference and exact `.meta.access`/`.meta.policy`, while v2 `0.1.0` cuts over to server-free `routeMeta` via `defineMeta('~openapi', ...)`.
- **N5, §4.6 semver, & `#2690` drift:** Updated RFC §1, §3, §4.1, §4.6, Downstream consumers, Rationale, and `drift.md` to current `origin/main` `00325a531` (`^1.16.6`, 181 files, Deno `2.9.8`), marking `87965d800`/`1.15.5`/`1.16.5` as historical; documented distinct absent frozen rejection requirement (e.g., `npm:@orpc/client@1.16.5`) and preserved standalone `desktop-native` import map; fixed `0.0.x` semver backport guidance (`^0.0.10` → `^0.0.12` explicit bump or `~0.0.10` / `>=0.0.10 <0.1.0`).

## Validation Table (Round-3 Fix, Deno `2.9.8`)

| Check | Command | Result |
| --- | --- | --- |
| Standalone v2 Behavior Probes typecheck (`--no-lock --no-config`) | `mise exec -- deno check --no-lock --no-config .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts` | PASS (exit `0`) |
| Standalone v2 Behavior Probes (`1.16.6` vs `2.0.0-beta.53`) | `mise exec -- deno test --no-lock --no-config -A .llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/probes/v2-behavior-probes.ts` | PASS (`5 passed \| 0 failed`, `45ms`) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-v2-readiness.md --pretty` | PASS (`docs=1 broken-links=0 broken-anchors=0 orphans=0`) |
| Breaking-migration PR body gate | `mise exec -- deno run --no-lock -A .llm/tools/validation/check-breaking-migration.ts --repo rickylabs/netscript --pr 2674` | PASS (`ok: true`) |
| Workspace `deno.json` & `deno.lock` untouched + closing-keyword scan | `git diff --stat origin/plan/rfc-orpc-v2-readiness-2672 -- deno.lock deno.json` & pattern scan | PASS (`0` diff, `0` closing-keyword hits) |
