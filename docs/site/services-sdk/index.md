---
layout: layouts/base.vto
title: Services and SDK
templateEngine: [vento, md]
---

# Services & SDK

**Declare the API once — as a versioned contract — and the server handler, the typed client, the
OpenAPI spec, and the query layer all derive from that one object.** That is this pillar in a
sentence. A [service](/services-sdk/services/) implements the contract; the
[SDK](/services-sdk/sdk/) consumes it. Because both sides import the *same* contract object, a
renamed field or a changed response shape is a compile error on both ends before it can ship —
there is no hand-written client wrapper to keep in sync, and no separate "update the API docs"
step.

That property is not hypothetical. In a production chat application built on NetScript,
every dashboard data call goes through a typed client built directly off the contract
type: adding a route to the channel contract makes it appear, fully typed, on the browser client
with no extra wiring turn. The same discipline pays off whether the code is written by a teammate
or an AI agent: one declared shape to read, one place to change it.

Use this pillar when you are defining a service, exposing OpenAPI or Scalar, or connecting a
front end to a service without duplicating request and response types. Start with
[Services & contracts](/services-sdk/services/) for the server side, then
[Typed SDK & client](/services-sdk/sdk/) for the caller side; the type-flow theory lives in
[Contracts](/explanation/contracts/).

{{ comp callout { type: "note", title: "TLS & HTTP/2 are opt-in" } }}
A service listens over plain HTTP by default. Pass a <code>tls</code> option
(<code>ServiceTlsOptions { cert, key }</code> as PEM strings) to <code>defineService</code> or the builder's
<code>.serve()</code> — or set both <code>NETSCRIPT_TLS_CERT_FILE</code> and
<code>NETSCRIPT_TLS_KEY_FILE</code> (file paths) — and the listener serves HTTPS and negotiates HTTP/2
via ALPN automatically. See <a href="/capabilities/services/#tls-http-2-opt-in">Services → TLS &amp; HTTP/2</a>.
{{ /comp }}

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Contracts to service to client", body: "The shared model for service handlers, OpenAPI, RPC, and typed clients.", href: "/explanation/contracts/", icon: "O" },
  { eyebrow: "Quickstart", title: "Catalog service", body: "Create the first service in the Storefront tutorial.", href: "/tutorials/storefront/02-catalog-service/", icon: "Q" },
  { eyebrow: "How-To", title: "Add a service", body: "Add a new service to a workspace.", href: "/services-sdk/how-to/add-a-service/", icon: "H" },
  { eyebrow: "How-To", title: "Discover services", body: "Resolve service URLs and clients from the generated workspace.", href: "/services-sdk/how-to/discover-services/", icon: "H" },
  { eyebrow: "How-To", title: "OpenAPI and Scalar", body: "Expose the generated OpenAPI document and Scalar UI.", href: "/services-sdk/how-to/expose-openapi-scalar/", icon: "H" },
  { eyebrow: "API Reference", title: "service and sdk", body: "Generated service, SDK, and contract package symbols.", href: "/reference/service/", icon: "R" }
] }) }}
