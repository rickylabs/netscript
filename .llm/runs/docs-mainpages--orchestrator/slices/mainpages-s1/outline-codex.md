# Main pages S1 — Codex inventory and outline

## Editorial verdict

The current four-page opening is upside down. The homepage leads with a CRUD contract and then
attempts to be the concepts page, capability index, deployment matrix, agent-tooling pitch,
audience page, and learning-path page at once. `why.vto` repeats the same contract/plugin/Aspire
exposition with seven differentiators. `quickstart.vto` keeps going after the app is running and
turns into a workspace tour. `concepts.vto` is the best-shaped page, but its three-idea model leaves
the actual web layer implicit and devotes more space to plugin mechanics and port tables than a
first mental model needs.

The revamp should make the four pages a funnel with no backtracking:

1. `/` — *want it*: durable, typed, full-stack Deno applications, proved in one screen.
2. `/why/` — *choose it*: the integration-tax argument, named alternatives, and explicit costs.
3. `/quickstart/` — *run it*: commands, success check, one edit, stop.
4. `/concepts/` — *understand it*: contract → service → plugins → web layer → observability,
   described once and linked outward.

`docs/site/capabilities/index.md` currently redirects to `/`; therefore it is not a destination and
must not be used as a catch-all link. Link directly to the real pillar pages.

## 1. Inventory

### Homepage — `docs/site/index.vto`

#### What lives there now

- Hero: “One contract. A whole production backend.” The subhead piles up enterprise-grade,
  contract-first, end-to-end typed, cloud-agnostic, services, workflows, orchestration,
  observability, deploy, and coding agents.
- Pre-1.0 notice.
- A four-tab CRUD-first sequence: `createCrudContract`, `defineService`, CLI installation/scaffold,
  and Aspire/database bring-up.
- “One contract, four moves”: a prose architecture model plus the architecture diagram and a
  telemetry paragraph.
- “Batteries no frontend framework ships”: plugin-system exposition, plugin install output, and a
  six-card catalog of workers/sagas/triggers/streams/auth/AI.
- “Ship anywhere”: a deployment manifesto, detailed target/operation matrix, and desktop teaser.
- “Built for devs working with agents”: agent philosophy, `netscript agent init`, and MCP/skills/CLI
  cards with implementation counts.
- “Build real systems, not just CRUD”: nine-card capability directory.
- “Who it is for”: four audience cards.
- Learning path plus reference/GitHub/JSR cards.

#### Duplication

- “One contract, four moves,” the architecture diagram, contract derivation, plugin contributions,
  Aspire resource materialization, and tracing all duplicate `/concepts/`.
- The contract/service code duplicates `/why/` differentiator 1 and `/concepts/` idea 1.
- The plugin catalog duplicates `/durable-workflows/`, `/background-processing/`,
  `/identity-access/`, and `/ai/`.
- The capability grid duplicates the site navigation and the pillar landing pages.
- Aspire start/database sequencing duplicates `/quickstart/`, `/quickstart/aspire/`, and
  `/explanation/aspire/`.
- The audience section belongs in the argument on `/why/`, not below a product encyclopedia.

#### What promotes CRUD contracts

- The hero makes “One contract” the product category before durability or the web layer appears.
- The first and largest code object is explicitly “One entity schema fans out into a whole CRUD
  contract,” using `createCrudContract` and a `users` resource.
- The next tabs and “One contract, four moves” make that CRUD schema appear to be the architectural
  center of NetScript.
- “Build real systems, not just CRUD” arrives only after the page has already spent its prime
  attention on CRUD; the disclaimer confirms the wrong impression instead of correcting it.

#### Worth keeping verbatim

- Keep the terse capability phrase **“Durable multi-step workflows with compensation”**; it says
  what sagas do without pretending retries are durability.
- Keep **“Observability is not an add-on”** as a possible proof-point kicker.
- Keep the Pre-1.0 fact, but compress it to one quiet line near the final CTA, not a block between
  the hero and proof.
- Keep none of the current hero or CRUD tabs verbatim.

### Why NetScript — `docs/site/why.vto`

#### What lives there now

- Hero arguing against “a dozen libraries that have never met,” with contract, crash survival, and
  tracing in the subhead.
- Pre-1.0 notice.
- “The problem”: seven-item integration-tax list (queue/tracer, stale scaffold, Compose, DI,
  API/client drift, fake durability, bolted-on auth).
- “The NetScript answer”: eight-row pain-to-feature table.
- “What makes it different”: seven separate differentiators with three code groups—contracts,
  sagas, telemetry/service—plus Aspire, plugins, UI ownership, and auth.
- Competitor table: hand assembly, NestJS, Encore, tRPC-style stacks, Temporal, Hono.
- “When NetScript is NOT the right tool”: pre-1.0, .NET/Aspire, and frontend/PaaS caveats.
- Final CTA.

#### Duplication

- The pain list and the answer table mirror each other almost row for row.
- The seven differentiators repeat the answer table again at much greater length.
- Contract code repeats homepage and concepts code; saga/plugin exposition repeats the durable
  workflows pillar; tracing/Aspire repeats homepage, concepts, and quickstart; auth repeats its
  capability hub.
- The existing comparison does not make the locked contrasts. It compares NestJS, Temporal, Hono,
  and tRPC, but fails to directly answer “why not bare Fresh?”, “why not Next?”, and what an
  Encore-style integrated stack gives up or gains.
- Target consumer is inferred, never stated: the page does not plainly say that a static site,
  short-lived prototype, or one-process CRUD app is below NetScript’s useful complexity threshold.

#### What promotes CRUD contracts

- Contract-first is differentiator 1 and receives the first code tabs; “the contract is the
  client” remains the implicit wedge.
- Users/list/pagination is another CRUD-shaped example before the more distinctive saga appears.

#### Worth keeping verbatim

- Hero line: **“You shouldn't have to assemble a backend from a dozen libraries that have never
  met.”** Keep it, but demote it from hero to the opening sentence of the integration-tax section.
- **“Durability model faked with retries. ‘It'll just retry’ is not a state machine.”** Keep exactly;
  it is specific, memorable, and technically honest.
- **“The cost is the integration tax — the standing maintenance of seven unrelated tools
  pretending to be one system.”** Keep, changing “seven” to “unrelated tools” so the sentence does
  not depend on the length of a list.
- **“We didn't invent new primitives.”** Keep as the start of the answer; it undercuts category
  hype.
- Keep the substance of the “not the right tool” callout, but rewrite the frontend claim because
  “backend-scoped” contradicts the new typed full-stack/web-layer positioning.

### Quickstart — `docs/site/quickstart.vto` and `docs/site/quickstart/aspire.md`

#### What lives there now

- Intro promises a five-minute, three-command path, then immediately explains Postgres, cache
  backend choices, traces, example routes, Deno/Aspire prerequisites, and version maturity.
- CLI install, including global and ad-hoc variants.
- Scaffold, including human and agent/CI paths, database engine matrix, agent initialization,
  `--dry-run`, simulated CLI output, and database ordering.
- Aspire restore/start, process-handling note, and `--no-aspire` aside.
- Generated `defineService` code and full fluent-builder alternative.
- “What you see”: dashboard, Fresh app, `/design`, `/examples/*`, troubleshooting, and another
  `/design` callout.
- Workspace layout, agent navigation anchors, and issue #1090.
- “You now have” four-card recap and four next-step cards.
- `/quickstart/aspire/` independently repeats prerequisites, scaffold/start commands, database
  sequencing, `--no-aspire`, dashboard output, and deeper links.

#### Duplication

- The main quickstart duplicates its own three-step learning path, generated CLI next-step output,
  prose instructions, and code blocks.
- Aspire setup and caveats substantially duplicate `/quickstart/aspire/` and
  `/explanation/aspire/`.
- Generated service/builder exposition duplicates concepts, services SDK, and the Storefront
  tutorial.
- Workspace directory roles duplicate core concepts and agent-tooling docs.
- “You now have” repeats “What you see.”
- Agent/CI setup is a parallel path, not part of the fastest human path.

#### What promotes CRUD contracts

- The first visible example route is `/examples/crud`.
- The workspace layout explicitly describes `contracts/` as containing “CRUD contracts.”
- The page’s first suggested framework code is a `users/list` service and curl call. None of this
  proves the promised durable/full-stack result.

#### Worth keeping verbatim

- **“Aspire comes before any database command.”** Keep as the title of one compact sequencing note.
- **“This is the step that actually starts your stack.”** Keep immediately above `aspire start`.
- Keep the `--no-aspire` trade-off in one sentence: dashboard and resource wiring are what users
  relinquish.
- Keep the four troubleshooting facts, but move them to `/quickstart/aspire/`; they interrupt the
  happy path.
- Keep the Storefront next step, because it is the correct handoff from running scaffold to real
  feature work.

### Core concepts — `docs/site/concepts.vto`

#### What lives there now

- Hero: “Three ideas explain almost everything”—contract, empty host/plugins, one runtime/many
  resources.
- Architecture diagram.
- Idea 1: contract derivation, contract/client tabs, OpenAPI/Scalar/tracing claims.
- Idea 2: plugin manifest/contribution/registry model, manifest code, process isolation diagram.
- Idea 3: Deno/JSR plus Aspire resource model, resource graph, database/cache matrix, port table,
  `--no-aspire`.
- “How the three ideas connect,” three onward cards, and another Pre-1.0 block.

#### Duplication

- Contract code and “source of truth” story duplicate homepage and Why.
- Plugin catalog/mechanics duplicate homepage and plugin-system explanation.
- Aspire start, database variants, ports, and opt-out duplicate quickstart and Aspire pages.
- Pre-1.0 notice repeats every other main page.

#### What promotes CRUD contracts

- It does not use `createCrudContract`, which is good, but its only concrete contract is still a
  paginated `users.list`. That makes “contract” read as typed CRUD rather than a cross-layer
  boundary for service-shaped behavior.
- Contract gets a full code sample while the web layer is absent from the three-idea model.

#### Worth keeping verbatim

- **“The contract is the source of truth.”** Keep as the first concept heading; it is a mental-model
  statement, not a homepage proposition.
- **“The host is empty; plugins fill it.”** Keep as a sentence inside the plugins section.
- **“‘One plugin’ is a packaging unit, not a runtime unit.”** Keep; it resolves a real conceptual
  ambiguity.
- **“One runtime, many resources.”** Keep as the observability/orchestration bridge, not as one of
  only three top-level ideas.
- Keep the architecture diagram once, here and nowhere else.

### Positioning pages skimmed

- `/durable-workflows/` already owns the complete saga/trigger/stream explanation and the checkout
  failure story. Main pages should link to it, not reproduce its chain or runtime ports.
- `/services-sdk/` already owns contract → service → client/OpenAPI/query derivation. Core concepts
  needs one paragraph and links; Why needs the cross-layer consequence, not another users contract.
- `/web-layer/` already owns `definePage`, server-first Fresh rendering, routes/resources/layers,
  TanStack Query hydration, forms, partials, streams, and Fresh UI. Main pages should name this as a
  first-class layer and send detail there.

## 2. Proposed page outlines

### Homepage — one screen, then leave

#### Section 1 — Hero

**Actual hero claim:**

> Build the Deno app that keeps working after the request ends.

**Subhead:**

> NetScript is a typed full-stack framework for long-lived applications: Fresh pages and oRPC
> services, durable workers and sagas, replayable streams and triggers, all running under Aspire
> with logs and traces already connected.

CTAs: **Start a workspace** → `/quickstart/`; **Why NetScript** → `/why/`. A small “Pre-1.0 — pin
your version” note can sit beside/below the CTAs without interrupting the pitch.

This wording leads with the differentiating lifecycle boundary. “After the request ends” makes
durability understandable without naming Temporal, and “Deno app” keeps the product category
clear. Do not use “enterprise-grade,” “batteries included,” “cloud-agnostic,” “meta-framework,” or
“one unified API” in the hero; those are claims in search of proof.

#### Section 2 — Three proof points

Exactly three cards, one sentence each:

1. **Typed from page to process**  
   “One contract types the Fresh page, oRPC service, SDK call, and event payload—break the boundary
   and `deno check` points to the caller.”  
   Links: `/web-layer/`, `/services-sdk/`, `/explanation/contracts/`.
2. **Work survives the worker**  
   “Workers retry durably; sagas persist multi-step state and compensation; triggers accept inbound
   work; streams replay completed change.”  
   Links: `/durable-workflows/`, `/background-processing/`.
3. **The whole system is visible**  
   “Aspire starts services, processors, Postgres, and cache as one resource graph, with health,
   logs, and distributed traces in one dashboard.”  
   Links: `/orchestration-runtime/`, `/observability/`, `/quickstart/aspire/`.

These are proofs of the hero, not a feature taxonomy. Auth, AI, deploy targets, agent tooling,
databases, and UI component ownership are valid secondary capabilities but do not earn homepage
space above the first onward CTA.

#### Section 3 — One code moment

Show the checkout saga from section 3 below: one TypeScript panel, no tabs. Caption:

> The process can die after payment and restart before inventory. The saga state and next effect
> are recorded; `sagaComplete` is an explicit outcome, not a successful fall-through.

Adjacent link: **See the durability model** → `/durable-workflows/`; secondary **Build this
checkout** → `/tutorials/storefront/04-checkout-saga/`.

#### Section 4 — Exit strip

Three text links only:

- **Run it in five minutes** → `/quickstart/`
- **See the mental model** → `/concepts/`
- **Decide whether it fits** → `/why/`

No capability grid, audience grid, deploy matrix, agent pitch, second code block, architecture
diagram, or learning-path widget.

### Why NetScript — the decision memo

#### Section 1 — Hero and target consumer

**Actual hero claim:**

> For teams whose TypeScript app has become a system.

**Subhead:**

> NetScript fits long-lived, service-shaped products: several processes, work that outlives HTTP,
> a browser UI that must stay typed to the backend, and operators who need to see what failed. It
> trades pick-any-library freedom for one Deno-native application model.

Links: `/quickstart/` and `/concepts/`.

Immediately name the non-consumer: if the app is a static site, a short-lived prototype, or a
single request/response service, Fresh or Hono alone is likely the better tool.

#### Section 2 — The integration tax, cut to three failure seams

Open with the retained sentence about “a dozen libraries that have never met,” then use only:

1. Request/client drift across service and browser.
2. Retry loops that lose state between multi-step effects.
3. Queue, resource wiring, and tracing assembled independently, so an incident crosses tools before
   it reaches an explanation.

Close with the retained integration-tax sentence. Link each seam to `/services-sdk/`,
`/durable-workflows/`, and `/observability/` respectively. Delete the redundant answer table.

#### Section 3 — One connected argument, not seven differentiators

Heading: **Types describe the boundary; durability describes what happens next.**

- A shared contract makes request, response, service client, and page usage one compile-time
  boundary.
- That guarantee does not survive time by itself. Workers, triggers, streams, and sagas supply the
  durable execution/state model after the request returns or a process fails.
- Aspire materializes those pieces as a resource graph and joins their telemetry, so the typed
  design remains operable rather than merely elegant.

Links: `/explanation/contracts/`, `/durable-workflows/`, `/explanation/durability-model/`,
`/explanation/aspire/`, `/observability/`. No code; the homepage provides the one teaser and deep
pages own examples.

#### Section 4 — Honest contrasts

Use a compact four-row comparison with “choose this when” language, not a winner table:

- **Bare Fresh + Hono:** choose it for a web app with a small backend and no durable process model.
  NetScript uses Fresh/Hono underneath, then adds shared contracts, service SDK, background
  runtimes, resource orchestration, and telemetry. Cost: more framework and workspace shape.
- **Next.js:** choose it when the center of gravity is React, its ecosystem, or a hosted frontend
  platform. Choose NetScript when Deno, service boundaries, durable background work, and an
  operator-visible multi-resource app are central. Cost: NetScript’s frontend ecosystem is much
  smaller and Fresh/Preact-specific.
- **Encore-style integrated stack:** choose it when its infra-from-code model and hosted/cloud
  workflow match the team. NetScript’s distinction is an app-owned Deno/JSR workspace, explicit
  plugin/runtime seams, Aspire orchestration, and no required hosted control plane. Cost: NetScript
  gives less managed infrastructure and asks the team to operate deployment choices.
- **Assemble the stack yourself:** choose it when unusual infrastructure or maximum component
  choice is the product requirement. NetScript removes integration seams by constraining the
  shape. Cost: swapping a foundational choice may mean working outside the paved path.

Links: `/web-layer/`, `/orchestration-runtime/`, `/deployment/` if that route exists at authoring
time; otherwise link the current deployment reference from site navigation. Do not repeat NestJS,
tRPC, Temporal, or auth comparisons unless a dedicated comparison page is commissioned.

#### Section 5 — Trade-offs / not for you

Keep this visible, not a footnote:

- Pre-1.0; exact pins are required and APIs move.
- Aspire is the default orchestration path and brings an external .NET CLI/Docker dependency;
  `--no-aspire` is real but hands infrastructure wiring back to the team.
- The web layer is Fresh/Preact, not React/Next; ecosystem breadth differs materially.
- NetScript is broad and opinionated. A one-process app pays complexity before durability,
  plugins, and observability pay it back.
- It is a framework and workspace generator, not a hosted PaaS.

Links: `/quickstart/aspire/`, `/web-layer/`, `/reference/`.

#### Section 6 — CTA

> If those are your problems, make the resource graph real.

**Start a workspace** → `/quickstart/`; **Read the mental model** → `/concepts/`.

### Quickstart — shortest honest successful loop

#### Section 1 — Promise and prerequisites

Heading: **Run a NetScript workspace, then change it.**

One sentence: Deno 2.x, Aspire CLI, and Docker are required for the default path. Link alternatives
to `/quickstart/aspire/#prefer-no-orchestration` rather than explaining them inline. One small
pre-1.0 pin note.

#### Section 2 — Install

One command only:

```bash
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

Put ad-hoc `deno x`, CI flags, agent initialization, and `--dry-run` in CLI reference/how-to links.

#### Section 3 — Scaffold

One happy-path command:

```bash
netscript init my-app --db postgres
```

One sentence: accept the interactive defaults. Do not print simulated CLI output or enumerate
database engines here. Link **CLI init options** → the existing CLI reference.

#### Section 4 — Start

Retain “This is the step that actually starts your stack.” Then:

```bash
cd my-app/aspire
aspire restore   # once
aspire start
```

Success criterion: use the dashboard URL printed by `aspire start`, not a hard-coded `:18888`.
Confirm that the Fresh app and service resources are healthy and open the Fresh app from its
resource URL. One compact note titled **Aspire comes before any database command** links to the
database migration recipe.

Links: `/quickstart/aspire/`, `/data-persistence/how-to/database-migration/`.

#### Section 5 — First change

The current page promises a “first change” but never delivers one. Make it concrete and scaffold-
resilient: follow the Fresh app URL from Aspire, open the scaffolded dashboard’s visible welcome
route/file named in the current scaffold output, change one heading string, save, and refresh. The
authoring slice must verify the exact generated file against the current scaffold fixture before
publishing; do not guess a route path in prose.

Success criterion: the changed heading is visible and Aspire still shows the app healthy. This is
more honest than curling an invented `users/list` procedure and proves that generated source is
owned and editable.

Link: `/web-layer/`.

#### Section 6 — Stop and continue

```bash
aspire stop
```

Then only two links: **Build the Storefront** → `/tutorials/storefront/`; **Understand the
workspace** → `/concepts/`.

Move troubleshooting, no-Aspire details, process handling, database sequencing detail, and
dashboard anatomy to `/quickstart/aspire/`. That subsidiary page is relevant, but it must stop
calling itself the shortest path once the main quickstart owns that role.

### Core concepts — the model once

#### Section 1 — Hero and diagram

**Actual hero claim:**

> One contract crosses five layers.

**Subhead:**

> A NetScript app moves from contracts to services to plugin runtimes to Fresh pages, while Aspire
> runs the resource graph and carries telemetry across every boundary.

Show `architecture-overview.svg` here—the only main page that should. Intro: this page explains
vocabulary and flow, not APIs.

#### Section 2 — Contracts: define the boundary

- Contracts hold schemas and oRPC procedure shape.
- Server and clients import the same object; they are not parallel generated definitions.
- Contracts can describe behavior, not merely entity CRUD. Use an order/checkout operation in any
  tiny illustrative naming, not `users.list` pagination.

Links: `/explanation/contracts/`, `/services-sdk/services/`, `/reference/contracts/`.

#### Section 3 — Services: execute request-time behavior

- A service implements the contract and exposes oRPC, OpenAPI/Scalar, health, and telemetry through
  the service runtime.
- Service discovery resolves neighbours from orchestrator-injected configuration.
- Boundary: a service handles request-time work; it is not the place to fake a multi-step durable
  process with retries.

Links: `/services-sdk/`, `/services-sdk/services/`, `/services-sdk/sdk/`.

#### Section 4 — Plugins: add runtime capabilities

- Retain: “The host is empty; plugins fill it.”
- A manifest declares contributions; the generated registry makes them explicit; Aspire
  materializes service and background contributions separately.
- Workers, sagas, triggers, and streams are the important examples. Auth and AI are links, not
  additional exposition.
- Retain: “‘One plugin’ is a packaging unit, not a runtime unit.”

Links: `/durable-workflows/`, `/background-processing/`, `/explanation/plugin-system/`,
`/orchestration-runtime/how-to/add-a-plugin/`.

#### Section 5 — Web layer: carry the boundary to the user

- `@netscript/fresh` is server-first Fresh/Preact.
- A page binds typed routes, resources/layers, forms, and partial refresh; the SDK carries service
  contract types into loaders and islands.
- The server-rendered page and hydrated island share the query model; only islands ship browser
  JavaScript.

Links: `/web-layer/`, `/web-layer/server/`, `/web-layer/builders/`, `/web-layer/query/`.

#### Section 6 — Observability: connect the resource graph

- Retain “One runtime, many resources,” but explain Aspire and telemetry together.
- Aspire starts databases, cache, services, plugin APIs, and background processors in dependency
  order.
- Trace context crosses RPC, queues, schedulers, workers, streams, and pages; dashboard health,
  logs, and traces are views of the same graph.
- Mention `--no-aspire` once as a boundary: package/runtime APIs remain, orchestration and automatic
  local wiring become the user’s responsibility.

Links: `/observability/`, `/orchestration-runtime/`, `/explanation/aspire/`,
`/quickstart/aspire/`.

#### Section 7 — Follow one operation across all five

Use prose, not another code sample:

> A typed checkout command enters a service; the service starts a saga; a worker performs payment;
> the saga records the next state and publishes a stream update; a Fresh island refreshes from that
> typed update; Aspire shows the RPC, queue, worker, and stream spans in one trace.

This is the only recap. It proves why the concepts are ordered and replaces the current abstract
“three ideas connect” paragraph.

Links: `/tutorials/storefront/04-checkout-saga/`, `/tutorials/live-dashboard/`.

## 3. Homepage code moment

Use one code block, with no contract tab, client tab, generated scaffold output, or curl companion:

```ts
import { defineSaga, sagaComplete, send } from '@netscript/plugin-sagas-core';

type Checkout = { status: 'pending' | 'paid' | 'complete' };
type PaymentCaptured = { orderId: string };

export const checkout = defineSaga('checkout')
  .state<Checkout>({ status: 'pending' })
  .on<'PaymentCaptured', PaymentCaptured>('PaymentCaptured', (saga, event) => {
    saga.state.status = 'paid';
    return [send('ReserveInventory', { orderId: event.payload.orderId })];
  })
  .on('InventoryReserved', (saga) => {
    saga.state.status = 'complete';
    return [sagaComplete()];
  })
  .build();
```

Verification:

- Public entrypoint: `packages/plugin-sagas-core/mod.ts` (`export * from
  './src/public/mod.ts'`).
- Builder implementation: `packages/plugin-sagas-core/src/builders/define-saga.ts` verifies
  `defineSaga(id)` and the `.state().on().build()` chain.
- Effect exports: `packages/plugin-sagas-core/src/public/mod.ts` and
  `packages/plugin-sagas-core/src/public/messages.ts` verify `send` and `sagaComplete`.
- Runnable canonical usage: `packages/plugin-sagas-core/README.md` uses the same generic event form
  and effect array.
- `deno doc --filter defineSaga packages/plugin-sagas-core/mod.ts` and
  `deno doc --filter sagaComplete packages/plugin-sagas-core/mod.ts` both resolve on this
  worktree.

Why this code, specifically: it demonstrates persisted workflow vocabulary, typed event payload,
state transition, a named next effect, and explicit completion in 16 meaningful lines. A CRUD
contract proves only that TypeScript can type a request. This proves what NetScript adds when the
request is over.

Do not claim from the snippet alone that the state is persisted. The adjacent prose/link should
say the saga runtime records state/effects through its durable store and send readers to
`/durable-workflows/` for store/runtime specifics.

## 4. Kill list

### Delete from the homepage

- Delete the current hero (“One contract. A whole production backend.”) and its overloaded
  enterprise/cloud/agent subhead.
- Delete all four CRUD/service/scaffold/bring-up tabs. Move no code verbatim; CLI sequencing belongs
  in Quickstart, contracts in Core concepts/services, CRUD in a basic-app recipe if retained at all.
- Delete “One contract, four moves” and the architecture diagram from `/`; move the mental model
  solely to `/concepts/`.
- Delete the telemetry paragraph from that section; replace it with the one observability proof
  card linking to `/observability/`.
- Delete the plugin-system essay, install output, and six-plugin grid. Durable plugins collapse
  into one proof point linking to `/durable-workflows/` and `/background-processing/`; auth and AI
  remain discoverable in navigation/deep pages.
- Delete the entire “Ship anywhere” section and desktop teaser. Move product deployment positioning
  to `/orchestration-runtime/` or a dedicated deployment hub; keep exact target operations in CLI
  reference.
- Delete the entire agent-tooling section from the homepage. Move the philosophy and implementation
  counts to `/ai/agent-tooling/`; counts such as 13 tools/17 prefixes/6 denies are volatile and do
  not belong in a product hero.
- Delete the nine-card capability grid. The homepage is not `/capabilities/`, and that route is
  currently only a redirect back to the homepage.
- Delete “Who it is for” from `/`; rewrite its useful audience distinction into the opening of
  `/why/`.
- Delete both bottom navigation grids and replace them with the three-link exit strip.
- Delete “Build real systems, not just CRUD.” It is defensive copy caused by leading with CRUD.

### Delete or move from Why

- Collapse the seven-pain list to three cross-layer failure seams; move auth-specific pain to
  `/identity-access/`, DI/builder detail to services docs, and scaffold detail to CLI docs.
- Delete the eight-row “NetScript answer” table; it repeats the pain list and differentiators.
- Delete all contract, saga, telemetry, service, and auth code blocks. Homepage gets one code
  moment; capability/reference pages own the rest.
- Replace seven numbered differentiators with the single connected types → durability → operations
  argument.
- Delete implementation detail such as plugin ports, exact auth endpoints, backend environment
  switches, and HTTP/2 configuration. Move/link to their capability/reference pages.
- Delete the current competitor rows for NestJS, tRPC, Temporal, and Hono-as-a-competitor. Hono is
  a foundation; Temporal is a durability reference point; neither answers the locked buyer
  question as well as Fresh/Next/Encore-style/DIY.
- Rewrite “NetScript is backend-scoped”; it conflicts with the typed full-stack and Fresh web-layer
  product being sold. Say instead that NetScript is not a general React frontend ecosystem or a
  hosted platform.
- Delete the `/capabilities/` CTA until that route becomes a real page; link directly to pillars.

### Delete or move from Quickstart

- Delete the learning-path widget; the headings already provide the steps.
- Move ad-hoc CLI usage, CI/agent flags, `netscript agent init`, `--with-docs`, and `--dry-run` to
  CLI/agent how-to pages.
- Move the database engine/cache-backend matrix to data persistence and Aspire setup docs.
- Delete simulated scaffold output and file counts; it is verbose, brittle, and repeats the next
  code block.
- Delete generated `defineService` and curl tabs plus the fluent-builder callout. Move to
  `/services-sdk/` or the Storefront service chapter.
- Move portable process handling, `--no-aspire`, fixed-port troubleshooting, restore latency, and
  database-connectivity diagnosis to `/quickstart/aspire/`.
- Delete the hard-coded dashboard and app URLs from the happy path; Aspire’s printed/resource URLs
  are authoritative.
- Delete `/design` promotion and `/examples/crud` from the main quickstart. Link Fresh UI from the
  web-layer hub and keep example-route inventory in scaffold reference.
- Move all agent navigation anchors and workspace directory-role lists to `/ai/agent-tooling/` and
  `/concepts/`; remove the implementation-tracking issue number from user docs.
- Delete “You now have”; it duplicates “What you see.” The dashboard success check is enough.
- Reduce four next-step cards to Storefront and Core concepts.
- Reframe `/quickstart/aspire/` as the Aspire troubleshooting/alternative companion page and
  remove its claim to be the shortest overall path.

### Delete or move from Core concepts

- Delete the “three ideas” framing. The locked model has five stages; forcing it into three is what
  made the web layer disappear.
- Delete the users/pagination contract/client code tabs. Link to `/services-sdk/` and use one
  non-CRUD boundary name in prose.
- Compress plugin manifest code and contribution-axis mechanics; move the complete manifest DSL to
  `/explanation/plugin-system/` or plugin reference.
- Keep only the architecture overview diagram. Move `plugin-thread-isolation.svg` to the plugin
  explanation and `aspire-resource-graph.svg` to the Aspire explanation.
- Delete cache/database option enumeration, start commands, fixed port table, and database command
  sequencing. Quickstart/Aspire/data-persistence pages own operational details.
- Delete the duplicated Pre-1.0 block; one site-level/banner treatment is preferable. If page-level
  disclosure is mandatory, use one consistent one-line partial across all four pages.
- Replace the final three-card map with two purposeful links (tutorial and architecture essay) or
  let each concept’s deep links do the navigation.

## Non-negotiable authoring checks for S2/S3

- Verify every code block with `deno doc` and the package entrypoint; existing docs are not proof.
- Verify the exact generated file used for Quickstart’s first edit against the current scaffold
  fixture/output before naming it.
- Check every local destination exists. In particular, `/capabilities/` is currently a redirect and
  should not be presented as an information hub.
- Do not add a feature merely because it is real. If it does not advance the assigned page role,
  link it from a deep page or leave it to navigation.
- One proposition per page; one homepage code block; one architecture diagram across the four
  pages; no CRUD example above the fold anywhere.
