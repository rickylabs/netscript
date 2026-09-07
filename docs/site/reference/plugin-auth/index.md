---
layout: layouts/base.vto
title: "@netscript/plugin-auth"
templateEngine: [vento, md]
---

# `@netscript/plugin-auth`

Public plugin manifest for NetScript auth. This page is written against the package's
public surface reported by `deno doc`. For the auth package map, return to the
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

## Remote session verification

Import these symbols from the `./authenticator` leaf. The factory requires `serviceName` and
`timeoutMs`; it returns the native `AuthenticatorPort`. It forwards bearer credentials only and
retains no principal cache. Authorization remains a separate service policy.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createAuthServiceAuthenticator` | function | Verify an active, unexpired session through the native auth SDK. |
| `AuthServiceAuthenticatorOptions` | interface | Required discovery name and timeout, optional router/protocol and explicit cleartext policy. |
| `readBearerCredential` | function | Read a single strict bearer credential; reject ambiguous headers. |
| `REMOTE_SESSION_REJECTIONS` | constant | Stable missing, unauthorized, inactive and expired denial reasons. |
| `RemoteSessionVerificationError` | class | Redacted transport, timeout, malformed response or remote error diagnostics. |

Native middleware returns 401 for denial and 503 for verifier unavailability. Native claims are
preserved and can contain sensitive session metadata; do not log them wholesale. Backend bearer
support is provider-dependent; KV-OAuth and WorkOS accept token lookup, while better-auth retains
its own request-header resolution.

## Sub-path exports

| Export | Path | Purpose |
| --- | --- | --- |
| `@netscript/plugin-auth` | `./mod.ts` | Root plugin manifest. |
| `@netscript/plugin-auth/public` | `./src/public/mod.ts` | Public plugin entrypoint. |
| `@netscript/plugin-auth/plugin` | `./src/public/mod.ts` | Plugin manifest entrypoint. |
| `@netscript/plugin-auth/contracts` | `./contracts/v1/mod.ts` | Auth contract contribution entrypoint. |
| `@netscript/plugin-auth/scaffold` | `./scaffold.ts` | Executable plugin scaffolder entrypoint and its shared scaffolding protocol types. |
| `@netscript/plugin-auth/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-auth/services` | `./services/src/main.ts` | Auth service contribution entrypoint. |
| `@netscript/plugin-auth/streams` | `./streams/mod.ts` | Auth stream contribution entrypoint. |
| `@netscript/plugin-auth/streams/server` | `./streams/server.ts` | Server-side auth stream helpers. |
| `@netscript/plugin-auth/authenticator` | `./src/public/authenticator.ts` | Server-side remote session verification through the native SDK. |

Back to the [auth reference hub](/reference/auth/).
