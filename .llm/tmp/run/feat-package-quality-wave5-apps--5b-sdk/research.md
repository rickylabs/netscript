# Research — Sub-wave 5b: `@netscript/sdk`

Generator session (Fable 5). Scope: RESEARCH + PLAN & DESIGN only. No implementation.
Branch: `feat/package-quality-wave5-apps-5b-sdk` @ fork from umbrella tip `19cae06`
(includes 5a merge + umbrella drift commit).

This sub-wave carries an explicit **architecture-design mandate** (umbrella drift,
2026-06-11 user feedback): not just package hygiene — design for composability layers
(one-liner → factory → seams), engine/transport adapter seams, full type inference, DX.

## 0. MEASURE-FIRST baseline

Source: `.llm/temp/measure-5b-sdk.ts` → `measure-5b.json`. Matches umbrella re-baseline.

| Gate | Result |
| --- | --- |
| `deno check --unstable-kv` (all 12 entrypoints) | **PASS** |
| doc-lint **COMBINED** over 12 entrypoints (ground truth) | **29**: 9 `private-type-ref`, 2 `missing-return-type`, 18 `missing-jsdoc` |
| doc-lint barrel-only `mod.ts` | 20 (undercount confirms combined-sweep rule) |
| `deno publish --dry-run` | **FAIL**: 2 slow-types + **37 `excluded-module`** (root `deno.json` excludes `packages/sdk/` — same artifact as 5a drift D-2, predicted there) |
| Tests | **0** |
| LOC | 3,117 across 37 files; **1 over-cap**: `discovery/service-discovery.ts` 643L |
| deno.json | description/license/publish block PRESENT (better than service was); **tasks missing** |

### 0.1 Doc-lint decomposition (combined raw, attributed)

- **7 of 9 ptr are NOT in sdk** — they point at
  `packages/plugin-streams-core/src/{application/create-durable-stream.ts,builders/define-stream-schema.ts}`:
  `StreamStateDefinition`, `StateSchema`, `StreamProducerPort` are package-owned there
  but not exported from the declaring module's public chain, surfaced through sdk's
  `./streams` facade re-export (`streams.ts`
  re-exports `createDurableStream as createStreamProducer`, `DurableStreamProducer`,
  `defineStreamSchema`, …). Cross-package attribution: upstream Wave-4 package debt
  reached via sdk.
- **2 ptr in sdk**: `QueryClient` (`@tanstack/query-core`) leaked by
  `createNetScriptQueryClient(): QueryClient` (query-client-factory.ts:43) and
  `QueryCollectionOptions['queryClient']` (create-query-collection.ts:28).
- **2 missing-return-type == the 2 slow-types**:
  `createServiceQueryUtils` (query-client/create-service-query-utils.ts:50 — returns
  inferred `createTanstackQueryUtils(...)`, double `any`-bridged) and
  `createQueryCollection` (collections/create-query-collection.ts:54 — returns inferred
  `createCollection(...)`).
- **18 missing-jsdoc**: core/cache-provider.ts ×5, query-client/types.ts ×10 (property
  members), query-client/kv-cache-persister.ts ×3.
- Per-entrypoint runs over-count (sum 98) because shared deps re-lint per run; the
  query/query-client per-EP "ptr 30" storm is the *inferred* upstream return type of
  `createServiceQueryUtils` — fixing D-6 (below) collapses it.

## 1. Architecture inventory — what the sdk actually is

The sdk **already has a 3-layer shape with a real ports layer** — it is the most
architecturally advanced Wave-5 package, just unevenly executed:

| Layer | What exists | Quality |
| --- | --- | --- |
| **Seams/ports** (`interfaces/`) | `ContractLike` type algebra (standard-schema `~standard` + oRPC `~orpc` structural inference → `ServiceClient<TContract>` mapped type — full typing with ZERO upstream type imports); `CacheStore`/`CacheEntry`/`QueryKey`; `ServiceTransport` (forward-declared) | Excellent type design; **folder name violates F-11** (`interfaces` forbidden); `ServiceTransport` is declared but **never used** by the client impl |
| **Primitives/adapters** | `CacheQuery` (KV-backed SWR engine w/ inflight dedup), `KvCacheStore`, discovery (Aspire env + Vite browser lookup), otel middleware, openapi helpers | Solid; discovery 643L over-cap; module-level `inflightRequests` map |
| **Factories** | `createServiceClient` (RPCLink + retry/dedupe/trace plugins), `createQueryFactory`/`createQueryFactories` (per-action method + `.invalidate/.key/.prefetch/.getCachedData/.queryOptions/.mutationOptions` per RFC 17 §3.3), `createServiceQueryUtils`, `createQueryCollection`, `createNetScriptQueryClient` | Good runtime; typing gaps at the two TanStack bridges |
| **One-liner preset** | **MISSING** | RFC 17 §2.2 usage shows the cost: per service, consumers hand-wire `createServiceClient` + `createQueryFactories` + `createServiceQueryUtils` (3 calls × N services of boilerplate in `api-clients.ts`) |

## 2. Seam analysis (RFC 14 + RFC 17 + user feedback)

- **RFC 14 §3 transport switch**: `createServiceClient()` call sites are identical in
  distributed vs unified mode; unified mode swaps *generated wiring* to oRPC
  `createRouterClient` (in-process). RFC 14 P0 backlog: "createServiceClient() unified
  mode transport — Integrate". Obligation here: **protect the seam, don't implement** —
  the link/transport construction must become an injectable internal port so the
  in-process adapter can land later without changing the public API.
  `interfaces/transport.ts#ServiceTransport` is the declared seam; today
  `client/service-client.ts` constructs `RPCLink` inline (seam not wired).
- **RFC 17 §2**: sdk is "the single entry point — one import, both worlds";
  `@netscript/sdk/query-client` + `/collections` are RFC-mandated subpaths; type flow
  contract → client → query utils → island hook must be inference-only.
- **User feedback (umbrella drift 2026-06-11)**: same gap class as service/Hono —
  the *types* are ported, the *engine wiring* is not.

## 3. Consumer census (this worktree, grep)

| Subpath | In-tree consumers |
| --- | --- |
| `.` (root) | 12 refs (cli kernel constants/import-resolver, fresh error/define-page/define-fresh-app, …) |
| `./query-client` | 6 (fresh/query) |
| `./client` | 5 |
| `./query` | 4 |
| `./cache` | 2 (fresh/utils/cache-entry) |
| `./interfaces` | 1 (fresh) |
| `./discovery` | 1 (`packages/queue/factory/create-queue.ts`: `getServiceUrl`, `isServiceAvailable`) |
| `./adapters`, `./collections`, `./openapi`, `./telemetry`, `./streams` | **0 in-tree** (collections/streams are RFC-17/16 deliverables consumed by playground examples + test-app root services outside this tree; `plugin-streams-core` docs reference `sdk/discovery` mirroring) |

F-16 input: 12 subpaths, 5 with zero in-tree consumers — each needs justify-or-fold.

## 4. Precedents

- 5a (service): structural mirror types + interface-not-class + root-exclude lift +
  gate-evidence commit pairing — all proven, reuse directly.
- telemetry `src/orpc/_types.ts`: structural compatibility for upstream plugin shapes.
- sdk's own `interfaces/service-client.ts`: the in-house gold standard for
  inference-only typing (`ContractSchemaInput/Output` infer from `~standard.types`).
- TS structural typing: a port type (e.g. `QueryClientPort`) accepts the real upstream
  instance; risk is only members the port omits.

## 5. Risk inputs

- `ServiceQueryUtils<TContract>` mapped return type (D-6) is the hardest slice: must
  stay assignable to what `useQuery`/`useMutation` accept AND keep inference parity
  with `createTanstackQueryUtils`. Mitigation: compile-time assignability tests against
  a real contract fixture + the actual upstream return.
- `QueryClient` port (D-5): tanstack APIs consume QueryClient nominal-ish surfaces;
  port must cover all members used by sdk + fresh/query + collections.
- `./streams` fix touches `plugin-streams-core` (Wave 4 package) — cross-package slice
  needs its own gate run + consumer-gate attribution.
- Root-exclude lift (37 errors) — same playbook as 5a slice 15.
- discovery split: `import.meta.env` browser path is fragile — keep behavior-parity
  tests around env lookup ordering.
