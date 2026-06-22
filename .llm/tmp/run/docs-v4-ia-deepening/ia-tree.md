# Proposed 3-level IA — docs-v4 (Capability-Hub model)

**Model:** Zone → Product-area pillar → Leaf. Max 3 authored levels (tutorials get a 3rd step
sub-level). Diátaxis modes (Concepts / Quickstart / How-To / Reference) run UNIFORMLY *inside* each
pillar, per the repo's own `doc-architecture-patterns.md` and Astro's group→Diátaxis-within pattern.
Polyglot/runtime (Deno-native vs Aspire, KV vs Postgres vs Redis) is a horizontal **code-switcher
tab inside leaves**, never a folder level. Single global sidebar — no parallel per-pillar sidebars
(Medusa's documented failure mode).

```
START (shallow front door)
├─ Why NetScript
├─ Install & your first app (Quickstart)
├─ Architecture overview (concepts hub, illustrated nav cards)
└─ Glossary / mental model

PILLARS  (each: ▸ Overview & Concepts · Quickstart · How-To guides · API Reference)
│
├─ 1. WEB LAYER — @netscript/fresh   ← PROMOTED to multi-page section
│     Overview & islands/SSR concepts        [./server]
│     Pages & the define-page builder         [./builders · definePage]
│     Routing & type-safe route contracts     [./route]
│     Data loading & query/cache              [./query + root `.` cache helpers:
│                                               hasAllCacheEntries · minCachedAt ·
│                                               projectCachedItemFromList]
│     Forms & validation                      [./form · Standard Schema]
│     Deferred / streaming UI                 [./defer + ./streams SSE]
│     Interactive islands & client query      [./interactive]
│     Build / Vite integration                [./vite]
│     Error handling & diagnostics            [./error]
│     Testing pages & islands                 [./testing]
│     Examples / sandbox                      [showcase leaf]
│
├─ 2. SERVICES & SDK
│     oRPC services overview · define a service · service discovery
│     typed SDK client (createServiceClient) · query client integration
│     Reference: service / sdk export tables
│
├─ 3. BACKGROUND PROCESSING
│     Workers overview · define a task · per-task Deno permissions
│     Polyglot runtimes (deno/python/shell/dotnet/…) [runtime tab]
│     Queues & schedulers (kv/redis/rabbit/postgres) [provider tab]
│     Reference: workers / queue / scheduler tables
│
├─ 4. DURABLE WORKFLOWS
│     Sagas overview · durability tiers · Prisma vs KV store [store tab]
│     Triggers (cron/webhook) · retry/DLQ · defer (limitation)
│     Streams (durable producer · SSE consumption · limitations)
│     Reference: sagas / triggers / streams tables
│
├─ 5. DATA & PERSISTENCE
│     Database overview · multi-db (netscript db add) [engine tab]
│     KV / queue / cron providers (auto-detect + explicit)
│     Reference: database / kv tables
│
├─ 6. IDENTITY & ACCESS
│     Auth overview & the Principal model
│     Backends: better-auth · WorkOS · kv-oauth [backend tab]
│     better-auth plugins (orgs/2FA/magic-link/…) ← gated on seam decision
│     Multi-tenancy & roles/scopes/claims
│     Limitations (single-active backend, interactive sign-in, audit)
│     Reference: auth / principal tables
│
├─ 7. ORCHESTRATION & RUNTIME
│     Aspire app host & resource graph · runtime-config resolution
│     Reference: aspire / config tables
│
└─ 8. OBSERVABILITY
      Telemetry & OTel traceparent · what is/ isn't instrumented
      Reference: telemetry tables

TUTORIALS (zone; each tutorial = sequential step pages, the only sanctioned 3rd level)
├─ live-dashboard   (Fresh + SDK cache-first — the flagship Track-D path)
├─ workspace        (orgs/multi-tenancy — reworked to use auth org plugin IF seam built)
├─ storefront
└─ erp-sync

REFERENCE (thin global API index that fans out into each pillar's Reference leaves)
EXPLANATION (architecture, durability-model, auth-model, plugin-system, observability, aspire)
```

## Open IA choices for PLAN-EVAL / Codex panel to stress
- Split "Background Processing" (workers/queues) from "Durable Workflows" (sagas/triggers/streams),
  vs one "Background & Durability" pillar. Proposed: split (8 pillars) — closer to user intent of
  deeper structure; panel to confirm against cognitive-load.
- Whether Reference stays a global catalog (TanStack/Medusa) or fully dissolves into pillars.
  Proposed: pillar-local Reference leaves + a thin global index.
- Fresh "Examples/sandbox" leaf: prose now, live StackBlitz later (backlog).

## Decision that gates the auth pillar shape
The "better-auth plugins" leaf (pillar 6) and the workspace-tutorial rework BOTH depend on the
seam decision (see seam-coverage.md): if the `plugins` passthrough is built, those pages document a
first-class factory path; if doc-only, they document the escape hatch. Resolve before locking plan.
