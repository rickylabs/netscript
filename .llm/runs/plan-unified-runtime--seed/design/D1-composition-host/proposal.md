# D1 — Composition-host design pack: proposal

Topic **D1 composition-host** of seed run `plan-unified-runtime--seed` (issue #824), feeding epic
**#823** core issues. Frame: the ratified Stage-C synthesis
(`../../synthesis.md`) and the Stage-B corpus (`../../research/nitro-v3.md`,
`../../research/orpc-fresh.md`, `../../research/drift-ledger.md`). Every load-bearing claim below
cites a corpus file or a repo path. GitHub wins on conflict after Stage H.

## 0. Scope

This pack designs the **composition contract** for the unified runtime: how a Nitro v3 host, the
NetScript service (oRPC over `ServiceApp.fetch`), and a Fresh 2 UI compose into one logical
application graph. It does **not** design the capability/preset matrix (that is D2) or the board
decomposition/milestone train (that is D3). Where D1 needs a capability outcome it names the D2/D3
seam rather than deciding it.

## 1. The universal invariant: logical composition root

**Decision.** The universal invariant of the unified runtime is **logical graph identity — one
composition root** that wires the service, RPC handler, and Fresh UI into a single application
model. Physical one-process (one-OS-process) execution is a **per-preset capability**, not a
universal promise (synthesis §7 verdict 3; drift-ledger D-01, D-02).

**Rationale.** RFC §3's "earn the graph" default (one process unless a constraint earns an edge) is
preserved as the *default realization*, but Nitro deploy presets can emit a Node server,
provider/serverless output, or clustered execution, so the application cannot assert OS-process
identity across presets (drift-ledger D-01, citing
[Nitro deploy](https://nitro.build/deploy)). Therefore:

- The **composition root** is a single module that constructs the graph (service builder result +
  Fresh app + host bindings) deterministically, regardless of preset. It is the one place a mount
  table, prefix map, and lifecycle registry are declared.
- **"No application-created loopback"** is the invariant that survives every preset: the graph is
  wired by in-process delegation over the Web Fetch contract, never by the application opening a
  socket back to itself (drift-ledger D-02, D-07).
- **Physical single-process** is a capability a preset either advertises or does not. D1 owns the
  logical-root contract; **D2 owns the per-preset `process: in-process | provider-managed`
  column.** A preset that cannot host the graph in one process still satisfies the invariant if it
  preserves logical composition and creates no application loopback (drift-ledger D-02).

**Acceptance seam.** A conformance test asserts that a built graph exposes exactly one composition
root and that no adapter or bridge opens a loopback HTTP client to the host's own listener. The
physical-process assertion is scoped to presets whose D2 capability cell declares
`process: in-process`.

## 2. Nitro host integration (listener / lifecycle / plugins / close)

**Decision.** **Nitro owns process startup, the single listener, top-level error observation, and
shutdown.** The composition root registers the graph *into* Nitro; it never starts its own server
(synthesis §5; drift-ledger D-10; orpc-fresh.md "Proposed composition boundary" step 3).

### 2.1 Listener ownership

Exactly **one outer listener per process**, owned by Nitro. Neither the Fresh app nor the service
may call `listen()` / `Deno.serve` (orpc-fresh.md row "Fresh 2": `app.listen()` "starts its own
listener and must not be combined with another server startup"; drift-ledger D-10). Enforced by a
"no nested listen" acceptance test (§6).

### 2.2 Lifecycle hooks and ordering

Nitro exposes `request`, `response`, `error`, and `close` hooks; plugin registration is
**synchronous**; **static files run before middleware/routes**; request-hook errors are reported
but do **not** stop the pipeline (nitro-v3.md "Lifecycle" row, citing
[Nitro lifecycle](https://nitro.build/docs/lifecycle),
[Nitro plugins](https://nitro.build/docs/plugins)). Consequences the composition root must encode:

- **Do not assume Fresh/Hono middleware order matches Nitro's pipeline** — define an explicit
  ordering bridge rather than inheriting it (nitro-v3.md "Lifecycle" implication).
- Because static assets run before middleware, **static ownership must be declared** (see §3.3) so
  Nitro's public-asset stage does not shadow an RPC or Fresh route.

### 2.3 The `close` hook = single-shot teardown

**The Nitro `close` hook is the one place NetScript adapters and background workers are disposed,
and it must dispose each exactly once** (orpc-fresh.md "Lifecycle" bridge row; drift-ledger D-10).
The composition root maintains a **disposal registry**: every adapter/worker constructed during
graph assembly registers a `close`/`[Symbol.asyncDispose]` callback; the Nitro `close` hook drains
the registry in reverse construction order, idempotently. Embedding Fresh must not create its own
listener whose shutdown competes with this hook (orpc-fresh.md, [Fresh App
docs](https://usefresh.dev/docs/concepts/app)).

**Acceptance seam.** A test drives the Nitro `close` hook and asserts every registered adapter's
disposer ran exactly once (idempotent under a double-close).

### 2.4 Plugins

Nitro plugin registration is synchronous (nitro-v3.md "Lifecycle"). The composition root exposes
the graph to Nitro as a plugin (or plugin set) that binds routes at startup and registers the
`close` disposer. Async adapter construction (DB pools, queue connections) is performed *before*
plugin registration and the resolved handles are closed over, so registration itself stays
synchronous.

## 3. Fresh mount via `app.handler()`

**Decision.** The composition mounts the Fresh UI by calling **`app.handler()`** (a
Request→Response handler expressly for embedding) and **never `app.listen()`** (orpc-fresh.md rows
"Fresh 2" and "NetScript Fresh wrapper", citing [Fresh App docs](https://usefresh.dev/docs/concepts/app)).

### 3.1 The shipped wrapper is already embeddable

`defineFreshApp()` (`packages/fresh/src/runtime/server/define-fresh-app.ts:1-119`) creates a Fresh
`App`, installs state/security/tracing middleware, applies config, and adds filesystem routes; its
test already invokes `app.handler()` with a Web `Request`
(`packages/fresh/src/runtime/server/define-fresh-app.test.ts:55-105`). D1 reuses this wrapper
unchanged. **Its middleware ordering and filesystem routes must remain intact** when embedded
(orpc-fresh.md "NetScript Fresh wrapper" row) — the composition root mounts the handler as an opaque
Fetch delegate and does not reach inside its middleware chain.

### 3.2 Route ownership

Declare **non-overlapping** route spaces: RPC subtree, health/metadata, Fresh UI, static assets.
Fresh resolves middleware/routes top-to-bottom while Nitro runs its own public-assets and route
pipeline, so an **implicit catch-all can bypass Fresh middleware or shadow the RPC subtree**
(orpc-fresh.md "Route ownership" bridge row). Rule: **Fresh is mounted as the final application
fallback for the UI route space only, after the RPC prefix and health/metadata paths are matched by
Nitro.** No wildcard is registered above the RPC prefix.

### 3.3 Static-asset ownership

Choose per namespace whether Nitro or Fresh owns each asset space, and test cache headers,
fallbacks, and error pages **through the composed entry point** — ownership cannot be inferred from
a shared Fetch type because both frameworks have asset stages, and Nitro's runs first (orpc-fresh.md
"Static assets" bridge row; nitro-v3.md "Lifecycle"). D1 declares the default: **Fresh owns its own
`_fresh`/island asset namespace; Nitro owns any host-level public directory**, and the two
namespaces are declared disjoint in the mount table.

## 4. In-process oRPC bridge over `ServiceApp.fetch`

**Decision.** The service is invoked **in-process** by delegating a Web `Request` into the shipped
service Fetch surface and the oRPC Fetch `RPCHandler` — **no socket loopback, and no second codec**
(synthesis §4 verdict; drift-ledger D-07; orpc-fresh.md "Proposed composition boundary" step 1).

### 4.1 Invocation placement, not a new protocol

Transport is modeled as **invocation placement over a stable Fetch/RPC contract**, not a switch
between two wire protocols (drift-ledger D-07). The building blocks already exist:

- `ServiceApp` structurally exposes `fetch(request): Promise<Response>` and `request(...)`;
  `FetchHandler` exposes `handle(request): Promise<Response>`
  (`packages/service/src/types.ts:13-20`, `packages/service/src/types.ts:206-212`).
- `createRPCHandler()` already constructs oRPC's Fetch `RPCHandler`, calls
  `handler.handle(request, { context })`, returns the response on a match, and emits a 404 otherwise
  (`packages/service/src/primitives/handlers.ts:115-143`).
- The service builder returns a **Hono-backed** app, but its public result is the structural
  `ServiceApp` Fetch surface, not a Hono/H3 type
  (`packages/service/src/builder/service-builder-impl.ts:423-433`,
  `packages/service/src/types.ts:13-20`). **This separation is the compatibility asset: the host
  consumes `fetch`, it does not reach into Hono** (orpc-fresh.md "Existing request/response seams").

### 4.2 Mount contract

The composition root mounts the NetScript/oRPC `FetchHandler` under the **single canonical RPC
prefix**, carried into both H3 matching and oRPC `handler.handle(..., { prefix })` (orpc-fresh.md
"Prefix and base path" bridge row, citing [oRPC H3 adapter](https://orpc.dev/docs/adapters/h3)).
In-process delegation passes the Web `Request`, request-scoped auth/telemetry **context**, and the
**abort signal** into the handler — matching the live oRPC H3 pattern without a loopback hop
(orpc-fresh.md steps 1–2). This preserves issue #451's invariant (identical Request/Response API
paths, no loopback) without Nitro knowing the Hono implementation (orpc-fresh.md "Proposed
composition boundary"; [issue #451](https://github.com/rickylabs/netscript/issues/451)).

### 4.3 Context bridge

Define explicitly how **Nitro/H3 request state becomes NetScript auth, trace, and service
context**. The service handler accepts a `context` factory
(`packages/service/src/primitives/handlers.ts:119-128`); the oRPC H3 example supplies request
context at the adapter call (orpc-fresh.md "Context" bridge row). D1's contract: a single
`toServiceContext(h3Event | request)` adapter produces the context passed to `handler.handle`, and
it is the only translation seam — no per-route context assembly.

### 4.4 Error semantics

Preserve oRPC's **match/404 behavior** and decide which failures stay **typed RPC errors** versus
reaching Nitro's top-level `error` hook
(`packages/service/src/primitives/handlers.ts:124-142`; orpc-fresh.md "Error semantics" bridge row).
D1's rule: RPC-domain errors are serialized by the oRPC handler and returned as responses (they do
**not** propagate to Nitro's `error` hook); only host/composition failures (adapter construction,
disposal, unhandled non-RPC throws) reach the Nitro `error` hook.

### 4.5 Streaming and upgrade paths

Treat ordinary Fetch responses, streamed responses, and **WebSocket upgrades** as **distinct
conformance cases**. Nitro WebSocket support is opt-in via CrossWS/H3 and is **not implied** by
mounting an ordinary Fetch handler (orpc-fresh.md "Streaming and upgrade paths" row; nitro-v3.md
"WebSocket/SSE" row). D1 requires each case be exercised through the composed entry point; stream
persistence and auth semantics stay **above** the transport (nitro-v3.md "WebSocket/SSE"
implication).

## 5. Version pins (Nitro compatibility date, oRPC generation)

**Decision.** The implementation lane pins exact versions and treats upgrades as gated, because both
substrates are moving betas (synthesis §4, §1; drift-ledger D-11; nitro-v3.md board input 1).

- **Nitro v3** is public beta with intentional breaking changes and a living migration guide; its
  output contract uses a **compatibility date** to pin provider behavior (nitro-v3.md "Verdict",
  "Cloud deploy presets", citing [v3 beta](https://nitro.build/blog/v3-beta),
  [deploy](https://nitro.build/deploy)). **Pin an exact Nitro v3 version and a compatibility date;
  make upgrade compatibility a board gate. Do not describe the runtime as stable** (nitro-v3.md
  board input 1).
- **oRPC**: the repo pins **`^1.14.6`** while the live oRPC H3 docs carry a **v2 public-beta**
  banner (`packages/service/deno.json:10-20`; drift-ledger D-11; orpc-fresh.md "Version
  compatibility" row). **Pin the implementation lane's oRPC generation and add an H3-bridge
  conformance test; do not plan against an unqualified live beta example.** The conformance gate
  asserts the mounted adapter's `handle(request, { prefix, context })` contract against the pinned
  generation, so a future v2 adoption is a deliberate, tested migration — not silent drift.

## 6. Acceptance gates (feed epic #823 issues)

These are the board-card gates D1 hands to the issue drafts (§ epic-and-issues.md):

- **G-ROOT** — one logical composition root; no application-created loopback client. Physical
  single-process asserted only where D2 declares `process: in-process`.
- **G-LISTEN** — "no nested listen": neither Fresh nor service starts a listener; Nitro owns the
  sole listener.
- **G-CLOSE** — Nitro `close` hook disposes every registered adapter/worker exactly once,
  idempotent under double-close.
- **G-ROUTE** — RPC / health / Fresh-UI / static route spaces are declared disjoint; no catch-all
  above the RPC prefix; Fresh middleware reached for its route space.
- **G-STATIC** — asset ownership declared per namespace; cache headers, fallbacks, error pages
  verified through the composed entry point.
- **G-RPC** — in-process delegation over `ServiceApp.fetch` / oRPC `RPCHandler`; no socket loopback;
  single canonical prefix into both H3 match and `handler.handle`; context + abort signal carried.
- **G-ERR** — RPC-domain errors return as typed responses; only host failures reach Nitro `error`.
- **G-STREAM** — ordinary, streamed, and WebSocket-upgrade responses each exercised through the
  composed entry point.
- **G-PIN** — exact Nitro version + compatibility date pinned; oRPC generation pinned; H3-bridge
  conformance test present and green.

## 7. What D1 explicitly defers

- Per-preset `process`, `sagas`, KV/queue/database ownership, writer/lock, and offline-sync columns
  → **D2 capability matrix** (synthesis §D2; drift-ledger D-03, D-05, D-06, D-08, D-09).
- `@netscript/data` vs shipped `@netscript/database` naming: board language normalizes to the
  **shipped** `@netscript/database` name; a `@netscript/data` facade would need its own contract
  card (drift-ledger D-12; synthesis §6). D1 uses `@netscript/database` where it references data.
- Epic decomposition, milestone train, supersession of #451/#453/#454/#455/#349 → **D3
  board-mechanics** (synthesis §D3).
