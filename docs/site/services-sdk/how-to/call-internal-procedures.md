---
layout: layouts/base.vto
title: Call internal procedures from a service or worker
templateEngine: [vento, md]
order: 110
---

# Call internal procedures from a service or worker

This recipe exposes a procedure to backend processes in the same installation while the service's
public procedures stay public. Workers, sagas and triggers call it without a browser, phone app or
user session. This installation service identity is separate from enterprise machine identity.

## Use the provisioned file reference

Generate the project's Aspire helpers with `netscript generate aspire`, then start the AppHost. The
generated carrier creates `.data/aspire-secrets/installation.secret` once under the project root,
keeps it across starts, and registers a secret parameter. It delivers
`NETSCRIPT_INSTALLATION_SECRET_FILE` to services, plugin APIs and background processors, with the
Deno read and environment permissions they need. The variable holds the file path, never the secret.
Packaged backends receive the reference from the installation carrier in the same way.

> [!CAUTION]
> Keep the secret file out of source control, browser configuration, command arguments and logs.
> Never copy its value into appsettings or an SDK option.

Load it once when composing the service. Each SDK contribution loads the same file reference once
and derives a bearer for the target service name. Use HTTPS outside loopback; the contribution
refuses non-loopback cleartext HTTP by default. Service discovery must resolve the target from the
caller's backend environment. A worker needs a service reference to `orders`, as does a calling
service; configure `ServiceReferences: ['orders']` on that resource in appsettings.

## Declare the audience in the contract

Save this as `internal-contract.ts` in a backend workspace shared by the service and its callers.
The marker covers both projections, including a procedure with no explicit OpenAPI route.

```ts
import { baseContract, SuccessSchema } from '@netscript/contracts';

export const ordersContract = {
  public: {
    ping: baseContract.route({ method: 'POST', path: '/ping' }).output(SuccessSchema),
  },
  internal: {
    sync: baseContract.meta({ access: { audience: 'internal' } }).output(SuccessSchema),
    reindex: baseContract.route({ method: 'POST', path: '/internal/reindex' })
      .meta({ access: { audience: 'internal' } }).output(SuccessSchema),
  },
};
```

Do not combine `audience: 'internal'` with `authentication: 'none'`; construction rejects that
contradiction. An admin role or a user session does not satisfy the internal audience.

## Compose the explicit service policy

Save this as `internal-service.ts`. The overlay governs access-marked procedures. Unmarked
procedures keep the path policy, so `/api/v1/ping` stays public in this example. For a guarded
service, retain its existing `protect`/`allowAnonymous` policy instead of adding the public `/api`
exception. Pass its session authenticator to the composition below so ordinary session calls still
work.

```ts
import { implement } from '@orpc/server';
import { createService } from '@netscript/service';
import {
  type AuthenticatorPort,
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInternalCredentialAuthenticator,
  loadInstallationSecret,
  type ServiceAuthPolicy,
} from '@netscript/service/auth';
import { ordersContract } from './internal-contract.ts';

export async function createOrdersApp(sessionAuthenticator?: AuthenticatorPort) {
  const secret = await loadInstallationSecret();
  const internalAuthenticator = createInternalCredentialAuthenticator({
    secret,
    service: 'orders',
  });
  const auth = {
    authn: {
      authenticator: createCompositeAuthenticator([
        internalAuthenticator,
        ...(sessionAuthenticator ? [sessionAuthenticator] : []),
      ]),
      allowAnonymous: ['/api', '/health'],
    },
    authz: { authorizer: createContractOverlayAuthorizer(ordersContract) },
  } satisfies ServiceAuthPolicy;
  const implemented = implement(ordersContract);
  const router = implemented.router({
    public: { ping: implemented.public.ping.handler(() => ({ success: true })) },
    internal: {
      sync: implemented.internal.sync.handler(() => ({ success: true })),
      reindex: implemented.internal.reindex.handler(() => ({ success: true })),
    },
  });
  return createService(router, { name: 'orders' })
    .withRPC({ rpcPath: '/api/rpc/v1/orders', apiPath: '/api/v1' })
    .withAuthn(auth.authn)
    .withAuthz(auth.authz);
}
```

At the service entrypoint, call `await (await createOrdersApp()).serve({ port: 3001 })` and let the
supervisor own the returned listener. The same `auth` object is the guarded arm of
`ServiceAuthPolicy` accepted by `defineService(router, { name: 'orders', auth })`. Do not use
`auth: { public: true, reason: '...' }` for a service containing internal procedures: that posture
opts out of authentication and authorization. Do not protect only `/api/rpc`; the OpenAPI projection
must use the same overlay.

## Call from another backend

Save this as `internal-client.ts`. Create the client once in the calling service or background
runtime's composition root, then invoke it from a job, saga step or trigger handler. The
contribution supplies the bearer; no app session or per-request secret read is needed.

```ts
import {
  createInternalCredentialSdkClientContribution,
  createServiceClient,
} from '@netscript/sdk/client';
import { ordersContract } from './internal-contract.ts';

export function createOrdersClient() {
  return createServiceClient({
    contract: ordersContract,
    serviceName: 'orders',
    contributions: [
      createInternalCredentialSdkClientContribution({ service: 'orders' }),
    ] as const,
  });
}
```

In the backend handler, call `await orders.internal.sync({})` on the client returned by
`createOrdersClient()`. Keep it server-side. The contribution owns `authorization` and uses
`direct-only` response caching; do not combine it with another contribution that owns that header.
Procedures explicitly declaring `authentication: 'none'` receive no internal credential.

## Verify both projections

Both projections must give the same answers. For `sync` (default OpenAPI path) and `reindex`
(explicit OpenAPI route), expect:

| Caller                                             | RPC `/api/rpc/v1/orders/internal/<procedure>` | OpenAPI `/api/v1/internal/<procedure>` |
| -------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| Anonymous                                          | 401                                           | 401                                    |
| Wrong installation or target-service credential    | 401                                           | 401                                    |
| Valid user session, even with service roles        | 403                                           | 403                                    |
| Valid installation credential for `orders`         | 200                                           | 200                                    |
| Old credential after restart with rotated material | 401                                           | 401                                    |

An OpenAPI URL is not a bypass: it accepts the same internal service identity and refuses anonymous
or session callers. RPC POST bodies use `{"json":{}}`; OpenAPI POST bodies use `{}`. Public `ping`
stays callable anonymously on both projections.

From a NetScript framework checkout, this test generates the credential helper and resource
registrations, writes the three snippets above into a generated project, and checks the table
against a loopback HTTP listener:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/installation-provisioning_test.ts
```

It does not start the AppHost, so it does not cover Aspire resource startup or service discovery.

## Rotate the installation credential

Stop the AppHost and all packaged backend processes that share the installation. Replace the secret
file with fresh cryptographically random textual material (at least 32 bytes, at most 4 KiB),
keeping restrictive permissions and the same reference path. For a generated local project, remove
only `.data/aspire-secrets/installation.secret` while stopped and let the next AppHost startup
provision fresh material. Do not delete the whole secrets directory.

Restart every service, plugin API, worker, saga and trigger sharing the installation. Services
retain the loaded secret and SDK contributions retain their derived bearer; rewriting a file alone
does not rotate running instances. Recreate caller clients as part of restart. Verify a fresh
backend call succeeds and a retained old bearer is refused on both projections, without printing
either credential. Rotation invalidates credentials for every service derived from that
installation; it is not a per-user signout operation.

## Next steps

Wire the caller's service reference with [Discover services](/services-sdk/how-to/discover-services/).
See also [Service-layer authn / authz middleware](/services-sdk/services/#service-layer-authn-authz-middleware)
and the [`@netscript/service` reference](/reference/service/).
