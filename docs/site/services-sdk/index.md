---
layout: layouts/base.vto
title: Services and SDK
templateEngine: [vento, md]
---

# Services & SDK

This section covers NetScript services and the typed SDK that calls them. You declare an API once
as a versioned contract; the server handler, the typed client, the OpenAPI document and the query
layer all derive from that one object. A service implements the contract and the SDK consumes it.
Both import the same contract object, so a renamed field or a changed response shape is a compile
error on both ends before it ships.

## Guides

- [Services & contracts](/services-sdk/services/): define a contract, implement it, and serve it
  with `defineService` or the fluent builder, including health, shutdown, TLS and service auth.
- [Typed SDK & client](/services-sdk/sdk/): call a service through a typed client, cache-first
  query factories and TanStack Query helpers.
- [Service layout](/services-sdk/service-layout/): the folder vocabulary inside a service, when to
  split modules, and how to migrate an existing service.
- [Recipes](/services-sdk/how-to/): add a service, discover services, expose OpenAPI and Scalar,
  call internal procedures, and protect anonymous routes.

The type-flow theory behind this section is in [Contracts](/explanation/contracts/).

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
{ eyebrow: "Learn", title: "Storefront tutorial", body: "Define contracts and services, then consume them through the typed SDK.", href: resolveXref("tut:storefront").href },
{ eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/services-sdk/how-to/" },
{ eyebrow: "Look up", title: "`@netscript/service` reference", body: "Generated API reference. Related units: `sdk`, `contracts`.", href: resolveXref("ref:service").href },
{ eyebrow: "Understand", title: "Contracts & type flow", body: "The design rationale behind this pillar.", href: resolveXref("explain:contracts").href },
] }) }}
