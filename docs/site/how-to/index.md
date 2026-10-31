---
layout: layouts/base.vto
title: Build
nav_title: Overview
description: Every NetScript capability area with its guides and recipes.
templateEngine: [vento, md]
---

# Build

Each area pairs guides, which explain a capability, with recipes, which solve one task. Pick the area
that matches what you are adding. In the sidebar, each area's **Recipes** section sits below the
guides that teach what its recipes assume.

{{ comp callout { type: "important", title: "Start Aspire first" } }}
Anything that touches Postgres, Redis or Garnet, or a plugin service needs Aspire running. From your
workspace, run <code>cd aspire &amp;&amp; aspire start</code> <strong>before</strong> any <code>netscript db</code> command or service
call. It starts the dependencies and the dashboard at the URL Aspire prints.
The recipes repeat this where it matters, but it is the most common missing step.
{{ /comp }}

{{ for root of navLanes.find((lane) => lane.id === "build").roots.slice(1) }}
{{ set area = nav.menu(root, navQuery, navSort) }}
## [{{ area.data.title }}]({{ area.data.url }})

{{ area.data.description }}

{{ for recipe of area.children?.find((child) => child.slug === "how-to")?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }})
{{ /for }}
{{ /for }}

## Preferred NetScript paths

Start with the framework-owned path for each task. Lower-level alternatives help when you integrate
an existing host, but they shouldn't be the first construction you copy into a NetScript workspace.

| Task | Preferred path | Why this path comes first |
| --- | --- | --- |
| Load data for a typed page | [`definePage().withResource(...)`](/web-layer/builders/) | Keeps route data in the page builder instead of recreating an Express-style loader. |
| Keep island data live | [`useLiveQuery`](/web-layer/query/) | Uses the package-owned query bridge, hydration, and cleanup rather than a hand-rolled polling loop. |
| Add or customize UI | [`netscript ui:add`]({{ "howto:customize-fresh-ui" |> xref |> url }}) | Copies registry source and its token-driven styles into the app you own. |
| Theme the whole app | [`netscript ui:apply`](/web-layer/how-to/theme-your-app/) | Switches the app-wide preset and rebuilds the tokens instead of editing generated CSS or theming one page. |
| Deploy to Google Cloud | [`netscript deploy cloud-run`]({{ "howto:deploy" |> xref |> url }}) | Uses the first-class target lifecycle (`plan`, `up`, `down`) instead of an unrelated deployment wrapper. |
| Back TanStack DB with a service | [`@netscript/sdk/collections`](/reference/sdk/#collections-netscriptsdkcollections) | Builds the collection from the typed service/query surface. |
| Connect a typed client to TanStack Query | [`@netscript/sdk/query-client`](/services-sdk/sdk/#service-discovery-query-client) | Supplies NetScript query keys, invalidation, persistence, and service utilities. |
| Add server-side stale-while-revalidate caching | [`CacheQuery` from `@netscript/sdk/cache`](/reference/sdk/) | Uses the SDK cache engine and its provider boundary rather than a parallel cache contract. |
| Publish interactive API documentation | [Scalar/OpenAPI]({{ "howto:expose-openapi-scalar" |> xref |> url }}) | One service option exposes the contract-derived spec and the bundled Scalar UI. |

The linked recipe or guide is the canonical sample. When it also shows a general-purpose
construction, treat that as an integration escape hatch, not the default route.
