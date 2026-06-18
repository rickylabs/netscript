# Per-Section Page Outlines

Concrete content outlines for the major pages: section order, where callouts/components go, and the
code-sample strategy. Component names (`comp.hero`, `comp.callout`, `comp.tabbedCode`, `comp.card`,
`comp.featureGrid`, `comp.apiTable`) refer to the Lume/Vento components specified in
`04-engine-and-components.md`.

## Code-sample strategy (global rules)

- **Every concept earns a runnable snippet within one screen.** TanStack's "enough talk, show me
  code" — lead concept pages with a minimal working example, then explain.
- **Snippets come from the real package quick-examples** (the READMEs already contain vetted ones:
  `defineService`, `defineSaga`, `getKv`, `createQueue`, `defineJob`, `createScheduler`, …). Do not
  invent APIs; lift from `mod.ts` and READMEs so docs never drift.
- **Tabbed code** for: install (`deno add` vs `deno install` vs `deno run -A jsr:`), and for the
  simple-vs-advanced pairing (the doctrine's "80% case is one call; advanced unfolds one method
  deeper" — show both in tabs).
- **Output blocks** after commands (what the CLI prints), so a reader can verify success.
- **Cross-link, don't duplicate:** concept pages link to Reference for full signatures; never
  reproduce the generated API tables by hand.

---

## 1. Landing / Overview (`index.md`) — REWRITE

Order:
1. `comp.hero` — sharpened one-liner (from positioning brief, pending Q1), primary CTA **Quickstart**,
   secondary CTA **Why NetScript**, and a tertiary "Browse the API reference."
2. A single hero code sample (tabbed): the smallest end-to-end story — `netscript init`, then a
   `defineService` snippet. The "feel" in 8 lines.
3. `comp.featureGrid` — 6 cards = the 6 USPs (contract-first, durable workflows, observable,
   Aspire-orchestrated, composable plugins, own-your-UI). Each card links to its capability hub.
4. **Who it's for** — 3 short audience cards (product/full-stack TS engineer; platform engineer;
   plugin author).
5. `comp.card` learning-path strip — Quickstart → First workspace → Service → Jobs → Workflow.
6. Footer band: links to Reference index, GitHub, JSR namespace.

Callouts: one `comp.callout{type:"note"}` near the hero clarifying "NetScript is a backend framework
+ workspace generator, not a hosted service."

## 2. Why NetScript (`why.md`) — NEW

The TanStack "motivation" page — the single most persuasive page on the site.
1. **The problem** — numbered list of the pain of hand-assembling a TS backend (separate queue,
   tracer, scaffold, orchestration, DI, drift between API and client).
2. **The NetScript answer** — map each pain to a NetScript value (table from positioning brief).
3. **What makes it different** — the 6 USPs as prose with one code proof each (contract→client type
   flow; a saga state machine; a traced job).
4. `comp.callout{type:"tip"}` — honest scope: when NetScript is *not* the right tool.
5. Comparison framing (pending Q4 — whether to name competitors). Default: compare to "assembling it
   yourself" rather than to named frameworks.
6. CTA → Quickstart.

## 3. Quickstart — 5 minutes (`quickstart.md`) — REWRITE (lean half of getting-started)

Strict happy path, no option dumps:
1. Prereqs callout (`comp.callout{type:"note"}`): Deno 2.x.
2. Install CLI (`comp.tabbedCode`: global install / ad-hoc `deno run`).
3. `netscript init my-app` (+ one-line note on `--dry-run`).
4. `cd my-app` → start it (Aspire/Fresh) → **what you see** (dashboard, `/design`, examples) with an
   `comp.callout` pointing at the scaffolded showcase.
5. "You now have X" recap + `comp.card` next-steps → Tutorial track / Capabilities / Reference.
Code-sample strategy: every step a copy-paste block; one output block after `init`.

## 4. Tutorial 1 — Your first workspace (`tutorials/first-workspace.md`) — REWRITE/EXPAND

The current `getting-started.md` content, expanded to *explain each scaffold phase* (root → aspire →
database → contracts → services → plugins → registry) so the reader builds a mental model. Adds a
"what the generator made and why" section keyed to the real pipeline phases. Ends → Tutorial 2.

## 5. Tutorial 2 — Build a service (`tutorials/build-a-service.md`) — NEW

Contract-first walkthrough, the spine of the framework:
1. Define a contract (`baseContract.route(...).input().output()` — from contracts README).
2. Implement the service (`defineService(router, {...})` — service README).
3. Get a typed client (`defineServices({ users: { contract } })` — sdk README).
4. Call it from a Fresh island/page (`definePage` — fresh README).
5. Trace it: note that the call is already instrumented (telemetry).
Callouts: `comp.callout{type:"tip"}` on the "contract is the single source of truth — client types
derive from it." Tabbed simple-vs-`createService().withCors().withRPC()` advanced form.

## 6. Tutorial 3 — Add background jobs (`tutorials/background-jobs.md`) — NEW

1. `netscript plugin add worker --samples`; `generate plugins`.
2. `defineJob('send-email').handler(...).topic(...).build()` (workers-core README).
3. Run it; observe the trace + structured log.
4. Where jobs live in the workspace; the registry.
Ends → Tutorial 4.

## 7. Tutorial 4 — A durable workflow (`tutorials/durable-workflow.md`) — NEW

The differentiator. Model a multi-step flow as a saga state machine:
1. `defineSaga('order').state().on(...).build()` (sagas-core README).
2. Explain phases, correlation, completion; `comp.callout{type:"important"}` on crash boundaries /
   compensation (supervisor decides restart vs escalate).
3. Emit cascaded messages (`send`, `schedule`, `sagaComplete`).
4. Link to Core concepts / Durable workflows for the "why state machines" theory.

## 8. Tutorial 5 — Ingest a webhook (`tutorials/webhook.md`) — NEW (wave 2)

`defineWebhook(...)` → enqueue a job → handled by a worker. Triggers + workers composed end to end.

## 9. Core-concept pages (Explanation) — outline shape (applies to each)

Each follows: **what it is → why it's shaped this way → a small diagram or code proof → trade-offs →
"see also" (reference + how-to + tutorial).** Specifics:
- **Architecture overview** — KEEP; gloss `composition root`/`fitness functions`; add a `comp.callout`
  "for framework authors" around the deepest doctrine bits.
- **Contracts & the type flow** — NEW; one diagram: contract → service → sdk client → query factory →
  island, with a code proof at each hop.
- **The plugin model** — KEEP; add the plugin-vs-core table as `comp.apiTable` styling.
- **Durable workflows** — NEW; sagas as state machines, correlation/persistence/compensation; A12/A13.
- **Observability & telemetry** — NEW; OTel spans across jobs/queues/RPC/SSE; supervisor-owned
  telemetry; health probes.
- **Orchestration with Aspire** — NEW; AppHost + ServiceDefaults + TS helpers + dashboard; how the
  scaffold wires resources.

## 10. Capability hubs — outline shape (applies to all 9)

A thin, scannable hub — the Astro/Medusa "domain landing":
1. One-sentence what + a `comp.callout` "use this when…".
2. The headline API in a single `comp.tabbedCode` (simple form + advanced form).
3. `comp.card` row: **Learn** (tutorial) · **Do** (how-to) · **Look up** (reference) · **Understand**
   (concept). This is the per-capability Diátaxis router.
4. Adapter/provider matrix where relevant (kv: Deno KV/Redis/memory; queue: KV/Redis/AMQP) as
   `comp.apiTable`.

## 11. How-to guides — outline shape

Goal-first (current add-a-plugin is the template and is KEPT): **Goal → prerequisites → numbered
steps with copy-paste commands → verify → next steps.** New recipes follow it exactly. Each step that
has a simple+advanced flag uses `comp.tabbedCode`. Every guide ends with reference links.

## 12. Glossary (`glossary.md`) — NEW

Short definitions a public reader needs before doctrine pages make sense: contract, oRPC, saga,
trigger, stream, contribution, manifest, registry, archetype, composition root, Aspire AppHost,
durable. Each term links to its concept/reference home. Lowers the cost of the Explanation lane.
