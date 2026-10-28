---
layout: layouts/base.vto
title: Generated web surface
templateEngine: [vento, md]
order: 4
---

# Generated web surface

This page tells you which files in a scaffolded Fresh app you own and which are regenerated from
route files. A file the CLI created is not necessarily generator-owned: `ui:add page` output has no
generated header banner, so use the roles below to decide what to edit. Paths are relative to the
Fresh app root, such as `apps/dashboard/`.

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
`(_shared)` and `(_islands)` are co-location groups and add no URL segments. After a move, renaming
component symbols is optional, but you must update imports whose relative paths changed.

## Refreshing the route tree

With `routeManifest` enabled in `createNetScriptVitePlugin`, the plugin writes the generated route
modules on initialization and build, and refreshes them on route changes while the dev server runs.
After a move, run the app's configured Vite build or dev task; a standalone `deno check` does not
refresh these modules. To refresh them without a Vite build, run
`netscript generate routes --app dashboard`; `--project-root <app-root>` selects an explicit
application.

The plugin also manages the route-binding seams described in
[Routing and route contracts](/web-layer/route/#three-authoring-forms-one-generated-binding). It does
not make the separate string-literal `appRoutes` registry track filesystem renames.

## Rename safety and manual lifecycle

After regeneration, a removed accessor such as `routes.catalog.$route` fails type checking at
consumers that still reference it. `appRoutes['catalog']`, however, can keep compiling after a
folder move because its pattern is a string literal. Typed href parameters do not prove that a route
file exists at that URL.

Follow the [Renaming or moving a route checklist](/web-layer/route/#renaming-or-moving-a-route) to
reconcile the directory, colocated files, `router.ts`, page binding, navigation and generated tree,
then verify the new URL and loader/island behavior in the running app.

For a move from `routes/catalog/` to `routes/inventory/`, change the `router.ts` pattern from
`/catalog` to `/inventory`. The registry key and metadata `id` are identifiers, not URL segments:
keep `catalog`, or rename both to `inventory` and update the page to
`.withRoute(appRoutes['inventory'])` and every consumer of the old key. Remove obsolete or duplicate
registrations, and decide whether the old URL should return 404 or needs an authored redirect for
existing links.

There is no `netscript ui:rename` or `netscript route rename` command. `netscript ui:remove <name>`
removes a copied Fresh UI registry item, and `netscript ui:remove page catalog --dry-run` previews
removing an unchanged `ui:add page` scaffold. The checklist covers what that removal deletes, what it
refuses, and how to reconcile customized pages by hand before running `netscript generate routes`.

## Next steps

Continue with [Build and Vite integration](/web-layer/vite/) for the plugin options that write these
generated modules.
