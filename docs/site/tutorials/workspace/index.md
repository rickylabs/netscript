---
layout: layouts/base.vto
title: Team Workspace
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" }
order: 3
---

# Team Workspace

Picture the app this track is modeled on: a production context-accumulator chat application
built on NetScript. An operations team lives in it during an ERP cutover —
projects and channels full of live incident context, diagnostics, and half-finished conclusions
about a production system that is misbehaving *right now*. Underneath all of that sits an unglamorous
layer that decides everything: **who is on the team, where their data lives, and which routes they
may touch**. Get it wrong in one direction and an off-boarded contractor can still read incident
channels; get it wrong in the other and the engineer you just paged is locked out while production
burns.

The differentiator this track proves is that **the identity layer is NetScript's to ship, not
yours to rebuild**: a pluggable auth backend, a normalized session, and a typed `.withAuthn()` /
`.withAuthz()` route seam — in place of the bespoke sign-in flow and hand-rolled route middleware
most stacks reimplement, and re-secure, once per app.

That layer is what you build here, from an empty folder to a running, session-protected app under
Aspire: you scaffold a workspace (Postgres by default, swappable to `mysql`, `mssql`, or `sqlite`
via `--db`), sign users in through a pluggable auth backend, give team records their own isolated
database, provision new members with a background job that never blocks the caller, and gate your
service routes with the real `.withAuthz()` seam. It is one continuous app — your `my-workspace/`
grows with every chapter.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

By the end of this track you will have a NetScript workspace that signs a real user in through an
OAuth/OIDC provider, mints a session cookie, stores team records in their own isolated Postgres (the
default; or `mysql` / `mssql` / `sqlite` via `--db`), provisions a new member off the request path
with a background job, and rejects unauthenticated requests to its guarded routes with a `401` —
all running locally under one Aspire dashboard. The central idea: **authentication in NetScript is
a pluggable backend, a session, and a route-authz seam — not a bespoke rewrite you carry yourself.**

{{ comp callout { type: "note", title: "What NetScript ships — and what stays your code" } }}
NetScript ships <strong>pluggable auth backends</strong> (an <code>auth-api</code> service with a
single active backend chosen by an env var), a normalized <strong>session</strong>, and a
provider-agnostic <strong>route-authz seam</strong> (<code>.withAuthn()</code> /
<code>.withAuthz()</code>). It does <strong>not</strong> ship first-class organizations, tenants, or
RBAC roles. The "team workspace" app framing is real, but the data model is single-tenant: when this
track touches multi-tenant org scoping, it does so as a clearly-marked <em>app-level extension</em>
(you add your own <code>orgId</code> column and filter in your own queries), never as a
framework-managed primitive. Read those asides as "here is how you would extend it," not "NetScript
does this for you."
{{ /comp }}

{{ comp callout { type: "note", title: "Where this track's patterns come from" } }}
The data shape is borrowed from a real app: a production chat application built on NetScript splits an <strong>org-catalog</strong>
datasource (who exists, which projects and channels there are) from the data each channel
accumulates — the dual-database pattern you build in chapter 3, and the same
<code>workers</code>-plugin background jobs you use in chapter 4. The <strong>auth chapters are the
exception</strong>: they are grounded in the framework's own packages and its
<code>builder-auth</code> test suite (the 401/403/200 pattern in chapter 5), because that is where
the authentication seam is actually defined and proven.
{{ /comp }}

## The arc: auth → session → authz

Three ideas carry the whole track, and each chapter adds exactly one:

- **Auth** — a *backend* turns a sign-in into an identity. You pick one of three backends
  (`kv-oauth`, `workos`, `better-auth`) with an environment variable; the contract is identical
  across all three.
- **Session** — a successful sign-in mints a normalized `AuthSession` and sets a session cookie. Every
  later request resolves the current session from that cookie.
- **Authz** — a service gates its own routes with `.withAuthn()` (resolve a `Principal`) and
  `.withAuthz()` (decide from it). This is route-level authorization, scoped to route-level — not org/role
  RBAC.

## Who this is for

You should be comfortable with the basics from the [core tutorial ladder](/tutorials/) — scaffolding
a workspace, the contract → service flow, and bringing up Aspire. This track does not re-teach those;
it assumes you can scaffold and boot, then layers authentication on top. If `netscript init` and
`aspire start` are new to you, walk the [Quickstart](/quickstart/) first.

## The six chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "Create <code>my-workspace/</code> with an example service and Postgres, then boot it under Aspire. The base your authenticated app grows from.",
    href: "/tutorials/workspace/01-scaffold/"
  },
  {
    title: "2 · Auth",
    body: "Add the <code>auth</code> plugin, choose the interactive <code>kv-oauth</code> backend, run the <code>auth.prisma</code> migration, and verify a live session on the <code>auth-api</code> service at :8094.",
    href: "/tutorials/workspace/02-auth/"
  },
  {
    title: "3 · Workspace data",
    body: "Give the workspace its own isolated database with <code>netscript db add</code> and a per-datasource schema. The app-level <code>orgId</code> column appears here as an Extend aside.",
    href: "/tutorials/workspace/03-workspace-data/"
  },
  {
    title: "4 · Provision job",
    body: "Move member provisioning off the request path: author a <code>defineJobHandler</code> job that creates a workspace membership, and trigger it over the Workers API at :8091.",
    href: "/tutorials/workspace/04-provision-job/"
  },
  {
    title: "5 · Route authz",
    body: "Protect your service routes with the real, tested <code>.withAuthn()</code> / <code>.withAuthz()</code> seam — an authenticated request succeeds, an unauthenticated one gets a 401.",
    href: "/tutorials/workspace/05-route-authz/"
  },
  {
    title: "6 · Deploy",
    body: "Run the whole workspace locally under Aspire — including the :8094 auth service — and read it from one dashboard. Shows the local-vs-production topology clearly.",
    href: "/tutorials/workspace/06-deploy/"
  }
] }) }}

## What you built

A clear map of the track: the team layer that a real operations tool stands on — a pluggable auth
backend, a session, isolated team data, off-path provisioning, and a route-authz seam that fails
closed. Single-tenant by design, with org scoping as an explicit app-level extension. Start at
chapter 1 and keep the same `my-workspace/` through to deploy.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" } }) }}
</content>
</invoke>

After this track, keep building in **Build › [Identity & Access](/identity-access/)** — the guides and recipes there pick up where these chapters stop.
