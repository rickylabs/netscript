---
layout: layouts/base.vto
title: Build and Vite integration
templateEngine: [vento, md]
order: 8
---

# Build and Vite integration

@netscript/fresh ships a Vite plugin that wires a Fresh workspace into the build:
it resolves NetScript app aliases, maps environment variables into
`import.meta.env`, and generates route manifests at build and dev time. Reach for
it when you set up the Vite config for a NetScript Fresh app and want aliases, env
exposure, and route manifest generation handled in one place.

## The plugin factory

`createNetScriptVitePlugin(options)` is the single entry point. It accepts a
`NetScriptVitePluginOptions` object and returns a `NetScriptVitePlugin` — the
package-owned view of the Vite plugin hooks NetScript Fresh relies on. Add the
returned plugin to the `plugins` array of your Vite config.

The returned plugin runs with `enforce: "pre"`, so its hooks order ahead of most
other plugins. It contributes four things:

- **Config defaults** through the `config` hook, which returns Vite config
  defaults for NetScript Fresh workspaces.
- **Alias resolution** through the `resolveId` hook, which resolves NetScript app
  aliases to absolute file paths.
- **Route manifests** through the `buildStart` hook, which generates route
  manifests when the Vite build starts.
- **Dev-server watchers** through the `configureServer` hook, which registers
  development-server watchers for route manifests.

## Basic setup

A minimal integration points the plugin at the Fresh app root. With no alias
entries supplied, the plugin generates aliases from the app root.

```ts
import { createNetScriptVitePlugin } from "@netscript/fresh";

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  workspaceRoot: ".",
});

export default {
  plugins: [netscript],
};
```

## Aliases

Aliases are resolved through `resolveId`. There are two ways to control them.

Supply explicit `aliasEntries` to use a fixed set of aliases instead of generated
ones. Each `NetScriptViteAlias` has a `find` (the import specifier prefix or exact
specifier to match) and a `replacement` (the filesystem path that replaces the
matched specifier).

```ts
import {
  createNetScriptVitePlugin,
  type NetScriptViteAlias,
} from "@netscript/fresh";

const aliasEntries: NetScriptViteAlias[] = [
  { find: "@app/", replacement: "./app/" },
];

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  aliasEntries,
});
```

Alternatively, let the plugin generate aliases by listing app-root-relative
`aliasDirectories` and an `aliasPrefix`:

```ts
const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  aliasPrefix: "@app/",
  aliasDirectories: ["islands", "components"],
});
```

## Environment variables

Use `envMappings` to expose environment values through `import.meta.env`. Each
`NetScriptViteEnvMapping` reads a `source` key from the provided environment map,
defines a `target` key on `import.meta.env`, and may supply a `fallback` value used
when the source key is absent. Provide the source values through `env`.

```ts
import {
  createNetScriptVitePlugin,
  type NetScriptViteEnvMapping,
} from "@netscript/fresh";

const envMappings: NetScriptViteEnvMapping[] = [
  {
    source: "PUBLIC_API_URL",
    target: "VITE_API_URL",
    fallback: "http://localhost:3000",
  },
];

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  envMappings,
  env: Deno.env.toObject(),
});
```

## Route manifests

Route manifest generation runs in the `buildStart` hook for builds and through
`configureServer` watchers during development. Configure it with `routeManifest`,
a `NetScriptRouteManifestOptions` object.

```ts
const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  routeManifest: {
    enabled: true,
    routesDir: "./app/routes",
    outputPath: "./app/_routes.gen.ts",
    logLevel: "changes",
  },
});
```

`logLevel` accepts `"silent"`, `"changes"`, or `"verbose"`.

## Dev-server filesystem access

The plugin sets up the Vite dev server's filesystem allow-list. `watchPaths` adds
paths watched by the dev server, `allowFsPaths` adds filesystem paths the dev
server is allowed to serve, and `includeWorkspaceRootInFsAllow` controls whether
`workspaceRoot` is included in the filesystem allow-list.

```ts
const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  workspaceRoot: ".",
  watchPaths: ["./app/routes"],
  allowFsPaths: ["./packages"],
  includeWorkspaceRootInFsAllow: true,
});
```

## API summary

| Symbol | Description |
| --- | --- |
| `createNetScriptVitePlugin(options)` | Create the NetScript Fresh Vite plugin for aliases, env mapping, and route manifests. |
| `NetScriptVitePluginOptions` | Options accepted by the NetScript Fresh Vite plugin. |
| `NetScriptVitePlugin` | Package-owned view of the Vite plugin hooks used by NetScript Fresh. |
| `NetScriptViteAlias` | Resolved Vite alias entry generated or accepted by the plugin (`find`, `replacement`). |
| `NetScriptViteEnvMapping` | Environment variable mapping injected into `import.meta.env` (`source`, `target`, `fallback?`). |
| `NetScriptRouteManifestOptions` | Options controlling the NetScript route manifest generator. |

### `NetScriptVitePluginOptions` fields

| Field | Type | Description |
| --- | --- | --- |
| `appRoot?` | `string` | Fresh app root used for aliases and route manifest output. |
| `workspaceRoot?` | `string` | Workspace root allowed through the Vite dev-server filesystem guard. |
| `aliasEntries?` | `NetScriptViteAlias[]` | Explicit Vite aliases to use instead of generated aliases. |
| `aliasDirectories?` | `string[]` | App-root-relative directories used to generate aliases. |
| `aliasPrefix?` | `string` | Alias prefix used for generated aliases. |
| `watchPaths?` | `string[]` | Additional paths watched by the Vite dev server. |
| `envMappings?` | `NetScriptViteEnvMapping[]` | Environment variable mappings to expose through `import.meta.env`. |
| `env?` | `Record<string, string \| undefined>` | Environment source values used by `envMappings`. |
| `allowFsPaths?` | `string[]` | Additional filesystem paths allowed by the Vite dev server. |
| `includeWorkspaceRootInFsAllow?` | `boolean` | Whether to include `workspaceRoot` in the Vite filesystem allow-list. |
| `routeManifest?` | `NetScriptRouteManifestOptions` | Route manifest generation options. |

### `NetScriptVitePlugin` hooks

| Member | Description |
| --- | --- |
| `name` | Vite plugin name. |
| `enforce` | Vite hook ordering (`"pre"`). |
| `config(config, env)` | Return Vite config defaults for NetScript Fresh workspaces. |
| `resolveId(source)` | Resolve NetScript app aliases to absolute file paths. |
| `buildStart()` | Generate route manifests when the Vite build starts. |
| `configureServer(server)` | Register development-server watchers for route manifests. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "The Fresh page model", body: "Server rendering and the page lifecycle.", href: "/web-layer/server/" },
  { title: "Routing and route contracts", body: "Define routes the manifest generator scans.", href: "/web-layer/route/" },
  { title: "Interactive islands", body: "Client islands resolved through app aliases.", href: "/web-layer/interactive/" }
] }) }}

- [The Fresh page model](/web-layer/server/)
- [Pages and the define-page builder](/web-layer/builders/)
- [Routing and route contracts](/web-layer/route/)
- [Data loading and the query cache](/web-layer/query/)
- [Server-validated forms](/web-layer/form/)
- [Deferred and streaming UI](/web-layer/defer-streaming-ui/)
- [Interactive islands](/web-layer/interactive/)
- [Error handling and diagnostics](/web-layer/error/)
- [Testing Fresh pages](/web-layer/testing/)
- [Examples and sandbox](/web-layer/examples/)
- [Web Layer overview](/web-layer/)
- [Live dashboard tutorial](/tutorials/live-dashboard/)
