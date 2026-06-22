---
layout: layouts/base.vto
title: Services and SDK
templateEngine: [vento, md]
---

# Services & SDK

Services define the synchronous API boundary, and the SDK gives callers a typed client for those
same contracts. Use this pillar when you are defining a service, exposing OpenAPI or Scalar, or
connecting a front end to a service without duplicating request and response types.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Contracts to service to client", body: "The shared model for service handlers, OpenAPI, RPC, and typed clients.", href: "/explanation/contracts/", icon: "O" },
  { eyebrow: "Quickstart", title: "Catalog service", body: "Create the first service in the Storefront tutorial.", href: "/tutorials/storefront/02-catalog-service/", icon: "Q" },
  { eyebrow: "How-To", title: "Add a service", body: "Add a new service to a workspace.", href: "/how-to/add-a-service/", icon: "H" },
  { eyebrow: "How-To", title: "Discover services", body: "Resolve service URLs and clients from the generated workspace.", href: "/how-to/discover-services/", icon: "H" },
  { eyebrow: "How-To", title: "OpenAPI and Scalar", body: "Expose the generated OpenAPI document and Scalar UI.", href: "/how-to/expose-openapi-scalar/", icon: "H" },
  { eyebrow: "API Reference", title: "service and sdk", body: "Generated service, SDK, and contract package symbols.", href: "/reference/service/", icon: "R" }
] }) }}
