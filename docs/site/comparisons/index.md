---
layout: layouts/base.vto
title: How NetScript compares
nav_title: Comparisons
description: What Next.js, Nuxt, SvelteKit, Laravel, and Rails teach first, where NetScript differs, and side-by-side frontend and backend code.
templateEngine: [vento, md]
order: 1
oldUrl: /explanation/compared/
---

# How NetScript compares

This page compares NetScript's getting-started path with those of **Next.js**, **Nuxt**,
**SvelteKit**, **Laravel**, and **Rails**: what each one teaches first, where NetScript's ordering
differs, and where those frameworks give you a better first hour today.

{{ comp callout { type: "note", title: "What this page compares" } }}
Every framework here can build what NetScript builds. The question is narrower: <em>which decisions
does a framework make routine, and which does it leave to you?</em>
{{ /comp }}

## Canonical getting-started flows

| Framework | Canonical flow | What it teaches first |
| --- | --- | --- |
| Next.js | [Learn Next.js](https://nextjs.org/learn/dashboard-app), a sixteen-chapter course that builds one dashboard app | Styling, fonts, layouts, and navigation come before the database chapter. Once data arrives, server components query it and server actions mutate it. |
| Nuxt | [Getting Started](https://nuxt.com/docs/getting-started/introduction), an eighteen-section topic track | Views, assets, styling, routing, SEO, and transitions come before data fetching and state. Convention is the recurring lesson: auto-imports, directory routing, and one `nuxt.config.ts`. |
| SvelteKit | [Routing](https://svelte.dev/docs/kit/routing), [Loading data](https://svelte.dev/docs/kit/load), [Form actions](https://svelte.dev/docs/kit/form-actions), and an in-browser [tutorial](https://svelte.dev/tutorial) | File conventions first, then the boundary between universal and server-only `load` functions with generated `$types`, then server-validated form actions with `use:enhance`. |
| Laravel | [Getting Started with Laravel](https://laravel.com/learn/getting-started-with-laravel), thirteen lessons that build the Chirper microblog | A route, then a deployed URL in the fourth lesson, then MVC, the database, CRUD, registration, and login. |
| Rails | [Getting Started](https://guides.rubyonrails.org/getting_started.html), a twenty-three-section guide that builds a product store | Generators for the model, controller, and views, then the framework's breadth: authentication, caching, Action Text, Active Storage, internationalization, Action Mailer, testing, CI, and deployment with Kamal. |

All five put a rendered page in front of you within minutes, and all five teach **one process**.
Data access is a step inside that process. Background work, when it appears, is a queue you hand a
job to. Operational concerns arrive near deployment, or not at all.

That is the right shape when the product is one process, as most web applications are. NetScript
deliberately does not follow it.

## NetScript's ordering

NetScript assumes the application has already become several processes, and that the expensive
part is the seams between them. [Why NetScript](/why/) calls this the *integration tax*. Each
consequence moves work earlier than a peer flow would:

| Concern | Peer flows | NetScript |
| --- | --- | --- |
| The server/caller boundary | Discovered while building the screen that needs it. | Written first. The handler's argument type, the client, the OpenAPI document, and the island's props are projected from the contract. See [Contracts and type flow](/explanation/contracts/). |
| The scaffold unit | One application: `create-next-app`, `npm create nuxt@latest`, `bin/rails new`. | A Deno workspace with apps, services, and plugin runtimes as members, so the first command creates more directories. See [Concepts](/explanation/). |
| Work that outlives a request | An add-on: a queue library, a background-job chapter, an external workflow service. | A runtime you define in the same workspace, with checkpoints and compensation. See [the durability model](/explanation/durability-model/). |
| Telemetry | Configuration you add once there is something to debug. | Present from the first run: the orchestrator starts the database, cache, services, and plugin processors with their traces connected. See [Orchestration with Aspire](/explanation/aspire/) and [Observability](/observability/). |

### Ordering in the web layer

The same ordering reaches the page. Where SvelteKit gives a route its own `load` and Next.js gives
it a server component, NetScript's page builder resolves named
[request-scoped resources](/web-layer/resources/) once, hands the same values to every region, and
runs [layers](/web-layer/layers/) concurrently over them. Mutations are a
[server-validated form round trip](/web-layer/form/) in which the schema produces the errors.
Regions that fill in later are [partials with an explicit refresh policy](/web-layer/partials/),
driven by [a deferred-rendering decision engine](/web-layer/defer-streaming-ui/). The handoff from
server-prefetched data to an interactive island is
[an explicit cache bridge](/web-layer/query-bridge/), with its current sharp edges documented.
Each of those pages starts with the code bare Fresh makes you write.

## Peer advantages

Measured on the first hour, several of these frameworks are ahead of NetScript:

- **You can learn SvelteKit without installing anything.** Its
  [tutorial](https://svelte.dev/tutorial) is an editor with a live preview in the browser, and
  Nuxt's [installation page](https://nuxt.com/docs/4.x/getting-started/installation) offers online
  starters. NetScript has no equivalent: you install Deno, scaffold a workspace, and start a
  resource graph before anything renders.
- **Time to a rendered screen is shorter.** `create-next-app`, `npm create nuxt@latest`, and
  `bin/rails new` each run a page before you make a design decision. NetScript asks for a contract,
  a service, a workspace layout, and an orchestrator first. If your product is one process, that is
  cost without return; start with Fresh or Hono.
- **Generators write more of the application.** Rails' guide reaches a `Product` model and its
  migration with one generator command, a controller with its view with a second, and a `User`
  model with sessions, controllers, and views with a third. NetScript's scaffold produces a
  workspace and one worked contract-to-page example; you type the second resource.
- **The batteries-included guides cover more of a real application.** Rails' guide reaches rich
  text, file uploads, internationalization, transactional mail, security, and CI. NetScript's path
  covers none of those; they remain library choices you make.
- **Deployment has a day-one answer.** Laravel's course deploys in its fourth lesson, and Rails
  ships Kamal inside the guide. NetScript is not a hosted platform: it ships
  [deployment commands](/orchestration-runtime/how-to/deploy/), starter workflows, and recipes, and
  you choose and provision the hosting platform.
- **The ecosystems are older and deeper.** React and Next, Vue and Nuxt, and Laravel and Rails have
  years of components, integrations, and answered questions behind them. On a pre-1.0 Deno-native
  stack you are more likely to be the first person to hit a given edge.

The other trade-offs (a pre-1.0 package family, Aspire as the default orchestrator, and Fresh
and Preact as the web layer) are listed in [Why NetScript](/why/).

{{ comp callout { type: "important", title: "When a peer is the better choice" } }}
If you are evaluating quickly, need a rendered screen today, want generated CRUD, or your team is
invested in the React or Vue ecosystem, choose a peer framework; NetScript's ordering will read as
ceremony. The ordering pays off when the seams are the problem: several processes, work that must
survive a restart, and an operational picture that has to hold together across all of it.
{{ /comp }}

## Side-by-side code

These pages build the same feature in NetScript and in other frameworks, side by side, so you can
compare the code directly.

{{ comp.cardsGrid({ columns: 2, cards: [
  {
    eyebrow: "Frontend",
    title: "NetScript vs frontend frameworks",
    body: "One detail page, compared with Next.js, Nuxt, SvelteKit, and TanStack Start.",
    href: "/comparisons/frontend/",
  },
  {
    eyebrow: "Backend",
    title: "NetScript vs backend frameworks",
    body: "One typed endpoint and job, compared with Nest.js, Hono, and Encore.dev.",
    href: "/comparisons/backend/",
  },
] }) }}

Next: try the ordering yourself in the [quickstart](/quickstart/).
