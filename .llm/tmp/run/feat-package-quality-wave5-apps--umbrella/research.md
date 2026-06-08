# Wave 5 — Apps Layer (sdk · service · fresh · fresh-ui) — Architectural Research

Run ID: `feat-package-quality-wave5-apps--umbrella`
Umbrella branch: `feat/package-quality-wave5-apps` (off track `feat/package-quality` @ `9b27fb4`)
Author: SUPERVISOR pre-research (read-only). **Not** a PLAN-EVAL/IMPL-EVAL artifact.
Status: **PREPARED — PLAN-LOCK BLOCKED ON WAVE 4** (see `context-pack.md`).

> This is the architect's pass the user asked for: not JSR cleanup, but a re-architecture
> brief. Wave 5 is the **last wave before CLI (Wave 6)** and the **most RFC-laden, least
> doctrine-aligned** group on the board. The bar: **at minimum equal, ideally exceed, the
> plugin-tier (Wave 3/4) quality**, tighten cross-package integration, and ensure every
> **seam** exists so CLI starter commands can compete with `create-next-app` and TanStack Start.

---

## §0. Provenance & why this wave is different

Unlike Wave 4 (the runtimes/plugins, which arrived pre-polished from `netscript-start#96`
and **all 9 PASS `deno publish --dry-run` with 0 slow types** — fine-tuning), the Wave 5
packages are the **organic growth layer**. They were extended across **RFC 12/13/15/16/17**
(composable builder, streaming SSR/PSR, forms, e2e streams, TanStack SDK integration) — all
authored **before the doctrine existed and before the plugin rewrite set the quality bar**.
RFC 14 (Unified Mode / Next.js alternative) remains **unimplemented** and dictates seams the
public surface must anticipate now.

**Consequence, measured at base `9b27fb4`: every Wave 5 package FAILS `deno publish --dry-run`.**
This is real publishability debt, not cleanup.

| Pkg | Archetype (proposed) | src files | src LOC | dry-run | doc-lint (full-export) | F-1 over-cap | tests | README | docs/ | ./testing | tasks |
|-----|---------------------|----------:|--------:|---------|-----------------------:|-------------:|------:|-------:|:-----:|:---------:|-------|
| `@netscript/service`  | **A4** (+A3 health/Hono) | 6  | 1,649  | **FAIL ×8** | 23  (1 jsdoc / 8 ret / 14 priv) | 2  | **0** | **0L (missing)** | ✗ | ✗ | **none** |
| `@netscript/sdk`      | **A3** (+A4 factories)   | 37 | 3,117  | **FAIL ×2** | 29  (18 / 2 / 9)       | 1  | **0** | 204L | ✗ | ✗ | **none** |
| `@netscript/fresh-ui` | **A4 Browser**           | 68 | 5,377  | **FAIL ×6** | **0**                 | 1  | 9  | 279L | ✗ | ✗ | check,test |
| `@netscript/fresh`    | **A4+A3 Browser** (multi) | 60 | 13,285 | **FAIL ×4** | **276** (157 / 4 / 115) | **13** | 16 | 262L | ✗ | ✗ | check,test |

Totals: **171 src files, ~23.4k src LOC, 328 doc-lint errors, 20 over-cap files, 20 slow-type
publish errors, 2 packages with 0 tests, 1 with no README, 0/4 with `docs/`, 0/4 with `./testing`.**

`fresh` alone = **57% of the LOC, 84% of the doc-lint debt, 65% of the over-cap files.** It is
the largest single restructure on the entire S1 board.

---

## §1. Package roles, surfaces & RFC lineage

### `@netscript/service` (1 export · `.`)
The backend service builder. `createService()` wraps Hono; `define-service.ts` is the preset;
`primitives/health.ts` + the readiness/error handlers are runtime concerns.
- **Surface:** single root `.` export, **1 public symbol** — but `mod.ts` re-exports a builder +
  presets + health/error/readiness handlers. The 8 slow-types + 14 `private-type-ref` show the
  one barrel **leaks internal handler/health types** into the public API.
- **Archetype:** primarily **A4 (DSL/Builder)** — `define-service` + `service-builder`. Health/
  readiness/error handlers are **A3 runtime behavior** (Aspire/runtime validation candidate).
- **Roughest unit on the board:** no README, no `docs/`, no tasks, no tests, 2 over-cap files
  (`service-builder` 503, `define-service` 478). Comparable to Wave 4's `watchers` lift —
  this is a **structural greenfield-quality pass**, not a tune.
- **RFC lineage:** RFC 14 §5.3 ("Hono throughout") — `createService()` already wraps Hono; the
  unified-mode story rides on this package staying Hono-native.

### `@netscript/sdk` (12 exports)
The data/transport layer — NetScript's answer to "fetch + cache + types end to end."
Subpaths: `. adapters cache client collections discovery interfaces openapi query query-client
streams telemetry`.
- **Core symbols:** `createServiceClient` (transport), `createQueryFactories`, `CacheQuery`
  (SWR runtime), `ActionMethod`, composite queries, KV cache persistence; `discovery/
  service-discovery.ts` (643 LOC, Aspire env resolution) is the over-cap file.
- **Archetype:** **A3 (Runtime/Behavior)** — SWR cache lifecycle, transport, discovery are
  runtime behavior ⇒ **F-13 + Runtime/Aspire validation required**. `createQueryFactories`/
  `ActionMethod` are an A4 factory surface layered on top.
- **RFC 17 (implemented):** extended `ActionMethod` with `.queryOptions()/.mutationOptions()/
  .clientKey()`; added `query-client` (`@orpc/tanstack-query` bridge) and `collections`
  (TanStack DB) subpaths. **These are the newest, least-doctrine-aligned subpaths** and the
  prime F-16/F-18 cardinality/sub-barrel suspects.
- **RFC 16 (implemented):** `streams.ts` single-file export (durable streams client seam).
- **RFC 14 (UNIMPLEMENTED) seam mandate:** `createServiceClient()` must expose a **`Transport`
  abstraction** (today `HonoHttpTransport`; unified mode adds `InProcessTransport` via oRPC
  `createRouterClient()`). RFC 14 §3 freezes the *call site*; the alpha public signature must
  not need a breaking change to inject a second transport later. **Verify/clamp this seam in 5b.**

### `@netscript/fresh-ui` (2 exports · `. interactive`)
The UI foundation: registry manifest + foundational seams (`Button`, `Input`, `Card`, layout
objects) + machine-backed interactive seams (`Dialog`, `Tabs`, `Popover`...).
- **Surface paradox:** doc-lint = **0** (the two `.ts` barrels are clean re-export shells) yet
  dry-run **FAIL ×6** — the slow-types live in transitively-reached **`.tsx` component return
  types**. So the work here is **return-type annotation on component factories**, not jsdoc.
- **Archetype:** **A4 (DSL/Builder), Browser subtype** — F-13 n/a, **Browser/real-route
  validation required**; F-2/F-4 status per matrix.
- **`registry/manifest.ts` (441 LOC)** is the CLI-scaffolding contract (RFC 06/07). This is a
  **Wave 6 dependency**: `netscript new`/component-add reads this manifest. Stabilize + doc it.
- **RFC 06/04:** `@netscript/ui-primitives` (the JSR-publishable framework-agnostic layer) is
  **explicitly deferred** — do NOT create it in Wave 5; fresh-ui ships the seams.

### `@netscript/fresh` (12 exports) — THE LONG POLE
The frontend runtime. Subpaths: `. server builders route defer form error utils streams query
interactive vite`.
- **Multi-archetype by construction** — this is why it must split:
  - `builders/` (`definePage`) — **A4 DSL/Builder**, Browser subtype. `builders/mod.ts` 1111,
    `define-page/builder.tsx` 1098, `types.ts` 712, `navigation.tsx` 667, `runtime.tsx` 575.
  - `route/` — **A3 runtime** (route manifest, contract binding). `route/mod.ts` 756,
    `contract.ts` 601, `manifest.ts` 464.
  - `defer/` + `streams/` — **A3 streaming runtime** (RFC 13 PSR + RFC 16 e2e streams).
  - `form/` — **A4** (RFC 15 forms). `schema-adapter.ts` 577, `field-descriptors.ts` 519,
    `types.ts` 475.
  - `query/` — **A3** (RFC 17 TanStack island bridge — `QueryIsland`, `getIslandQueryClient`).
  - `error/`(412) `utils/` `server.ts` `config/vite.ts` `interactive.ts` — support seams.
- **276 doc-lint errors** dominated by **157 missing-jsdoc + 115 `private-type-ref`**. The
  `private-type-ref` count is the architectural tell: the public builder/route/form surface is
  **entangled with unexported internal types** — a serious F-5 encapsulation failure. Fixing
  this is **surface re-design**, not annotation.
- **13 files over the 350-LOC cap**, two over 1,000. F-1 per-layer caps will force real
  decomposition of `define-page` and `route`.
- **RFC 14 §10 seam mandate:** `defineFreshApp()` is *explicitly* the shipped-smaller-than-target
  contract ("intended extension point, not the currently shipped baseline" — RFC 14 §10). Alpha
  must keep the builder **open for extension** (SOLID-O) so `target`/`auth`/`middleware`/`sagas`
  can be added without breaking the contract. **Do not implement unified mode; protect the seam.**

---

## §2. Systemic findings (apply to all four)

1. **All four FAIL `deno publish --dry-run`** (20 slow-type errors total: service 8, fresh-ui 6,
   fresh 4, sdk 2). F-6 publishability is a hard gate and currently red across the board.
2. **`private-type-ref` is the headline architectural debt** (sdk 9, service 14, fresh 115 =
   **138 total**). Public APIs reference unexported types ⇒ either the type must be exported
   (widening surface — weigh against F-16) or the signature must change to a public type. This
   is **surface design work** and the single biggest driver of plan effort.
3. **`docs/` missing on all four; `./testing` port-contract missing on all four.** The doctrine
   bar (per Wave 2/3) wants a docs scaffold + a `./testing` entrypoint exporting in-memory/
   fake adapters for consumer tests. Net-new on every unit.
4. **Two zero-test packages** (`sdk`, `service`) — same gap as Wave 4's A5 plugin tier. `fresh`
   (16) and `fresh-ui` (9) have tests but coverage-vs-archetype-layers is unmeasured; A3 needs
   abort/cleanup/defensive tests, Browser subtype needs real-route validation.
5. **`service` has no README and no tasks** — full metadata lift (README ≥150 doctested, task
   hygiene `check`/`test`/`doc-lint`/`publish-check`).
6. **Task hygiene uneven:** sdk/service have **no tasks at all**; fresh/fresh-ui have only
   `check`+`test` (no `doc-lint`/`publish` task). Standardize the task block per doctrine.
7. **Cardinality risk (F-16) + sub-barrel (F-18):** sdk and fresh each expose **12 entrypoints**.
   Several are RFC-era additions (sdk `query-client`/`collections`/`streams`; fresh `query`/
   `streams`/`interactive`/`vite`). Each must justify its existence as a public subpath vs being
   folded — and each subpath barrel must obey F-18 shape. **This is the central surface debate.**

---

## §3. Cross-package integration seams (the user's "integrate even better" mandate)

Wave 5 is where the four packages must stop being four silos and present **one coherent app
layer**. The seams to harden (and the doctrine gates they touch):

| Seam | From → To | RFC | Risk |
|------|-----------|-----|------|
| Query factories | `sdk` (`createQueryFactories`) → `fresh` (`withLayer` loaders) | 05/12/17 | Type flow contract→sdk→fresh must be gap-free (RFC 17 "zero gaps") |
| TanStack island bridge | `sdk/query-client` + `sdk/collections` → `fresh/query` (`QueryIsland`) | 17 | Newest code; subpath cardinality; Preact-compat (OQ3) |
| Durable streams | `sdk/streams` → `fresh/streams` | 16 | Mode-parity (Caddy/plugin/unified) |
| Forms | `fresh/form` (`withForm`) → `fresh-ui` form seams (`Field`/`FieldError`/`SubmitButton`) | 15 | Cross-package component contract |
| Registry/scaffold | `fresh-ui/registry/manifest` → **CLI (Wave 6)** | 06/07 | Wave 6 hard dependency; manifest must be stable + documented |
| Transport | `sdk` `createServiceClient` `Transport` → unified `InProcessTransport` | 14 | Seam must exist in alpha surface (don't break later) |
| App composition | `fresh` `defineFreshApp` ← auth/middleware/sagas | 14 §10 | Builder must stay open-for-extension |

**Architect's note:** RFC 17 v3 ("bake TanStack into the SDK itself — server cache and client
cache are two sides of the same coin") is the strongest integration thesis already realized in
code. Wave 5 should **preserve and doctrine-shape** it, not re-litigate it. The risk is purely
surface hygiene (cardinality, private-type-ref, docs), not architecture.

---

## §4. RFC 14 (Unified Mode) — seam obligations, NOT implementation

RFC 14 is a 3–5 month roadmap and **out of scope to implement** in Wave 5. But it is the
framework's headline differentiator ("mode-parity guarantee" vs Next.js), and Wave 5 owns the
public surfaces it rides on. The **alpha surface must not require a breaking change** to later
add unified mode. Concrete obligations to verify/protect during Plan & Design:

1. **`sdk` `createServiceClient({ contract, serviceName })`** — confirm the options object can
   later accept an injected `transport` (HonoHttp today, InProcess later) without a signature
   break. Prefer an internal `Transport` interface even if only one impl ships. (RFC 14 §3.1)
2. **`sdk` `createQueryFactories` / `CacheQuery`** — RFC 14 §4.2 **freezes this API**; the KV
   backend swaps underneath (`NitroKvAdapter`). Wave 5 must keep the cache layer behind the
   `@netscript/kv` adapter interface (Wave 2), not a concrete Deno KV import.
3. **`fresh` `defineFreshApp`** — keep open for `target`/`auth`/`middleware`/`sagas` (RFC 14
   §10). Document the shipped baseline vs the extension target explicitly in `docs/`.
4. **No new Nitro adapters in Wave 5.** `NitroKvAdapter`/`NitroTaskAdapter`/`NitroScheduled`
   are RFC 14 Phase-A work for the kv/workers/cron packages, not this wave.

Deliverable: a short "Unified-mode seam audit" note per package in its `docs/architecture.md`
stating whether the alpha surface is forward-compatible and recording any seam that needs a
(non-breaking) shape tweak now to avoid a breaking one later.

---

## §5. CLI-readiness obligations (Wave 6 is next)

Wave 5 is the last wave before `@netscript/cli`. CLI ships **starter commands** (the existing
scaffold) meant to compete with `create-next-app` / `create-tanstack`. For that to work, these
seams must be **stable + documented + tested** by the end of Wave 5:

- `fresh-ui/registry/manifest.ts` — the component catalog the CLI copies from (RFC 06/07 D7).
- `fresh` `defineFreshApp` + `definePage` presets — what generated route files import (RFC 07).
- `service` `define-service` preset — what `service:add` scaffolds.
- `sdk` `createQueryFactories` / `createServiceClient` — what generated `lib/service-clients.ts`
  + `utils/queries.ts` import (RFC 14 §3, RFC 05).
- `./testing` entrypoints — so scaffolded apps get a test harness out of the box.

If a seam is unstable at Wave 5 close, **record it as arch-debt** so Wave 6 plans around it.

---

## §6. Evidence base (consumer proof — at test-app root, NOT in this worktree)

The framework repo (this worktree) holds `packages/` only. The **consumer evidence** lives at
the test-app workspace root and is read-only reference for the generator:

- `apps/playground` (208 files, ~24k LOC) — the **complete rewrite** that showcases the framework
  end-to-end. This is the concrete proof the seams work. Use it to validate that any surface
  change keeps the playground compiling.
- `apps/frontend` (146 files, ~28k LOC) — the **old** app (the "temporary proving ground" RFC 01
  calls out). Reference for what the rewrite replaced; do not optimize for it.
- `.resources/rfcs/frontend/` — 17 RFCs. Read order for the generator: README (map) → 04
  (package boundaries) → 03 (contract/vision) → 12 (definePage) → 05 (runtime/defer) → 17
  (TanStack SDK) → 16 (streams) → 15 (forms) → 13 (streaming) → 14 (unified seams) → 06/07 (UI/
  scaffold, for fresh-ui + CLI-readiness).
- `.llm/tmp/run/feat-frontend-rfc-implementation--*` (~22 runs) — implementation evidence for
  RFC 13/15/16/17 + the kv/logger/telemetry/cron package refactors and SOLID/benchmark passes.
  Mine these for "what was already decided and why" before re-deciding anything.

**Zero-consumer rule:** before removing/renaming any public symbol, grep `apps/playground`,
`apps/frontend`, `services/`, and the `@netscript/*` packages for consumers. No shims in alpha —
but no silent breakage of the playground either.

---

## §7. Archetype reconciliation (settle in Plan & Design, per unit)

| Unit | Proposed primary | Secondary | Gate implications |
|------|------------------|-----------|-------------------|
| `service`  | **A4** DSL/Builder | A3 (health/readiness/Hono runtime) | F-13 n/a for A4 core; **Runtime/Aspire validation** for the health surface |
| `sdk`      | **A3** Runtime/Behavior | A4 (factories) | **F-13 + Runtime/Aspire validation required**; consumer-import required |
| `fresh-ui` | **A4 Browser subtype** | — | F-13 n/a; **Browser/real-route validation required** |
| `fresh`    | **A4 + A3, Browser subtype** | per entrypoint cluster (builders=A4, route/defer/streams/query=A3) | **mixed** — the strongest argument for the per-cluster sub-split (§ split-strategy). F-13 subtype + Browser + Runtime validation |

The dispute to resolve: a multi-archetype package (`fresh`) is declared per the **dominant
archetype of each public entrypoint cluster**, recorded in `docs/architecture.md`, with the
gate set being the **union** of the clusters' required gates. PLAN-EVAL must confirm.

---

## §8. Blocked inputs (why PLAN-LOCK waits on Wave 4)

- `fresh/streams` + `sdk/streams` depend on the stream **plugin** contracts; Wave 4 ships
  `@netscript/plugin-streams-core` + `plugin-streams`. The mode-parity story (RFC 16 §9) couples
  the client factories here to those producers. Lock the fresh/sdk stream surface **after** Wave 4
  fixes the streams package surface, to avoid double-churn.
- `fresh` consumes `@netscript/plugin` indirectly via app composition (sagas/workers in
  `defineFreshApp` §10 seam). Wave 3 (`@netscript/plugin`) + Wave 4 (the runtime plugins) should
  be merged so the consumer scan reflects the final plugin surface.
- The reconciliation pass (post-Wave-4) re-runs the cross-package consumer scan against the
  merged track surface before opening sub-wave 5a.

---

## §9. Headline judgment

**This is a re-architecture wave, full stop.** The numbers (4/4 dry-run FAIL, 328 doc-lint, 138
private-type-ref, 20 over-cap, 2 zero-test, 1 no-README, 0 docs/, 0 ./testing) put it well below
the plugin tier today. The mandate is to **raise it to — and past — plugin quality**, with three
architect-level throughlines beyond JSR readiness:

1. **Surface encapsulation** (kill the 138 private-type-ref leaks via deliberate public-type
   design + F-16 cardinality discipline on the 12-subpath packages).
2. **Forward-compatible seams** (RFC 14 transport + `defineFreshApp` extension points designed so
   unified mode never needs a breaking alpha change; cross-package integration per §3).
3. **CLI-readiness** (stable, documented, tested registry/preset/testing seams so Wave 6 starter
   commands compete with Next.js/TanStack Start).

`fresh` is the long pole and **must** split into per-cluster sub-waves (see `split-strategy.md`).
The rest are tractable single units, with `service` needing a greenfield-quality metadata+test
lift on top of its slow-type fixes.
