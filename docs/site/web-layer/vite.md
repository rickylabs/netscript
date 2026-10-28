---
layout: layouts/base.vto
title: Build and Vite integration
templateEngine: [vento, md]
order: 8
---

# Build and Vite integration

This page shows how to configure the Vite plugin from `@netscript/fresh/vite` for a NetScript Fresh
app. The plugin resolves app aliases, maps environment variables into `import.meta.env`, and
generates route manifests at build and dev time.

## The plugin factory

`createNetScriptVitePlugin(options)` takes a `NetScriptVitePluginOptions` object and returns a
`NetScriptVitePlugin`, the package-owned view of the Vite hooks NetScript Fresh uses. Add it to the
`plugins` array of your Vite config. It runs with `enforce: "pre"`, so its hooks run ahead of most
other plugins. [`NetScriptVitePlugin` hooks](#netscriptviteplugin-hooks) lists what each hook does.

## Basic setup

A minimal setup points the plugin at the Fresh app root. Without alias entries, the plugin
generates aliases from the app root.

```ts
import { createNetScriptVitePlugin } from "@netscript/fresh/vite";

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  workspaceRoot: ".",
});

export default {
  plugins: [netscript],
};
```

## Aliases

The `resolveId` hook resolves aliases. You control them in one of two ways.

Pass `aliasEntries` to use a fixed set of aliases instead of generated ones. Each
`NetScriptViteAlias` has a `find` (the import specifier prefix or exact specifier to match) and a
`replacement` (the filesystem path that replaces it).

```ts
import {
  createNetScriptVitePlugin,
  type NetScriptViteAlias,
} from "@netscript/fresh/vite";

const aliasEntries: NetScriptViteAlias[] = [
  { find: "@app/", replacement: "./app/" },
];

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  aliasEntries,
});
```

Or let the plugin generate aliases from app-root-relative `aliasDirectories` and an `aliasPrefix`:

```ts
const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  aliasPrefix: "@app/",
  aliasDirectories: ["islands", "components"],
});
```

## Environment variables

Use `envMappings` to expose environment values through `import.meta.env`. Each
`NetScriptViteEnvMapping` reads a `source` key from the `env` map you pass, defines a `target` key on
`import.meta.env`, and may supply a `fallback` for when the source key is absent.

```ts
import {
  createNetScriptVitePlugin,
  type NetScriptViteEnvMapping,
} from "@netscript/fresh/vite";

const envMappings: NetScriptViteEnvMapping[] = [
  {
    source: "PUBLIC_API_URL",
    target: "VITE_API_URL",
    fallback: "http://localhost:3000", // note: your scaffold's ports will differ
  },
];

const netscript = createNetScriptVitePlugin({
  appRoot: "./app",
  envMappings,
  env: Deno.env.toObject(),
});
```

## Route manifests

The plugin generates route manifests in the `buildStart` hook for builds and through
`configureServer` watchers during development. Configure it with `routeManifest`, a
`NetScriptRouteManifestOptions` object.

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

The plugin sets up the Vite dev server's filesystem allow-list. `watchPaths` adds paths the dev
server watches, `allowFsPaths` adds paths it may serve, and `includeWorkspaceRootInFsAllow` controls
whether `workspaceRoot` joins the allow-list.

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

| Symbol | Kind | Description |
| --- | --- | --- |
| `createNetScriptVitePlugin(options)` | function | Create the NetScript Fresh Vite plugin for aliases, env mapping, and route manifests. |
| `NetScriptVitePluginOptions` | interface | Options accepted by the NetScript Fresh Vite plugin. |
| `NetScriptVitePlugin` | interface | Package-owned view of the Vite plugin hooks used by NetScript Fresh. |
| `NetScriptViteAlias` | interface | Resolved Vite alias entry generated or accepted by the plugin (`find`, `replacement`). |
| `NetScriptViteEnvMapping` | interface | Environment variable mapping injected into `import.meta.env` (`source`, `target`, `fallback?`). |
| `NetScriptRouteManifestOptions` | interface | Options controlling the NetScript route manifest generator. |

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

## Next steps

Define the routes the manifest generator scans in [Routing and route contracts](/web-layer/route/).
See also [The Fresh page model](/web-layer/server/) and [Testing Fresh pages](/web-layer/testing/).
