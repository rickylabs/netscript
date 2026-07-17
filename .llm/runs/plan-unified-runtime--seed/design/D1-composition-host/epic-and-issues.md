# D1 — Sub-issue DRAFTS (draft text only — NO GitHub mutation)

**These are DRAFTS.** Nothing here is filed. No issue is created, labelled, or milestoned until the
owner ratifies the decision brief in-turn at Stage H and the supervisor files once from the manifest
(seed-run.md Stage H). Bodies use `Part of #823` (reference only) and **never** a closing keyword —
epics/umbrellas close by hand (netscript-pr SKILL).

Milestone suggestions below are **provisional** — the synthesis anchors epic #823 to beta.12+ but
records the exact milestone split as a Stage-E owner fork (synthesis §"Resolutions"). Treat every
milestone cell as an owner-confirmable suggestion, not a decision. Where the live milestone set only
exposes `0.0.1-beta.1` / `0.0.1-stable` / `Backlog / Triage`, the mapping to a `beta.12` train
milestone is itself an owner fork (see open-questions.md #4).

Common labels for every card below: `type:feat`, `epic:deployment`, one `status:` (`status:triage`
at filing), a `priority:`, a `wave:`, plus per-card `area:` and `gate:`.

---

## D1-1 — Composition root: logical graph identity + no-loopback invariant

- **Title:** Unified runtime: single logical composition root with no application-created loopback
- **Labels:** `type:feat`, `area:service`, `area:deploy`, `epic:deployment`, `priority:p1`,
  `wave:v1`
- **Milestone (suggested):** unified-runtime train (beta.12+) — owner fork #4
- **Body:**
  > Part of #823
  >
  > Establish the composition root as the single module that wires the NetScript service, oRPC
  > handler, and Fresh UI into one logical application graph. The universal invariant is **logical
  > graph identity — one composition root**; physical single-OS-process execution is a per-preset
  > capability (declared by the capability matrix, not here). The invariant that holds on every
  > preset is **no application-created loopback**: the graph is wired by in-process Fetch delegation,
  > never by opening a socket back to the host's own listener. See design pack
  > `.llm/runs/plan-unified-runtime--seed/design/D1-composition-host/proposal.md` §1.
  >
  > Acceptance gates:
  > - [ ] gate: build exposes exactly one composition root (a single mount/prefix/lifecycle registry)
  > - [ ] gate: no adapter or bridge opens a loopback HTTP client to the host listener
  > - [ ] gate: physical single-process asserted only for presets whose capability cell declares `process: in-process`
  > - [ ] gate:e2e composed entry point boots and serves the graph through one root

## D1-2 — Nitro host bridge: listener + lifecycle + synchronous plugins + single-shot close

- **Title:** Unified runtime: Nitro owns listener/lifecycle; single-shot `close` disposal registry
- **Labels:** `type:feat`, `area:deploy`, `epic:deployment`, `priority:p1`, `wave:v1`
- **Milestone (suggested):** unified-runtime train (beta.12+) — owner fork #4
- **Body:**
  > Part of #823
  >
  > Bind the composition root into Nitro v3 as a synchronous plugin. **Nitro owns process startup,
  > the single listener, top-level `error` observation, and shutdown.** Async adapter construction
  > (DB pools, queue connections) happens before plugin registration; resolved handles are closed
  > over so registration stays synchronous. Every adapter/worker registers a disposer; the Nitro
  > `close` hook drains the registry in reverse construction order, **exactly once**, idempotent
  > under double-close. The lifecycle bridge is explicit — do not assume Fresh/Hono middleware order
  > matches Nitro's pipeline, and account for Nitro running static files before middleware/routes.
  > See proposal.md §2 (evidence: `research/nitro-v3.md` Lifecycle row).
  >
  > Acceptance gates:
  > - [ ] gate: no nested listen — Nitro is the sole listener owner
  > - [ ] gate: `close` hook disposes every registered adapter/worker exactly once (idempotent under double-close)
  > - [ ] gate: plugin registration is synchronous; async construction resolved beforehand
  > - [ ] gate: only host/composition failures (not RPC-domain errors) reach Nitro's `error` hook

## D1-3 — Fresh mount via `app.handler()`: route + static ownership

- **Title:** Unified runtime: mount Fresh via `app.handler()` with declared route/static ownership
- **Labels:** `type:feat`, `area:fresh`, `area:deploy`, `epic:deployment`, `priority:p1`,
  `wave:v1`
- **Milestone (suggested):** unified-runtime train (beta.12+) — owner fork #4
- **Body:**
  > Part of #823
  >
  > Mount the Fresh UI by calling `defineFreshApp()`'s `app.handler()` as an opaque Fetch delegate —
  > **never `app.listen()`**. Preserve the shipped wrapper's middleware ordering and filesystem
  > routes intact (`packages/fresh/src/runtime/server/define-fresh-app.ts`). Declare non-overlapping
  > route spaces (RPC subtree, health/metadata, Fresh UI, static assets); Fresh is the final UI
  > fallback only, mounted after Nitro matches the RPC prefix and health paths — no wildcard above
  > the RPC prefix. Declare static-asset ownership per namespace (default: Fresh owns its
  > island/`_fresh` assets; Nitro owns host public dir) and verify through the composed entry point.
  > See proposal.md §3 (evidence: `research/orpc-fresh.md` Route/Static ownership rows).
  >
  > Acceptance gates:
  > - [ ] gate: Fresh mounted via `app.handler()`; no `app.listen()` anywhere in the graph
  > - [ ] gate: RPC / health / Fresh-UI / static route spaces declared disjoint; no catch-all above RPC prefix
  > - [ ] gate: Fresh middleware chain reached for its route space through the composed entry point
  > - [ ] gate: static-asset ownership declared per namespace; cache headers/fallbacks/error pages verified through composed entry point

## D1-4 — In-process oRPC bridge over `ServiceApp.fetch` (no loopback, no second codec)

- **Title:** Unified runtime: in-process oRPC bridge over `ServiceApp.fetch` — context, abort, error semantics
- **Labels:** `type:feat`, `area:service`, `epic:deployment`, `priority:p1`, `wave:v1`
- **Milestone (suggested):** unified-runtime train (beta.12+) — owner fork #4
- **Body:**
  > Part of #823
  >
  > Invoke the service in-process by delegating the Web `Request` into the shipped `ServiceApp.fetch`
  > / oRPC `RPCHandler` (`packages/service/src/primitives/handlers.ts:115-143`,
  > `packages/service/src/types.ts:13-20`). Transport is **invocation placement over a stable
  > Fetch/RPC contract** — "no socket loopback" is the requirement; a second codec is not (supersedes
  > the two-codec framing; folds in #451). The host consumes `fetch` and does not reach into the Hono
  > implementation. Carry one canonical RPC prefix into both H3 matching and
  > `handler.handle(..., { prefix })`; pass request-scoped auth/telemetry context (single
  > `toServiceContext` seam) and the abort signal. RPC-domain errors serialize as typed responses and
  > do not reach Nitro's `error` hook. Treat ordinary, streamed, and WebSocket-upgrade responses as
  > distinct conformance cases (WebSocket is opt-in via CrossWS/H3, not implied). See proposal.md §4.
  >
  > Acceptance gates:
  > - [ ] gate: in-process delegation over `ServiceApp.fetch`/`RPCHandler`; no socket loopback
  > - [ ] gate: single canonical prefix carried into H3 match and `handler.handle`
  > - [ ] gate: request context (single `toServiceContext` seam) + abort signal carried into handler
  > - [ ] gate: RPC match/404 preserved; RPC-domain errors returned as typed responses
  > - [ ] gate: ordinary, streamed, and WebSocket-upgrade responses each exercised through composed entry point

## D1-5 — Version pins + H3-bridge conformance gate (Nitro compat date, oRPC generation)

- **Title:** Unified runtime: pin Nitro version/compatibility-date + oRPC generation; H3-bridge conformance gate
- **Labels:** `type:feat`, `area:deploy`, `area:service`, `epic:deployment`, `priority:p1`,
  `wave:v1`, `gate:e2e`
- **Milestone (suggested):** unified-runtime train (beta.12+) — owner fork #4
- **Body:**
  > Part of #823
  >
  > Both substrates are moving betas. Pin an **exact Nitro v3 version and a compatibility date**, and
  > make Nitro upgrade compatibility a board gate — do not describe the runtime as stable
  > (`research/nitro-v3.md` board input 1). Pin the implementation lane's **oRPC generation**: the
  > repo pins `^1.14.6` (`packages/service/deno.json:10-20`) while the live oRPC H3 docs carry a v2
  > public-beta banner (drift-ledger D-11). Add an **H3-bridge conformance test** asserting the
  > mounted adapter's `handle(request, { prefix, context })` contract against the pinned generation,
  > so a future v2 adoption is a deliberate, tested migration rather than silent drift. See
  > proposal.md §5.
  >
  > Acceptance gates:
  > - [ ] gate: exact Nitro v3 version + compatibility date pinned; upgrade compatibility is a documented gate
  > - [ ] gate: oRPC generation pinned; version recorded in the composition-host manifest
  > - [ ] gate: H3-bridge conformance test present and green against the pinned oRPC generation
  > - [ ] gate:e2e composed runtime builds green on the pinned versions

---

## Draft ID → epic map (for the Stage-H manifest, D3 owns final numbering)

| Draft | Working title | Feeds |
| --- | --- | --- |
| D1-1 | composition root / no-loopback invariant | epic #823 |
| D1-2 | Nitro host bridge / close registry | epic #823 |
| D1-3 | Fresh mount + route/static ownership | epic #823 |
| D1-4 | in-process oRPC bridge | epic #823, folds #451 |
| D1-5 | version pins + H3 conformance gate | epic #823 |

Cross-pack note for D3: D1-4 is the fold-in home for **#451** (in-process oRPC `RPCLink` over
`ServiceApp.fetch`); the supersession disposition of #451/#454 belongs to D3's supersession map
(synthesis §D3). D1 does not file or close anything.
