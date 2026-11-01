---
layout: layouts/base.vto
title: Host workers and streams services
templateEngine: [vento, md]
order: 120
---

# Host workers and streams services

Use the singular `@netscript/plugin-workers/service` and `@netscript/plugin-streams/service`
entrypoints when your host owns authentication, CORS or listener configuration. Imports are inert;
calling a factory validates the required native `ServiceAuthPolicy` before runtime I/O and returns
an ordinary `RunningService`. Keep the plural `./services` entrypoints for the existing CLI flow.

| Entrypoint           | Import and startup behavior                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| Workers `./service`  | Inert import; `startWorkersService(context, options)` requires explicit auth.      |
| Streams `./service`  | Inert import; `startStreamsService(options)` requires explicit auth.               |
| Workers `./services` | Existing default factory and direct CLI bootstrap; authored public policy.         |
| Streams `./services` | Existing start-on-import CLI entrypoint; authored public and wildcard CORS policy. |

## Start workers with the host context

Your bootstrap supplies the existing plugin context and authenticator. Register the host's chosen KV
adapter before calling the factory, just as for the legacy runtime. This entrypoint adds listener
and policy options without creating another worker runtime or changing job registration.

```ts
import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { AuthenticatorPort } from '@netscript/service/auth';
import { startWorkersService } from '@netscript/plugin-workers/service';

declare const context: PluginServiceContext;
declare const authenticator: AuthenticatorPort;

if (import.meta.main) {
  const running = await startWorkersService(context, {
    auth: { authn: { authenticator } },
    cors: { origin: ['https://app.example'] },
    serve: { hostname: '127.0.0.1', port: 0 },
  });
  console.log(running.addr);
}
```

Workers keeps its plugin-owned request context and job/task registries. The legacy host context
selects the fallback port through `context.env.PORT`; the runtime still uses the host-registered
global KV adapter. It does not resolve the opaque host DB on startup or replace the native
principal. Stopping a service drains its listener and leaves host-owned KV and stream producers
available.

## Guard the streams raw routes

Native auth defaults protect `/api`, while streams serves raw `/v1/stream/...` routes. Explicitly
select `protect: ['/']`, or the intended stream prefix, when configuring a guarded streams host. The
factory forwards your native policy unchanged. An authenticator alone keeps native `/api` scope.

Keep the health probes your launcher needs anonymous. These exact entries allow GET and HEAD on the
three health paths; a custom nonempty list replaces the default `/health` prefix. Native immediate
service-info remains public. CORS handles OPTIONS before authentication.

```ts
import type { AnonymousRequestMatch, AuthenticatorPort } from '@netscript/service/auth';
import { startStreamsService } from '@netscript/plugin-streams/service';

declare const authenticator: AuthenticatorPort;
const anonymousHealth = [
  { method: 'GET', path: '/health' },
  { method: 'HEAD', path: '/health' },
  { method: 'GET', path: '/health/live' },
  { method: 'HEAD', path: '/health/live' },
  { method: 'GET', path: '/health/ready' },
  { method: 'HEAD', path: '/health/ready' },
] satisfies readonly AnonymousRequestMatch[];

if (import.meta.main) {
  const running = await startStreamsService({
    auth: { authn: { authenticator, protect: ['/'], allowAnonymous: anonymousHealth } },
    cors: { origin: ['https://app.example'] },
    serve: { hostname: '127.0.0.1', port: 0 },
  });
  console.log(running.addr);
}
```

Missing, ambiguous and blank-reason policies fail before factory I/O. A deliberate public service
uses `auth: { public: true, reason: 'The existing ingress authenticates this service' }`. A guarded
service returns 401 for missing/wrong credentials and 503 when its verifier is unavailable. Keep
operation authorization in the native authorizer or your existing application policy.

## Origins, listener precedence and lifecycle

`cors` is the native `CorsOptions`. Omitted origins consume `NETSCRIPT_CORS_ORIGINS`; an explicit
origin or origin array takes precedence, including an empty array. Exact allowed origins receive
ACAO, while unrelated, lookalike, opaque `null` and malformed origins receive none. This controls
browser response access; it does not prevent a request from executing or authenticate the caller.

Streams supplies its protocol methods and allowed/exposed headers when those arrays are omitted. An
origin-only override keeps those defaults, including stream/producer sequence and retention headers.
Explicit protocol arrays replace their respective defaults. The existing proxy still repairs
response headers and missing-stream long polls; storage and upstream health are unchanged.

| Option       | Source precedence                                                                   |
| ------------ | ----------------------------------------------------------------------------------- |
| Workers port | `serve.port`, including zero, then `context.env.PORT`, then process `PORT`.         |
| Streams port | `serve.port`, including zero, then `PORT`, then `STREAMS_PORT`.                     |
| Hostname     | Explicit `serve.hostname`; omission retains the native all-interface default.       |
| TLS          | Native `serve.tls`, then the existing native certificate/key file environment pair. |

The returned `running.addr` is the observed listener address. Pass native `signal`,
`drainTimeoutMs`, `handleSignals` and TLS options through `serve`. `running.stop()` drains the
listener; streams also stops its factory-owned upstream. Startup failure attempts upstream cleanup
and preserves the primary error. Streams memory storage is ephemeral; the existing
[`STREAMS_DATA_DIR` contract](/reference/streams/#sub-path-aspire) remains an explicit, probed
opt-in.

## Add an internal caller explicitly

For an installation service identity, compose `createInternalCredentialAuthenticator` into the host
policy with `service: 'workers'` and the provisioned installation-secret handle. Preserve an
existing session/credential authenticator through `createCompositeAuthenticator` when needed. The
host policy selects this adoption; the factory never installs an SDK credential contribution
automatically.

Another backend uses the normal workers service reference and the existing SDK contribution:

```ts
import { workersContract } from '@netscript/plugin-workers/contracts';
import {
  createInternalCredentialSdkClientContribution,
  createServiceClient,
} from '@netscript/sdk/client';

const workers = createServiceClient({
  contract: workersContract,
  serviceName: 'workers',
  contributions: [createInternalCredentialSdkClientContribution({ service: 'workers' })] as const,
});
const description = await workers.describe({});
console.log(description.pluginName);
```

Match the service name on both sides and deliver discovery plus `NETSCRIPT_INSTALLATION_SECRET_FILE`
through the existing backend configuration. Only the file reference belongs in generated topology;
secret bytes and derived credentials stay out of browser configuration, logs and contract payloads.
See [Call internal procedures](/services-sdk/how-to/call-internal-procedures/) for provisioning and
policy composition. If a client already owns `authorization`, retain that contribution and select
its matching server policy; composing two owners is rejected rather than overwriting either.

Protected raw stream readers use their own explicit
[reader headers](/durable-workflows/streams/#caller-provided-reader-headers); the SDK procedure
contribution does not configure their credentials or browser bootstrap.

## Adoption boundary

The factories are additive. Existing plural entrypoints retain their authored public behavior,
workers bootstrap and streams wildcard policy. For the deliberate health/CORS middleware migration,
see [native service ordering](/reference/service/#pipeline-order).

Sagas keeps its current context-taking entrypoint and KV/DB projection selection. Triggers keeps its
current bootstrap and separate HMAC webhook ingress. These caller options currently apply to workers
and streams; they do not migrate process supervision or introduce parameterized raw-route contract
authorization. Continue to use the existing native ports and application authority for those tasks.
