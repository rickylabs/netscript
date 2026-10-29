---
layout: layouts/base.vto
title: Team Workspace
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" }
order: 2
---

# Team Workspace

This track builds the identity layer of a team workspace: who is on the team, where their data
lives, and which routes they may call. You go from an empty folder to a running, session-protected
app under Aspire, using NetScript's pluggable auth backend, normalized session and typed
`.withAuthn()` / `.withAuthz()` route seam instead of a hand-written sign-in flow and route
middleware.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A NetScript workspace, `my-workspace/`, that:

- signs a user in through an OAuth/OIDC provider and mints a session cookie;
- stores team records in their own isolated database (Postgres by default; `mysql`, `mssql` or
  `sqlite` via `--db`);
- provisions a new member off the request path with a background job;
- rejects unauthenticated requests to its guarded routes with a `401`.

All of it runs locally under one Aspire dashboard. It is one continuous app: `my-workspace/` grows
with every chapter.

{{ comp callout { type: "note", title: "What NetScript ships and what stays your code" } }}
NetScript ships <strong>pluggable auth backends</strong> (an <code>auth-api</code> service with a
single active backend chosen by an environment variable), a normalized <strong>session</strong>, and
a provider-agnostic <strong>route-authz seam</strong> (<code>.withAuthn()</code> /
<code>.withAuthz()</code>). It does <strong>not</strong> ship first-class organizations, tenants or
RBAC roles. The data model in this track is single-tenant. Where the track touches org scoping, it
marks it as an <em>app-level extension</em>: you add your own <code>orgId</code> column and filter in
your own queries.
{{ /comp }}

## The arc: auth → session → authz

Each idea arrives in its own chapter:

- **Auth.** A *backend* turns a sign-in into an identity. You pick one of three backends
  (`kv-oauth`, `workos`, `better-auth`) with an environment variable; the contract is identical
  across all three.
- **Session.** A successful sign-in mints a normalized `AuthSession` and sets a session cookie.
  Every later request resolves the current session from that cookie.
- **Authz.** A service gates its own routes with `.withAuthn()` (resolve a `Principal`) and
  `.withAuthz()` (decide from it). This is route-level authorization, not org or role RBAC.

## Who this is for

You should know the basics from the [core tutorial ladder](/tutorials/): scaffolding a workspace,
the contract → service flow, and bringing up Aspire. This track assumes you can scaffold and boot,
then adds authentication. If `netscript init` and `aspire start` are new to you, walk the
[Quickstart](/quickstart/) first.

## The six chapters

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold",
    body: "Create <code>my-workspace/</code> with an example service and Postgres, then boot it under Aspire.",
    href: "/tutorials/workspace/01-scaffold/"
  },
  {
    title: "2 · Auth",
    body: "Add the <code>auth</code> plugin, choose the interactive <code>kv-oauth</code> backend, run the <code>auth.prisma</code> migration, and check the session endpoints on the <code>auth-api</code> service at its allocated endpoint.",
    href: "/tutorials/workspace/02-auth/"
  },
  {
    title: "3 · Workspace data",
    body: "Give the workspace its own isolated database with <code>netscript db add</code> and a per-datasource schema. App-level <code>orgId</code> scoping appears as an extension.",
    href: "/tutorials/workspace/03-workspace-data/"
  },
  {
    title: "4 · Provision job",
    body: "Move member provisioning off the request path: write a <code>defineJobHandler</code> job that creates a membership, and trigger it over the Workers API.",
    href: "/tutorials/workspace/04-provision-job/"
  },
  {
    title: "5 · Route authz",
    body: "Protect service routes with <code>.withAuthn()</code> / <code>.withAuthz()</code>: an authenticated request succeeds and an unauthenticated one gets a 401.",
    href: "/tutorials/workspace/05-route-authz/"
  },
  {
    title: "6 · Deploy",
    body: "Run the whole workspace locally under Aspire, including the auth service, and read it from one dashboard.",
    href: "/tutorials/workspace/06-deploy/"
  }
] }) }}

## Start the track

Start at chapter 1 and keep the same `my-workspace/` through to chapter 6. After the track, the
guides in **Build › [Identity & Access](/identity-access/)** pick up where these chapters stop.
