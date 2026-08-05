---
layout: layouts/base.vto
title: How NetScript's path compares
templateEngine: [vento, md]
prev: { label: "Orchestration with Aspire", href: "/explanation/aspire/" }
next: { label: "Capabilities", href: "/capabilities/" }
order: 8
---

# How NetScript's path compares

Most people arriving here already know a framework whose getting-started guide works a
particular way, and NetScript's does not work that way. The difference is deliberate, so it
is worth stating rather than leaving you to discover it halfway through the
[quickstart](/quickstart/).

This page does three things. It reads the canonical getting-started flows of **Next.js**,
**Nuxt**, **SvelteKit**, and the batteries-included pair **Laravel** and **Rails** on their
own terms. It then says where NetScript's path diverges from all five, and what that ordering
buys. And it closes with the part comparisons usually omit: where those frameworks give you a
better first hour than NetScript does today.

{{ comp callout { type: "note", title: "What this page is not" } }}
Nothing here is a claim that another framework cannot build what NetScript builds. All of them
can. The question a getting-started flow answers is narrower and more useful: <em>which decisions
does the framework make routine, and which does it leave to you?</em> That is what is being
compared. <a href="/why/">Why NetScript</a> holds the short version of this in one table; this is
the longer one.
{{ /comp }}

## What the canonical flows emphasize

### Next.js — the screen first, the data behind it

[Learn Next.js](https://nextjs.org/learn/dashboard-app) is a sixteen-chapter guided course that
builds a single dashboard application. It moves through project setup, CSS styling, font and
image optimization, layouts and pages, client-side navigation, setting up a database, fetching
data, static versus dynamic rendering, streaming, search and pagination, mutating data, error
handling, accessibility, authentication, metadata, and a closing next-steps chapter.

Two properties characterize that shape. The screen exists before the data does — styling, fonts,
layouts, and navigation all land before the database chapter. And once data arrives, the server
is the default place to reach it: server components query directly, and mutations are server
actions rather than hand-written API endpoints. Chapters link out into the API reference for what
they introduce — the data-fetching chapter points at route handlers, for instance — so the course
doubles as an index into the manual. Setup itself is one command, documented at
[Installation](https://nextjs.org/docs/app/getting-started/installation).

### Nuxt — conventions, then everything else

Nuxt's [Getting Started](https://nuxt.com/docs/getting-started/introduction) is a topic track
rather than a build-one-app course. Its eighteen sections run: Introduction, Installation,
Configuration, Views, Assets, Styling, Routing, SEO and Meta, Transitions, Data Fetching, State
Management, Error Handling, Server, Layers, Prerendering, Deployment, Testing, and the Upgrade
Guide.

The ordering is the argument. Presentation concerns come first — views, assets, styling, routing,
SEO, and transitions all precede data fetching and state management — and convention is the
recurring lesson underneath them: auto-imported components and composables, directory-driven
routing, one `nuxt.config.ts` for project-wide behaviour. The
[Installation](https://nuxt.com/docs/4.x/getting-started/installation) page offers online starters
alongside the local `npm create nuxt@latest` path, so a reader can begin without installing
anything.

### SvelteKit — the server boundary early, with types that follow

SvelteKit teaches through reference topics plus an interactive tutorial.
[Routing](https://svelte.dev/docs/kit/routing) establishes the file conventions —
`+page.svelte`, `+layout.svelte`, `+server.js`, `[slug]` parameters — as the first thing you
learn. [Loading data](https://svelte.dev/docs/kit/load) then draws the line SvelteKit cares most
about: universal `load` functions in `+page.js` versus server-only ones in `+page.server.js`, with
generated `$types` modules giving each route its own typed data without a codegen step you run.
[Form actions](https://svelte.dev/docs/kit/form-actions) completes the loop, making a
server-validated form round trip with `use:enhance` progressive enhancement the default way to
mutate rather than an alternative to fetch calls.

The [tutorial](https://svelte.dev/tutorial) is an in-browser editor with a live preview, split
into Basic and Advanced tracks for both Svelte and SvelteKit. You can work through the whole
thing having installed nothing.

### Laravel and Rails — a working application, generated

Laravel's [Getting Started with Laravel](https://laravel.com/learn/getting-started-with-laravel)
is thirteen lessons building the Chirper microblog: what you are building, setting up the
project, your first route, deploying the app, what MVC is, working with the database, the first
model, showing the feed, creating and storing Chirps, editing and deleting them, registration,
login and logout, and a closing what's-next. The ordering is distinctive — deployment is the
fourth lesson, before MVC and before the database, so you have a live URL before you have a data
model. The docs' own entry point is [Installation](https://laravel.com/docs/installation).

Rails' [Getting Started](https://guides.rubyonrails.org/getting_started.html) builds a product
store across twenty-three sections. Past `Product` and `ProductsController` it keeps going:
authentication through Rails' own generator, caching, rich text with Action Text, file uploads
with Active Storage, internationalization, transactional mail with Action Mailer, CSS and
JavaScript, testing, RuboCop, security, continuous integration with GitHub Actions, and
deployment with Kamal. Breadth is the lesson. The guide's implicit promise is that the framework
already has an answer for each of these, and its job is to show you where that answer lives.

### The property all five share

{{ comp.apiTable({
  caption: "What each canonical flow teaches first",
  rows: [
    { name: "Next.js", type: "A sixteen-chapter build of one dashboard app", desc: "Rendered UI precedes data; once data appears, the server is the default place to fetch and mutate it." },
    { name: "Nuxt", type: "An eighteen-section topic track", desc: "Presentation and convention first — views, assets, styling, routing, SEO — with data fetching and state arriving later in the sequence." },
    { name: "SvelteKit", type: "Reference topics plus an in-browser tutorial", desc: "Routing conventions immediately, then the server/universal load boundary and per-route generated types, then server-validated form actions." },
    { name: "Laravel", type: "Thirteen lessons building Chirper", desc: "A route, then a deployed URL, then MVC, the database, CRUD, and basic registration and login." },
    { name: "Rails", type: "A twenty-three-section product-store guide", desc: "Generators produce the model, controller, and views early; the remaining sections tour the framework's breadth, including Kamal deployment before a closing what's-next section." }
  ]
}) }}

Read down that table and one shape repeats. All five put something rendered in front of you
within the first few minutes, and all five teach **one process**. Data access is a step inside
that process. Background work, when it appears, appears as a queue you hand a job to. Operational
concerns arrive at the end, near deployment, or not at all.

That is the right shape when the product *is* that process — which, for most web applications,
it is. It is also the shape NetScript deliberately does not follow, and the rest of this page is
about why.

## Where NetScript's path diverges

NetScript starts from a different assumption: that the application has already become several
processes, and that the expensive part is no longer any one of them but the seams between them.
[Why NetScript](/why/) names that assumption as the *integration tax*. Four consequences follow,
and each one moves work **earlier** in the path than a peer framework would.

**The contract comes before the page.** In the flows above, the boundary between server and
caller is discovered while building the screen that needs it. In NetScript the boundary is the
first artifact you write, and everything downstream — the handler's argument type, the derived
client, the OpenAPI document, the island's props — is projected from it rather than written
against it. That inversion is the whole subject of
[Contracts and type flow](/explanation/contracts/), and layer 1 of
[Core concepts](/concepts/) places it in the wider model. It is why the
[quickstart](/quickstart/) has you look at a contract before it has you look at a page.

**The unit is a workspace, not an app.** `create-next-app`, `npm create nuxt@latest`, and
`bin/rails new` all scaffold one application. NetScript scaffolds a Deno workspace with services,
apps, and plugin runtimes as members of it, which is why its first command produces more
directories than a peer's does. [Core concepts](/concepts/) walks the five layers of that
workspace, and [Orchestration & runtime](/orchestration-runtime/) covers the configuration and
scaffold surface that generates it.

**Work that outlives a request is a runtime, not a longer handler.** The peer flows treat
durability as an add-on: a queue library, a background job chapter, an external workflow service.
NetScript treats a multi-step process with checkpoints and compensation as a first-class thing
you define, in the same workspace, with the same contract discipline. The model and its costs are
in [the durability model](/explanation/durability-model/); the working surface is
[Durable workflows](/durable-workflows/).

**The resource graph is observed from the first run.** In the peer flows, telemetry is
configuration you add once there is something to debug. A NetScript workspace starts its
database, cache, services, and plugin processors together under an orchestrator that already
carries their traces, so the graph is visible before the first bug.
[Orchestration with Aspire](/explanation/aspire/) explains why an orchestrator is required at
all, and [Observability](/observability/) is the working surface — including automatic framework
spans, handler events/progress/child spans, and the separate console-backed logging path.

### The web layer inherits the same ordering

The divergence is not only an architectural one; it reaches the page. Where SvelteKit gives a
route its own `load` and Next.js gives it a server component, NetScript's page builder resolves
named [request-scoped resources](/web-layer/resources/) once and hands the same values to every
region, then runs [layers](/web-layer/layers/) concurrently over them. Mutations are a
[server-validated form round trip](/web-layer/form/) with the schema doing the work rather than a
hand-mapped error bag. Regions that should fill in later are
[partials with an explicit refresh policy](/web-layer/partials/) driven by
[a deferred-rendering decision engine](/web-layer/defer-streaming-ui/) rather than a stale-window
constant copied into two files. And the handoff from server-prefetched data to an interactive
island is [an explicit cache bridge](/web-layer/query-bridge/), with its current sharp edges
documented rather than implied.

Each of those pages leads with what bare Fresh makes you write first, so the comparison there is
concrete rather than rhetorical.

### What the ordering costs

The ordering is a trade, and it is not free:

- **More concepts stand between you and the first screen.** A contract, a service, a workspace
  layout, and an orchestrator are all in the path before a page renders. If your product is one
  process, that is cost without return — start with Fresh or Hono instead, as
  [Why NetScript](/why/) says outright.
- **The package family is pre-1.0.** The surface moves, which is why examples pin exact versions.
- **Aspire is the default orchestration path.** Opting out with `--no-aspire` is supported, and
  then resource wiring and local telemetry become yours to own.
- **The web layer is Fresh and Preact.** That is a deliberate fit, not compatibility with the
  React or Vue ecosystems, and it is the single largest reason a team already invested in one of
  those should not move.

## What peers do better today

The undersell in NetScript's own documentation runs both ways, and this is the honest half.
Measured on the first hour, several of the frameworks above are ahead:

- **You can learn SvelteKit without installing anything.** Its
  [tutorial](https://svelte.dev/tutorial) is a real editor with a live preview in the browser, and
  Nuxt's [installation page](https://nuxt.com/docs/4.x/getting-started/installation) offers online
  starters in the same spirit. NetScript has no equivalent. Evaluating it means installing Deno,
  scaffolding a workspace, and starting a resource graph before anything renders — a materially
  worse first ten minutes for a reader who is still deciding.
- **Time to a rendered screen is shorter everywhere else.** `create-next-app`,
  `npm create nuxt@latest`, and `bin/rails new` each put a running page in front of you before you
  have made a single design decision. NetScript asks for a boundary first. That
  ordering is the point of this page, but the cost of it is real and lands on exactly the reader
  who wanted to see something work.
- **Generators write more of the application for you.** Rails' guide reaches a `Product` model and
  its migration with one generator command and a controller with its view with a second, then adds
  a `User` model with sessions, controllers, and views through a third. NetScript's scaffold
  produces a workspace and one worked contract-to-page example; the second resource is your
  typing.
- **The batteries-included guides cover more of a real application.** Rails' getting-started guide
  reaches rich text, file uploads, internationalization, transactional mail, security, and CI
  before it ends. NetScript's path covers none of those, and they remain library choices you make
  yourself.
- **Deployment has a day-one answer elsewhere.** Laravel's course deploys in its fourth lesson;
  Rails ships Kamal inside the guide. NetScript is not a hosted platform: it ships
  [deployment commands](/orchestration-runtime/how-to/deploy/), starter workflows, and recipes, but
  choosing and provisioning the hosting platform remains yours.
- **The ecosystems are older and deeper.** React and Next, Vue and Nuxt, Laravel, and Rails each
  have years of components, integrations, and answered questions behind them. On a pre-1.0
  Deno-native stack you are more likely to be the first person to hit a given edge.

{{ comp callout { type: "important", title: "Which of these should decide for you" } }}
If the reasons above describe your constraints — you are evaluating quickly, you need a rendered
screen today, you want generated CRUD, or your team's investment is in the React or Vue ecosystem —
then a peer framework is the better choice, and NetScript's ordering will read as ceremony. The
ordering only pays when the seams <em>are</em> the problem: several processes, work that must survive
a restart, and an operational picture that has to hold together across all of it.
{{ /comp }}

## Where to go next

- **The short version:** [Why NetScript](/why/) compares the center of gravity in one table and
  states the trade-offs plainly.
- **The model:** [Core concepts](/concepts/) walks the five layers; [Architecture](/explanation/architecture/)
  supplies the vocabulary the rest of this zone assumes.
- **The boundary this all rests on:** [Contracts and type flow](/explanation/contracts/).
- **Try it:** the [quickstart](/quickstart/) is the shortest honest path to a running workspace,
  and the [Storefront tutorial](/tutorials/storefront/) is the contract-to-page version of the
  build-one-app course every framework above ships.

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Why NetScript", body: "The integration tax, the center-of-gravity table, and the trade-offs.", href: "/why/" },
  { title: "Core concepts", body: "The five layers of a NetScript workspace.", href: "/concepts/" },
  { title: "Contracts & type flow", body: "Why the boundary is written before the page.", href: "/explanation/contracts/" },
  { title: "Durability model", body: "Why long-running work is a runtime, not a longer handler.", href: "/explanation/durability-model/" },
  { title: "Orchestration with Aspire", body: "Why a workspace needs an orchestrator at all.", href: "/explanation/aspire/" },
  { title: "Quickstart", body: "The shortest path to a running workspace.", href: "/quickstart/" }
] }) }}

{{ comp.nextPrev({ prev: { label: "Orchestration with Aspire", href: "/explanation/aspire/" }, next: { label: "Capabilities", href: "/capabilities/" } }) }}
