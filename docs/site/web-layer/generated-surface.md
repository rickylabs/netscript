---
layout: layouts/base.vto
title: Generated web surface
templateEngine: [vento, md]
order: 4
---

# Generated web surface

A scaffolded Fresh app contains both editable starter code and modules that are regenerated from
route files. A file created by the CLI is not necessarily generator-owned. In particular,
`ui:add page` output has no generated header banner; use the roles below to decide what to edit. All
paths below are relative to the Fresh app root, such as `apps/dashboard/`.

| Surface                                       | Role and ownership                                                                                                                                           | How to change it                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `routes/catalog/index.tsx`                    | App-owned page created by `netscript ui:add page catalog`. Imports `definePage` from `@app/utils.ts` and binds `appRoutes['catalog']` from `@app/router.ts`. | Edit the page, metadata, view, and loaders. Move it together with its owned colocated files.                                                           |
| `routes/catalog/(_shared)/query-loaders.ts`   | Editable server query loader, created when `--island` selects a service client.                                                                              | Edit data loading and repair imports after a move.                                                                                                     |
| `routes/catalog/(_islands)/CatalogIsland.tsx` | Editable client island created alongside that loader.                                                                                                        | Edit the interactive view and its query inputs; keep its loader import in sync.                                                                        |
| `router.ts`                                   | Editable app route registry (`appRoutes`). `ui:add page` adds `createRouteReference('/catalog', { id: 'catalog', kind: 'page' })`.                           | Reconcile the literal URL, key, metadata `id`, and consumers manually after a move/removal. Vite manifest generation does not reconcile this registry. |
| `utils.ts`                                    | Scaffolded, editable shared `define` and `definePage` wiring.                                                                                                | Keep app state and builder configuration consistent with page imports.                                                                                 |
| A sibling `*.contract.ts`                     | App-owned route contract sidecar, if you author one; not part of the `ui:add page` triad.                                                                    | Move it with its matching page and reconcile schemas when parameters change.                                                                           |
| `.generated/manifest.ts`                      | Generator-owned `routePatterns` tree derived from filesystem routes.                                                                                         | Refresh through the configured NetScript Vite plugin; do not hand-edit.                                                                                |
| `.generated/routes.ts`                        | Generator-owned `routes` tree of bound references, using discovered contracts where present.                                                                 | Refresh through the configured NetScript Vite plugin; update consumers when accessor keys change.                                                      |

The loader/island pair is optional: a page without `--island` has the page and registration only.
`(_shared)` and `(_islands)` are co-location groups and do not add URL segments. Renaming component
symbols is optional; updating their imports is necessary whenever the move changes relative paths.

## Refreshing the route tree

With `routeManifest` enabled in `createNetScriptVitePlugin`, the plugin writes the generated route
modules on initialization and build, and refreshes them on relevant route changes during a dev
server run. Use the app's configured Vite build or dev task after a move. A standalone `deno check`
does not refresh these modules, and there is currently no public `netscript generate routes` verb.

The plugin also manages route-binding seams for the authoring forms described in
[Routing and route contracts](/web-layer/route/#three-authoring-forms-one-generated-binding). That
does not make the separate string-literal `appRoutes` registry track filesystem renames.

## Rename safety and manual lifecycle

After regeneration, a removed accessor such as `routes.catalog.$route` fails type checking at
consumers that still reference it. `appRoutes['catalog']`, however, can keep compiling after a
folder move because its pattern is a string literal. Typed href parameters do not prove that a route
file exists at that URL.

Use the [Renaming or Moving a Route checklist](/web-layer/route/#renaming-or-moving-a-route) to
reconcile the directory, colocated files, `router.ts`, page binding, navigation, and generated tree.
Verify the new URL and loader/island behavior in the running app as well as type checking.

For a move from `routes/catalog/` to `routes/inventory/`, change the `router.ts` pattern from
`/catalog` to `/inventory`. The registry key and metadata `id` are identifiers, not URL segments:
you may keep `catalog`, or rename both to `inventory` and update the page to
`.withRoute(appRoutes['inventory'])` and every consumer of the old key. Remove obsolete or
duplicate registrations. Search for the old URL and generated accessor too; check navigation,
redirects, and partial pairings. If parameters change, reconcile path schemas and href inputs.
After refreshing the tree, type-check and visit the new URL, including any loader and island.
Decide whether the old URL should return 404 or needs an authored redirect for existing links.

There is currently no `netscript ui:rename` or `netscript route rename` command.
`netscript ui:remove
<name>` removes a copied Fresh UI registry item, not a page triad;
`netscript ui:remove page <path>` is not available. Remove pages and their owned files manually,
prune their route registration and consumers, and regenerate before verifying the old URL and
navigation.
