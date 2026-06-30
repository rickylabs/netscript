---
layout: layouts/base.vto
title: "@netscript/plugin-auth"
---

# `@netscript/plugin-auth`

Public plugin manifest for NetScript auth. This page is generated from the package's
public surface with `deno doc`. For the auth package map, return to the
[auth reference hub](/reference/auth/).

The root entrypoint exposes the plugin manifest and auth metadata constants. Shared manifest
inspection is provided by `inspectPlugin` from `@netscript/plugin`.

## Plugin manifest

| Symbol | Kind | Description |
| --- | --- | --- |
| `authPlugin` | constant | Plugin manifest for NetScript auth. |

## Constants

| Symbol | Value | Description |
| --- | --- | --- |
| `AUTH_PLUGIN_ID` | `"auth"` | Stable plugin id. |
| `AUTH_PLUGIN_VERSION` | `"{{ releaseVersion }}"` | Auth plugin package version constant. |
| `AUTH_API_SERVICE_NAME` | `"auth-api"` | Service name contributed by the auth plugin. |
| `AUTH_API_DEFAULT_PORT` | `8094` | Default auth-api service port. |

## Sub-path exports

| Export | Purpose |
| --- | --- |
| `@netscript/plugin-auth` | Root plugin manifest. |
| `@netscript/plugin-auth/public` | Public plugin entrypoint. |
| `@netscript/plugin-auth/plugin` | Plugin manifest entrypoint. |
| `@netscript/plugin-auth/contracts` | Auth contract contribution entrypoint. |
| `@netscript/plugin-auth/services` | Auth service contribution entrypoint. |
| `@netscript/plugin-auth/streams` | Auth stream contribution entrypoint. |
| `@netscript/plugin-auth/streams/server` | Server-side auth stream helpers. |

Back to the [auth reference hub](/reference/auth/).
