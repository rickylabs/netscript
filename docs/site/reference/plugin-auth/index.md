---
layout: layouts/base.vto
title: "@netscript/plugin-auth"
---

# `@netscript/plugin-auth`

Public plugin manifest for NetScript auth. This page is generated from the package's
public surface with `deno doc`. For the auth package map, return to the
[auth reference hub](/reference/auth/).

The root entrypoint exposes the plugin manifest, auth contribution shapes, plugin
metadata constants, and a small manifest inspector.

## Plugin manifest

| Symbol | Kind | Description |
| --- | --- | --- |
| `authPlugin` | constant | Plugin manifest for NetScript auth. |
| `inspectAuth` | function | Inspect an `AuthPluginManifest` and return dependency and contribution-axis metadata. |
| `AuthPluginManifest` | interface | Manifest shape exported by the auth plugin package. |
| `AuthPluginContributions` | interface | Auth plugin contribution groups, including services, runtime config topics, and contract versions. |
| `AuthPluginInspection` | interface | JSON-stable inspection result returned by `inspectAuth`. |

## Constants

| Symbol | Value | Description |
| --- | --- | --- |
| `AUTH_PLUGIN_ID` | `"auth"` | Stable plugin id. |
| `AUTH_PLUGIN_VERSION` | `"0.0.1-alpha.0"` | Auth plugin package version constant. |
| `AUTH_API_SERVICE_NAME` | `"auth-api"` | Service name contributed by the auth plugin. |
| `AUTH_API_DEFAULT_PORT` | `8094` | Default auth-api service port. |

## Contribution types

| Symbol | Kind | Description |
| --- | --- | --- |
| `AuthServiceContribution` | type alias | Service contribution record for auth-api. |
| `AuthRuntimeConfigTopicContribution` | type alias | Runtime-config topic contribution record. |
| `AuthContractVersionContribution` | type alias | Contract-version contribution record. |
| `AuthPluginDependencies` | type alias | Dependency record accepted by the plugin manifest. |
| `AuthPluginDependencyManifest` | type alias | Dependency manifest shape used inside `AuthPluginDependencies`. |

## Sub-path exports

| Export | Purpose |
| --- | --- |
| `@netscript/plugin-auth` | Root plugin manifest and inspector. |
| `@netscript/plugin-auth/public` | Public plugin entrypoint. |
| `@netscript/plugin-auth/plugin` | Plugin manifest entrypoint. |
| `@netscript/plugin-auth/contracts` | Auth contract contribution entrypoint. |
| `@netscript/plugin-auth/services` | Auth service contribution entrypoint. |
| `@netscript/plugin-auth/streams` | Auth stream contribution entrypoint. |
| `@netscript/plugin-auth/streams/server` | Server-side auth stream helpers. |

Back to the [auth reference hub](/reference/auth/).
