---
layout: layouts/base.vto
title: Recipes
templateEngine: [vento, md]
order: 100
---

# Services & SDK — recipes

Each recipe solves one task with services and the typed SDK. They assume you know the basics from
[Services & contracts](/services-sdk/services/) and [Typed SDK & client](/services-sdk/sdk/). The
full cross-area catalog is at [All how-to recipes]({{ "howto:index" |> xref |> url }}).

- [Add a service](/services-sdk/how-to/add-a-service/): add a typed oRPC service to a workspace,
  serve it with `defineService`, and verify its REST and RPC surfaces.
- [Discover services](/services-sdk/how-to/discover-services/): declare a service reference and
  call the service through a typed client that resolves its URL from Aspire.
- [Expose OpenAPI & Scalar](/services-sdk/how-to/expose-openapi-scalar/): serve the generated
  OpenAPI document and the Scalar reference UI for a service.
- [Call internal procedures from a service or worker](/services-sdk/how-to/call-internal-procedures/)
  with the provisioned installation credential and a policy covering both projections.
- [Protect an anonymous service route](/services-sdk/how-to/protect-an-anonymous-route/) with a
  shared client-address quota and explicit proxy trust.
