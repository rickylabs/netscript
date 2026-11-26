# Supervisor Record — RFC B (`plan/rfc-orpc-v2-readiness-2672`)

- **Run ID:** `plan-rfc-orpc-v2-readiness-2672--rfc`
- **Issue:** `https://github.com/rickylabs/netscript/issues/2672`
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2674`
- **Companion RFC:** PR `#2673` (tracking issue `#2671`)
- **Branch:** `plan/rfc-orpc-v2-readiness-2672`
- **Original branch base:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (current `origin/main` inventory verified at `00325a531` with `@orpc/*@^1.16.6` via `#2690` and Deno `2.9.8` via `#2689`)
- **Milestone:** `0.0.10` (Phase 0a targets `0.0.10`; Phase 2 cut-over targets `0.1.0`)
- **Primary deliverable:** `rfcs/0000-orpc-v2-readiness.md`
- **Status:** Fix Round 4 complete addressing Gemini Hydrogen xhigh's Round-4 PLAN-EVAL N1 Phase 0a CORS/Vary reconciliation + both advisories (`Object.prototype` Proxy guard & supervisor record refresh); ready for PLAN-EVAL Round 5.

## Route & Lane Assignment

| Role | Assigned model / lane | Notes |
| --- | --- | --- |
| Author / research lane | Gemini 4 Neon | Drafted RFC B + throwaway `2.0.0-beta.53` prototype (deleted cleanly); completed Fix Rounds 1–4 + standalone v2 behavior probes (`probes/v2-behavior-probes.ts` on `1.16.6` vs `2.0.0-beta.53`, Deno `2.9.8`); zero committed edits to `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. |
| Round-1 reviewer | Fable 5.2 | Returned `CHANGES_REQUESTED` (`issuecomment-7170652451`) with 8 blockers (B1–B8), historical `1.16.5` verification, and advisories. |
| Round-2 reviewer | Gemini 4 Hydrogen | Round-2 PLAN-EVAL (`6501e41c`) confirmed B3/B5/B7 resolved, B1/B2/B4/B6/B8 partial, and raised N1–N5 + 3 advisories. |
| Round-3 reviewer | Sol 6.2 xhigh | Round-3 PLAN-EVAL (`issuecomment-7201965825` on `d0982419`) confirmed N3 resolved and raised N1 (real-link `426` + CORS + blue-green preflight), N2 (`413`/`429` in Proxy), N4 (`1.16.6` `.route()` retention), N5 (`1.16.6` frozen rejection control + `desktop-native` import map), §4.6 `0.0.x` semver, and `#2690` main drift. |
| Round-4 reviewer | Gemini 4 Hydrogen xhigh | Round-4 PLAN-EVAL (`issuecomment-7203578723` on `8f125538`) confirmed N2, N4, N5, §4.6 semver, and `#2690` main drift **100% Resolved**, with 1 remaining N1 Phase 0a contradiction (§4.4 vs §4.1/§4.2 on `cors-response-authority_test.ts` & `packages/service/README.md:167-169`) plus 2 advisories (`Object.prototype` guard on `createDefault500ErrorStatusMap` Proxy & `supervisor.md` refresh). |

## Round-4 Blocker & Advisory Closure Checklist

- [x] **N1 Phase 0a CORS/Vary reconciliation (§4.4 vs §4.1/§4.2, `cors-response-authority_test.ts`, `packages/service/README.md:167-169`):** Scoped Phase 0a `X-NetScript-RPC-Protocol` `allowHeaders` preflight addition and `Vary: X-NetScript-RPC-Protocol` strictly to mounted RPC paths (`rpcPath` / `rpcAliases`, default `/api/rpc/*`) so non-RPC routes (`/raw`, `/health`, `/api/status` OpenAPI) stay completely untouched (preserving line `432` and all non-RPC cases at lines `197`, `267`, `304`, `476`); removed §4.4's false *"stays 100% green"* claim and explicitly listed the planned Phase 0a updates to `packages/service/README.md:167-169` and the `/api/rpc/ping` assertions at `packages/service/tests/cors-response-authority_test.ts:197,267,304,476`.
- [x] **Advisory 1 (`Object.prototype` guard on `createDefault500ErrorStatusMap` Proxy):** Guarded `!(prop in Object.prototype)` in both `get` and `getOwnPropertyDescriptor` traps in `probes/v2-behavior-probes.ts` and RFC §2 row 6, asserting `typeof proxy.toString === 'function'`, `typeof proxy.valueOf === 'function'`, `proxy.constructor === Object`, and `String(proxy) === '[object Object]'` in Probe B4.
- [x] **Advisory 2 (`supervisor.md` refresh):** Updated status and review-routing table to reflect Round 3 (Sol 6.2 xhigh), Round 4 (Gemini Hydrogen xhigh), and Fix Round 4.

## Round-3 Blocker Closure Checklist (Sol 6.2 xhigh — N2, N4, N5, §4.6, #2690 verified Resolved in Round 4)

- [x] **N1 (CORS-wrapped `426`, real `1.16.6` & `beta.53` links, blue-green preflight):** Mounted protocol guard inside CORS (`withCors()`, v2 `before: ['~cors']`, v1 `order: 0 < 9e6`), emitted protocol-matched `ORPCError` JSON envelopes, and proved real v1.16.6 & v2 beta.53 links + blue-green `OPTIONS` preflight in Probe B1.
- [x] **N2 (Complete upstream `COMMON_ERROR_STATUS_MAP` preserving `413`/`429`):** Seeded `mergeErrorStatusMaps`, `createDefault500ErrorStatusMap`, and `resolveErrorHttpStatus` from complete 23-code `COMMON_ERROR_STATUS_MAP`, proving `PAYLOAD_TOO_LARGE` (`413`) and `TOO_MANY_REQUESTS` (`429`) survive in standalone handlers and plugin resolver in Probe B4.
- [x] **N4 (Phase 0b v1 `.route()` retention):** Required v1 (`0.0.x`) callers to retain `.route(...)` until `0.1.0` (`routeMeta` kept strictly at `0.1.0`), verified via `1.16.6` failing-then-passing control in Probe B6.
- [x] **N5 (Frozen lock fixtures on `00325a531` + standalone `desktop-native` import map):** Required a distinct absent rejection version (e.g., `npm:@orpc/client@1.16.5`) in `locked-probes_test.ts` and `install-generated-probe_test.ts`, explicitly preserved standalone `desktop-native` import map (`fixture-contract-driver.ts`, `fixture-workspace.ts`), and noted cleaning unused `@orpc/server` from `packages/contracts/package.json`.
- [x] **§4.6 `0.0.x` semver & `#2690` main drift:** Fixed `0.0.x` semver rules (`^0.0.10`/`^0.0.11` exclude `0.0.12`; explicit bump to `^0.0.12` or `~0.0.10` / `>=0.0.10 <0.1.0`), refreshed inventory to `origin/main` `00325a531` (`^1.16.6`, 181 files, Deno `2.9.8`), marked `87965d800`/`1.15.5`/`1.16.5` measurements historical, and moved Probe B1–B7 v1 imports to `1.16.6`.

## Earlier Rounds (Round-1 B1–B8 & Round-2 N3)

- [x] **B1–B8 & N3:** All Round-1 blockers (Fable 5.2) and Round-2 N3 (GET/HEAD/POST/PUT/PATCH/DELETE verb parity + paired `allowGetRpc: false` / `transportPolicy: { method: () => 'POST' }`) resolved and verified in Probes B1, B2, B4, B6, and B7.
