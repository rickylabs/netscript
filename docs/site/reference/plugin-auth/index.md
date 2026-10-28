---
layout: layouts/base.vto
title: "@netscript/plugin-auth"
description: The auth plugin manifest, its constants, remote session verification, and the map of auth packages.
templateEngine: [vento, md]
oldUrl: /reference/auth/
---

# `@netscript/plugin-auth`

The NetScript auth plugin: its manifest, the `auth-api` service, and the integration entrypoints a
workspace mounts. Use it to add authentication to a workspace; contracts, ports and schemas live in
[`@netscript/plugin-auth-core`](/reference/plugin-auth-core/). The other auth packages are listed
under [Auth packages](#auth-packages).

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-auth` | `./mod.ts` | Root [plugin manifest](#plugin-manifest) and [constants](#constants). |
| `@netscript/plugin-auth/public` | `./src/public/mod.ts` | Public plugin entrypoint. |
| `@netscript/plugin-auth/plugin` | `./src/public/mod.ts` | Plugin manifest entrypoint. |
| `@netscript/plugin-auth/contracts` | `./contracts/v1/mod.ts` | Auth contract contribution entrypoint. |
| `@netscript/plugin-auth/scaffold` | `./scaffold.ts` | Executable plugin scaffolder entrypoint and its shared scaffolding protocol types. |
| `@netscript/plugin-auth/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-auth/services` | `./services/src/main.ts` | Auth service contribution entrypoint. |
| `@netscript/plugin-auth/streams` | `./streams/mod.ts` | Auth stream contribution entrypoint. |
| `@netscript/plugin-auth/streams/server` | `./streams/server.ts` | Server-side auth stream helpers. |
| `@netscript/plugin-auth/authenticator` | `./src/public/authenticator.ts` | [Remote session verification](#remote-session-verification) through the native SDK. |

## Plugin manifest

| Symbol | Kind | Description |
| --- | --- | --- |
| `authPlugin` | const | Plugin manifest for NetScript auth. |

Inspect the manifest with `inspectPlugin` from [`@netscript/plugin`](/reference/plugin/).

## Constants

| Symbol | Kind | Value | Description |
| --- | --- | --- | --- |
| `AUTH_PLUGIN_ID` | const | `"auth"` | Stable plugin id. |
| `AUTH_PLUGIN_VERSION` | const | `"{{ releaseVersion }}"` | Auth plugin package version constant. |
| `AUTH_API_SERVICE_NAME` | const | `"auth-api"` | Service name contributed by the auth plugin. |
| `AUTH_API_DEFAULT_PORT` | const | `8094` | Default auth-api service port. |

## Remote session verification

`@netscript/plugin-auth/authenticator` re-exports the remote session verifier from
`@netscript/plugin-auth-core/authenticator`: `createAuthServiceAuthenticator`,
`AuthServiceAuthenticatorOptions`, `readBearerCredential`, `REMOTE_SESSION_REJECTIONS`,
`RemoteSessionVerificationError` and the `AuthenticatorPort`, `AuthnRequest`, `AuthnResult` and
`Principal` types. See
[remote session verification](/reference/plugin-auth-core/#remote-session-verification) for the
symbols and their behavior.

## Auth packages

NetScript auth spans one plugin package, one core contract package and three backend adapters. Pick
the page for the package you import.

| Package | Primary factory | Purpose |
| --- | --- | --- |
| [`@netscript/plugin-auth`](/reference/plugin-auth/) | | Auth plugin manifest, contribution metadata, and plugin inspection helper. |
| [`@netscript/plugin-auth-core`](/reference/plugin-auth-core/) | | Auth contracts, backend ports, session schemas, stream schemas, config schemas, and telemetry primitives. Unsupported upstream operations raise its `AuthBackendOperationUnsupportedError`. |
| [`@netscript/auth-kv-oauth`](/reference/auth-kv-oauth/) | `createKvOAuthBackend(options)` | KV-backed OAuth2/OIDC relying-party backend. Uses provider configs created with `defineOAuthProvider(input)` or the exported provider presets. |
| [`@netscript/auth-workos`](/reference/auth-workos/) | `createWorkosBackend(options)` | WorkOS-backed authenticator and backend adapter. Wraps WorkOS session and token verification behind `AuthBackendPort`. |
| [`@netscript/auth-better-auth`](/reference/auth-better-auth/) | `createBetterAuthBackend(options)` | Better Auth integration, authenticator, and backend adapter. Wraps a Better Auth instance behind `AuthBackendPort`. |

The KV OAuth callback's `oauth_cookie_missing` error is documented under
[OAuth callback errors](/reference/auth-kv-oauth/#oauth-callback-errors). For the capability
guide, start with [Authentication](/identity-access/auth/); for the service builder behind
`auth-api`, see [`@netscript/service`](/reference/service/).
