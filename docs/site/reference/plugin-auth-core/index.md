---
layout: layouts/base.vto
title: "@netscript/plugin-auth-core"
---

# `@netscript/plugin-auth-core`

Auth plugin contracts, backend ports, stream schemas, config schemas, telemetry
primitives, and testing primitives for NetScript auth plugins. This page is generated
from the package's public surface with `deno doc`.

## Backend ports and errors

| Symbol | Kind | Description |
| --- | --- | --- |
| `AuthBackendPort` | interface | Backend adapter port implemented by auth backends. |
| `AuthProviderRegistryPort` | interface | Registry port for provider descriptors and capabilities. |
| `AuthPrincipalMapperPort` | interface | Port for mapping upstream principals into NetScript auth principals. |
| `AuthSessionCryptoPort` | interface | Port for signing and verifying session tokens. |
| `AuthSessionStorePort` | interface | Port for session persistence. |
| `InteractiveFlowPort` | interface | Port for sign-in and callback flows when the backend supports interactive auth. |
| `AuthBackendOperationUnsupportedError` | class | Error for an adapter operation outside an upstream capability boundary. |
| `AuthBackendNotFoundError` | class | Error thrown when backend resolution cannot find a named backend. |

## Factories and helpers

| Symbol | Kind | Description |
| --- | --- | --- |
| `createAuthBackendRegistry` | function | Create a registry for named `AuthBackendPort` implementations. |
| `createAuthPresetRegistry` | function | Create a registry for auth backend presets. |
| `resolveBackend` | function | Resolve an auth backend from config and registry state. |
| `createAuthTelemetry` | function | Create auth telemetry helpers. |
| `createHmacSessionTokenCrypto` | function | Create an HMAC-backed session token crypto port. |
| `hashSubject` | function | Hash an auth subject for telemetry or storage-safe identity keys. |
| `redactAuthPrincipal` | function | Return a redacted principal snapshot for logging and diagnostics. |
| `authErrorCodeForReason` | function | Map an auth failure reason to an auth error code. |
| `authOutcomeForReason` | function | Map an auth failure reason to an operation outcome. |

## Contracts, schemas, and constants

| Symbol | Kind | Description |
| --- | --- | --- |
| `authContract` | constant | Root auth contract export. |
| `authContractV1` | constant | Versioned v1 auth contract export. |
| `authStreamSchema` | constant | Stream schema for auth events. |
| `AuthConfigSchema` | constant | Schema for auth runtime configuration. |
| `AuthProviderConfigSchema` | constant | Schema for provider configuration. |
| `AuthSessionPolicySchema` | constant | Schema for session policy configuration. |
| `AuthSessionSchema` | constant | Schema for auth sessions. |
| `AuthUserSchema` | constant | Schema for auth user payloads. |
| `AccountSchema` | constant | Schema for auth account payloads. |
| `AUTH_SESSION_STATES` | constant | Supported auth session states. |
| `AUTH_ACCOUNT_STATES` | constant | Supported account states. |
| `AUTH_STREAM_EVENT_TYPES` | constant | Supported auth stream event types. |
| `DEFAULT_AUTH_BACKEND_NAME` | constant | Default backend name used by config and registries. |

## Common types

| Symbol | Kind | Description |
| --- | --- | --- |
| `AuthConfig` | type alias | Parsed auth runtime configuration. |
| `AuthBackendRegistry` | type alias | Named backend registry type. |
| `ResolvedAuthBackendRegistry` | type alias | Resolved backend registry state. |
| `AuthProviderDescriptor` | type alias | Provider descriptor exposed by provider registries. |
| `AuthProviderCapability` | type alias | Capability value reported by auth providers. |
| `AuthSession` | type alias | Auth session payload. |
| `AuthSessionCreateInput` | type alias | Input used to create a session. |
| `AuthSessionLookup` | type alias | Lookup input for session resolution. |
| `AuthSessionState` | type alias | Session state value. |
| `AuthUser` | type alias | Auth user payload. |
| `AuthOperationOutcome` | type alias | Auth operation outcome value. |
| `AuthStreamEvent` | type alias | Auth stream event payload. |

## Sub-path exports

| Export | Purpose |
| --- | --- |
| `@netscript/plugin-auth-core` | Root contract, port, schema, stream, and telemetry surface. |
| `@netscript/plugin-auth-core/domain` | Domain types and schemas. |
| `@netscript/plugin-auth-core/ports` | Backend, provider, session, and interactive-flow ports. |
| `@netscript/plugin-auth-core/contracts/v1` | Versioned auth contract. |
| `@netscript/plugin-auth-core/telemetry` | Auth telemetry attributes and helpers. |
| `@netscript/plugin-auth-core/streams` | Auth stream schema and event types. |
| `@netscript/plugin-auth-core/config` | Runtime config schemas and backend resolution helpers. |
| `@netscript/plugin-auth-core/presets` | Backend preset registry helpers. |
| `@netscript/plugin-auth-core/testing` | Testing primitives for auth packages. |

Back to the [auth reference hub](/reference/auth/).
